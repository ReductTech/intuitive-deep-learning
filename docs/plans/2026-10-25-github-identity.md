# GitHub 账号绑定

在个人信息中提供「绑定 GitHub」「重新授权」「解除绑定」。复用 Demo 的 GitHub App Device Flow，不手工填写 GitHub 用户名或 Token。用户在 GitHub 确认，页面自动更新。

流程：本人登录 → 获取授权码 → 打开 GitHub 输入授权码 → 服务端换取 Token → GET /user 验证数字 ID → 保存绑定。GitHub 账号在本应用中只能对应一个术库账号。换绑先解绑；GitHub 用户名变化不改变账号身份。

服务端新增 github_identity.py 与 adapters/github_identity.py。API 位于 /api/shuku/github/identity；GET 查询本人状态，POST /start、/poll、/cancel、/disconnect 操作本人授权。写操作要求同源、有效会话和 X-Shuku-Account，流程 ID 绑定用户，不允许前端指定身份。

010_github_identity.sql 新建绑定表和授权流程表；数字 ID、账号名、有效期可查询，Token、刷新凭证和 Device Code 使用 Fernet 加密并绑定用户及 Client ID。加密密钥由服务器文件提供，不存数据库、不提交仓库；备份数据库时需要单独备份密钥。进程重启后能恢复绑定及未完成流程。GitHub pending/slow_down 按间隔轮询，Token 交换后先保存检查点再查询身份，避免网络失败丢失已交换的 Token。

授权后学习者获得创作者权限；管理员权限不受影响。解绑只收回此次绑定授予的创作者身份，不删除课程、工作区和学习数据。GitHub App 的组织安装授权与个人绑定独立；解绑不会撤销组织仓库访问。当前共创仍使用术库私有工作区，个人 Fork 流程不在本次范围。

解绑先调用 GitHub 删除本次 Token，成功后清除绑定；网络失败保留记录供重试。与旧 Demo 共用 App 时，不删除整个 OAuth Grant，以免撤销另一环境的 Token。可过期 Token 在个人操作前 refresh 并核对远端数字 ID；状态查询不反复请求 GitHub。

## 部署

- SHUKU_GITHUB_IDENTITY_CONFIG：服务端 JSON 配置文件，包含 clientId、clientSecretPath。没有单独配置时可复用 SHUKU_GITHUB_CONFIG 中的对应字段。
- SHUKU_GITHUB_TOKEN_KEY：绝对路径，文件保存 Fernet.generate_key() 生成的密钥。必须稳定保存并仅允许运行账号读取。
- App 必须开启 Enable Device Flow；clientSecretPath 指向该 App 的 Client Secret 文件。此配置与课程同步 App 配置可独立启用。
- 显式运行数据库迁移，再重启后端并发布前端。受限运行角色须有两张新增表的 SELECT/INSERT/UPDATE/DELETE 权限。
- 未配置时页面显示未配置，接口返回 503，不伪造绑定。

验证：pytest test_github_identity.py、test_http.py、test_profile.py、test_identity.py；npm run build；check-shuku-github-identity.mjs 验证页面交互（模拟 GitHub 响应）。真实账号授权需要账号本人在 GitHub 完成确认，不能由自动化测试代替。

参考：[GitHub Device Flow](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-with-a-github-app)、[撤销单个 Token](https://docs.github.com/en/rest/apps/oauth-applications#delete-an-app-token)。
