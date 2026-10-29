# 模块身份与资源

## 模块 UUID

每个活跃模块在 `outlines.json` 顶层保存 `moduleIdentity`，其 `id` 是标准小写 UUID v4，与实现层的播放器场景 ID 分开；大纲每页仍只保存 `title` 与 `snippet`。

```json
{"moduleIdentity": {"version": 1, "id": "2e5c4732-a40a-4d20-b954-a61507aabc75"}}
```

示例只展示格式，不复制为新模块身份。UUID 由工具生成一次并持续使用；修改标题、内容、页序或目录名不改变 UUID。路由 `path` 与目录匹配是独立约束。

从仓库根目录运行 `python creator-skill/scripts/tools.py module.identity --check` 只检查身份，不写文件；省略 `--check` 会扫描全部 `modules/*/outlines.json` 并补齐所有缺失身份，不只处理当前模块。工具先检查已有 UUID，遇到格式错误或重复时停止，不替换已有 UUID；后端加载也拒绝缺失或无效身份。命令无需安装后端包，依赖要求见工具帮助和[工具索引](../tools.md)。

复制为独立新模块时，移除复制来的 `moduleIdentity` 再由工具生成新 UUID，将对应资源放入新模块自己的 `modules/<目录>/assets/`，同步运行时引用和术库 `assetId`，不沿用源模块身份。

## 正式资源与中间产物

课程专属图片、视频、字体、图标、3D 模型、外部数据文件和术库缩略图放本课程目录 `modules/<课程目录>/assets/`。`moduleIdentity.id` 来自当前模块的 `outlines.json`；代码内定义的课程数据随模块实现保存。

真正跨模块共用的正式素材放在 `modules/shared/assets/`；Skill 自身的设计参考图仍保留在 `creator-skill/assets/`。新素材不再写入仓库根目录的 `assets/<UUID>/`。旧根目录快照仅由兼容解析器读取，不能据此继续创建旧目录。

设计图、试制素材、检查截图与报告等逐页中间产物放在 `pages/<语义页目录>/_scratchpad/`。课程整体原稿提取和汇总资料放在模块级 `_scratchpad/`，两者均不上传到资源 CDN。确定用于正式页面的素材再放入 `modules/<课程目录>/assets/`，实现不得引用 `_scratchpad/` 中的文件。

## 引用

模块根目录中的引用示例：

```tsx
import { moduleAssetUrl } from '../shared/react';
import { moduleIdentity } from './outlines.json';

const imageUrl = moduleAssetUrl(moduleIdentity.id, 'images/example.png');
```

深层页面按文件位置调整 import。第二个参数是相对于当前模块 `assets/` 的路径，例如文件 `modules/Example/assets/images/example.png` 对应 `images/example.png`，不包含模块目录、`assets/` 或 UUID 前缀；图片、视频、模型及 Canvas/WebGL 资源均通过此方法引用。CSS 背景图由组件生成 URL，再传入 CSS 自定义属性。

正式术库缩略图保存在 `modules/<课程目录>/assets/scenedeck-thumbnails/`，默认为 `<scene-id>.png` 的 1600×900 原图；已有精确格式映射时按映射写入 JPG。由 `capture.thumbnails` 生成，播放器缩小显示。播放器 `assetId` 使用当前模块的 UUID，不使用目录名。

已有正式缩略图对应当前实现时可直接用于检查，无需重复截图；交互状态截图保存在 `_scratchpad/`。

## 本地与 CDN

`modules/shared/asset-index.json` 只保存目录、历史别名和格式映射等元数据，不集中保存素材本体。当前模块的本地归属由 `outlines.json` 所在目录确定；模块改名或移动时同步核对索引及相关别名，保持 UUID 不变。工具读取资源时复用 `scripts/common/module_assets.py` 的解析函数，不自行拼接旧根目录路径。

Vite 开发服务按模块 UUID 将请求映射到课程自己的 assets 目录。应用 base 为 `/` 时，磁盘文件 `modules/<课程目录>/assets/images/photo.jpg` 的本地 URL 仍是 `/<UUID>/images/photo.jpg`。页面只调用 `moduleAssetUrl`，由它处理应用 base 与资源域名。

项目的资源发布配置为：

- OSS 位置：`oss://jianlun/cloud-IDL/assets/`
- 公网前缀：`https://image.reduct.cn/cloud-IDL/assets`

CDN 构建设置：

```text
VITE_ASSET_BASE_URL=https://image.reduct.cn/cloud-IDL/assets
```

该变量在构建时读取。设置后，前端构建不复制本地静态资源；发布时单独上传所需资源，并保持 `<UUID>/相对路径` 的目录结构。本地开发或需要包含素材的离线构建不设置该变量。

## 发布与上传

使用已有 `assets.upload`，调用入口见[工具索引](../tools.md#资源与环境)，完整参数以 `assets.upload --help` 为准。上传前核对对象范围，并确认已有本次发布授权；凭据使用环境变量 `OSS_ACCESS_KEY_ID` 和 `OSS_ACCESS_KEY_SECRET`，不写入 Skill 或模块文件。

上传模块素材时指定模块 UUID，保留 `<UUID>/相对路径`。默认从已注册的 `modules/*/assets/` 与索引中的共享、历史别名目录收集素材，再映射到原有 OSS 对象键；省略模块筛选会处理全部注册资源，不能把它当作当前模块上传。不要将 `--assets-dir modules/<课程目录>/assets` 当作上传单模块的快捷方式：显式资源根目录按其相对路径生成对象键，会丢失默认模式保留的 UUID 前缀。默认跳过已有对象，覆盖须明确指定；工具不删除远端文件，也不发布完整数据集、模型权重和训练产物。

私有 JSON 回放记录使用 `--private-records`，写入 `cloud-IDL/records/`，采用 private ACL 与 no-store；普通页面素材使用默认资源发布模式。


## 普通 PNG 压缩

运行 `python creator-skill/scripts/tools.py assets.compress modules/<课程目录>/assets --dry-run` 先检查范围，移除 `--dry-run` 才执行。工具只处理单帧、完全不透明、普通 8 位 PNG，生成 `.jpg`；透明 PNG（包括调色板透明）、APNG、GIF、SVG、WebP、16 位 PNG 和其他格式保持原字节，不铺背景、不抽帧、不缩放。JPEG 不比原图小时不转换；已有 JPG 不覆盖；原 PNG 默认保留。

只有成功转换的文件进入精确格式映射。`moduleAssetUrl` 使用 `modules/shared/react/asset-formats.json`，动态文件名也按实际结果选择后缀，不能统一把 `.png` 改成 `.jpg`。`modules/shared/asset-index.json` 记录本地目录与稳定 OSS UUID 前缀；移动本地目录不改变 UUID。

上线素材仍单独上传 OSS，前端镜像不复制素材，Nginx 不提供素材内容。新生成的 JPG 是新对象，需要随发布上传，原有 OSS PNG 不自动删除。
