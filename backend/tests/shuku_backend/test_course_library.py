from dataclasses import replace
from pathlib import Path
import json
import shutil
import pytest
from shuku_backend.settings import Settings
from shuku_backend.workflow import Workflow
from test_workflow import workflow,save_ready


def test_missing_or_invalid_configured_snapshot_does_not_fallback(tmp_path):
    base=Settings('mysql+mysqlconnector://test@localhost/idl_shuku_test_unit',tmp_path/'bucket','http://localhost:5175','test-only')
    with pytest.raises((ValueError,FileNotFoundError)):replace(base,course_root=tmp_path/'missing')
    with pytest.raises(ValueError):replace(base,course_root=Path('relative'))


def test_external_catalog_and_native_preview_build(workflow,tmp_path):
    app,course,project,uid,admin=workflow
    root=Path(app.workflow.root);library=tmp_path/'external-library'
    context=app.workflow.module_context(course['module_id']);directory=Path(context['directory']).name
    shutil.copytree(root/'modules'/directory,library/'modules'/directory)
    shutil.copytree(root/'modules/shared',library/'modules/shared')
    assets=root/'assets'/course['module_id']
    if assets.exists():shutil.copytree(assets,library/'assets'/course['module_id'])
    (library/'course-library.json').write_text(json.dumps({'schema':1,'repository':'reduct-shuku/intuitive-deep-learning','modules':[directory]}))
    # Native courses may import HTML/JS as text and use SVG from CSS.
    entry=library/'modules'/directory/context['entry']
    entry.write_text(entry.read_text()+"\nimport fixture from './fixture.html?raw';import './fixture.css';console.log(fixture);const pages=import.meta.glob('./fixture-*.ts',{eager:true});console.log(pages);\n")
    (entry.parent/'fixture-page.ts').write_text('export const value="glob resource marker";')
    (entry.parent/'fixture.html').write_text('<section>raw resource marker</section>')
    (entry.parent/'fixture.css').write_text('.fixture {cursor:url(./cursor.svg),auto;}')
    (entry.parent/'cursor.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>')
    app.workflow.course_root=library
    modules=app.workflow.modules();assert len(modules)==1 and Path(modules[0]['directory']).is_relative_to(library)
    project['pages'][0].update(nativeId=modules[0]['pages'][0],format='text')
    revision=save_ready(app,course,project,uid)
    assert app.workflow.file(uid,revision['id'],'index.html')[0]
    bundle=app.workflow.file(uid,revision['id'],'bundle.js')[0]
    assert b'raw resource marker' in bundle and b'glob resource marker' in bundle
    assert b'import.meta.glob' not in bundle
    with app.store.transaction() as db:files=db.execute('SELECT files FROM shuku_revisions WHERE id=%s',(revision['id'],)).fetchone()['files']
    svg=next(name for name in files if name.startswith('static/') and name.endswith('.svg'))
    assert b'<svg' in app.workflow.file(uid,revision['id'],svg)[0]
    assert Path(app.workflow.module_context(course['module_id'])['directory']).is_relative_to(library)
