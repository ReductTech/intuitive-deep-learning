from io import BytesIO
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
from xml.sax.saxutils import escape
from uuid import uuid4
import json
import threading
from http.client import HTTPConnection
from pathlib import Path
import pytest
from shuku_backend.presentations import parse_pptx,read_upload,import_course,project_from_presentation
from shuku_backend.errors import BusinessError
from shuku_backend.application import create_application
from shuku_backend.settings import Settings
from shuku_backend.storage import DEMO_USERS


def pptx(*,blank=False,overrides=None):
    # Presentation order deliberately differs from filename order; notes include a slide number.
    p='http://schemas.openxmlformats.org/presentationml/2006/main';a='http://schemas.openxmlformats.org/drawingml/2006/main'
    r='http://schemas.openxmlformats.org/officeDocument/2006/relationships'
    def shape(text,kind='body'):
        return f'<p:sp><p:nvSpPr><p:nvPr><p:ph type="{kind}"/></p:nvPr></p:nvSpPr><p:txBody><a:p><a:r><a:t>{escape(text)}</a:t></a:r></a:p></p:txBody></p:sp>'
    def slide(title,text):
        return f'<p:sld xmlns:p="{p}" xmlns:a="{a}"><p:cSld><p:spTree>{shape(title,"title")+shape(text) if title else ""}</p:spTree></p:cSld></p:sld>'
    entries={
        'ppt/presentation.xml':f'<p:presentation xmlns:p="{p}" xmlns:r="{r}"><p:sldIdLst><p:sldId r:id="r2"/><p:sldId r:id="r1"/></p:sldIdLst></p:presentation>',
        'ppt/_rels/presentation.xml.rels':'<Relationships><Relationship Id="r1" Target="slides/slide1.xml"/><Relationship Id="r2" Target="slides/slide2.xml"/></Relationships>',
        'ppt/slides/slide1.xml':slide('','') if blank else slide('工具调用','使用天气查询工具'),
        'ppt/slides/slide2.xml':slide('Agent 是什么','<script>只是课件文字</script>'),
        'ppt/slides/_rels/slide2.xml.rels':f'<Relationships><Relationship Id="n1" Target="../notesSlides/notesSlide1.xml" Type="{r}/notesSlide"/></Relationships>',
        'ppt/notesSlides/notesSlide1.xml':f'<p:notes xmlns:p="{p}" xmlns:a="{a}">{shape("用生活案例引入")}{shape("2","sldNum")}</p:notes>',
    }
    entries.update(overrides or {})
    output=BytesIO()
    with ZipFile(output,'w',ZIP_DEFLATED) as archive:
        for name,value in entries.items():archive.writestr(ZipInfo(name,date_time=(2020,1,1,0,0,0)),value,compress_type=ZIP_DEFLATED)
    return output.getvalue()


def multipart(data,content,filename='课程.pptx'):
    body=b'--ppt-test\r\nContent-Disposition: form-data; name="metadata"\r\n\r\n'+json.dumps(data).encode()+b'\r\n--ppt-test\r\nContent-Disposition: form-data; name="file"; filename="'+filename.encode()+b'"\r\nContent-Type: application/octet-stream\r\n\r\n'+content+b'\r\n--ppt-test--\r\n'
    return 'multipart/form-data; boundary=ppt-test',body


def test_order_text_notes_and_imported_outline():
    parsed=parse_pptx(pptx(blank=True),'课程.pptx')
    assert parsed['slides'][0]['title']=='Agent 是什么'
    assert parsed['slides'][0]['body']=='<script>只是课件文字</script>'
    assert parsed['slides'][0]['notes']=='用生活案例引入'
    assert parsed['warnings']==['第 2 页未读取到文字，请补充图片中的内容。']
    project=project_from_presentation(parsed,'我的课','简介','custom-test')
    assert len(project['pages'])==2 and not project['outlineConfirmed']
    state=project['pages'][0]['outline']['guided']
    assert state['phase']=='choices' and state['reference']==parsed['slides'][0]
    assert state['suggestions'] and not project['pages'][0]['ready']
    content_type,body=multipart({'title':'我的课'},pptx())
    data,content,filename=read_upload(content_type,body)
    assert data['title']=='我的课' and content==pptx() and filename=='课程.pptx'


@pytest.mark.parametrize('overrides',[
    {'../escape':'unsafe'},
    {'ppt/presentation.xml':'<!DOCTYPE p [<!ENTITY x "x">]><p>&x;</p>'},
    {'ppt/presentation.xml':'<!DOCTYPE p [<!ENTITY x "x">]><p>&x;</p>'.encode('utf-16')},
    {'ppt/_rels/presentation.xml.rels':'<Relationships><Relationship Id="r2" Target="https://external/slide.xml" TargetMode="External"/></Relationships>'},
    {'ppt/slides/slide2.xml':'<broken'},
    {'ppt/vbaProject.bin':b'macro'},
])
def test_unsafe_or_invalid_packages_are_rejected(overrides):
    with pytest.raises(BusinessError):parse_pptx(pptx(overrides=overrides),'course.pptx')


def test_legacy_corrupt_and_invalid_uploads():
    for content,name in [(pptx(),'course.ppt'),(b'not a zip','course.pptx'),(b'','course.pptx')]:
        with pytest.raises(BusinessError):parse_pptx(content,name)
    with pytest.raises(BusinessError):read_upload('application/json',b'{}')
    with pytest.raises(BusinessError):read_upload('multipart/form-data; boundary=missing',b'invalid')


def test_page_and_xml_limits():
    ids=''.join('<p:sldId r:id="r2"/>' for _ in range(101))
    oversized=f'<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><p:sldIdLst>{ids}</p:sldIdLst></p:presentation>'
    with pytest.raises(BusinessError,match='1～100'):parse_pptx(pptx(overrides={'ppt/presentation.xml':oversized}),'large.pptx')
    with pytest.raises(BusinessError):parse_pptx(pptx(overrides={'ppt/slides/slide2.xml':' '* (2*1024*1024+1)}),'large.pptx')


@pytest.fixture
def app(store,tmp_path):
    store.seed_demo()
    value=create_application(Settings(store.database_url,tmp_path/'bucket','http://localhost:5175','test-password',port=0,source_root=Path(__file__).resolve().parents[3]))
    try:yield value
    finally:value.close()


def test_atomic_import_preserves_original_and_private_reference_across_saves(app,monkeypatch):
    uid=DEMO_USERS[1][0];module=app.workflow.modules()[0]
    data={'title':'上传课程','description':'已有内容','category':'人工智能','module_id':module['id']}
    result=import_course(app.workflow,uid,data,pptx(),'我的课.pptx');cid=result['course']['id'];rid=result['revision']['id']
    revision=app.workflow.revision(uid,rid);project=revision['project']
    assert project['presentation']['filename']=='我的课.pptx'
    assert project['pages'][0]['summary']=='<script>只是课件文字</script>'
    assert app.worker.run_once()
    assert app.workflow.revision(uid,rid)['state']=='ready'
    with pytest.raises(BusinessError):app.workflow.revision(DEMO_USERS[0][0],rid)
    with pytest.raises(BusinessError):app.workflow.file(uid,rid,'materials/original.pptx')
    project['pages'][0]['title']='我修改后的标题'
    saved=app.workflow.save(uid,cid,{'project':project,'expected_revision':rid})
    with app.store.transaction() as db:
        row=db.execute('SELECT files FROM shuku_revisions WHERE id=%s',(saved['id'],)).fetchone()
        assert app.bucket.read(row['files']['materials/original.pptx']['sha256'])==pptx()
        export=app.workflow.github.export(row)
        assert not any('materials/' in name for name in export)
        assert b'presentation' not in export['courses/project.json']
    before=len(app.store.courses(uid))
    with pytest.raises(BusinessError):import_course(app.workflow,uid,data,b'corrupt','course.pptx')
    assert len(app.store.courses(uid))==before

    def fail(*args,**kwargs):raise RuntimeError('simulated save failure')
    monkeypatch.setattr(app.workflow,'save_in',fail)
    with pytest.raises(RuntimeError):import_course(app.workflow,uid,data,pptx(),'course.pptx')
    assert len(app.store.courses(uid))==before


def test_original_is_reclaimed_after_permanent_course_removal(app):
    uid=DEMO_USERS[1][0];admin=DEMO_USERS[2][0]
    result=import_course(app.workflow,uid,{'title':'待删除 PPT','module_id':app.workflow.modules()[0]['id']},pptx(),'课.pptx')
    with app.store.transaction() as db:
        files=db.execute('SELECT files FROM shuku_revisions WHERE id=%s',(result['revision']['id'],)).fetchone()['files']
        digest=files['materials/original.pptx']['sha256']
    assert app.bucket.path(digest).is_file()
    app.workflow.governance.request(admin,'course',result['course']['id'],{'confirm':True})
    assert app.worker.run_once()
    assert app.workflow.governance.listing(admin)[0]['state']=='succeeded'
    assert not app.bucket.path(digest).exists()


def test_http_upload_auth_csrf_and_success(app):
    server=app.server();thread=threading.Thread(target=server.serve_forever);thread.start()
    try:
        conn=HTTPConnection(*server.server_address,timeout=10)
        conn.request('POST','/api/shuku/auth/login',json.dumps({'username':'xiaoman','password':'test-password'}),{'Content-Type':'application/json','Origin':app.settings.origin})
        response=conn.getresponse();assert response.status==200;cookie=response.getheader('Set-Cookie').split(';')[0];response.read();conn.close()
        ctype,body=multipart({'title':'HTTP 导入','module_id':app.workflow.modules()[0]['id']},pptx())
        for session,origin,expected in [('',app.settings.origin,401),(cookie,'https://elsewhere',403),(cookie,app.settings.origin,201)]:
            conn=HTTPConnection(*server.server_address,timeout=15)
            conn.request('POST','/api/shuku/courses/import-presentation',body,{'Content-Type':ctype,'Cookie':session,'Origin':origin})
            response=conn.getresponse();payload=json.loads(response.read());conn.close()
            assert response.status==expected,payload
        assert len(app.store.courses(DEMO_USERS[1][0]))==1
    finally:server.shutdown();server.server_close();thread.join()
