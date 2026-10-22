"""Registered outline identities, not arbitrary import paths or image names."""
from __future__ import annotations

from dataclasses import dataclass
import json
import os
from pathlib import Path

from idl_backend.config import repository_root

from idl_backend.contracts.identity import IdentityError, register_identity


@dataclass(frozen=True)
class Course:
    uuid: str
    slug: str
    module_path: str

    @property
    def legacy_cache_scope(self) -> str:
        return "official/" + self.slug


def load_courses(modules: Path | None = None) -> dict[str, Course]:
    seen: dict[str, Path] = {}
    result = {}
    modules = modules or Path(os.environ.get("IDL_MODULES_DIR", str(repository_root() / "modules")))
    for path in sorted(modules.glob("*/outlines.json")):
        document = json.loads(path.read_text(encoding="utf-8-sig"))
        if not isinstance(document, dict) or "moduleIdentity" not in document:
            raise IdentityError(f"Missing moduleIdentity: {path}")
        course_uuid = register_identity(document["moduleIdentity"], path, seen)
        module_path = document["path"]
        if module_path != "/modules/" + path.parent.name.lower():
            raise ValueError(f"Course path does not match its directory: {path}")
        result[course_uuid] = Course(course_uuid, document.get("id") or path.parent.name.lower(), module_path)
    return result
