"""Runtime validation of stable module UUIDs; authoring lives in creator-skill/scripts."""
from __future__ import annotations

import uuid
from pathlib import Path
from typing import Any

IDENTITY_FIELD = "moduleIdentity"
IDENTITY_VERSION = 1


class IdentityError(ValueError):
    """Raised for missing, malformed, or duplicate module identities."""


def validate_identity(identity: Any, outline_path: Path) -> str:
    if (
        not isinstance(identity, dict)
        or not {"version", "id"} <= identity.keys()
        or identity.keys() - {"version", "id", "signature"}
    ):
        raise IdentityError(f"{outline_path}: Invalid moduleIdentity structure.")
    if type(identity["version"]) is not int or identity["version"] != IDENTITY_VERSION:
        raise IdentityError(f"{outline_path}: Invalid identity version.")
    module_id = identity["id"]
    try:
        parsed = uuid.UUID(module_id) if isinstance(module_id, str) else None
    except ValueError as exc:
        raise IdentityError(f"{outline_path}: Invalid module UUID.") from exc
    if parsed is None or str(parsed) != module_id or parsed.version != 4:
        raise IdentityError(f"{outline_path}: Invalid module UUID; expected a canonical lowercase UUID v4.")
    # Legacy signatures are ignored and removed by the generation command.
    return module_id


def register_identity(identity: Any, outline_path: Path, seen: dict[str, Path]) -> str:
    module_id = validate_identity(identity, outline_path)
    if module_id in seen:
        raise IdentityError(f"Duplicate course UUID {module_id}: {seen[module_id]} and {outline_path}")
    seen[module_id] = outline_path
    return module_id


def main() -> None:
    """Compatibility command; keep one implementation of the authoring tool."""
    import runpy
    from idl_backend.config import repository_root
    script = repository_root() / "creator-skill/scripts/module/module_identity.py"
    if not script.is_file():
        raise SystemExit("Authoring tool unavailable; run creator-skill/scripts/module/module_identity.py from a course checkout.")
    runpy.run_path(str(script), run_name="__main__")


if __name__ == "__main__":
    main()
