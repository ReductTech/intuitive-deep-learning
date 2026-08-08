import { useMemo, useState } from 'react';
import { Button, ContentBlock, FormulaBlock, NoticeStrip, Question, ValueTile, emitTelemetry } from '../../shared/react';
import { buildAdamRecords } from '../domain/optimizerSimulation';

interface AdamBlockProps { onComplete?: () => void; }

const GRADIENTS = [4, -2, 3, -1, 2, -.5];

function signed(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}`;
}

export function AdamBlock({ onComplete }: AdamBlockProps) {
  const records = useMemo(() => buildAdamRecords(GRADIENTS), []);
  const [round, setRound] = useState(0);
  const finished = round === records.length;
  const current = round > 0 ? records[round - 1] : null;

  function advance(button: HTMLButtonElement) {
    if (finished) return;
    const nextRound = round + 1;
    const record = records[nextRound - 1];
    setRound(nextRound);
    emitTelemetry('optimizer_adam_step', button, {
      state_key: 'experiment:optimizer-adam-v2',
      optimizer: 'adam', step: nextRound,
      gradient: record.gradient,
      first_moment: record.correctedFirstMoment,
      second_moment: record.correctedSecondMoment,
      update: record.update,
      state: { step: nextRound },
    });
  }

  return (
    <ContentBlock className="alr-block" title="Adam：同时记住方向与尺度" subtitle="Momentum 处理方向噪声，AdaGrad 处理不同参数的步长。Adam 用两种会逐渐淡忘旧信息的移动平均，把两条思路组合起来。">
      <div className="alr-concept-pair">
        <section><span>一阶矩 m</span><strong>近期梯度的方向趋势</strong><p>对应 Momentum 思想：削弱单次反向噪声。</p></section>
        <section><span>二阶矩 v</span><strong>近期梯度的平方尺度</strong><p>对应 AdaGrad 思想：为每个参数缩放有效步长。</p></section>
      </div>
      <div className="alr-formula-grid alr-formula-grid--adam">
        <FormulaBlock ariaLabel="Adam 一阶矩公式">m<sub>t</sub> = β<sub>1</sub>m<sub>t−1</sub> + (1−β<sub>1</sub>)g<sub>t</sub></FormulaBlock>
        <FormulaBlock ariaLabel="Adam 二阶矩公式">v<sub>t</sub> = β<sub>2</sub>v<sub>t−1</sub> + (1−β<sub>2</sub>)g<sub>t</sub><sup>2</sup></FormulaBlock>
        <FormulaBlock ariaLabel="Adam 参数更新公式" fraction={{ prefix: <>θ<sub>t+1</sub> = θ<sub>t</sub> − η</>, numerator: <>m̂<sub>t</sub></>, denominator: <>√v̂<sub>t</sub> + ε</> }} />
      </div>
      <NoticeStrip tone="blue" lead="为什么有帽子：">训练刚开始时历史很短，m 和 v 会偏小；m̂、v̂ 用偏差修正补偿这段冷启动。判断机制时，仍可把它记成“方向趋势 ÷ 梯度尺度”。</NoticeStrip>

      <section className="alr-lab" aria-labelledby="alr-adam-title">
        <header>
          <div><span>噪声梯度序列 · {round}/{records.length}</span><h3 id="alr-adam-title">梯度突然反向时，比较两种记忆</h3></div>
          <div className="alr-lab-actions"><Button onClick={() => setRound(0)} disabled={round === 0}>重新开始</Button><Button variant="primary" hint={round === 0} disabled={finished} onClick={(event) => advance(event.currentTarget)}>{finished ? '序列已处理' : '处理下一个梯度'}</Button></div>
        </header>
        <div className="alr-adam-chart" role="img" aria-label="逐步比较原始梯度、Adam 一阶矩和缩放后的更新量">
          <header><span>步数</span><span>原始梯度 g</span><span>方向记忆 m̂</span><span>实际更新量</span></header>
          {records.map((record, index) => (
            <article className={index < round ? 'is-visible' : undefined} key={index}>
              <b>{index + 1}</b>
              <div className={record.gradient < 0 ? 'is-negative' : undefined}><i style={{ width: `${Math.abs(record.gradient) / 4 * 100}%` }} /><strong>{signed(record.gradient)}</strong></div>
              <div className={record.correctedFirstMoment < 0 ? 'is-negative' : undefined}><i style={{ width: `${Math.min(100, Math.abs(record.correctedFirstMoment) / 4 * 100)}%` }} /><strong>{signed(record.correctedFirstMoment)}</strong></div>
              <code>{signed(record.update)}</code>
            </article>
          ))}
        </div>
        <div className="alr-values">
          <ValueTile tone="orange" label="当前梯度" value={current ? signed(current.gradient) : '—'} />
          <ValueTile tone="blue" label="方向记忆 m̂" value={current ? signed(current.correctedFirstMoment) : '—'} />
          <ValueTile tone="success" label="缩放后更新量" value={current ? signed(current.update) : '—'} />
        </div>
        <NoticeStrip tone={finished ? 'green' : 'orange'} lead={finished ? '观察结果：' : '先看第 2 步：'}>{finished ? '原始梯度多次短暂反向，一阶矩仍保留主要趋势；二阶矩同时把不同大小的梯度压到较稳定的更新尺度。' : current ? `当前 g=${signed(current.gradient)}，综合历史后的 m̂=${signed(current.correctedFirstMoment)}，再除以梯度尺度后实际更新为 ${signed(current.update)}。` : '第 2 个梯度会突然反向。处理它，观察 Adam 是否立刻全速掉头。'}</NoticeStrip>
      </section>

      <div className="alr-summary-grid" aria-label="四种优化方法的适用线索">
        <article><span>SGD</span><strong>基础且直接</strong><p>接受随机小批量带来的摇摆。</p></article>
        <article><span>Momentum</span><strong>方向噪声明显</strong><p>用速度平滑近期方向。</p></article>
        <article><span>AdaGrad</span><strong>稀疏特征明显</strong><p>按参数累计历史并缩放步长。</p></article>
        <article><span>Adam</span><strong>两类问题并存</strong><p>同时维护方向趋势与梯度尺度。</p></article>
      </div>

      <Question
        persistenceKey="optimizer-final-transfer-v1"
        type="multiple"
        multiple
        title="哪些“训练现象 → 优化器思想”的对应是合理的？（多选）"
        options={[
          { key: 'A', value: 'momentum', label: '小批量噪声让方向反复摇摆 → 用 Momentum 汇总近期方向', missedFeedback: 'Momentum 正是通过方向记忆削弱短暂噪声。' },
          { key: 'B', value: 'adagrad', label: '稀疏特征与常见特征更新频率差异大 → 用 AdaGrad 分别缩放参数步长', missedFeedback: 'AdaGrad 为每个参数维护独立的平方梯度历史。' },
          { key: 'C', value: 'adam', label: '既有方向噪声，又有不同参数的尺度差异 → 用 Adam 组合两类记忆', missedFeedback: 'Adam 的 m 管方向趋势，v 管梯度尺度。' },
          { key: 'D', value: 'guarantee', label: '只要使用 Adam，就能保证任何任务找到全局最优解', wrongFeedback: 'Adam 仍受目标函数、初始值、数据和超参数影响，不保证全局最优。' },
        ]}
        answer={['momentum', 'adagrad', 'adam']}
        feedback={{ correct: '判断正确。你已经能从训练现象反推需要哪一种更新机制，而不只是记住算法名称。' }}
        onCheck={(result) => { if (result.ok) onComplete?.(); }}
      />
    </ContentBlock>
  );
}
