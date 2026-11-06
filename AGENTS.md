# 课程仓库约定

- 本仓库维护 module 课件及可构建样板。module 是一门完整课程，page 是课程中的可复用页面。
- 不把术库的账号、审核、发布、数据库或队列实现迁回这里。Creator Skill 保持独立。
- 课程入口在 `modules/<目录>/outlines.json` 注册。优先限制改动范围在对应课程，尊重该目录下的额外 AGENTS.md。
- 共用课件组件放在 `modules/shared/`；修改前说明必要性和影响，交付时说明 shared 是否修改。
- `npm run build -- --module <id>` 构建单门课程；`npm run build` 构建全部已实现课程。
- 展示与验收以 `dist/` 中的固定产物为准。不得让 Shuku 展示端读取课程源码或自动退回源码预览。
- 不提交 node_modules、dist、work、临时设计稿、缓存、个人配置或密钥。
- 不因课程名称或主题而删除现有课程；AI Practice、SPP、研究汇报等也属于本仓库的内容。
