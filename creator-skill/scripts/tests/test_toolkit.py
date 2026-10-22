import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import threading
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer

import pytest

from tools import catalog,main as tools_main
from module.init_module import initialize
from checks.course_consistency import compare_course
from capture import capture_slides
from assets.inspect_assets import inspect_assets

ROOT=Path(__file__).resolve().parents[3]
OUTLINE={"title":"Example","pages":[{"id":"one","title":"First","snippet":"Notes"}]}


def test_catalog_entries_exist_and_ids_are_unique():
    tools=catalog()
    assert len({tool['id'] for tool in tools})==len(tools)
    assert {'module.identity','capture.slides','check.module','assets.upload'} <= {tool['id'] for tool in tools}
    assert not any(tool['category']=='specialized' for tool in tools)


def test_unknown_tool_fails_without_launching(monkeypatch):
    monkeypatch.setattr(subprocess,'run',lambda *a,**kw:pytest.fail('must not launch'))
    assert tools_main(['missing-tool'])==2


def test_every_tool_help_is_safe_and_available():
    for tool in catalog():
        result=subprocess.run([sys.executable,str(ROOT/'creator-skill/scripts/tools.py'),tool['id'],'--help'],capture_output=True,text=True,timeout=15)
        assert result.returncode==0,(tool['id'],result.stderr)
        assert result.stdout.strip(),tool['id']


def test_initializer_dry_run_writes_nothing_and_actual_run_never_overwrites(tmp_path):
    result=initialize(tmp_path,'Example',OUTLINE,True)
    assert result['dry_run'] and list(tmp_path.iterdir())==[]
    result=initialize(tmp_path,'Example',OUTLINE)
    directory=tmp_path/'modules/Example'
    assert (directory/'GuidePage.tsx').is_file()
    assert (tmp_path/'assets'/result['uuid']).is_dir()
    before={p.name:p.read_bytes() for p in directory.iterdir()}
    with pytest.raises(ValueError,match='already exists'):initialize(tmp_path,'Example',OUTLINE)
    assert before=={p.name:p.read_bytes() for p in directory.iterdir()}
    # Reuse the actual module validator rather than duplicating expected file rules.
    from checks.validate_module import validate_modules
    assert validate_modules(tmp_path)==[]


def test_initializer_rejects_duplicate_pages_and_copied_identity(tmp_path):
    with pytest.raises(ValueError,match='Duplicate page'):initialize(tmp_path,'Example',{**OUTLINE,'pages':OUTLINE['pages']*2})
    with pytest.raises(ValueError,match='copied moduleIdentity'):initialize(tmp_path,'Example',{**OUTLINE,'moduleIdentity':{'id':'copied'}})
    assert list(tmp_path.iterdir())==[]


def test_consistency_detects_ppt_guide_and_notes_drift():
    valid={'scenes':[{'id':'one','title':'First','notesText':'Notes'}],'guideIds':['one']}
    assert compare_course(OUTLINE,valid)=={'errors':[],'warnings':[]}
    drift={'scenes':[{'id':'different','title':'First'}],'guideIds':['other']}
    assert len(compare_course(OUTLINE,drift)['errors'])==2
    notes={'scenes':[{'id':'one','title':'Changed','notesText':'Different notes'}],'guideIds':['one']}
    assert len(compare_course(OUTLINE,notes)['warnings'])==2


def test_asset_duplicates_are_reported_without_deleting(tmp_path):
    result=initialize(tmp_path,'Example',OUTLINE)
    folder=tmp_path/'assets'/result['uuid']
    (folder/'a.png').write_bytes(b'same')
    (folder/'b.png').write_bytes(b'same')
    report=inspect_assets(tmp_path,'Example',True)
    assert report['duplicateGroups']==[['a.png','b.png']]
    assert (folder/'a.png').exists() and (folder/'b.png').exists()


def test_slide_ids_cannot_escape_output_directory():
    for invalid in ['../escape','a/b','a\\b','..','']:
        with pytest.raises(ValueError):capture_slides.safe_slide_id(invalid)


def test_real_capture_uses_existing_engine_for_default_and_click_states(tmp_path):
    pytest.importorskip('playwright')
    from PIL import Image
    html='''<html><style>html,body{margin:0}main{width:1600px;height:900px;background:rgb(255,0,0)}</style><main data-scene-deck-capture data-deck-id="fixture" data-scene-id="one" data-scene-ids='["one"]'><button onclick="this.parentNode.style.background='rgb(0,0,255)'">Change</button></main></html>'''
    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            self.send_response(200);self.send_header('Content-Type','text/html');self.end_headers();self.wfile.write(html.encode())
        def log_message(self,*args):pass
    server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
    thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    try:
        try:
            with capture_slides.browser_session(f'http://127.0.0.1:{server.server_port}') as (context,address):
                assert capture_slides.scene_ids(context,address,'fixture')==['one']
                before=capture_slides.capture_slide(context,address,'fixture','one',0)
                after=capture_slides.capture_slide(context,address,'fixture','one',0,[{'action':'click','selector':'button'}])
                assert before.size==after.size==(1600,900)
                assert before.getpixel((1000,500))==(255,0,0)
                assert after.getpixel((1000,500))==(0,0,255)
                assert after.resize(capture_slides.THUMBNAIL_SIZE).size==(400,225)
        except RuntimeError as exc:
            if 'No supported Chromium' in str(exc):pytest.skip(str(exc))
            raise
    finally:server.shutdown();server.server_close();thread.join(timeout=5)


def test_generated_scaffold_typechecks_against_real_shared(tmp_path):
    from module.init_module import plan_module
    _,files=plan_module(tmp_path,'Example',OUTLINE)
    result=subprocess.run(['node',str(Path(__file__).with_name('typecheck_scaffold.mjs'))],input=json.dumps(files),text=True,capture_output=True,cwd=ROOT,timeout=60)
    assert result.returncode==0,result.stdout+result.stderr


def test_initializer_asset_failure_does_not_register_partial_course(tmp_path):
    (tmp_path/'assets').write_text('not a directory')
    with pytest.raises(OSError):initialize(tmp_path,'Example',OUTLINE)
    assert not (tmp_path/'modules/Example').exists()


def test_legacy_capture_help_forwards():
    import os
    environment={**os.environ,'PYTHONPATH':str(ROOT/'backend/src')}
    result=subprocess.run([sys.executable,'-m','idl_backend.tools.content.generate_scenedeck_thumbnails','--help'],cwd=ROOT,env=environment,text=True,capture_output=True,timeout=10)
    assert result.returncode==0,result.stderr
