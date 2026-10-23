# 模型计算与 GPU

用于训练、神经网络推理、Embedding 或较重的视觉计算。普通数学、简单卷积可视化和能实时完成的规则判断保留在前端，不为了“用了 GPU”搬到后端。

## 服务架构

`React → 共用 Cloud API /api/lab → Python 计算服务 → idl_backend.vision → Torch / 本地模型`

Cloud API 是课程访问计算服务的统一入口。Cloud 应用提供的 `frontend/cloud-runtime.js` 负责请求地址转换与课程上下文注入，课程代码不复制该适配层。服务位置、安装与启动方式见 `backend/README.md`。

按以下职责寻找实现：

| 职责 | 仓库路径 |
|---|---|
| 数据读取与数据契约 | `backend/src/idl_backend/datasets/` |
| 任务注册、接口标识与惰性分发 | `backend/src/idl_backend/contracts/tasks.py` |
| HTTP 接入与请求处理 | `backend/src/idl_backend/local/http.py` |
| 特征、训练、推理 | `backend/src/idl_backend/vision/features/`、`training/`、`inference/` |
| 设备策略 | `backend/src/idl_backend/vision/device.py` |

不要把模型实现或数据读取堆回 HTTP 层，不为每门课再建立一套计算服务。自定义前端请求封装在模块 `services/`，页面只提交教学参数、读取稳定业务结果。

## 计算规模与交互

- 使用足以展示教学现象的小模型、小数据和有界训练；限制 epoch、batch、层数和通道数等输入。
- 不允许用户参数任意构造可能耗尽内存或显存的网络。
- 较长任务采用提交 → job ID → 查询进度 → 获取结果，复用现有异步契约。
- 等待、失败、重试和重置行为应清楚；缓存命中直接展示实际结果，不模拟训练进度。
- 能复用预计算或缓存时不重复昂贵计算，模拟教学过程不能冒充真实训练。

## 设备与运行

设备选择在 Python 内部完成，React 不判断显卡型号或用设备差异改变知识结论。复用 `select_device`，尊重 `IDL_DEVICE` 等现有配置；当前 auto 策略选择可用 CUDA，否则 CPU，MPS 需明确选择且设备可用。

设计时保证没有 GPU 也能完成核心学习流程，必要时减小任务或使用已标明的预计算结果。缺少环境依赖时说明实际限制，不伪造计算结果。

本说明用于接入设计，不要求自动启动服务、训练或下载大模型。只有任务已有相关授权时才执行；学生页面关注模型、指标和参数变化，不展示后端设备细节，除非它本身就是教学目标。
