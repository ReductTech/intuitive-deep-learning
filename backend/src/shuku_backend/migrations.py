"""Explicit, resumable MySQL baseline migration; serving never performs DDL."""
from hashlib import sha256
from pathlib import Path

from sqlalchemy import inspect, select, text
from sqlalchemy.schema import AddConstraint
from .schema import metadata, schema_migrations, locks

VERSION = "006_local_agent_authoring"
PREVIOUS_VERSION = "005_organization_course_catalog"
PREVIOUS_CHECKSUM = "876334130583ad232c57ebabc71b3e2de8fe899dc8b2e79c9aca66e7d3938115"
DRAFT_VERSION = "004_editor_drafts"
DRAFT_CHECKSUM = "94fd8321d4d6e3b8c140c4b4e736034063fd7a6541b9265bebf91e81787a205d"
LIBRARY_VERSION = "003_official_library_courses"
LIBRARY_CHECKSUM = "d1f7765cb7ba3f37020e651d6bc248705edb4d2ad5e15c6236e16b13a5d5cbdf"
CATALOG_VERSION = "002_remote_course_catalog"
CATALOG_CHECKSUM = "2f0cfefe0be54999bce6364ec6eeec4be0cbeba62dd3123d8e78d50a547c4388"
BASELINE = "001_mysql_sqlalchemy"
BASELINE_CHECKSUM = "aba81a549885761ee0409746d8080eea790f7d7372180aab7c1fd1b08b2bd2bd"

def expected_markers():
    return {BASELINE: BASELINE_CHECKSUM, CATALOG_VERSION: CATALOG_CHECKSUM, LIBRARY_VERSION: LIBRARY_CHECKSUM, DRAFT_VERSION: DRAFT_CHECKSUM, PREVIOUS_VERSION: PREVIOUS_CHECKSUM, VERSION: checksum()}


def checksum():
    return sha256(Path(__file__).with_name("schema.py").read_text(encoding="utf-8").encode()).hexdigest()


def verify(connection):
    inspector = inspect(connection)
    if not set(metadata.tables).issubset(inspector.get_table_names()):
        raise RuntimeError("Run python -m shuku_backend migrate before serving")
    rows = connection.execute(select(schema_migrations)).mappings().all()
    if {row["version"]: row["checksum"] for row in rows} != expected_markers():
        raise RuntimeError("Database schema version/checksum does not match; run shuku_backend migrate")
    for table in metadata.tables.values():
        columns = {column["name"] for column in inspector.get_columns(table.name)}
        if columns != set(table.c.keys()):
            raise RuntimeError("MySQL schema columns do not match this backend")
        actual = {fk["name"] for fk in inspector.get_foreign_keys(table.name)}
        if any(fk.name not in actual for fk in table.foreign_key_constraints):
            raise RuntimeError("Incomplete MySQL migration; run shuku_backend migrate")
        indexes = {index["name"] for index in inspector.get_indexes(table.name)}
        if any(index.name not in indexes for index in table.indexes):
            raise RuntimeError("Incomplete MySQL indexes; run shuku_backend migrate")
    if not connection.execute(select(locks.c.name).where(locks.c.name == "file-references")).scalar():
        raise RuntimeError("Missing file reference guard; run shuku_backend migrate")


def migrate(engine):
    with engine.connect() as connection:
        lock = "shuku-migrate-" + sha256(engine.url.database.encode()).hexdigest()[:40]
        acquired = connection.execute(text("SELECT GET_LOCK(:name, 10)"), {"name": lock}).scalar()
        if acquired != 1:
            raise RuntimeError("Another Shuku schema migration is running")
        try:
            version = connection.dialect.server_version_info
            if version < (8, 0, 16):
                raise RuntimeError("Shuku requires MySQL 8.0.16+ (CHECK constraints and SKIP LOCKED)")
            if inspect(connection).has_table(schema_migrations.name):
                rows = connection.execute(select(schema_migrations)).mappings().all()
                if rows and {r["version"]: r["checksum"] for r in rows} not in (expected_markers(), {k:v for k,v in expected_markers().items() if k != VERSION}, {BASELINE: BASELINE_CHECKSUM, CATALOG_VERSION: CATALOG_CHECKSUM, LIBRARY_VERSION: LIBRARY_CHECKSUM, DRAFT_VERSION: DRAFT_CHECKSUM}, {BASELINE: BASELINE_CHECKSUM, CATALOG_VERSION: CATALOG_CHECKSUM, LIBRARY_VERSION: LIBRARY_CHECKSUM}, {BASELINE: BASELINE_CHECKSUM, CATALOG_VERSION: CATALOG_CHECKSUM}, {BASELINE: BASELINE_CHECKSUM}):
                    raise RuntimeError("Applied schema migration has changed; add an explicit upgrade migration")
            connection.commit()
            # MySQL DDL commits implicitly. Re-running resumes a failed baseline;
            # publish the version marker only after every table and FK exists.
            metadata.create_all(connection)
            inspector = inspect(connection)
            for table in metadata.tables.values():
                actual = {fk["name"] for fk in inspector.get_foreign_keys(table.name)}
                for constraint in table.foreign_key_constraints:
                    if constraint.name not in actual:
                        connection.execute(AddConstraint(constraint))
                indexes = {index["name"] for index in inspector.get_indexes(table.name)}
                for index in table.indexes:
                    if index.name not in indexes:
                        index.create(connection)
            connection.commit()
            with connection.begin():
                from sqlalchemy.dialects.mysql import insert
                guard = insert(locks).values(name="file-references")
                connection.execute(guard.on_duplicate_key_update(name=guard.inserted.name))
                for version, digest in expected_markers().items():
                    marker = insert(schema_migrations).values(version=version, checksum=digest)
                    connection.execute(marker.on_duplicate_key_update(checksum=marker.inserted.checksum))
            verify(connection)
            connection.commit()
        finally:
            connection.rollback()
            try:
                connection.execute(text("SELECT RELEASE_LOCK(:name)"), {"name": lock})
                connection.commit()
            except Exception:
                connection.invalidate()  # A session lock must never return to the pool.
                raise
