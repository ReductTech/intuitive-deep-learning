# 课程仓库约定

- 本仓库维护 module 课件及可构建样板。module 是一门完整课程，page 是课程中的可复用页面。
- 不把术库的账号、审核、发布、数据库或队列实现迁回这里。Creator Skill 保持独立。
- 课程入口在 `modules/<UUID>/outlines.json` 注册。优先限制改动范围在对应课程，尊重该目录下的额外 AGENTS.md。
- 共用课件组件放在 `modules/shared/`；修改前说明必要性和影响，交付时说明 shared 是否修改。
- 统一检查、构建、构建运行时和 npm 依赖归术库管理。在 Shuku 运行 `python run.py courses-check`、`python run.py courses-build --module <UUID或alias>`；不在本仓库新增平台构建入口。
- 展示与验收以术库 `course_build.output_root/<UUID>/<构建哈希>/` 的固定产物为准。输出路径由术库 shuku.json 指定。不得让展示端读取课程源码或自动退回源码预览。
- 不提交 node_modules、dist、work、临时设计稿、缓存、个人配置或密钥。
- 不因课程名称或主题而删除现有课程；AI Practice、SPP、研究汇报等也属于本仓库的内容。

- 模块目录 UUID、outlines.id、moduleIdentity.id 必须相等；页文件名保留语义。资源对象使用最终字节 SHA-256，版本清单保留逻辑路径与 MIME，不覆盖或直接删除共享对象。

## 页面身份
- 每个可播放页面的 `id` 必须是固定的 UUID v4；在创建页面时生成一次并写入大纲与源码，不得从标题、路径、顺序或运行时随机生成。
- 改标题、讲稿、文件名、位置和内容时保留 UUID；新增独立页面或复制为独立页面时才分配新 UUID。展示序号、活动控件 ID、CSS 名称与页面 UUID 分开。
- 大纲、PPT 场景、自学步骤、讲稿索引及跳转必须使用同一个页面 UUID。通过 UUID 关联元数据与渲染组件，不得以大纲数组下标或标题绑定页面。
- `outlines.json.pages` 为课程页面元数据和编排入口；内嵌副本使用其局部 `outlines.json` 或 `pages.json` 登记身份。不得把一次性旧 ID 对照导入课程运行时。
