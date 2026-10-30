"""GitHub Device Flow transport; no user-controlled hosts or redirects."""
import base64
import json
import logging
import socket
import ssl
from urllib.parse import urlsplit
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
        headers={'X-GitHub-Api-Version':'2022-11-28','Accept':'application/json','Content-Type':'application/json','User-Agent':'shuku-backend'}
        if authorization:headers['Authorization']=authorization
        request=Request(url,method=method,data=json.dumps(data).encode() if data is not None else None,headers=headers)
        try:
            with self.opener.open(request,timeout=4) as response:
                raw=response.read(65537)
                if len(raw)>65536:raise ValueError()
                return json.loads(raw) if raw else {}
        except HTTPError as error:
            status=error.code;error.close()
            if missing and status==404:return {}
            if status==401:raise BusinessError(409,'GITHUB_REAUTHORIZE','GitHub 授权已失效，请重新授权。') from None
            if status in (403,429) and (error.headers.get('Retry-After') or error.headers.get('X-RateLimit-Remaining')=='0'):
                raise BusinessError(429,'GITHUB_RATE_LIMIT','GitHub 请求限流，请稍后再试；当前授权码仍可继续使用。') from None
            raise BusinessError(502,'GITHUB_REMOTE_ERROR',f'GitHub 返回 HTTP {status}，请检查 App 配置和权限。') from None
        except ValueError:
            raise BusinessError(502,'GITHUB_INVALID_RESPONSE','GitHub 返回的数据无法解析，请重试。') from None
        except (URLError,OSError,TimeoutError) as error:
            reason=getattr(error,'reason',error)
            code='GITHUB_TLS' if isinstance(reason,ssl.SSLCertVerificationError) else 'GITHUB_DNS' if isinstance(reason,socket.gaierror) else 'GITHUB_TIMEOUT' if isinstance(reason,(TimeoutError,socket.timeout)) else 'GITHUB_NETWORK'
            # Log only fixed hostname and error category, never URLs, headers,
            # proxy addresses, authorization codes or upstream exception text.
            logging.getLogger(__name__).warning('GitHub %s connection failed: %s',urlsplit(url).hostname,code)
            message='GitHub 授权服务连接超时，请检查服务器网络或代理后重试。' if urlsplit(url).hostname=='github.com' else 'GitHub API 连接失败，请检查服务器网络或代理后重试。'
            raise BusinessError(503,code,message) from None

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
