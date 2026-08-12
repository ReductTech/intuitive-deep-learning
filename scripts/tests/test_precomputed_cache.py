from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from langchain_app.precomputed_cache import (
    CacheValidationError,
    VersionedJsonCache,
    atomic_write_json,
    normalize_cache_key,
    validate_cache_document,
)
from langchain_app.tasks.decision import analyze_decision_intake, generate_extra_decision_factors


def document(status: str = "approved") -> dict[str, object]:
    return {
        "schema_version": 1,
        "namespace": "decision-candidates",
        "content_version": 1,
        "generator": {"id": "test"},
        "entries": [{
            "id": "decision-001",
            "key": "读研",
            "aliases": ["考研究生"],
            "outputs": {
                "intake": {
                    "status": "ok",
                    "decision": "要不要读研？",
                    "positive_label": "读研",
                    "negative_label": "不读研",
                    "primary_factor": {"name": "研究兴趣"},
                },
                "extra_factors": {"factors": [{"name": "职业发展"}, {"name": "经济压力"}]},
            },
            "review": {"status": status},
        }],
    }


class VersionedJsonCacheTests(unittest.TestCase):
    def test_only_approved_entries_are_served_and_results_are_copied(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            path = root / "decision-candidates.json"
            atomic_write_json(path, document())
            cache = VersionedJsonCache("decision-candidates", root=root)
            first = cache.lookup("要不要考研究生？")
            self.assertIsNotNone(first)
            first["outputs"] = {}
            self.assertIn("intake", cache.lookup("读研")["outputs"])

            atomic_write_json(path, document("generated"))
            self.assertIsNone(cache.lookup("读研"))

    def test_duplicate_normalized_alias_is_rejected(self) -> None:
        invalid = document()
        invalid["entries"][0]["aliases"] = ["考研究生", "要不要考研究生？"]
        with tempfile.TemporaryDirectory() as directory, self.assertRaises(CacheValidationError):
            atomic_write_json(Path(directory) / "decision-candidates.json", invalid)


class DecisionCacheRouteTests(unittest.TestCase):
    def test_intake_cache_hit_does_not_call_model(self) -> None:
        cached = {"status": "ok", "decision": "要不要读研？"}
        with patch("langchain_app.tasks.decision.cached_decision_intake", return_value=cached), patch(
            "langchain_app.tasks.decision.generate_decision_intake_uncached"
        ) as uncached:
            self.assertEqual(analyze_decision_intake({"decision": "读研"}, 1.0), cached)
            uncached.assert_not_called()

    def test_extra_factor_cache_hit_does_not_call_model(self) -> None:
        cached = {"factors": [{"name": "A"}, {"name": "B"}]}
        with patch("langchain_app.tasks.decision.cached_extra_decision_factors", return_value=cached), patch(
            "langchain_app.tasks.decision.generate_extra_decision_factors_uncached"
        ) as uncached:
            self.assertEqual(generate_extra_decision_factors({"decision": "要不要读研？"}, 1.0), cached)
            uncached.assert_not_called()


class CheckedInDecisionCacheTests(unittest.TestCase):
    def test_every_displayed_candidate_has_one_approved_complete_cache_entry(self) -> None:
        repo_root = Path(__file__).resolve().parents[2]
        candidates = json.loads(
            (repo_root / "modules" / "Neuron-Guide-React" / "data" / "decisionCandidates.json").read_text(encoding="utf-8")
        )["rows"]
        labels = [label for row in candidates for label in row]
        cache_path = repo_root / "scripts" / "langchain_app" / "data" / "precomputed" / "decision-candidates.json"
        cache_document = validate_cache_document(json.loads(cache_path.read_text(encoding="utf-8")), namespace="decision-candidates")
        self.assertEqual(len(labels), 50)
        self.assertEqual(len(cache_document["entries"]), len(labels))
        self.assertEqual(
            {normalize_cache_key(label) for label in labels},
            {normalize_cache_key(entry["key"]) for entry in cache_document["entries"]},
        )
        cache = VersionedJsonCache("decision-candidates", root=cache_path.parent)
        for label in labels:
            with self.subTest(label=label):
                entry = cache.lookup(label)
                self.assertIsNotNone(entry)
                self.assertEqual(entry["review"]["status"], "approved")
                self.assertEqual(len(entry["outputs"]["extra_factors"]["factors"]), 2)
                self.assertIsNotNone(cache.lookup(entry["outputs"]["intake"]["decision"]))

if __name__ == "__main__":
    unittest.main()
