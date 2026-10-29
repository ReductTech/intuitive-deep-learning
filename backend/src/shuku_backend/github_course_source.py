import hashlib
import re
"""Public, fixed-version GitHub course reads; no organization credentials."""
import json
from concurrent.futures import ThreadPoolExecutor, wait, FIRST_COMPLETED
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, build_opener, HTTPRedirectHandler
from .course_package import github_location, safe_path, MAX_EXPANDED, MAX_FILES, MAX_FILE
from .errors import require, BusinessError


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs): return None


class GitHubCourseSource:
    def read(self, host, path, limit, missing=False):
        require(host in ('api.github.com','raw.githubusercontent.com'),400,'INVALID_GITHUB_URL','源地址不受支持。')
        request = Request('https://'+host+path,headers={'User-Agent':'Shuku-Course-Import','Accept':'application/vnd.github+json'})
        try:
            with build_opener(NoRedirect()).open(request,timeout=12) as response:
                content = response.read(limit+1)
                require(len(content)<=limit,413,'PACKAGE_LIMIT','源课程文件或目录响应超限。')
                return content
        except HTTPError as error:
            if missing and error.code in (404,422):return None
            if error.code in (403,429) and error.headers.get('X-RateLimit-Remaining')=='0':
                raise BusinessError(503,'GITHUB_SOURCE_RATE_LIMIT','公开源 GitHub API 额度已用完，请稍后重试。') from None
            raise BusinessError(422,'GITHUB_SOURCE_UNAVAILABLE','无法读取公开源课程，请检查链接、访问权限或稍后重试。') from None
        except (URLError, TimeoutError, OSError):
            raise BusinessError(503,'GITHUB_SOURCE_TIMEOUT','读取源课程超时，请稍后重试。') from None

    def get(self, path, missing=False):
        content=self.read('api.github.com',path,8*1024*1024,missing)
        return json.loads(content) if content is not None else None

    def pin(self, url, checkpoint=None):
        location=github_location(url);base='/repos/'+location['owner']+'/'+location['repository']
        def get(path,missing=False):
            if checkpoint:checkpoint({'stage':'reading-source'})
            return self.get(path,missing)
        repository=get(base)
        tail=location['tail'].split('/') if location['tail'] else [repository['default_branch']]
        for length in range(len(tail),0,-1):
            ref='/'.join(tail[:length])
            commit=get(base+'/commits/'+quote(ref,safe=''),missing=True)
            if commit:
                require(isinstance(commit.get('sha'),str) and re.fullmatch(r'[a-f0-9]{40}',commit['sha']),502,'GITHUB_SOURCE_INVALID','源提交无效。')
                return {**location,'commit':commit['sha'],'path':'/'.join(tail[length:]),'repository_id':repository['id']}
        raise BusinessError(422,'GITHUB_REF_MISSING','源分支、标签或提交不存在。')

    def load(self, source, checkpoint):
        def get(path):
            checkpoint({'stage':'reading-source','source':source})
            return self.get(path)
        owner=source['owner'];repo=source['repository'];sha=source['commit'];prefix=source['path'].rstrip('/')
        base='/repos/'+owner+'/'+repo
        tree=get(base+'/git/trees/'+sha+'?recursive=1')
        if tree.get('truncated'):
            # Traverse only the requested subtree; never accept a truncated tree.
            require(prefix,422,'GITHUB_TREE_LIMIT','源目录过大，请使用具体课程目录链接。')
            current=get(base+'/git/trees/'+sha)
            for part in prefix.split('/'):
                item=next((x for x in current['tree'] if x['path']==part and x['type']=='tree'),None)
                require(item,422,'COURSE_MANIFEST_MISSING','源课程目录不存在。')
                current=get(base+'/git/trees/'+item['sha'])
            entries=[]
            def walk(value, directory):
                require(not value.get('truncated'),422,'GITHUB_TREE_LIMIT','源子目录清单不完整。')
                for item in value['tree']:
                    path=directory+'/'+item['path']
                    if item['type']=='tree':walk(get(base+'/git/trees/'+item['sha']),path)
                    else:entries.append({**item,'path':path})
                    require(len(entries)<=MAX_FILES,413,'PACKAGE_LIMIT','源课程文件过多。')
            walk(current,prefix)
        else:entries=tree['tree']
        selected=[i for i in entries if i['type']!='tree' and (not prefix or i['path'].startswith(prefix+'/'))]
        require(selected,422,'COURSE_MANIFEST_MISSING','源课程目录不存在或为空。')
        # Include only this module's UUID media, plus source license notices.
        outline=next((i for i in selected if i['path']==prefix+'/outlines.json'),None)
        extra=[]
        if tree.get('truncated'):
            root=get(base+'/git/trees/'+sha)
            entries += [i for i in root['tree'] if i['type']=='blob' and i['path'] in ('LICENSE','NOTICE','LICENSE.md','LICENSE.txt')]
        if outline:
            content=self.read('raw.githubusercontent.com','/'+owner+'/'+repo+'/'+sha+'/'+quote(outline['path'],safe='/'),MAX_FILE)
            try:asset=json.loads(content).get('moduleIdentity',{}).get('id')
            except (ValueError,AttributeError):asset=None
            if asset:
                require(isinstance(asset,str) and re.fullmatch(r'[A-Za-z0-9_-]{1,100}',asset),422,'INVALID_COURSE_MANIFEST','素材标识无效。')
                if tree.get('truncated'):
                    node=next((i for i in root['tree'] if i['path']=='assets' and i['type']=='tree'),None)
                    if node:
                        assets_tree=get(base+'/git/trees/'+node['sha'])
                        asset_node=next((i for i in assets_tree['tree'] if i['path']==asset and i['type']=='tree'),None)
                        if asset_node:walk(get(base+'/git/trees/'+asset_node['sha']),'assets/'+asset)
                extra=[i for i in entries if i['type']=='blob' and i['path'].startswith('assets/'+asset+'/')]
        selected += extra + [i for i in entries if i['type']=='blob' and i['path'] in ('LICENSE','NOTICE','LICENSE.md','LICENSE.txt') and i not in selected]
        require(len(selected)<=MAX_FILES and sum(i.get('size',0) for i in selected)<=MAX_EXPANDED,413,'PACKAGE_LIMIT','源课程最多 2000 文件、64 MiB。')
        for item in selected:
            safe_path(item['path'])
            require(item['mode'] in ('100644','100755') and item.get('size',MAX_FILE+1)<=MAX_FILE,422,'UNSUPPORTED_PACKAGE_FILE','课程包含链接、子模块或超大文件。')
        result={}
        def download(item):
            content=self.read('raw.githubusercontent.com','/'+owner+'/'+repo+'/'+sha+'/'+quote(item['path'],safe='/'),min(MAX_FILE,item['size']))
            require(len(content)==item['size'] and hashlib.sha1(b'blob '+str(len(content)).encode()+bytes([0])+content).hexdigest()==item['sha'],422,'SOURCE_CHANGED','源文件内容不完整。')
            return item['path'],content
        with ThreadPoolExecutor(max_workers=4) as pool:
            pending={pool.submit(download,item) for item in selected}
            try:
                while pending:
                    done,pending=wait(pending,timeout=1,return_when=FIRST_COMPLETED)
                    checkpoint({'stage':'reading-source','source':source,'files_read':len(result),'file_count':len(selected)})
                    for future in done:
                        name,content=future.result();result[name]=content
            except BaseException:
                # A lost lease must also cancel requests that have not started.
                for future in pending:future.cancel()
                raise
        return result
