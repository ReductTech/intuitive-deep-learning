import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import time
from urllib.request import Request,urlopen
from shuku_backend.files import Bucket


def test_cli_lifecycle_and_persistent_sessions(store,tmp_path):
    with socket.socket() as sock:
        sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
    origin=f'http://127.0.0.1:{port}'
    env={**os.environ,'SHUKU_DATABASE_URL':store.database_url,'SHUKU_BUCKET_DIR':str(tmp_path/'bucket'),
         'SHUKU_PUBLIC_ORIGIN':origin,'SHUKU_DEMO_PASSWORD':'temporary-test-password','SHUKU_PORT':str(port)}
    for command in ['migrate','seed-demo']:
        result=subprocess.run([sys.executable,'-m','shuku_backend',command],env=env,capture_output=True,timeout=10)
        assert result.returncode==0,result.stderr.decode()
    def request(path,body=None,cookie=''):
        data=None if body is None else json.dumps(body).encode()
        req=Request(origin+'/api/shuku'+path,data=data,headers={'Origin':origin,'Content-Type':'application/json','Cookie':cookie})
        with urlopen(req,timeout=2) as response:return json.loads(response.read()),response.headers
    def start():
        proc=subprocess.Popen([sys.executable,'-m','shuku_backend','serve'],env=env,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
        try:
            for _ in range(80):
                if proc.poll() is not None:raise AssertionError('service failed to start')
                try:
                    request('/health');return proc
                except OSError:time.sleep(0.05)
            raise AssertionError('service did not become ready')
        except BaseException:
            proc.terminate();proc.communicate(timeout=5);raise
    proc=start()
    try:
        _,headers=request('/auth/login',{'username':'admin','password':'temporary-test-password'})
        cookie=headers['Set-Cookie'].split(';')[0]
        # Durable worker really runs a content verification job.
        obj=Bucket(tmp_path/'bucket').put(b'course-resource')
        tid=store.enqueue('file.verify','object:'+obj['sha256'],'lifecycle-verify',obj,time.time())
        for _ in range(50):
            with store.transaction() as db:status=db.execute('SELECT status FROM shuku_business.tasks WHERE id=%s',(tid,)).fetchone()['status']
            if status=='succeeded':break
            time.sleep(0.05)
        assert status=='succeeded'
    finally:
        proc.terminate();stdout,stderr=proc.communicate(timeout=5)
        assert proc.returncode==0,stderr.decode()
        assert b'temporary-test-password' not in stdout+stderr
    proc=start()
    try:assert request('/auth/me',cookie=cookie)[0]['user']['username']=='admin'
    finally:
        proc.terminate();proc.communicate(timeout=5)
        assert proc.returncode==0
