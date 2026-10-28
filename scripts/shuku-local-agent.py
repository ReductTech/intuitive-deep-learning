#!/usr/bin/env python3
"""Run the same standard-library client returned by the local authoring API."""
from pathlib import Path
import runpy

if __name__ == '__main__':
    runpy.run_path(str(Path(__file__).resolve().parents[1]/'backend/src/shuku_backend/local_agent_client.py'), run_name='__main__')
