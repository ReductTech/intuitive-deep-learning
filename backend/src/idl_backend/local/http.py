"""Native HTTP gateway: same job contract as cloud, with no Docker or Celery."""
from __future__ import annotations

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
import secrets
from urllib.parse import parse_qs, urlparse

from idl_backend.contracts.courses import load_courses
from idl_backend.contracts.tasks import endpoints
from idl_backend.jobs.local import LocalJobs


def create_server(host="127.0.0.1", port=28431, *, kind="vision", course_uuid=None, workers=1, courses=None, token=None, dev=False):
    courses = load_courses() if courses is None else courses
    if course_uuid and course_uuid not in courses:
        raise ValueError("Requested course UUID is not registered.")
    token = token if token is not None else os.environ.get("GPU_GATEWAY_API_TOKEN" if kind == "vision" else "LLM_GATEWAY_API_TOKEN", "")
    if not token and not dev:
        raise ValueError("Set an API token or explicitly enable --dev for local debugging.")
    if dev and not token and host not in {"localhost", "127.0.0.1", "::1"}:
        raise ValueError("Unauthenticated development mode may only bind loopback.")
    jobs = LocalJobs(workers=workers)

    class Handler(BaseHTTPRequestHandler):
        def send_json(self, status, payload):
            body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(body)

        def authorized(self):
            supplied = self.headers.get("X-API-Key", "")
            authorization = self.headers.get("Authorization", "")
            if authorization.lower().startswith("bearer "):
                supplied = authorization[7:]
            if token and not secrets.compare_digest(supplied, token):
                self.send_json(401, {"detail": "Invalid API token."})
                return False
            return True

        def do_OPTIONS(self):
            self.send_response(204)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, X-API-Key, Authorization, Idempotency-Key, X-Course-ID")
            self.end_headers()

        def do_GET(self):
            parsed = urlparse(self.path)
            path = parsed.path
            if path in {"/health", "/healthz", "/readyz"}:
                self.send_json(200, {"ok": True, "service": "vision-service" if kind == "vision" else "assessment-service", "protocolVersion": 1, "capabilities": ["jobs-v1", "course-uuid-v1"]})
                return
            if not self.authorized():
                return
            if path == "/v1/completions":
                self.send_json(200, {"records": jobs.completions()})
                return
            if path == "/v1/endpoints":
                self.send_json(200, {"endpoints": endpoints(kind), "courses": list(courses) if not course_uuid else [course_uuid]})
                return
            if path == "/face-recog/demo-image" and kind == "vision":
                from idl_backend.config import repository_root
                image = repository_root() / "assets/80396753-7fc8-4f55-9188-bddbdb828169/faces/face_demo.png"
                if not image.is_file():
                    self.send_json(404, {"detail": "Demo image unavailable."})
                    return
                body = image.read_bytes()
                self.send_response(200)
                self.send_header("Content-Type", "image/png")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return
            legacy = path in {"/lenet5/fixed-kernel-train-status", "/face-recog/lenet-train-status", "/visual-feature-learning/digit-train-status", "/visual-feature-learning/manual-feature-train-status"}
            task_id = (parse_qs(parsed.query).get("job_id") or [""])[0] if legacy else path.removeprefix("/v1/jobs/")
            record = jobs.get(task_id) if legacy or path.startswith("/v1/jobs/") else None
            if record is None:
                self.send_json(404, {"detail": "Task not found or expired."})
                return
            if legacy:
                public = dict(record, job_id=record["id"])
                if "result" in public:
                    public["result"] = public["result"].get("result", public["result"])
                self.send_json(200, {"ok": True, "result": public})
            else:
                self.send_json(200, record)

        def do_POST(self):
            if not self.authorized():
                return
            try:
                size = int(self.headers.get("Content-Length", "0"))
                if not 0 < size <= 4 * 1024 * 1024:
                    self.send_json(413, {"detail": "Invalid request size."})
                    return
                body = json.loads(self.rfile.read(size))
                if not isinstance(body, dict):
                    raise ValueError("Request must be an object.")
                path = urlparse(self.path).path
                if path.startswith("/v1/completions/") and path.endswith("/ack"):
                    jobs.acknowledge(path.split("/")[-2])
                    self.send_json(200, {"ok": True})
                    return
                legacy = path in endpoints(kind)
                if path != "/v1/jobs" and not legacy:
                    self.send_json(404, {"detail": "Unknown endpoint."})
                    return
                endpoint = path if legacy else body.get("endpoint")
                if endpoint not in endpoints(kind):
                    raise ValueError("Unsupported task endpoint.")
                payload = body if legacy else body.get("payload", {})
                if not isinstance(payload, dict):
                    raise ValueError("Task payload must be an object.")
                requested_course = course_uuid if legacy else body.get("course_uuid", course_uuid)
                if requested_course and (requested_course not in courses or course_uuid and requested_course != course_uuid):
                    raise ValueError("Course UUID is not registered by this service.")
                key = self.headers.get("Idempotency-Key") or (body.get("idempotency_key") if not legacy else None)
                if key and len(key) > 200:
                    raise ValueError("Idempotency key is too long.")
                context = None if legacy else body.get("cache_context")
                if context is not None and not isinstance(context, dict):
                    raise ValueError("Cache context must be an object.")
                record = jobs.submit(kind, endpoint, payload, requested_course, key, context, None if legacy else body.get("submitted_by"))
                if not legacy:
                    self.send_json(202, {**record, "statusUrl": "/v1/jobs/" + record["id"]})
                elif payload.get("async"):
                    self.send_json(200, {"ok": True, "result": dict(record, job_id=record["id"])})
                else:
                    record = jobs.wait(record["id"])
                    if record["status"] == "complete":
                        envelope = record["result"]
                        self.send_json(envelope.get("httpStatus", 200), envelope.get("body", {"ok": True, "result": envelope.get("result")}))
                    else:
                        self.send_json(500, {"ok": False, "error": record.get("error", "Task timed out.")})
            except (ValueError, TypeError) as exc:
                self.send_json(422, {"detail": str(exc)})
            except RuntimeError as exc:
                self.send_json(503, {"detail": str(exc)})

    server = ThreadingHTTPServer((host, port), Handler)
    server.jobs = jobs
    return server

