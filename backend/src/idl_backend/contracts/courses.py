"""Registered outline identities, not arbitrary import paths or image names."""
from __future__ import annotations

import base64
from dataclasses import dataclass
import json
import os
from pathlib import Path
import uuid

from idl_backend.config import repository_root

PUBLIC_KEY = "RnQrJrMVuaFZu6SDHXXrzaGVnQtJc6qK6/XkOHMWPh4="


@dataclass(frozen=True)
class Course:
    uuid: str
    slug: str
    module_path: str

    @property
    def legacy_cache_scope(self) -> str:
        return "official/" + self.slug


def load_courses(modules: Path | None = None) -> dict[str, Course]:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    key = Ed25519PublicKey.from_public_bytes(base64.b64decode(PUBLIC_KEY))
    result = {}
    modules = modules or Path(os.environ.get("IDL_MODULES_DIR", str(repository_root() / "modules")))
    for path in sorted(modules.glob("*/outlines.json")):
        document = json.loads(path.read_text(encoding="utf-8-sig"))
        identity = document.get("moduleIdentity")
        if not identity:
            continue
        course_uuid = identity["id"]
        parsed = uuid.UUID(course_uuid)
        if str(parsed) != course_uuid or parsed.version != 4 or identity.get("version") != 1:
            raise ValueError(f"Invalid course identity: {path}")
        module_path = document["path"]
        if module_path != "/modules/" + path.parent.name.lower():
            raise ValueError(f"Course path does not match its directory: {path}")
        payload = json.dumps({"version": 1, "modulePath": module_path, "id": course_uuid}, ensure_ascii=True, sort_keys=True, separators=(",", ":")).encode("ascii")
        key.verify(base64.b64decode(identity["signature"], validate=True), payload)
        if course_uuid in result:
            raise ValueError(f"Duplicate course UUID: {course_uuid}")
        result[course_uuid] = Course(course_uuid, document.get("id") or path.parent.name.lower(), module_path)
    return result
