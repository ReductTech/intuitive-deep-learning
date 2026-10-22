# 模块资源

课程专属图片、视频、字体、图标、3D 模型、外部数据文件和 SceneDeck 缩略图统一放仓库根目录 `assets/<moduleIdentity.id>/`，其中 ID 为模块的稳定 UUID。不放在 `modules/<Module>/` 内；代码内定义的课程数据仍随模块实现保存。

## 引用

模块根目录中的引用示例：

```tsx
import { moduleAssetUrl } from '../shared/react';
import { moduleIdentity } from './outlines.json';

const imageUrl = moduleAssetUrl(moduleIdentity.id, 'images/example.png');
```

深层页面按实际位置调整 import，`relativePath` 始终相对于该 UUID 资源目录。图片、视频、模型及 Canvas/WebGL 加载资源均用同一方法，不手写本地或 CDN 地址。

CSS 背景图由组件通过 `moduleAssetUrl` 生成，再传入 CSS 自定义属性。SceneDeck 缩略图放 `scenedeck-thumbnails/<scene-id>.png`，播放器 `assetId` 使用相同 UUID。

## 本地与 CDN

Vite 将仓库根目录 `assets/` 作为静态目录提供，默认 URL 相对应用 base；URL 不一定包含字面上的 `/assets/`，不要自行拼接。

CDN 部署时只设置 `VITE_ASSET_BASE_URL`，并上传整个根目录 `assets/`，不逐页改路径。例如文件上传为 `https://cdn.example.com/assets/<uuid>/photo.png` 时：

```text
VITE_ASSET_BASE_URL=https://cdn.example.com/assets
```

配置在前端构建时读取。设置 CDN 前缀后，生产构建跳过本地资源复制，需单独上传资源。未设置时沿用本地静态资源；本地开发或需要包含素材的离线构建保持未设置。

## OSS 上传工具

实现迁自 Cloud 仓库，维护位置为 `creator-skill/scripts/assets/upload-assets-oss.py`；Cloud 的旧命令保留为转发入口。默认上传本仓库根目录 `assets/`，目标仍为 `oss://jianlun/cloud-IDL/assets/`。

```powershell
# 一次性安装 skill 校验与上传的可选依赖。
python -m pip install -r creator-skill/scripts/requirements.txt

# 不联系 OSS，也不需要凭据；核对本次上传的对象键。
python creator-skill/scripts/tools.py assets.upload --module <模块 UUID> --dry-run

# 已获本次发布授权且配置凭据后执行。
python creator-skill/scripts/tools.py assets.upload --module <模块 UUID>
```

真实上传从环境变量 `OSS_ACCESS_KEY_ID` 和 `OSS_ACCESS_KEY_SECRET` 读取凭据，不写入 skill 或课程文件；也兼容同义的 `ALIBABA_CLOUD_ACCESS_KEY_ID` / `ALIBABA_CLOUD_ACCESS_KEY_SECRET` 与旧 `OSS_KEY_ID` / `OSS_KEY_SECRET`。仅 dry-run 无需 oss2。

`--module` 保留对象键中的 UUID 前缀；不要把 `--assets-dir` 指向单个 UUID 子目录而丢掉前缀。`--assets-dir` 用于替换资源根目录，省略 `--module` 会处理整个根目录。默认 8 个并发，跳过已存在对象；`--overwrite` 才覆盖。

工具排除完整数据集目录、模型权重和训练产物，不删除远端对象。原有 `--private-records` 兼容模式只接受 JSON，写入 `cloud-IDL/records/`，使用 private ACL 与 no-store；普通课程素材不使用该模式。
