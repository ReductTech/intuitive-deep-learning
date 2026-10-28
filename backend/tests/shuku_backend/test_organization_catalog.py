import base64
import copy
import json
from uuid import uuid4
import pytest
from shuku_backend.adapters.github import GitHubError, blob_sha
from shuku_backend.errors import BusinessError
from shuku_backend.organization_catalog import OrganizationCatalog, manifest, safe_path
from shuku_backend.migrations import DRAFT_VERSION, DRAFT_CHECKSUM
from test_http import api, login


class Remote:
    def __init__(self):
        self.sha = 'a' * 40; self.version = '1.0.0'; self.fail = False; self.pages = []; self.unsafe = False
        self.raw = {'id': 123, 'owner': {'login': 'reduct-shuku'}, 'name': 'deep-learning', 'default_branch': 'main', 'private': False}
        self.files = {'index.html': b'<html><script>document.body.dataset.ready="yes"</script><body>Deep learning</body></html>', 'assets/main.css': b'body{color:blue}'}

    def value(self):
        return {'schema_version': 1, 'course_id': 'deep-learning', 'type': 'official', 'title': 'Deep learning', 'description': 'Intro', 'build_profile': 'static', 'entry': 'index.html', 'name': 'deep-learning', 'version': self.version, 'repository': 'https://github.com/reduct-shuku/deep-learning', 'ref': 'main', 'path': '.'}

    def installation_call(self, installation, method, path, *args, **kwargs):
        assert method == 'GET'
        if self.fail: raise GitHubError(503)
        if path.startswith('/repositories/'): return copy.deepcopy(self.raw)
        page = int(path.rsplit('page=', 1)[1]); self.pages.append(page)
        if page == 1: return [dict(self.raw, id=1000+i, name='ignore-'+str(i), is_template=True) for i in range(100)]
        return [copy.deepcopy(self.raw)]

    def call(self, repo, method, suffix='', *args, **kwargs):
        assert method == 'GET'
        if self.fail: raise GitHubError(503)
        if suffix.startswith('/commits/'): return {'sha': self.sha}
        if suffix.startswith('/contents/course.yaml'): return None
        if suffix.startswith('/contents/shuku.json'): return self.encoded(json.dumps(self.value()).encode(), type='file')
        if suffix.startswith('/contents/index.html'): return self.encoded(self.files['index.html'], type='file')
        if suffix.startswith('/git/trees/'):
            return {'truncated': False, 'tree': [{'path': name, 'type': 'blob', 'mode': '120000' if self.unsafe else '100644', 'sha': blob_sha(data), 'size': len(data)} for name, data in self.files.items()]}
        if suffix.startswith('/git/blobs/'):
            return next(self.encoded(data) for data in self.files.values() if blob_sha(data) == suffix.rsplit('/', 1)[1])
        raise AssertionError(suffix)

    def encoded(self, data, **extra): return {'encoding': 'base64', 'content': base64.b64encode(data).decode(), 'sha': blob_sha(data), **extra}


@pytest.fixture
def catalog(api):
    request, app = api
    app.workflow.github.config = {'owner': 'reduct-shuku', 'installationId': 456}
    remote = Remote(); app.workflow.github.client = remote
    admin = login(request, 'admin'); learner = login(request, 'linzhi')
    return request, app, remote, admin, learner


def scan(app):
    app.workflow.catalog.request_scan(admin_id(app))
    assert app.worker.run_once()
    with app.store.transaction() as db:
        job=db.execute("SELECT status,error_code FROM shuku_tasks WHERE kind='catalog.scan' ORDER BY created_at DESC LIMIT 1").fetchone()
    assert job['status'] == 'succeeded', job


def approve(request, admin, sha='a'*40):
    return request('POST','/admin/catalog/123/decision',{'decision':'approved','source_sha':sha,'note':'Reviewed'},cookie=admin)


def imported(app):
    with app.store.transaction() as db:
        return db.execute('SELECT * FROM shuku_catalog_candidates WHERE repository_id=123').fetchone()


def test_scan_permissions_pagination_review_publication_and_static_files(catalog):
    request,app,remote,admin,learner=catalog
    assert request('GET','/admin/catalog')[0]==401
    assert request('GET','/admin/catalog',cookie=learner)[0]==403
    assert request('POST','/admin/catalog/scan',{},cookie=learner)[0]==403
    assert request('POST','/admin/catalog/scan',{},cookie=admin,origin='https://other')[0]==403
    scan(app); assert remote.pages==[1,2]
    assert request('GET','/public/courses')[1]['courses']==[]
    candidate=imported(app); assert candidate['status']=='pending'
    assert approve(request,learner)[0]==403
    assert approve(request,admin)[0]==202
    assert app.worker.run_once()
    candidate=imported(app); assert candidate['status']=='imported'
    courses=request('GET','/public/courses')[1]['courses']; assert len(courses)==1
    rid=courses[0]['revision_id'];cid=courses[0]['id']
    status,body,_=request('GET','/revisions/'+rid+'/player')
    assert status==200 and body['url'].endswith('/files/static/index.html')
    assert request('GET','/public/courses/'+cid)[1]['course']['external']['commit']=='a'*40
    assert app.workflow.file(None,rid,'static/assets/main.css')[0]==remote.files['assets/main.css']
    assert app.workflow.personal.context('course:'+cid,rid)['sandboxed']
    from http.client import HTTPConnection
    import threading
    server=app.server();thread=threading.Thread(target=server.serve_forever);thread.start()
    try:
        connection=HTTPConnection(*server.server_address,timeout=5)
        connection.request('GET','/api/shuku/revisions/'+rid+'/files/static/index.html')
        response=connection.getresponse()
        assert response.status==200 and response.read()==remote.files['index.html']
        assert 'sandbox allow-scripts' in response.getheader('Content-Security-Policy')
        assert "connect-src 'none'" in response.getheader('Content-Security-Policy')
        connection.close()
    finally:server.shutdown();server.server_close();thread.join()
    assert approve(request,admin)[0]==202
    assert not app.worker.run_once()  # successful import is idempotent
    assert len(request('GET','/public/courses')[1]['courses'])==1
    assert request('POST','/courses/'+cid+'/workspaces',{},cookie=learner)[0]==409


def test_failure_preserves_catalog_and_rejected_sha_is_retained(catalog):
    request,app,remote,admin,_=catalog;scan(app)
    assert request('POST','/admin/catalog/123/decision',{'decision':'rejected','source_sha':remote.sha,'note':'Please fix'},cookie=admin)[0]==202
    before=imported(app); remote.fail=True
    app.workflow.catalog.request_scan(admin_id(app)); assert app.worker.run_once()
    assert imported(app)==before
    remote.fail=False
    # finish queued retry, then scan same SHA: rejection remains.
    with app.store.transaction() as db:db.execute("UPDATE shuku_tasks SET status='failed' WHERE kind='catalog.scan' AND status='queued'")
    scan(app);assert imported(app)['status']=='rejected'
    assert approve(request,admin)[0]==202
    assert app.worker.run_once()
    assert imported(app)['status']=='imported'
    remote.sha='b'*40;remote.version='1.0.1'
    scan_new(app);assert imported(app)['status']=='pending'


def admin_id(app):
    with app.store.transaction() as db:return str(db.execute("SELECT id FROM shuku_users WHERE username='admin'").fetchone()['id'])


def scan_new(app):
    app.workflow.catalog.request_scan(admin_id(app)); assert app.worker.run_once()


def test_stale_review_and_unsafe_files_never_publish(catalog):
    request,app,remote,admin,_=catalog;scan(app)
    assert approve(request,admin,'b'*40)[0]==409
    assert approve(request,admin)[0]==202
    remote.sha='b'*40;assert app.worker.run_once()
    assert request('GET','/public/courses')[1]['courses']==[]
    with app.store.transaction() as db:
        db.execute("UPDATE shuku_tasks SET status='failed' WHERE kind='catalog.import'")
    remote.sha='a'*40;remote.unsafe=True
    approve(request,admin);assert app.worker.run_once()
    assert request('GET','/public/courses')[1]['courses']==[]
    with app.store.transaction() as db:assert db.execute("SELECT error_code FROM shuku_tasks WHERE kind='catalog.import'").fetchone()['error_code']=='UNSAFE_COURSE_FILE'


def test_updates_preserve_versions_and_hidden_courses(catalog):
    request,app,remote,admin,_=catalog;scan(app);approve(request,admin);assert app.worker.run_once()
    cid=imported(app)['course_id'];remote.sha='b'*40;remote.version='1.0.1';scan_new(app)
    assert request('GET','/public/courses')[1]['courses'][0]['version']=='1.0.0'
    approve(request,admin,remote.sha);assert app.worker.run_once()
    assert request('GET','/public/courses')[1]['courses'][0]['version']=='1.0.1'
    with app.store.transaction() as db:assert db.execute('SELECT COUNT(*) AS n FROM shuku_releases WHERE course_id=%s',(cid,)).fetchone()['n']==2
    app.workflow.governance.visibility(admin_id(app),cid,{'action':'hide'})
    remote.sha='c'*40;remote.version='1.0.2';scan_new(app);approve(request,admin,remote.sha);assert app.worker.run_once()
    assert request('GET','/public/courses')[1]['courses']==[]
    app.workflow.governance.visibility(admin_id(app),cid,{'action':'restore'})
    assert request('GET','/public/courses')[1]['courses'][0]['version']=='1.0.1'


def test_deleted_repository_binding_does_not_resurrect(catalog):
    request,app,remote,admin,_=catalog;scan(app);approve(request,admin);assert app.worker.run_once()
    cid=imported(app)['course_id']
    app.workflow.governance.request(admin_id(app),'course',cid,{'confirm':True})
    assert app.worker.run_once()
    assert imported(app)['status']=='removed' and imported(app)['course_id'] is None
    scan_new(app);assert imported(app)['status']=='removed'
    assert approve(request,admin)[0]==409


@pytest.mark.parametrize('path',['../x','/root','a//x','a/../x','.env','a%2fx','a\\x'])
def test_unsafe_paths(path):
    with pytest.raises(BusinessError):safe_path(path)


def test_manifest_format_and_repository_identity():
    remote=Remote();repo={'owner':'reduct-shuku','name':'deep-learning'}
    assert manifest(remote.value(),repo)['entry']=='index.html'
    for key,value in [('build_profile','npm'),('repository','https://github.com/other/repo'),('ref','../main'),('entry','../.env')]:
        data=remote.value();data[key]=value
        with pytest.raises(BusinessError):manifest(data,repo)


def test_previous_draft_schema_upgrades_explicitly(store):
    from shuku_backend.migrations import VERSION
    with store.transaction() as db:
        db.execute('DELETE FROM shuku_schema_migrations WHERE version=%s',(VERSION,))
        db.execute('DROP TABLE shuku_catalog_candidates')
        assert db.execute('SELECT checksum FROM shuku_schema_migrations WHERE version=%s',(DRAFT_VERSION,)).fetchone()['checksum']==DRAFT_CHECKSUM
    with pytest.raises(RuntimeError):store.ready()
    store.migrate();store.migrate();store.ready()
