"""Offline SQLAlchemy-only transfer of owned tables; never clears or overwrites a target."""
import argparse
import hashlib
import json
import os
from pathlib import Path

from sqlalchemy import and_, exists, select, text
from .database import engine_for, database_url_from_env
from .migrations import expected_markers, verify
from .schema import metadata

FORMAT = 'shuku-mysql-snapshot/v1'
RESERVED = {'shuku_schema_migrations', 'shuku_locks'}


def digest(rows):
    data = json.dumps(rows, ensure_ascii=False, sort_keys=True, separators=(',', ':'), allow_nan=False)
    return hashlib.sha256(data.encode()).hexdigest()


def snapshot(connection):
    verify(connection)
    tables = {}
    for table in metadata.tables.values():
        assert table.name.startswith('shuku_')
        rows = [dict(row) for row in connection.execute(select(table).order_by(*table.primary_key.columns)).mappings()]
        tables[table.name] = {'rows': rows, 'count': len(rows), 'sha256': digest(rows)}
    return {'format': FORMAT, 'versions': expected_markers(), 'tables': tables}


def validate(document):
    if document.get('format') != FORMAT or document.get('versions') != expected_markers():
        raise ValueError('Snapshot format/schema does not match this backend')
    if set(document.get('tables', {})) != set(metadata.tables):
        raise ValueError('Snapshot must contain exactly the owned Shuku tables')
    for name, item in document['tables'].items():
        rows = item.get('rows')
        if not isinstance(rows, list) or item.get('count') != len(rows):
            raise ValueError('Snapshot row count mismatch: ' + name)
        if any(not isinstance(row, dict) or set(row) != set(metadata.tables[name].c.keys()) for row in rows):
            raise ValueError('Snapshot columns mismatch: ' + name)
        if item.get('sha256') != digest(rows):
            raise ValueError('Snapshot checksum mismatch: ' + name)


def manifest(document):
    validate(document)
    return {name: {key: item[key] for key in ('count', 'sha256')} for name, item in document['tables'].items()}


def export_snapshot(engine):
    with engine.connect().execution_options(isolation_level='REPEATABLE READ') as connection:
        with connection.begin():
            return snapshot(connection)


def foreign_keys_valid(connection):
    for table in metadata.tables.values():
        for constraint in table.foreign_key_constraints:
            parent = constraint.referred_table.alias()
            present = and_(*(element.parent.is_not(None) for element in constraint.elements))
            match = and_(*(element.parent == parent.c[element.column.name] for element in constraint.elements))
            missing = select(table).where(present, ~exists(select(1).select_from(parent).where(match))).limit(1)
            if connection.execute(missing).first() is not None:
                raise ValueError('Snapshot contains an invalid foreign key: ' + constraint.name)


def import_snapshot(engine, document):
    validate(document)
    expected = manifest(document)
    with engine.connect() as connection:
        try:
            with connection.begin():
                current = snapshot(connection)
                if manifest(current) == expected:
                    foreign_keys_valid(connection)
                    return {'already_imported': True, 'tables': expected}
                if any(current['tables'][name]['count'] for name in metadata.tables if name not in RESERVED):
                    raise ValueError('Target contains Shuku business data; refusing to overwrite')
                if any(current['tables'][name] != document['tables'][name] for name in RESERVED):
                    raise ValueError('Target schema markers/guard do not match the snapshot')
                # Circular course/revision/release references are checked explicitly before commit.
                connection.execute(text('SET SESSION FOREIGN_KEY_CHECKS=0'))
                for table in metadata.tables.values():
                    if table.name in RESERVED:
                        continue
                    columns = [column.name for column in table.c if column.computed is None]
                    rows = document['tables'][table.name]['rows']
                    for start in range(0, len(rows), 200):
                        batch = [{key: row[key] for key in columns} for row in rows[start:start + 200]]
                        connection.execute(table.insert(), batch)
                foreign_keys_valid(connection)
                if manifest(snapshot(connection)) != expected:
                    raise ValueError('Target row/checksum verification failed')
            return {'already_imported': False, 'tables': expected}
        finally:
            try:
                connection.execute(text('SET SESSION FOREIGN_KEY_CHECKS=1'))
                connection.commit()
            except Exception:
                connection.invalidate()
                raise


def write_snapshot(path, document):
    validate(document)
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, 'w', encoding='utf-8') as stream:
        json.dump(document, stream, ensure_ascii=False, sort_keys=True, allow_nan=False)


def main():
    parser = argparse.ArgumentParser(description='Offline Shuku-only MySQL snapshot/restore; stop HTTP and workers first')
    parser.add_argument('command', choices=('export', 'import', 'verify'))
    parser.add_argument('--file', type=Path, required=True)
    args = parser.parse_args()
    engine = engine_for(database_url_from_env())
    try:
        if args.command == 'export':
            document = export_snapshot(engine)
            write_snapshot(args.file, document)
            result = manifest(document)
        else:
            document = json.loads(args.file.read_text(encoding='utf-8'))
            validate(document)
            if args.command == 'import':
                result = import_snapshot(engine, document)['tables']
            else:
                result = manifest(export_snapshot(engine))
                if result != manifest(document):
                    raise ValueError('Database does not match the snapshot')
        print(json.dumps({'tables': len(result), 'rows': sum(item['count'] for item in result.values()), 'verified': True}))
    finally:
        engine.dispose()


if __name__ == '__main__':
    main()
