# React/TypeScript 公式渲染与花书数学符号系统

本文记录当前 LaTeX 公式渲染系统的最终口径：只适配 React/TypeScript 化后的模块；旧 HTML 公式演示模块 `modules/Formula-Tooltip-Lab/` 已移除。

## 当前结构

| 文件                                                        | 作用                                                                                                                        |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `modules/shared/react/learning/MathFormulaBlock.tsx`      | React 公式渲染基础组件，提供`MathFormulaBlock`、`MathFormulaTerm`、`MathFormulaStatic`。                              |
| `modules/shared/react/learning/MathFormulaSymbols.tsx`    | 固定数学符号系统，基于本地 PDF《深度学习》数学符号部分整理。提供符号表、默认解释和`MathSymbolTerm`/`MathSymbolStatic`。 |
| `modules/shared/react/index.ts`                           | 统一导出公式组件和符号系统。                                                                                                |
| `modules/shared/vendor/mathlive/`                         | 本地 MathLive vendor 资源。                                                                                                 |
| `src/App.tsx`                                             | 引入 MathLive 字体 CSS 和 shared React 样式。                                                                               |
| `modules/Formula-Tooltip-React/FormulaTooltipPage.tsx`    | React 演示页，展示如何引用 shared 公式渲染与固定数学符号。                                                                  |
| `modules/Formula-Tooltip-React/formula-tooltip-react.css` | 演示页局部布局样式。                                                                                                        |

## 固定数学符号系统

固定符号来自本地 PDF 中“数学符号”部分，覆盖这些类别：

| 类别         | 示例                                                                            |
| ------------ | ------------------------------------------------------------------------------- |
| 数和数组     | 标量`a`、向量 `a`、矩阵 `A`、张量、单位矩阵、标准基向量、对角矩阵         |
| 集合和图     | `R`、`{0,1}`、区间、差集、图、父节点                                        |
| 索引         | `a_i`、`A_{i,j}`、矩阵行/列、三维张量元素和切片                             |
| 线性代数     | 转置、伪逆、Hadamard 乘积、行列式、Lp/L2 范数                                   |
| 微积分       | 导数、偏导、梯度、矩阵导数、Jacobian、Hessian、积分                             |
| 概率和信息论 | 独立、条件独立、概率质量/密度、期望、方差、协方差、熵、KL 散度、高斯分布        |
| 函数         | 函数映射、函数组合、参数化函数、自然对数、sigmoid、softplus、正数部分、指示函数 |
| 数据集和分布 | 数据生成分布、经验分布、训练集、输入样本、监督目标、设计矩阵                    |

符号系统的核心约束：

1. 相同 `symbolKey` 的 LaTeX 写法和基础样式保持一致。
2. 默认解释写在 shared 符号表中。
3. 具体模块可以覆盖 `tooltip`，用于适配当前语境。
4. 符号表没有收录的片段继续按普通 `latex` 渲染。
5. 当前系统只服务 React/TS 模块，不再维护 HTML 版公式写法。

## React 使用方式

### 1. 引入组件

```tsx
import { MathFormulaBlock, MathFormulaStatic, MathSymbolTerm } from '../shared/react';
```

### 2. 引用固定符号

```tsx
<MathFormulaBlock ariaLabel="参数化函数示例">
  <MathSymbolTerm symbolKey="parameterizedFunction" />
  <MathFormulaStatic latex="=" />
  <MathSymbolTerm symbolKey="matrix" />
  <MathSymbolTerm symbolKey="vector" />
  <MathFormulaStatic latex="+" />
  <MathSymbolTerm latex="b" tooltip="b：偏置项。这个符号不在固定表中，按普通 LaTeX 渲染。" />
</MathFormulaBlock>
```

### 3. 覆盖解释但复用符号样式

```tsx
<MathSymbolTerm
  symbolKey="normTwo"
  latex="\lVert W\rVert_2^2"
  tooltip="||W||₂²：权重 W 的 L2 范数平方。在正则化项中，它惩罚过大的权重。"
  ariaLabel="W 的 L2 范数平方"
  tone="warm"
/>
```

这里复用了 `normTwo` 的符号体系，但把解释改成当前模块的正则化语境。

### 4. 渲染未收录符号

```tsx
<MathSymbolTerm
  latex="W^{*}"
  tooltip="W*：训练结束时找到的最优权重。"
  ariaLabel="W star，最优权重"
/>
```

没有 `symbolKey` 时，组件等价于一个带 tooltip 的普通 LaTeX 片段。

## 演示页

React 演示模块：

```text
modules/Formula-Tooltip-React/FormulaTooltipPage.tsx
```

路由：

```text
/modules/formula-tooltip-react
```

演示页保留原来的训练目标公式形式，但固定符号改为引用 shared 符号系统：

- `y` 覆盖自 `trainingTarget`
- `ŷ` 覆盖自 `parameterizedFunction`
- `||W||₂²` 覆盖自 `normTwo`
- `W*` 不在固定符号表中，按普通 LaTeX 渲染

## 维护规则

| 场景                           | 做法                                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------------------- |
| 花书数学符号表中已有符号       | 优先使用`MathSymbolTerm symbolKey="..."`                                                        |
| 同一符号在模块中需要更具体解释 | 保留`symbolKey`，覆盖 `tooltip`/`ariaLabel`                                                 |
| 花书表中没有的符号             | 使用`MathSymbolTerm latex="..." tooltip="..."`                                                  |
| 不需要解释的连接符             | 使用`MathFormulaStatic latex="="`、`+`、`,`、`(`、`)` 等                                |
| 需要新增固定符号               | 只改`MathFormulaSymbols.tsx`，并补 `key`、`latex`、`label`、`description`、`category` |

## 本地验证命令

类型检查：

```bash
npm run typecheck
```

生产构建：

```bash
npm run build
```

模块索引检查：

```bash
python3 modules/build_module_index.py --check
```

启动开发服务：

```bash
npm run dev -- --host 127.0.0.1
```

访问：

```text
http://127.0.0.1:<vite-port>/modules/formula-tooltip-react
```
