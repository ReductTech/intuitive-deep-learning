# 更新技能

默认更新源是 `https://gitee.com/ssocean/intuitive-deep-learning.git`。本地目录是用户下载的安装包，可能被任意修改，也可能有或没有 `.git`。用户询问“有没有更新”“检查更新”，或要求更新课程、同步最新版时才执行本流程；确认需要更新后直接安装，不要再次询问。

官方仓库是技能代码和资源的唯一真相。不要合并本地源码修改；更新时把旧包保留为备份，只迁移程序生成的 `runtime_logs/` 和 `history/`。

## 下载并验证官方版本

将当前加载的 `SKILL.md` 所在目录记为 `skill_root`。临时目录必须创建在同一父目录，确保替换时可以直接重命名：

```bash
skill_root="$(cd "/absolute/path/to/intuitive-deep-learning" && pwd -P)"
parent_dir="$(dirname "$skill_root")"
package_name="$(basename "$skill_root")"
tmp_dir="$(mktemp -d "$parent_dir/.${package_name}-update.XXXXXX")"
git clone --depth 1 https://gitee.com/ssocean/intuitive-deep-learning.git "$tmp_dir/latest"
test -f "$tmp_dir/latest/SKILL.md"
test -f "$tmp_dir/latest/modules/index.json"
test -f "$tmp_dir/latest/scripts/run-lesson-page.sh"
remote_commit="$(git -C "$tmp_dir/latest" rev-parse HEAD)"
new_version="$(git -C "$tmp_dir/latest" rev-parse --short HEAD)"
```

克隆或任一校验失败时删除临时目录并停止，不要改动现有安装包。

## 判断是否需要更新

Git 仅用于判断版本，不用于合并或修复本地包：

1. 若 `skill_root` 本身是独立 Git 仓库，且 `origin` 是上述官方 Gitee 地址，读取本地 `HEAD`。只有本地提交等于 `remote_commit`，并且 `git status --porcelain --untracked-files=all` 为空时，才能报告已经是最新版。
2. 其他情况使用临时仓库的索引比较官方文件与本地目录。比较结果为空时，说明官方文件一致，可以报告已经是最新版；本地被忽略的运行文件不参与比较。
3. 提交不同、官方文件缺失、内容不同、存在本地源码修改或存在非忽略的额外文件时，都视为需要更新。不要尝试判断这些差异是用户定制、旧版本残留还是损坏文件。

可使用以下命令获取判断信息：

```bash
repo_root="$(git -C "$skill_root" rev-parse --show-toplevel 2>/dev/null || true)"
if [ -n "$repo_root" ]; then repo_root="$(cd "$repo_root" && pwd -P)"; fi
origin_url="$(git -C "$skill_root" remote get-url origin 2>/dev/null || true)"
local_commit="$(git -C "$skill_root" rev-parse HEAD 2>/dev/null || true)"
local_status="$(git -C "$skill_root" status --porcelain --untracked-files=all 2>/dev/null || true)"
package_status="$(git --git-dir="$tmp_dir/latest/.git" --work-tree="$skill_root" status --porcelain --untracked-files=all)"
```

`repo_root` 指向父目录时，那是桌面智能体的宿主仓库，不是技能包仓库；不要对它执行任何更新命令。若本地 Git 远端不是官方地址，不要从该远端拉取，直接按官方快照比较和替换。

## 替换安装包

仅在确认需要更新后执行。先尽力停止旧服务，再将允许保留的运行目录复制到新版。把旧包重命名为带时间戳的备份，然后把已验证的新包移动到原路径：

```bash
if [ -f "$skill_root/scripts/start-all-services.sh" ]; then
  bash "$skill_root/scripts/start-all-services.sh" --stop || true
fi
for path in runtime_logs history; do
  if [ -e "$skill_root/$path" ]; then cp -a "$skill_root/$path" "$tmp_dir/latest/"; fi
done
backup_dir="$parent_dir/${package_name}.backup.$(date +%Y%m%d%H%M%S).$$"
mv "$skill_root" "$backup_dir"
if mv "$tmp_dir/latest" "$skill_root" && git -C "$skill_root" rev-parse --is-inside-work-tree; then
  :
else
  if [ -e "$skill_root" ]; then mv "$skill_root" "$tmp_dir/failed"; fi
  mv "$backup_dir" "$skill_root"
  exit 1
fi
```

新版移动或验证失败时，立即恢复 `backup_dir`。成功后保留备份并向用户报告其路径，不要自动删除；用户的本地修改只存在于该备份中，不进入新版。删除已经为空的临时目录。

## 完成与失败

安装目录不可写、网络受限或需要额外权限时，按桌面智能体的审批机制申请访问 Gitee 和写入安装目录。不要把权限、下载或比较失败误报为已经是最新版。

替换成功后重新读取新版 `SKILL.md`、本文件和 `modules/index.json`，报告 `new_version` 和 `backup_dir`。用户还要求打开课程时，再按新版说明重新启动课程。
