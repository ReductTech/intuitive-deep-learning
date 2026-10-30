from io import BytesIO
from hashlib import sha256
from shuku_backend.oss_files import OssBucket


class Remote:
    def __init__(self):self.objects={};self.headers={}
    def put_object(self,key,content,headers):self.objects[key]=content;self.headers[key]=headers
    def put_object_from_file(self,key,file,headers):
        from pathlib import Path
        self.put_object(key,Path(file).read_bytes(),headers)
    def get_object(self,key):return BytesIO(self.objects[key])
    def delete_object(self,key):self.objects.pop(key,None)
    def update_object_meta(self,key,headers):self.headers[key].update(headers)
    def sign_url(self,method,key,ttl,slash_safe,params):return 'https://private-oss.invalid/'+key+'?temporary=1'


def test_objects_survive_loss_of_all_local_caches(tmp_path):
    remote=Remote();first=OssBucket(tmp_path/'first',remote)
    content=b'private course revision';obj=first.put(content)
    assert obj=={'sha256':sha256(content).hexdigest(),'size':len(content)}
    assert not (tmp_path/'first/sha256').exists()
    second=OssBucket(tmp_path/'second',remote)
    assert second.read(obj['sha256'])==content
    assert second.path(obj['sha256']).read_bytes()==content
    assert all(h['x-oss-object-acl']=='private' for h in remote.headers.values())
    assert 'temporary=1' in second.signed_url(obj['sha256'])
    second.signed_url(obj['sha256'],'image/png')
    assert remote.headers[second.key(obj['sha256'])]['Content-Type']=='image/png'
    second.remove(obj['sha256']);assert not remote.objects


def test_stream_upload_and_private_narration_cache(tmp_path):
    remote=Remote();bucket=OssBucket(tmp_path,remote)
    obj=bucket.put_file(BytesIO(b'uploaded material'))
    assert bucket.read(obj['sha256'])==b'uploaded material'
    name='narration/'+'a'*64+'.mp3';bucket.put_named(name,b'audio')
    assert OssBucket(tmp_path/'fresh',remote).read_named(name)==b'audio'
