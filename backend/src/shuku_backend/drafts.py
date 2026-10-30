"""Private mutable editor drafts: CAS writes without builds, PRs or review side effects."""
import json
from uuid import uuid4
from .database import JsonValue
from .errors import require


def read(workflow, uid, cid):
    with workflow.store.transaction() as db:
        workflow.owner(db, uid, cid)
        return {'draft': view(db.execute('SELECT * FROM shuku_editor_drafts WHERE course_id=%s', (cid,)).fetchone())}


def view(row):
    if not row:
        return None
    return {'version': row['version'], 'base_revision': row['base_revision'],
            'project': row['payload'], 'updated_at': row['updated_at']}


def save(workflow, uid, cid, data):
    require(isinstance(data, dict) and set(data) == {'project', 'expected_revision', 'expected_draft'},
            400, 'INVALID_INPUT', '草稿请求格式不正确。')
    project = data['project']
    require(isinstance(project, dict) and project.get('version') == 1 and
            isinstance(project.get('title'), str) and len(project['title']) <= 120 and
            isinstance(project.get('pages'), list) and 1 <= len(project['pages']) <= 100,
            400, 'INVALID_DRAFT', '草稿格式不正确。')
    # Drafts may contain incomplete text/code. Full build validation belongs to revisions.
    ids = set()
    for page in project['pages']:
        require(isinstance(page, dict) and isinstance(page.get('id'), str) and
                page['id'] not in ids and all(isinstance(page.get(k), str) for k in ('title','goal','summary','note')) and
                isinstance(page.get('revisions'), list) and isinstance(page.get('messages'), list),
                400, 'INVALID_DRAFT', '草稿页面格式不正确。')
        ids.add(page['id'])
    require(len(json.dumps(project, ensure_ascii=False).encode()) <= 16*1024*1024,
            413, 'DRAFT_LIMIT', '草稿过大，请减少参考图片。')
    with workflow.store.transaction() as db:
        course, _ = workflow.owner(db, uid, cid)
        head = str(course['head_revision']) if course['head_revision'] else None
        require(data['expected_revision'] == head, 409, 'REVISION_CONFLICT', '课程已在其他窗口更新，请保留当前内容并重新打开。')
        old = db.execute('SELECT * FROM shuku_editor_drafts WHERE course_id=%s', (cid,)).fetchone()
        require(data['expected_draft'] == (old['version'] if old else None),
                409, 'DRAFT_CONFLICT', '草稿已在其他窗口更新，当前内容尚未保存，请勿关闭页面。')
        version, now = str(uuid4()), workflow.clock()
        if old:
            db.execute('UPDATE shuku_editor_drafts SET author_id=%s,base_revision=%s,version=%s,payload=%s,updated_at=%s WHERE course_id=%s',
                       (uid, head, version, JsonValue(project), now, cid))
        else:
            db.execute('INSERT INTO shuku_editor_drafts(course_id,author_id,base_revision,version,payload,updated_at) VALUES (%s,%s,%s,%s,%s,%s)',
                       (cid, uid, head, version, JsonValue(project), now))
        return {'version': version, 'base_revision': head, 'updated_at': now}
