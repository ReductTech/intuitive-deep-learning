# 模块身份

每个活跃模块在 `outlines.json` 中有顶层 `moduleIdentity`，与页面 `id` 分开：

```json
{"moduleIdentity": {"version": 1, "id": "2e5c4732-a40a-4d20-b954-a61507aabc75"}}
```

ID 使用标准小写 UUID v4，共创者可本地生成，不需要签发、密钥或验签。上例只展示格式，不复制为新课程的 ID。

## 生成与检查

已安装后端包时，从仓库根目录运行：

```powershell
# 检查已有 ID，为缺失模块生成 UUID，并移除旧 signature 字段。
python -m idl_backend.contracts.identity

# 只检查格式、重复和缺失，不写文件。
python -m idl_backend.contracts.identity --check
```

脚本扫描全部 `modules/*/outlines.json`，先检查所有已有身份，再写入。格式错误或重复时停止，不自动替换已有 UUID；`--check` 对缺失、格式错误或重复返回非零。后端课程加载也拒绝这些情况。旧 `signature` 读取时忽略，生成命令会移除，已有 UUID 保持不变。

命令需要可导入的 `idl_backend`；环境尚未安装时按 `backend/README.md` 配置，不把依赖缺失误报为身份无效。该命令会补齐所有缺失身份，不只是当前模块，运行前了解其写入范围。

## 稳定性

修改标题、正文、页序或目录名不改变 UUID。路由 `path` 仍须匹配模块目录，这是路由约束，与 UUID 无签名绑定。

复制成独立新课程时，删除复制来的 `moduleIdentity` 再生成新 UUID；相应静态资源放 `assets/<新 UUID>/`，同步运行时引用和 SceneDeck `assetId`，不要沿用源课程身份。
