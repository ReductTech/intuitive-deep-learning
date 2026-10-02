# 服务端数据目录

完整数据集、模型权重和训练产物统一保存在此目录。后端直接从本地文件系统读取；Cloud 计算容器挂载该目录，不经 OSS 或浏览器下载。

- `t10k-*.idx*-ubyte`、`mnist/`：数字识别数据及预处理特征。
- `lfw-50-balanced/`：人脸训练、验证数据与划分信息。
- `insightface/`：人脸推理模型。
- `models/`：手写识别等后端模型权重。
- `artifacts/<课程 UUID>/`：本地训练输出；云端使用独立持久化卷。

`IDL_DATA_DIR` 可覆盖数据根目录，`IDL_MODEL_DIR` 和 `IDL_ARTIFACT_DIR` 可分别覆盖权重及训练产物位置。迁移后的默认值不再查找 `dataset/` 或 `assets/dataset/`。

`assets/<课程 UUID>/` 只保存页面使用的展示素材，例如精选 MNIST 小图、人脸示例、特征图、Grad-CAM 结果及其可视化数据。这些内容继续上传 OSS。导出工具读取此目录中的完整数据，只把展示结果写入 `assets`。
