# Demo 主机的独立 HTTPS 5173 入口

`https://39.105.207.234/` 保留原 Demo。`https://39.105.207.234:5173/` 由独立 Nginx server 提供新版术库的生产构建，转发到只监听 127.0.0.1:8010 的独立 Python 服务。

- Nginx 配置：`/etc/nginx/sites-available/shuku-idl-5173`，模板为本目录 nginx.conf；复用现有 IP 证书及其续期流程。
- 前端发布目录：`/var/www/shuku-idl/releases/`，current 指向当前版本；合入仓库 assets/ 的静态课程资源和构建产物，不提供源码目录与上传文件桶。
- 后端服务：shuku-idl.service，独立 Python 环境 `/opt/shuku-idl/venv`，使用本目录的资源限额。
- 运行配置：`/etc/shuku-idl/runtime.env`，仅 root 可读；包含数据库连接与 Demo 密码，不提交 Git。来源固定为 `https://39.105.207.234:5173`。
- 持久文件桶：`/home/ecs-assist-user/shuku-idl-data/bucket`，不放在 /tmp 或 Git 工作区。
- MySQL 8.0.16+：使用独立术库业务库和 `mysql+mysqlconnector://` 连接，表名前缀为 `shuku_`。迁移账号具有 DDL 权限，运行账号无建表、建库权限，`shuku_schema_migrations` 只读。此项为待部署配置说明；本次只修改和验证本地环境，不变更云端数据库。
- 登录 Cookie 使用 shuku_idl_session，Path=/api/shuku，HTTPS 下启用 Secure；避免同 IP 的旧 Demo shuku_session 干扰。

MySQL 基线不会自动导入历史旧库/IDL 演示库；已有历史数据必须先完成独立转换、备份和验收，不能直接替换数据库连接。本地开发端口仍按各自启动配置设置，本次仅切换服务器 HTTPS 入口，不改动本地开发库。

发布前在有依赖的环境运行 npm ci、npm run build，并运行相关后端与页面检查。打包 dist 到服务器，将静态 assets 与 dist 合入新的 release，验证后切换 current。后端升级先用迁移配置执行 python -m shuku_backend migrate，再启动或重启 shuku-idl；正常 serve 不自动迁移。

首次配置：安装 Python 3.10+、独立 backend[shuku] 依赖，安装服务文件，执行 systemctl daemon-reload、systemctl enable --now shuku-idl；安装独立站点后执行 nginx -t，通过后 reload Nginx。云安全组需放行 TCP 5173；后端端口不向公网开放。

检查：systemctl status shuku-idl；curl http://127.0.0.1:8010/api/shuku/health；HTTPS 登录与课程页面；确认 443 入口仍正常。服务开机自启，Nginx 不依赖前端开发服务器。

回退：停止 shuku-idl，移除本独立站点的启用链接，nginx -t 后 reload；或将 current 切回前一 release。保留数据库和文件桶。不要改动原 443 配置。

当前此主机未启动独立 Cloud／计算服务，相关计算 API 返回明确的 503；减论短信登录、真实 Web Agent、GitHub 配置沿用项目当前接入状态。

PPTX 上传上限为 100 MB，Nginx 接收 101 MB（含表单开销），上传和代理发送超时为 120 秒。服务将上传流暂存为临时文件，解析和写入对象存储时分块读取；同一进程同时只处理一个课件导入。解压总量最多 512 MB、100 页，临时文件在请求结束后关闭清理。

## 从旧 HTTPS 5175 入口切换

1. 安全组放行 TCP 5173；确认该端口空闲，保留旧入口直至验证完成。
2. 备份站点配置与 `/etc/shuku-idl/runtime.env`，使用本目录模板安装 `/etc/nginx/sites-available/shuku-idl-5173` 并启用对应链接。
3. 将运行配置的 `SHUKU_PUBLIC_ORIGIN` 改为 `https://39.105.207.234:5173`，重启 `shuku-idl.service`。不要修改数据库连接、文件桶、前端 current 或 GitHub App 凭证。
4. 删除旧站点的启用链接，执行 `nginx -t` 后 reload。验证公网首页、课程 API、登录、消息与收藏读取，以及旧 Origin 被拒绝。确认 5175 不再监听，443 原 Demo 仍可访问。
5. 浏览器改用新地址。localStorage 按端口隔离，旧端口的本地草稿与偏好不会自动迁移；已保存到服务器的课程、收藏和学习记录仍使用同一数据库。

若验证失败，恢复备份的运行配置与旧站点链接，再重启后端并 reload Nginx；不改动数据库或文件桶。
