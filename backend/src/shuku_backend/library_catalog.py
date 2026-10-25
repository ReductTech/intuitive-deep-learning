"""Register a validated, fixed remote snapshot; HTTP reads only database metadata.

No user or published release is synthesized from Git history. Missing source entries
are absent from this deployed snapshot, while older snapshot records remain intact.
"""
import json
from pathlib import Path
import re
import subprocess
from urllib.parse import quote
from uuid import UUID
from .errors import require

REPOSITORY = 'reduct-shuku/intuitive-deep-learning'


class LibraryCatalog:
    def __init__(self, workflow):
        self.w = workflow
        self.commit = None

    def sync(self):
        root = self.w.course_root
        if root is None or not (root/'course-library.json').is_file():
            # A source checkout can still build editor previews, but is not a
            # publication source for the production catalog.
            self.commit = None
            return 0
        def git(*args):
            return subprocess.check_output(['git','-C',str(root),*args],text=True,timeout=30).strip()
        manifest = json.loads((root/'course-library.json').read_text())
        source = json.loads((root/'source-lock.json').read_text())
        commit = git('rev-parse','HEAD')
        require(manifest.get('schema') == 1 and manifest.get('repository') == REPOSITORY
                and source.get('repository') == 'ReductTech/intuitive-deep-learning'
                and re.fullmatch('[0-9a-f]{40}',commit) and not git('status','--porcelain'),
                503,'INVALID_COURSE_LIBRARY','课程快照无效或存在未提交修改。')
        lock_path=Path(self.w.root)/'course-library.lock.json' if self.w.root else None
        if lock_path and lock_path.is_file():
            lock=json.loads(lock_path.read_text())
            require(lock.get('repository')==REPOSITORY and lock.get('commit')==commit,
                    503,'COURSE_VERSION_MISMATCH','课程快照与当前部署版本不一致。')
        modules = manifest.get('modules')
        require(isinstance(modules,list) and modules,503,'INVALID_COURSE_LIBRARY','课程清单为空。')
        rows=[];aliases=set();identities=set()
        for item in modules:
            directory=item.get('directory','')
            require(bool(re.fullmatch(r'[A-Za-z0-9_-]+',directory)),503,'INVALID_COURSE_LIBRARY','课程目录无效。')
            path=root/'modules'/directory/'outlines.json'
            require(path.resolve().is_relative_to(root.resolve()) and path.is_file(),503,'INVALID_COURSE_LIBRARY','课程描述不存在。')
            data=json.loads(path.read_text())
            if not data.get('ppt',{}).get('entry') or not data.get('entry'):continue
            uid=str(UUID(data['moduleIdentity']['id']));alias=data.get('id') or directory
            require(uid==item.get('uuid') and (item.get('id') or directory)==alias
                    and re.fullmatch(r'[A-Za-z0-9_-]+',alias) and alias not in aliases and uid not in identities,
                    503,'INVALID_COURSE_LIBRARY','课程标识不匹配或重复。')
            aliases.add(alias);identities.add(uid)
            pages=data.get('pages',[])
            asset_id=uid
            thumbnails=root/'assets'/asset_id/'scenedeck-thumbnails'
            cover=next((p['id'] for p in pages if re.fullmatch(r'[A-Za-z0-9_-]+',p.get('id','')) and (thumbnails/(p['id']+'.png')).is_file()),None)
            payload={'kind':'library','id':uid,'module_id':uid,'alias':alias,
                     'title':data['title'],'description':data.get('description',''),
                     'category':data.get('category') or data.get('badge') or '课程',
                     'difficulty':data.get('difficulty',''),'page_count':len(pages),
                     'cover_url':('/'+asset_id+'/scenedeck-thumbnails/'+cover+'.png') if cover else None,
                     'repository':REPOSITORY,'source_commit':commit,
                     'github_url':'https://github.com/'+REPOSITORY+'/tree/'+commit+'/modules/'+quote(directory),
                     'version':commit[:8]}
            rows.append({'module_id':uid,'snapshot_commit':commit,'alias':alias,'repository':REPOSITORY,'payload':payload,'synced_at':self.w.clock()})
        require(rows,503,'INVALID_COURSE_LIBRARY','没有可学习的课程。')
        # Validate the entire snapshot before a single transaction writes it.
        with self.w.store.transaction() as db:
            for row in rows:
                db.upsert('library_courses',row,('payload','synced_at'))
        self.commit=commit
        return len(rows)

    def courses(self):
        if not self.commit:return []
        with self.w.store.transaction() as db:
            # A user-created course can reuse a native module. That does not
            # make it the same course or authorize hiding the remote original.
            rows=db.execute("SELECT payload FROM shuku_library_courses WHERE snapshot_commit=%s ORDER BY alias",(self.commit,)).fetchall()
            return [r['payload'] for r in rows]

    def course(self,alias):
        result=next((c for c in self.courses() if c['alias']==alias),None)
        require(result,404,'NOT_FOUND','课程不存在或已不可访问。')
        return result
