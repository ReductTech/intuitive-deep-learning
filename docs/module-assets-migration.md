# 课程素材归属与 OSS 发布

正式素材保存于 `modules/<课程目录>/assets/`，共享素材保存于 `modules/shared/assets/`。课程 UUID 沿用 outlines.json 的 moduleIdentity.id，不因本地文件移动而改变。

页面仍调用 `moduleAssetUrl(UUID, relativePath)`。开发时 Vite 映射到课程目录；生产默认使用 `https://image.reduct.cn/cloud-IDL/assets/<UUID>/<relativePath>`。新旧本地快照均可解析。不要把课程素材复制进 dist 或前端镜像，也不要让 Nginx 读取或代理素材内容。

`modules/shared/asset-index.json` 保存本地目录、历史别名及精确格式映射；`modules/shared/react/asset-formats.json` 是前端使用的格式映射。它们仅为元数据，素材本体仍归各课程所有。历史有差异的副本保存在对应课程 assets/legacy/ 下，原 UUID 别名保留。

## PNG 转 JPG

```sh
python creator-skill/scripts/tools.py assets.compress modules/Example/assets --dry-run
python creator-skill/scripts/tools.py assets.compress modules/Example/assets --report conversion-report.json
```

只转换单帧、无透明像素、普通 8 位 PNG。不处理透明 PNG、APNG、GIF、SVG、WebP、16 位 PNG 和其他格式；不铺背景、不缩放、不抽帧。使用 JPEG quality=92、4:4:4；若 JPG 不小于原 PNG，则保留 PNG。已有 JPG 不覆盖。

工具默认保留原图，并仅为成功转换的文件更新格式映射。不要全局替换 `.png` 为 `.jpg`；动态缩略图和文件名也通过精确映射选择实际格式。评估截图继续保留 PNG，正式缩略图按其当前格式写入。

## OSS

```sh
python creator-skill/scripts/tools.py assets.upload --module <UUID> --dry-run
python creator-skill/scripts/tools.py assets.upload --module <UUID>
```

沿用原上传工具、凭据环境变量、桶和前缀；默认扫描注册课程的 assets，保持 `<UUID>/相对路径` 对象键，包含需要保留的历史 UUID 别名。默认跳过已有对象，不删除旧 OSS PNG；覆盖仍需明确使用 --overwrite。新生成的 JPG 必须上传后才能用于线上页面。

Cloud 的 Dockerfile、构建排除规则和发布同步器已适配课程内 assets；两仓库的变更需要配套发布。镜像构建上下文只允许四个编译必需的课程 JSON，图片、视频等继续排除。3D 场景的 models 目录中，展示模型、贴图及 glTF 配套缓冲也需要发布，不等同于训练权重目录。

2026-10-30 已同步现有素材到 OSS，核验 785 个转换后 JPG 对象与本地内容一致，并抽查人脸示例、缩略图、3D 模型贴图的 CDN GET 均为 200。未删除旧 OSS 对象；此操作不代表服务器页面已部署，也未操作数据库。后续新增或修改素材仍需执行发布同步。
