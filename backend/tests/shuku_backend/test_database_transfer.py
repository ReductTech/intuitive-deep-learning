"""Offline database moves are scoped, verified and reversible; fixtures are disposable."""
import copy
import json
import os
from uuid import uuid4
import pytest
from sqlalchemy import text
from shuku_backend.database import database_url_from_env
from shuku_backend.database_transfer import (digest, export_snapshot, import_snapshot, manifest,
                                             validate, write_snapshot, RESERVED)
from shuku_backend.schema import metadata
from shuku_backend.settings import Settings
from test_collaboration import published, CONTRIBUTOR
from test_workflow import workflow


def clear_business(store):
    assert store.engine.url.database.startswith('idl_shuku_test_')
    with store.engine.begin() as db:
        db.execute(text('SET SESSION FOREIGN_KEY_CHECKS=0'))
        try:
            for table in metadata.tables.values():
                if table.name not in RESERVED:
                    db.execute(table.delete())
        finally:
            db.execute(text('SET SESSION FOREIGN_KEY_CHECKS=1'))


def test_external_alias_and_legacy_configuration_do_not_silently_choose_a_database(tmp_path, monkeypatch):
    first='mysql+mysqlconnector://test:secret-marker@localhost/idl_shuku_test_first'
    second='mysql+mysqlconnector://test:other-marker@localhost/idl_shuku_test_second'
    assert database_url_from_env({'MYSQL_URL_TEST':first})==first
    assert database_url_from_env({'SHUKU_DATABASE_URL':first})==first
    assert database_url_from_env({'SHUKU_DATABASE_URL':first,'MYSQL_URL_TEST':first})==first
    with pytest.raises(ValueError) as error:database_url_from_env({'SHUKU_DATABASE_URL':first,'MYSQL_URL_TEST':second})
    assert 'secret-marker' not in str(error.value) and 'other-marker' not in str(error.value)
    with pytest.raises(ValueError):database_url_from_env({})
    monkeypatch.delenv('SHUKU_DATABASE_URL',raising=False);monkeypatch.setenv('MYSQL_URL_TEST',first)
    monkeypatch.setenv('SHUKU_BUCKET_DIR',str(tmp_path/'bucket'));monkeypatch.setenv('SHUKU_PUBLIC_ORIGIN','https://example.test:5173');monkeypatch.setenv('SHUKU_DEMO_PASSWORD','test-only')
    settings=Settings.from_env()
    assert settings.database_url==first and 'secret-marker' not in repr(settings)


def test_complete_round_trip_preserves_circular_keys_generated_columns_json_and_other_tables(published,tmp_path):
    app,course,project,owner,admin,release,old=published;store=app.store
    wid=app.workflow.collaboration.create(CONTRIBUTOR,course['id'],{})['id']
    store.enqueue('migration.fixture','fixture','migration-fixture',{'text':'课程🙂','nested':[1,True,None]},app.clock())
    with store.engine.begin() as db:
        db.exec_driver_sql('CREATE TABLE IF NOT EXISTS other_application_probe(value VARCHAR(80))')
        db.exec_driver_sql("INSERT INTO other_application_probe VALUES ('keep-existing-data')")
    try:
        document=export_snapshot(store.engine);path=tmp_path/'backup.json';write_snapshot(path,document)
        if os.name!='nt':assert path.stat().st_mode&0o777==0o600
        with pytest.raises(FileExistsError):write_snapshot(path,document)
        assert 'other_application_probe' not in document['tables']
        assert next(row for row in document['tables']['shuku_workspaces']['rows'] if row['id']==wid)['active_base']==1
        clear_business(store)
        result=import_snapshot(store.engine,json.loads(path.read_text(encoding='utf-8')))
        assert not result['already_imported']
        assert manifest(export_snapshot(store.engine))==manifest(document)
        assert import_snapshot(store.engine,document)['already_imported']
        with store.engine.connect() as db:
            assert db.execute(text('SELECT value FROM other_application_probe')).scalar()=='keep-existing-data'
            assert db.execute(text('SELECT @@SESSION.FOREIGN_KEY_CHECKS')).scalar()==1
    finally:
        with store.engine.begin() as db:db.exec_driver_sql('DROP TABLE other_application_probe')


def test_invalid_foreign_key_rolls_back_every_owned_row_and_restores_connection_state(store):
    store.seed_demo();document=export_snapshot(store.engine);clear_business(store)
    item=document['tables']['shuku_profiles'];item['rows']=[{'user_id':str(uuid4()),'bio':'orphan','email':'','updated_at':1.0}];item['count']=1;item['sha256']=digest(item['rows'])
    with pytest.raises(ValueError,match='invalid foreign key'):import_snapshot(store.engine,document)
    current=export_snapshot(store.engine)
    assert all(not item['count'] for name,item in current['tables'].items() if name not in RESERVED)
    with store.engine.connect() as db:assert db.execute(text('SELECT @@SESSION.FOREIGN_KEY_CHECKS')).scalar()==1


def test_nonempty_target_and_tampered_snapshots_are_rejected_without_changes(store):
    store.seed_demo();document=export_snapshot(store.engine)
    with store.engine.begin() as db:db.execute(text("UPDATE shuku_users SET display_name='target-only-change' WHERE username='admin'"))
    before=manifest(export_snapshot(store.engine))
    with pytest.raises(ValueError,match='refusing to overwrite'):import_snapshot(store.engine,document)
    assert manifest(export_snapshot(store.engine))==before
    broken=copy.deepcopy(document);broken['tables']['shuku_users']['rows'][0]['display_name']='tampered'
    with pytest.raises(ValueError,match='checksum'):import_snapshot(store.engine,broken)
    broken=copy.deepcopy(document);broken['tables']['other_app']={'rows':[],'count':0,'sha256':digest([])}
    with pytest.raises(ValueError,match='exactly the owned'):validate(broken)
    broken=copy.deepcopy(document);broken['tables']['shuku_users']['rows'][0]['unknown_column']='wrong'
    with pytest.raises(ValueError,match='columns mismatch'):validate(broken)
    assert manifest(export_snapshot(store.engine))==before
