# 术库播放器 · 本地独立预览

本目录用于在 `intuitive-deep-learning` 内直接预览课程和开发播放器。所有配置、依赖、缓存和构建产物都保存在本目录内，不修改其他课程、`shared` 或 Shuku 源码。

## 启动

需要 Node.js 24 或更新版本。首次使用安装依赖：

```powershell
cd C:\Users\Ocean\Documents\GitHub\intuitive-deep-learning\player-preview
npm ci --cache .npm-cache
```

之后只需要：

```powershell
npm run dev
```

打开 <http://127.0.0.1:5174/>，在课程列表中搜索并选择「播放课件」或「课程导览」。没有实现入口的课程显示为待制作。端口固定为 5174，占用时会明确报错；也可运行 `npm run dev -- --port 5175`。

纯播放器演示：<http://127.0.0.1:5174/?demo=1>。不需要后端，可以验证按钮交互、方向键翻页、大纲和全屏。

课程深链接格式：`http://127.0.0.1:5174/?course=课程UUID&view=ppt`，可追加 `&slide=页面UUID`。`view=guide` 打开导览。原课程中的导览/播放链接会转到本地预览。

## 修改位置与依赖关系

- `src/`：从 `Shuku/packages/player/src` 复制的播放器组件、公开契约和样式。开发播放器时修改这里；不会回写数库。
- `preview/`：课程列表、演示页和课程装配入口。
- `vite.config.mjs`、`scripts/courses.mjs`：发现 `../modules` 中的课程，解析本地素材，适配共享运行时。
- `../modules/<UUID>` 课程目录与素材：只读引用，按需加载所选课程。课程页面支持 Vite 热更新；已有 `outlines.json` 修改会自动重启预览服务，新增课程目录后手动重启即可。
- `Shuku/packages/course-runtime`：只读复用数库的课程运行时。`../modules/shared` 提供当前默认风格，`@shuku/course-runtime` 与 `@shuku/course-style` 分别解析到内核与风格包，`@shuku/player` 映射到本目录的 `src/index.ts`，因此实际使用的是这里的播放器副本。
- npm 依赖安装在本目录的 `node_modules`，React 等依赖统一从这里解析，不要求先安装或启动 Shuku 前端。

默认 Shuku 路径为相对本目录的 `../../Shuku`，与当前本机目录布局一致。更换路径时，将 `.env.example` 复制为 `.env.local` 并设置 `SHUKU_ROOT`，然后重启服务。不读取 Shuku 的账号、OSS 密钥或部署配置。

普通页面交互、本地图片、讲稿和浏览器语音可直接预览。需要模型、训练或业务 API 的功能仍依赖相应数库服务，可在 `.env.local` 设置 `SHUKU_API_URL` 来代理 `/api`。本预览不模拟登录、GPU 或云端接口，也不发布或上传课件。

## 检查与构建

```powershell
npm run typecheck
npm run build
```

`typecheck` 检查播放器和本地预览入口；外部课程与运行时仍由各自项目检查。`build` 只构建独立播放器库，产物为 `dist/index.js`、类型声明和 `dist/style.css`，不打包或发布整个课程库。课程浏览入口用于 `npm run dev` 本地开发。

播放器保留 `src/index.ts` 的公开接口和 `.shuku-ppt-reader` 样式边界。后续同步上游播放器时仅比较并更新本目录的 `src/`。
