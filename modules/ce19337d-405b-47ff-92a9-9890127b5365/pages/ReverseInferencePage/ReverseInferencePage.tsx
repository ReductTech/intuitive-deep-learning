import moduleAssetOutline from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { useLecturePlayback } from '../../components/LecturePlayback';
import { useEffect, useRef } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import './ReverseInferencePage.css';

const x0 = moduleAssetUrl('images/forward-derivation/x0.jpg');
const x1 = moduleAssetUrl('images/forward-derivation/x1.jpg');
const xt = moduleAssetUrl('images/forward-derivation/xt.jpg');
const noise = moduleAssetUrl('images/two-processes/xt.jpg');

const steps = [
  '生成从第 T 步的纯噪声开始。',
  '同一个去噪器，先让随机噪声出现图像轮廓。',
  '重复去噪，得到越来越清晰的同一张人脸。',
  '继续重复，最终生成清晰图像 x₀。',
  '现在放大其中一步：xₜ 怎样走向 xₜ₋₁？',
  '先看当前状态 xₜ：它包含图像分量与噪声分量。',
  '往回一步，图像分量增加，噪声分量减少。',
  '第一步：从 xₜ 中减去模型预测的噪声。',
  '第二步：把得到的图像分量缩放到前一时刻。',
  '第三步：加入前一时刻的噪声分量，得到 xₜ₋₁（确定性单步示意）。',
] as const;

const reverseUpdateLines = [
  String.raw`x_{t-1}=\sqrt{\bar\alpha_{t-1}}\left(\frac{x_t-\sqrt{1-\bar\alpha_t}\,\epsilon_\theta(x_t,t)}{\sqrt{\bar\alpha_t}}\right)`,
  String.raw`+\sqrt{1-\bar\alpha_{t-1}}\,\epsilon_\theta(x_t,t)`,
] as const;
const scaledSignalLines = [
  String.raw`\sqrt{\bar\alpha_{t-1}}\,\hat x_0=\frac{\sqrt{\bar\alpha_{t-1}}}{\sqrt{\bar\alpha_t}}\,\sqrt{\bar\alpha_t}\,\hat x_0`,
  String.raw`=\frac{\sqrt{\bar\alpha_{t-1}}}{\sqrt{\bar\alpha_t}}\left(x_t-\sqrt{1-\bar\alpha_t}\,\hat\epsilon\right)`,
] as const;

const frames = [
  { src: x0, symbol: 'x₀', label: '生成图像', alt: '生成的清晰人脸', reveal: 3 },
  { src: x1, symbol: 'x₁', label: '更清晰', alt: '轻微噪声的同一张人脸', reveal: 2 },
  { src: xt, symbol: 'xₜ', label: '出现轮廓', alt: '带噪声的同一张人脸', reveal: 1 },
  { src: noise, symbol: 'x_T', label: '纯噪声', alt: '生成起点的纯噪声', reveal: 0 },
] as const;

function Formula({ latex, label }: { latex: string; label: string }) {
  return <MathFormulaBlock ariaLabel={label} className="vg-inference__formula"><MathFormulaStatic latex={latex} /></MathFormulaBlock>;
}

function StackedFormula({ lines, label }: { lines: readonly string[]; label: string }) {
  return <div shuku-edit-id="e-72602284-72df-4c23-9eaa-884f7b1c1dd3" className="vg-inference__formula-lines" aria-label={label}>
    {lines.map((latex, index) => <Formula key={latex} latex={latex} label={`${label}，第 ${index + 1} 行`} />)}
  </div>;
}

export interface ReverseInferencePageProps { onComplete?: () => void; }

export function ReverseInferencePage({ onComplete }: ReverseInferencePageProps) {
  const { stage: step, controls } = useLecturePlayback(steps.length, 1000);
  const completedRef = useRef(false);

  useEffect(() => {
    if (step !== steps.length - 1 || completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
  }, [step, onComplete]);

  const focused = step >= 4;

  return <ContentBlock shuku-edit-id="e-287ee1e9-e1a9-4a5a-91e3-476f28046a96" headingLevel={1} className="vg-shared-page vg-inference" bodyClassName="vg-inference__body"
    title="图像生成：反向去噪怎样一步步发生？" subtitle={steps[step]}>
    <div shuku-edit-id="e-0602df61-562d-4132-bfeb-77bf5c3e28ab" className={`vg-inference__content${focused ? ' is-focused' : ''}`}>
      <section shuku-edit-id="e-4bbf3c60-7ac6-4b8e-a5ad-a777222e5310" className="vg-inference__chain" aria-label="从纯噪声到图像的反向生成链">
        <div shuku-edit-id="e-84b8df10-b0b1-4fab-98a9-f365404999b0" className="vg-inference__chain-heading">
          <Typography shuku-edit-id="e-e1544e23-ccf7-49a2-b9f3-1f757a4e4ce2" as="strong" variant="bodySmall" tone="success">← 反向去噪 · 多次使用同一个去噪器</Typography>
          {focused && <Typography shuku-edit-id="e-0a887be4-02f4-486a-8984-d9390b86de69" as="span" variant="bodySmall" tone="accent">聚焦一次 xₜ → xₜ₋₁</Typography>}
        </div>
        <div shuku-edit-id="e-55aeb990-a94e-484e-b827-1116e2f77b6c" className="vg-inference__frames">
          {frames.map((frame, index) => <div shuku-edit-id="e-43e1e9d7-9f79-4cbe-a95b-90ef522552f2" className="vg-inference__frame-slot" key={frame.symbol}>
            <figure shuku-edit-id="e-5c397fac-f896-4ef7-b546-12ac7ef1dc94" className={`vg-inference__frame${step >= frame.reveal ? ' is-visible' : ''}${focused && index === 2 ? ' is-selected' : ''}`}>
              {step >= frame.reveal && <><img shuku-edit-id="e-f3560ce4-a8b9-445c-90c3-7347f324e744" src={frame.src} alt={frame.alt} />
                <figcaption shuku-edit-id="e-9ab6edd1-d3d6-4276-be9a-385274c6b586"><Typography shuku-edit-id="e-fc88d5c2-21bf-4b8e-9c16-78735e19000e" as="strong" variant="bodySmall" tone="main">{frame.symbol === 'x_T' ? <>x<sub shuku-edit-id="e-cb2f2063-efc6-4fe6-b74d-823cd7ea9b9a">T</sub></> : frame.symbol}</Typography>
                  <Typography shuku-edit-id="e-f01e7ca7-ab47-4b5a-b616-32d535c4222f" as="span" variant="bodySmall" tone="muted">{frame.label}</Typography></figcaption></>}
            </figure>
            {index < frames.length - 1 && step >= frames[index].reveal && <div shuku-edit-id="e-c50e01d4-3cd0-40b0-b09e-616a2489e22c" className="vg-inference__denoiser" aria-label="同一个去噪器">
              <span shuku-edit-id="e-1d0fbe03-576a-4776-8ba3-71074583e39c" aria-hidden="true">←</span>
            </div>}
          </div>)}
        </div>
        {!focused && <Typography shuku-edit-id="e-a56ba2d0-064d-47d5-bff4-6c05efaeea0b" variant="body" tone="muted" className="vg-inference__chain-note">每次输入当前的带噪图像，预测一个噪声更少的状态；重复这个动作，图像逐渐成形。</Typography>}
      </section>

      {focused && <div shuku-edit-id="e-ed9f6a67-b7c6-49dc-95de-e148b1a53008" className="vg-inference__detail">
        <section shuku-edit-id="e-3c6081a7-9a12-4cfa-9ca4-b431238b510a" className="vg-inference__geometry" aria-label="反向一步的几何系数示意">
          <div shuku-edit-id="e-7f331f7b-6e7d-498b-9cb4-88528a795c4f" className="vg-inference__section-head"><Typography shuku-edit-id="e-c6f98e0a-df99-4908-9d07-3bdbd9ac6007" as="h2" variant="h3" tone="main">把一步放到几何图里</Typography>
            <Typography shuku-edit-id="e-ebf8f2eb-7cf0-4fd5-af0b-7232bcfbc47a" as="span" variant="bodySmall" tone="muted">系数空间示意</Typography></div>
          <svg shuku-edit-id="e-6fc61c05-69d1-466d-9373-f46a02598b55" viewBox="0 0 620 430" role="img" aria-label="图像分量向上、噪声分量向右，反向一步从红色当前点走向绿色前一步">
            <defs shuku-edit-id="e-465c3061-5244-4eca-b77f-6c415947b197">
              <marker shuku-edit-id="e-1ba3b893-2d26-4641-8b8d-6c8e6288c164" id="vg-inference-noise-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path shuku-edit-id="e-cbf06ab1-ac58-4816-9944-62fe6ef6e160" d="M0 0 L8 4.5 L0 9 Z" fill="#da5245" /></marker>
              <marker shuku-edit-id="e-9f3b1111-4f64-4a7e-aa91-ec4afc9daeb1" id="vg-inference-signal-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path shuku-edit-id="e-1832d0f6-fd06-4896-b38d-ba45a06f44e1" d="M0 0 L8 4.5 L0 9 Z" fill="#24945d" /></marker>
              <marker shuku-edit-id="e-b96d15d2-e117-491a-8507-f9fd2575ed37" id="vg-inference-reverse-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path shuku-edit-id="e-0c33274f-0cbb-4bda-b000-22ec42532a8e" d="M0 0 L8 4.5 L0 9 Z" fill="#2675c8" /></marker>
            </defs>
            <path shuku-edit-id="e-49498ef2-f432-4198-9495-b1f36d6903da" d="M76 354 H531 M76 354 V35" stroke="#27374c" strokeWidth="3" fill="none" />
            <path shuku-edit-id="e-6c65407d-af2b-48f4-ba58-78bf25b8e3e2" d="M483 354 A407 303 0 0 0 76 51" stroke="#344257" strokeWidth="2.5" fill="none" />
            <circle shuku-edit-id="e-253cd1a1-a913-44de-b80b-35821c104cc0" cx="76" cy="354" r="5" fill="#27374c" /><circle shuku-edit-id="e-79020b75-f720-4f4d-9d9d-5783d051d80f" cx="483" cy="354" r="5" fill="#27374c" /><circle shuku-edit-id="e-4082f9bb-5f31-4545-bc85-9076b5c18cde" cx="76" cy="51" r="5" fill="#27374c" />
            <text shuku-edit-id="e-558da986-9170-4997-b7f7-a112ba508b90" x="64" y="55" textAnchor="end" className="vg-inference__svg-label">x₀</text><text shuku-edit-id="e-79db1bcb-70a2-4bb7-aad8-b1d2306f7696" x="500" y="376" className="vg-inference__svg-label">噪声 ε</text>
            {step === 4 && <g shuku-edit-id="e-f25a8363-c0cc-443c-9338-b4f31deaf30d" className="vg-inference__svg-reveal">
              <path shuku-edit-id="e-72308d9a-bdc3-43d8-82ae-ceba3494a00f" d="M101 52 Q215 50 323 111" fill="none" stroke="#da5245" strokeWidth="4" markerEnd="url(#vg-inference-noise-arrow)" />
              <path shuku-edit-id="e-b7fd176d-861d-400e-bf0d-c862aae89ad7" d="M425 270 Q409 198 360 150" fill="none" stroke="#2675c8" strokeWidth="4" markerEnd="url(#vg-inference-reverse-arrow)" />
              <text shuku-edit-id="e-6d6087f3-eff1-4f35-8da7-219fcc991334" x="176" y="37" className="vg-inference__svg-forward">前向：加噪</text>
              <text shuku-edit-id="e-8c8ba01b-4fdf-4548-a83e-ddf002a79db6" x="437" y="213" className="vg-inference__svg-reverse">反向：去噪</text>
            </g>}
            {step >= 5 && <g shuku-edit-id="e-38bd8f05-ee4c-408c-b44a-68132cae5ba5" className="vg-inference__svg-reveal">
              <path shuku-edit-id="e-ae6e3e46-a349-411a-8b3c-4c03f0cb2289" d={step >= 7 ? 'M76 354 L347 130 M347 130 V354' : 'M76 354 L347 130 M76 130 H347 M347 130 V354'} fill="none" stroke="#da5245" strokeWidth="2.5" strokeDasharray="7 6" />
              <circle shuku-edit-id="e-1295cb34-cb3a-4bd6-b6e1-182efdbe1bed" cx="347" cy="130" r="9" fill="#da5245" /><text shuku-edit-id="e-8b14aaa1-bf83-4daf-b422-1119a45617e5" x="358" y="124" className="vg-inference__svg-current">xₜ</text>
              <text shuku-edit-id="e-90fef3d4-a9a3-4016-8c06-23c3e1ca1d47" x="212" y="387" className="vg-inference__svg-small">噪声分量</text><text shuku-edit-id="e-d1a1796a-6466-4c29-8ae2-ff7dfc1b557c" x="5" y="244" className="vg-inference__svg-small">图像分量</text>
            </g>}
            {step >= 6 && <g shuku-edit-id="e-3578a11a-16ff-4794-a4d3-55cc80c40eac" className="vg-inference__svg-reveal">
              <path shuku-edit-id="e-b3bdbadb-e2e3-4bee-a7fd-096d7174156a" d="M76 354 L256 79 M76 79 H256 M256 79 V354" fill="none" stroke="#24945d" strokeWidth="2.5" strokeDasharray="7 6" />
              <circle shuku-edit-id="e-be1034d6-2f26-4f9f-a88f-d3b3c13829e9" cx="256" cy="79" r="9" fill="#24945d" /><text shuku-edit-id="e-3a25ac2a-13d2-46a3-b385-ff440069d2ec" x="271" y="67" className="vg-inference__svg-previous">xₜ₋₁</text>
            </g>}
            {step >= 7 && <g shuku-edit-id="e-fff0c017-c1dc-478f-bb17-8f5a72f5742c" className="vg-inference__svg-reveal">
              <path shuku-edit-id="e-c0644dbf-473b-4a31-b4d7-1ed365dc0568" d="M338 130 H91" fill="none" stroke="#da5245" strokeWidth="4" markerEnd="url(#vg-inference-noise-arrow)" />
            </g>}
            {step >= 8 && <g shuku-edit-id="e-b23929fc-ec3b-4414-8c9a-0fa40103231e" className="vg-inference__svg-reveal">
              <path shuku-edit-id="e-600e55e9-0a7d-4fac-8c27-050adcc62129" d="M119 137 L236 94" fill="none" stroke="#24945d" strokeWidth="4" markerEnd="url(#vg-inference-signal-arrow)" />
            </g>}
          </svg>
          <div shuku-edit-id="e-3f855a90-ab6c-41d4-bfe7-968841b8b02d" className="vg-inference__geometry-legend">
            <Typography shuku-edit-id="e-c62ad58c-8246-4a3b-bf1b-e571fc352faa" as="span" variant="bodySmall" tone="warning">● 红色：当前 xₜ</Typography>
            {step >= 6 && <Typography shuku-edit-id="e-0de4f30e-aeba-4112-8fa5-89590b7adcd0" as="span" variant="bodySmall" tone="success">● 绿色：前一步 xₜ₋₁</Typography>}
          </div>
        </section>
        <section shuku-edit-id="e-19a2823c-1c87-4af1-9f47-159617fb9311" className="vg-inference__math" aria-label="参照 SVG 逐步展开的反向更新公式">
          <Typography shuku-edit-id="e-92ec295a-d657-4ef0-b0c0-945554391941" as="h2" variant="h3" tone="main">反向去噪递推式</Typography>
          {step < 9 && <div shuku-edit-id="e-59c39839-a0c7-433d-bb2c-98eb50be7af2" className="vg-inference__overview" aria-label="完整反向去噪递推式">
            <StackedFormula lines={reverseUpdateLines} label="由当前状态和预测噪声计算前一时刻的完整递推式" />
          </div>}
          {step === 4 && <div shuku-edit-id="e-a150a2b1-3b84-4e97-8f8a-553c2532b43e" className="vg-inference__math-prompt"><Typography shuku-edit-id="e-f2c372da-a364-4f2e-aa34-994fc6f8de42" variant="body" tone="accent">圆弧是分量比例的示意。生成时没有真实原图，去噪器要从 xₜ 预测噪声。</Typography></div>}
          {step === 5 && <div shuku-edit-id="e-4b0bd445-3121-4968-8467-086578194a6e" className="vg-inference__math-row is-current">
            <Typography shuku-edit-id="e-f8597ac6-b156-4eff-838c-24dd6327e639" as="span" variant="bodySmall" tone="warning">当前点 xₜ · 对照前向分解</Typography>
            <Formula latex="x_t=\sqrt{\bar\alpha_t}x_0+\sqrt{1-\bar\alpha_t}\,\epsilon" label="当前状态的前向分解式" />
          </div>}
          {step === 6 && <div shuku-edit-id="e-b2d5b9ed-3e04-416e-b961-f5dd17e221e6" className="vg-inference__math-row is-previous">
            <Typography shuku-edit-id="e-f61e4cd7-61dd-4357-8b9a-8fe0d1e7ca60" as="span" variant="bodySmall" tone="success">前一个点 xₜ₋₁ · 同样的分解</Typography>
            <Formula latex="x_{t-1}=\sqrt{\bar\alpha_{t-1}}x_0+\sqrt{1-\bar\alpha_{t-1}}\,\epsilon" label="前一时刻的图像和噪声分量" />
          </div>}
          {step >= 7 && <div shuku-edit-id="e-82a9f29d-38b5-48a6-a12a-5cbd63df2358" className="vg-inference__math-row is-current">
            {step === 7 && <Typography shuku-edit-id="e-50e98f9b-e2c2-49cd-8bad-0e0bf6335576" as="span" variant="bodySmall" tone="danger">① 减去预测噪声 ε̂，留下图像分量</Typography>}
            <Formula latex="\sqrt{\bar\alpha_t}\,\hat x_0=x_t-\sqrt{1-\bar\alpha_t}\,\hat\epsilon" label="当前状态减去预测噪声得到图像分量" />
          </div>}
          {step >= 8 && <div shuku-edit-id="e-ed5a2fa5-a3c7-4996-8944-1475a330100b" className="vg-inference__math-row is-previous is-scaled">
            {step === 8 && <Typography shuku-edit-id="e-46fcd761-6bf7-411f-853f-d3a688864a30" as="span" variant="bodySmall" tone="success">② 将图像分量缩放到 t−1</Typography>}
            <StackedFormula lines={scaledSignalLines} label="先写出缩放比例，再代入减噪后的图像分量" />
          </div>}
          {step >= 9 && <div shuku-edit-id="e-c3c53ee9-1af1-429c-9183-a017e088c066" className="vg-inference__math-result">
            <Typography shuku-edit-id="e-cebe365c-4184-49f4-983b-f98a83d18036" as="span" variant="bodySmall" tone="accent">③ 加回前一步的噪声分量</Typography>
            <StackedFormula lines={reverseUpdateLines} label="把预测噪声代入后得到完整反向更新式" />
          </div>}
        </section>
      </div>}
    </div>
    <footer shuku-edit-id="e-3a3a2ff6-fc5d-47ed-a517-605ea461a75f" className="vg-inference__footer">
      
      <div shuku-edit-id="e-edf813b3-70fa-4e26-8291-bb4c17d22f41" className="vg-inference__actions">{controls}</div>
    </footer>
  </ContentBlock>;
}
