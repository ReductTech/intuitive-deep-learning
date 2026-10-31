import json
from pathlib import Path
import subprocess
from types import SimpleNamespace
from uuid import uuid4
import pytest
from shuku_backend.library_catalog import LibraryCatalog,REPOSITORY
from shuku_backend.errors import BusinessError
from test_http import api


def git(root,*args):
    return subprocess.check_output(['git','-C',str(root),*args],text=True).strip()


def snapshot(tmp_path,store):
    root=tmp_path/'library';root.mkdir()
    git(root,'init');git(root,'config','user.email','test@example.invalid');git(root,'config','user.name','Catalog test')
    uid=str(uuid4());directory=root/'modules'/'Course';directory.mkdir(parents=True)
    data={'moduleIdentity':{'id':uid},'id':'course','title':'远程课程','description':'课程介绍','badge':'人工智能','difficulty':'introductory','entry':'Guide.tsx','ppt':{'entry':'Ppt.tsx'},'pages':[{'id':'first'}]}
    (directory/'outlines.json').write_text(json.dumps(data))
    (root/'course-library.json').write_text(json.dumps({'schema':1,'repository':REPOSITORY,'modules':[{'directory':'Course','id':'course','uuid':uid}]}))
    (root/'source-lock.json').write_text(json.dumps({'repository':'ReductTech/intuitive-deep-learning'}))
    image=root/'assets'/uid/'course-covers'/'first.jpg';image.parent.mkdir(parents=True);image.write_bytes(b'jpg')
    git(root,'add','.');git(root,'commit','-m','snapshot')
    catalog=LibraryCatalog(SimpleNamespace(course_root=root,root=None,store=store,clock=lambda:1234,runtime_scenes=lambda *a,**kw:None))
    return root,uid,directory,data,catalog


def test_remote_snapshot_is_idempotent_and_http_reads_database(store,tmp_path):
    root,uid,directory,data,catalog=snapshot(tmp_path,store)
    assert catalog.sync()==1;assert catalog.sync()==1
    course=catalog.course('course')
    assert course['title']=='远程课程' and course['module_id']==uid
    assert course['cover_url']=='/'+uid+'/course-covers/first.jpg'
    assert course['source_commit']==git(root,'rev-parse','HEAD')
    assert REPOSITORY in course['github_url'] and str(root) not in json.dumps(course)
    # Changing a local file cannot silently change the public index.
    (directory/'outlines.json').write_text('{}')
    assert catalog.course('course')['title']=='远程课程'
    with pytest.raises(BusinessError):catalog.sync()
    assert catalog.course('course')==course
    with store.transaction() as db:assert db.execute('SELECT COUNT(*) AS n FROM shuku_library_courses').fetchone()['n']==1
    with pytest.raises(BusinessError):catalog.course('not-indexed')


def test_new_snapshot_updates_catalog_and_retains_old_versions(store,tmp_path):
    root,uid,directory,data,catalog=snapshot(tmp_path,store);catalog.sync();old=catalog.commit
    data['title']='更新课程';(directory/'outlines.json').write_text(json.dumps(data))
    git(root,'add','.');git(root,'commit','-m','update');catalog.sync()
    assert catalog.commit!=old and catalog.course('course')['title']=='更新课程'
    with store.transaction() as db:assert db.execute('SELECT COUNT(*) AS n FROM shuku_library_courses').fetchone()['n']==2
    # A malformed later manifest cannot partially replace the current catalog.
    manifest=json.loads((root/'course-library.json').read_text());manifest['modules'].append({'directory':'../escape'})
    (root/'course-library.json').write_text(json.dumps(manifest));git(root,'add','.');git(root,'commit','-m','invalid')
    with pytest.raises(BusinessError):catalog.sync()
    assert catalog.course('course')['title']=='更新课程'


def test_local_source_is_not_a_publication_source_and_pin_is_required(store,tmp_path):
    catalog=LibraryCatalog(SimpleNamespace(course_root=tmp_path,root=None,store=store,clock=lambda:0))
    assert catalog.sync()==0 and catalog.courses()==[]
    root,uid,directory,data,catalog=snapshot(tmp_path,store)
    platform=tmp_path/'platform';platform.mkdir();catalog.w.root=platform
    (platform/'course-library.lock.json').write_text(json.dumps({'repository':REPOSITORY,'commit':'0'*40}))
    with pytest.raises(BusinessError,match='不一致'):catalog.sync()
    assert catalog.courses()==[]


def test_catalog_baseline_upgrade_is_explicit_and_repeatable(store):
    from shuku_backend.migrations import VERSION,BASELINE,BASELINE_CHECKSUM,expected_markers
    with store.transaction() as db:
        db.execute('DELETE FROM shuku_schema_migrations WHERE version=%s',(VERSION,))
        db.execute('DROP TABLE shuku_library_courses')
    with pytest.raises(RuntimeError):store.ready()
    store.migrate();store.migrate();store.ready()
    with store.transaction() as db:
        assert {r['version']:r['checksum'] for r in db.execute('SELECT * FROM shuku_schema_migrations').fetchall()}==expected_markers()


def test_public_http_uses_registered_snapshot(api,tmp_path):
    request,app=api
    root,uid,directory,data,catalog=snapshot(tmp_path,app.store)
    app.workflow.course_root=root;app.workflow.library=LibraryCatalog(app.workflow)
    app.workflow.library.sync()
    status,body,_=request('GET','/public/courses')
    assert status==200 and len(body['courses'])==1
    assert body['courses'][0]['kind']=='library' and body['courses'][0]['module_id']==uid
    assert request('GET','/public/library/course')[1]['course']==body['courses'][0]
    assert request('GET','/public/library/missing')[0]==404
    # HTTP never re-reads changed source descriptions, including anonymous use.
    (directory/'outlines.json').write_text('{}')
    assert request('GET','/public/library/course')[1]['course']['title']=='远程课程'
