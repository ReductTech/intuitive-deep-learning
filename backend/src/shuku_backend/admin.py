"""Bounded administrator views over the existing business tables."""
from .errors import require
from .storage import course_view


def listing(app,uid,tab,page,group=None):
    require(tab in ('courses','contributions','reports','records'),404,'NOT_FOUND','管理分类不存在。')
    require(isinstance(page,str) and page.isascii() and page.isdigit() and 1<=int(page)<=10000,400,'INVALID_INPUT','页码不正确。')
    require(group is None or tab=='courses' and group in ('published','pending','deleted'),400,'INVALID_INPUT','课程分组不正确。')
    page=int(page);limit=20;offset=(page-1)*limit
    with app.store.transaction() as db:
        app.workflow.governance.admin(db,uid)
        if tab=='courses':
            source='shuku_courses c JOIN shuku_users u ON u.id=c.owner_id LEFT JOIN shuku_releases r ON r.id=c.current_release'
            where='NOT EXISTS(SELECT 1 FROM shuku_workspaces w WHERE w.id=c.id)'
            if group:
                where += {'published':" AND c.status='published' AND NOT c.deleting",'pending':" AND c.status='draft' AND NOT c.deleting",'deleted':" AND (c.status='hidden' OR c.deleting)"}[group]
            fields='c.id,c.title,c.description,c.category,c.status,c.deleting,c.created_at,c.owner_id,u.display_name AS owner,r.version'
            order='c.created_at DESC,c.id DESC'
        elif tab=='contributions':
            source='shuku_contributions c JOIN shuku_courses t ON t.id=c.target_course_id JOIN shuku_workspaces w ON w.id=c.workspace_id JOIN shuku_users u ON u.id=w.owner_id'
            where='true';fields='c.id,t.title,c.summary,c.status,c.score,c.created_at,u.display_name AS author';order='c.created_at DESC,c.id DESC'
        elif tab=='reports':
            source='shuku_feedback f JOIN shuku_releases r ON r.id=f.release_id JOIN shuku_courses c ON c.id=r.course_id JOIN shuku_users u ON u.id=f.reporter_id'
            where='true';fields='f.id,c.title,r.version,f.message,f.location,f.status,f.created_at,u.display_name AS reporter';order='f.created_at DESC,f.id DESC'
        else:
            source='shuku_audit a LEFT JOIN shuku_users u ON u.id=a.user_id'
            where='true';fields='a.id,a.action,a.object_id,a.created_at,u.display_name AS actor';order='a.created_at DESC,a.id DESC'
        total=db.execute('SELECT count(*) AS n FROM '+source+' WHERE '+where).fetchone()['n']
        rows=db.execute('SELECT '+fields+' FROM '+source+' WHERE '+where+' ORDER BY '+order+' LIMIT %s OFFSET %s',(limit,offset)).fetchall()
        ranking=[]
        if tab=='contributions':
            ranking=db.execute("SELECT u.id,u.display_name AS name,count(*) AS merged_count,coalesce(sum(c.score),0) AS score FROM shuku_contributions c JOIN shuku_workspaces w ON w.id=c.workspace_id JOIN shuku_users u ON u.id=w.owner_id WHERE c.status='merged' GROUP BY u.id,u.display_name ORDER BY score DESC,merged_count DESC,u.id LIMIT 20").fetchall()
        return {'items':[course_view(r) for r in rows],'ranking':[course_view(r) for r in ranking],'page':page,'page_size':limit,'total':total,'github_enabled':bool(app.workflow.github.client)}
