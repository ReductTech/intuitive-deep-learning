import json
import subprocess
from contextlib import contextmanager
from types import SimpleNamespace
from uuid import uuid4

from shuku_backend.library_catalog import LibraryCatalog, REPOSITORY


class CatalogStore:
    def __init__(self):
        self.rows = []

    @contextmanager
    def transaction(self):
        yield self

    def upsert(self, table, row, columns):
        assert table == 'library_courses'
        self.rows.append(row)


def test_deck_and_opted_in_canvas_registered_but_internal_module_hidden(tmp_path):
    entries = []
    ids = {}
    for name, options in [
        ('Deck', {'entry': 'Guide.tsx', 'ppt': {'entry': 'Ppt.tsx'}}),
        ('Canvas', {'entry': 'Canvas.tsx', 'catalogListed': True}),
        ('Internal', {'entry': 'Test.tsx'}),
        ('MissingEntry', {'catalogListed': True}),
        ('NotBoolean', {'entry': 'Test.tsx', 'catalogListed': 'true'}),
    ]:
        uid = str(uuid4()); ids[name] = uid
        folder = tmp_path / 'modules' / name
        folder.mkdir(parents=True)
        outline = {'id': name, 'title': name, 'moduleIdentity': {'id': uid},
                   'pages': [{'id': 'first', 'title': 'First'}], **options}
        (folder / 'outlines.json').write_text(json.dumps(outline))
        entries.append({'directory': name, 'id': name, 'uuid': uid})
    (tmp_path / 'course-library.json').write_text(json.dumps({'schema': 1, 'repository': REPOSITORY, 'modules': entries}))
    (tmp_path / 'source-lock.json').write_text(json.dumps({'repository': 'ReductTech/intuitive-deep-learning'}))
    def git(*args):
        return subprocess.check_output(['git', '-C', str(tmp_path), *args], text=True).strip()
    git('init'); git('add', '.'); git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-m', 'snapshot')
    calls = []
    def scenes(uid, *args, **kwargs):
        calls.append(uid)
        assert uid == ids['Deck'], 'Guide-only modules must not require a deck scene catalog'
        return [{'id': 'runtime-page', 'title': 'Implemented page'}]
    store = CatalogStore()
    catalog = LibraryCatalog(SimpleNamespace(course_root=tmp_path, root=None, store=store, clock=lambda: 0, runtime_scenes=scenes))
    assert catalog.sync() == 2
    payloads = {row['alias']: row['payload'] for row in store.rows}
    assert set(payloads) == {'Deck', 'Canvas'}
    assert payloads['Canvas']['page_count'] == 1
    assert payloads['Canvas']['module_id'] == ids['Canvas']
    assert calls == [ids['Deck']]


def test_bootstrap_leaves_guide_only_modules_as_native_courses():
    class Database:
        def execute(self, sql, args):
            self.sql = sql
            return self
        def fetchone(self):
            return {'id': 'admin'}
        def fetchall(self):
            return [{'payload': {'module_id': 'canvas', 'title': 'Canvas'}}]
    @contextmanager
    def transaction():
        yield Database()
    catalog = LibraryCatalog(SimpleNamespace(store=SimpleNamespace(transaction=transaction),
        module_context=lambda mid: {'id': mid, 'directory': None}))
    catalog.commit = 'a' * 40
    assert catalog.bootstrap() == {'created': [], 'count': 0, 'retried': 0}
