import { useMemo, useState } from 'react';
import { Button, ContentBlock, FormulaBlock, FormulaTerm, NoticeStrip, Question, RangeControl, ValueTile, emitTelemetry } from '../../shared/react';
import { simulateBatchAndSgd, simulateMomentum, type Point2D } from '../domain/optimizerSimulation';

interface MomentumBlockProps { onComplete?: () => void; }

function plotPoints(points: Point2D[]) {
  return points.map((point) => `${320 + point.x * 48},${132 - point.y * 34}`).join(' ');
}

export function MomentumBlock({ onComplete }: MomentumBlockProps) {
  const [beta, setBeta] = useState(.8);
  const [round, setRound] = useState(1);
  const sgd = useMemo(() => simulateBatchAndSgd().stochastic, []);
  const momentum = useMemo(() => simulateMomentum(beta), [beta]);
  const finished = round === momentum.points.length - 1;
  const currentVelocity = momentum.velocities[Math.max(0, round - 1)];
  const currentPoint = momentum.points[round];

  function advance(button: HTMLButtonElement) {
    if (finished) return;
    const nextRound = round + 1;
    setRound(nextRound);
    emitTelemetry('optimizer_momentum_step', button, {
      state_key: 'experiment:optimizer-momentum-v1',
      optimizer: 'momentum', beta, step: nextRound,
      state: { beta, step: nextRound },
    });
  }

  return (
    <ContentBlock className="alr-block" title="Momentum：别被一次噪声轻易带偏" subtitle="如果相邻小批量给出相反的横向偏差，直接跟随会左右摇摆。Momentum 把近期方向合成一股“速度”。">
      <div className="alr-concept-pair">
        <section><span>当前梯度 g</span><strong>这一批样本的建议</strong><p>信息新鲜，但可能含有偶然噪声。</p></section>
        <section><span>速度 v</span><strong>近期方向的合力</strong><p>一致方向会累积；短暂反向只会让速度减弱，不一定马上掉头。</p></section>
      </div>
      <div className="alr-formula-grid">
        <FormulaBlock ariaLabel="Momentum 速度更新公式"><FormulaTerm tooltip="方向记忆，也叫速度">v<sub>t</sub></FormulaTerm> = <FormulaTerm tooltip="保留多少旧方向">β</FormulaTerm>v<sub>t−1</sub> + (1−β)g<sub>t</sub></FormulaBlock>
        <FormulaBlock ariaLabel="Momentum 参数更新公式">θ<sub>t+1</sub> = θ<sub>t</sub> − ηv<sub>t</sub></FormulaBlock>
      </div>

      <section className="alr-lab" aria-labelledby="alr-momentum-title">
        <header>
          <div><span>同一串噪声梯度 · 第 {round}/8 步</span><h3 id="alr-momentum-title">调节方向记忆强度</h3></div>
          <div className="alr-lab-actions"><Button onClick={() => setRound(1)} disabled={round === 1}>重新开始</Button><Button variant="primary" hint={round === 1} onClick={(event) => advance(event.currentTarget)} disabled={finished}>{finished ? '路线已完成' : '合成下一次速度'}</Button></div>
        </header>
        <RangeControl label="方向记忆 β" min={0} max={.95} step={.05} value={beta} digits={2} scale={['只看当前', '平衡', '更信历史']} onChange={(event) => { setBeta(Number(event.currentTarget.value)); setRound(1); }} />
        <div className="alr-route-legend" aria-hidden="true"><span className="is-sgd">SGD</span><span className="is-momentum">Momentum</span></div>
        <div className="alr-valley" role="img" aria-label={`方向记忆 beta 为 ${beta.toFixed(2)}，Momentum 与 SGD 在同一噪声序列上的路线比较`}>
          <svg viewBox="0 0 640 280" aria-hidden="true">
            <ellipse cx="320" cy="132" rx="255" ry="105" /><ellipse cx="320" cy="132" rx="180" ry="72" /><ellipse cx="320" cy="132" rx="98" ry="39" />
            <circle className="alr-target" cx="320" cy="132" r="7" />
            <polyline className="alr-route alr-route--sgd" points={plotPoints(sgd.slice(0, round + 1))} />
            <polyline className="alr-route alr-route--momentum" points={plotPoints(momentum.points.slice(0, round + 1))} />
            {sgd.slice(0, round + 1).map((point, index) => <circle className="alr-route-dot is-sgd" key={`s-${index}`} cx={320 + point.x * 48} cy={132 - point.y * 34} r="3.5" />)}
            {momentum.points.slice(0, round + 1).map((point, index) => <circle className="alr-route-dot is-momentum" key={`m-${index}`} cx={320 + point.x * 48} cy={132 - point.y * 34} r="4" />)}
          </svg>
        </div>
        <div className="alr-values">
          <ValueTile tone="blue" label="当前 β" value={beta.toFixed(2)} />
          <ValueTile tone="orange" label="速度横向分量" value={currentVelocity.x.toFixed(2)} />
          <ValueTile tone="success" label="离中心距离" value={Math.hypot(currentPoint.x, currentPoint.y).toFixed(2)} />
        </div>
        <NoticeStrip tone={beta < .3 ? 'orange' : beta > .9 ? 'orange' : 'blue'} lead="当前记忆：">{beta < .3 ? '几乎只听当前小批量，路线仍会明显摇摆。' : beta > .9 ? '历史权重很强，路线很平滑，但面对真正的方向改变也会转弯较慢。' : '近期一致方向会累积，单次反向噪声被削弱。'}</NoticeStrip>
      </section>

      <Question
        persistenceKey="optimizer-momentum-memory-v1"
        type="choice"
        title="连续几步总体向右，但某一小批量突然给出向左的梯度。Momentum 通常会怎样？"
        options={[
          { key: 'A', value: 'resist', label: '结合已有速度，先减弱向右趋势，而不是立刻全速向左' },
          { key: 'B', value: 'reverse', label: '完全丢弃历史，立刻按新梯度全速向左', wrongFeedback: '这更接近没有方向记忆的 SGD。' },
          { key: 'C', value: 'ignore-all', label: '永久忽略之后所有新梯度', wrongFeedback: 'Momentum 仍会不断加入新梯度；历史只是按 β 逐渐衰减。' },
        ]}
        answer="resist"
        feedback={{ correct: '正确。Momentum 的价值是让一致方向累积、让短暂噪声只产生有限影响。' }}
        onCheck={(result) => { if (result.ok) onComplete?.(); }}
      />
    </ContentBlock>
  );
}
