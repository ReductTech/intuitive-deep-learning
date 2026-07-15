from __future__ import annotations

import json
import sqlite3
import tempfile
import threading
import unittest
import urllib.request
from contextlib import closing
from pathlib import Path
from unittest.mock import patch

import lab_launcher
import service_runtime
from module_http_service import BehaviorStore, create_server


SCRIPTS_DIR = Path(__file__).resolve().parents[1]


class RuntimeNamingTests(unittest.TestCase):
    def test_public_and_internal_python_roles_have_unambiguous_names(self) -> None:
        for filename in ("lab_launcher.py", "service_runtime.py", "module_http_service.py"):
            self.assertTrue((SCRIPTS_DIR / filename).is_file(), filename)
        for old_filename in ("lesson_page.py", "page_runtime.py", "module_server.py"):
            self.assertFalse((SCRIPTS_DIR / old_filename).exists(), old_filename)

    def test_shell_entrypoints_only_call_lab_launcher(self) -> None:
        for filename in ("start-all-services.sh", "run-lesson-page.sh"):
            content = (SCRIPTS_DIR / filename).read_text(encoding="utf-8")
            self.assertIn("lab_launcher.py", content)
            self.assertNotIn("lesson_page.py", content)

    def test_launcher_parser_exposes_all_supported_actions(self) -> None:
        parser = lab_launcher._build_parser()
        self.assertTrue(parser.parse_args(["--start-services"]).start_services)
        self.assertTrue(parser.parse_args(["--init"]).init)
        self.assertTrue(parser.parse_args(["--status"]).status)
        self.assertTrue(parser.parse_args(["--stop"]).stop)
        opened = parser.parse_args(["--open-module", "--module-id", "CourseMap"])
        self.assertTrue(opened.open_module)
        self.assertEqual(opened.module_id, "CourseMap")

    def test_open_module_returns_a_url_without_browser_bridge(self) -> None:
        server = {"ok": True, "url": service_runtime.MODULES_URL}
        with patch.object(service_runtime, "ensure_module_http_service", return_value=server):
            result = service_runtime.open_module("CourseMap")

        self.assertTrue(result["ok"])
        self.assertEqual(result["pageUrl"], service_runtime.get_module_url("CourseMap"))
        self.assertNotIn("page", result)

    def test_sources_do_not_reference_a_host_specific_browser_bridge(self) -> None:
        roots = [SCRIPTS_DIR, SCRIPTS_DIR.parent / "modules"]
        sources = [SCRIPTS_DIR.parent / "SKILL.md"]
        for root in roots:
            sources.extend(path for path in root.rglob("*") if path.suffix in {".py", ".sh", ".html", ".js", ".css", ".md"})
        forbidden = ("WS" + "_TEST", "ws" + "-test", "ws" + "Test")
        for source in sources:
            content = source.read_text(encoding="utf-8", errors="ignore")
            for token in forbidden:
                self.assertNotIn(token, content, f"{token} found in {source}")

    def test_model_viewer_vendor_url_keeps_the_page_path_prefix(self) -> None:
        source = (SCRIPTS_DIR.parent / "modules" / "shared" / "module-components.js").read_text(encoding="utf-8")
        self.assertIn("document.currentScript", source)
        self.assertIn("new URL('vendor/model-viewer/3.5.0/model-viewer.min.js'", source)
        self.assertNotIn("'/shared/vendor/model-viewer", source)

    def test_runtime_spawns_the_named_module_http_service(self) -> None:
        process_info = {"pid": 123, "command": [], "log": "modules-http.log", "label": "modules"}
        classification = {"foreign": [], "skill": [], "all": []}
        with patch.object(service_runtime, "_is_http_ready", return_value=False), patch.object(
            service_runtime,
            "_is_service_health_ready",
            return_value=False,
        ), patch.object(
            service_runtime,
            "_classify_port_processes",
            return_value=classification,
        ), patch.object(
            service_runtime,
            "_spawn_background",
            return_value=process_info,
        ) as spawn, patch.object(
            service_runtime,
            "_remember_service_process",
        ), patch.object(
            service_runtime,
            "_wait_until",
            return_value=True,
        ):
            result = service_runtime.ensure_module_http_service()

        self.assertTrue(result["ok"])
        command = spawn.call_args.args[0]
        self.assertIn(str(SCRIPTS_DIR / "module_http_service.py"), command)
        self.assertNotIn(str(SCRIPTS_DIR / "module_server.py"), command)
        self.assertEqual(command[command.index("--host") + 1], "0.0.0.0")

    def test_course_map_reports_the_behavior_export_on_every_page_show(self) -> None:
        course_map = (SCRIPTS_DIR.parent / "modules" / "CourseMap" / "course-map.js").read_text(encoding="utf-8")
        telemetry = (SCRIPTS_DIR.parent / "modules" / "shared" / "telemetry.js").read_text(encoding="utf-8")
        self.assertIn('window.addEventListener("pageshow"', course_map)
        self.assertIn("telemetry.reportSkillMemory()", course_map)
        self.assertIn("var SKILL_MEMORY_ID = 'intuitive-deep-learning'", telemetry)
        self.assertIn("var MEMORY_EXPORT_ENDPOINT = '/__telemetry/export'", telemetry)
        self.assertIn("ipc.reportSkillMemory({", telemetry)
        self.assertIn("a[data-next-lesson]", telemetry)


class ModuleHttpServiceTests(unittest.TestCase):
    def test_behavior_store_repairs_a_missing_schema_before_insert(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            store = BehaviorStore(Path(temp_dir))
            with closing(sqlite3.connect(store.database_path)) as connection:
                with connection:
                    connection.execute("DROP TABLE behavior_events")
            inserted = store.insert([{"event_name": "page_view", "module_id": "test"}])
            self.assertEqual(inserted, 1)
            self.assertEqual(store.count(), 1)

    def test_health_contract_survives_file_rename(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            modules_dir = root / "modules"
            dataset_dir = root / "dataset"
            history_dir = root / "history"
            modules_dir.mkdir()
            dataset_dir.mkdir()
            server = create_server("0.0.0.0", 0, modules_dir, history_dir, dataset_dir)
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            try:
                url = f"http://127.0.0.1:{server.server_address[1]}/__telemetry/health"
                with urllib.request.urlopen(url, timeout=2) as response:
                    payload = json.loads(response.read())
                self.assertEqual(response.status, 200)
                self.assertTrue(payload["ok"])
                self.assertEqual(payload["service"], "deep-learning-module-server")
                self.assertIn("dataset-mount-v1", payload["capabilities"])
            finally:
                server.shutdown()
                server.server_close()
                thread.join(timeout=2)

    def test_glb_content_type_is_stable_across_operating_systems(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            modules_dir = root / "modules"
            dataset_dir = root / "dataset"
            history_dir = root / "history"
            modules_dir.mkdir()
            dataset_dir.mkdir()
            (modules_dir / "model.glb").write_bytes(b"glTF")
            server = create_server("127.0.0.1", 0, modules_dir, history_dir, dataset_dir)
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            try:
                url = f"http://127.0.0.1:{server.server_address[1]}/model.glb"
                request = urllib.request.Request(url, method="HEAD")
                with urllib.request.urlopen(request, timeout=2) as response:
                    content_type = response.headers.get_content_type()
                self.assertEqual(content_type, "model/gltf-binary")
            finally:
                server.shutdown()
                server.server_close()
                thread.join(timeout=2)


if __name__ == "__main__":
    unittest.main()
