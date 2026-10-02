"""Cache identity for compute code; persistent results still use Cloud CacheDao."""
from functools import lru_cache
import hashlib
from pathlib import Path

@lru_cache(maxsize=1)
def computation_revision():
    root = Path(__file__).resolve().parents[1]
    digest = hashlib.sha256()
    for folder in ("vision", "datasets", "contracts"):
        for path in sorted((root / folder).rglob("*.py")):
            digest.update(path.relative_to(root).as_posix().encode())
            digest.update(path.read_bytes())
    return digest.hexdigest()
