#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" != "--yes" ]]; then
  echo "This update deletes all local code changes. Back them up, then run with --yes." >&2
  exit 2
fi

repo="https://gitee.com/ssocean/intuitive-deep-learning.git"
root="$(cd "${BASH_SOURCE[0]%/*}/.." && pwd -P)"
name="${root##*/}"
native="/tmp/${name}-update.$$"
staging="${root}.$$-temp"
backup="${root}.$$-backup"

restore() {
  local rc=$?
  trap - EXIT INT TERM
  if [[ ! -e "$root" && -e "$backup" ]]; then
    mv "$backup" "$root"
  fi
  rm -rf "$native" "$staging"
  exit "$rc"
}
trap restore EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# Git checkout stays on the native Linux filesystem, avoiding WSL chmod errors.
rm -rf "$native" "$staging"
git -c core.filemode=false clone --quiet --depth 1 "$repo" "$native"
git -C "$native" config core.filemode false
test -f "$native/SKILL.md"
test -f "$native/modules/index.json"
test -f "$native/scripts/run-lesson-page.sh"
test -f "$native/scripts/update-skill.sh"

bash "$native/scripts/start-all-services.sh" --stop >/dev/null
for path in runtime_logs history; do
  if [[ -e "$root/$path" ]]; then
    rm -rf "$native/$path"
    cp -a "$root/$path" "$native/$path"
  fi
done

# Copy without preserving Linux mode bits, then swap directories on one filesystem.
mkdir -p "$staging"
cp -r "$native/." "$staging/"
git -C "$staging" config core.filemode false

mv "$root" "$backup"
mv "$staging" "$root"
trap - EXIT INT TERM
rm -rf "$native" "$backup"

printf 'ok=true\nupdated=true\nversion=%s\nmode=tmp\n' \
  "$(git -C "$root" rev-parse --short HEAD)"
