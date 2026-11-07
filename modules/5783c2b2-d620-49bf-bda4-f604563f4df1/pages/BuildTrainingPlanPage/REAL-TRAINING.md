# 第27页：300张图片的真实迁移训练

打开第27页即可依次操作“装入预训练权重 → 换成三分类头 → 冻结骨干并训练新头 → 锁定并独立测试”。四步各占一幕，操作成功后停留展示结果，点击“下一步”继续；上方可回看已开放步骤，回看不会重复计算。课程页标识仍为28-build-training-plan，页序仍为27页。

## 本机运行

在仓库根目录的VS Code PowerShell终端执行：

    .\modules\ResNet-Transfer-Guide\start-training.ps1

保持终端运行。网页继续使用4174开发预览；计算复用项目idl_backend视觉任务执行器，回环地址28431。依赖torch、torchvision、numpy、Pillow及后端已声明的cryptography。模型放在datasets/models/resnet18-f37072fd.pth；使用官方ImageNet1K V1权重并验证摘要，不回退到随机骨干。

## 数据与来源

- 300张原始JPEG，每类100张；每类60张训练、20张验证、20张测试，共180/60/60。图片只存放在本模块assets/training-head/images。
- 原有24张课程所有者素材保留；另外276张从Gary Thung、Mindy Yang的TrashNet数据集中逐张筛选。只采用塑料瓶、饮料易拉罐和纸盒/压扁纸盒，未直接把整个plastic/metal/cardboard大类当作本课标签。
- 作者地址：https://github.com/garythung/trashnet 。数据源：https://huggingface.co/datasets/garythung/trashnet 。使用固定94cd17e版本的dataset-resized.zip；新图为512×384，保留原JPEG字节。
- MIT许可全文保存在assets/training-head/TRASHNET-LICENSE.txt，作者及来源说明保存在SOURCES.md。原有素材仍保留其原有权利。
- dataset.json逐项记录原文件名、SHA256、来源、组别和固定划分。相关红罐、开口盒、蓝色压扁瓶、TrashNet近似品牌和对象视图不跨训练/验证/测试集合。加载时再次检查摘要、像素重复、分组隔离和每类数量。增强图不算新增独立照片。300张是原始照片数量，不是300个独立物体；相同包装有多个视角。
- 划分比例不是统一标准。本演示按类别平衡，先固定物体组，再划分180/60/60，之后才训练；验证集挑选轮次，测试集不挑选参数。清洁背景素材较多，结果只说明本数据集上的表现，不代表真实垃圾场景的效果。
- 重建先运行scripts/prepare_resnet_head_demo.py复制原有24图，再运行scripts/extend_resnet_head_demo.py，给它作者原始压缩包、许可文件和本模块素材目录。人工筛选的源编号、物体组和固定集合记录在scripts/resnet_head_photo_selection.json。扩充脚本会重建静态图片引用，重复运行结果不变。

## 四步计算与缓存

装入操作实际读取官方权重，并核对300张图片的512维固定特征，返回已装入会话。骨干参数和BatchNorm状态均冻结。图像使用官方224像素预处理，不根据本批数据拟合归一化统计量；预先提取测试图的固定特征不涉及测试标签和模型选择。

换头操作在这个会话上创建并保存Linear(512,3)的初始参数和验证图概率。页面固定使用初始化种子0；重新开始仍使用0，不轮换种子。初始概率按对应验证图标签汇总为训练前答对数。训练必须从这次换头的初始参数开始，使用SGD、学习率0.003、动量0.9、20轮、每批5张，只更新1539个新头参数。第0轮及20轮曲线全部来自实际计算；不人为延长训练或伪造渐变指标。骨干缓存命中只省去重复特征提取，每次仍真实训练新头。

验证损失最低的已训练轮次保存为候选。点击独立测试后，读取该模型，对60张未参与训练和选择的测试图计算预测。训练返回值不含测试预测；错误预测按原样显示，不保证策略优劣和小样本泛化能力。第一幕只展示权重与骨干，第二幕集中换头，第三幕展示训练/验证图片与曲线，第四幕单独评估测试集。前端展示训练样本时不显示验证图概率；训练结束和测试结束分别切换对应集合。数据用途在相关幕说明，验证集训练前/保存模型的训练后成绩与独立测试成绩并存。保存轮次来自实际验证损失最小值，图上标记与模型保持一致，回看记录不重新选模型。

特征、会话、初始新头、已训练模型和曲线位于datasets/artifacts/resnet-transfer-guide/head-training。特征缓存键包含照片清单、权重摘要和预处理版本；更换数据后不会复用旧数据集的缓存。图片与模型来源审计可在结果JSON核对。

## 接口、失败和验证

复用POST /v1/jobs与GET /v1/jobs/{id}，新增任务：
- /resnet/recycling/load-backbone
- /resnet/recycling/replace-head
- /resnet/recycling/train-head
- /resnet/recycling/evaluate-head

接口限制会话、0—9初始化种子和已完成run_id，不接收任意文件路径、训练轮数或结构。旧的seed-only训练调用仅保留为脚本兼容；第27页始终使用完整会话流程。CPU任务由原有执行器限制容量和超时。

接口校验每轮验证答对数与逐图预测一致、保存轮次对应最低验证损失，以及测试类别与预测概率一致。网络和计算失败原步重试，不用模拟结果兜底。重置和切页中止前端轮询并屏蔽旧结果；后台已经提交的有界任务可能继续完成。只有独立测试成功才完成本页。浏览器实点、截图与边界须单独验收。

验证命令：

    $env:PYTHONPATH='backend/src'
    .venv/Scripts/python.exe -m pytest backend/tests/test_recycling_head.py -q
    node modules/ResNet-Transfer-Guide/pages/BuildTrainingPlanPage/RealHeadTrainingPage.test.cjs

此页需要Python计算服务与模型权重。只打包课程前端目录可以显示界面，不能离线执行真实训练。
