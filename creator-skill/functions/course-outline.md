# 课程大纲与注册

新课程先与用户确认受众、核心问题和教学顺序，再迭代 `modules/<Module>/outlines.json`。确认前不开始页面设计图与实现；已有已确认大纲直接沿用。局部修改不重做整套大纲。

## 页面索引

每页使用稳定的 `id`，记录目标、概要、交互、衔接和讲稿，不在大纲里堆详细布局。Guide 与 PPT 的页序与该索引一致。

以下是新模块骨架；标题、目录、入口和页面内容按课程替换。UUID 使用身份工具生成，不复制示例课程的 UUID。

```json
{
  "id": "example-course",
  "title": "课程标题",
  "description": "课程简介",
  "path": "/modules/example-course",
  "entry": "GuidePage.tsx",
  "ppt": {
    "entry": "ExamplePpt.tsx",
    "path": "/scenedeck/",
    "player": false
  },
  "pages": [
    {
      "id": "01",
      "title": "页面标题",
      "goal": "学生应能回答的问题或完成的任务",
      "summary": "本页主要内容",
      "interaction": "无，或核心交互",
      "next": "如何引出下一页",
      "snippet": "本页演讲稿"
    }
  ]
}
```

`moduleIdentity` 在生成后加入顶层。课程根目录数据与页面设计可随内容调整，但已有模块 UUID 不变。复制为独立新课时生成新 UUID。

## 与实际入口对应

- `path` 使用 `/modules/` 加模块目录名的小写形式。
- `entry` 指向模块根目录实际存在的 TSX 文件，组件按文件名命名导出；PPT 入口遵循相同规则。
- `src/app/modules.tsx` 自动发现大纲与模块根目录入口。一般新增课程不需要修改全局路由。
- PPT 入口导出 `deck`；按需导出 `getPptNotes`，通过共享 SceneDeck 播放。`ppt.player` 仅在确实需要承接通用旧播放器入口时设置，不照搬其他模块的值。
- `badge`、`moduleType`、`difficulty`、`audience` 等可选分类字段参照 `src/app/modules.tsx` 的实际类型填写，不猜测枚举值。

大纲阶段可先保存待讨论的结构，不把尚未存在的实现当作已完成模块。正式交付时核对入口存在、页序一致、UUID 有效。课程页数按教学需要决定，不为满足固定数量合并或拆分页面。
