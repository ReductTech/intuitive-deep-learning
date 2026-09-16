import { useMemo, useState } from 'react';
import { Button, ContentBlock, FormulaBlock, FormulaTerm, NoticeStrip, Question, ValueTile, emitTelemetry } from '../../shared/react';
import { simulateBatchAndSgd, type Point2D } from '../domain/optimizerSimulation';

interface SgdBlockProps { onComplete?: () => void; }

function plotPoints(points: Point2D[]) {
  return points.map((point) => `${320 + point.x * 48},${132 - point.y * 34}`).join(' ');
}

export function SgdBlock({ onComplete }: SgdBlockProps) {
  const routes = useMemo(() => simulateBatchAndSgd(), []);
  const [round, setRound] = useState(1);
  const finished = round === routes.stochastic.length - 1;
  const batchPoint = routes.batch[round];
  const sgdPoint = routes.stochastic[round];

  function advance(button: HTMLButtonElement) {
    if (finished) return;
    const nextRound = round + 1;
    setRound(nextRound);
    emitTelemetry('optimizer_step', button, {
      state_key: 'experiment:optimizer-sgd-route-v1',
      optimizer: 'sgd',
      step: nextRound,
      state: { step: nextRound },
    });
  }

  return (
    <ContentBlock className="alr-block" title="SGD：用一小批样本估计方向" subtitle="全量梯度更平滑，但每一步要读完整个数据集；SGD 用随机小批量换取更便宜、更频繁的更新。">
      <div className="alr-concept-pair">
        <section><span>Full Batch</span><strong>方向稳定，每步昂贵</strong><p>把所有样本的梯度平均后再更新一次。</p></section>
        <section><span>SGD / Mini-batch</span><strong>方向有噪声，每步便宜</strong><p>随机抽取一小批样本；单步会摇摆，长期仍朝低损失区域前进。</p></section>
      </div>
      <FormulaBlock ariaLabel="随机梯度下降更新公式">
        <FormulaTerm tooltip="下一步参数">θ<sub>t+1</sub></FormulaTerm>
        {' = '}
        <FormulaTerm tooltip="当前参数">θ<sub>t</sub></FormulaTerm>
        {' − η · '}
        <FormulaTerm tooltip="由当前随机小批量估计出的梯度">g<sub>mini-batch</sub></FormulaTerm>
      </FormulaBlock>

      <section className="alr-lab" aria-labelledby="alr-sgd-route-title">
        <header>
          <div><span>同一起点 · 第 {round}/8 步</span><h3 id="alr-sgd-route-title">比较平滑路线与蛇形路线</h3></div>
          <div className="alr-lab-actions">
            <Button onClick={() => setRound(1)} disabled={round === 1}>重新开始</Button>
            <Button variant="primary" hint={round === 1} onClick={(event) => advance(event.currentTarget)} disabled={finished}>{finished ? '路线已完成' : '读取下一小批'}</Button>
          </div>
        </header>
        <div className="alr-route-legend" aria-hidden="true"><span className="is-batch">Full Batch</span><span className="is-sgd">SGD</span></div>
        <div className="alr-valley" role="img" aria-label={`第 ${round} 步时，全量梯度路线平滑，SGD 路线因随机小批量左右摇摆`}>
          <svg viewBox="0 0 640 280" aria-hidden="true">
            <ellipse cx="320" cy="132" rx="255" ry="105" />
            <ellipse cx="320" cy="132" rx="180" ry="72" />
            <ellipse cx="320" cy="132" rx="98" ry="39" />
            <circle className="alr-target" cx="320" cy="132" r="7" />
            <polyline className="alr-route alr-route--batch" points={plotPoints(routes.batch.slice(0, round + 1))} />
            <polyline className="alr-route alr-route--sgd" points={plotPoints(routes.stochastic.slice(0, round + 1))} />
            {routes.batch.slice(0, round + 1).map((point, index) => <circle className="alr-route-dot is-batch" key={`b-${index}`} cx={320 + point.x * 48} cy={132 - point.y * 34} r="4" />)}
            {routes.stochastic.slice(0, round + 1).map((point, index) => <circle className="alr-route-dot is-sgd" key={`s-${index}`} cx={320 + point.x * 48} cy={132 - point.y * 34} r="4" />)}
          </svg>
        </div>
        <div className="alr-values">
          <ValueTile tone="blue" label="Full Batch 距中心" value={Math.hypot(batchPoint.x, batchPoint.y).toFixed(2)} />
          <ValueTile tone="orange" label="SGD 距中心" value={Math.hypot(sgdPoint.x, sgdPoint.y).toFixed(2)} />
          <ValueTile tone="success" label="SGD 单步成本" value="更低" />
        </div>
        <NoticeStrip tone={finished ? 'green' : 'blue'} lead={finished ? '观察结果：' : '继续观察：'}>
          {finished ? 'SGD 的每一步不完全指向中心，却用低成本更新逐渐接近低损失区域；蛇形不是算法失灵，而是随机采样留下的噪声。' : '橙色路线会随每一小批样本左右偏转。继续推进，观察长期方向。'}
        </NoticeStrip>
      </section>

      <Question
        persistenceKey="optimizer-sgd-sampling-v1"
        type="choice"
        title="看到 SGD 路线左右摇摆，最合理的解释是什么？"
        options={[
          { key: 'A', value: 'sampling', label: '每个小批量只近似整体梯度，单步含噪声但更新更便宜' },
          { key: 'B', value: 'wrong', label: '只要路线不平滑，就说明梯度方向算错了', wrongFeedback: '随机小批量的梯度本来就是整体方向的有噪声估计。' },
          { key: 'C', value: 'random', label: 'SGD 完全随机移动，与损失梯度没有关系', wrongFeedback: '随机的是样本选择；更新方向仍由这批样本的梯度决定。' },
        ]}
        answer="sampling"
        feedback={{ correct: '正确。SGD 用带噪声但便宜的梯度估计，换取更频繁的参数更新。' }}
        onCheck={(result) => { if (result.ok) onComplete?.(); }}
      />
    </ContentBlock>
  );
}
