"""HTTP transport for the local dataset and GPU teaching service."""

from __future__ import annotations

import json
import traceback
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any
from urllib.parse import parse_qs, urlparse

import insightface_tool
import gpu_service
from dataset_service import *
from gpu_service import *

def _json_bytes(payload: dict[str, Any]) -> bytes:
    return json.dumps(payload, ensure_ascii=False).encode("utf-8")

class Handler(BaseHTTPRequestHandler):
    def log_message(self, format: str, *args: Any) -> None:
        print(f"[lenet5-cnn-service] {self.address_string()} {format % args}", flush=True)

    def send_json(self, status: int, payload: dict[str, Any]) -> None:
        body = _json_bytes(payload)
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def send_binary(self, status: int, body: bytes, content_type: str) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path
        if path == "/health":
            self.send_json(200, {
                "ok": True,
                "service": "lenet5-cnn-service",
                "dataset": {
                    "images": IMAGE_PATH.exists(),
                    "labels": LABEL_PATH.exists(),
                    "olivetti_faces": OLIVETTI_FACE_PATH.exists(),
                    "olivetti_targets": OLIVETTI_TARGET_PATH.exists(),
                    "lfw_balanced_faces": LFW_FACE_PATH.exists(),
                    "lfw_balanced_targets": LFW_TARGET_PATH.exists(),
                    "face_demo": FACE_DEMO_IMAGE_PATH.exists(),
                },
            })
            return
        if path == "/face-recog/lenet-train-status":
            query = parse_qs(parsed.query)
            job_id = str((query.get("job_id") or query.get("id") or [""])[0])
            job = get_lenet_job(job_id)
            if not job:
                self.send_json(404, {"ok": False, "error": "Training job not found."})
                return
            self.send_json(200, {"ok": True, "result": job})
            return
        if path == "/face-recog/demo-image":
            if not FACE_DEMO_IMAGE_PATH.exists():
                self.send_json(404, {"ok": False, "error": "dataset/face_demo.png not found"})
                return
            self.send_binary(200, FACE_DEMO_IMAGE_PATH.read_bytes(), "image/png")
            return
        self.send_json(404, {"ok": False, "error": "Not found"})

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        if path not in {
            "/lenet5/fixed-kernel-preview",
            "/lenet5/fixed-kernel-train",
            "/lenet5/sequence-sample",
            "/face-recog/fixed-kernel-preview",
            "/face-recog/fixed-kernel-train",
            "/face-recog/lenet-train",
            "/face-recog/embedding-similarity",
        }:
            self.send_json(404, {"ok": False, "error": "Not found"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length > MAX_BODY_BYTES:
                raise ValueError("Request body too large.")
            raw = self.rfile.read(length).decode("utf-8") if length else "{}"
            payload = json.loads(raw or "{}")
            body = payload if isinstance(payload, dict) else {}
            if path == "/lenet5/fixed-kernel-preview":
                result = preview_fixed_kernel(body)
            elif path == "/lenet5/fixed-kernel-train":
                result = train_fixed_kernel(body)
            elif path == "/lenet5/sequence-sample":
                result = build_sequence_sample(body)
            elif path == "/face-recog/fixed-kernel-preview":
                result = preview_face_fixed_kernel(body)
            elif path == "/face-recog/fixed-kernel-train":
                result = train_face_fixed_kernel(body)
            elif path == "/face-recog/embedding-similarity":
                result = face_embedding_similarity(body)
            elif path == "/face-recog/lenet-train" and body.get("async") is True:
                result = start_lenet_job(body)
            else:
                result = train_face_lenet(body)
            self.send_json(200, {"ok": True, "result": result})
        except Exception as exc:
            print(f"[lenet5-cnn-service:error] {type(exc).__name__}: {exc}", flush=True)
            print(traceback.format_exc(), flush=True)
            self.send_json(500, {"ok": False, "error": str(exc)})


def main() -> int:

    print(f"[lenet5-cnn-service] initializing InsightFace model root: {insightface_tool.model_root()}", flush=True)
    gpu_service.INSIGHTFACE_APP = insightface_tool.get_face_app()
    server = ThreadingHTTPServer((DEFAULT_HOST, DEFAULT_PORT), Handler)
    print(f"[lenet5-cnn-service] listening on http://{DEFAULT_HOST}:{DEFAULT_PORT}", flush=True)
    print(f"[lenet5-cnn-service] dataset root: {DATASET_DIR}", flush=True)
    server.serve_forever()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
