"""Permission-scoped review work queue; badges count actionable work, not views."""
from .errors import require
from .storage import course_view
from .workflow import identifier

MANAGED="""SELECT c.* FROM shuku_courses c WHERE NOT c.deleting
 AND NOT EXISTS(SELECT 1 FROM shuku_workspaces w WHERE w.id=c.id)
 AND (c.owner_id=%s OR %s OR EXISTS(SELECT 1 FROM shuku_course_managers m WHERE m.course_id=c.id AND m.user_id=%s))"""
FEED="""WITH managed AS ("""+MANAGED+"""), feed AS (
 SELECT r.id AS id,'course' AS kind,c.id AS course_id,c.title AS course_title,c.title AS title,u.display_name AS author,
 CASE WHEN r.status IN ('pending','approved') AND r.revision_id<>c.head_revision THEN 'superseded' ELSE r.status END AS status,
 r.revision_id,r.created_at,
 CASE WHEN r.status='pending' AND r.revision_id=c.head_revision THEN 'pending'
 WHEN r.status='approved' AND r.revision_id=c.head_revision AND v.state='ready' AND v.artifact_hash=r.artifact_hash AND c.status<>'hidden' AND NOT EXISTS(SELECT 1 FROM shuku_releases l WHERE l.revision_id=r.revision_id) THEN 'publish' ELSE 'done' END AS stage,
 (%s AND c.owner_id<>%s) AS can_review, true AS available,l.version AS current_version,NULL AS number,false AS needs_retry
 FROM managed c JOIN shuku_reviews r ON r.course_id=c.id JOIN shuku_revisions v ON v.id=r.revision_id
 JOIN shuku_users u ON u.id=c.owner_id LEFT JOIN shuku_releases l ON l.id=c.current_release
 UNION ALL
 SELECT k.id,'contribution',c.id,c.title,left(k.summary,180),u.display_name,
 CASE WHEN k.status IN ('pending','approved') AND (w.deleted_at IS NOT NULL OR w.deleting OR NOT (k.revision_id <=> w.head_revision) OR NOT (k.target_head <=> c.head_revision)) THEN 'superseded' ELSE k.status END,
 k.revision_id,k.created_at,
 CASE WHEN k.status='merging' THEN 'merge' WHEN c.status='published' AND c.current_release=w.base_release_id AND w.deleted_at IS NULL AND NOT w.deleting AND k.revision_id=w.head_revision AND k.target_head=c.head_revision AND k.status='pending' THEN 'pending'
 WHEN c.status='published' AND c.current_release=w.base_release_id AND w.deleted_at IS NULL AND NOT w.deleting AND k.revision_id=w.head_revision AND k.target_head=c.head_revision AND k.status='approved' THEN 'merge' ELSE 'done' END,
 w.owner_id<>%s,(k.revision_id IS NOT NULL AND w.deleted_at IS NULL AND NOT w.deleting),l.version,NULL,
 EXISTS(SELECT 1 FROM shuku_tasks t WHERE t.idempotency_key=CONCAT('build:',k.merged_revision) AND t.status='failed')
 FROM managed c JOIN shuku_contributions k ON k.target_course_id=c.id
 JOIN (SELECT x.*,p.head_revision,coalesce(p.deleting,false) AS deleting FROM shuku_workspaces x LEFT JOIN shuku_courses p ON p.id=x.id) w ON w.id=k.workspace_id
 JOIN shuku_users u ON u.id=w.owner_id LEFT JOIN shuku_releases l ON l.id=c.current_release
 UNION ALL
 SELECT CONCAT(c.id,':',p.number),'github',c.id,c.title,p.title,p.author,p.review_state,p.local_revision_id,p.updated_at,
 CASE WHEN p.state='open' AND p.review_state='pending' THEN 'pending' WHEN p.state='open' AND p.review_state='approved' THEN 'merge' ELSE 'done' END,
 true,true,l.version,p.number,false
 FROM managed c JOIN shuku_github_external_prs p ON p.course_id=c.id LEFT JOIN shuku_releases l ON l.id=c.current_release
 WHERE NOT EXISTS(SELECT 1 FROM shuku_github_revisions g WHERE g.course_id=c.id AND g.pr_number=p.number AND NOT g.external)
), filtered AS (SELECT *, (stage='publish' OR (stage IN ('pending','merge') AND can_review AND (status<>'merging' OR needs_retry))) AS actionable FROM feed
 WHERE (%s IS NULL OR course_id=%s) AND (%s='' OR LOCATE(lower(%s),lower(CONCAT(title,' ',course_title,' ',author)))>0)) """


def listing(app,uid,query):
    stage=query.get('stage',['pending'])[0];q=query.get('q',[''])[0].strip();page=query.get('page',['1'])[0];cid=query.get('course',[''])[0]
    require(stage in ('pending','merge','publish','all') and len(q)<=120,400,'INVALID_INPUT','筛选条件不正确。')
    require(page.isascii() and page.isdigit() and 1<=int(page)<=10000,400,'INVALID_INPUT','页码不正确。')
    cid=identifier(cid) if cid else None;page=int(page)
    with app.store.transaction(isolation='REPEATABLE READ') as db:
        user=app.store.user_in(db,uid);admin=user['role']=='admin'
        args=(uid,admin,uid,admin,uid,uid,cid,cid,q,q)
        counts={s:0 for s in ('pending','merge','publish','all')}
        groups=db.execute(FEED+'SELECT stage,count(*) AS total,SUM(CASE WHEN actionable THEN 1 ELSE 0 END) AS actions FROM filtered GROUP BY stage',args).fetchall()
        for row in groups:
            counts['all']+=row['total']
            if row['stage'] in counts:counts[row['stage']]=int(row['actions'])
        total=counts['all'] if stage=='all' else sum(r['total'] for r in groups if r['stage']==stage)
        rows=db.execute(FEED+"SELECT * FROM filtered WHERE (%s='all' OR stage=%s) ORDER BY created_at DESC,kind,id LIMIT 20 OFFSET %s",(*args,stage,stage,(page-1)*20)).fetchall()
        courses=db.execute('SELECT id,title FROM ('+MANAGED+') c ORDER BY title,id LIMIT 500',(uid,admin,uid)).fetchall()
        return {'items':[course_view(r) for r in rows],'counts':counts,'total':total,'page':page,'page_size':20,'courses':[course_view(r) for r in courses]}
