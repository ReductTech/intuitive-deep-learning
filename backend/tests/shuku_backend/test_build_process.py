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
    class BrokenWatchdog:
        def __init__(self,*args,**kwargs):pass
        def start(self):raise RuntimeError('no thread available')
        def join(self):pass
    monkeypatch.setattr(build_process.subprocess,'Popen',launch)
    monkeypatch.setattr(build_process.threading,'Thread',BrokenWatchdog)
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


def test_build_environment_preserves_windows_bootstrap_but_never_host_credentials():
    from shuku_backend.build_process import build_environment
    env=build_environment({'SystemRoot':'C:/Windows','SYSTEMROOT':'C:/Windows','PATH':'node-bin','MYSQL_URL_TEST':'secret','GITHUB_TOKEN':'secret','HTTPS_PROXY':'private','NODE_OPTIONS':'unsafe'})
    assert env=={'SystemRoot':'C:/Windows','SYSTEMROOT':'C:/Windows','PATH':'node-bin','NODE_OPTIONS':'--max-old-space-size=256'}


def test_parent_success_waits_for_stray_child_to_stop_before_return(tmp_path):
    path=tmp_path/'child.pid'
    script="import subprocess,sys;from pathlib import Path;p=subprocess.Popen([sys.executable,'-c','import time;time.sleep(60)'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);Path(sys.argv[1]).write_text(str(p.pid))"
    assert run_build([sys.executable,'-c',script,str(path)],os.environ.copy(),lambda:None,timeout=3,interval=.05)[0]==0
    assert stopped(path),'success must also clean children that outlive Node'


def test_repeated_attempts_cannot_overlap_process_groups(tmp_path):
    previous=None
    for index in range(3):
        if previous:assert stopped(previous),'new attempt started before old child stopped'
        folder=tmp_path/str(index);folder.mkdir();args,pidfile=command(folder)
        with pytest.raises(BusinessError) as error:run_build(args,os.environ.copy(),lambda:None,timeout=.7,interval=.05)
        assert error.value.code=='BUILD_TIMEOUT' and stopped(pidfile)
        previous=pidfile


def test_blocked_heartbeat_kills_group_before_lease_can_be_reclaimed(tmp_path):
    args,pidfile=command(tmp_path)
    def checkpoint():
        if not pidfile.exists():return
        time.sleep(.8)
        assert stopped(pidfile),'heartbeat watchdog must not wait for the blocked DB callback'
    with pytest.raises(BusinessError) as error:run_build(args,os.environ.copy(),checkpoint,timeout=5,interval=.03,heartbeat_timeout=.5)
    assert error.value.code=='BUILD_HEARTBEAT_TIMEOUT' and stopped(pidfile)


def test_heartbeat_exception_is_sanitized_and_children_stopped(tmp_path):
    args,pidfile=command(tmp_path)
    def checkpoint():
        if pidfile.exists():raise RuntimeError('private-database-secret')
    with pytest.raises(BusinessError) as error:run_build(args,os.environ.copy(),checkpoint,interval=.05)
    assert error.value.code=='BUILD_HEARTBEAT_FAILED' and 'secret' not in str(error.value)
    assert stopped(pidfile)


def test_stale_initial_heartbeat_never_starts_a_compiler(monkeypatch):
    from shuku_backend import build_process
    monkeypatch.setattr(build_process.subprocess,'Popen',lambda *args,**kwargs:pytest.fail('stale lease spawned a compiler'))
    with pytest.raises(BusinessError) as error:run_build([],{},lambda:time.sleep(.1),heartbeat_timeout=.05)
    assert error.value.code=='BUILD_HEARTBEAT_TIMEOUT'


def test_unconfirmed_cleanup_fails_closed(monkeypatch):
    from shuku_backend import build_process
    monkeypatch.setattr(build_process,'_group_running',lambda pgid:True)
    with pytest.raises(BusinessError) as error:run_build([sys.executable,'-c','pass'],os.environ.copy(),lambda:None,cleanup_timeout=.05)
    assert error.value.code=='BUILD_CLEANUP_FAILED'
