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

from idl_backend.local.content_http import BehaviorStore, create_server


SCRIPTS_DIR = Path(__file__).resolve().parents[1]


class ModuleHttpServiceTests(unittest.TestCase):
    def test_duplicate_event_id_is_stored_only_once(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            store = BehaviorStore(Path(temp_dir))
            event = {"event_id": "same-operation", "event_name": "control_commit", "module_id": "test"}
            self.assertEqual(store.insert([event, event]), 1)
            self.assertEqual(store.count(), 1)

    def test_module_state_returns_only_the_latest_value_for_each_state_key(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            store = BehaviorStore(Path(temp_dir))
            store.insert([
                {"event_id": "old", "module_id": "lesson", "event_name": "control_commit", "time_end": 1, "event_value": {"state_key": "slider", "state": {"value": 2}}},
                {"event_id": "new", "module_id": "lesson", "event_name": "control_commit", "time_end": 2, "event_value": {"state_key": "slider", "state": {"value": 7}}},
                {"event_id": "done", "module_id": "lesson", "event_name": "module_complete", "time_end": 3, "event_value": {"state_key": "module:lesson", "state": {"completed": True}}},
            ])
            state = store.module_state("lesson")
            self.assertEqual(state["states"]["slider"]["state"], {"value": 7})
            self.assertTrue(state["completed"])

    def test_question_view_does_not_overwrite_submitted_question_state(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            store = BehaviorStore(Path(temp_dir))
            store.insert([
                {"event_id": "submitted", "module_id": "lesson", "event_name": "answer_submit", "time_end": 1, "event_value": {"state_key": "question:comparison", "state": {"answer_fields": [{"value": "原回答"}], "submitted": True, "result": {"message": "原评语"}}}},
                {"event_id": "viewed", "module_id": "lesson", "event_name": "question_view", "time_end": 2, "event_value": {"state_key": "question:comparison", "state": {"answer_fields": [{"value": ""}], "submitted": False}}},
            ])
            state = store.module_state("lesson")
            self.assertEqual(state["states"]["question:comparison"]["event_name"], "answer_submit")
            self.assertEqual(state["states"]["question:comparison"]["state"]["result"]["message"], "原评语")

    def test_behavior_store_repairs_a_missing_schema_before_insert(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            store = BehaviorStore(Path(temp_dir))
            with closing(sqlite3.connect(store.database_path)) as connection:
                with connection:
                    connection.execute("DROP TABLE behavior_events")
            inserted = store.insert([{"event_name": "page_view", "module_id": "test"}])
            self.assertEqual(inserted, 1)
            self.assertEqual(store.count(), 1)

    def test_incremental_sync_skips_existing_history_and_only_returns_new_events(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            history_dir = Path(temp_dir)
            store = BehaviorStore(history_dir)
            store.insert([{"event_id": "old-event", "event_name": "page_view", "module_id": "old"}])
            with closing(sqlite3.connect(store.database_path)) as connection:
                with connection:
                    connection.execute("DROP TABLE skill_memory_sync_state")

            store = BehaviorStore(history_dir)
            baseline = store.pending_sync_batch()
            self.assertEqual(baseline["events"], [])
            self.assertGreater(baseline["from_cursor"], 0)

            store.insert([{"event_id": "new-event", "event_name": "answer_submit", "module_id": "new"}])
            pending = store.pending_sync_batch()
            self.assertEqual([event["event_id"] for event in pending["events"]], ["new-event"])
            self.assertEqual(pending["event_count"], 1)
            self.assertGreater(pending["to_cursor"], pending["from_cursor"])

    def test_incremental_sync_retries_until_the_batch_is_acknowledged(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            store = BehaviorStore(Path(temp_dir))
            store.insert([{"event_id": "pending-event", "event_name": "page_view", "module_id": "test"}])

            first = store.pending_sync_batch()
            retry = store.pending_sync_batch()
            self.assertEqual(retry["batch_id"], first["batch_id"])
            self.assertEqual(retry["events"], first["events"])

            acknowledged = store.acknowledge_sync(first["to_cursor"])
            self.assertEqual(acknowledged, first["to_cursor"])
            self.assertEqual(store.pending_sync_batch()["events"], [])

    def test_health_contract_survives_file_rename(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            modules_dir = root / "modules"
            dataset_dir = root / "datasets"
            history_dir = root / "history"
            modules_dir.mkdir()
            dataset_dir.mkdir()
            (dataset_dir / "full.idx3-ubyte").write_bytes(b"server-only dataset")
            server = create_server("0.0.0.0", 0, modules_dir, history_dir)
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            try:
                url = f"http://127.0.0.1:{server.server_address[1]}/__telemetry/health"
                with urllib.request.urlopen(url, timeout=2) as response:
                    payload = json.loads(response.read())
                self.assertEqual(response.status, 200)
                self.assertTrue(payload["ok"])
                self.assertEqual(payload["service"], "deep-learning-module-server")
                self.assertIn("module-static-v1", payload["capabilities"])
                self.assertNotIn("dataset-mount-v1", payload["capabilities"])
                for endpoint in ("/dataset/full.idx3-ubyte", "/datasets/full.idx3-ubyte"):
                    with self.assertRaises(urllib.error.HTTPError) as error:
                        urllib.request.urlopen(f"http://127.0.0.1:{server.server_address[1]}{endpoint}", timeout=2)
                    self.assertEqual(error.exception.code, 404)
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
            server = create_server("127.0.0.1", 0, modules_dir, history_dir)
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
