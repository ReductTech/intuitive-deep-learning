# 个人学习接入

入口：探索课程中的收藏按钮、“我的收藏”、“学习记录”和“继续学习”。匿名可浏览；登录后按会话中的用户 UUID 保存，不接收前端传入的用户身份。

开始学习打开最新正式版；继续学习打开最后学习的具体版本和页面。历史版本可在学习页主动选择，各版本的完成页和学习方式独立保存。内置课程也支持账号进度，但不是可选择历史发布版本的课程。

## 数据与接口

两张表均位于配置的 MySQL 数据库，表名以 `shuku_` 开头，复用 `Store` 事务和现有会话。

| 表 | 保存内容 |
| --- | --- |
| favorites | 用户、课程标识、收藏时间 |
| learning_states | 用户、课程标识、具体修订、当前页面、学习方式、完成页面、状态序号、更新时间 |

课程标识为 `course:<课程 UUID>` 或 `module:<可信模块别名>`。正式版本使用修订 UUID，内置课程使用 `builtin`。

| 接口（前缀 `/api/shuku`） | 用途 |
| --- | --- |
| GET /personal | 本人收藏和最近学习；历史每页 20 条，可使用返回的 cursor 继续查询 |
| POST /personal/favorites | `{resource, saved}` 收藏或取消；最多 500 门，重复操作幂等 |
| GET /personal/study/{resource}/{version} | 本版本的本人进度与允许访问的页面 |
| POST /personal/study | `{resource, version, page_id, mode, completed, expected_version}` 保存；mode 为 guide 或 ppt |
| GET /public/study/{resource}/{version} | 匿名获取可学习版本的页面标识，不暴露创作对话或私有源文件 |

路径参数需 URL 编码。写入要求同源会话；`expected_version` 首次为 0，之后使用服务端返回的 `state_version`。浏览器另发送 `X-Shuku-Account`（接口返回的 account_id），用于检测其他标签页切换账号；它不能指定记录所有者。旧设备或账号切换冲突得到 409，刷新恢复最新记录；前端串行并合并短时间内的翻页事件，页面后台化时补交待保存记录。

下架保留记录并显示不可访问，恢复后可续学；永久删除级联清理。未发布草稿和他人私有预览不能写成学习记录。浏览器旧收藏不自动归入当前账号。

新播放器通过校验来源窗口、同源地址、修订和随机通道的消息桥传递进度；已有冻结播放器只适配其原有翻页控件，保留教学展示方式，不重建正式文件。存储的是页面、完成情况和模式，不包含页面内临时输入或每个交互控件的内部状态。

验证：`backend/tests/shuku_backend/test_personal.py`；浏览器脚本 `scripts/check-shuku-personal.mjs` 在 localhost 和专用临时账号中执行，覆盖跨浏览器续学、历史版本、旧播放器适配和并发冲突。
