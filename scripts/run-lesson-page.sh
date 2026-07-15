#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
python_bin="${PYTHON_BIN:-python3}"

if ! command -v "$python_bin" >/dev/null 2>&1; then
  echo "Python 3 was not found. Install it, then run: python3 -m pip install -r requirements.txt" >&2
  exit 127
fi

exec "$python_bin" "$script_dir/lab_launcher.py" "$@"
