# 示例对话 — intuitive-deep-learning 技能

## 示例 1: 从头开始学

**用户:** `/intuitive-deep-learning 从头开始学`

**AI 回复:**

欢迎来到深度学习之旅！我们从多层感知机 (MLP) 开始。

**第一个问题：为什么需要多层感知机？**

线性模型假设输入和输出之间是单调关系——特征越大，输出越大（或越小）。但现实中很多关系是非单调的：

> 体温和死亡风险：37°C 以上，温度越高风险越大；37°C 以下，温度越低风险也越大。

线性模型无法捕捉这种 U 形关系。

打开 [MLP 理论与激活函数](assets/mlp-theory.html) 看看非线性的必要性演示——试试用线性模型去分类 XOR 数据，你会发现它完全做不到！

下一步你想：
1. 了解激活函数（ReLU、Sigmoid、Tanh）
2. 看看 MLP 的数学公式
3. 直接动手写代码
4. 其他

---

## 示例 2: 问具体概念

**用户:** `什么是 Dropout？`

**AI 回复:**

**Dropout（暂退法）** 是一种正则化技术，核心思想很简单：

> 训练时，每个神经元有概率 p 被"关掉"（输出置零），剩余神经元的输出乘以 1/(1-p) 来补偿。

数学公式：

$$h' = \begin{cases} 0 & \text{概率 } p \\ h/(1-p) & \text{概率 } 1-p \end{cases}$$

**为什么有效？**
- 防止神经元之间的"共适应"——不能依赖某个特定神经元
- 等效于同时训练了 2^n 个子网络的集成
- 推理时使用全部神经元，不做 dropout

打开 [Dropout 可视化](assets/dropout.html) 亲手体验——拖动滑块调节丢弃率，点击"应用 Dropout"看看每次随机关掉不同的节点！

常用设置：
- 浅层（靠近输入）：dropout = 0.2
- 深层（靠近输出）：dropout = 0.5

你想：
1. 看 Dropout 的 PyTorch 代码实现
2. 了解 Dropout 和权重衰减的区别
3. 去综合实验场试试 Dropout 的效果
4. 其他

---

## 示例 3: 代码执行

**用户:** `[DL-Lab] 请执行以下代码：`

```python
import torch
x = torch.arange(-8.0, 8.0, 0.1, requires_grad=True)
y = torch.relu(x)
y.backward(torch.ones_like(x))
print(f"ReLU 在 x=0 处的梯度: {x.grad[80]}")
print(f"ReLU 在 x=1 处的梯度: {x.grad[90]}")
print(f"ReLU 在 x=-1 处的梯度: {x.grad[70]}")
```

**AI 回复:**

执行结果：

```
ReLU 在 x=0 处的梯度: 0.0
ReLU 在 x=1 处的梯度: 1.0
ReLU 在 x=-1 处的梯度: 0.0
```

ReLU 的梯度行为很清晰：
- x > 0 时，梯度 = 1（完整传递）
- x ≤ 0 时，梯度 = 0（完全阻断）

这就是 ReLU 相比 Sigmoid 的优势——正区间梯度恒为 1，不会消失！

你想：
1. 看看 Sigmoid 的梯度对比
2. 了解 ReLU 的变体（LeakyReLU、PReLU）
3. 继续学习下一个主题
4. 其他
