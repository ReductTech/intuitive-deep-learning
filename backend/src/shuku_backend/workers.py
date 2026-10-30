"""Durable claiming and fenced completion; external effects stay outside transactions."""
import logging
import threading
import time


class DeferredTask(Exception):
    """Wait for an active dependency without consuming an execution attempt."""


class Worker:
    def __init__(self, store, handlers, clock=time.time,maintenance=None):
        self.store,self.handlers,self.clock=store,handlers,clock
        self.stop_event=threading.Event()
        self.thread=None
        self.maintenance=maintenance

    def run_once(self):
        if self.maintenance:self.maintenance()
        task=self.store.claim(self.handlers.keys(),self.clock())
        if not task:return False
        try:
            result=self.handlers[task["kind"]](task,lambda state:self.store.checkpoint(task["id"],task["lease_token"],self.clock(),state))
        except DeferredTask:
            self.store.finish(task["id"],task["lease_token"],self.clock(),error="WAITING_FOR_RELATED_TASKS",deferred=True)
        except Exception as error:
            # Do not store external error strings, which can contain credentials.
            from .errors import BusinessError
            from .adapters.github import GitHubError
            import re
            code=error.code if isinstance(error,BusinessError) and re.fullmatch(r'[A-Z0-9_]{1,64}',error.code) else 'GITHUB_HTTP_'+str(error.status) if isinstance(error,GitHubError) and type(error.status) is int else 'HANDLER_FAILED'
            self.store.finish(task["id"],task["lease_token"],self.clock(),error=code)
        else:
            self.store.finish(task["id"],task["lease_token"],self.clock(),result=result)
        return True

    def start(self):
        if self.thread:raise RuntimeError("Worker already started")
        def loop():
            while not self.stop_event.is_set():
                try:
                    if self.run_once():continue
                except Exception:
                    logging.getLogger(__name__).warning("Worker iteration failed; checkpoint retained")
                self.stop_event.wait(0.25)
        self.thread=threading.Thread(target=loop,name="shuku-worker",daemon=False)
        self.thread.start()

    def close(self):
        self.stop_event.set()
        if self.thread:self.thread.join()
