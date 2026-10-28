"""Bounded Linux build execution, including esbuild descendants and lost leases."""
import os
import signal
import subprocess
import threading
from .errors import BusinessError


def run_build(command, env, checkpoint, *, timeout=90, interval=5):
    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                               env=env, start_new_session=True)
    expired = threading.Event()

    def kill_group():
        try:
            os.killpg(process.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass

    def expire():
        expired.set()
        kill_group()

    watchdog = threading.Timer(timeout, expire)
    watchdog.daemon = True
    try:
        watchdog.start()
        while True:
            try:
                stdout, stderr = process.communicate(timeout=interval)
                if expired.is_set():
                    raise BusinessError(422, 'BUILD_TIMEOUT', '课程构建超时，构建进程已终止。')
                return process.returncode, stdout, stderr
            except subprocess.TimeoutExpired:
                if expired.is_set():
                    raise BusinessError(422, 'BUILD_TIMEOUT', '课程构建超时，构建进程已终止。')
                checkpoint()
    finally:
        watchdog.cancel()
        # Also runs when a database heartbeat raises or the parent exits first.
        kill_group()
        process.wait(timeout=5)
        process.stdout.close()
        process.stderr.close()
