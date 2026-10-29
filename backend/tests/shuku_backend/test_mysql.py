"""MySQL-specific migration recovery and transaction/error semantics."""
from uuid import uuid4

import pytest
from sqlalchemy.exc import IntegrityError

from shuku_backend.database import mysql_url


@pytest.mark.parametrize('url', ['mssql://user@localhost/business', 'sqlite:///business',
                                 'mysql+mysqlconnector://user@localhost'])
def test_only_explicit_mysql_database_is_accepted(url):
    with pytest.raises(ValueError):
        mysql_url(url)


def test_rollback_and_duplicate_suppression_do_not_hide_foreign_key_errors(store):
    uid=str(uuid4())
    with store.transaction() as db:
        db.execute("INSERT INTO shuku_users VALUES (%s,'unicode-user','教学🙂','learner',true)",(uid,))
    with pytest.raises(RuntimeError,match='rollback'):
        with store.transaction() as db:
            db.execute("UPDATE shuku_users SET display_name='未提交' WHERE id=%s",(uid,))
            raise RuntimeError('rollback')
    with store.transaction() as db:
        assert db.execute('SELECT display_name FROM shuku_users WHERE id=%s',(uid,)).fetchone()['display_name']=='教学🙂'
        assert not db.insert_once("INSERT INTO shuku_users VALUES (%s,'unicode-user','重复','learner',true)",(uuid4(),))
        with pytest.raises(IntegrityError) as error:
            db.insert_once('INSERT INTO shuku_sessions VALUES (%s,%s,100)',('a'*64,uuid4()))
        assert error.value.orig.errno==1452
        assert db.execute('SELECT count(*) AS n FROM shuku_users').fetchone()['n']==1


def test_explicit_migration_repairs_missing_indexes_and_foreign_keys(store):
    with store.engine.connect() as connection:
        connection.exec_driver_sql('ALTER TABLE shuku_tasks DROP INDEX task_claim')
        connection.exec_driver_sql('ALTER TABLE shuku_sessions DROP FOREIGN KEY fk_sessions_user_id')
    with pytest.raises(RuntimeError):store.ready()
    store.migrate()
    store.ready()
