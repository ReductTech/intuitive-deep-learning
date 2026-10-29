"""Bounded Linux build execution, including esbuild descendants and lost leases."""
import os
import signal
import subprocess
import threading
import time
from pathlib import Path
from .errors import BusinessError


def build_environment(environ=None):
    """Keep host credentials out of compilers, including case-insensitive Windows env."""
    allowed={'PATH','HOME','LANG','LC_ALL','TMPDIR','TEMP','TMP','SYSTEMROOT','WINDIR','USERPROFILE','COMSPEC','PATHEXT'}
    result={key:value for key,value in (os.environ if environ is None else environ).items() if key.upper() in allowed}
    result['NODE_OPTIONS']='--max-old-space-size=256'
    return result


def _group_running(pgid):
    """A killed zombie is not executing; only its parent/init can reap it."""
    if Path('/proc').is_dir():
        for entry in Path('/proc').iterdir():
            if not entry.name.isdigit():continue
            try:
                fields=(entry/'stat').read_text().rsplit(')',1)[1].split()
                if int(fields[2])==pgid and fields[0] not in ('Z','X'):return True
            except (FileNotFoundError,ProcessLookupError,PermissionError):continue
        return False
    try:os.killpg(pgid,0);return True
    except ProcessLookupError:return False


def run_build(command, env, checkpoint, *, timeout=90, interval=5,
              heartbeat_timeout=20, cleanup_timeout=5):
    # The heartbeat budget is below the store's 30-second lease. If a renewal
    # blocks, kill the compiler independently before another worker may claim it.
    def renew():
        started=time.monotonic()
        try:checkpoint()
        except BusinessError:raise
        except Exception:raise BusinessError(503,'BUILD_HEARTBEAT_FAILED','构建任务续期失败，构建已停止，请稍后重试。') from None
        return started
    heartbeat=renew()
    if time.monotonic()-heartbeat>=heartbeat_timeout:
        raise BusinessError(503,'BUILD_HEARTBEAT_TIMEOUT','构建任务续期超时，尚未启动构建，请稍后重试。')
    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                               env=env, start_new_session=True)
    stop=threading.Event();lock=threading.Lock();failure=[]
    deadline=time.monotonic()+timeout

    def kill_group():
        if os.name=='nt':
            if process.poll() is None:
                subprocess.run(['taskkill','/PID',str(process.pid),'/T','/F'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,creationflags=subprocess.CREATE_NO_WINDOW,timeout=cleanup_timeout)
            return
        try:
            os.killpg(process.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass

    def watch():
        while not stop.is_set():
            with lock:
                now=time.monotonic()
                if now>=deadline:failure.append('BUILD_TIMEOUT')
                elif now>=heartbeat+heartbeat_timeout:failure.append('BUILD_HEARTBEAT_TIMEOUT')
            if failure:
                kill_group();return
            stop.wait(.05)

    def check():
        if failure:
            code=failure[0]
            raise BusinessError(422 if code=='BUILD_TIMEOUT' else 503,code,'课程构建超时，构建进程已终止。' if code=='BUILD_TIMEOUT' else '构建任务续期超时，构建已停止，请稍后重试。')

    watchdog=threading.Thread(target=watch,name='shuku-build-watchdog',daemon=True)
    started=False
    try:
        watchdog.start();started=True
        while True:
            try:
                stdout, stderr = process.communicate(timeout=interval)
                check()
                return process.returncode, stdout, stderr
            except subprocess.TimeoutExpired:
                check()
                renewed=renew()
                with lock:heartbeat=renewed
                check()
    finally:
        stop.set()
        if started:watchdog.join()
        try:
            # Also runs on heartbeat errors and when Node exits before esbuild.
            kill_group()
            end=time.monotonic()+cleanup_timeout
            process.wait(timeout=cleanup_timeout)
            while os.name!='nt' and _group_running(process.pid):
                if time.monotonic()>=end:raise subprocess.TimeoutExpired(command,cleanup_timeout)
                time.sleep(.02)
        except (subprocess.TimeoutExpired,OSError):
            raise BusinessError(503,'BUILD_CLEANUP_FAILED','未确认旧构建进程退出，已停止重试，请联系管理员处理。') from None
        finally:
            process.stdout.close();process.stderr.close()
