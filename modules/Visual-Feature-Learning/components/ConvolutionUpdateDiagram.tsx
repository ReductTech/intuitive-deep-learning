import { useState } from 'react';
import { Button, ContentBlock, Typography } from '../../shared/react';
import { SHARED_WINDOW_UPDATE, SINGLE_WINDOW_UPDATE, UPDATE_KERNEL, UPDATE_RATE, UPDATE_TARGET, traceKernelUpdate } from '../services/convolutionUpdateWalkthrough';
import '../pages/ConvolutionBackpropPage/ConvolutionBackpropPage.css';

const fmt = (v: number) => Number(v.toFixed(6)).toString().replace('-', '−');
const operand = (v: number) => v < 0 ? `(${fmt(v)})` : fmt(v);
const WINDOWS = ['左上', '右上', '左下', '右下'];
const TITLES = ['误差从哪里来', '把梯度传给参数', '按梯度更新参数', '更新后，损失变小了'];
const ACTIONS = ['把梯度传回卷积核', '更新整个卷积核', '看看更新效果', '重新演示'];

export function ConvolutionUpdateDiagram({ multiple }: { multiple: boolean }) {
  const [step, setStep] = useState(0);
  const [weight, setWeight] = useState(4);
  const [position, setPosition] = useState(0);
  const [probe, setProbe] = useState(false);
  const { image, before, updated, after } = multiple ? SHARED_WINDOW_UPDATE : SINGLE_WINDOW_UPDATE;
  const selectedInput = (Math.floor(position / (image.length - 2)) + Math.floor(weight / 3)) * image.length + position % (image.length - 2) + weight % 3;
  const pixel = before.patches[position][weight];
  const gradient = before.gradients[weight];
  const perturbed = traceKernelUpdate(image, UPDATE_KERNEL.map((v, i) => v + (i === weight ? 0.01 : 0)));
  const selectWeight = (index: number) => { setWeight(index); setProbe(false); };
  const advance = () => { setStep(v => (v + 1) % 4); setProbe(false); };

  return <ContentBlock className="vfl-update-page" headingLevel={1}
    title={multiple ? '图像变大：同一个核用多次' : '卷积核权重的梯度更新'}
    subtitle={multiple ? '各个位置传回的梯度相加，再更新同一个卷积核。' : '根据分类损失对各权重的梯度，按梯度下降规则更新 3 × 3 卷积核。'}
    bodyClassName="vfl-update-body">
    <div className="vfl-update-workspace">
      <section className="vfl-update-reference" aria-label="选择要观察的卷积核参数">
        <div className="vfl-update-matrices">
          <div className="vfl-update-node">
            <Typography as="h2" variant="h3">输入图像</Typography>
            <div className="vfl-update-image" style={{ gridTemplateColumns: `repeat(${image.length}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${image.length}, minmax(0, 1fr))` }}>
              {image.flat().map((v, i) => <Typography as="span" variant="body" key={i} className={selectedInput === i ? 'is-focus' : ''}>{v}</Typography>)}
              {multiple && <div className="vfl-update-window" style={{ left: `${position % 2 * 25}%`, top: `${Math.floor(position / 2) * 25}%` }} />}
            </div>
          </div>
          <div className="vfl-update-node">
            <Typography as="h2" variant="h3">{step >= 2 ? '更新后的卷积核' : '卷积核'}</Typography>
            <div className={`vfl-update-kernel ${step >= 2 ? 'is-updated' : ''}`}>
              {(step >= 2 ? updated : UPDATE_KERNEL).map((v, i) => <Button key={i} aria-pressed={weight === i} className={weight === i ? 'is-focus' : ''} aria-label={`选择第 ${Math.floor(i / 3) + 1} 行第 ${i % 3 + 1} 列参数`} onClick={() => selectWeight(i)}><Typography as="span" variant="body" tone="inherit">{fmt(v)}</Typography></Button>)}
            </div>
          </div>
        </div>
        <Typography variant="bodySmall" tone="muted">点击参数，橙色格子跟着变。</Typography>
        {multiple && <Button onClick={() => setPosition(v => (v + 1) % 4)}><Typography as="span" variant="bodySmall" tone="inherit">移动窗口 · 当前{WINDOWS[position]}</Typography></Button>}
        <div className="vfl-update-known">
          <div><Typography variant="bodySmall" tone="muted">已知预测</Typography><Typography variant="h2" tone="accent">{fmt(before.prediction)}</Typography></div>
          <div><Typography variant="bodySmall" tone="muted">目标</Typography><Typography variant="h2" tone="success">{UPDATE_TARGET}</Typography></div>
        </div>
      </section>
      <section className="vfl-update-explanation" aria-live="polite" aria-label={TITLES[step]}>
        <Typography as="h2" variant="h2" tone="accent">{TITLES[step]}</Typography>
        {step === 0 && <>
          <Typography variant="body">预测偏低，损失会要求它增大。</Typography>
          <div className="vfl-update-large-equation"><Typography variant="h1">{fmt(before.prediction)} − {UPDATE_TARGET} = <Typography as="span" variant="h1" tone="warning">{fmt(before.delta)}</Typography></Typography></div>
          <Typography variant="body" tone="warning">这是损失对预测的梯度，接下来把它传回参数。</Typography>
          {multiple && <Typography variant="bodySmall" tone="muted">预测是四个输出之和，所以 {fmt(before.delta)} 原样传给每个输出。</Typography>}
          <Typography variant="bodySmall" tone="muted">本例：L = ½(预测 − 目标)²，因此 ∂L/∂预测 = 预测 − 目标。</Typography>
        </>}
        {step === 1 && <>
          <div className="vfl-update-gradient-equation">
            <div><Typography variant="bodySmall" tone="muted">传回的梯度</Typography><Typography variant="h1">{fmt(before.delta)}</Typography></div>
            <Typography variant="h2" tone="muted">×</Typography>
            <div><Typography variant="bodySmall" tone="muted">对应像素</Typography><Typography variant="h1" tone="warning">{pixel}</Typography></div>
            <Typography variant="h2" tone="muted">=</Typography>
            <div><Typography variant="bodySmall" tone="muted">{multiple ? '这个位置的贡献' : '参数的梯度'}</Typography><Typography variant="h1" tone="warning">{fmt(before.contributions[weight][position])}</Typography></div>
          </div>
          {multiple && <div className="vfl-update-contributions">{before.contributions[weight].map((term, i) => <Button key={i} aria-pressed={position === i} className={position === i ? 'is-focus' : ''} onClick={() => setPosition(i)}><Typography as="span" variant="bodySmall" tone="inherit">{WINDOWS[i]}：{fmt(term)}</Typography></Button>)}<Typography variant="body" tone="warning">相加，得到参数的梯度：{fmt(gradient)}</Typography></div>}
          <Typography variant="body">{gradient === 0 ? '对应像素全是 0，这个参数不影响预测，梯度也是 0。' : multiple ? '同一个参数影响多个输出，各个位置传回的贡献要相加。' : '像素是 1：参数增加多少，预测就增加多少。'}</Typography>
          <Button className="vfl-update-probe" aria-pressed={probe} onClick={() => setProbe(v => !v)}><Typography as="span" variant="bodySmall" tone="inherit">{probe ? '撤回试调' : '试着把这个参数增加 0.01'}</Typography></Button>
          <div className="vfl-update-probe-result"><Typography variant="body" tone={probe ? 'success' : 'muted'}>{probe ? `预测 ${fmt(before.prediction)} → ${fmt(perturbed.prediction)}，损失 ${fmt(before.loss)} → ${fmt(perturbed.loss)}` : '点一下，看看预测和损失怎样变化。'}</Typography></div>
          <Typography variant="bodySmall" tone="warning">{gradient < 0 ? '负梯度：增大这个参数，损失会下降。' : '零梯度：这次保持参数不变。'}</Typography>
        </>}
        {step === 2 && <>
          <Typography variant="body">新参数 = 旧参数 − 学习率 × 梯度</Typography>
          <div className="vfl-update-large-equation"><Typography variant="h2">{fmt(UPDATE_KERNEL[weight])} − {UPDATE_RATE} × {operand(gradient)} = <Typography as="span" variant="h2" tone="success">{fmt(updated[weight])}</Typography></Typography></div>
          <Typography variant="body" tone="success">{gradient < 0 ? `减去负数，参数从 ${fmt(UPDATE_KERNEL[weight])} 增大到 ${fmt(updated[weight])}。` : '梯度是 0，这个参数保持不变。'}</Typography>
          <Typography variant="bodySmall" tone="muted">九个参数各用自己的梯度更新。点击其他格子，查看它的计算。</Typography>
        </>}
        {step === 3 && <>
          <div className="vfl-update-validation">
            <div><Typography variant="bodySmall" tone="muted">预测，更接近目标 1</Typography><Typography variant="h1" tone="success">{fmt(before.prediction)} → {fmt(after.prediction)}</Typography></div>
            <div><Typography variant="bodySmall" tone="muted">损失，更小</Typography><Typography variant="h1" tone="success">{fmt(before.loss)} → {fmt(after.loss)}</Typography></div>
          </div>
          <Typography variant="body">误差传回参数，参数按梯度调整，预测就更接近目标。</Typography>
          <Typography variant="bodySmall" tone="muted">输入图像没变，改变的是卷积核的参数。</Typography>
        </>}
      </section>
    </div>
    <footer className="vfl-update-controls">
      <Button disabled={step === 0} onClick={() => { setStep(v => v - 1); setProbe(false); }}><Typography as="span" variant="body" tone="inherit">上一步</Typography></Button>
      <Button className="vfl-update-primary" onClick={advance}><Typography as="span" variant="body" tone="inherit">{ACTIONS[step]}</Typography></Button>
    </footer>
  </ContentBlock>;
}
