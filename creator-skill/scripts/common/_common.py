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
    directory: Path, requested: Path | None = None, *, default: str,
    page_directory: str | None = None,
) -> Path:
    """Resolve an intermediate output inside its module; reject escapes and symlinks out.

    Explicit paths are relative to cwd, matching other tool path arguments.
    This helper validates only; callers create directories after input validation.
    """
    module = directory.resolve()
    if page_directory is not None:
        if not page_directory or Path(page_directory).name != page_directory or page_directory in {".", ".."} or "/" in page_directory or "\\" in page_directory:
            raise ValueError("Page directory must be a single semantic directory name")
        scratchpad = (module / "pages" / page_directory / "_scratchpad").resolve()
    else:
        scratchpad = (module / "_scratchpad").resolve()
    target = (requested if requested is not None else scratchpad / default).resolve()
    # Explicit page-local outputs are also valid for tools with module-wide defaults.
    if requested is not None and page_directory is None and target.is_relative_to(module):
        parts = target.relative_to(module).parts
        if len(parts) >= 3 and parts[0] == "pages" and parts[2] == "_scratchpad":
            scratchpad = (module / "pages" / parts[1] / "_scratchpad").resolve()
    if not scratchpad.is_relative_to(module) or not target.is_relative_to(scratchpad):
        raise ValueError(
            f"Intermediate output must be inside the module or selected page _scratchpad: {target}"
        )
    return target


def report_error(error: Exception) -> int:
    """Report an execution error on stderr and return the shared exit code 2."""
    message = str(error)
    print(message, file=sys.stderr)
    emit_result({"error": message}, status="error")
    return 2
