import { useState } from 'react';
import { ContentBlock, NoticeStrip, Question, RangeControl } from '../../shared/react';

interface HyperparameterOverviewBlockProps { onComplete?: () => void; }

type SliderRow = {
  id: string;
  abbr: string;
  name: string;
  effect: string;
  min: number;
  max: number;
  step: number;
  initial: number;
  format: (value: number) => string;
  low: string;
  middle: string;
  high: string;
};

const rows: SliderRow[] = [
  { id: 'lr', abbr: 'lr', name: '学习率', effect: '决定模型每次学习调整的幅度。', min: 0.00001, max: 0.1, step: 0.00001, initial: 0.001, format: (value) => value.toExponential(0), low: '更新更谨慎，训练通常更稳定。', middle: '调整幅度与稳定性相对平衡。', high: '更新更激进，可能出现震荡。' },
  { id: 'bs', abbr: 'bs', name: 'Batch Size', effect: '决定一次参数更新使用多少训练样本。', min: 8, max: 2048, step: 8, initial: 128, format: (value) => String(Math.round(value)), low: '梯度波动更明显，但显存占用更低。', middle: '稳定性与显存占用相对平衡。', high: '梯度更加稳定，但需要更多显存。' },
  { id: 'epoch', abbr: 'epoch', name: '训练轮数', effect: '决定模型重复学习训练数据的次数。', min: 1, max: 200, step: 1, initial: 40, format: (value) => String(Math.round(value)), low: '可能还没有充分学习。', middle: '需要结合验证结果继续判断。', high: '可能逐渐记忆训练数据。' },
  { id: 'wd', abbr: 'wd', name: '权重衰减', effect: '限制模型复杂程度，帮助减少过拟合。', min: 0, max: 0.1, step: 0.001, initial: 0.01, format: (value) => value.toFixed(3), low: '约束较弱，可能过拟合。', middle: '约束程度相对平衡。', high: '约束较强，可能学习不足。' },
  { id: 'dropout', abbr: 'dropout', name: '随机失活率', effect: '训练时暂时忽略部分神经元，减少模型只记住训练数据的机会。', min: 0, max: 0.5, step: 0.01, initial: 0.1, format: (value) => value.toFixed(2), low: '限制较少，模型更容易记住训练数据。', middle: '限制程度相对平衡。', high: '限制更多，但模型可能学习不足。' },
  { id: 'clip', abbr: 'clip', name: '梯度裁剪阈值', effect: '限制一次调整不能突然太大，帮助训练保持稳定。', min: 0.5, max: 5, step: 0.1, initial: 1, format: (value) => value.toFixed(1), low: '限制更严格，可能让学习变慢。', middle: '对异常调整保持适度限制。', high: '限制更少，出现异常调整的风险更高。' },
  { id: 'channels', abbr: 'c', name: '通道数', effect: '决定每一层能学习多少种特征。', min: 16, max: 1024, step: 16, initial: 128, format: (value) => String(Math.round(value)), low: '能学习的特征较少，计算也较省。', middle: '学习能力与计算量相对平衡。', high: '能学习更多特征，但需要更多计算。' },
  { id: 'dim', abbr: 'dim', name: '隐藏维度', effect: '决定模型内部每一步可以保留多少信息。', min: 128, max: 4096, step: 128, initial: 768, format: (value) => String(Math.round(value)), low: '可保留的信息较少，计算也较省。', middle: '信息容量与计算量相对平衡。', high: '可保留更多信息，但计算更重。' },
  { id: 'warmup', abbr: 'warmup', name: '学习率预热步数/比例', effect: '让训练一开始先小步调整，再逐渐加快。', min: 0, max: 10, step: 0.5, initial: 2, format: (value) => `${value.toFixed(1)}%`, low: '更快开始正常速度的学习。', middle: '起步速度与稳定性相对平衡。', high: '训练起步更稳，但进入正常速度更晚。' },
];

const PARAMETERS_PER_PAGE = 4;

function interpretation(row: SliderRow, value: number) {
  const position = (value - row.min) / (row.max - row.min);
  if (position < .34) return row.low;
  if (position > .66) return row.high;
  return row.middle;
}

function valueBand(row: SliderRow, value: number) {
  const position = (value - row.min) / (row.max - row.min);
  if (position < .34) return 'low';
  if (position > .66) return 'high';
  return 'middle';
}

export function HyperparameterOverviewBlock({ onComplete }: HyperparameterOverviewBlockProps) {
  const [values, setValues] = useState<Record<string, number>>(() => Object.fromEntries(rows.map((row) => [row.id, row.initial])));
  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(rows.length / PARAMETERS_PER_PAGE);
  const pageStart = page * PARAMETERS_PER_PAGE;
  const visibleRows = rows.slice(pageStart, pageStart + PARAMETERS_PER_PAGE);

  return (
    <ContentBlock className="hp-block" title="模型学习什么，我们决定什么" subtitle="模型训练过程中，有些量会自动更新，有些量需要我们提前选择。">
      <div className="ds-parameter-compare">
        <section><span>参数 Parameters</span><strong>模型从数据中学习</strong><p>例如权重、偏置，通过训练过程不断调整。</p></section>
        <section><span>超参数 Hyperparameters</span><strong>训练开始前需要设定</strong><p>例如学习率、训练轮数、模型结构，它们决定模型如何学习。</p></section>
      </div>
      <section className="ds-parameter-table-section">
        <header className="ds-parameter-table-head">
          <div><h3>改变训练规则，模型会发生什么？</h3><p>拖动滑杆，看看不同选择可能怎样影响训练过程。</p></div>
          <nav className="ds-parameter-pagination" aria-label="超参数分页">
            <span>{page + 1} / {pageCount}</span>
            <span className="ds-parameter-page-tabs" role="tablist" aria-label="超参数页组">
              {Array.from({ length: pageCount }, (_, index) => (
                <button
                  className={index === page ? 'is-current' : undefined}
                  type="button"
                  role="tab"
                  aria-label={`查看第 ${index + 1} 页超参数`}
                  aria-selected={index === page}
                  key={index}
                  onClick={() => setPage(index)}
                ><span aria-hidden="true" /></button>
              ))}
            </span>
          </nav>
        </header>
        <div className="ds-parameter-list" key={page}>
          {visibleRows.map((row) => {
            const value = values[row.id] ?? row.initial;
            return <article className="ds-parameter-row" key={row.id}>
              <header className="ds-param-identity"><code>{row.abbr}</code><strong>{row.name}</strong></header>
              <p className="ds-param-effect">{row.effect}</p>
              <div className="ds-param-control"><RangeControl label="取值倾向" aria-label={`${row.name}取值倾向`} min={row.min} max={row.max} step={row.step} value={value} scale={['较小', '较大']} formatValue={() => valueBand(row, value) === 'low' ? '较小' : valueBand(row, value) === 'high' ? '较大' : '适中'} onChange={(event) => { const nextValue = Number(event.currentTarget.value); setValues((current) => ({ ...current, [row.id]: nextValue })); }} /></div>
              <NoticeStrip tone="blue" className="ds-param-reading" lead="当前倾向：">{interpretation(row, value)}</NoticeStrip>
            </article>;
          })}
        </div>
        <NoticeStrip tone="blue" lead="记住：">这些是常见趋势；真正合适的取值，要靠实验结果来比较。</NoticeStrip>
      </section>
      <Question
        persistenceKey="hyperparameter-definition-v4"
        type="choice"
        title="哪一句最能说明超参数和模型参数的区别？"
        options={[
          { key: 'A', value: 'configured', label: '由我们提前设定或通过实验选择，用来决定训练方式或模型结构；不会由训练过程自动学出来' },
          { key: 'B', value: 'gradient', label: '由训练数据决定，并在反向传播中随梯度不断更新的量', wrongFeedback: '这是模型参数，例如权重和偏置；它们由梯度直接更新。' },
          { key: 'C', value: 'metric', label: '不参与梯度更新，用来衡量模型训练效果的所有数值，例如准确率和损失', wrongFeedback: '这是评价指标；指标描述表现，但不负责配置训练过程或模型结构。' },
          { key: 'D', value: 'validation', label: '由验证集在训练结束后自动计算，并直接写入模型作为最终参数的配置', wrongFeedback: '验证集用于比较超参数方案，不会自动生成配置或把它写成模型参数。' },
        ]}
        answer="configured"
        feedback={{ correct: '正确。超参数需要在训练前决定，再根据实验结果比较哪个组合更合适。', wrong: '超参数由我们设定或通过实验选择，用来决定训练过程或模型结构。' }}
        onCheck={(result) => { if (result.ok) onComplete?.(); }}
      />
    </ContentBlock>
  );
}
