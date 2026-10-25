from pathlib import Path
from test_http import api,login
from shuku_backend.api import COOKIE,token_from


def test_same_ip_demo_cookie_isolation(api):
    request,app=api
    cookie=login(request,'xiaoman')
    assert COOKIE=='shuku_idl_session' and cookie.startswith(COOKIE+'=')
    legacy='shuku_session='+'f'*64
    for pair in (legacy+'; '+cookie,cookie+'; '+legacy):
        assert request('GET','/auth/me',cookie=pair)[1]['user']['username']=='xiaoman'
    assert token_from(legacy)==''
    assert request('POST','/auth/logout',{},cookie=cookie)[0]==200
    assert request('GET','/auth/me',cookie=cookie)[0]==401


def test_independent_5175_deployment_contract():
    root=Path(__file__).resolve().parents[3]
    nginx=(root/'deploy/5175/nginx.conf').read_text()
    service=(root/'deploy/5175/shuku-idl.service').read_text()
    assert 'listen 5175 ssl;' in nginx and 'listen 443' not in nginx
    assert 'http://127.0.0.1:8010' in nginx and 'ssl_certificate_key' in nginx
    assert 'try_files $uri =404;' in nginx and 'sites-enabled/default' not in nginx
    assert 'EnvironmentFile=/etc/shuku-idl/runtime.env' in service
    assert 'MemoryMax=384M' in service and 'User=ecs-assist-user' in service
