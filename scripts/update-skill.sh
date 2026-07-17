#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" != "--yes" ]]; then
  echo "This update deletes all local code changes. Back them up, then run with --yes." >&2
  exit 2
fi

repo="https://gitee.com/ssocean/intuitive-deep-learning.git"
root="$(cd "${BASH_SOURCE[0]%/*}/.." && pwd -P)"
temp="${root}.$$-temp"
backup="${root}.$$-backup"

# Fast path: force a standalone checkout to exactly match Gitee.
git_prefix="$(git -C "$root" rev-parse --show-prefix 2>/dev/null || true)"
git_worktree="$(git -C "$root" rev-parse --is-inside-work-tree 2>/dev/null || true)"
if [[ -z "$git_prefix" && "$git_worktree" == true ]]; then
  if git -C "$root" fetch "$repo" HEAD \
    && git -C "$root" reset --hard FETCH_HEAD \
    && bash "$root/scripts/start-all-services.sh" --stop >/dev/null \
    && git -C "$root" clean -fdx -e history/ -e runtime_logs/; then
    printf 'ok=true\nupdated=true\nversion=%s\nmode=reset\n' \
      "$(git -C "$root" rev-parse --short HEAD)"
    exit 0
  fi
fi

# Fallback: build a clean replacement while the old package remains intact.
git clone --quiet --depth 1 "$repo" "$temp"
test -f "$temp/SKILL.md"
test -f "$temp/modules/index.json"
test -f "$temp/scripts/run-lesson-page.sh"
test -f "$temp/scripts/update-skill.sh"
bash "$temp/scripts/start-all-services.sh" --stop >/dev/null

for path in runtime_logs history; do
  if [[ -e "$root/$path" ]]; then
    rm -rf "$temp/$path"
    cp -a "$root/$path" "$temp/$path"
  fi
done

restore() {
  local rc=$?
  trap - EXIT INT TERM
  if [[ ! -e "$root" && -e "$backup" ]]; then
    mv "$backup" "$root"
  fi
  rm -rf "$temp"
  exit "$rc"
}
trap restore EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

mv "$root" "$backup"
mv "$temp" "$root"
trap - EXIT INT TERM
rm -rf "$backup" || true

printf 'ok=true\nupdated=true\nversion=%s\nmode=replace\n' \
  "$(git -C "$root" rev-parse --short HEAD)"
