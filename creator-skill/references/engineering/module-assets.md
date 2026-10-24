# 模块身份与资源

## 模块 UUID

每个活跃模块在 `outlines.json` 顶层保存 `moduleIdentity`，其 `id` 是标准小写 UUID v4，与页面 `id` 分开。

```json
{"moduleIdentity": {"version": 1, "id": "2e5c4732-a40a-4d20-b954-a61507aabc75"}}
```

示例只展示格式，不复制为新模块身份。UUID 由工具生成一次并持续使用；修改标题、内容、页序或目录名不改变 UUID。路由 `path` 与目录匹配是独立约束。

从仓库根目录运行 `python creator-skill/scripts/tools.py module.identity --check` 只检查身份，不写文件；省略 `--check` 会扫描全部 `modules/*/outlines.json` 并补齐所有缺失身份，不只处理当前模块。工具先检查已有 UUID，遇到格式错误或重复时停止，不替换已有 UUID；后端加载也拒绝缺失或无效身份。命令无需安装后端包，依赖要求见工具帮助和[工具索引](../tools.md)。

复制为独立新模块时，移除复制来的 `moduleIdentity` 再由工具生成新 UUID，将对应资源放入 `assets/<新 UUID>/`，同步运行时引用和 术库 `assetId`，不沿用源模块身份。

## 正式资源与中间产物

课程专属图片、视频、字体、图标、3D 模型、外部数据文件和 术库 缩略图放仓库根目录 `assets/<moduleIdentity.id>/`。`moduleIdentity.id` 来自当前模块的 `outlines.json`；代码内定义的课程数据随模块实现保存。

原稿提取、设计图、试制素材、检查截图与报告属于中间产物，放在当前模块的 `_scratchpad/`，不上传到资源 CDN。确定用于正式页面的素材再放入 `assets/<UUID>/`，实现不得引用 `_scratchpad/` 中的文件。

## 引用

模块根目录中的引用示例：

```tsx
import { moduleAssetUrl } from '../shared/react';
import { moduleIdentity } from './outlines.json';

const imageUrl = moduleAssetUrl(moduleIdentity.id, 'images/example.png');
```

深层页面按文件位置调整 import。第二个参数是相对于 UUID 目录的路径；图片、视频、模型及 Canvas/WebGL 资源均通过此方法引用。CSS 背景图由组件生成 URL，再传入 CSS 自定义属性。

正式 术库 缩略图为 `scenedeck-thumbnails/<scene-id>.png` 的 1600×900 原图，由 `capture.thumbnails` 生成，播放器缩小显示。播放器 `assetId` 使用同一 UUID。

已有正式缩略图对应当前实现时可直接用于检查，无需重复截图；交互状态截图保存在 `_scratchpad/`。

## 本地与 CDN

Vite 直接提供根目录 `assets/` 中的文件。应用 base 为 `/` 时，磁盘文件 `assets/<UUID>/images/photo.png` 的本地 URL 是 `/<UUID>/images/photo.png`。页面只调用 `moduleAssetUrl`，由它处理应用 base 与资源域名。

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

上传模块素材时指定模块 UUID，保留 `<UUID>/相对路径`。省略模块筛选会处理整个资源根目录，不能把它当作当前模块上传。默认跳过已有对象，覆盖须明确指定；工具不删除远端文件，也不发布完整数据集、模型权重和训练产物。

私有 JSON 回放记录使用 `--private-records`，写入 `cloud-IDL/records/`，采用 private ACL 与 no-store；普通页面素材使用默认资源发布模式。
