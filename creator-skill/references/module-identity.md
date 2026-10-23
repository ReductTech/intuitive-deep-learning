# 模块身份

每个活跃模块在 `outlines.json` 中有顶层 `moduleIdentity`，与页面 `id` 分开：

```json
{"moduleIdentity": {"version": 1, "id": "2e5c4732-a40a-4d20-b954-a61507aabc75"}}
```

ID 使用标准小写 UUID v4，由本地工具生成一次并持续使用。上例只展示格式，不复制为新课程的 ID。

## 生成与检查

从仓库根目录直接运行，无需安装后端包：

```powershell
# 检查已有 ID，为缺失模块生成 UUID。
python creator-skill/scripts/tools.py module.identity

# 只检查格式、重复和缺失，不写文件。
python creator-skill/scripts/tools.py module.identity --check
```

脚本扫描全部 `modules/*/outlines.json`，先检查所有已有身份，再写入。格式错误或重复时停止，不自动替换已有 UUID；`--check` 对缺失、格式错误或重复返回非零。后端课程加载也拒绝这些情况。已有 UUID 保持不变。

脚本自动定位仓库并使用后端契约源码；需要 Python 3.10 及以上，仅使用 Python 标准库与仓库源码。该命令会补齐所有缺失身份，不只是当前模块，运行前了解其写入范围。

## 稳定性

修改标题、正文、页序或目录名不改变 UUID。路由 `path` 仍须匹配模块目录，这是独立的路由约束。

复制成独立新课程时，删除复制来的 `moduleIdentity` 再生成新 UUID；相应静态资源放 `assets/<新 UUID>/`，同步运行时引用和 SceneDeck `assetId`，不要沿用源课程身份。
