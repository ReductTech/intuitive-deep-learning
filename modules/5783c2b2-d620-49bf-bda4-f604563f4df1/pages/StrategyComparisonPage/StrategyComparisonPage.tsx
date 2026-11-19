import { useState } from 'react';
import { Button, ContentBlock, Typography } from '@shuku/course-style/react';
import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import './StrategyComparisonPage.css';
const criteria = [
  ['验证效果', '保持同一份验证集和评价指标，比较模型在未参与训练的数据上的表现。'],
  ['训练成本', '记录训练时间、显存和更新的参数量；冻结骨干仍然需要前向计算。'],
  ['稳定性', '在相同评估协议下重复实验，观察不同随机种子之间的波动。'],
  ['过拟合风险', '同时查看训练与验证表现，识别训练损失下降而验证表现变差的情况。'],
] as const;
const strategies = [
  ['从头训练', '随机初始化，更新全部参数', '看目标数据能否支持从零学习'],
  ['冻结骨干', '使用预训练骨干，只训练新头', '看固定表示能否满足新任务'],
  ['微调骨干', '从预训练权重出发，更新部分或全部骨干', '看适应任务的收益与训练代价'],
];
export function StrategyComparisonPage({ onComplete }: { onComplete?: () => void }) {
  const [selected, setSelected] = useState(0), [visited, setVisited] = useState<number[]>([0]);
  const choose = (index: number) => { setSelected(index); const next = [...new Set([...visited, index])]; setVisited(next); if (next.length === criteria.length) onComplete?.(); };
  return <ContentBlock className="rt-strategy-compare" title="三种方案，应该比较什么？" subtitle="同一份数据划分与评价标准，才能进行公平比较。" headingLevel={1}><div className="rt-strategy-compare__body">
    <div className="rt-strategy-compare__criteria" role="group" aria-label="选择比较维度">{criteria.map(([label], index) => <Button key={label} active={selected === index} aria-pressed={selected === index} onClick={() => choose(index)}>{label}</Button>)}</div>
    <table><thead><tr>{['方案', '训练哪些部分', '需要验证的问题'].map(label => <th key={label}><Typography variant="h3" tone="accent">{label}</Typography></th>)}</tr></thead><tbody>{strategies.map(row => <tr key={row[0]}>{row.map(value => <td key={value}><Typography variant="body">{value}</Typography></td>)}</tr>)}</tbody></table>
    <section aria-live="polite"><Typography variant="h3" tone="accent">{criteria[selected][0]}</Typography><Typography variant="body">{criteria[selected][1]}</Typography></section>
    <Typography variant="bodySmall" tone="muted">比较维度不是实验结论：不能只凭训练损失最低，就宣布某个方案最好。</Typography>
  </div></ContentBlock>;
}

const chain = [
  ['像素', '图像以数值输入模型；同一类别的照片仍会受到视角、光照和形变影响。'],
  ['可学习特征', '卷积及后续层从训练数据中学习表示，把像素组合成有助于区分类别的特征。'],
  ['残差网络', '捷径与残差分支一起传递信息和梯度，帮助更深的网络进行优化。'],
  ['预训练参数', '已训练的权重保存先前任务中学到的表示，可作为新任务的起点。'],
  ['新分类头', '对新的类别更换输出层，再按数据条件比较冻结骨干和微调方案。'],
] as const;
const bottle = moduleAssetUrl('recycling/intro-samples/bottle-blue.webp');
export function LearningChainPage({ onComplete }: { onComplete?: () => void }) {
  const [selected, setSelected] = useState(0), [visited, setVisited] = useState<number[]>([0]);
  const choose = (index: number) => { setSelected(index); const next = [...new Set([...visited, index])]; setVisited(next); if (next.length === chain.length) onComplete?.(); };
  return <ContentBlock className="rt-strategy-compare" title="这堂课其实只回答了一条问题链" subtitle="同一只塑料瓶，连接像素、表示、深层网络、预训练与新任务。" headingLevel={1}><div className="rt-strategy-compare__body">
    <div className="rt-chain__visual"><img src={bottle} alt="贯穿课程的蓝色塑料瓶" /><div className="rt-chain__steps">{chain.map(([label], index) => <Button key={label} active={selected === index} aria-pressed={selected === index} onClick={() => choose(index)}>{label}</Button>)}</div></div>
    <section aria-live="polite"><Typography variant="h3" tone="accent">{chain[selected][0]}</Typography><Typography variant="body">{chain[selected][1]}</Typography></section>
    <div className="rt-strategy-compare__criteria"><Button variant="primary" onClick={() => choose((selected + 1) % chain.length)}>回顾下一环</Button></div>
    <Typography variant="bodySmall" tone="muted">把网络结构、已有参数和训练策略联系起来，再用独立验证比较方案。</Typography>
  </div></ContentBlock>;
}
