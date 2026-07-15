#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
python_bin="${PYTHON_BIN:-python3}"
action="${1:-start}"

if ! command -v "$python_bin" >/dev/null 2>&1; then
  echo "Python 3 was not found: $python_bin" >&2
  exit 127
fi

case "$action" in
  start | --start)
    "$python_bin" -c 'import sqlite3; assert sqlite3.sqlite_version'
    exec "$python_bin" "$script_dir/lab_launcher.py" --start-services
    ;;
  status | --status)
    exec "$python_bin" "$script_dir/lab_launcher.py" --status
    ;;
  stop | --stop)
    exec "$python_bin" "$script_dir/lab_launcher.py" --stop
    ;;
  help | --help | -h)
    cat <<'EOF'
Usage: start-all-services.sh [start|status|stop]

  start   Start module HTTP, LLM proxy, LangChain, and LeNet/CNN (default).
  status  Report health for all four services.
  stop    Stop all skill-owned services.
EOF
    ;;
  *)
    echo "Unknown action: $action" >&2
    echo "Run with --help for usage." >&2
    exit 2
    ;;
esac
