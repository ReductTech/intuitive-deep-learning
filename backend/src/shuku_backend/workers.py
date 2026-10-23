"""Durable claiming and fenced completion; external effects stay outside transactions."""
import logging
import threading
import time


class Worker:
    def __init__(self, store, handlers, clock=time.time):
        self.store,self.handlers,self.clock=store,handlers,clock
        self.stop_event=threading.Event()
        self.thread=None

    def run_once(self):
        task=self.store.claim(self.handlers.keys(),self.clock())
        if not task:return False
        try:
            result=self.handlers[task["kind"]](task,lambda state:self.store.checkpoint(task["id"],task["lease_token"],self.clock(),state))
        except Exception:
            # Do not store external error strings, which can contain credentials.
            self.store.finish(task["id"],task["lease_token"],self.clock(),error="HANDLER_FAILED")
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
