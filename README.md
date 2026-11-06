# Intuitive Deep Learning

用可观察、可操作的课程建立直觉。

这里是**课件源码与创作样板库**。每个 `modules/<名称>/` 是一门完整课程，包含页面、课程大纲和素材。数学、深度学习、AI 实践、研究汇报和创作指南等现有模块均保留；课程目录不按名称预先删减。

术库 Shuku 负责用户、共创、审核和发布，Creator Skill 独立维护。这个仓库提供课件及其构建方法。

## 使用

需要 Node.js 24。

```sh
npm ci
npm run list
npm run check

# 构建一门课程，名称或目录名均可
npm run build -- --module basic-example

# 或构建全部已实现的课程
npm run build

# 只服务 dist，不运行源码开发服务器
npm run preview
```

预览地址：`http://127.0.0.1:5180`。可以用 `npm run preview -- --port 其他端口` 指定端口。课程入口支持 `?mode=guide`、`?mode=ppt` 和 `?page=页面ID`。

目前有 **31 个课程大纲，其中 30 门具备构建入口**。`Professional-Creator-Guide` 目前仅有大纲，按草稿保留；整库构建不会把它伪装成可播放课程。API／GPU 驱动的互动仍需要相应外部服务，静态构建不模拟这些服务。

## 新建课程

从 `modules/Basic-Example/` 这个单页样板开始最容易：

1. 复制课程目录，设置新的目录名、`outlines.json` 中的 `id`、标题和 `moduleIdentity.id`。素材 UUID 必须重新生成，不能与原课程重复。
2. 编写 `pages/` 中的页面，更新 `outlines.json.pages` 的顺序和说明。
3. `entry` 指向自学入口；`ppt.entry` 指向导出 `deck` 的展示入口。只需要一种模式时可省略另一种入口。
4. 图片、视频等放在本模块的 `assets/`。共用界面组件使用 `modules/shared/`。
5. 执行检查和单模块构建，再检查构建后的交互效果。

```text
modules/My-Course/
  outlines.json       # 课程身份、页面顺序、入口
  GuidePage.tsx       # 自学模式入口
  CoursePpt.tsx       # 展示模式及 deck
  pages/              # 页面源码
  assets/             # 本课程素材
```

`modules/*/outlines.json` 是当前课程注册入口。迁入的 `modules/index.json`、`info.template.json` 和旧 Python 索引脚本属于早期 HTML 课件格式，不参与新构建。

## 交给术库的是构建产物

单课程构建生成：

```text
dist/
  index.html
  assets/                 # 已构建 JS/CSS/字体和课程素材
  course.json             # 该版本的课程信息和页面索引
  artifact-manifest.json  # 文件大小、SHA-256 和产物版本
  catalog.json
```

整库构建则在 `dist/<module-id>/` 分别生成各门课程，根目录提供 `catalog.json` 和静态入口。

**术库展示端只读取这些固定产物，不读取本仓库的 TSX、大纲源码或素材源码目录。** 修改源码后必须重新构建，发布指向新的产物版本。`dist/` 不进入 Git；构建结果应由执行端上传至 OSS。新构建失败时保留上一次成功的 `dist/`。

整库是一个课程集合，素材压缩后源码与素材约 543 MB。术库后续应按 module 选择、构建和管理版本；这不是把全部模块作为一门课程导入的建议，也不表示现有 Worker 的单任务大小限制已经调整。

## 仓库结构

- `modules/`：完整课程及共享课件组件。
- `runtime/`：将单门课程的入口挂载为独立页面的最小适配。
- `scripts/`：课程检查、构建和仅产物预览。
- `docs/`：迁移来源与构建约定。

迁移来源及验证范围见 `docs/MIGRATION.md`。没有复制原网站业务后端、登录审核页面、运行环境配置、Creator Skill 或旧 Git 历史。

## 素材压缩

图片沿用原 Creator Skill 压缩脚本的规则：最大 1600×900，保持比例不裁切，JPEG 质量 92。不透明 PNG 必须转换为 JPEG，真实透明 PNG 保留透明度。源文件引用及 UUID 动态资源映射一同更新，再移除被替换的 PNG。

`scripts/optimize-media.py` 默认只审计。安装 `requirements-media.txt` 中的依赖，指定仓库外的备份目录或已有原始归档后，才能使用 `--apply`。`--videos` 使用 H.264 CRF 23 压缩 MP4，保留音频，仅在体积更小时替换。应用记录使用新的报告路径，防止误重复执行相同命令。

```sh
python -m pip install -r requirements-media.txt
python scripts/optimize-media.py --report ../idl-media-audit.json
python scripts/optimize-media.py --apply --videos --backup-dir ../idl-media-originals --report ../idl-media-report.json
```

素材改变后重新构建。`dist` 包含完整可部署产物与素材副本，本地目录还包括 node_modules；这两部分不会进入 Git。
