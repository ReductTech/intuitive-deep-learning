"""Compatibility entry point for the reference-composition browser regression."""
from pathlib import Path
from runpy import run_path
run_path(str(Path(__file__).with_name('verify-reference-layout.py')), run_name='__main__')
