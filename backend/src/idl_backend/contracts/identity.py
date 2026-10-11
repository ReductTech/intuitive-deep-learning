"""Assign and verify stable, signed identities for active module outlines."""

from __future__ import annotations

import argparse
import base64
import json
import os
import re
import sys
import tempfile
import uuid
from pathlib import Path
from typing import Any

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey


from idl_backend.config import repository_root
ROOT = repository_root()
MODULES_DIR = ROOT / "modules"
PRIVATE_KEY_PATH = ROOT / ".private" / "module-identity-ed25519.pem"

# Public verification key. Do not change this value: changing it breaks verification
# of every issued module identity. The corresponding private signing key is stored
# outside source control in .private/module-identity-ed25519.pem.
PUBLIC_KEY_B64 = "RnQrJrMVuaFZu6SDHXXrzaGVnQtJc6qK6/XkOHMWPh4="

for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8")

IDENTITY_FIELD = "moduleIdentity"
IDENTITY_VERSION = 1
MODULE_PATH_PATTERN = re.compile(r"^/modules/[a-zA-Z0-9._-]+$")


class IdentityError(Exception):
    """Raised when an outline identity cannot be safely issued or verified."""


def _public_key() -> Ed25519PublicKey:
    try:
        raw = base64.b64decode(PUBLIC_KEY_B64, validate=True)
        return Ed25519PublicKey.from_public_bytes(raw)
    except (ValueError, TypeError) as exc:
        raise IdentityError("内置公钥格式无效，拒绝继续。") from exc


def _module_path(outline_path: Path, document: dict[str, Any]) -> str:
    declared_path = document.get("path")
    expected_path = f"/modules/{outline_path.parent.name.lower()}"
    if declared_path != expected_path or not MODULE_PATH_PATTERN.fullmatch(declared_path):
        raise IdentityError(
            f"{outline_path.relative_to(ROOT)} 的 path 必须是 {expected_path!r}，"
            f"当前为 {declared_path!r}。"
        )
    return declared_path


def _signed_payload(module_path: str, module_id: str, version: int) -> bytes:
    payload = {"version": version, "modulePath": module_path, "id": module_id}
    return json.dumps(payload, ensure_ascii=True, sort_keys=True, separators=(",", ":")).encode("ascii")


def _validate_identity(
    identity: Any,
    module_path: str,
    outline_path: Path,
    public_key: Ed25519PublicKey,
) -> None:
    if not isinstance(identity, dict) or set(identity) != {"version", "id", "signature"}:
        raise IdentityError(f"{outline_path.relative_to(ROOT)} 的 {IDENTITY_FIELD} 结构无效。")

    version = identity["version"]
    module_id = identity["id"]
    signature_text = identity["signature"]
    if version != IDENTITY_VERSION:
        raise IdentityError(f"{outline_path.relative_to(ROOT)} 的身份版本不受支持：{version!r}。")
    if not isinstance(module_id, str):
        raise IdentityError(f"{outline_path.relative_to(ROOT)} 的模块 ID 必须是 UUID 字符串。")
    try:
        parsed_id = uuid.UUID(module_id)
    except (ValueError, AttributeError, TypeError) as exc:
        raise IdentityError(f"{outline_path.relative_to(ROOT)} 的模块 ID 不是有效 UUID。") from exc
    if str(parsed_id) != module_id or parsed_id.version != 4:
        raise IdentityError(f"{outline_path.relative_to(ROOT)} 的模块 ID 必须是标准小写 UUID v4。")
    if not isinstance(signature_text, str):
        raise IdentityError(f"{outline_path.relative_to(ROOT)} 的签名必须是 Base64 字符串。")
    try:
        signature = base64.b64decode(signature_text, validate=True)
        public_key.verify(signature, _signed_payload(module_path, module_id, version))
    except (ValueError, InvalidSignature) as exc:
        raise IdentityError(f"{outline_path.relative_to(ROOT)} 的模块身份签名无效，文件可能被篡改。") from exc


def _load_private_key() -> Ed25519PrivateKey:
    try:
        key = serialization.load_pem_private_key(PRIVATE_KEY_PATH.read_bytes(), password=None)
    except FileNotFoundError as exc:
        raise IdentityError(
            f"找不到签发私钥：{PRIVATE_KEY_PATH.relative_to(ROOT)}。"
            "当前环境只能验证，不能签发新模块身份。"
        ) from exc
    except (ValueError, TypeError) as exc:
        raise IdentityError("签发私钥无法读取，拒绝继续。") from exc
    if not isinstance(key, Ed25519PrivateKey):
        raise IdentityError("签发私钥类型错误，必须是 Ed25519。")

    expected = _public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    actual = key.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    if actual != expected:
        raise IdentityError("签发私钥与脚本内公钥不匹配，拒绝签发。")
    return key


def _atomic_write(path: Path, content: str) -> None:
    temporary_path: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            newline="\n",
            dir=path.parent,
            prefix=f".{path.name}.",
            suffix=".tmp",
            delete=False,
        ) as temporary:
            temporary.write(content)
            temporary.flush()
            os.fsync(temporary.fileno())
            temporary_path = Path(temporary.name)
        os.replace(temporary_path, path)
    finally:
        if temporary_path is not None and temporary_path.exists():
            temporary_path.unlink()


def _read_outline(path: Path, public_key: Ed25519PublicKey) -> tuple[dict[str, Any], str, bool]:
    try:
        original = path.read_text(encoding="utf-8")
        document = json.loads(original)
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise IdentityError(f"无法读取有效 JSON：{path.relative_to(ROOT)}：{exc}") from exc
    if not isinstance(document, dict):
        raise IdentityError(f"{path.relative_to(ROOT)} 顶层必须是 JSON 对象。")

    module_path = _module_path(path, document)
    if IDENTITY_FIELD not in document:
        return document, original, False
    _validate_identity(document[IDENTITY_FIELD], module_path, path, public_key)
    return document, original, True


def process_outlines(check_only: bool = False) -> int:
    paths = sorted(MODULES_DIR.glob("*/outlines.json"))
    if not paths:
        raise IdentityError(f"没有找到模块大纲：{MODULES_DIR}")

    public_key = _public_key()
    loaded: list[tuple[Path, dict[str, Any], str, bool]] = []
    for path in paths:
        document, original, has_identity = _read_outline(path, public_key)
        loaded.append((path, document, original, has_identity))

    missing = [entry for entry in loaded if not entry[3]]
    if check_only:
        for path, _, _, has_identity in loaded:
            state = "有效" if has_identity else "缺失"
            print(f"{state}: {path.relative_to(ROOT)}")
        return 1 if missing else 0

    if missing:
        private_key = _load_private_key()
        for path, document, original, has_identity in missing:
            if has_identity:
                continue
            module_path = _module_path(path, document)
            module_id = str(uuid.uuid4())
            signature = private_key.sign(_signed_payload(module_path, module_id, IDENTITY_VERSION))
            document[IDENTITY_FIELD] = {
                "version": IDENTITY_VERSION,
                "id": module_id,
                "signature": base64.b64encode(signature).decode("ascii"),
            }
            newline = "\r\n" if "\r\n" in original else "\n"
            serialized = json.dumps(document, ensure_ascii=False, indent=2) + newline
            _atomic_write(path, serialized)
            print(f"已签发: {path.relative_to(ROOT)} -> {module_id}")

    for path, document, _, _ in loaded:
        identity = document.get(IDENTITY_FIELD)
        if identity is not None:
            _validate_identity(identity, _module_path(path, document), path, public_key)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="为 modules/*/outlines.json 补齐并验证不可伪造的模块身份。")
    parser.add_argument("--check", action="store_true", help="只验证身份，不写入缺失身份。")
    args = parser.parse_args()
    try:
        return process_outlines(check_only=args.check)
    except IdentityError as exc:
        print(f"错误：{exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
