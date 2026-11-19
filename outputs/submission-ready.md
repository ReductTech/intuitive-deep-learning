# 官网源码提交说明

所有源码和媒体调整均在 C:\Users\Ocean\Documents\GitHub\intuitive-deep-learning 原文件中完成。本轮未创建临时源码目录、转换副本或独立工作树。构建在内存中完成，固定产物写入术库已配置的 course-builds 目录。

- 源码结构检查：31 门通过；其中 30 门可运行，1 门仅有大纲的创作草稿。
- 类型检查：30 门通过，0 错误。Three.js 使用工具链的正式类型声明，未用 any 或禁用检查消除报错。
- 本地生产构建：30 门通过。覆盖报告见 build-validation.json。
- 源码包：intuitive-deep-learning-source.zip。直接从原文件归档，没有源码暂存副本；CRC 和逐文件 SHA-256 均已核验。文件、图片和大小统计见同名 report.json。
- 浏览器：访问课件页面和自学入口，修复缺失渲染器、PPT 样式入口和部分真实溢出；重点交互已操作。完整覆盖边界、自动边界检查的误报和未验证范围见 submission-browser-review.json。未宣称所有自动几何断言通过。
- 《科研智能时代的机遇、挑战与探索》：用户明确选择发布已完成 6 页；其余 26 页的大纲、讲稿和 UUID 保留在原 outlines.json 的 draftPages，authoringPageOrder 保留全部 32 页顺序，draftDescription 保留完整创作计划描述。
- 自定义风格：原 modules/shared 原地登记为独立风格，包中按 styles/<UUID>/ 收录；课程和页面 UUID 保持不变。包内 course-styles.json 使用正确的自定义默认风格。

## shared：已修改

- modules/shared/react/controls/Button.tsx：明确链接与原生按钮分支类型，修复事件处理器联合类型报错；所有课程共用此组件。
- modules/shared/react/learning/LessonFooter.tsx：要求 pageKey 并传给 PageRating，保证评分定位到页面；现有课程没有该组件调用者。
- modules/shared/react/styles.css：公式提示默认不生成显示盒，仅悬停/聚焦时显示，修复不可见提示影响滚动边界；影响所有公式提示。
- modules/shared/style.json：注册独立风格身份，使修复随源码包进入官网；对应根 course-styles.json 和课程 style_id 已同步。

未上传、未发布、未提交 Git。术库服务器仍需独立执行入库、安全检查、正式构建、缩略图生成和内容审核。
