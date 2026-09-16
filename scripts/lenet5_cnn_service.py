"""Backward-compatible entry point for the split CNN teaching service.

Use ``http_service.py`` for the transport layer. This module re-exports the
historical symbols so existing imports and legacy module instructions remain
valid during migration.
"""

from dataset_service import *
from gpu_service import *
from http_service import Handler, main


if __name__ == "__main__":
    raise SystemExit(main())
