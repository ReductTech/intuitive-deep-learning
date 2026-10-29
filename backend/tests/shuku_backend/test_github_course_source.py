import hashlib
import io
import json
from urllib.error import HTTPError
import pytest
from shuku_backend.github_course_source import GitHubCourseSource
from shuku_backend.errors import BusinessError


def test_no_commit_422_is_a_ref_probe_miss_and_rate_limits_remain_actionable(monkeypatch):
    class Opener:
        status=422
        def open(self,request,timeout):
            assert request.host=='api.github.com'
            assert 'Authorization' not in request.headers
            raise HTTPError(request.full_url,self.status,'failure',{'X-RateLimit-Remaining':'0' if self.status==403 else '10'},io.BytesIO(b'{}'))
    opener=Opener();monkeypatch.setattr('shuku_backend.github_course_source.build_opener',lambda *args:opener)
    client=GitHubCourseSource()
    assert client.get('/repos/org/repo/commits/not-a-ref',missing=True) is None
    opener.status=403
    with pytest.raises(BusinessError) as error:client.get('/repos/org/repo')
    assert error.value.code=='GITHUB_SOURCE_RATE_LIMIT'
    with pytest.raises(BusinessError):client.read('localhost','/private',1024)


def test_longest_branch_probe_pins_once_and_keeps_the_selected_directory():
    class Source(GitHubCourseSource):
        def get(self,path,missing=False):
            if path=='/repos/org/repo':return {'id':42,'default_branch':'main'}
            if path.endswith('/commits/feature%2Fcourse'):return {'sha':'a'*40}
            assert missing
            return None
    result=Source().pin('https://github.com/org/repo/tree/feature/course/modules/Demo')
    assert result['commit']=='a'*40 and result['path']=='modules/Demo' and result['repository_id']==42


def test_truncated_root_tree_reads_complete_course_and_its_uuid_assets():
    data={'modules/Demo/outlines.json':json.dumps({'moduleIdentity':{'id':'uuid'}}).encode(),'modules/Demo/Guide.tsx':b'guide',
          'assets/uuid/image.png':b'image','LICENSE':b'MIT'}
    def blob(path):
        content=data[path]
        return {'path':path.rsplit('/',1)[-1],'type':'blob','mode':'100644','size':len(content),'sha':hashlib.sha1(b'blob '+str(len(content)).encode()+bytes([0])+content).hexdigest()}
    class Source(GitHubCourseSource):
        def get(self,path,missing=False):
            name=path.split('/')[-1]
            if '?recursive=1' in name:return {'truncated':True,'tree':[]}
            values={
                'a'*40:[{'path':'modules','type':'tree','sha':'modules'},{'path':'assets','type':'tree','sha':'assets'},blob('LICENSE')],
                'modules':[{'path':'Demo','type':'tree','sha':'demo'}],
                'demo':[blob('modules/Demo/outlines.json'),blob('modules/Demo/Guide.tsx')],
                'assets':[{'path':'uuid','type':'tree','sha':'media'}],
                'media':[blob('assets/uuid/image.png')],
            }
            return {'truncated':False,'tree':values[name]}
        def read(self,host,path,limit,missing=False):
            assert host=='raw.githubusercontent.com' and '/'+('a'*40)+'/' in path
            return data[path.split('/'+('a'*40)+'/',1)[1]]
    result=Source().load({'owner':'org','repository':'repo','commit':'a'*40,'path':'modules/Demo'},lambda state:None)
    assert result==data


def test_lost_lease_cancels_queued_downloads_before_waiting_for_the_pool(monkeypatch):
    pending=[]
    class Future:
        cancelled=False
        def cancel(self):self.cancelled=True
    class Pool:
        def __init__(self,**kwargs):pass
        def __enter__(self):return self
        def submit(self,*args):
            future=Future();pending.append(future);return future
        def __exit__(self,*args):assert pending and all(f.cancelled for f in pending)
    class Source(GitHubCourseSource):
        def get(self,*args,**kwargs):return {'truncated':False,'tree':[{'path':'modules/Demo/a.ts','type':'blob','mode':'100644','size':1,'sha':'a'*40}]}
    monkeypatch.setattr('shuku_backend.github_course_source.ThreadPoolExecutor',Pool)
    monkeypatch.setattr('shuku_backend.github_course_source.wait',lambda futures,**kwargs:(set(),futures))
    def checkpoint(state):
        if 'file_count' in state:raise BusinessError(409,'STALE_LEASE','lease lost')
    with pytest.raises(BusinessError) as error:Source().load({'owner':'org','repository':'repo','commit':'a'*40,'path':'modules/Demo'},checkpoint)
    assert error.value.code=='STALE_LEASE'
