from __future__ import annotations

"""Long-running HTTP service for lesson modules, datasets, and telemetry."""

import argparse
import hmac
import json
import mimetypes
import sqlite3
import threading
import time
import uuid
from contextlib import closing
from http.cookies import SimpleCookie
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlsplit


# Keep static asset responses identical on Windows and Linux. Python's default
# MIME table can depend on the Windows registry or the container's mime-support
# package, neither of which is guaranteed to know GLB files.
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("model/gltf-binary", ".glb")
mimetypes.add_type("model/gltf+json", ".gltf")


SCRIPT_DIR = Path(__file__).resolve().parent
SKILL_DIR = SCRIPT_DIR.parent
DEFAULT_MODULES_DIR = SKILL_DIR / "modules"
DEFAULT_DATASET_DIR = SKILL_DIR / "dataset"
DEFAULT_HISTORY_DIR = SKILL_DIR / "history"
TELEMETRY_PATH = "/__telemetry/events"
LEARNING_RECORDS_PATH = "/__telemetry/records"
EXPORT_PATH = "/__telemetry/export"
HEALTH_PATH = "/__telemetry/health"
TELEMETRY_SCRIPT = '<script src="/shared/telemetry.js"></script>'
TELEMETRY_COOKIE = "dl_telemetry_token"
TELEMETRY_TOKEN = "VLTQ9Z2HKguj6x"
SERVER_CAPABILITIES = ("dataset-mount-v1",)
MAX_REQUEST_BYTES = 1024 * 1024
MAX_BATCH_SIZE = 500
EVENT_COLUMNS = (
    "event_id",
    "session_id",
    "module_id",
    "module_name",
    "event_name",
    "event_kind",
    "event_value",
    "time_start",
    "time_end",
    "created_at",
    "updated_at",
    "is_deleted",
)


def unix_ms() -> int:
    return int(time.time() * 1000)


def integer_ms(value: Any, fallback: int) -> int:
    try:
        return int(value)
    except (TypeError, ValueError, OverflowError):
        return fallback


def infer_event_kind(event_name: str) -> str:
    if event_name.startswith("page_"):
        return "page"
    if event_name == "ui_click":
        return "click"
    if event_name.startswith("answer_") or event_name == "question_view":
        return "answer"
    if event_name.startswith(("control_", "range_")) or event_name == "form_submit":
        return "input"
    return "system"


class BehaviorStore:
    def __init__(self, history_dir: Path) -> None:
        self.history_dir = history_dir.resolve()
        self.database_path = self.history_dir / "behavior.sqlite3"
        self._lock = threading.Lock()
        self.history_dir.mkdir(parents=True, exist_ok=True)
        self._initialize()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.database_path, timeout=10)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA journal_mode=WAL")
        connection.execute("PRAGMA synchronous=NORMAL")
        # Re-check the schema for every independently opened connection. This
        # also repairs an empty database file without restarting the service.
        with connection:
            self._create_schema(connection)
        return connection

    @staticmethod
    def _create_schema(connection: sqlite3.Connection) -> None:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS behavior_events (
                event_id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                module_id TEXT NOT NULL,
                module_name TEXT NOT NULL,
                event_name TEXT NOT NULL,
                event_kind TEXT NOT NULL,
                event_value TEXT NOT NULL,
                time_start INTEGER NOT NULL,
                time_end INTEGER NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                is_deleted INTEGER NOT NULL DEFAULT 0 CHECK (is_deleted IN (0, 1))
            )
            """
        )
        connection.execute(
            "CREATE INDEX IF NOT EXISTS idx_behavior_session ON behavior_events(session_id, time_start)"
        )
        connection.execute(
            "CREATE INDEX IF NOT EXISTS idx_behavior_module ON behavior_events(module_id, time_start)"
        )
        connection.execute(
            "CREATE INDEX IF NOT EXISTS idx_behavior_event ON behavior_events(event_name, time_start)"
        )
        connection.execute(
            "CREATE INDEX IF NOT EXISTS idx_behavior_active ON behavior_events(is_deleted, time_start)"
        )

    def _initialize(self) -> None:
        with closing(self._connect()) as connection:
            with connection:
                self._create_schema(connection)

    @staticmethod
    def _normalize_event(raw: dict[str, Any]) -> dict[str, Any]:
        now = unix_ms()
        event_name = str(raw.get("event_name") or "unknown")
        time_end = integer_ms(raw.get("time_end"), now)
        time_start = integer_ms(raw.get("time_start"), time_end)
        if time_end < time_start:
            time_end = time_start

        event_value = raw.get("event_value")
        module_id = str(raw.get("module_id") or "unknown")
        return {
            "event_id": str(raw.get("event_id") or f"evt_{uuid.uuid4()}"),
            "session_id": str(raw.get("session_id") or "anonymous"),
            "module_id": module_id,
            "module_name": str(raw.get("module_name") or module_id),
            "event_name": event_name,
            "event_kind": str(raw.get("event_kind") or infer_event_kind(event_name)),
            "event_value": event_value if isinstance(event_value, (dict, list, str, int, float, bool)) else {},
            "time_start": time_start,
            "time_end": time_end,
            "created_at": now,
            "updated_at": now,
            "is_deleted": 0,
        }

    @staticmethod
    def _insert_event(connection: sqlite3.Connection, event: dict[str, Any]) -> bool:
        cursor = connection.execute(
            """
            INSERT OR IGNORE INTO behavior_events (
                event_id, session_id, module_id, module_name,
                event_name, event_kind, event_value,
                time_start, time_end, created_at, updated_at, is_deleted
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                event["event_id"],
                event["session_id"],
                event["module_id"],
                event["module_name"],
                event["event_name"],
                event["event_kind"],
                json.dumps(event["event_value"], ensure_ascii=False, separators=(",", ":")),
                event["time_start"],
                event["time_end"],
                event["created_at"],
                event["updated_at"],
                event["is_deleted"],
            ),
        )
        return cursor.rowcount == 1

    def insert(self, raw_events: list[dict[str, Any]]) -> int:
        normalized = [self._normalize_event(event) for event in raw_events]
        inserted = 0
        with self._lock:
            with closing(self._connect()) as connection:
                with connection:
                    for event in normalized:
                        inserted += int(self._insert_event(connection, event))
        return inserted

    def learning_records(self) -> dict[str, dict[str, Any]]:
        with closing(self._connect()) as connection:
            rows = connection.execute(
                """
                SELECT
                    module_id,
                    SUM(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END) AS study_count,
                    MAX(CASE WHEN event_name = 'page_view' THEN time_start END) AS last_opened_at,
                    SUM(
                        CASE WHEN event_name = 'page_leave' THEN
                            MIN(
                                86400000,
                                MAX(
                                    0,
                                    COALESCE(
                                        CAST(json_extract(event_value, '$.visible_duration_ms') AS INTEGER),
                                        time_end - time_start
                                    )
                                )
                            )
                        ELSE 0 END
                    ) AS total_view_ms
                FROM behavior_events
                WHERE is_deleted = 0
                  AND module_id NOT IN ('CourseMap', 'root', 'unknown')
                  AND event_name IN ('page_view', 'page_leave')
                GROUP BY module_id
                """
            ).fetchall()
        return {
            str(row["module_id"]): {
                "study_count": int(row["study_count"] or 0),
                "last_opened_at": int(row["last_opened_at"]) if row["last_opened_at"] is not None else None,
                "total_view_ms": int(row["total_view_ms"] or 0),
            }
            for row in rows
        }

    @staticmethod
    def _decode_row(row: sqlite3.Row) -> dict[str, Any]:
        event = dict(row)
        try:
            event["event_value"] = json.loads(event["event_value"])
        except (TypeError, json.JSONDecodeError):
            event["event_value"] = event.get("event_value")
        event["is_deleted"] = bool(event["is_deleted"])
        return event

    def query(self, limit: int = 200, offset: int = 0) -> list[dict[str, Any]]:
        safe_limit = max(1, min(5000, int(limit)))
        safe_offset = max(0, int(offset))
        with closing(self._connect()) as connection:
            rows = connection.execute(
                f"""
                SELECT {', '.join(EVENT_COLUMNS)}
                FROM behavior_events
                WHERE is_deleted = 0
                ORDER BY time_start DESC, rowid DESC
                LIMIT ? OFFSET ?
                """,
                (safe_limit, safe_offset),
            ).fetchall()
        return [self._decode_row(row) for row in reversed(rows)]

    def export_document(self) -> dict[str, Any]:
        with closing(self._connect()) as connection:
            rows = connection.execute(
                f"""
                SELECT {', '.join(EVENT_COLUMNS)}
                FROM behavior_events
                WHERE is_deleted = 0
                ORDER BY time_start ASC, rowid ASC
                """
            ).fetchall()
        return {
            "schema_version": 3,
            "exported_at": unix_ms(),
            "events": [self._decode_row(row) for row in rows],
        }

    def count(self) -> int:
        with closing(self._connect()) as connection:
            row = connection.execute("SELECT COUNT(*) FROM behavior_events WHERE is_deleted = 0").fetchone()
        return int(row[0] if row else 0)


class ModuleRequestHandler(SimpleHTTPRequestHandler):
    server_version = "DLModuleServer/1.0"

    @property
    def behavior_store(self) -> BehaviorStore:
        return self.server.behavior_store  # type: ignore[attr-defined]

    @property
    def dataset_root(self) -> Path:
        return self.server.dataset_root  # type: ignore[attr-defined]

    @property
    def telemetry_token(self) -> str:
        return self.server.telemetry_token  # type: ignore[attr-defined]

    def translate_path(self, path: str) -> str:
        """Mount the skill dataset at /dataset without exposing the skill root."""
        request_path = urlsplit(path).path
        if request_path == "/dataset" or request_path.startswith("/dataset/"):
            dataset_path = request_path[len("/dataset") :] or "/"
            modules_directory = self.directory
            try:
                self.directory = str(self.dataset_root)
                return super().translate_path(dataset_path)
            finally:
                self.directory = modules_directory
        return super().translate_path(path)

    def _send_json(
        self,
        status: int,
        payload: dict[str, Any],
        *,
        headers: dict[str, str] | None = None,
    ) -> None:
        body = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        for name, value in (headers or {}).items():
            self.send_header(name, value)
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def _provided_telemetry_token(self) -> str:
        authorization = self.headers.get("Authorization", "")
        if authorization.startswith("Bearer "):
            return authorization[7:].strip()
        explicit = self.headers.get("X-Telemetry-Token", "").strip()
        if explicit:
            return explicit
        cookie = SimpleCookie()
        try:
            cookie.load(self.headers.get("Cookie", ""))
        except Exception:
            return ""
        morsel = cookie.get(TELEMETRY_COOKIE)
        return morsel.value if morsel else ""

    def _require_telemetry_token(self) -> bool:
        supplied = self._provided_telemetry_token()
        if supplied and hmac.compare_digest(supplied, self.telemetry_token):
            return True
        self._send_json(401, {"ok": False, "error": "telemetry-auth-required"})
        return False

    def _html_file(self) -> Path | None:
        request_path = urlsplit(self.path).path
        translated = Path(self.translate_path(request_path))
        if translated.is_dir():
            translated = translated / "index.html"
        if translated.is_file() and translated.suffix.lower() in {".html", ".htm"}:
            return translated
        return None

    def _redirect_directory_without_slash(self) -> bool:
        parsed = urlsplit(self.path)
        if parsed.path.endswith("/"):
            return False
        translated = Path(self.translate_path(parsed.path))
        if not translated.is_dir():
            return False
        location = parsed.path + "/"
        if parsed.query:
            location += "?" + parsed.query
        self.send_response(308)
        self.send_header("Location", location)
        self.send_header("Content-Length", "0")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        return True

    def _serve_html(self, path: Path, *, include_body: bool) -> None:
        source = path.read_text(encoding="utf-8")
        if TELEMETRY_SCRIPT not in source:
            marker = "</body>"
            source = source.replace(marker, f"  {TELEMETRY_SCRIPT}\n{marker}", 1) if marker in source else source + TELEMETRY_SCRIPT
        body = source.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Last-Modified", self.date_time_string(path.stat().st_mtime))
        self.send_header("Cache-Control", "no-store")
        cookie = SimpleCookie()
        cookie[TELEMETRY_COOKIE] = self.telemetry_token
        cookie[TELEMETRY_COOKIE]["path"] = "/"
        cookie[TELEMETRY_COOKIE]["httponly"] = True
        cookie[TELEMETRY_COOKIE]["samesite"] = "Strict"
        self.send_header("Set-Cookie", cookie.output(header="").strip())
        self.end_headers()
        if include_body:
            self.wfile.write(body)

    def do_GET(self) -> None:
        parsed = urlsplit(self.path)
        if self._redirect_directory_without_slash():
            return
        if parsed.path == HEALTH_PATH:
            self._send_json(
                200,
                {
                    "ok": True,
                    "service": "deep-learning-module-server",
                    "events": self.behavior_store.count(),
                    "storage": "sqlite",
                    "telemetry_auth": True,
                    "capabilities": list(SERVER_CAPABILITIES),
                },
            )
            return
        if parsed.path in {TELEMETRY_PATH, LEARNING_RECORDS_PATH, EXPORT_PATH} and not self._require_telemetry_token():
            return
        if parsed.path == LEARNING_RECORDS_PATH:
            self._send_json(
                200,
                {"ok": True, "modules": self.behavior_store.learning_records()},
            )
            return
        if parsed.path == EXPORT_PATH:
            document = self.behavior_store.export_document()
            self._send_json(
                200,
                document,
                headers={"Content-Disposition": 'attachment; filename="telemetry-events.json"'},
            )
            return
        if parsed.path == TELEMETRY_PATH:
            query = parse_qs(parsed.query)
            try:
                limit = int(query.get("limit", ["200"])[0])
                offset = int(query.get("offset", ["0"])[0])
            except ValueError:
                self._send_json(400, {"ok": False, "error": "invalid-pagination"})
                return
            events = self.behavior_store.query(limit=limit, offset=offset)
            self._send_json(200, {"ok": True, "events": events, "count": len(events)})
            return

        html_path = self._html_file()
        if html_path:
            self._serve_html(html_path, include_body=True)
            return
        super().do_GET()

    def do_HEAD(self) -> None:
        parsed = urlsplit(self.path)
        if self._redirect_directory_without_slash():
            return
        if parsed.path in {HEALTH_PATH, TELEMETRY_PATH, LEARNING_RECORDS_PATH, EXPORT_PATH}:
            self.do_GET()
            return
        html_path = self._html_file()
        if html_path:
            self._serve_html(html_path, include_body=False)
            return
        super().do_HEAD()

    def do_POST(self) -> None:
        if urlsplit(self.path).path != TELEMETRY_PATH:
            self._send_json(404, {"ok": False, "error": "not-found"})
            return
        if not self._require_telemetry_token():
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = 0
        if length <= 0 or length > MAX_REQUEST_BYTES:
            self._send_json(413, {"ok": False, "error": "invalid-content-length"})
            return

        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            self._send_json(400, {"ok": False, "error": "invalid-json"})
            return

        events = payload.get("events") if isinstance(payload, dict) else payload
        if not isinstance(events, list) or not events or len(events) > MAX_BATCH_SIZE:
            self._send_json(400, {"ok": False, "error": "invalid-events"})
            return
        if any(not isinstance(event, dict) for event in events):
            self._send_json(400, {"ok": False, "error": "invalid-event"})
            return

        try:
            inserted = self.behavior_store.insert(events)
        except sqlite3.Error as exc:
            print(f"[module-http:telemetry] database write failed: {type(exc).__name__}: {exc}", flush=True)
            self._send_json(503, {"ok": False, "error": "telemetry-storage-unavailable"})
            return
        self._send_json(202, {"ok": True, "received": len(events), "inserted": inserted})

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Allow", "GET, HEAD, POST, OPTIONS")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def log_message(self, format_string: str, *args: Any) -> None:
        message = format_string % args
        if f'POST {TELEMETRY_PATH} ' in message and ' 202 ' in message:
            return
        print(f"[module-http] {self.address_string()} {message}", flush=True)


def create_server(
    host: str,
    port: int,
    modules_dir: Path,
    history_dir: Path,
    dataset_dir: Path | None = None,
) -> ThreadingHTTPServer:
    modules_root = modules_dir.resolve()
    dataset_root = (dataset_dir or DEFAULT_DATASET_DIR).resolve()
    store = BehaviorStore(history_dir)

    def handler(*args: Any, **kwargs: Any) -> ModuleRequestHandler:
        return ModuleRequestHandler(*args, directory=str(modules_root), **kwargs)

    server = ThreadingHTTPServer((host, port), handler)
    server.daemon_threads = True
    server.behavior_store = store  # type: ignore[attr-defined]
    server.dataset_root = dataset_root  # type: ignore[attr-defined]
    server.telemetry_token = TELEMETRY_TOKEN  # type: ignore[attr-defined]
    return server


def main() -> None:
    parser = argparse.ArgumentParser(description="Serve lesson modules and store browser behavior events.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=59411)
    parser.add_argument("--directory", type=Path, default=DEFAULT_MODULES_DIR)
    parser.add_argument("--history-dir", type=Path, default=DEFAULT_HISTORY_DIR)
    args = parser.parse_args()

    if not args.directory.is_dir():
        raise SystemExit(f"Modules directory does not exist: {args.directory}")
    if not DEFAULT_DATASET_DIR.is_dir():
        raise SystemExit(f"Dataset directory does not exist: {DEFAULT_DATASET_DIR}")

    server = create_server(args.host, args.port, args.directory, args.history_dir)
    print(
        json.dumps(
            {
                "ok": True,
                "service": "deep-learning-module-server",
                "host": args.host,
                "port": args.port,
                "directory": str(args.directory.resolve()),
                "datasetDirectory": str(DEFAULT_DATASET_DIR.resolve()),
                "history": str(args.history_dir.resolve()),
                "telemetry_auth": True,
            },
            ensure_ascii=False,
        ),
        flush=True,
    )
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
