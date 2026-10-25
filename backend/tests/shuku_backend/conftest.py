from pathlib import Path
import os
import sys
import pytest

sys.path.insert(0,str(Path(__file__).resolve().parents[2]/"src"))
from shuku_backend.storage import Store


@pytest.fixture
def store():
    dsn=os.environ.get("SHUKU_TEST_DATABASE_URL")
    if not dsn:pytest.skip("Set SHUKU_TEST_DATABASE_URL to a disposable MySQL database")
    from sqlalchemy.engine import make_url
    if not (make_url(dsn).database or '').startswith("idl_shuku_test_"):
        raise RuntimeError("Tests require a disposable idl_shuku_test_* database")
    result=Store(dsn)
    result.migrate()
    from shuku_backend.schema import metadata
    with result.engine.connect() as db:
        db.exec_driver_sql('SET FOREIGN_KEY_CHECKS=0')
        try:
            for name in metadata.tables:
                if name not in ('shuku_schema_migrations','shuku_locks'):
                    db.exec_driver_sql('TRUNCATE TABLE `'+name+'`')
        finally:
            db.exec_driver_sql('SET FOREIGN_KEY_CHECKS=1')
    yield result
    result.close()
