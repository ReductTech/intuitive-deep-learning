from dataclasses import replace
from hashlib import sha256
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import pytest
from shuku_backend.settings import Settings
from shuku_backend.files import Bucket
from shuku_backend.application import create_application
from shuku_backend.storage import DEMO_USERS


def settings(tmp_path,dsn="mysql+mysqlconnector://test@localhost/idl_shuku_test_unit"):
    return Settings(dsn,tmp_path/"bucket","http://localhost:5173","test-only-password",port=0)


def test_settings_fail_closed(tmp_path):
    config=settings(tmp_path)
    assert 'test-only-password' not in repr(config)
    for change in [dict(auth_provider="jianlun"),dict(demo_password=""),dict(origin="https://host/path"),dict(database_url="sqlite:///bad"),dict(bucket_dir=Path("relative"))]:
        with pytest.raises(ValueError):replace(config,**change)


def test_bucket_deduplicates_and_detects_corruption(tmp_path):
    bucket=Bucket(tmp_path/"bucket")
    with ThreadPoolExecutor(max_workers=3) as pool:
        objects=list(pool.map(bucket.put,[b"same"]*3))
    assert objects[0]==objects[1]==objects[2]
    assert len(list((tmp_path/"bucket"/"sha256").rglob('*')))==2
    digest=objects[0]["sha256"]
    assert bucket.read(digest)==b"same"
    bucket.path(digest).write_bytes(b"corrupt")
    with pytest.raises(ValueError,match="checksum"):bucket.read(digest)
    for key in ['../secret','x'*64,'a'*63]:
        with pytest.raises(ValueError):bucket.read(key)


def test_bucket_rejects_symlink_escape(tmp_path):
    bucket=Bucket(tmp_path/"bucket")
    external=tmp_path/"outside";external.mkdir()
    (bucket.root/"sha256").symlink_to(external,target_is_directory=True)
    with pytest.raises(ValueError,match="leaves bucket"):bucket.put(b"data")


def test_migrations_and_explicit_demo_seeding(store,tmp_path):
    store.migrate();store.ready()
    app=create_application(settings(tmp_path,store.database_url))
    with store.transaction() as db:
        assert db.execute("SELECT count(*) AS n FROM shuku_users").fetchone()["n"]==0
    app.close()
    with pytest.raises(RuntimeError,match="runtime dependencies"):
        create_application(replace(settings(tmp_path,store.database_url),source_root=tmp_path/"missing"))
    store.seed_demo();store.seed_demo()
    with store.transaction() as db:
        assert db.execute("SELECT count(*) AS n FROM shuku_users").fetchone()["n"]==3
        db.execute("UPDATE shuku_users SET role='admin' WHERE username='linzhi'")
    with pytest.raises(RuntimeError,match="conflicts"):store.seed_demo()


def test_ready_does_not_migrate_or_ignore_checksum(store,tmp_path):
    with store.transaction() as db:db.execute("UPDATE shuku_schema_migrations SET checksum='bad'")
    try:
        with pytest.raises(RuntimeError):create_application(settings(tmp_path,store.database_url))
        with pytest.raises(RuntimeError):store.migrate()
    finally:
        from shuku_backend.migrations import expected_markers
        with store.transaction() as db:
            for version,digest in expected_markers().items():
                db.execute("UPDATE shuku_schema_migrations SET checksum=%s WHERE version=%s",(digest,version))
