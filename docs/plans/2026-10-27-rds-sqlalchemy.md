# RDS SQLAlchemy Migration Implementation Plan

**Goal:** 使用指定外部 MySQL 保存术库业务数据，通过现有 SQLAlchemy Core 管理连接、模型和事务。

**Architecture:** 保留 database.py、schema.py 和现有显式结构迁移。配置增加 MYSQL_URL_TEST 别名，冲突时拒绝启动；数据搬迁限定 metadata 内的 shuku_ 表，其他应用表不参与。迁移文件记录每张表的行数与摘要，导入执行空库检查、单事务写入、循环外键校验及逐表对账。

**Tech Stack:** SQLAlchemy 2 / mysql-connector-python / MySQL 8 / pytest。

## 实施与验证

1. Settings 配置测试：外部连接别名、原配置兼容、双配置冲突、错误信息不暴露凭证；实现后运行测试。
2. 新增 database_transfer.py：一致性快照、安全文件权限、生成列排除、空目标保护、失败回滚、幂等验证及外键完整性检查。
3. 测试 Unicode/JSON、循环引用、非空目标拒绝、快照破坏、错误外键回滚及第三方表不变。
4. 独立测试库运行全部术库后端回归；真实 RDS 只创建术库表，不运行会清表的测试。
5. 停写并停止 HTTP/Worker，备份本地业务表与运行配置；在独立测试库恢复完整快照，逐表对账。
6. 导入 RDS，核对所有业务表；切换环境配置与服务，验证登录、个人资料、课程、发布版本、共创及消息；确认 RDS 连接后恢复访问。
7. 失败时保持维护状态，恢复原配置和服务；源库与文件桶保留，不删除原数据库。凭证只保存在服务器私有配置，不进入 Git。

数据库迁移不包含文件桶搬迁，也不改变减论账号接入方式。当前无需引入第二套 Alembic 版本表；后续结构升级沿用显式版本与校验机制。
