"""Review-gated independent repositories. Never execute downloaded repository code."""
import base64
import hashlib
import json
import mimetypes
from pathlib import PurePosixPath
import re
from urllib.parse import quote
from uuid import uuid4, uuid5, NAMESPACE_URL
from .adapters.github import GitHubError, blob_sha
from .database import JsonValue
from .errors import BusinessError, require
from .storage import course_view

INTERVAL = 7200
MAX_FILE = 8 * 1024 * 1024
MAX_TOTAL = 24 * 1024 * 1024
EXTENSIONS = {'.html', '.htm', '.js', '.mjs', '.css', '.json', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.woff', '.woff2', '.ttf', '.mp3', '.mp4', '.pdf', '.txt', '.md'}
STATIC_CSP = "sandbox allow-scripts; default-src 'none'; script-src 'unsafe-inline' 'self'; style-src 'unsafe-inline' 'self'; img-src 'self' data: blob: https://image.reduct.cn https://jianlun.oss-cn-hangzhou.aliyuncs.com; font-src 'self' data: https://image.reduct.cn https://jianlun.oss-cn-hangzhou.aliyuncs.com; media-src 'self' data: blob: https://image.reduct.cn https://jianlun.oss-cn-hangzhou.aliyuncs.com; connect-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'self'"


def safe_path(value, root=False):
    require(isinstance(value, str) and len(value) <= 240 and (root and value == '.' or value and not value.startswith('/') and all(x not in ('', '.', '..') and not x.startswith('.') for x in value.split('/')) and not any(c in value for c in '\\:\x00?#%')), 422, 'UNSAFE_COURSE_PATH', '课程路径必须是安全的相对路径。')
    return value


def decode_file(item):
    require(isinstance(item, dict) and item.get('encoding') == 'base64' and isinstance(item.get('content'), str), 422, 'INVALID_COURSE_FILE', '课程文件编码不正确。')
    try: data = base64.b64decode(item['content'].replace('\n', ''), validate=True)
    except ValueError: raise BusinessError(422, 'INVALID_COURSE_FILE', '课程文件编码不正确。')
    require(len(data) <= MAX_FILE, 413, 'COURSE_FILE_LIMIT', '课程单个文件超过 8 MB。')
    if item.get('sha'): require(blob_sha(data) == item['sha'], 422, 'COURSE_FILE_CHANGED', '课程文件校验失败。')
    return data


def manifest(value, repo):
    require(isinstance(value, dict) and value.get('schema_version') == 1, 422, 'INVALID_COURSE_MANIFEST', '需要 schema_version 为 1 的课程描述。')
    cid = value.get('course_id'); version = value.get('version'); title = value.get('title')
    require(isinstance(cid, str) and re.fullmatch(r'[A-Za-z0-9_-]{1,128}', cid) and isinstance(title, str) and 0 < len(title.strip()) <= 120, 422, 'INVALID_COURSE_MANIFEST', '课程标识或名称不正确。')
    require(isinstance(version, str) and re.fullmatch(r'(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)', version), 422, 'INVALID_COURSE_VERSION', '需要语义版本号。')
    require(value.get('type') == 'official' and value.get('build_profile') == 'static', 422, 'UNSUPPORTED_COURSE_FORMAT', '独立仓库当前支持 official/static 静态课程。')
    expected = 'https://github.com/' + repo['owner'] + '/' + repo['name']
    require(isinstance(value.get('repository'), str), 422, 'COURSE_REPOSITORY_MISMATCH', '?????????????')
    require(value.get('repository', '').removesuffix('.git').rstrip('/').lower() == expected.lower(), 422, 'COURSE_REPOSITORY_MISMATCH', '课程描述的仓库地址不一致。')
    ref = value.get('ref')
    require(isinstance(ref, str) and re.fullmatch(r'[A-Za-z0-9_./-]{1,200}', ref) and '..' not in ref, 422, 'INVALID_COURSE_REF', '课程 ref 不正确。')
    path = safe_path(value.get('path', '.'), root=True); entry = safe_path(value.get('entry'))
    require(PurePosixPath(entry).suffix.lower() in ('.html', '.htm'), 422, 'UNSUPPORTED_COURSE_ENTRY', '静态课程入口必须为 HTML。')
    description = value.get('description', '')
    require(isinstance(description, str) and len(description) <= 10000, 422, 'INVALID_COURSE_MANIFEST', '课程介绍过长。')
    return {**value, 'title': title.strip(), 'description': description, 'path': path, 'entry': entry}


class OrganizationCatalog:
    def __init__(self, workflow):
        self.w = workflow; self.store = workflow.store; self.clock = workflow.clock

    @property
    def owner(self): return self.w.github.config.get('owner', '').lower()

    def configured(self):
        sync = self.w.github
        require(sync.client and re.fullmatch(r'[A-Za-z0-9_-]{1,100}', self.owner) and int(sync.config.get('installationId', 0)) > 0, 503, 'GITHUB_NOT_CONFIGURED', '请配置目标组织的 GitHub App。')

    def admin(self, uid):
        with self.store.transaction() as db: self.w.governance.admin(db, uid)

    def request_scan(self, uid=None):
        if uid: self.admin(uid)
        self.configured()
        with self.store.transaction() as db:
            running = db.execute("SELECT id FROM shuku_tasks WHERE kind='catalog.scan' AND resource_key=%s AND status IN ('queued','running') ORDER BY created_at DESC LIMIT 1", ('catalog:' + self.owner,)).fetchone()
            if running: return {'id': str(running['id']), 'pending': True}
        key = 'manual:' + str(uuid4()) if uid else 'timer:' + str(int(self.clock() // INTERVAL))
        tid = self.store.enqueue('catalog.scan', 'catalog:' + self.owner, 'catalog-scan:' + self.owner + ':' + key, {}, self.clock())
        return {'id': tid, 'pending': True}

    def listing(self, uid):
        self.admin(uid)
        with self.store.transaction() as db:
            rows = db.execute('SELECT * FROM shuku_catalog_candidates WHERE owner=%s ORDER BY checked_at DESC,repository_id LIMIT 500', (self.owner,)).fetchall()
            jobs = db.execute("SELECT id,kind,status,checkpoint,error_code,created_at FROM shuku_tasks WHERE resource_key=%s ORDER BY created_at DESC LIMIT 20", ('catalog:' + self.owner,)).fetchall()
        return {'organization': self.owner, 'enabled': bool(self.w.github.client), 'interval_seconds': INTERVAL, 'items': [course_view(r) for r in rows], 'jobs': [course_view(r) for r in jobs]}

    def repo(self, raw):
        require(isinstance(raw, dict) and type(raw.get('id')) is int and raw['id'] > 0 and raw.get('owner', {}).get('login', '').lower() == self.owner.lower() and isinstance(raw.get('name'), str) and re.fullmatch(r'[A-Za-z0-9_.-]{1,100}', raw['name']) and isinstance(raw.get('private'), bool) and raw.get('default_branch') and not any(raw.get(k) for k in ('archived', 'disabled', 'is_template', 'private', 'fork')), 422, 'REPOSITORY_NOT_ELIGIBLE', '仓库不属于目标组织，或不是可公开收录的课程仓库。')
        return {'repository_id': raw['id'], 'installation_id': int(self.w.github.config['installationId']), 'owner': raw['owner']['login'].lower(), 'name': raw['name'], 'default_branch': raw['default_branch']}

    def call(self, repo, suffix, missing=False):
        return self.w.github.client.call(repo, 'GET', suffix, missing=missing)

    def inspect(self, repo, checkpoint=lambda state: None):
        def call(suffix, missing=False):
            checkpoint({'stage': 'validating', 'repository': repo['name']})
            return self.call(repo, suffix, missing)
        def read(name, ref, missing=False):
            item = call('/contents/' + quote(name, safe='/') + '?ref=' + quote(ref, safe=''), missing)
            if item is None: return None
            require(isinstance(item, dict) and item.get('type') == 'file', 422, 'INVALID_COURSE_MANIFEST', '课程描述不是普通文件。')
            try: return json.loads(decode_file(item))
            except (ValueError, UnicodeDecodeError): raise BusinessError(422, 'INVALID_COURSE_MANIFEST', '课程描述应为 JSON 对象。')
        filename = 'shuku.json'; value = read(filename, repo['default_branch'], True)
        if value is None: filename = 'course.yaml'; value = read(filename, repo['default_branch'], True)
        require(value is not None, 422, 'COURSE_MANIFEST_MISSING', '仓库没有 shuku.json 或 JSON 格式的 course.yaml。')
        initial = manifest(value, repo)
        commit = call('/commits/' + quote(initial['ref'], safe=''))
        sha = commit.get('sha')
        require(isinstance(sha, str) and re.fullmatch('[a-f0-9]{40}', sha), 422, 'INVALID_COURSE_REF', '课程提交无效。')
        pinned = manifest(read(filename, sha), repo)
        require(pinned['ref'] == initial['ref'], 409, 'COURSE_SOURCE_CHANGED', '课程引用已变化，请重新扫描。')
        legacy = read('course.yaml', sha, True) if filename == 'shuku.json' else None
        if legacy:
            for key in ('course_id', 'entry', 'path', 'ref', 'version'):
                require(legacy.get(key, '.' if key == 'path' else None) == pinned.get(key), 422, 'COURSE_MANIFEST_CONFLICT', '两份课程描述不一致。')
        prefix = '' if pinned['path'] == '.' else pinned['path'] + '/'
        entry = call('/contents/' + quote(prefix + pinned['entry'], safe='/') + '?ref=' + sha)
        require(isinstance(entry, dict) and entry.get('type') == 'file', 422, 'COURSE_ENTRY_MISSING', '课程入口不存在。')
        return pinned, sha

    def active(self, db, task):
        require(db.execute("SELECT id FROM shuku_tasks WHERE id=%s AND status='running' AND lease_token=%s AND lease_until>%s FOR UPDATE", (task['id'], task['lease_token'], self.clock())).fetchone(), 409, 'STALE_LEASE', '目录任务已被接管。')

    def scan(self, task, checkpoint):
        self.configured(); candidates = []; seen = set()
        installation = int(self.w.github.config['installationId'])
        for page in range(1, 101):
            checkpoint({'stage': 'listing', 'page': page, 'scanned': len(candidates)})
            batch = self.w.github.client.installation_call(installation, 'GET', '/orgs/' + quote(self.owner) + '/repos?type=all&sort=full_name&direction=asc&per_page=100&page=' + str(page))
            require(isinstance(batch, list), 502, 'INCOMPLETE_CATALOG_SCAN', 'GitHub 仓库列表不完整。')
            for raw in batch:
                try: repo = self.repo(raw)
                except BusinessError: continue
                if repo['repository_id'] in seen or repo['name'] == 'co-creation-workspaces': continue
                seen.add(repo['repository_id']); checkpoint({'stage': 'validating', 'repository': repo['name'], 'scanned': len(candidates)})
                try:
                    value, sha = self.inspect(repo, checkpoint); error = None
                except BusinessError as e:
                    value, sha, error = {}, None, e.code
                except GitHubError as e:
                    if e.status != 404: raise
                    value, sha, error = {}, None, 'COURSE_SOURCE_MISSING'
                candidates.append((repo, value, sha, error))
            if len(batch) < 100: break
        else: raise BusinessError(422, 'CATALOG_SCAN_LIMIT', '组织仓库超过扫描上限。')
        checkpoint({'stage': 'saving', 'scanned': len(candidates)})
        with self.store.transaction() as db:
            self.active(db, task)
            for repo, value, sha, error in candidates:
                rid = repo['repository_id']
                old = db.execute('SELECT * FROM shuku_catalog_candidates WHERE repository_id=%s FOR UPDATE', (rid,)).fetchone()
                status = 'invalid' if error else 'pending'
                if old:
                    if old['status'] == 'removed' or old['imported_sha'] and not old['course_id']: status = 'removed'
                    elif sha and old['imported_sha'] == sha: status = 'imported'
                    elif sha and old['source_sha'] == sha and old['status'] == 'rejected': status = 'rejected'
                    db.execute('UPDATE shuku_catalog_candidates SET owner=%s,name=%s,payload=%s,source_sha=%s,status=%s,error_code=%s,checked_at=%s WHERE repository_id=%s', (repo['owner'], repo['name'], JsonValue(value), sha, status, error, self.clock(), rid))
                else:
                    db.execute('INSERT INTO shuku_catalog_candidates(repository_id,owner,name,payload,source_sha,status,error_code,checked_at) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)', (rid, repo['owner'], repo['name'], JsonValue(value), sha, status, error, self.clock()))
            absent = db.execute('SELECT repository_id,status FROM shuku_catalog_candidates WHERE owner=%s', (self.owner,)).fetchall()
            for row in absent:
                if row['repository_id'] not in seen and row['status'] != 'removed': db.execute("UPDATE shuku_catalog_candidates SET status='invalid',source_sha=NULL,error_code='REPOSITORY_NOT_ACCESSIBLE',checked_at=%s WHERE repository_id=%s", (self.clock(), row['repository_id']))
        return {'scanned': len(candidates), 'valid': sum(not x[3] for x in candidates)}

    def decision(self, uid, repository_id, data):
        self.admin(uid); self.configured()
        require(set(data) == {'decision', 'source_sha', 'note'} and data.get('decision') in ('approved', 'rejected') and isinstance(data.get('note'), str) and len(data['note']) <= 2000 and (data['decision'] != 'rejected' or data['note'].strip()), 400, 'INVALID_CATALOG_DECISION', '请选择收录或退回，并填写退回原因。')
        require(str(repository_id).isdigit(), 400, 'INVALID_INPUT', '仓库编号无效。')
        with self.store.transaction() as db:
            row = db.execute('SELECT * FROM shuku_catalog_candidates WHERE repository_id=%s FOR UPDATE', (int(repository_id),)).fetchone()
            require(row and row['owner'] == self.owner, 404, 'NOT_FOUND', '待收录课程不存在。')
            require(row['source_sha'] == data['source_sha'] and row['status'] in ('pending', 'rejected', 'imported'), 409, 'CATALOG_CHANGED', '候选课程已变化，请重新扫描并查看。')
            if data['decision'] == 'approved' and row['imported_sha'] == row['source_sha']:
                return {'course_id': row['course_id'], 'pending': False}
            if data['decision'] == 'rejected':
                db.execute("UPDATE shuku_catalog_candidates SET status='rejected',note=%s,reviewed_by=%s WHERE repository_id=%s", (data['note'], uid, row['repository_id']))
                self.w.audit(db, uid, 'catalog.rejected', repository_id)
                return {'status': 'rejected'}
            db.execute("UPDATE shuku_catalog_candidates SET status='pending',note=%s,reviewed_by=%s WHERE repository_id=%s AND status='rejected'", (data['note'], uid, row['repository_id']))
            self.w.audit(db, uid, 'catalog.approved', repository_id)
        key = 'catalog-import:' + str(repository_id) + ':' + data['source_sha']
        tid = self.store.enqueue('catalog.import', 'catalog:' + self.owner, key, {'repository_id': int(repository_id), 'source_sha': data['source_sha'], 'uid': uid, 'note': data['note']}, self.clock())
        with self.store.transaction() as db:
            db.execute("UPDATE shuku_tasks SET status='queued',attempts=0,error_code=NULL,available_at=%s WHERE id=%s AND status='failed'", (self.clock(), tid))
        return {'id': tid, 'pending': True}

    def download(self, repo, value, sha, checkpoint):
        checkpoint({'stage': 'reading-file-tree'})
        tree = self.call(repo, '/git/trees/' + sha + '?recursive=1')
        require(not tree.get('truncated') and isinstance(tree.get('tree'), list), 422, 'COURSE_TREE_LIMIT', '课程文件清单不完整。')
        prefix = '' if value['path'] == '.' else value['path'] + '/'
        files = {}; total = 0
        for item in tree['tree']:
            name = item.get('path', '')
            if not name.startswith(prefix) or item.get('type') == 'tree': continue
            name = name[len(prefix):]
            if any(p.startswith('.') or p == 'node_modules' for p in name.split('/')): continue
            safe_path(name)
            require(item.get('mode') not in ('120000', '160000') and item.get('type') == 'blob', 422, 'UNSAFE_COURSE_FILE', '课程不能包含符号链接或子模块。')
            if PurePosixPath(name).suffix.lower() not in EXTENSIONS: continue
            require(type(item.get('size')) is int and item['size'] <= MAX_FILE and len(files) < 200, 413, 'COURSE_FILE_LIMIT', '课程文件过大或过多。')
            total += item['size']; require(total <= MAX_TOTAL, 413, 'COURSE_SIZE_LIMIT', '课程总大小超过 24 MB。')
            checkpoint({'stage': 'downloading', 'files': len(files)})
            data = decode_file(self.call(repo, '/git/blobs/' + item['sha']))
            require(len(data) == item['size'] and blob_sha(data) == item['sha'], 422, 'COURSE_FILE_CHANGED', '课程文件校验失败。')
            files['static/' + name] = {**self.w.bucket.put(data), 'mime': mimetypes.guess_type(name)[0] or 'application/octet-stream'}
        require('static/' + value['entry'] in files, 422, 'COURSE_ENTRY_MISSING', '课程入口缺失。')
        return files

    def publish(self, task, checkpoint):
        self.configured(); payload = task['payload']; rid = payload['repository_id']; uid = payload['uid']
        self.admin(uid)
        with self.store.transaction() as db:
            candidate = db.execute('SELECT * FROM shuku_catalog_candidates WHERE repository_id=%s', (rid,)).fetchone()
            require(candidate and candidate['status'] != 'removed' and candidate['source_sha'] == payload['source_sha'], 409, 'CATALOG_CHANGED', '候选课程已变化。')
            if candidate['imported_sha'] == payload['source_sha']: return {'course_id': candidate['course_id']}
        checkpoint({'stage': 'revalidating-repository'})
        raw = self.w.github.client.installation_call(int(self.w.github.config['installationId']), 'GET', '/repositories/' + str(rid))
        repo = self.repo(raw); value, sha = self.inspect(repo, checkpoint)
        require(sha == payload['source_sha'] and value == candidate['payload'], 409, 'COURSE_SOURCE_CHANGED', '课程已更新，请重新扫描审核。')
        cid = candidate['course_id'] or str(uuid5(NAMESPACE_URL, 'shuku:github:repository:' + str(rid)))
        revision_id = str(uuid4()); now = self.clock()
        project = {'version': 1, 'id': cid, 'courseId': 'external-' + str(rid), 'title': value['title'], 'duration': 20, 'style': '', 'outlineConfirmed': True, 'externalSnapshot': {'repository': repo['owner'] + '/' + repo['name'], 'commit': sha, 'entry': value['entry'], 'course_id': value['course_id']}, 'pages': [{'id': 'external', 'format': 'text', 'title': value['title'], 'goal': '', 'summary': value['description'], 'note': '', 'ready': True, 'designed': True, 'revisions': [], 'messages': []}]}
        with self.store.transaction() as guard:
            guard.file_reference_lock(shared=True)
            files = self.download(repo, value, sha, checkpoint)
            files['project.json'] = {**self.w.bucket.put(json.dumps(project, ensure_ascii=False).encode()), 'mime': 'application/json'}
            # The top-level entry redirects inside the immutable revision directory.
            html = ('<!doctype html><meta charset="utf-8"><script>location.replace(' + json.dumps('static/' + value['entry']) + ')</script>').encode()
            files['index.html'] = {**self.w.bucket.put(html), 'mime': 'text/html'}
            digest = hashlib.sha256(json.dumps(files, sort_keys=True).encode()).hexdigest()
            checkpoint({'stage': 'publishing'})
            with self.store.transaction() as db:
                self.active(db, task); self.w.governance.admin(db, uid)
                row = db.execute('SELECT * FROM shuku_catalog_candidates WHERE repository_id=%s FOR UPDATE', (rid,)).fetchone()
                require(row and row['status'] not in ('removed', 'rejected', 'invalid') and row['source_sha'] == sha, 409, 'CATALOG_CHANGED', '收录状态已变化。')
                if row['imported_sha'] == sha: return {'course_id': row['course_id']}
                duplicate = db.execute("SELECT repository_id FROM shuku_catalog_candidates WHERE owner=%s AND repository_id<>%s AND imported_sha IS NOT NULL AND JSON_UNQUOTE(JSON_EXTRACT(payload,'$.course_id'))=%s", (self.owner, rid, value['course_id'])).fetchone()
                require(not duplicate, 409, 'COURSE_ID_CONFLICT', '另一个仓库已使用此课程标识。')
                if row['course_id']:
                    course = db.execute('SELECT * FROM shuku_courses WHERE id=%s FOR UPDATE', (cid,)).fetchone()
                    require(course and not course['deleting'] and course['status'] != 'hidden', 409, 'COURSE_HIDDEN', '课程已下架或正在删除，请先恢复。')
                    previous = db.execute('SELECT files FROM shuku_revisions WHERE id=%s', (course['head_revision'],)).fetchone()
                    identity = json.loads(self.w.bucket.read(previous['files']['project.json']['sha256']))['externalSnapshot'].get('course_id')
                    require(identity == value['course_id'], 409, 'COURSE_ID_CHANGED', '已收录课程不能更换 course_id。')
                    current = db.execute('SELECT version FROM shuku_releases WHERE id=%s', (course['current_release'],)).fetchone()
                    require(not current or tuple(map(int, value['version'].split('.'))) > tuple(map(int, current['version'].split('.'))), 409, 'VERSION_ORDER', '新版必须提高 version。')
                else:
                    require(not row['imported_sha'], 409, 'COURSE_REMOVED', '课程已永久删除，不能自动重新收录。')
                    db.execute('INSERT INTO shuku_courses(id,owner_id,module_id,title,description,category,created_at) VALUES (%s,%s,%s,%s,%s,%s,%s)', (cid, uid, cid, value['title'], value['description'], '独立课程', now))
                db.execute("INSERT INTO shuku_revisions VALUES (%s,%s,%s,%s,'ready',%s,%s,%s)", (revision_id, cid, uid, digest, JsonValue(files), digest, now))
                review_id = str(uuid4()); release_id = str(uuid4())
                db.execute("INSERT INTO shuku_reviews(id,revision_id,course_id,status,note,reviewer_id,artifact_hash,created_at,decided_at) VALUES (%s,%s,%s,'published',%s,%s,%s,%s,%s)", (review_id, revision_id, cid, payload['note'], uid, digest, now, now))
                db.execute('INSERT INTO shuku_releases VALUES (%s,%s,%s,%s,%s,%s,%s)', (release_id, cid, revision_id, value['version'], payload['note'], uid, now))
                db.execute("UPDATE shuku_courses SET status='published',head_revision=%s,current_release=%s,title=%s,description=%s WHERE id=%s", (revision_id, release_id, value['title'], value['description'], cid))
                db.execute("UPDATE shuku_catalog_candidates SET status='imported',course_id=%s,imported_sha=%s,note=%s,reviewed_by=%s WHERE repository_id=%s", (cid, sha, payload['note'], uid, rid))
                self.w.audit(db, uid, 'catalog.published', release_id)
        return {'course_id': cid, 'revision_id': revision_id}
