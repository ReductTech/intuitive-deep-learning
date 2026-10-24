# 模块资源

课程专属图片、视频、字体、图标、3D 模型、外部数据文件和 术库 缩略图放仓库根目录 `assets/<moduleIdentity.id>/`。`moduleIdentity.id` 来自当前模块的 `outlines.json`；代码内定义的课程数据随模块实现保存。

## 引用

模块根目录中的引用示例：

```tsx
import { moduleAssetUrl } from '../shared/react';
import { moduleIdentity } from './outlines.json';

const imageUrl = moduleAssetUrl(moduleIdentity.id, 'images/example.png');
```

深层页面按文件位置调整 import。第二个参数是相对于 UUID 目录的路径；图片、视频、模型及 Canvas/WebGL 资源均通过此方法引用。CSS 背景图由组件生成 URL，再传入 CSS 自定义属性。

术库 缩略图与软评估共用 `scenedeck-thumbnails/<scene-id>.png` 的 1600×900 原图；播放器缩小显示，评估直接读图，不另存一份。操作状态放 `scenedeck-thumbnails/<scene-id>/<状态>.png`。播放器 `assetId` 使用同一 UUID。

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

## OSS 上传

命令从仓库根目录运行，工具实现位于 `creator-skill/scripts/media/upload-assets-oss.py`。

```powershell
# 安装上传工具的依赖。
python -m pip install -r creator-skill/scripts/requirements.txt

# 仅列出当前模块的上传对象，不联系 OSS。
python creator-skill/scripts/tools.py assets.upload --module <模块 UUID> --dry-run

# 核对范围、配置凭据并获得本次发布授权后上传。
python creator-skill/scripts/tools.py assets.upload --module <模块 UUID>
```

凭据使用环境变量 `OSS_ACCESS_KEY_ID` 和 `OSS_ACCESS_KEY_SECRET`，不写入 Skill 或课程文件。dry-run 不需要凭据或 oss2。

`--module` 选择上传模块并保留对象键的 UUID 前缀。`--assets-dir` 指定完整资源根目录，不指向单个 UUID 子目录；省略 `--module` 将处理整个资源根目录。默认 8 个并发，跳过已存在对象；`--overwrite` 才覆盖。工具不删除远端对象，并排除完整数据集目录、模型权重和训练产物。

需要发布私有 JSON 记录时使用 `--private-records`：只接受 JSON，写入 `cloud-IDL/records/`，设置 private ACL 与 no-store。普通课程素材使用默认上传模式。
