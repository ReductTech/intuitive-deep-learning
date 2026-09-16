import { useMemo, useState } from 'react';
import { Button, ContentBlock, FormulaBlock, FormulaTerm, NoticeStrip, Question, ValueTile, emitTelemetry } from '../../shared/react';

interface AdaGradBlockProps { onComplete?: () => void; }

const GRADIENTS = [
  { frequent: 3, sparse: 0 },
  { frequent: 2.5, sparse: 0 },
  { frequent: 3, sparse: 2 },
  { frequent: 2.5, sparse: 0 },
];
const INITIAL_ACCUMULATOR = .25;

function accumulatedSquaredGradient(round: number, key: 'frequent' | 'sparse') {
  return GRADIENTS.slice(0, round).reduce((sum, gradient) => sum + gradient[key] ** 2, INITIAL_ACCUMULATOR);
}

export function AdaGradBlock({ onComplete }: AdaGradBlockProps) {
  const [round, setRound] = useState(0);
  const values = useMemo(() => {
    const frequentHistory = accumulatedSquaredGradient(round, 'frequent');
    const sparseHistory = accumulatedSquaredGradient(round, 'sparse');
    return {
      frequentHistory,
      sparseHistory,
      frequentRate: 1 / Math.sqrt(frequentHistory),
      sparseRate: 1 / Math.sqrt(sparseHistory),
    };
  }, [round]);
  const finished = round === GRADIENTS.length;

  function advance(button: HTMLButtonElement) {
    if (finished) return;
    const nextRound = round + 1;
    setRound(nextRound);
    emitTelemetry('optimizer_history_step', button, {
      state_key: 'experiment:optimizer-adagrad-v2',
      optimizer: 'adagrad', round: nextRound,
      accumulated_squared_gradient: {
        frequent: accumulatedSquaredGradient(nextRound, 'frequent'),
        sparse: accumulatedSquaredGradient(nextRound, 'sparse'),
      },
      state: { round: nextRound },
    });
  }

  return (
    <ContentBlock className="alr-block" title="AdaGrad：每个参数拥有自己的步长" subtitle="有些特征几乎每批都出现，有些特征很少出现。AdaGrad 为每个参数分别累计梯度平方，让常更新的参数逐渐谨慎。">
      <NoticeStrip tone="orange" lead="统一学习率的难题：">频繁参数已经走过很多步，稀疏参数才偶尔收到信号；继续让两者使用同一有效步长并不公平。</NoticeStrip>
      <div className="alr-formula-grid">
        <FormulaBlock ariaLabel="AdaGrad 历史平方梯度公式"><FormulaTerm tooltip="参数自己的历史梯度平方和">G<sub>t</sub></FormulaTerm> = G<sub>t−1</sub> + g<sub>t</sub><sup>2</sup></FormulaBlock>
        <FormulaBlock ariaLabel="AdaGrad 参数更新公式" fraction={{ prefix: <>θ<sub>t+1</sub> = θ<sub>t</sub> −</>, numerator: <>η · g<sub>t</sub></>, denominator: <>√G<sub>t</sub> + ε</> }} />
      </div>

      <section className="alr-lab" aria-labelledby="alr-adagrad-title">
        <header>
          <div><span>参数账本 · {round}/{GRADIENTS.length} 批</span><h3 id="alr-adagrad-title">比较频繁特征与稀疏特征</h3></div>
          <div className="alr-lab-actions"><Button onClick={() => setRound(0)} disabled={round === 0}>清空账本</Button><Button variant="primary" hint={round === 0} disabled={finished} onClick={(event) => advance(event.currentTarget)}>{finished ? '四批已记完' : '记入下一批梯度'}</Button></div>
        </header>

        <div className="alr-gradient-stream" aria-label="四批训练中的两个参数梯度">
          {GRADIENTS.map((gradient, index) => (
            <article className={index < round ? 'is-recorded' : index === round ? 'is-next' : undefined} key={index}>
              <span>第 {index + 1} 批</span>
              <strong>频繁参数 g = {gradient.frequent}</strong>
              <strong>稀疏参数 g = {gradient.sparse}</strong>
            </article>
          ))}
        </div>

        <div className="alr-adagrad-compare">
          <article>
            <header><span>频繁特征参数</span><strong>有效 η = {values.frequentRate.toFixed(3)}</strong></header>
            <div className="alr-rate-track" aria-label={`频繁参数有效学习率 ${values.frequentRate.toFixed(3)}`}><i style={{ width: `${Math.min(100, values.frequentRate / 2 * 100)}%` }} /></div>
            <p>历史平方和 G = {values.frequentHistory.toFixed(2)}</p>
          </article>
          <article>
            <header><span>稀疏特征参数</span><strong>有效 η = {values.sparseRate.toFixed(3)}</strong></header>
            <div className="alr-rate-track is-sparse" aria-label={`稀疏参数有效学习率 ${values.sparseRate.toFixed(3)}`}><i style={{ width: `${Math.min(100, values.sparseRate / 2 * 100)}%` }} /></div>
            <p>历史平方和 G = {values.sparseHistory.toFixed(2)}</p>
          </article>
        </div>
        <div className="alr-values">
          <ValueTile tone="blue" label="频繁参数出现次数" value={String(GRADIENTS.slice(0, round).filter((item) => item.frequent !== 0).length)} />
          <ValueTile tone="orange" label="稀疏参数出现次数" value={String(GRADIENTS.slice(0, round).filter((item) => item.sparse !== 0).length)} />
          <ValueTile tone="success" label="较大有效步长" value={round < 1 ? '相同' : '稀疏参数'} />
        </div>
        <NoticeStrip tone={finished ? 'green' : 'blue'} lead={finished ? '观察结果：' : '继续记账：'}>{finished ? '频繁参数的 G 不断累积，有效学习率明显缩小；稀疏参数只在收到信号时记账，因此保留了更大的潜在步长。' : '每加入一批，观察两个参数的 G 是否以相同速度增长。'}</NoticeStrip>
      </section>

      <Question
        persistenceKey="optimizer-adagrad-sparse-v1"
        type="choice"
        title="某个参数过去频繁收到非零梯度，AdaGrad 接下来通常会怎样对待它？"
        options={[
          { key: 'A', value: 'smaller', label: '让它的有效学习率变小，后续更新更谨慎' },
          { key: 'B', value: 'larger', label: '让它的有效学习率持续变大', wrongFeedback: '历史平方和位于分母；累积越大，有效学习率越小。' },
          { key: 'C', value: 'reset', label: '每批都清空历史，重新使用全局学习率', wrongFeedback: 'AdaGrad 的关键就是保留每个参数的累计历史。' },
        ]}
        answer="smaller"
        feedback={{ correct: '正确。AdaGrad 特别适合参数更新频率差异明显的场景，但累计量只增不减也可能让后期步长过小。' }}
        onCheck={(result) => { if (result.ok) onComplete?.(); }}
      />
    </ContentBlock>
  );
}
