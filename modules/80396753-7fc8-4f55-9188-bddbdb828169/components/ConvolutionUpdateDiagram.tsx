import { useState } from 'react';
import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
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

  return <ContentBlock shuku-edit-id="e-a0328f9c-232b-4a08-9512-9b29f38df7ef" className="vfl-update-page" headingLevel={1}
    title={multiple ? '图像变大：同一个核用多次' : '卷积核权重的梯度更新'}
    subtitle={multiple ? '各个位置传回的梯度相加，再更新同一个卷积核。' : '根据分类损失对各权重的梯度，按梯度下降规则更新 3 × 3 卷积核。'}
    bodyClassName="vfl-update-body">
    <div shuku-edit-id="e-50ec4f65-4d33-4012-affc-5e3dd84df9e7" className="vfl-update-workspace">
      <section shuku-edit-id="e-d1dc4b8c-844e-4d66-8b42-33551534602d" className="vfl-update-reference" aria-label="选择要观察的卷积核参数">
        <div shuku-edit-id="e-ece2466a-c8fc-4175-9068-84bc1f3af1cf" className="vfl-update-matrices">
          <div shuku-edit-id="e-ea1466e6-3ab4-41ba-9bf3-fb35646309f8" className="vfl-update-node">
            <Typography shuku-edit-id="e-61d62fd2-b754-4843-8354-ea78f78f9964" as="h2" variant="h3">输入图像</Typography>
            <div shuku-edit-id="e-3a5ee726-d3ff-4d3d-ad91-3e07a5e5ad48" className="vfl-update-image" style={{ gridTemplateColumns: `repeat(${image.length}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${image.length}, minmax(0, 1fr))` }}>
              {image.flat().map((v, i) => <Typography shuku-edit-id="e-6adafa7a-abea-48c5-affd-4a4073f00502" as="span" variant="body" key={i} className={selectedInput === i ? 'is-focus' : ''}>{v}</Typography>)}
              {multiple && <div shuku-edit-id="e-ecfd55d8-e8e9-4add-918d-d5469ed920db" className="vfl-update-window" style={{ left: `${position % 2 * 25}%`, top: `${Math.floor(position / 2) * 25}%` }} />}
            </div>
          </div>
          <div shuku-edit-id="e-b1a4d355-061c-4d21-8f5d-05746919da71" className="vfl-update-node">
            <Typography shuku-edit-id="e-0dc4a566-05e1-4313-aa0d-36c2981bc5c9" as="h2" variant="h3">{step >= 2 ? '更新后的卷积核' : '卷积核'}</Typography>
            <div shuku-edit-id="e-4c7239cd-baf0-4c33-ab89-160803a0097e" className={`vfl-update-kernel ${step >= 2 ? 'is-updated' : ''}`}>
              {(step >= 2 ? updated : UPDATE_KERNEL).map((v, i) => <Button key={i} aria-pressed={weight === i} className={weight === i ? 'is-focus' : ''} aria-label={`选择第 ${Math.floor(i / 3) + 1} 行第 ${i % 3 + 1} 列参数`} onClick={() => selectWeight(i)}><Typography shuku-edit-id="e-6097cf20-e1f5-4f8a-ba4b-db1330057315" as="span" variant="body" tone="inherit">{fmt(v)}</Typography></Button>)}
            </div>
          </div>
        </div>
        <Typography shuku-edit-id="e-e11ad209-5aa2-4813-a53d-37ff897f6fcb" variant="bodySmall" tone="muted">点击参数，橙色格子跟着变。</Typography>
        {multiple && <Button onClick={() => setPosition(v => (v + 1) % 4)}><Typography shuku-edit-id="e-b61a3d20-e71b-4e8c-82c0-48097bac66e6" as="span" variant="bodySmall" tone="inherit">移动窗口 · 当前{WINDOWS[position]}</Typography></Button>}
        <div shuku-edit-id="e-414bd72b-c864-4684-baf8-4d41cc1b2196" className="vfl-update-known">
          <div shuku-edit-id="e-b391e282-7cc1-4e95-b75d-1224860495bd"><Typography shuku-edit-id="e-bb75f634-c78b-4a4f-85f0-f430344294f5" variant="bodySmall" tone="muted">已知预测</Typography><Typography shuku-edit-id="e-cd3798c2-329a-468a-801f-7b21b72f5393" variant="h2" tone="accent">{fmt(before.prediction)}</Typography></div>
          <div shuku-edit-id="e-0419659b-a5da-4a01-87c5-237fa79bc761"><Typography shuku-edit-id="e-a5dd9dad-cafd-40b6-9145-6bb518e704ab" variant="bodySmall" tone="muted">目标</Typography><Typography shuku-edit-id="e-4a3b3f59-649d-4c00-9ed6-d5755b7d1c13" variant="h2" tone="success">{UPDATE_TARGET}</Typography></div>
        </div>
      </section>
      <section shuku-edit-id="e-01263f52-52dc-4122-93b2-03e690d310b6" className="vfl-update-explanation" aria-live="polite" aria-label={TITLES[step]}>
        <Typography shuku-edit-id="e-d681afe5-d94d-4daa-a0bf-068e11dec2cb" as="h2" variant="h2" tone="accent">{TITLES[step]}</Typography>
        {step === 0 && <>
          <Typography shuku-edit-id="e-0e435985-37e8-4df5-b94d-f103eda4e5dd" variant="body">预测偏低，损失会要求它增大。</Typography>
          <div shuku-edit-id="e-0bac7972-dc02-4295-8f2b-ef5c41ce9788" className="vfl-update-large-equation"><Typography shuku-edit-id="e-8c1a29f3-9c81-4461-b985-7fae0bcef539" variant="h1">{fmt(before.prediction)} − {UPDATE_TARGET} = <Typography shuku-edit-id="e-e55bda4c-b82b-48a4-a3a9-1275500495b5" as="span" variant="h1" tone="warning">{fmt(before.delta)}</Typography></Typography></div>
          <Typography shuku-edit-id="e-4d5eea8b-deaf-428d-bfa4-e7fcb3baab2a" variant="body" tone="warning">这是损失对预测的梯度，接下来把它传回参数。</Typography>
          {multiple && <Typography shuku-edit-id="e-53da593b-8aa9-43c5-890c-bc9d0ba584d7" variant="bodySmall" tone="muted">预测是四个输出之和，所以 {fmt(before.delta)} 原样传给每个输出。</Typography>}
          <Typography shuku-edit-id="e-513fd62b-22c7-4a97-80a9-4678226a5e15" variant="bodySmall" tone="muted">本例：L = ½(预测 − 目标)²，因此 ∂L/∂预测 = 预测 − 目标。</Typography>
        </>}
        {step === 1 && <>
          <div shuku-edit-id="e-ac89032d-d920-42cd-b87e-b98c86c606d4" className="vfl-update-gradient-equation">
            <div shuku-edit-id="e-d0c3e9cd-b308-4aae-86d2-a344e88d5db3"><Typography shuku-edit-id="e-8695bc79-7043-46ac-b982-8e2eade9f538" variant="bodySmall" tone="muted">传回的梯度</Typography><Typography shuku-edit-id="e-2e45ff18-569d-40bd-8f36-5ec98a4777ae" variant="h1">{fmt(before.delta)}</Typography></div>
            <Typography shuku-edit-id="e-713b6a75-06bb-410b-98cb-f2b3ad7c9944" variant="h2" tone="muted">×</Typography>
            <div shuku-edit-id="e-a0efcfea-4642-41b1-808a-4f44b5adda06"><Typography shuku-edit-id="e-c4a726dd-39f6-4b42-961d-cacd50b1bf99" variant="bodySmall" tone="muted">对应像素</Typography><Typography shuku-edit-id="e-d522c9e9-cb7f-465b-9291-3d19654bb5f0" variant="h1" tone="warning">{pixel}</Typography></div>
            <Typography shuku-edit-id="e-ab780dae-7007-420c-b7a6-b6ee9aad5740" variant="h2" tone="muted">=</Typography>
            <div shuku-edit-id="e-2fb4e5e5-a390-4279-ac29-b99bdec6f8c0"><Typography shuku-edit-id="e-fa930afa-ced3-46f8-95d5-a63c3d785936" variant="bodySmall" tone="muted">{multiple ? '这个位置的贡献' : '参数的梯度'}</Typography><Typography shuku-edit-id="e-5d265e68-9398-44e4-a394-b594516b3c60" variant="h1" tone="warning">{fmt(before.contributions[weight][position])}</Typography></div>
          </div>
          {multiple && <div shuku-edit-id="e-083da5c0-d838-4f0b-8f48-fabe5b53b5ee" className="vfl-update-contributions">{before.contributions[weight].map((term, i) => <Button key={i} aria-pressed={position === i} className={position === i ? 'is-focus' : ''} onClick={() => setPosition(i)}><Typography shuku-edit-id="e-41e67622-698d-445e-aae5-3f15028bb43f" as="span" variant="bodySmall" tone="inherit">{WINDOWS[i]}：{fmt(term)}</Typography></Button>)}<Typography shuku-edit-id="e-cde2f928-17cf-46e4-918e-ec6045545101" variant="body" tone="warning">相加，得到参数的梯度：{fmt(gradient)}</Typography></div>}
          <Typography shuku-edit-id="e-daf54c4d-9fda-4f7b-bb67-8b474b997d08" variant="body">{gradient === 0 ? '对应像素全是 0，这个参数不影响预测，梯度也是 0。' : multiple ? '同一个参数影响多个输出，各个位置传回的贡献要相加。' : '像素是 1：参数增加多少，预测就增加多少。'}</Typography>
          <Button className="vfl-update-probe" aria-pressed={probe} onClick={() => setProbe(v => !v)}><Typography shuku-edit-id="e-dc4a0b42-1e5f-4f16-a4ae-6c7f28f7d06c" as="span" variant="bodySmall" tone="inherit">{probe ? '撤回试调' : '试着把这个参数增加 0.01'}</Typography></Button>
          <div shuku-edit-id="e-16930ce9-674b-43f6-b861-5f5a4c8f0f0f" className="vfl-update-probe-result"><Typography shuku-edit-id="e-bea3852c-d6eb-4a53-92c5-b3ccbf782329" variant="body" tone={probe ? 'success' : 'muted'}>{probe ? `预测 ${fmt(before.prediction)} → ${fmt(perturbed.prediction)}，损失 ${fmt(before.loss)} → ${fmt(perturbed.loss)}` : '点一下，看看预测和损失怎样变化。'}</Typography></div>
          <Typography shuku-edit-id="e-da8af62b-edb2-4d64-90e3-200376bd0e08" variant="bodySmall" tone="warning">{gradient < 0 ? '负梯度：增大这个参数，损失会下降。' : '零梯度：这次保持参数不变。'}</Typography>
        </>}
        {step === 2 && <>
          <Typography shuku-edit-id="e-c5f674d6-0df7-410b-b9d1-a401716ea3bc" variant="body">新参数 = 旧参数 − 学习率 × 梯度</Typography>
          <div shuku-edit-id="e-912a8181-3da4-49d0-909c-cd608bad27f7" className="vfl-update-large-equation"><Typography shuku-edit-id="e-f1e5a752-5077-46c6-9343-57570b6ff299" variant="h2">{fmt(UPDATE_KERNEL[weight])} − {UPDATE_RATE} × {operand(gradient)} = <Typography shuku-edit-id="e-2303bd90-57b5-4f3d-b2c3-1dde63d35815" as="span" variant="h2" tone="success">{fmt(updated[weight])}</Typography></Typography></div>
          <Typography shuku-edit-id="e-a66562a8-1327-48ce-9dbc-89154969f984" variant="body" tone="success">{gradient < 0 ? `减去负数，参数从 ${fmt(UPDATE_KERNEL[weight])} 增大到 ${fmt(updated[weight])}。` : '梯度是 0，这个参数保持不变。'}</Typography>
          <Typography shuku-edit-id="e-078ca6c9-0a6d-4fa9-bfbf-0c474a88132c" variant="bodySmall" tone="muted">九个参数各用自己的梯度更新。点击其他格子，查看它的计算。</Typography>
        </>}
        {step === 3 && <>
          <div shuku-edit-id="e-525244bc-ccab-434e-a988-a2b1ad43750f" className="vfl-update-validation">
            <div shuku-edit-id="e-b01f97f2-e3fa-4117-97ca-ce3facab9d12"><Typography shuku-edit-id="e-485136b1-7239-4783-b804-1947a96c331e" variant="bodySmall" tone="muted">预测，更接近目标 1</Typography><Typography shuku-edit-id="e-1c3ae0cb-505b-4110-bc66-a61d88c93caf" variant="h1" tone="success">{fmt(before.prediction)} → {fmt(after.prediction)}</Typography></div>
            <div shuku-edit-id="e-fe261f60-97d3-46a3-b856-dadc656f351b"><Typography shuku-edit-id="e-07a34ff5-f6ae-49ab-adce-3739c736a69f" variant="bodySmall" tone="muted">损失，更小</Typography><Typography shuku-edit-id="e-7ccd66ee-c91e-43f0-8918-4aaed311436a" variant="h1" tone="success">{fmt(before.loss)} → {fmt(after.loss)}</Typography></div>
          </div>
          <Typography shuku-edit-id="e-d56649a4-b259-490c-9c88-86fb86f5412d" variant="body">误差传回参数，参数按梯度调整，预测就更接近目标。</Typography>
          <Typography shuku-edit-id="e-f32e3b93-3fa0-4246-bc33-5b6274d7e83b" variant="bodySmall" tone="muted">输入图像没变，改变的是卷积核的参数。</Typography>
        </>}
      </section>
    </div>
    <footer shuku-edit-id="e-025edb36-6d72-4cda-8465-419137591b1b" className="vfl-update-controls">
      <Button disabled={step === 0} onClick={() => { setStep(v => v - 1); setProbe(false); }}><Typography shuku-edit-id="e-9edc5abf-78b5-48b4-a62b-00b6ecff1a88" as="span" variant="body" tone="inherit">上一步</Typography></Button>
      <Button className="vfl-update-primary" onClick={advance}><Typography shuku-edit-id="e-2e03356a-4d53-41d8-8fea-0eb29b8f5ccf" as="span" variant="body" tone="inherit">{ACTIONS[step]}</Typography></Button>
    </footer>
  </ContentBlock>;
}
