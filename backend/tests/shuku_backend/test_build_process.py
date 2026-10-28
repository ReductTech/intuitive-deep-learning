import os
from pathlib import Path
import sys
import time
import pytest
from shuku_backend.build_process import run_build
from shuku_backend.errors import BusinessError

pytestmark=pytest.mark.skipif(os.name!='posix',reason='Production build process groups use Linux sessions')

def command(folder):
    child=folder/'child.pid'
    script="import subprocess,sys,time;from pathlib import Path;p=subprocess.Popen([sys.executable,'-c','import time;time.sleep(60)']);Path(sys.argv[1]).write_text(str(p.pid));time.sleep(60)"
    return [sys.executable,'-c',script,str(child)],child

def stopped(pidfile):
    if not pidfile.exists():return False
    path=Path('/proc')/pidfile.read_text()/'stat'
    return not path.exists() or path.read_text().split()[2]=='Z'

def test_build_returns_output():
    code,out,err=run_build([sys.executable,'-c',"print('done')"],os.environ.copy(),lambda:None,timeout=3,interval=.05)
    assert (code,out.strip(),err)==(0,b'done',b'')

def test_watchdog_start_failure_also_reaps_parent(monkeypatch):
    from shuku_backend import build_process
    original=build_process.subprocess.Popen
    children=[]
    def launch(*args,**kwargs):
        process=original(*args,**kwargs);children.append(process);return process
    class BrokenTimer:
        def __init__(self,*args):pass
        def start(self):raise RuntimeError('no thread available')
        def cancel(self):pass
    monkeypatch.setattr(build_process.subprocess,'Popen',launch)
    monkeypatch.setattr(build_process.threading,'Timer',BrokenTimer)
    with pytest.raises(RuntimeError,match='no thread available'):
        run_build([sys.executable,'-c','import time;time.sleep(60)'],os.environ.copy(),lambda:None)
    assert children[0].poll() is not None

@pytest.mark.parametrize('failure',['timeout','lease','blocked-checkpoint'])
def test_entire_process_group_stops_on_timeout_or_checkpoint_failure(tmp_path,failure):
    args,pidfile=command(tmp_path)
    def checkpoint():
        if failure=='timeout' or not pidfile.exists():return
        if failure=='blocked-checkpoint':
            # Simulate a DB heartbeat blocked longer than the build deadline.
            time.sleep(1.3)
            assert stopped(pidfile),'Watchdog must run independently of the DB heartbeat'
        raise BusinessError(409,'STALE_LEASE','Task lost')
    start=time.monotonic()
    with pytest.raises(BusinessError) as exc:
        run_build(args,os.environ.copy(),checkpoint,timeout=1,interval=.05)
    assert exc.value.code==('BUILD_TIMEOUT' if failure=='timeout' else 'STALE_LEASE')
    assert time.monotonic()-start<5
    deadline=time.monotonic()+1
    while not stopped(pidfile) and time.monotonic()<deadline:time.sleep(.01)
    assert stopped(pidfile),'esbuild-like child must not remain running'
