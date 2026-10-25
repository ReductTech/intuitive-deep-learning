"""GitHub Device Flow transport; no user-controlled hosts or redirects."""
import base64
import json
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, build_opener
from .github import NoRedirect
from ..errors import BusinessError


class GitHubDevice:
    def __init__(self,config):
        self.config=config
        self.opener=build_opener(NoRedirect())

    def call(self,method,url,data=None,authorization=None,missing=False):
        headers={'Accept':'application/json','Content-Type':'application/json','User-Agent':'shuku-backend'}
        if authorization:headers['Authorization']=authorization
        request=Request(url,method=method,data=json.dumps(data).encode() if data is not None else None,headers=headers)
        try:
            with self.opener.open(request,timeout=8) as response:
                raw=response.read(65537)
                if len(raw)>65536:raise ValueError()
                return json.loads(raw) if raw else {}
        except HTTPError as error:
            status=error.code;error.close()
            if missing and status==404:return {}
            if status==401:raise BusinessError(409,'GITHUB_REAUTHORIZE','GitHub 授权已失效，请重新授权。') from None
            raise BusinessError(502,'GITHUB_UNAVAILABLE','GitHub 暂时无法连接，请稍后重试。') from None
        except (URLError,OSError,ValueError,TimeoutError):
            raise BusinessError(502,'GITHUB_UNAVAILABLE','GitHub 暂时无法连接，请稍后重试。') from None

    def start(self):
        return self.call('POST','https://github.com/login/device/code',{'client_id':self.config['clientId']})

    def poll(self,code):
        return self.call('POST','https://github.com/login/oauth/access_token',{
            'client_id':self.config['clientId'],'device_code':code,
            'grant_type':'urn:ietf:params:oauth:grant-type:device_code'})

    def user(self,token):
        return self.call('GET','https://api.github.com/user',authorization='Bearer '+token)

    def secret(self):
        return Path(self.config['clientSecretPath']).read_text().strip()

    def refresh(self,token):
        return self.call('POST','https://github.com/login/oauth/access_token',{
            'client_id':self.config['clientId'],'client_secret':self.secret(),
            'grant_type':'refresh_token','refresh_token':token})

    def revoke(self,token):
        # Revoke this token only. Revoking the entire grant would invalidate
        # other installations/environments sharing the App (including Demo).
        basic=base64.b64encode((self.config['clientId']+':'+self.secret()).encode()).decode()
        return self.call('DELETE','https://api.github.com/applications/'+self.config['clientId']+'/token',
                         {'access_token':token},'Basic '+basic,missing=True)
