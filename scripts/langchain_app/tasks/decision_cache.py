from __future__ import annotations

from typing import Any

from ..precomputed_cache import VersionedJsonCache, normalize_cache_key


DECISION_CANDIDATE_CACHE = VersionedJsonCache("decision-candidates")


def cached_decision_intake(raw_decision: str) -> dict[str, Any] | None:
    entry = DECISION_CANDIDATE_CACHE.lookup(raw_decision)
    if entry is None:
        return None
    intake = entry.get("outputs", {}).get("intake")
    return intake if isinstance(intake, dict) else None


def cached_extra_decision_factors(payload: dict[str, Any]) -> dict[str, Any] | None:
    decision = payload.get("decision")
    if not isinstance(decision, str):
        return None
    entry = DECISION_CANDIDATE_CACHE.lookup(decision)
    if entry is None:
        return None
    outputs = entry.get("outputs", {})
    intake = outputs.get("intake")
    extras = outputs.get("extra_factors")
    requested_primary = normalize_cache_key(str(payload.get("primary_factor_name") or ""))
    cached_primary = normalize_cache_key(str((intake or {}).get("primary_factor", {}).get("name") or ""))
    if requested_primary and requested_primary != cached_primary:
        return None
    return extras if isinstance(extras, dict) else None


def decision_cache_status() -> dict[str, Any]:
    return DECISION_CANDIDATE_CACHE.status()
