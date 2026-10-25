"""SQLAlchemy connections and typed parameters for the MySQL business store."""
from dataclasses import dataclass
import json
from uuid import UUID

from sqlalchemy import JSON, bindparam, create_engine, event, text
from sqlalchemy.engine import make_url
from sqlalchemy.exc import IntegrityError
from sqlalchemy.dialects.mysql import insert


@dataclass(frozen=True)
class JsonValue:
    value: object


def mysql_url(value):
    url = make_url(value)
    if url.drivername not in {"mysql", "mysql+mysqlconnector"} or not url.database:
        raise ValueError("SHUKU_DATABASE_URL must name a MySQL database (mysql+mysqlconnector://.../database)")
    return url.set(drivername="mysql+mysqlconnector")


def engine_for(value):
    engine = create_engine(mysql_url(value), pool_pre_ping=True, pool_recycle=1800,
                           pool_size=8, max_overflow=8, pool_timeout=5,
                           isolation_level="READ COMMITTED", hide_parameters=True,
                           connect_args={"connection_timeout": 5, "charset": "utf8mb4", "collation": "utf8mb4_bin"})

    @event.listens_for(engine, "connect")
    def session_limits(connection, _record):
        cursor = connection.cursor()
        try:
            cursor.execute("SET SESSION innodb_lock_wait_timeout = 3")
            cursor.execute("SET SESSION max_execution_time = 10000")
        finally:
            cursor.close()
    return engine


JSON_COLUMNS = {"payload", "files", "checkpoint", "result", "resource_ids", "completed"}
BOOL_COLUMNS = {"active", "deleting", "allow_destroy", "external", "granted_creator", "completed",
                "can_review", "available", "needs_retry", "actionable"}


def row_view(row):
    if row is None:
        return None
    result = dict(row)
    for key, value in result.items():
        if key in JSON_COLUMNS and isinstance(value, (str, bytes)):
            try:
                result[key] = json.loads(value)
            except (ValueError, TypeError):
                pass  # removal_objects.result is a status string, not JSON.
        if key in BOOL_COLUMNS and isinstance(result[key], int):
            result[key] = bool(result[key])
    return result


class Result:
    def __init__(self, result):
        self.result = result

    @property
    def rowcount(self):
        return self.result.rowcount

    def fetchone(self):
        return row_view(self.result.mappings().fetchone())

    def fetchall(self):
        return [row_view(row) for row in self.result.mappings().fetchall()]


class Connection:
    def __init__(self, connection):
        self.connection = connection

    def execute(self, sql, parameters=()):
        """Bind all values through SQLAlchemy; tuples/lists are expanding IN parameters."""
        if not isinstance(sql, str):
            return Result(self.connection.execute(sql))
        parts = sql.split("%s")
        if len(parts) != len(parameters) + 1:
            raise ValueError("SQL parameter count mismatch")
        values = {}; bindings = []; query = parts[0]
        for i, value in enumerate(parameters):
            name = f"p{i}"
            if isinstance(value, JsonValue):
                bindings.append(bindparam(name, type_=JSON()))
                value = value.value
            elif isinstance(value, (list, tuple)):
                bindings.append(bindparam(name, expanding=True))
                value = [str(item) if isinstance(item, UUID) else item for item in value]
            elif isinstance(value, UUID):
                value = str(value)
            values[name] = value
            query += ":" + name + parts[i + 1]
        statement = text(query).bindparams(*bindings)
        return Result(self.connection.execute(statement, values))

    def insert_once(self, sql, parameters):
        """Ignore duplicate keys only, never invalid JSON, foreign keys or truncated data."""
        try:
            with self.connection.begin_nested():
                self.execute(sql, parameters)
            return True
        except IntegrityError as exc:
            if getattr(exc.orig, "errno", None) != 1062:
                raise
            return False

    def upsert(self, table, values, update):
        from .schema import metadata
        target = metadata.tables["shuku_" + table]
        values = {key: str(value) if isinstance(value, UUID) else value for key, value in values.items()}
        statement = insert(target).values(**values)
        assignments = {key: statement.inserted[key] for key in update}
        self.connection.execute(statement.on_duplicate_key_update(**assignments))

    def upsert_pull_request(self, values):
        from sqlalchemy import case, or_
        from .schema import github_external_prs as target
        statement = insert(target).values(**values)
        changed = or_(target.c.head_sha != statement.inserted.head_sha,
                      target.c.base_sha != statement.inserted.base_sha)
        # MySQL evaluates assignments left to right. Test the old SHAs first,
        # atomically with the update, so a concurrent review cannot survive a new head.
        assignments = [("review_state", case((changed, "pending"), else_=target.c.review_state)),
                       ("approved_sha", case((changed, None), else_=target.c.approved_sha))]
        assignments += [(key, statement.inserted[key]) for key in
                        ("head_sha", "base_sha", "title", "state", "updated_at")]
        self.connection.execute(statement.on_duplicate_key_update(assignments))

    def file_reference_lock(self, shared=False):
        # A pre-existing InnoDB guard row gives transaction-scoped shared/exclusive locks.
        # It is released on commit/rollback, unlike MySQL GET_LOCK session locks.
        return self.execute("SELECT name FROM shuku_locks WHERE name='file-references' " +
                            ("FOR SHARE" if shared else "FOR UPDATE")).fetchone()
