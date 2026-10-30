"""GitHub App transport. Tokens never enter business rows, exceptions or logs."""
import base64
import hashlib
import json
import threading
import time
from datetime import datetime
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, build_opener, HTTPRedirectHandler


class GitHubError(Exception):
    def __init__(self, status=0):
        self.status=status
        super().__init__('GITHUB_CONFLICT' if status in (409,422) else 'GITHUB_UNAVAILABLE')


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self,*args,**kwargs):return None


class GitHub:
    def __init__(self,app_id,key_path,clock=time.time):
        self.app_id=str(app_id);self.key_path=Path(key_path);self.clock=clock
        self.tokens={};self.lock=threading.Lock();self.opener=build_opener(NoRedirect())

    def jwt(self):
        from cryptography.hazmat.primitives.serialization import load_pem_private_key
        from cryptography.hazmat.primitives.asymmetric import padding
        from cryptography.hazmat.primitives import hashes
        def encode(value):return base64.urlsafe_b64encode(json.dumps(value,separators=(',',':')).encode()).rstrip(b'=')
        now=int(self.clock());body=encode({'alg':'RS256','typ':'JWT'})+b'.'+encode({'iat':now-60,'exp':now+480,'iss':self.app_id})
        key=load_pem_private_key(self.key_path.read_bytes(),password=None)
        signature=key.sign(body,padding.PKCS1v15(),hashes.SHA256())
        return (body+b'.'+base64.urlsafe_b64encode(signature).rstrip(b'=')).decode()

    def request(self,method,path,token,data=None,missing=False):
        if not path.startswith('/') or path.startswith('//') or any(c in path for c in ('\r','\n','#')):raise ValueError('Invalid GitHub API path')
        request=Request('https://api.github.com'+path,data=json.dumps(data).encode() if data is not None else None,method=method,headers={
            'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json',
            'X-GitHub-Api-Version':'2022-11-28','User-Agent':'shuku-backend','Content-Type':'application/json'})
        try:
            with self.opener.open(request,timeout=8) as response:
                body=response.read(12*1024*1024+1)
                if len(body)>12*1024*1024:raise GitHubError()
                return json.loads(body) if body else {}
        except HTTPError as error:
            error.close()
            if missing and error.code==404:return None
            raise GitHubError(error.code) from None
        except (URLError,TimeoutError,OSError,ValueError):raise GitHubError() from None

    def call(self,repo,method,suffix='',data=None,missing=False):
        key=(repo['installation_id'],repo['repository_id'])
        with self.lock:
            token,expires=self.tokens.get(key,('',0))
            if expires<self.clock()+120:
                result=self.request('POST',f'/app/installations/{key[0]}/access_tokens',self.jwt(),{'repository_ids':[key[1]]})
                token=result['token'];expires=datetime.fromisoformat(result['expires_at'].replace('Z','+00:00')).timestamp()
                self.tokens[key]=(token,expires)
        try:return self.request(method,f"/repos/{repo['owner']}/{repo['name']}"+suffix,token,data,missing)
        except GitHubError as error:
            if error.status==401:
                with self.lock:self.tokens.pop(key,None)
            raise

    def installation_call(self,installation,method,path,data=None,missing=False):
        result=self.request('POST',f'/app/installations/{installation}/access_tokens',self.jwt(),{})
        return self.request(method,path,result['token'],data,missing)


def blob_sha(data):
    return hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
