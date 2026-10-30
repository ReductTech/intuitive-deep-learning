"""Agent-proposed repository names; mutations are serialized by the existing task queue."""
import json
import re
from uuid import uuid4
from .errors import require
from .adapters.github import GitHubError


def repository_name(value):
    require(isinstance(value,str),400,'INVALID_REPOSITORY_NAME','请填写英文仓库名称。')
    name=value.strip().lower()
    require(1<=len(name)<=80 and re.fullmatch(r'[a-z][a-z0-9]*(?:-[a-z0-9]+)*',name),400,'INVALID_REPOSITORY_NAME','仓库名称使用小写英文字母、数字和连字符，以字母开头，最长 80 个字符。')
    return name


class RepositoryNames:
    def __init__(self,sync):self.sync=sync;self.store=sync.store;self.flow=sync.flow

    def editable(self,repo):
        return bool(repo and self.sync.client and repo['allow_destroy'] and self.sync.config.get('installationId') and repo['owner'].lower()==self.sync.config.get('owner','').lower())

    def context(self,uid,cid):
        with self.store.transaction() as db:
            course,_=self.flow.owner(db,uid,cid);repo=self.sync.repo(db,cid)
            require(self.editable(repo),409,'REPOSITORY_NAME_UNAVAILABLE','此课程没有可改名的独立仓库，请等待仓库准备完成。')
            return course,repo

    def info(self,uid,cid):
        course,repo=self.context(uid,cid);suggested=''
        if course['head_revision']:
            with self.store.transaction() as db:row=db.execute('SELECT files FROM shuku_revisions WHERE id=%s',(course['head_revision'],)).fetchone()
            project=json.loads(self.flow.bucket.read(row['files']['project.json']['sha256']))
            suggested=project.get('repositoryName','')
        return {'name':repo['name'],'suggested_name':repo['name'] if course['current_release'] else suggested,'owner':repo['owner'],'can_rename':bool(course['current_release'])}

    def available(self,repo,name,checkpoint=lambda **kw:None):
        if name.lower()==repo['name'].lower():return True
        checkpoint(stage='checking-repository-name')
        try:
            remote=self.sync.client.installation_call(repo['installation_id'],'GET',f"/repos/{repo['owner']}/{name}",missing=True)
        except GitHubError:
            require(False,503,'REPOSITORY_NAME_CHECK_FAILED','暂时无法检查仓库名称，请稍后重试。')
        checkpoint(stage='checking-repository-name')
        return remote is None or remote['id']==repo['repository_id']

    def check(self,uid,cid,data):
        require(isinstance(data,dict) and set(data)=={'name'},400,'INVALID_INPUT','请仅提供仓库名称。')
        _,repo=self.context(uid,cid);name=repository_name(data['name'])
        available=self.available(repo,name)
        return {'name':name,'available':available,'message':'名称可用' if available else '该名称已被其他仓库占用，请换一个名称。'}

    def remember(self,repo,remote):
        require(remote and remote['id']==repo['repository_id'] and remote['owner']['login'].lower()==repo['owner'].lower(),409,'REPOSITORY_CHANGED','仓库身份或所属组织发生变化，请联系管理员。')
        name=remote['name']
        with self.store.transaction() as db:
            row=self.sync.repo(db,str(repo['course_id']))
            require(row and row['repository_id']==repo['repository_id'],409,'REPOSITORY_CHANGED','仓库关联已发生变化。')
            db.execute('UPDATE shuku_github_repositories SET name=%s WHERE course_id=%s AND repository_id=%s',(name,repo['course_id'],repo['repository_id']))
        repo['name']=name
        return remote

    def recover(self,repo,checkpoint):
        checkpoint(stage='checking-repository-identity')
        remote=self.sync.client.installation_call(repo['installation_id'],'GET',f"/repositories/{repo['repository_id']}")
        return self.remember(repo,remote)

    def rename(self,repo,name,checkpoint):
        require(self.editable(repo),409,'REPOSITORY_NAME_UNAVAILABLE','共享课程库和私有共创工作区不能按单门课程改名。')
        name=repository_name(name)
        if repo['name'].lower()==name:return
        require(self.available(repo,name,checkpoint),409,'REPOSITORY_NAME_TAKEN','该英文名称已被占用，请更换名称后重试。')
        checkpoint(stage='renaming-repository')
        try:remote=self.sync.client.call(repo,'PATCH','',{'name':name})
        except GitHubError as error:
            if error.status in (409,422):require(False,409,'REPOSITORY_NAME_TAKEN','仓库改名未成功，名称可能已被占用，请重新检查后重试。')
            raise
        require(remote.get('name','').lower()==name,409,'REPOSITORY_NAME_UNCONFIRMED','GitHub 尚未确认仓库名称。')
        self.remember(repo,remote)
        checkpoint(stage='verifying-repository-name')
        verified=self.sync.client.call(repo,'GET')
        require(verified['id']==repo['repository_id'] and verified['name'].lower()==name,409,'REPOSITORY_NAME_UNCONFIRMED','GitHub 尚未确认仓库名称。')

    def request(self,uid,cid,data):
        require(isinstance(data,dict) and set(data)=={'name','expected_name'},400,'INVALID_INPUT','请提供新名称和当前名称。')
        course,repo=self.context(uid,cid);name=repository_name(data['name'])
        require(course['current_release'],409,'PUBLISH_FIRST','请在发布课程时确认英文仓库名称。')
        require(data['expected_name']==repo['name'],409,'REPOSITORY_NAME_CHANGED','仓库名称已更新，请刷新后重试。')
        if name==repo['name']:return {'unchanged':True,'name':name}
        require(self.available(repo,name),409,'REPOSITORY_NAME_TAKEN','该名称已被其他仓库占用，请更换。')
        with self.store.transaction() as db:
            self.flow.owner(db,uid,cid);current=self.sync.repo(db,cid)
            require(current and current['name']==data['expected_name'],409,'REPOSITORY_NAME_CHANGED','仓库名称已更新，请刷新后重试。')
            busy=db.execute("SELECT 1 FROM shuku_github_jobs j JOIN shuku_tasks t ON t.id=j.task_id WHERE j.course_id=%s AND j.kind IN ('rename','release') AND t.status IN ('queued','running')",(cid,)).fetchone()
            require(not busy,409,'REPOSITORY_NAME_BUSY','课程正在发布或改名，请完成后再操作。')
            jid=self.sync.queue(db,cid,'rename',str(uuid4()),{'name':name},uid)
            self.flow.audit(db,uid,'github.rename.request',cid)
            return {'job_id':jid,'pending':True,'name':name}
