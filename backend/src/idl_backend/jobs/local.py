"""Bounded Windows-compatible spawn execution, with a transport-neutral contract."""
from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
import multiprocessing
import queue
import threading
import time
import uuid

from idl_backend.contracts.tasks import execute_assessment, execute_vision

INFERENCE_ENDPOINTS = {"/emnist/predict-digits", "__warmup_digits"}


def inference_loop(requests, events):
    """Keep model imports, weights and device allocations alive across requests."""
    while True:
        request = requests.get()
        if request is None:
            return
        kind, endpoint, payload, execution_id = request
        execute(kind, endpoint, payload, events, execution_id)


def execute(kind, endpoint, payload, events, execution_id=None):
    started = time.time()
    try:
        def progress(value, phase, message, **details):
            events.put(("progress", {"progress": int(value), "phase": phase, "message": message, **details}))
        if kind == "vision":
            if endpoint == "__warmup_digits":
                from idl_backend.vision.inference.digits import warmup_digits
                output = warmup_digits()
            else:
                output = execute_vision(endpoint, payload, progress, execution_id=execution_id)
            result = {"ok": True, "endpoint": endpoint, "result": output, "durationMs": int((time.time() - started) * 1000)}
        else:
            result = execute_assessment(endpoint, payload)
        events.put(("complete", result))
    except Exception as exc:
        events.put(("error", f"{type(exc).__name__}: {exc}"))


class LocalJobs:
    def __init__(self, *, workers=1, capacity=64, timeout=1800, ttl=86400):
        self.pool = ThreadPoolExecutor(max_workers=workers)
        # A training job must not occupy the dispatcher used by handwriting.
        self.inference_pool = ThreadPoolExecutor(max_workers=1)
        self.inference_process = None
        self.inference_requests = self.inference_events = None
        self.done = {}
        self.capacity = threading.BoundedSemaphore(capacity)
        self.timeout, self.ttl = timeout, ttl
        self.lock = threading.RLock()
        self.records, self.identities, self.processes = {}, {}, {}
        self.closed = False
        self.contexts, self.outbox = {}, {}

    def submit(self, kind, endpoint, payload, course_uuid=None, idempotency_key=None, cache_context=None, submitted_by=None):
        fingerprint = hashlib.sha256(json.dumps([kind, course_uuid, endpoint, payload, submitted_by], sort_keys=True, separators=(",", ":")).encode()).hexdigest()
        identity = (kind, course_uuid, submitted_by, idempotency_key) if idempotency_key else None
        with self.lock:
            self._expire()
            if self.closed:
                raise RuntimeError("Local executor is shutting down.")
            if identity in self.identities:
                task_id, previous = self.identities[identity]
                if previous != fingerprint:
                    raise ValueError("Idempotency key was reused for a different request.")
                return self.get(task_id)
            if not self.capacity.acquire(blocking=False):
                raise RuntimeError("Local task queue is full.")
            task_id = uuid.uuid4().hex
            self.records[task_id] = {"id": task_id, "course_uuid": course_uuid, "endpoint": endpoint, "submittedAt": time.time(), "submittedBy": submitted_by, "status": "queued", "progress": 0}
            if identity:
                self.identities[identity] = (task_id, fingerprint)
            if cache_context:
                self.contexts[task_id] = cache_context
            self.done[task_id] = threading.Event()
            pool = self.inference_pool if kind == "vision" and endpoint in INFERENCE_ENDPOINTS else self.pool
            pool.submit(self._run, task_id, kind, endpoint, dict(payload))
            return self.get(task_id)

    def _expire(self):
        now = time.time()
        expired = {key for key, record in self.records.items() if record.get("finishedAt", now) + self.ttl < now}
        for key in expired:
            del self.records[key]
            self.done.pop(key, None)
        self.identities = {key: value for key, value in self.identities.items() if value[0] not in expired}

    def _run(self, task_id, kind, endpoint, payload):
        ctx = multiprocessing.get_context("spawn")
        resident = kind == "vision" and endpoint in INFERENCE_ENDPOINTS
        events = process = None
        reusable = False
        try:
            with self.lock:
                if self.closed:
                    raise RuntimeError("Executor closed before task started.")
                self.records[task_id].update(status="running", phase="starting", message="Starting local computation.")
                if resident:
                    if self.inference_process is None or not self.inference_process.is_alive():
                        self._dispose_inference()
                        self.inference_requests, self.inference_events = ctx.Queue(), ctx.Queue()
                        self.inference_process = ctx.Process(target=inference_loop, args=(self.inference_requests, self.inference_events), daemon=True)
                        self.inference_process.start()
                    process, events = self.inference_process, self.inference_events
                    self.inference_requests.put((kind, endpoint, payload, task_id))
                else:
                    events = ctx.Queue()
                    process = ctx.Process(target=execute, args=(kind, endpoint, payload, events, task_id), daemon=True)
                    process.start()
                self.processes[task_id] = process
            deadline = time.monotonic() + (min(self.timeout, 60) if endpoint == "__warmup_digits" else self.timeout)
            while time.monotonic() < deadline:
                try:
                    event, value = events.get(timeout=0.2)
                except queue.Empty:
                    if not process.is_alive():
                        raise RuntimeError("Local computation exited without a result.")
                    continue
                with self.lock:
                    if event == "progress":
                        self.records[task_id].update(value)
                    elif event == "complete":
                        reusable = True
                        self.records[task_id].update(status="complete", progress=100, result=value)
                        context = self.contexts.pop(task_id, None)
                        if context:
                            self.outbox[task_id] = {"id": task_id, "kind": kind, "cache_context": context, "result": value}
                        break
                    else:
                        # Application errors finish a request without poisoning the worker.
                        reusable = True
                        raise RuntimeError(value)
            else:
                raise TimeoutError("Local task exceeded its configured timeout.")
        except Exception as exc:
            with self.lock:
                self.records[task_id].update(status="error", error=str(exc))
        finally:
            if resident:
                if not reusable:
                    with self.lock:
                        self._dispose_inference()
            elif process is not None and process.pid:
                process.join(timeout=2)
                if process.is_alive():
                    process.terminate()
                    process.join(timeout=2)
            if not resident and events is not None:
                events.close()
            with self.lock:
                self.records[task_id]["finishedAt"] = time.time()
                self.processes.pop(task_id, None)
                self.done[task_id].set()
            self.capacity.release()

    def _dispose_inference(self):
        process = self.inference_process
        if process is not None and process.pid:
            if process.is_alive():
                process.terminate()
            process.join(timeout=2)
        for channel in (self.inference_requests, self.inference_events):
            if channel is not None:
                channel.cancel_join_thread()
                channel.close()
        self.inference_process = self.inference_requests = self.inference_events = None

    def wait(self, task_id, timeout=None):
        with self.lock:
            event = self.done.get(task_id)
        if event is not None:
            event.wait(self.timeout if timeout is None else timeout)
        return self.get(task_id)

    def warmup_inference(self, timeout=60):
        record = self.submit("vision", "__warmup_digits", {})
        record = self.wait(record["id"], timeout)
        if record["status"] != "complete":
            raise RuntimeError(record.get("error", "Model warm-up timed out."))
        return record["result"]["result"]

    def get(self, task_id):
        with self.lock:
            self._expire()
            record = self.records.get(task_id)
            return json.loads(json.dumps(record)) if record else None

    def completions(self):
        with self.lock:
            return json.loads(json.dumps(list(self.outbox.values())[:50]))

    def acknowledge(self, task_id):
        with self.lock:
            self.outbox.pop(task_id, None)

    def close(self):
        with self.lock:
            self.closed = True
            for process in self.processes.values():
                if process.pid and process.is_alive():
                    process.terminate()
        self.pool.shutdown(wait=True)
        self.inference_pool.shutdown(wait=True)
        with self.lock:
            self._dispose_inference()
