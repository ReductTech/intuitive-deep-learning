import { useRef, useState, type CSSProperties } from 'react';
import { Callout, ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, NoticeStrip, RangeControl } from '../../shared/react';

interface WeightRegularizationBlockProps { onComplete?: () => void; }

function NeuronPath({ weight, tone, input }: { weight: number; tone: 'large' | 'small'; input: number }) {
  const output = weight * input;
  const delta = weight * (input - 1);
  const marker = Math.max(2, Math.min(98, 50 + delta * 100));
  const verticalMarker = 100 - marker;
  const fillStart = Math.min(50, verticalMarker);
  const fillSize = Math.abs(verticalMarker - 50);
  const markerId = `fit-network-arrow-${tone}`;
  return <article className={`fit-neuron-network is-${tone}`}>
    <header><strong>{tone === 'large' ? '大权重神经元' : '小权重神经元'}</strong></header>
    <div className="ng-network-wrap ng-network-wrap--single">
      <section className="dl-network-svg-wrap" aria-label={`输入经过权重 ${weight.toFixed(2)} 进入神经元并产生输出`}>
        <svg className="dl-network-svg" viewBox="0 34 720 162" role="img">
          <defs><marker id={markerId} markerWidth="7" markerHeight="6" refX="6" refY="3" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L7,3 L0,6 Z" fill="rgba(39,68,110,0.56)" /></marker></defs>
          <foreignObject x="24" y="52" width="78" height="26"><div className="dl-network-external-label dl-network-external-label--input">输入 x</div></foreignObject>
          <line className="dl-network-line" x1="102" y1="120" x2="341" y2="120" strokeWidth={tone === 'large' ? 4.8 : 2.4} markerEnd={`url(#${markerId})`} />
          <foreignObject x="28" y="86" width="70" height="70"><div className="dl-network-node dl-network-node--input dl-network-node--compact"><b>{input.toFixed(2)}</b></div></foreignObject>
          <foreignObject x="154" y="105" width="120" height="30"><em className="dl-network-weight">权重 <b>{weight.toFixed(2)}</b></em></foreignObject>
          <line className="dl-network-line" x1="440" y1="120" x2="602" y2="120" strokeWidth="3" markerEnd={`url(#${markerId})`} />
          <foreignObject x="344" y="72" width="96" height="96"><div className="dl-network-node dl-network-node--unit"><strong>神经元</strong></div></foreignObject>
          <foreignObject x="610" y="52" width="78" height="26"><div className="dl-network-external-label dl-network-external-label--output">输出 y</div></foreignObject>
          <foreignObject x="614" y="86" width="70" height="70"><div className={`dl-network-node dl-network-node--output dl-network-node--compact${Math.abs(delta) > .001 ? ' is-changing' : ''}`}><b>{output.toFixed(2)}</b></div></foreignObject>
        </svg>
      </section>
      <div className="fit-delta-gauge" aria-label={`输出相对基准变化 ${delta.toFixed(2)}`}>
        <strong>Δy</strong>
        <span>+0.50</span>
        <div className="fit-delta-track"><i /><b style={{ '--fit-delta-top': `${fillStart}%`, '--fit-delta-size': `${fillSize}%` } as CSSProperties} /><em style={{ '--fit-delta-marker': `${verticalMarker}%` } as CSSProperties} /></div>
        <span>−0.50</span>
      </div>
    </div>
  </article>;
}

export function WeightRegularizationBlock({ onComplete }: WeightRegularizationBlockProps) {
  const [input, setInput] = useState(1);
  const [touched, setTouched] = useState(false);
  const completionReported = useRef(false);

  function changeInput(nextInput: number) {
    setInput(nextInput);
    setTouched(true);
    if (!completionReported.current) {
      completionReported.current = true;
      onComplete?.();
    }
  }

  return (
    <ContentBlock className="fit-block fit-regularization" title="使用权重正则缓解过拟合" subtitle="通过限制权重规模，让模型学习更稳定的规律。">
      <Callout
        tone="blue"
        label="为什么会影响泛化？"
        text="大权重会放大微小扰动，使模型更容易追随训练噪声；这些噪声不会在未知数据中稳定重复。"
      />
      <section className="fit-noise-lab">
        <header><strong>相同扰动，不同响应</strong><span>先看最基本的放大机制：同一个微小输入变化 Δx，经过不同权重后，会产生不同的输出变化 Δy。</span></header>
        <div className="fit-comparison-layout">
          <div className="fit-input-console">
            <div className="fit-input-readout"><span>输入 x</span><strong>{input.toFixed(2)}</strong><b>Δx {(input - 1) >= 0 ? '+' : ''}{(input - 1).toFixed(2)}</b></div>
            <RangeControl controlClassName="fit-input-control" label="轻微扰动" min="0.94" max="1.06" step="0.01" value={input} formatValue={() => null} hint={!touched} scale={['1.06', '1.00', '0.94']} style={{ '--fit-input-progress': `${(input - .94) / .12 * 100}%` } as CSSProperties} onChange={(event) => changeInput(Number(event.currentTarget.value))} />
          </div>
          <div className="fit-neuron-paths"><NeuronPath weight={.5} tone="small" input={input} /><NeuronPath weight={8} tone="large" input={input} /></div>
        </div>
      </section>

      {touched && <section className="fit-penalty-lab">
        <NoticeStrip tone="blue" lead="观察结论：">限制权重不是让模型越小越好，而是减少它追随训练集偶然细节的倾向。具体做法是在原损失中加入 L2 正则项。</NoticeStrip>
        <MathFormulaBlock ariaLabel="最佳权重等于使预测损失与 L2 正则项之和最小的权重">
          <MathFormulaTerm latex="W^{*}" tooltip="W*：训练最终找到的一组最佳权重" />
          <MathFormulaStatic latex="=" />
          <MathFormulaTerm latex="\underset{W}{\operatorname{arg\,min}}" tooltip="arg min：返回让目标值达到最小的参数，而不是只返回最小值" />
          <MathFormulaStatic latex="(" />
          <MathFormulaTerm latex="\operatorname{Loss}(y,\hat{y})" tooltip="Loss：衡量模型预测值与真实值之间的原任务损失" />
          <MathFormulaStatic latex="+" />
          <MathFormulaTerm latex="\lambda\lVert W\rVert_2^2" tooltip="λ 乘权重的 L2 范数平方：惩罚过大的权重" />
          <MathFormulaStatic latex=")" />
        </MathFormulaBlock>
        <p className="fit-l2-explanation">W* 表示训练最终找到的权重：它使预测损失与 λ‖W‖₂² 之和达到最小。</p>
      </section>}
    </ContentBlock>
  );
}
