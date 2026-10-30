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


def test_independent_5173_deployment_contract():
    import re
    from shuku_backend.presentations import MAX_UPLOAD
    root=Path(__file__).resolve().parents[3]
    nginx=(root/'deploy/5173/nginx.conf').read_text()
    service=(root/'deploy/5173/shuku-idl.service').read_text()
    assert 'listen 5173 ssl;' in nginx and 'listen 443' not in nginx
    assert re.search(r'location\s+\^~\s+/api/shuku/\s*\{',nginx), 'Revision JS/CSS/images must retain API authorization rather than match the static-file regex'
    assert 'text/javascript' in nginx, 'Compress the MIME type emitted for native preview JavaScript'
    assert 'http://127.0.0.1:8010' in nginx and 'ssl_certificate_key' in nginx
    assert 'try_files $uri =404;' in nginx and 'sites-enabled/default' not in nginx
    limit=re.search(r'client_max_body_size\s+(\d+)m;',nginx)
    assert limit and int(limit[1])*1024*1024>=MAX_UPLOAD+65536
    assert 'client_body_timeout 120s;' in nginx and 'proxy_send_timeout 120s;' in nginx
    assert 'EnvironmentFile=/etc/shuku-idl/runtime.env' in service
    assert 'MemoryMax=384M' in service and 'User=ecs-assist-user' in service


def test_cleanup_guard_grants_allow_exclusive_lock_without_ddl():
    root=Path(__file__).resolve().parents[3]
    sql=(root/'deploy/5173/mysql-cleanup-grants.sql').read_text()
    import re
    statements='\n'.join(line for line in sql.splitlines() if not line.startswith('--'))
    assert re.fullmatch(r"\s*GRANT SELECT, UPDATE ON `shuku_idl_public`\.`shuku_locks`\s+TO 'shuku_idl_runtime'@'127\.0\.0\.1';\s*",statements)
