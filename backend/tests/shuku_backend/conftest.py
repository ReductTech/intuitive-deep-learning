from pathlib import Path
import os
import sys
import pytest

sys.path.insert(0,str(Path(__file__).resolve().parents[2]/"src"))
from shuku_backend.storage import Store


@pytest.fixture
def store():
    dsn=os.environ.get("SHUKU_TEST_DATABASE_URL")
    if not dsn:pytest.skip("Set SHUKU_TEST_DATABASE_URL to a disposable PostgreSQL database")
    from urllib.parse import urlsplit
    if not urlsplit(dsn).path.removeprefix("/").startswith("idl_shuku_test_"):
        raise RuntimeError("Tests require a disposable idl_shuku_test_* database")
    result=Store(dsn)
    result.migrate()
    with result.transaction() as db:
        db.execute("TRUNCATE shuku_business.users,shuku_business.tasks,shuku_business.login_attempts RESTART IDENTITY CASCADE")
    return result
