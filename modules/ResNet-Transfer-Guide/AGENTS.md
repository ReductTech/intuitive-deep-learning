# ResNet 课程维护约定

本目录遵循仓库根目录的 AGENTS.md，并额外遵循以下用户要求。

## 共享代码与交付

- 优化课程内容时，优先把页面、交互、样式和资源改动限制在本课程目录，不为课程单独定制 `modules/shared/`。
- 每次完成课程修改，最终回复必须明确写明 `shared 是否修改`。未修改时写“shared：未修改”；若修改，列出具体文件、用途和影响。恢复共享文件到上游版本也属于本次 shared 修改，必须说明。
- 如确需改动共享代码，在修改前向用户说明必要性与影响，不能静默改动。
- 不得重新依赖仅存在于本机的 `LearningPersistence.ts` 或 `DeckDefinition.persistProgress` 扩展。课程使用仓库公开的共享接口，学习进度遵循主工程默认规则。

## 本次同步基准

- 用户指定仓库：`https://github.com/ReductTech/intuitive-deep-learning`，分支 `develop`。
- 2026-10-17 核对的远端提交：`91d087d2b0aa8a54af4d9cff35ce79c1e1c62f64`。
- `modules/shared/react/learning/LessonFlow.tsx` 与 `modules/shared/react/presentation/types.ts` 恢复为该提交内容；该提交没有 `LearningPersistence.ts`，因此移除本机新增文件，原文件已备份在项目外的辅助工具目录。
- 同步不涉及拉取覆盖整个工程，也不改变本课程页面顺序、素材、题目或视觉设计。
