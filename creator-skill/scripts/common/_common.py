"""Small shared path and metadata helpers for authoring commands."""

from pathlib import Path
import json
import os
import sys

SCRIPTS = Path(__file__).resolve().parents[1]
ROOT = Path(os.environ.get("IDL_REPOSITORY_ROOT", str(SCRIPTS.parents[1]))).resolve()
sys.path[:0] = [str(ROOT / "backend/src"), str(SCRIPTS)]


def read_modules(root=ROOT):
    for path in sorted((root / "modules").glob("*/outlines.json")):
        document = json.loads(path.read_text(encoding="utf-8-sig"))
        if not isinstance(document, dict):
            raise ValueError(f"Invalid outline: {path}")
        yield path.parent, document


def resolve_module(requested, root=ROOT):
    matches = [
        (directory, doc)
        for directory, doc in read_modules(root)
        if requested.lower()
        in {
            directory.name.lower(),
            str(doc.get("id", directory.name)).lower(),
            str(doc.get("moduleIdentity", {}).get("id", "")).lower(),
        }
    ]
    if len(matches) != 1:
        raise ValueError(
            f"Expected one module matching {requested!r}; found {len(matches)}"
        )
    return matches[0]


def emit_result(result: dict, *, status: str = "ok") -> None:
    """Write one JSON result, retaining tool-specific fields and status values."""
    payload = {"status": status, **result}
    print(json.dumps(payload, ensure_ascii=False))


def scratchpad_path(
    directory: Path, requested: Path | None = None, *, default: str
) -> Path:
    """Resolve an intermediate output inside its module; reject escapes and symlinks out.

    Explicit paths are relative to cwd, matching other tool path arguments.
    This helper validates only; callers create directories after input validation.
    """
    module = directory.resolve()
    scratchpad = (module / "_scratchpad").resolve()
    target = (requested if requested is not None else scratchpad / default).resolve()
    if not scratchpad.is_relative_to(module) or not target.is_relative_to(scratchpad):
        raise ValueError(
            f"Intermediate output must be inside {module / '_scratchpad'}: {target}"
        )
    return target


def report_error(error: Exception) -> int:
    """Report an execution error on stderr and return the shared exit code 2."""
    message = str(error)
    print(message, file=sys.stderr)
    emit_result({"error": message}, status="error")
    return 2
