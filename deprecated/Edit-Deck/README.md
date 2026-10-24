# Edit Deck

独立的画布创作工作区：一句话 → 图片草稿 → React Web PPT → 点选元素修改。

运行主项目的 `npm run dev`，打开 `http://localhost:5173/edit-deck`。本阶段通过本机 Vite 插件提供配置与模型转发，不依赖 Cloud API，也未接入 术库 课程目录。

## 本机接口文件

首次启动会创建 `~/.edit-deck/interfaces.json`（Windows：`C:\Users\你的用户名\.edit-deck\interfaces.json`）：

```json
{
  "llm": { "baseUrl": "", "apiKey": "", "model": "" },
  "image": { "baseUrl": "", "apiKey": "", "model": "" }
}
```

顶部「接口配置」可读写这个文件，「一键读取」重新读取外部编辑后的配置。API Key 不回传浏览器，不写进 localStorage、源码、项目导出文件。密钥输入留空表示保留已有值；清除密钥可直接在文件中置空。每次请求重新读文件。

Base URL 为 OpenAI 兼容接口根地址；仅填写域名时自动补 `/v1`，也可直接填写带 `/v1` 或自定义路径的地址；自动追加 `chat/completions`、`images/generations`。LLM 必须支持图像输入；生图返回 `data[0].b64_json` 或 `data[0].url`。不假设具体厂商或模型名称。图片修改使用 Images Edits API 的 JSON `images: string[]` 格式；支持同时添加最多 8 张 PNG/JPEG/WebP 参考图，生成结果返回 `b64_json`。图片上传后可在修改输入框上方移除或追加参考图。

## 工作区

- 空白页生成图片或导入参考图；图片可重新生成、调整并转为 Web PPT。
- LangGraph JS 工作流运行于浏览器：生成 TSX → esbuild-wasm 编译 → 最多两次编译修复。
- React/ReactDOM 随应用本地打包，无第三方 CDN。生成代码在 `sandbox="allow-scripts"` 的 iframe 中运行，不能读取编辑器的配置或本机文件。
- 固定 1600 × 900 画布的尺寸和缩放逻辑与 术库 共用。
- Web PPT 支持真实 React 状态与交互，选择模式下点击 DOM 元素，将选择器、文本和 HTML 传给模型；Canvas 内部子对象暂不支持点选。
- 草稿自动保存到 `~/.edit-deck/projects/current.json`；可导出/导入 `.editdeck.json`、本页自包含 HTML、TSX。新建项目先导出当前副本。
- 图片草稿与 Web PPT 分别保留；重新生成图片不会自动覆盖已有 React 版本。
- 预览运行错误会展示，可以点击「修复」交给模型。编译检查不能替代对教学内容和交互的人工检查。

这是本机创作工具。生产静态站点不会携带本机配置代理；将来部署多用户版本时需要独立的鉴权与项目存储服务。
