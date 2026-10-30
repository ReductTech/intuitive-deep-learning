# 无 GitHub 账号的课程创作与共创

用户无需绑定个人 GitHub。课程管理员和作者权限仍由术库账号决定。

## 数据流

- 创建课程：术库保存私有草稿，并通过组织 GitHub App 创建 `reduct-shuku/course-<课程 UUID>` 私有仓库。
- 发起共创：从用户所选的已发布版本创建本人工作区，保留基础版本关系；本地构建后同步到 `reduct-shuku/co-creation-workspaces` 的 `<用户 UUID>/<工作区 UUID>` 分支。
- 保存修改：先保存修订并生成本人预览，再异步同步私有分支。比较 Git Blob SHA，仅上传变化文件；删除的文件从课程树移除。
- 提交建议：私有同步完成后，沿用官方仓库审核分支、PR、审核、合并和版本发布流程，不直接改动官方主分支。
- 删除工作区：验证仓库 ID、私有标记、分支归属与提交记录后，仅删除本人分支。共享仓库和其他用户分支保留；失败可重试。

## 配置与恢复

设置 `SHUKU_GITHUB_CONFIG` 指向服务器私有 JSON，包含 `appId`、`privateKeyPath`、`webhookSecret`、`owner`（`reduct-shuku`）和 `installationId`。使用组织安装凭证，不使用用户 Token。App 应安装到目标组织并具有创建仓库、读写内容、PR 和发布所需权限。机器配置和私钥不提交到仓库。

共享仓库必须为 private，description 必须为 `[shuku-co-creation-workspaces:v1]`；不满足时停止同步，避免误写其他仓库。首次不存在时由 App 创建。

无需新增数据库表。`shuku_tasks` 的 `github.workspace` 任务保存修订、分支、仓库 ID、上传检查点及结果；Worker 以工作区串行执行。超时重试先核对远程提交，避免覆盖和重复上传。页面“同步与审核详情”显示进度并提供重试。未配置 App 的本地环境继续支持私有预览，但不产生 GitHub 分支。

## 验证

- `backend/tests/shuku_backend/test_hosted_workspaces.py`：无绑定账号、新建课程 App 任务、私有仓库限制、超时恢复、差异同步、越权和分支清理保护。
- `scripts/check-shuku-hosted-workspaces.mjs`：无绑定学习者入口、私有状态、重试范围和窄屏布局；所有接口模拟，不操作真实账号。
- 相关后端回归：GitHub、共创、治理和课程创作。
