from __future__ import annotations

import copy
import json
import os
import re
import threading
import unicodedata
from pathlib import Path
from typing import Any


DEFAULT_CACHE_ROOT = Path(__file__).resolve().parent / "data" / "precomputed"
_NAMESPACE_PATTERN = re.compile(r"^[a-z0-9][a-z0-9._-]*$")


class CacheValidationError(ValueError):
    """Raised when a checked-in cache document violates its public schema."""


def normalize_cache_key(value: str) -> str:
    normalized = unicodedata.normalize("NFKC", str(value or "")).strip().lower()
    normalized = re.sub(r"^(是否要|要不要|该不该|能不能|可不可以)", "", normalized).strip()
    normalized = re.sub(r"[？?。.!！\s]+$", "", normalized).strip()
    return re.sub(r"\s+", " ", normalized)


def validate_cache_document(document: Any, *, namespace: str | None = None) -> dict[str, Any]:
    if not isinstance(document, dict):
        raise CacheValidationError("Cache document must be a JSON object.")
    if document.get("schema_version") != 1:
        raise CacheValidationError("Cache schema_version must be 1.")
    actual_namespace = document.get("namespace")
    if not isinstance(actual_namespace, str) or not _NAMESPACE_PATTERN.fullmatch(actual_namespace):
        raise CacheValidationError("Cache namespace is missing or invalid.")
    if namespace is not None and actual_namespace != namespace:
        raise CacheValidationError(f"Expected cache namespace {namespace!r}, got {actual_namespace!r}.")
    if not isinstance(document.get("content_version"), int) or document["content_version"] < 1:
        raise CacheValidationError("Cache content_version must be a positive integer.")
    if not isinstance(document.get("generator"), dict):
        raise CacheValidationError("Cache generator metadata must be an object.")
    entries = document.get("entries")
    if not isinstance(entries, list):
        raise CacheValidationError("Cache entries must be an array.")

    seen_ids: set[str] = set()
    seen_keys: set[str] = set()
    for index, entry in enumerate(entries):
        if not isinstance(entry, dict):
            raise CacheValidationError(f"Entry {index} must be an object.")
        entry_id = entry.get("id")
        if not isinstance(entry_id, str) or not entry_id.strip() or entry_id in seen_ids:
            raise CacheValidationError(f"Entry {index} has a missing or duplicate id.")
        seen_ids.add(entry_id)
        key = entry.get("key")
        aliases = entry.get("aliases", [])
        outputs = entry.get("outputs")
        review = entry.get("review")
        if not isinstance(key, str) or not normalize_cache_key(key):
            raise CacheValidationError(f"Entry {entry_id!r} has an invalid key.")
        if not isinstance(aliases, list) or any(not isinstance(alias, str) for alias in aliases):
            raise CacheValidationError(f"Entry {entry_id!r} aliases must be strings.")
        if not isinstance(outputs, dict) or not outputs:
            raise CacheValidationError(f"Entry {entry_id!r} outputs must be a non-empty object.")
        if not isinstance(review, dict) or review.get("status") not in {"generated", "approved", "rejected"}:
            raise CacheValidationError(f"Entry {entry_id!r} has an invalid review status.")
        for raw_key in [key, *aliases]:
            normalized_key = normalize_cache_key(raw_key)
            if not normalized_key:
                continue
            if normalized_key in seen_keys:
                raise CacheValidationError(f"Entry {entry_id!r} repeats normalized key {normalized_key!r}.")
            seen_keys.add(normalized_key)
    return document


def atomic_write_json(path: Path, document: dict[str, Any]) -> None:
    validate_cache_document(document, namespace=str(document.get("namespace") or ""))
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + f".{os.getpid()}.tmp")
    try:
        temporary.write_text(json.dumps(document, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        os.replace(temporary, path)
    finally:
        if temporary.exists():
            temporary.unlink()


class VersionedJsonCache:
    """Hot-reloadable, reviewed JSON cache with stable aliases and copy-on-read."""

    def __init__(self, namespace: str, *, root: Path | None = None) -> None:
        if not _NAMESPACE_PATTERN.fullmatch(namespace):
            raise ValueError(f"Invalid cache namespace: {namespace!r}")
        self.namespace = namespace
        self.root = root or Path(os.environ.get("LANGCHAIN_PRECOMPUTED_CACHE_DIR", DEFAULT_CACHE_ROOT))
        self.path = self.root / f"{namespace}.json"
        self._lock = threading.RLock()
        self._mtime_ns: int | None = None
        self._document: dict[str, Any] | None = None
        self._approved_index: dict[str, dict[str, Any]] = {}

    def _reload_if_needed(self) -> None:
        try:
            mtime_ns = self.path.stat().st_mtime_ns
        except FileNotFoundError:
            mtime_ns = None
        if self._document is not None and mtime_ns == self._mtime_ns:
            return
        with self._lock:
            if self._document is not None and mtime_ns == self._mtime_ns:
                return
            if mtime_ns is None:
                self._document = {
                    "schema_version": 1,
                    "namespace": self.namespace,
                    "content_version": 1,
                    "generator": {},
                    "entries": [],
                }
                self._approved_index = {}
                self._mtime_ns = None
                return
            document = validate_cache_document(
                json.loads(self.path.read_text(encoding="utf-8")),
                namespace=self.namespace,
            )
            index: dict[str, dict[str, Any]] = {}
            for entry in document["entries"]:
                if entry["review"]["status"] != "approved":
                    continue
                for raw_key in [entry["key"], *entry.get("aliases", [])]:
                    key = normalize_cache_key(raw_key)
                    if key:
                        index[key] = entry
            self._document = document
            self._approved_index = index
            self._mtime_ns = mtime_ns

    def lookup(self, key: str) -> dict[str, Any] | None:
        self._reload_if_needed()
        entry = self._approved_index.get(normalize_cache_key(key))
        return copy.deepcopy(entry) if entry is not None else None

    def status(self) -> dict[str, Any]:
        self._reload_if_needed()
        entries = self._document.get("entries", []) if self._document else []
        counts = {status: 0 for status in ("generated", "approved", "rejected")}
        for entry in entries:
            status = entry.get("review", {}).get("status")
            if status in counts:
                counts[status] += 1
        return {
            "namespace": self.namespace,
            "path": str(self.path),
            "contentVersion": self._document.get("content_version") if self._document else None,
            "entries": len(entries),
            **counts,
        }
