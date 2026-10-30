"""Private OSS is authoritative; disk contains disposable verified read caches only."""
from hashlib import sha256
from pathlib import Path
import os
import re
import tempfile
from .files import Bucket


class OssBucket(Bucket):
    def __init__(self, root, remote, prefix='cloud-IDL/shuku/objects/'):
        super().__init__(root)
        self.remote=remote
        self.prefix=prefix.rstrip('/')+'/'
        self.mime_cache={}

    def key(self,digest):
        if not isinstance(digest,str) or not re.fullmatch('[a-f0-9]{64}',digest):
            raise ValueError('Invalid content hash')
        return self.prefix+'sha256/'+digest[:2]+'/'+digest

    def put(self,content):
        digest=sha256(content).hexdigest()
        self.remote.put_object(self.key(digest),content,headers={'x-oss-object-acl':'private','Cache-Control':'private, no-store'})
        return {'sha256':digest,'size':len(content)}

    def put_file(self,source):
        source.seek(0);digest=sha256();size=0
        fd,name=tempfile.mkstemp(dir=self.root)
        try:
            with os.fdopen(fd,'wb') as file:
                for chunk in iter(lambda:source.read(65536),b''):
                    digest.update(chunk);size+=len(chunk);file.write(chunk)
            self.remote.put_object_from_file(self.key(digest.hexdigest()),name,
                headers={'x-oss-object-acl':'private','Cache-Control':'private, no-store'})
        finally:
            if os.path.exists(name):os.unlink(name)
        return {'sha256':digest.hexdigest(),'size':size}

    def read(self,digest):
        content=self.remote.get_object(self.key(digest)).read()
        if sha256(content).hexdigest()!=digest:raise ValueError('Stored object checksum mismatch')
        return content

    def path(self,digest):
        file=super().path(digest)
        if file.is_file() and sha256(file.read_bytes()).hexdigest()==digest:return file
        content=self.read(digest);file.parent.mkdir(parents=True,exist_ok=True)
        fd,name=tempfile.mkstemp(dir=file.parent)
        try:
            with os.fdopen(fd,'wb') as stream:stream.write(content)
            os.replace(name,file)
        finally:
            if os.path.exists(name):os.unlink(name)
        return file

    def remove(self,digest):
        self.remote.delete_object(self.key(digest))
        super().path(digest).unlink(missing_ok=True)

    def signed_url(self,digest,mime=None):
        params={'response-content-disposition':'inline'}
        # This bucket disallows overriding Content-Type via a signed URL query.
        # Set the object's HTTP metadata instead; content bytes/hash stay immutable.
        if mime and self.mime_cache.get(digest)!=mime:
            self.remote.update_object_meta(self.key(digest),{'Content-Type':mime})
            self.mime_cache[digest]=mime
        return self.remote.sign_url('GET',self.key(digest),300,slash_safe=True,params=params)

    def read_named(self,key):
        if not re.fullmatch('narration/[a-f0-9]{64}\\.mp3',key):raise ValueError('Invalid cache key')
        try:return self.remote.get_object(self.prefix+'cache/'+key).read()
        except Exception as exc:
            if getattr(exc,'status',None)==404:return None
            raise

    def put_named(self,key,content):
        if not re.fullmatch('narration/[a-f0-9]{64}\\.mp3',key):raise ValueError('Invalid cache key')
        self.remote.put_object(self.prefix+'cache/'+key,content,headers={'x-oss-object-acl':'private','Cache-Control':'private, no-store'})


def configured_bucket(root):
    if os.environ.get('SHUKU_STORAGE','local')!='oss':return Bucket(root)
    import oss2
    key=os.environ.get('OSS_ACCESS_KEY_ID') or os.environ.get('ALIBABA_CLOUD_ACCESS_KEY_ID')
    secret=os.environ.get('OSS_ACCESS_KEY_SECRET') or os.environ.get('ALIBABA_CLOUD_ACCESS_KEY_SECRET')
    if not key or not secret:raise RuntimeError('OSS credentials required for Shuku storage')
    remote=oss2.Bucket(oss2.AuthV4(key,secret),os.environ.get('IDL_RECORDS_OSS_ENDPOINT','https://oss-cn-hangzhou.aliyuncs.com'),
                      os.environ.get('IDL_RECORDS_OSS_BUCKET','jianlun'),region=os.environ.get('IDL_RECORDS_OSS_REGION','cn-hangzhou'))
    return OssBucket(root,remote)
