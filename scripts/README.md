# Windows 启动

在仓库根目录、已激活的 Python 环境中执行：

```powershell
.\scripts\devstart.ps1
npm run dev
```

第一条启动视觉识别/训练、问答、模型代理、学习记录和共用 Cloud API；第二条在另一个终端启动课件网页。网页通过 `/api` 代理到 8000，再调用 28431 / 28432，训练和 LLM 共用云端 MySQL 缓存。日志在 `runtime_logs/`。本地需要 Cloud 仓库及其依赖和缓存连接配置，详见 backend/README.md。

```powershell
.\scripts\devstart.ps1 -Status
.\scripts\devstop.ps1
# 只调试视觉服务：
.\scripts\devstart.ps1 -Kind vision
```

默认优先使用 CUDA；没有 CUDA 时自动回退 CPU。需要强制使用 CPU 时加 `-Device cpu`。启动会预热手写识别模型，首次启动稍久，后续识别复用权重。

只停止本入口创建的进程，已有其他服务不会被终止。单独停止视觉服务用 `.\scripts\devstop.ps1 -Kind vision`。

首次准备 Python 依赖见 [backend/README.md](../backend/README.md)。仓库 scripts 继续管理服务启停。通用创作、截图、校验、资源发布与媒体处理工具已归入 `creator-skill/scripts/`，统一执行 `python creator-skill/scripts/tools.py list` 发现工具；旧通用工具入口只转发，不维护第二套实现；课程专用训练、预计算、缓存与素材生成脚本留在原模块或后端。后端测试在 `backend/tests/`，创作工具测试在 `creator-skill/scripts/tests/`。

云端在 Cloud 仓库运行 `sh scripts/cloud-update.sh` 或 `sh scripts/gpu-update.sh`，无需在此仓库拼装部署命令。
