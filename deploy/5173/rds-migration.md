# 术库外部 MySQL 运行与搬迁

## 运行配置

业务库通过 SQLAlchemy Core 管理。服务器的 `/etc/shuku-idl/runtime.env` 使用 `MYSQL_URL_TEST` 连接外部 MySQL；部署迁移配置 `/etc/shuku-idl/migration.env` 指向同一目标。不要同时保留指向旧库的 `SHUKU_DATABASE_URL`。实际凭证只放在私有配置中，示例使用占位地址，不能提交密码。

`backend[shuku]` 已包含 SQLAlchemy、mysql-connector-python 与 cryptography。正常服务只检查结构，不自动建表；显式执行 `python -m shuku_backend migrate` 管理版本标记、约束与索引。

共享数据库只使用当前 metadata 的 `shuku_` 表。现有其他应用表不导出、不导入、不删除。连接外部库不会接通减论登录接口；现有术库账号 UUID、权限与账号关联保持原样。

## 搬迁与验收

1. 确认 MySQL 8.0.16+、网络及迁移权限，记录原有其他应用表的结构摘要。
2. 在独立 `idl_shuku_test_*` 库完成回归。禁止把 `SHUKU_TEST_DATABASE_URL` 设置为业务库。
3. 开启 API 维护响应，停止 HTTP 与 Worker；备份运行配置、已安装模块及完整业务快照。
4. 在独立测试库恢复完整快照，逐表验证行数、SHA-256、循环外键与生成列。
5. 显式准备目标术库结构，使用 `python -m shuku_backend.database_transfer import --file /private/backup.json` 导入；目标已有不同业务数据时工具拒绝覆盖。
6. 用 `database_transfer verify --file /private/backup.json` 核对数据，确认其他应用表结构未变，再切换配置与服务。
7. 验证登录产生的会话确实写入 RDS，以及课程、审核、共创、消息、个人信息和学习记录读取；对比课程预览文件摘要，最后恢复公网 API。

快照文件为 0600 权限，目录仅管理员可访问。保留本地旧库用于回退，不自动删除，也不再作为服务的业务连接。课程源码与预览文件仍保存在原文件桶，数据库只保存业务关系与文件引用；加密密钥及 GitHub 配置保持原位置。

## 回退

维护期间验证失败时，停止新服务，恢复备份的 runtime/migration 环境配置及 Python 模块，启动原服务，再恢复 Nginx API 配置。已导入 RDS 的数据保留供检查，不自动覆盖或删除。恢复用户写入后若再回退，需要先处理两边数据差异，不能直接切回旧库。


## 本次部署验收

- 服务已切换到外部 `jianlun_paper`，运行和迁移配置均使用 `MYSQL_URL_TEST`，不再加载旧业务连接。
- 停写快照含 31 张术库表、1,927 条记录；已完成完整恢复演练和逐表行数/SHA-256 对账。
- 原有 87 张其他应用表及 4 个视图的结构摘要保持一致。共享库结构保护应同时包含表和视图，不能遗漏视图的列。
- 156 项后端测试完成，包括单独配置受限账号后的清理专项；实际登录会话写入 RDS，公网课程与个人业务接口正常。
- 旧本地库保持迁移时状态，未删除；备份目录入口为 `/var/backups/shuku-idl/rds-last-cutover`，其中保存环境配置、完整快照与验收结果。不要将这些私有文件提交 Git。
- 当前服务器到 RDS 为公网连接，数据库服务端 `have_ssl=DISABLED`，此段连接未启用 TLS。需要数据库管理员开启 TLS 后，再验证连接加密与证书校验；网站本身仍使用 HTTPS。
