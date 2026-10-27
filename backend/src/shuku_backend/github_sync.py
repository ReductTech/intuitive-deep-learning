"""Durable GitHub effects. Local approvals remain authoritative; remote facts gate completion."""
import base64
import hashlib
import hmac
import json
import re
import threading
from datetime import datetime, timezone
from urllib.parse import quote, urlencode
from uuid import uuid4, UUID
from shuku_backend.database import JsonValue
from .adapters.github import GitHub, GitHubError, blob_sha
from .errors import require
from .storage import course_view
from .workflow import identifier
from .workers import DeferredTask
from .collaboration import teaching
from .hosted_workspaces import HostedWorkspaces


class GitHubSync:
    def __init__(self,flow,config=None,client=None):
        self.flow=flow;self.store=flow.store;self.clock=flow.clock;self.bucket=flow.bucket
        self.config=config or {};self.client=client or (GitHub(config['appId'],config['privateKeyPath'],self.clock) if config else None)
        self.stop=threading.Event();self.thread=None;self.hosted=HostedWorkspaces(self)

    def repo(self,db,cid):
        return db.execute('SELECT * FROM shuku_github_repositories WHERE course_id=%s',(cid,)).fetchone()

    def queue(self,db,cid,kind,subject,payload,uid):
        if not self.repo(db,cid):return None
        require(self.client,503,'GITHUB_NOT_CONFIGURED','请先配置 GitHub App。')
        old=db.execute('SELECT id FROM shuku_github_jobs WHERE course_id=%s AND kind=%s AND subject=%s',(cid,kind,subject)).fetchone()
        if old:return str(old['id'])
        jid=str(uuid4());tid=str(uuid4());now=self.clock()
        db.execute("INSERT INTO shuku_tasks(id,kind,resource_key,idempotency_key,request_hash,payload,available_at,created_at) VALUES (%s,'github.sync',%s,%s,%s,%s,%s,%s)",(tid,'course:'+str(cid),'github:'+jid,jid,JsonValue({'job_id':jid}),now,now))
        db.execute('INSERT INTO shuku_github_jobs VALUES (%s,%s,%s,%s,%s,%s,%s,%s)',(jid,cid,kind,subject,JsonValue(payload),tid,uid,now))
        return jid

    def bind(self,uid,cid,data):
        require(set(data)=={'repository_id','owner','name','installation_id','allow_destroy'},400,'INVALID_INPUT','仓库配置不完整。')
        require(self.client,503,'GITHUB_NOT_CONFIGURED','请先配置 GitHub App。')
        require(type(data['repository_id']) is int and data['repository_id']>0 and type(data['installation_id']) is int and data['installation_id']>0 and type(data['allow_destroy']) is bool,400,'INVALID_INPUT','仓库 ID 或安装 ID 不正确。')
        require(all(isinstance(data[k],str) and re.fullmatch(r'[A-Za-z0-9_.-]{1,100}',data[k]) and data[k] not in ('.','..') for k in ('owner','name')),400,'INVALID_INPUT','仓库名称不正确。')
        with self.store.transaction() as db:
            self.flow.governance.admin(db,uid);course,_=self.flow.owner(db,uid,cid)
            require(not course['current_release'] and not self.repo(db,cid) and not db.execute('SELECT 1 FROM shuku_workspaces WHERE id=%s',(cid,)).fetchone(),409,'BIND_BEFORE_RELEASE','请在首次发布前绑定独立课程仓库。')
        repo={**data};remote=self.client.call(repo,'GET')
        require(remote['id']==repo['repository_id'] and remote['full_name'].lower()==(repo['owner']+'/'+repo['name']).lower(),409,'REPOSITORY_CHANGED','仓库身份不匹配。')
        branch=remote['default_branch'];head=self.client.call(repo,'GET','/git/ref/heads/'+quote(branch,safe=''))['object']['sha']
        with self.store.transaction() as db:
            self.flow.governance.admin(db,uid);course,_=self.flow.owner(db,uid,cid)
            require(not course['current_release'] and not self.repo(db,cid),409,'BIND_BEFORE_RELEASE','仓库已绑定或课程已发布。')
            db.execute('INSERT INTO shuku_github_repositories VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)',(cid,repo['installation_id'],repo['repository_id'],remote['owner']['login'],remote['name'],branch,head,data['allow_destroy'],self.clock()))
            self.flow.audit(db,uid,'github.bind',cid)
        return {'connected':True,'repository':remote['full_name']}

    def status(self,uid,cid):
        with self.store.transaction() as db:
            self.flow.owner(db,uid,cid)
            hosted=self.hosted.status_in(db,cid)
            if hosted:return hosted
            repo=self.repo(db,cid)
            jobs=db.execute("SELECT j.id,j.kind,j.subject,t.status,t.checkpoint,t.error_code FROM shuku_github_jobs j JOIN shuku_tasks t ON t.id=j.task_id WHERE j.course_id=%s ORDER BY j.created_at DESC LIMIT 30",(cid,)).fetchall()
            external=db.execute('SELECT * FROM shuku_github_external_prs WHERE course_id=%s ORDER BY updated_at DESC LIMIT 100',(cid,)).fetchall()
            provisioning=db.execute("SELECT id,kind,status,checkpoint,error_code FROM shuku_tasks WHERE resource_key=%s AND kind='github.provision' ORDER BY created_at DESC LIMIT 1",('course:'+cid,)).fetchall()
            return {'enabled':bool(self.client),'repository':{'owner':repo['owner'],'name':repo['name']} if repo else None,'jobs':[course_view(j) for j in jobs]+[course_view(j) for j in provisioning],'external_prs':[course_view(p) for p in external]}

    def provision_request(self,uid,cid):
        require(self.client,503,'GITHUB_NOT_CONFIGURED','请先配置 GitHub App。')
        with self.store.transaction() as db:
            course,_=self.flow.owner(db,uid,cid)
            require(not course['current_release'] and not db.execute('SELECT 1 FROM shuku_workspaces WHERE id=%s',(cid,)).fetchone(),409,'BIND_BEFORE_RELEASE','请在首次发布前连接仓库。')
            if self.repo(db,cid):return {'connected':True}
            self.provision_in(db,cid)
        return {'pending':True}

    def provision_in(self,db,cid):
        now=self.clock();key='github-provision:'+str(cid)
        db.insert_once("INSERT INTO shuku_tasks(id,kind,resource_key,idempotency_key,request_hash,payload,available_at,created_at) VALUES (%s,'github.provision',%s,%s,%s,%s,%s,%s)",(uuid4(),'course:'+str(cid),key,key,JsonValue({'course_id':str(cid)}),now,now))

    def provision(self,task,checkpoint):
        cid=task['payload']['course_id']
        with self.store.transaction() as db:
            course=db.execute('SELECT * FROM shuku_courses WHERE id=%s',(cid,)).fetchone()
            require(course and not course['deleting'] and not course['current_release'],409,'RESOURCE_CHANGED','课程已变化。')
            if self.repo(db,cid):return {'connected':True}
        owner=self.config.get('owner');installation=int(self.config.get('installationId',0))
        require(owner and re.fullmatch('[A-Za-z0-9_.-]+',owner) and installation>0,503,'GITHUB_NOT_CONFIGURED','需要组织及安装配置。')
        name='course-'+cid;marker='Shuku course '+cid
        def call(method,path,data=None,missing=False):
            checkpoint({'stage':'creating-private-repository'})
            return self.client.installation_call(installation,method,path,data,missing)
        repo=call('GET',f'/repos/{owner}/{name}',missing=True)
        if not repo:repo=call('POST',f'/orgs/{owner}/repos',{'name':name,'description':marker,'private':True,'auto_init':True})
        require(repo['private'] and repo.get('description')==marker and repo['owner']['login'].lower()==owner.lower(),409,'REPOSITORY_EXISTS','同名仓库不属于本课程。')
        head=call('GET',f"/repos/{owner}/{name}/git/ref/heads/"+quote(repo['default_branch'],safe=''))['object']['sha']
        with self.store.transaction() as db:
            course=db.execute('SELECT * FROM shuku_courses WHERE id=%s FOR UPDATE',(cid,)).fetchone()
            require(course,409,'RESOURCE_REMOVED','课程已移除。')
            db.insert_once('INSERT INTO shuku_github_repositories VALUES (%s,%s,%s,%s,%s,%s,%s,true,%s)',(cid,installation,repo['id'],owner,name,repo['default_branch'],head,self.clock()))
        return {'connected':True}

    def retry(self,uid,cid,jid):
        with self.store.transaction() as db:
            self.flow.owner(db,uid,cid)
            if self.hosted.retry(db,cid,jid):
                self.flow.audit(db,uid,'github.retry',jid);return {'id':jid}
            j=db.execute('SELECT * FROM shuku_github_jobs WHERE id=%s AND course_id=%s',(identifier(jid),cid)).fetchone()
            if not j:
                provisioning=db.execute("SELECT id AS task_id FROM shuku_tasks WHERE id=%s AND resource_key=%s AND kind='github.provision'",(jid,'course:'+cid)).fetchone()
                require(provisioning,404,'NOT_FOUND','同步任务不存在。');j=provisioning
            db.execute("UPDATE shuku_tasks SET status='queued',attempts=0,error_code=NULL,available_at=%s WHERE id=%s AND status='failed'",(self.clock(),j['task_id']))
            self.flow.audit(db,uid,'github.retry',jid)
            return {'id':jid}

    def webhook(self,headers,raw):
        secret=self.config.get('webhookSecret','')
        require(secret,503,'GITHUB_NOT_CONFIGURED','Webhook 尚未配置。')
        expected='sha256='+hmac.new(secret.encode(),raw,hashlib.sha256).hexdigest()
        require(hmac.compare_digest(expected,headers.get('X-Hub-Signature-256','')),403,'INVALID_SIGNATURE','Webhook 签名不正确。')
        try:delivery=str(UUID(headers.get('X-GitHub-Delivery','')));body=json.loads(raw)
        except (ValueError,TypeError):require(False,400,'INVALID_INPUT','Webhook 格式不正确。')
        require(isinstance(body,dict),400,'INVALID_INPUT','Webhook 格式不正确。')
        event=headers.get('X-GitHub-Event','');digest=hashlib.sha256(raw).hexdigest()
        repo_id=body.get('repository',{}).get('id');installation=body.get('installation',{}).get('id')
        with self.store.transaction() as db:
            previous=db.execute('SELECT digest FROM shuku_github_deliveries WHERE delivery_id=%s',(delivery,)).fetchone()
            if previous:
                require(previous['digest']==digest,409,'DELIVERY_CONFLICT','投递标识已被使用。');return {'accepted':True}
            repo=db.execute('SELECT * FROM shuku_github_repositories WHERE repository_id=%s AND installation_id=%s',(repo_id,installation)).fetchone() if type(repo_id) is int and type(installation) is int else None
            inserted=db.insert_once('INSERT INTO shuku_github_deliveries VALUES (%s,%s,%s,%s,%s)',(delivery,digest,event[:80],repo['course_id'] if repo else None,self.clock()))
            if not inserted:
                previous=db.execute('SELECT digest FROM shuku_github_deliveries WHERE delivery_id=%s',(delivery,)).fetchone()
                require(previous['digest']==digest,409,'DELIVERY_CONFLICT','投递标识已被使用。');return {'accepted':True}
            if repo and event in ('pull_request','push','release','issues','repository'):
                owner=db.execute('SELECT owner_id FROM shuku_courses WHERE id=%s',(repo['course_id'],)).fetchone()['owner_id']
                self.queue(db,repo['course_id'],'reconcile',delivery,{},owner)
        return {'accepted':True}

    def export(self,revision):
        files=revision['files'];project=teaching(json.loads(self.bucket.read(files['project.json']['sha256'])))
        result={'courses/project.json':json.dumps(project,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()}
        for name,obj in files.items():
            if name=='project.json' or name.startswith(('images/','materials/')):continue
            require(not name.startswith('/') and '..' not in name.split('/') and '\\' not in name,400,'UNSAFE_PATH','资源路径不正确。')
            result['courses/'+name]=self.bucket.read(obj['sha256'])
        return result

    def revision_base(self,db,repo,rid):
        contribution=db.execute('SELECT w.base_release_id FROM shuku_contributions k JOIN shuku_workspaces w ON w.id=k.workspace_id WHERE k.revision_id=%s',(rid,)).fetchone()
        base=db.execute('SELECT current_release FROM shuku_courses WHERE id=%s',(repo['course_id'],)).fetchone()['current_release']
        if contribution:base=contribution['base_release_id']
        if not base:return repo['initial_sha']
        row=db.execute('SELECT g.merge_sha FROM shuku_releases l JOIN shuku_github_revisions g ON g.revision_id=l.revision_id WHERE l.id=%s',(base,)).fetchone()
        require(row and row['merge_sha'],409,'REMOTE_BASE_UNMAPPED','基础版本没有对应的 GitHub 提交。')
        return row['merge_sha']

    def pull(self,repo,rid,call,state,save):
        with self.store.transaction() as db:
            candidate=db.execute('SELECT course_id FROM shuku_revisions WHERE id=%s',(rid,)).fetchone()
            hosted=self.hosted.queue_in(db,str(candidate['course_id']),rid) if candidate else None
        if hosted and hosted['status']!='succeeded':
            require(hosted['status']!='failed',409,'WORKSPACE_SYNC_FAILED','私有工作区同步失败，请重试同步。')
            save(stage='waiting-private-workspace');raise DeferredTask()
        with self.store.transaction() as db:
            revision=db.execute('SELECT r.* FROM shuku_revisions r JOIN shuku_courses c ON c.id=r.course_id WHERE r.id=%s AND NOT c.deleting',(rid,)).fetchone()
            require(revision and revision['state']=='ready',409,'NOT_READY','修订尚未就绪。')
            mapping=db.execute('SELECT * FROM shuku_github_revisions WHERE revision_id=%s',(rid,)).fetchone()
            if not mapping:
                base=self.revision_base(db,repo,rid);branch=f"shuku-review/{repo['course_id']}/{rid}"
                db.execute('INSERT INTO shuku_github_revisions(revision_id,course_id,base_sha,branch) VALUES (%s,%s,%s,%s)',(rid,repo['course_id'],base,branch))
                mapping={'base_sha':base,'branch':branch,'commit_sha':None,'pr_number':None}
        base=mapping['base_sha'];branch=mapping['branch']
        if mapping['pr_number']:
            pr=call('GET','/pulls/'+str(mapping['pr_number']));self.check_pr(repo,mapping,pr)
            return mapping
        desired=self.export(revision)
        if not mapping['commit_sha']:
            save(stage='comparing-files')
            commit=call('GET','/git/commits/'+base)
            tree=call('GET','/git/trees/'+commit['tree']['sha']+'?recursive=1')
            require(not tree.get('truncated'),409,'TREE_TOO_LARGE','仓库文件树过大。')
            existing={v['path']:v for v in tree['tree'] if v['path'].startswith('courses/') and v['type']=='blob'}
            require(not any(v.get('mode') in ('120000','160000') for v in tree['tree'] if v['path']=='courses' or v['path'].startswith('courses/')),409,'UNSAFE_TREE','课程目录不能包含链接或子模块。')
            entries=[];blobs=state.get('blobs',{})
            for path,content in sorted(desired.items()):
                sha=blob_sha(content)
                if existing.get(path,{}).get('sha')==sha:continue
                if blobs.get(path)!=sha:
                    uploaded=call('POST','/git/blobs',{'content':base64.b64encode(content).decode(),'encoding':'base64'})
                    require(uploaded['sha']==sha,409,'BLOB_MISMATCH','GitHub 文件校验不匹配。')
                    blobs[path]=sha;save(stage='uploading-changes',blobs=blobs,uploaded=len(blobs))
                entries.append({'path':path,'mode':'100644','type':'blob','sha':sha})
            entries.extend({'path':p,'mode':v['mode'],'type':'blob','sha':None} for p,v in existing.items() if p not in desired)
            new_tree=call('POST','/git/trees',{'base_tree':commit['tree']['sha'],'tree':entries}) if entries else commit['tree']
            stamp=datetime.fromtimestamp(revision['created_at'],timezone.utc).isoformat()
            identity={'name':'Shuku','email':'shuku@users.noreply.github.com','date':stamp}
            new=call('POST','/git/commits',{'message':'Shuku revision '+rid,'tree':new_tree['sha'],'parents':[base],'author':identity,'committer':identity})
            with self.store.transaction() as db:db.execute('UPDATE shuku_github_revisions SET commit_sha=%s WHERE revision_id=%s',(new['sha'],rid))
            mapping={**mapping,'commit_sha':new['sha']}
        sha=mapping['commit_sha'];save(stage='creating-review-branch')
        ref=call('GET','/git/ref/heads/'+quote(branch,safe=''),missing=True)
        if not ref:ref=call('POST','/git/refs',{'ref':'refs/heads/'+branch,'sha':sha})
        require(ref['object']['sha']==sha,409,'BRANCH_CHANGED','审核分支已被外部修改。')
        pulls=call('GET','/pulls?'+urlencode({'state':'all','head':repo['owner']+':'+branch,'base':repo['default_branch'],'per_page':100}))
        pr=next((p for p in pulls if p['head']['sha']==sha),None)
        if not pr:
            save(stage='creating-pull-request')
            pr=call('POST','/pulls',{'title':'课程修改 · '+rid[:8],'head':branch,'base':repo['default_branch'],'body':'术库审核修订：'+rid})
        self.check_pr(repo,mapping,pr)
        with self.store.transaction() as db:db.execute('UPDATE shuku_github_revisions SET pr_number=%s WHERE revision_id=%s',(pr['number'],rid))
        return {**mapping,'pr_number':pr['number']}

    @staticmethod
    def check_pr(repo,mapping,pr):
        require(pr['base']['repo']['id']==repo['repository_id'] and pr['base']['ref']==repo['default_branch'] and pr['head']['sha']==mapping['commit_sha'] and pr['head']['repo'] and (mapping.get('external') or pr['head']['repo']['id']==repo['repository_id']) and pr['head']['ref']==mapping['branch'],409,'PR_CHANGED','PR 内容或目标仓库已变化。')

    def merge(self,repo,mapping,call,save):
        path='/pulls/'+str(mapping['pr_number']);pr=call('GET',path);self.check_pr(repo,mapping,pr)
        if not pr.get('merged'):
            head=call('GET','/git/ref/heads/'+quote(repo['default_branch'],safe=''))['object']['sha']
            require(head==mapping['base_sha'] and pr['state']=='open',409,'REMOTE_BASE_CHANGED','官方仓库已变化，请重新基于最新版本共创。')
            save(stage='merging-pull-request')
            call('PUT',path+'/merge',{'sha':mapping['commit_sha'],'merge_method':'merge'})
            pr=call('GET',path);self.check_pr(repo,mapping,pr)
        require(pr.get('merged') and re.fullmatch('[a-f0-9]{40}',pr.get('merge_commit_sha','')),409,'REMOTE_MERGE_UNCONFIRMED','尚未核验 GitHub 合并结果。')
        sha=pr['merge_commit_sha']
        merged=call('GET','/git/commits/'+sha)
        require([p['sha'] for p in merged['parents']]==[mapping['base_sha'],mapping['commit_sha']],409,'REMOTE_BASE_CHANGED','实际合并的基础提交与已审核基础不一致。')
        comparison=call('GET','/compare/'+sha+'...'+quote(repo['default_branch'],safe=''))
        require(comparison['status'] in ('identical','ahead'),409,'MERGE_NOT_REACHABLE','远程合并不在官方分支中。')
        return sha

    def ensure_merge(self,kid,checkpoint):
        with self.store.transaction() as db:
            row=db.execute('SELECT * FROM shuku_contributions WHERE id=%s',(kid,)).fetchone()
            repo=self.repo(db,row['target_course_id'])
            if not repo:return
            mapping=db.execute('SELECT * FROM shuku_github_revisions WHERE revision_id=%s',(row['revision_id'],)).fetchone()
            jid=self.queue(db,repo['course_id'],'merge',str(kid),{'revision_id':str(row['revision_id'])},row['merger_id'])
            task=db.execute('SELECT t.status FROM shuku_github_jobs j JOIN shuku_tasks t ON t.id=j.task_id WHERE j.id=%s',(jid,)).fetchone()
        require(task['status']!='failed',503,'GITHUB_MERGE_FAILED','远程合并失败，请在同步详情中重试。')
        if not mapping or not mapping['merge_sha']:checkpoint({'stage':'waiting-for-github-merge'});raise DeferredTask()

    def release_gate(self,db,uid,cid,rid,version,note):
        repo=self.repo(db,cid)
        if not repo:
            require(not self.client,409,'GITHUB_NOT_READY','请先等待专属 GitHub 仓库连接完成。')
            return None
        remote_rid=self.remote_revision(db,rid)
        mapping=db.execute('SELECT * FROM shuku_github_revisions WHERE revision_id=%s',(remote_rid,)).fetchone()
        if mapping and mapping['release_id'] and mapping['release_version']==version:
            require(mapping['release_note']==note,409,'VERSION_EXISTS','远程版本说明不匹配。');return None
        require(not db.execute("SELECT 1 FROM shuku_github_jobs j JOIN shuku_tasks t ON t.id=j.task_id WHERE j.course_id=%s AND j.kind='release' AND j.subject<>%s AND t.status IN ('queued','running')",(cid,rid+':'+version)).fetchone(),409,'RELEASE_BUSY','另一版本正在发布，请稍后再试。')
        jid=self.queue(db,cid,'release',rid+':'+version,{'revision_id':rid,'version':version,'note':note},uid)
        old=db.execute('SELECT payload FROM shuku_github_jobs WHERE id=%s',(jid,)).fetchone()
        require(old['payload']['note']==note,409,'VERSION_EXISTS','该版本正在按另一份说明发布。')
        return {'pending':True,'job_id':jid,'version':version}

    @staticmethod
    def remote_revision(db,rid):
        if db.execute('SELECT 1 FROM shuku_github_revisions WHERE revision_id=%s',(rid,)).fetchone():return rid
        row=db.execute("SELECT revision_id FROM shuku_contributions WHERE merged_revision=%s AND status IN ('merging','merged')",(rid,)).fetchone()
        return str(row['revision_id']) if row and row['revision_id'] else rid

    def run(self,task,checkpoint):
        with self.store.transaction() as db:
            job=db.execute('SELECT j.*,c.deleting,c.status AS course_status FROM shuku_github_jobs j JOIN shuku_courses c ON c.id=j.course_id WHERE j.id=%s',(task['payload']['job_id'],)).fetchone()
            if not job:return {'removed':True}
            repo=self.repo(db,job['course_id'])
            if job['kind'] in ('merge','release','external_merge'):self.flow.owner(db,str(job['requested_by']),str(job['course_id']))
        require(not job['deleting'],409,'RESOURCE_REMOVED','课程正在移除。')
        state=dict(task['checkpoint'])
        def save(**changes):state.update(changes);checkpoint(state)
        def call(method,path='',data=None,missing=False):
            save();value=self.client.call(repo,method,path,data,missing);save();return value
        identity=call('GET')
        require(identity['id']==repo['repository_id'],409,'REPOSITORY_CHANGED','远程仓库已被替换。')
        kind=job['kind'];payload=job['payload'];rid=payload.get('revision_id')
        if kind in ('pull','merge','release'):
            if kind=='release':
                with self.store.transaction() as db:
                    rid=self.remote_revision(db,rid)
                    external=db.execute('SELECT * FROM shuku_github_revisions WHERE revision_id=%s AND external FOR UPDATE',(rid,)).fetchone()
                    if external:
                        # Compile only trusted project data locally; publish the reviewed runtime in its own PR.
                        branch=f"shuku-review/{repo['course_id']}/{rid}"
                        db.execute('UPDATE shuku_github_revisions SET base_sha=merge_sha,branch=%s,commit_sha=NULL,pr_number=NULL,merge_sha=NULL,external=false WHERE revision_id=%s',(branch,rid))
            mapping=self.pull(repo,rid,call,state,save)
            if kind in ('merge','release'):
                if kind=='release':require(job['course_status']!='hidden',409,'COURSE_HIDDEN','课程已下架。')
                # Only approved local immutable revisions may trigger a remote merge.
                with self.store.transaction() as db:
                    approved=db.execute("SELECT 1 FROM shuku_reviews WHERE revision_id=%s AND status IN ('approved','published') UNION ALL SELECT 1 FROM shuku_contributions WHERE revision_id=%s AND status IN ('approved','merging','merged')",(rid,rid)).fetchone()
                require(approved,409,'APPROVAL_REQUIRED','该修订尚未通过审核。')
                sha=self.merge(repo,mapping,call,save)
                with self.store.transaction() as db:db.execute('UPDATE shuku_github_revisions SET merge_sha=%s WHERE revision_id=%s',(sha,rid))
                if kind=='release':
                    version=payload['version'];tag='v'+version;save(stage='publishing-tag-release')
                    ref=call('GET','/git/ref/tags/'+tag,missing=True)
                    if not ref:ref=call('POST','/git/refs',{'ref':'refs/tags/'+tag,'sha':sha})
                    require(ref['object']['type']=='commit' and ref['object']['sha']==sha,409,'TAG_EXISTS','Tag 已被其他内容占用。')
                    marker='<!-- shuku:'+rid+' -->';body=payload['note']+'\n\n'+marker
                    release=call('GET','/releases/tags/'+tag,missing=True)
                    if not release:release=call('POST','/releases',{'tag_name':tag,'target_commitish':sha,'name':tag,'body':body,'draft':False,'prerelease':False})
                    require(release['tag_name']==tag and release.get('body')==body and not release['draft'] and not release['prerelease'],409,'RELEASE_EXISTS','远程 Release 与本次发布不一致。')
                    call('PATCH','',{'private':False})
                    require(call('GET')['private'] is False,409,'VISIBILITY_UNCONFIRMED','仓库尚未公开。')
                    with self.store.transaction() as db:db.execute('UPDATE shuku_github_revisions SET release_id=%s,release_version=%s,release_note=%s WHERE revision_id=%s',(release['id'],version,payload['note'],rid))
                    self.flow.publish(str(job['requested_by']),str(repo['course_id']),payload)
                if not mapping.get('external'):
                    with self.store.transaction() as db:self.queue(db,repo['course_id'],'cleanup',str(rid),{'revision_id':rid},job['requested_by'])
        elif kind=='reconcile':self.reconcile(repo,call,save)
        elif kind=='issue':self.issue(repo,job,call,save)
        elif kind=='cleanup':
            with self.store.transaction() as db:mapping=db.execute('SELECT * FROM shuku_github_revisions WHERE revision_id=%s',(rid,)).fetchone()
            if mapping:self.cleanup(repo,mapping,call,save)
        elif kind=='external_merge':self.merge_external(repo,job,call,save)
        elif kind=='visibility':
            save(stage='updating-repository-visibility')
            if (job['course_status']!='published')!=payload['private']:return {'superseded':True}
            private=payload['private'];call('PATCH','',{'private':private})
            require(call('GET')['private']==private,409,'VISIBILITY_UNCONFIRMED','仓库可见性未确认。')
        else:raise ValueError('Unknown GitHub task')
        save(stage='complete');return {'job_id':str(job['id'])}

    def external_decision(self,uid,cid,data):
        require(set(data)=={'number','head_sha','decision'} and type(data['number']) is int and data['decision'] in ('approved','rejected','merge'),400,'INVALID_INPUT','外部 PR 审核信息不正确。')
        with self.store.transaction() as db:
            course,_=self.flow.owner(db,uid,cid)
            row=db.execute('SELECT * FROM shuku_github_external_prs WHERE course_id=%s AND number=%s FOR UPDATE',(cid,data['number'])).fetchone()
            require(row and row['state']=='open' and row['head_sha']==data['head_sha'],409,'PR_CHANGED','请刷新 PR 后重新审核。')
            if data['decision']=='merge':
                require(row['review_state']=='approved' and row['approved_sha']==row['head_sha'],409,'APPROVAL_REQUIRED','需要先审核该 PR 的当前提交。')
                if course['current_release']:
                    release=db.execute('SELECT revision_id FROM shuku_releases WHERE id=%s',(course['current_release'],)).fetchone()
                    require(course['head_revision']==release['revision_id'],409,'DRAFT_EXISTS','请先处理官方待发布修改，再合并外部建议。')
                jid=self.queue(db,cid,'external_merge',str(row['number'])+':'+row['head_sha'],{'number':row['number'],'head_sha':row['head_sha'],'target_head':str(course['head_revision']) if course['head_revision'] else None},uid)
                return {'job_id':jid}
            db.execute('UPDATE shuku_github_external_prs SET review_state=%s,approved_sha=%s,reviewer_id=%s WHERE course_id=%s AND number=%s',(data['decision'],row['head_sha'] if data['decision']=='approved' else None,uid,cid,row['number']))
            self.flow.audit(db,uid,'github.external.'+data['decision'],str(row['number']))
            return {'status':data['decision']}

    def merge_external(self,repo,job,call,save):
        data=job['payload'];number=data['number'];sha=data['head_sha']
        with self.store.transaction() as db:
            row=db.execute('SELECT * FROM shuku_github_external_prs WHERE course_id=%s AND number=%s',(repo['course_id'],number)).fetchone()
            if row and row['review_state']=='merged' and row['local_revision_id']:return
            require(row and row['review_state']=='approved' and row['approved_sha']==sha,409,'APPROVAL_REQUIRED','外部 PR 的审批已失效。')
        path='/pulls/'+str(number);pr=call('GET',path)
        require(pr['base']['repo']['id']==repo['repository_id'] and pr['base']['ref']==repo['default_branch'] and pr['head']['sha']==sha,409,'PR_CHANGED','外部 PR 已变化。')
        project=self.external_project(repo,row,call)
        with self.store.transaction() as db:
            course,_=self.flow.owner(db,str(job['requested_by']),str(repo['course_id']))
            require((str(course['head_revision']) if course['head_revision'] else None)==data['target_head'],409,'REVISION_CONFLICT','官方待发布内容已变化。')
            module=self.flow.module_context(course['module_id'])
        self.flow.prepare(project,module)  # Validate before the irreversible remote merge; never execute remote code.
        if not pr.get('merged'):
            require(pr['state']=='open' and pr['base']['sha']==row['base_sha'],409,'REMOTE_BASE_CHANGED','PR 基础提交已变化，请重新审核。')
            save(stage='merging-external-pull-request');call('PUT',path+'/merge',{'sha':sha,'merge_method':'merge'});pr=call('GET',path)
        require(pr.get('merged') and pr['head']['sha']==sha and pr['merge_commit_sha'],409,'REMOTE_MERGE_UNCONFIRMED','未核验远程合并结果。')
        actual=call('GET','/git/commits/'+pr['merge_commit_sha'])
        require([p['sha'] for p in actual['parents']]==[row['base_sha'],sha],409,'REMOTE_BASE_CHANGED','外部 PR 实际合并基础发生变化。')
        require(call('GET','/compare/'+pr['merge_commit_sha']+'...'+quote(repo['default_branch'],safe=''))['status'] in ('identical','ahead'),409,'MERGE_NOT_REACHABLE','合并提交已不在官方分支中。')
        with self.store.transaction() as db:
            saved=self.flow.save_in(db,str(job['requested_by']),str(repo['course_id']),{'project':project,'expected_revision':data['target_head']},remote_job_id=job['id'])
            db.execute('INSERT INTO shuku_github_revisions(revision_id,course_id,base_sha,branch,commit_sha,pr_number,merge_sha,external) VALUES (%s,%s,%s,%s,%s,%s,%s,true)',(saved['id'],repo['course_id'],row['base_sha'],pr['head']['ref'],sha,number,pr['merge_commit_sha']))
            db.execute("UPDATE shuku_github_external_prs SET review_state='merged',merge_sha=%s,state='closed',local_revision_id=%s WHERE course_id=%s AND number=%s",(pr['merge_commit_sha'],saved['id'],repo['course_id'],number))
            self.flow.audit(db,str(job['requested_by']),'github.external.import',saved['id'])

    def external_project(self,repo,row,call):
        trees=[]
        for commit_sha in (row['base_sha'],row['head_sha']):
            commit=call('GET','/git/commits/'+commit_sha)
            tree=call('GET','/git/trees/'+commit['tree']['sha']+'?recursive=1')
            require(not tree.get('truncated'),409,'TREE_TOO_LARGE','外部 PR 文件树过大。')
            trees.append({v['path']:v for v in tree['tree'] if v['path']=='courses' or v['path'].startswith('courses/')})
        before,after=trees
        changed={p for p in set(before)|set(after) if before.get(p,{}).get('sha')!=after.get(p,{}).get('sha') and (before.get(p,after.get(p)) or {}).get('type')!='tree'}
        require(all(p=='courses/project.json' or p.startswith('courses/sources/') for p in changed) and all(v.get('mode') not in ('120000','160000') for v in after.values()),409,'UNSUPPORTED_REMOTE_SOURCE','外部 PR 只能修改课程项目和托管源码，不能替换运行产物。')
        obj=after.get('courses/project.json');require(obj and obj['type']=='blob',409,'PROJECT_REQUIRED','外部 PR 缺少 courses/project.json。')
        blob=call('GET','/git/blobs/'+obj['sha'])
        require(blob.get('encoding')=='base64' and blob.get('size',0)<=4*1024*1024,413,'PROJECT_LIMIT','课程项目数据过大。')
        content=base64.b64decode(blob['content'].replace('\n',''),validate=True)
        require(blob_sha(content)==obj['sha'],409,'BLOB_MISMATCH','外部课程数据校验失败。')
        project=teaching(json.loads(content))
        sources={}
        source_nodes=[(p[16:],v) for p,v in after.items() if p.startswith('courses/sources/') and v.get('type')=='blob']
        require(len(source_nodes)<=200,413,'SOURCE_LIMIT','源码文件过多。')
        total=0
        for name,node in source_nodes:
            require(node.get('size',0)<=1024*1024,413,'SOURCE_LIMIT','源码文件过大。')
            blob=call('GET','/git/blobs/'+node['sha'])
            require(blob.get('encoding')=='base64' and blob.get('size',0)<=1024*1024,413,'SOURCE_LIMIT','源码文件过大。')
            data=base64.b64decode(blob['content'].replace('\n',''),validate=True);total+=len(data)
            require(blob_sha(data)==node['sha'] and total<=4*1024*1024,409,'BLOB_MISMATCH','源码校验失败或超过大小限制。')
            sources[name]=data.decode('utf-8')
        if source_nodes:project['source']={'files':sources}
        elif project.get('source'):require(not project['source'].get('files'),409,'SOURCE_REQUIRED','源码清单与仓库文件不一致。')
        from .source import validate_source
        validate_source(project)
        return project

    def remove(self,task,checkpoint):
        self.hosted.remove(task,checkpoint)
        with self.store.transaction() as db:
            r=db.execute('SELECT * FROM shuku_removals WHERE id=%s',(task['payload']['removal_id'],)).fetchone()
            if not r or r['state']!='queued':return
            if r['kind']=='course':repo=self.repo(db,r['resource_id']);mappings=[]
            else:
                w=db.execute('SELECT target_course_id FROM shuku_workspaces WHERE id=%s',(r['resource_id'],)).fetchone()
                repo=self.repo(db,w['target_course_id']) if w else None
                mappings=db.execute('SELECT g.* FROM shuku_github_revisions g JOIN shuku_contributions k ON k.revision_id=g.revision_id WHERE k.workspace_id=%s',(r['resource_id'],)).fetchall()
            if not repo:
                intent=db.execute("SELECT 1 FROM shuku_tasks WHERE kind='github.provision' AND resource_key=%s",('course:'+str(r['resource_id']),)).fetchone() if r['kind']=='course' else None
                if not intent:return
                if db.execute('SELECT 1 FROM shuku_task_leases WHERE resource_key=%s AND task_id<>%s AND expires_at>%s',('course:'+str(r['resource_id']),task['id'],self.clock())).fetchone():raise DeferredTask()
        if not repo:
            # A crash after repository creation but before binding must not leak an orphan.
            require(self.client,503,'GITHUB_NOT_CONFIGURED','恢复仓库创建需要 GitHub App 配置。')
            owner=self.config['owner'];installation=int(self.config['installationId']);name='course-'+str(r['resource_id']);path=f'/repos/{owner}/{name}'
            def recover_call(method,missing=False):
                checkpoint({'stage':'reconciling-private-repository-creation'})
                value=self.client.installation_call(installation,method,path,missing=missing)
                checkpoint({'stage':'reconciling-private-repository-creation'})
                return value
            remote=recover_call('GET',missing=True)
            if remote:
                require(remote.get('description')=='Shuku course '+str(r['resource_id']) and remote['owner']['login'].lower()==owner.lower(),409,'UNOWNED_REPOSITORY','不能删除外部仓库。')
                recover_call('DELETE')
                require(recover_call('GET',missing=True) is None,409,'DELETE_UNCONFIRMED','尚未确认远程仓库删除。')
            return
        with self.store.transaction() as db:
            keys=['course:'+cid for cid in r['resource_ids']]
            if r['kind']=='workspace':keys.append('course:'+str(repo['course_id']))
            if db.execute('SELECT 1 FROM shuku_task_leases WHERE resource_key IN %s AND task_id<>%s AND expires_at>%s',(keys,task['id'],self.clock())).fetchone():raise DeferredTask()
            if r['kind']=='workspace' and db.execute("SELECT 1 FROM shuku_contributions WHERE workspace_id=%s AND status='merging'",(r['resource_id'],)).fetchone():raise DeferredTask()
        require(self.client,503,'GITHUB_NOT_CONFIGURED','远程删除需要配置 GitHub App。')
        def call(method,path='',data=None,missing=False):
            checkpoint({'stage':'removing-github-resources'})
            return self.client.call(repo,method,path,data,missing)
        if r['kind']=='course':
            require(repo['allow_destroy'],409,'REMOTE_DELETE_DISABLED','该仓库未授权永久删除，请管理员核实专属仓库后开启。')
            def inspect():
                checkpoint({'stage':'verifying-remote-deletion'})
                return self.client.installation_call(repo['installation_id'],'GET','/repositories/'+str(repo['repository_id']),missing=True) if hasattr(self.client,'installation_call') else call('GET',missing=True)
            remote=inspect()
            if remote:
                require(remote['id']==repo['repository_id'],409,'REPOSITORY_CHANGED','仓库身份已变化。')
                call('DELETE')
            require(inspect() is None,409,'DELETE_UNCONFIRMED','尚未确认远程仓库删除。')
        else:
            for mapping in mappings:
                require(mapping['branch'].startswith('shuku-review/'+str(repo['course_id'])+'/'),409,'UNOWNED_BRANCH','不能删除外部分支。')
                if mapping['pr_number']:
                    pr=call('GET','/pulls/'+str(mapping['pr_number']));self.check_pr(repo,mapping,pr)
                    if not pr.get('merged') and pr['state']=='open':call('PATCH','/pulls/'+str(mapping['pr_number']),{'state':'closed'})
                branch=quote(mapping['branch'],safe='');ref=call('GET','/git/ref/heads/'+branch,missing=True)
                if ref:
                    require(ref['object']['sha']==mapping['commit_sha'],409,'BRANCH_CHANGED','审核分支已被外部修改。')
                    call('DELETE','/git/refs/heads/'+branch)

    def cleanup(self,repo,mapping,call,save):
        if mapping.get('external'):return  # A contributor's branch is never ours to remove.
        branch=mapping['branch'];require(branch.startswith('shuku-review/'+str(repo['course_id'])+'/'),409,'UNOWNED_BRANCH','不能删除外部分支。')
        pr=call('GET','/pulls/'+str(mapping['pr_number']));self.check_pr(repo,mapping,pr)
        require(pr.get('merged'),409,'NOT_MERGED','未合并分支不能自动清理。')
        ref=call('GET','/git/ref/heads/'+quote(branch,safe=''),missing=True)
        if ref:
            require(ref['object']['sha']==mapping['commit_sha'],409,'BRANCH_CHANGED','审核分支已变化，保留分支。')
            save(stage='cleaning-review-branch');call('DELETE','/git/refs/heads/'+quote(branch,safe=''))

    def issue(self,repo,job,call,save):
        with self.store.transaction() as db:
            f=db.execute('SELECT f.*,l.version FROM shuku_feedback f JOIN shuku_releases l ON l.id=f.release_id WHERE f.id=%s',(job['subject'],)).fetchone()
        if not f:return
        marker='<!-- shuku-feedback:'+str(f['id'])+' -->';found=None
        # Ordered exhaustive traversal prevents duplicate Issues after an ambiguous POST timeout.
        page=1
        while not found:
            save(stage='locating-feedback-issue',page=page)
            rows=call('GET','/issues?state=all&sort=created&direction=asc&per_page=100&page='+str(page))
            found=next((r for r in rows if marker in (r.get('body') or '') and not r.get('pull_request')),None)
            if len(rows)<100:break
            page+=1
        if not found:found=call('POST','/issues',{'title':'课程问题反馈 · '+f['version'],'body':f['message']+'\n\n位置：'+f['location']+'\n\n'+marker})
        with self.store.transaction() as db:db.execute('UPDATE shuku_feedback SET github_number=%s,github_state=%s WHERE id=%s',(found['number'],found['state'],f['id']))

    def reconcile(self,repo,call,save):
        page=1
        while True:
            save(stage='checking-pull-requests',page=page)
            rows=call('GET','/pulls?state=all&sort=updated&direction=desc&per_page=100&page='+str(page))
            for pr in rows:
                if pr['base']['repo']['id']!=repo['repository_id'] or pr['base']['ref']!=repo['default_branch']:continue
                with self.store.transaction() as db:
                    own=db.execute('SELECT * FROM shuku_github_revisions WHERE course_id=%s AND pr_number=%s',(repo['course_id'],pr['number'])).fetchone()
                if own:
                    detail=call('GET','/pulls/'+str(pr['number']))
                    if detail.get('merged'):
                        ref=call('GET','/git/ref/heads/'+quote(own['branch'],safe=''),missing=True)
                        if ref:
                            with self.store.transaction() as db:
                                uid=db.execute('SELECT owner_id FROM shuku_courses WHERE id=%s',(repo['course_id'],)).fetchone()['owner_id']
                                self.queue(db,repo['course_id'],'cleanup',str(own['revision_id'])+':'+ref['object']['sha'],{'revision_id':str(own['revision_id'])},uid)
                    continue
                with self.store.transaction() as db:
                    previous=db.execute('SELECT head_sha,base_sha FROM shuku_github_external_prs WHERE course_id=%s AND number=%s',(repo['course_id'],pr['number'])).fetchone()
                    # Keep the review decision only while both reviewed SHAs still match.
                    values=dict(course_id=repo['course_id'],number=pr['number'],head_sha=pr['head']['sha'],base_sha=pr['base']['sha'],title=pr['title'][:256],author=pr['user']['login'],state=pr['state'],updated_at=self.clock())
                    db.upsert_pull_request(values)
                    if pr['state']=='open' and (not previous or previous['head_sha']!=pr['head']['sha'] or previous['base_sha']!=pr['base']['sha']):self.notify_pr(db,repo,pr)
            if len(rows)<100:break
            page+=1
        with self.store.transaction() as db:
            feedback=db.execute('SELECT f.id,f.github_number FROM shuku_feedback f JOIN shuku_releases l ON l.id=f.release_id WHERE l.course_id=%s AND f.github_number IS NOT NULL',(repo['course_id'],)).fetchall()
        for f in feedback:
            issue=call('GET','/issues/'+str(f['github_number']))
            with self.store.transaction() as db:db.execute('UPDATE shuku_feedback SET github_state=%s WHERE id=%s',(issue['state'],f['id']))

    def tick(self):
        if not self.client:return
        cursor='00000000-0000-0000-0000-000000000000'
        while not self.stop.is_set():
            with self.store.transaction() as db:
                rows=db.execute('SELECT g.course_id,c.owner_id FROM shuku_github_repositories g JOIN shuku_courses c ON c.id=g.course_id WHERE NOT c.deleting AND g.course_id>%s ORDER BY g.course_id LIMIT 100',(cursor,)).fetchall()
                for row in rows:self.queue(db,row['course_id'],'reconcile','timer:'+str(int(self.clock()//300)),{},row['owner_id'])
            if len(rows)<100:break
            cursor=str(rows[-1]['course_id'])

    def notify_pr(self,db,repo,pr):
        cid=repo['course_id'];course=db.execute('SELECT title,owner_id FROM shuku_courses WHERE id=%s',(cid,)).fetchone()
        recipients=db.execute('SELECT u.id FROM shuku_users u WHERE u.active AND (u.id=%s OR EXISTS(SELECT 1 FROM shuku_course_managers m WHERE m.course_id=%s AND m.user_id=u.id))',(course['owner_id'],cid)).fetchall()
        if not recipients:recipients=db.execute("SELECT id FROM shuku_users WHERE active AND role='admin'").fetchall()
        for row in recipients:
            db.insert_once("INSERT INTO shuku_messages(id,recipient_id,course_id,event_key,kind,title,summary,created_at) VALUES (%s,%s,%s,%s,'github_pr',%s,%s,%s)",(uuid4(),row['id'],cid,'github-pr:'+str(cid)+':'+str(pr['number'])+':'+pr['head']['sha']+':'+pr['base']['sha'],'课程共创待审核 · '+course['title'],pr['title'][:180],self.clock()))

    def review_courses(self,uid):
        with self.store.transaction() as db:
            user=self.store.user_in(db,uid)
            return [course_view(row) for row in db.execute("SELECT DISTINCT c.id,c.title FROM shuku_courses c JOIN shuku_github_external_prs p ON p.course_id=c.id WHERE NOT c.deleting AND (p.state='open' OR (p.local_revision_id=c.head_revision AND NOT EXISTS(SELECT 1 FROM shuku_releases l WHERE l.revision_id=p.local_revision_id))) AND (c.owner_id=%s OR %s OR EXISTS(SELECT 1 FROM shuku_course_managers m WHERE m.course_id=c.id AND m.user_id=%s)) ORDER BY c.id LIMIT 100",(uid,user['role']=='admin',uid)).fetchall()]

    def start(self):
        if not self.client:return
        def loop():
            while not self.stop.is_set():
                try:self.tick()
                except Exception:
                    __import__('logging').getLogger(__name__).warning('GitHub reconciliation scheduling failed; retrying')
                self.stop.wait(30)
        self.thread=threading.Thread(target=loop,name='shuku-github-reconcile',daemon=False);self.thread.start()

    def close(self):
        self.stop.set()
        if self.thread:self.thread.join()
