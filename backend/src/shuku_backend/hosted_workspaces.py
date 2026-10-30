"""App-owned private branches; task checkpoints retain remote ownership and retries."""
import base64
from datetime import datetime,timezone
from urllib.parse import quote
from uuid import uuid4
from .database import JsonValue
from .errors import require
from .adapters.github import GitHubError,blob_sha
from .workers import DeferredTask

NAME='co-creation-workspaces'
MARKER='[shuku-co-creation-workspaces:v1]'


class HostedWorkspaces:
    def __init__(self,github):
        self.github=github;self.flow=github.flow;self.store=github.store;self.clock=github.clock

    def enabled(self):
        return bool(self.github.client and self.github.config.get('owner') and self.github.config.get('installationId'))

    def queue_in(self,db,wid,rid):
        if not self.enabled() or not db.execute('SELECT 1 FROM shuku_workspaces WHERE id=%s AND deleted_at IS NULL',(wid,)).fetchone():return None
        key='hosted:'+str(rid);now=self.clock()
        db.insert_once("INSERT INTO shuku_tasks(id,kind,resource_key,idempotency_key,request_hash,payload,available_at,created_at) VALUES (%s,'github.workspace',%s,%s,%s,%s,%s,%s)",(uuid4(),'course:'+str(wid),key,key,JsonValue({'workspace_id':str(wid),'revision_id':str(rid)}),now+.25,now))
        return db.execute('SELECT * FROM shuku_tasks WHERE idempotency_key=%s',(key,)).fetchone()

    def status_in(self,db,wid):
        w=db.execute('SELECT owner_id FROM shuku_workspaces WHERE id=%s',(wid,)).fetchone()
        if not w:return None
        jobs=db.execute("SELECT id,kind,status,checkpoint,error_code,result FROM shuku_tasks WHERE kind='github.workspace' AND resource_key=%s ORDER BY created_at DESC,id DESC LIMIT 30",('course:'+str(wid),)).fetchall()
        return {'enabled':bool(self.github.client),'hosting':'private-workspace','repository':{'owner':self.github.config.get('owner',''),'name':NAME,'branch':str(w['owner_id'])+'/'+str(wid),'private':True},'jobs':[{k:v for k,v in j.items() if k!='result'} for j in jobs],'external_prs':[]}

    def retry(self,db,wid,tid):
        row=db.execute("SELECT id FROM shuku_tasks WHERE id=%s AND kind='github.workspace' AND resource_key=%s",(tid,'course:'+str(wid))).fetchone()
        if not row:return False
        db.execute("UPDATE shuku_tasks SET status='queued',attempts=0,error_code=NULL,available_at=%s WHERE id=%s AND status='failed'",(self.clock(),tid))
        return True

    def repository(self,save):
        require(self.enabled(),503,'GITHUB_NOT_CONFIGURED','请先配置组织 GitHub App。')
        owner=self.github.config['owner'];installation=int(self.github.config['installationId']);client=self.github.client
        def api(method,path,data=None,missing=False):
            save(stage='preparing-private-workspace')
            return client.installation_call(installation,method,path,data,missing)
        path='/repos/'+owner+'/'+NAME
        remote=api('GET',path,missing=True)
        if not remote:
            try:remote=api('POST','/orgs/'+owner+'/repos',{'name':NAME,'description':MARKER,'private':True,'auto_init':True})
            except GitHubError as error:
                if error.status!=422:raise
                remote=api('GET',path)
        require(remote and remote['owner']['login'].lower()==owner.lower() and remote['name']==NAME and remote['private'] is True and remote.get('description')==MARKER and not remote.get('archived') and not remote.get('disabled'),409,'WORKSPACE_REPOSITORY_CHANGED','私有共创仓库的身份或可见性已变化。')
        repo={'owner':owner,'name':NAME,'repository_id':remote['id'],'installation_id':installation,'default_branch':remote.get('default_branch') or 'main'}
        save(repository_id=remote['id'])
        return repo

    def run(self,task,checkpoint):
        wid=task['payload']['workspace_id'];rid=task['payload']['revision_id'];state=dict(task.get('checkpoint') or {})
        def save(**values):
            require(not values.get('repository_id') or not state.get('repository_id') or values['repository_id']==state['repository_id'],409,'WORKSPACE_REPOSITORY_CHANGED','私有仓库 ID 已变化。')
            state.update(values);checkpoint(dict(state))
        with self.store.transaction() as db:
            w=db.execute('SELECT w.*,c.deleting,t.deleting AS target_deleting FROM shuku_workspaces w JOIN shuku_courses c ON c.id=w.id JOIN shuku_courses t ON t.id=w.target_course_id WHERE w.id=%s',(wid,)).fetchone()
            require(w and not w['deleted_at'] and not w['deleting'] and not w['target_deleting'],409,'RESOURCE_REMOVED','共创工作区正在删除。')
            revision=db.execute('SELECT * FROM shuku_revisions WHERE id=%s AND course_id=%s',(rid,wid)).fetchone()
            require(revision,409,'RESOURCE_REMOVED','共创修订已移除。')
            require(revision['state']!='failed',409,'REVISION_FAILED','请修复预览后重新保存。')
            if revision['state']!='ready':raise DeferredTask()
            prior=db.execute("SELECT result FROM shuku_tasks WHERE kind='github.workspace' AND resource_key=%s AND status='succeeded' AND id<>%s ORDER BY created_at DESC,id DESC LIMIT 1",('course:'+wid,task['id'])).fetchone()
        branch=str(w['owner_id'])+'/'+wid
        require(state.get('branch',branch)==branch,409,'WORKSPACE_BRANCH_CHANGED','工作区分支归属不匹配。')
        save(branch=branch,stage='preparing-private-workspace')
        repo=self.repository(save);client=self.github.client
        if prior:require(prior['result']['repository_id']==repo['repository_id'],409,'WORKSPACE_REPOSITORY_CHANGED','私有工作区仓库已更换。')
        def call(method,path,data=None,missing=False):
            save(stage=state.get('stage','syncing-private-workspace'))
            return client.call(repo,method,path,data,missing)
        ref_path='/git/ref/heads/'+quote(branch,safe='')
        ref=call('GET',ref_path,missing=True)
        if not state.get('parent_sha'):
            if prior:
                expected=prior['result']['commit_sha'];require(ref and ref['object']['sha']==expected,409,'WORKSPACE_BRANCH_CHANGED','工作区分支存在未同步修改，请勿覆盖。')
            elif ref:
                require(state.get('seed_sha')==ref['object']['sha'],409,'UNOWNED_BRANCH','同名分支无法确认归属。');expected=state['seed_sha']
            else:
                main='/git/ref/heads/'+quote(repo['default_branch'],safe='')
                try:seed=call('GET',main,missing=True)
                except GitHubError as error:
                    if error.status!=409:raise
                    seed=None
                if not seed:
                    try:call('PUT','/contents/README.md',{'message':'Prepare private co-creation workspaces','branch':repo['default_branch'],'content':base64.b64encode(b'Private Shuku co-creation workspaces.\n').decode()})
                    except GitHubError as error:
                        if error.status!=422:raise
                    seed=call('GET',main)
                expected=seed['object']['sha'];save(seed_sha=expected)
                try:call('POST','/git/refs',{'ref':'refs/heads/'+branch,'sha':expected})
                except GitHubError as error:
                    if error.status!=422:raise
                ref=call('GET',ref_path)
                require(ref['object']['sha']==expected,409,'WORKSPACE_BRANCH_CHANGED','私有分支已被其他任务占用。')
            save(parent_sha=expected)
        parent=state['parent_sha']
        if state.get('commit_sha') and ref and ref['object']['sha']==state['commit_sha']:
            return {'repository_id':repo['repository_id'],'branch':branch,'commit_sha':state['commit_sha'],'revision_id':rid}
        require(ref and ref['object']['sha']==parent,409,'WORKSPACE_BRANCH_CHANGED','私有分支已被外部修改。')
        if not state.get('commit_sha'):
            save(stage='comparing-files')
            commit=call('GET','/git/commits/'+parent);tree=call('GET','/git/trees/'+commit['tree']['sha']+'?recursive=1')
            require(not tree.get('truncated'),409,'TREE_TOO_LARGE','私有工作区文件树过大。')
            existing={v['path']:v for v in tree['tree'] if v['path'].startswith('courses/') and v['type']=='blob'}
            require(not any(v.get('mode') in ('120000','160000') for v in tree['tree'] if v['path']=='courses' or v['path'].startswith('courses/')),409,'UNSAFE_TREE','课程目录不能包含链接或子模块。')
            desired=self.github.export(revision);blobs=state.get('blobs',{});entries=[]
            for path,content in sorted(desired.items()):
                sha=blob_sha(content)
                if existing.get(path,{}).get('sha')==sha:continue
                if blobs.get(path)!=sha:
                    uploaded=call('POST','/git/blobs',{'content':base64.b64encode(content).decode(),'encoding':'base64'});require(uploaded['sha']==sha,409,'BLOB_MISMATCH','私有课程文件校验不匹配。')
                    blobs[path]=sha;save(stage='uploading-workspace-changes',blobs=blobs,uploaded=len(blobs))
                entries.append({'path':path,'mode':'100644','type':'blob','sha':sha})
            entries.extend({'path':p,'mode':v['mode'],'type':'blob','sha':None} for p,v in existing.items() if p not in desired)
            updated=call('POST','/git/trees',{'base_tree':commit['tree']['sha'],'tree':entries}) if entries else commit['tree']
            stamp=datetime.fromtimestamp(revision['created_at'],timezone.utc).isoformat();identity={'name':'Shuku','email':'shuku@users.noreply.github.com','date':stamp}
            new=call('POST','/git/commits',{'message':'Shuku private revision '+rid,'tree':updated['sha'],'parents':[parent],'author':identity,'committer':identity})
            save(commit_sha=new['sha'])
        save(stage='updating-private-branch')
        call('PATCH','/git/refs/heads/'+quote(branch,safe=''),{'sha':state['commit_sha'],'force':False})
        verified=call('GET',ref_path);require(verified['object']['sha']==state['commit_sha'],409,'SYNC_UNCONFIRMED','尚未确认私有分支同步。')
        save(stage='complete')
        return {'repository_id':repo['repository_id'],'branch':branch,'commit_sha':state['commit_sha'],'revision_id':rid}

    def remove(self,task,checkpoint):
        with self.store.transaction() as db:
            removal=db.execute('SELECT * FROM shuku_removals WHERE id=%s',(task['payload']['removal_id'],)).fetchone()
            if not removal or removal['state']!='queued':return
            workspaces=db.execute('SELECT id,owner_id FROM shuku_workspaces WHERE id IN %s',(removal['resource_ids'],)).fetchall()
            records=[]
            for w in workspaces:
                key='course:'+str(w['id'])
                jobs=db.execute("SELECT result,checkpoint FROM shuku_tasks WHERE kind='github.workspace' AND resource_key=%s",(key,)).fetchall()
                if not jobs:continue
                if db.execute('SELECT 1 FROM shuku_task_leases WHERE resource_key=%s AND task_id<>%s AND expires_at>%s',(key,task['id'],self.clock())).fetchone():raise DeferredTask()
                records.append((w,jobs))
        if not records:return
        owner=self.github.config.get('owner');installation=int(self.github.config.get('installationId',0));require(self.enabled(),503,'GITHUB_NOT_CONFIGURED','删除私有分支需要组织 GitHub App。')
        remote=self.github.client.installation_call(installation,'GET','/repos/'+owner+'/'+NAME,missing=True)
        if remote is None:return
        require(remote['private'] is True and remote.get('description')==MARKER and remote['owner']['login'].lower()==owner.lower() and remote['name']==NAME,409,'WORKSPACE_REPOSITORY_CHANGED','共享私有仓库身份已变化。')
        repo={'owner':owner,'name':NAME,'repository_id':remote['id'],'installation_id':installation}
        for w,jobs in records:
            branch=str(w['owner_id'])+'/'+str(w['id']);trusted=set();repo_ids=set()
            for job in jobs:
                for info in (job.get('result') or {},job.get('checkpoint') or {}):
                    if info.get('branch')==branch:
                        trusted.update(info[k] for k in ('commit_sha','parent_sha','seed_sha') if info.get(k))
                        if info.get('repository_id'):repo_ids.add(info['repository_id'])
            require(not repo_ids or repo_ids=={repo['repository_id']},409,'WORKSPACE_REPOSITORY_CHANGED','共享仓库 ID 已变化。')
            suffix='/git/ref/heads/'+quote(branch,safe='');checkpoint({'stage':'removing-private-workspace-branch'})
            ref=self.github.client.call(repo,'GET',suffix,missing=True)
            if not ref:continue
            require(ref['object']['sha'] in trusted,409,'WORKSPACE_BRANCH_CHANGED','私有分支已被外部修改，未删除。')
            self.github.client.call(repo,'DELETE','/git/refs/heads/'+quote(branch,safe=''))
            require(self.github.client.call(repo,'GET',suffix,missing=True) is None,409,'DELETE_UNCONFIRMED','尚未确认私有分支删除。')
