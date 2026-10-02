# Windows 启动

在仓库根目录、已激活的 Python 环境中执行：

```powershell
.\scripts\devstart.ps1
npm run dev
```

第一条启动视觉识别/训练、问答、模型代理和学习记录服务；第二条在另一个终端启动课件网页。API 端口为 28431 / 28432，日志在 `runtime_logs/`。

```powershell
.\scripts\devstart.ps1 -Status
.\scripts\devstop.ps1
# 只调试视觉服务：
.\scripts\devstart.ps1 -Kind vision
```

默认优先使用 CUDA；没有 CUDA 时自动回退 CPU。需要强制使用 CPU 时加 `-Device cpu`。启动会预热手写识别模型，首次启动稍久，后续识别复用权重。

只停止本入口创建的进程，已有其他服务不会被终止。单独停止视觉服务用 `.\scripts\devstop.ps1 -Kind vision`。

首次准备 Python 依赖见 [backend/README.md](../backend/README.md)。根目录仅保留启动与停止两个入口；`checks/` 是页面检查，`content/` 是内容生成。Python 工具直接运行公共包，不再设置重复的 .py 转发脚本。测试统一在 `backend/tests/`。

云端在 Cloud 仓库运行 `sh scripts/cloud-update.sh` 或 `sh scripts/gpu-update.sh`，无需在此仓库拼装部署命令。
