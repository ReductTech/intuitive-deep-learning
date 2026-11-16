import moduleAssetOutline from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ContentBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { useLecturePlayback } from '../../components/LecturePlayback';
import './GanTrainingPage.css';

const noise = moduleAssetUrl('images/gan-training/noise.jpg');
const realPortrait = moduleAssetUrl('images/gan-training/real-portrait.jpg');
const generatedPortrait = moduleAssetUrl('images/gan-training/generated-portrait.jpg');

type Mode = 'd' | 'g' | 'cycle';
const lessons = {
  d: { title: '训练判别器 D：真图判真，生成图判假', subtitle: '固定 G，只更新 D。' },
  g: { title: '训练生成器 G：让生成图获得高分', subtitle: '固定 D，只更新 G。' },
  cycle: { title: '交替训练：D 与 G 轮流更新', subtitle: '每次更新一个网络，再用更新后的模型继续下一轮。' },
} as const;
const stageCount = 5;
const cycleDetails = [
  'D 学习区分真假，G 学习生成更逼真的样本。它们有各自的训练目标。',
  '先固定 G，训练 D：真实图判真，生成图判假。',
  '再固定更新后的 D，训练 G：让生成图获得更高的真实评分。',
  '更新后的 G 产生新样本，再交给 D 学习判断；重复这两个动作。',
  '接下来亲手观察：更新 D 改变判断，更新 G 改变生成样本。',
];

function Reveal({ show, className = '', children }: { show: boolean; className?: string; children: ReactNode }) {
  return <div shuku-edit-id="e-e086abac-b591-42ef-a8bc-76cb5931bf87" className={`vg-gan-train__reveal ${className}`} data-visible={show} aria-hidden={!show}>{children}</div>;
}
function Network({ kind, fixed, updating = false }: { kind: 'G' | 'D'; fixed: boolean; updating?: boolean }) {
  const color = kind === 'G' ? '#359361' : '#d95a64';
  return <div shuku-edit-id="e-2faf8588-fda2-40a7-a4e3-350d421c4fd8" className={`vg-gan-train__network is-${kind.toLowerCase()}`} data-network={kind} data-fixed={fixed} data-updating={updating}>
    <Typography shuku-edit-id="e-e3813a92-6093-4da1-a5f2-5bec7262f975" as="h2" variant="body">{kind === 'G' ? '生成器 G' : '判别器 D'}</Typography>
    <svg shuku-edit-id="e-a6a8e1be-6fb6-4a52-b0db-ad55051f3595" viewBox="0 0 140 100" aria-hidden="true">
      {[0, 1, 2, 3].map(i => <g shuku-edit-id="e-96ecfc13-f137-438e-b938-fe57c8339951" key={i} transform={`translate(${12 + i * 28} ${kind === 'G' ? 28 - i * 6 : 10 + i * 6})`}>
        <path shuku-edit-id="e-80cfdb04-9d8e-44fd-9573-e3fb73ec8aca" d="M0 8 L8 0 H27 L19 8 Z" fill={color} opacity=".45" />
        <path shuku-edit-id="e-640ac2f4-ef8a-47de-9530-43ef36f5170f" d={`M19 8 L27 0 V${kind === 'G' ? 42 + i * 8 : 66 - i * 8} L19 ${kind === 'G' ? 50 + i * 8 : 74 - i * 8} Z`} fill={color} opacity=".85" />
        <rect shuku-edit-id="e-cde41904-8591-41ab-a8e2-61a6420f700f" x="0" y="8" width="19" height={kind === 'G' ? 42 + i * 8 : 66 - i * 8} fill={color} opacity=".65" />
      </g>)}
    </svg>
    <Typography shuku-edit-id="e-61d14414-d76b-4f59-ba0c-e8e502999069" variant="bodySmall" tone={fixed ? 'muted' : kind === 'G' ? 'success' : 'danger'}>{fixed ? '参数固定' : updating ? '更新参数' : '本轮训练'}</Typography>
  </div>;
}
function Sample({ image, label, note }: { image: string; label: string; note?: ReactNode }) {
  return <figure shuku-edit-id="e-897849ad-c0fc-4535-9fc6-b0b949427773" className="vg-gan-train__sample"><Typography shuku-edit-id="e-a515ce2b-4a93-474b-8805-1eac60ecf61e" as="figcaption" variant="bodySmall">{label}</Typography><img shuku-edit-id="e-0b53d80b-1d9b-4dff-a07d-da5c4b25f931" src={image} alt={label} />{note && <Typography shuku-edit-id="e-802b90d6-fe7f-443a-a666-74d4110c83d6" variant="bodySmall" tone="muted" className="vg-gan-train__sample-note">{note}</Typography>}</figure>;
}

function TrainingDiagram({ mode, stage }: { mode: 'd' | 'g'; stage: number }) {
  const id = useId().replaceAll(':', '');
  const diagramRef = useRef<HTMLDivElement>(null);
  const [connections, setConnections] = useState<{ width: number; height: number; forward: string[]; feedback: string[] } | null>(null);
  useLayoutEffect(() => {
    const diagram = diagramRef.current;
    if (mode !== 'g' || !diagram) return;
    const nodes = [
      diagram.querySelector('.vg-gan-train__noise img'),
      diagram.querySelector('.vg-gan-train__g .vg-gan-train__network'),
      diagram.querySelector('.vg-gan-train__fake img'),
      diagram.querySelector('.vg-gan-train__d .vg-gan-train__network'),
      diagram.querySelector('.vg-gan-train__fake-target'),
    ];
    if (nodes.some(node => !node)) return;
    const update = () => {
      const bounds = diagram.getBoundingClientRect();
      if (!bounds.width) return;
      // Convert viewport coordinates back to the fixed canvas, including in blog mode.
      const scale = diagram.offsetWidth / bounds.width;
      const boxes = nodes.map(node => {
        const rect = node!.getBoundingClientRect();
        return {
          left: (rect.left - bounds.left) * scale,
          right: (rect.right - bounds.left) * scale,
          top: (rect.top - bounds.top) * scale,
          bottom: (rect.bottom - bounds.top) * scale,
          cx: (rect.left + rect.width / 2 - bounds.left) * scale,
          cy: (rect.top + rect.height / 2 - bounds.top) * scale,
        };
      });
      const [, , , discriminator, score] = boxes;
      const width = diagram.offsetWidth;
      const height = bounds.height * scale;
      // Preserve the original horizontal forward arrows and D-to-G return route.
      const forward = [[168, 280], [448, 560], [728, 896], [1064, 1190]]
        .map(([from, to]) => `M${from / 1400 * width} ${height * .4} H${to / 1400 * width}`);
      const entryX = discriminator.cx + (discriminator.right - discriminator.cx) / 2;
      const feedback = [
        `M${score.cx} ${score.bottom + 6} V${Math.max(score.bottom + 22, discriminator.bottom + 40)} H${entryX} V${discriminator.bottom + 6}`,
        `M${980 / 1400 * width} ${284 / 350 * height} V${330 / 350 * height} H${364 / 1400 * width} V${284 / 350 * height}`,
      ];
      const next = { width: diagram.offsetWidth, height, forward, feedback };
      setConnections(current => JSON.stringify(current) === JSON.stringify(next) ? current : next);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(diagram);
    nodes.forEach(node => observer.observe(node!));
    return () => observer.disconnect();
  }, [mode, stage]);
  const judge = stage >= 1;
  const fakeJudged = stage >= (mode === 'd' ? 2 : 1);
  return <div shuku-edit-id="e-cbf4bb13-dba7-4320-8486-6a6530388082" ref={diagramRef} className={`vg-gan-train__diagram is-${mode}`} role="group" aria-label={mode === 'd' ? '真实与生成两类样本分别进入同一个判别器' : '生成器接收经过固定判别器的梯度反馈'}>
    <svg shuku-edit-id="e-6c37dc2f-9eb2-4048-ac05-1f4576b71968" className="vg-gan-train__wires" viewBox={mode === 'g' && connections ? `0 0 ${connections.width} ${connections.height}` : '0 0 1400 350'} preserveAspectRatio="none" aria-hidden="true">
      <defs shuku-edit-id="e-d244055b-9c4a-46cf-819e-163646006c18">
        <marker shuku-edit-id="e-9325314e-d548-4ddb-898e-47c063bdd9e5" id={`${id}-forward`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path shuku-edit-id="e-2e506981-218a-4744-a5da-b958f5394e29" d="M0 0 L8 4 L0 8 Z" fill="#66839f" /></marker>
        <marker shuku-edit-id="e-5cf0f63e-f4e3-48c0-9c26-b4ad65749c0b" id={`${id}-feedback`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path shuku-edit-id="e-b2372d36-18e2-4712-b83b-6f5f4903916b" d="M0 0 L8 4 L0 8 Z" fill={mode === 'd' ? '#d95a64' : '#359361'} /></marker>
      </defs>
      <g shuku-edit-id="e-6d082dbf-cafb-4c2a-8d71-7752bde5e907" fill="none" stroke="#66839f" strokeWidth="3" markerEnd={`url(#${id}-forward)`}>
        {mode === 'g' ? connections?.forward.map((path, index) => (index < 2 || fakeJudged) && <path shuku-edit-id="e-d9144d2a-c81c-4f17-ab57-cc65bb5ca2f5" key={index} data-flow="forward" d={path} />) : <><path shuku-edit-id="e-a23085b0-e574-4949-9788-788ec511ddc6" d="M168 215 H280" /><path shuku-edit-id="e-e8000e87-68f0-4a72-ab72-511774174c88" d="M448 215 H560" /></>}
        {mode === 'd' && stage >= 1 && <path shuku-edit-id="e-9541c63a-9658-4b40-a57e-d22c9b29cbbb" d="M728 65 H800 Q820 65 820 90 V125 H896" />}
        {mode === 'd' && fakeJudged && <path shuku-edit-id="e-538ec081-83ba-4f86-9b1c-0e9aa68c80e5" d="M728 215 H800 Q820 215 820 185 V175 H896" />}
        {mode === 'd' && stage >= 1 && <path shuku-edit-id="e-77a7911b-2614-458d-9742-90039f04d09e" d="M1064 125 H1110 Q1120 125 1120 90 V65 H1190" />}
        {mode === 'd' && fakeJudged && <path shuku-edit-id="e-fc77882c-f10e-4c4d-9f61-1445a532d2d6" d="M1064 175 H1110 Q1120 175 1120 205 V215 H1190" />}
      </g>
      <g shuku-edit-id="e-3d58f63d-1649-48e3-a9df-20ee21bd9cb9" fill="none" stroke={mode === 'd' ? '#d95a64' : '#359361'} strokeWidth="3" strokeDasharray="9 6" markerEnd={`url(#${id}-feedback)`}>
        {mode === 'd' && stage >= 4 && <path shuku-edit-id="e-d791cc63-7f72-4d44-a326-3d6c3aa5bf4e" d="M1280 330 H980 V250" />}
        {mode === 'g' && stage >= 3 && connections?.feedback.map((path, index) => <path shuku-edit-id="e-e36670f4-f05b-4b94-95ff-1074d10d338c" key={index} data-flow="gradient" d={path} />)}
      </g>
    </svg>
    <Reveal show className="vg-gan-train__noise"><Sample image={noise} label="随机噪声 z" note={<>z ∼ p<sub shuku-edit-id="e-2dfa0621-1c9c-4835-a96d-6182906de8a3">z</sub>：噪声中取样</>} /></Reveal>
    <Reveal show className="vg-gan-train__g"><Network kind="G" fixed={mode === 'd'} updating={mode === 'g' && stage >= 4} /></Reveal>
    <Reveal show className="vg-gan-train__fake"><Sample image={generatedPortrait} label="生成图 G(z)" /></Reveal>
    {mode === 'd' && <Reveal show={stage >= 1} className="vg-gan-train__real"><Sample image={realPortrait} label="真实图 x" note={<>x ∼ p<sub shuku-edit-id="e-b07c3530-3036-4524-b1ff-35a9ebf6797a">data</sub>：真实数据中取图</>} /></Reveal>}
    <Reveal show={judge} className="vg-gan-train__d"><Network kind="D" fixed={mode === 'g'} updating={mode === 'd' && stage >= 4} /></Reveal>
    {mode === 'd' && <Reveal show={stage >= 1} className="vg-gan-train__real-target"><Typography shuku-edit-id="e-faa42496-97a9-44cd-9b24-570cb54f4f1d" variant="bodySmall">D(x)</Typography><Typography shuku-edit-id="e-a439cfc2-b990-4c05-a3d0-cdcf3f84d9e6" variant="body" tone="success">目标：接近 1</Typography><Typography shuku-edit-id="e-4b5242e7-0c19-4960-8b9c-a22159c83118" variant="bodySmall" tone="muted">判真得分，0～1</Typography></Reveal>}
    <Reveal show={fakeJudged} className="vg-gan-train__fake-target"><Typography shuku-edit-id="e-f2a3c2fe-466d-476d-b745-88a043f663e5" variant="bodySmall">D(G(z))</Typography><Typography shuku-edit-id="e-3e9bcbfc-de6b-4b2d-b82f-77f8bce4002c" variant="body" tone={mode === 'd' ? 'danger' : 'success'}>目标：接近 {mode === 'd' ? '0' : '1'}</Typography><Typography shuku-edit-id="e-8b53e79d-349f-49aa-a015-b29756f10da5" variant="bodySmall" tone="muted">判真得分，0～1</Typography></Reveal>
    <Reveal show={mode === 'd' ? stage >= 4 : stage >= 3} className="vg-gan-train__feedback-label"><Typography shuku-edit-id="e-7a62ff37-917f-42a3-abfe-864c24eda72c" variant="bodySmall" tone={mode === 'd' ? 'danger' : 'success'}>{mode === 'd' ? '根据损失，只更新 D' : '梯度经过 D，传回 G'}</Typography></Reveal>
  </div>;
}

function CycleDiagram({ stage }: { stage: number }) {
  const id = useId().replaceAll(':', '');
  return <div shuku-edit-id="e-4dedd633-a2c6-4d3c-8f37-3f041ed7c956" className="vg-gan-train__cycle" data-focus={stage === 1 || stage === 3 ? 'd' : stage === 2 ? 'g' : 'both'}>
    <svg shuku-edit-id="e-6524789c-993d-439d-aa19-8a07d36e28a4" className="vg-gan-train__cycle-wires" viewBox="0 0 1400 350" preserveAspectRatio="none" aria-hidden="true">
      <defs shuku-edit-id="e-08c64b45-26df-4b6b-8af3-09032353509b">
        <marker shuku-edit-id="e-3653e9e8-e8da-455a-8719-00a0d61fa9e0" id={`${id}-cycle`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path shuku-edit-id="e-82e85ccd-3fc8-4f33-8c02-7d56b184d09f" d="M0 0 L8 4 L0 8 Z" fill="#66839f" /></marker>
        <marker shuku-edit-id="e-0bfb01b2-d08a-443d-8687-431e6953b4b4" id={`${id}-cycle-return`} markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto"><path shuku-edit-id="e-a2a6b790-6564-4866-aa35-0414c3a47221" d="M0 0 L6 3 L0 6 Z" fill="#66839f" /></marker>
      </defs>
      {stage >= 2 && <path shuku-edit-id="e-0f647845-62a5-4e36-9cd0-e790dfbf0862" d="M625 130 H770" fill="none" stroke="#66839f" strokeWidth="3" markerEnd={`url(#${id}-cycle)`} />}
      {stage >= 3 && <path shuku-edit-id="e-b4d8f081-23a3-42ae-bd20-0e45ee653945" d="M1100 278 V310 H300 V278" fill="none" stroke="#66839f" strokeWidth="3" strokeLinejoin="miter" strokeLinecap="square" markerEnd={`url(#${id}-cycle-return)`} />}
    </svg>
    <Reveal show={stage >= 1} className="vg-gan-train__cycle-d">
      <Typography shuku-edit-id="e-4e778826-7fe1-4f25-b7dd-02f3a9c1d946" as="h2" variant="h3" tone="danger">训练 D，区分真假</Typography>
      <div shuku-edit-id="e-d8a60e10-ceee-41da-a0ab-867c78a6bebb" className="vg-gan-train__cycle-networks"><Network kind="G" fixed /><Typography shuku-edit-id="e-e469e58f-a810-47b1-8a13-8ae3742cb471" variant="body" tone="muted">→</Typography><Network kind="D" fixed={false} updating={stage === 1 || stage === 3} /></div>
      <Typography shuku-edit-id="e-6e2dfdc6-25a6-45d1-bc79-4d03cf2ddf91" variant="bodySmall">真实图判真，生成图判假。</Typography>
    </Reveal>
    <Reveal show={stage >= 2} className="vg-gan-train__cycle-g">
      <Typography shuku-edit-id="e-9b25ecdc-fe69-4b0f-9358-1cf0b84d0458" as="h2" variant="h3" tone="success">训练 G，生成更逼真的图</Typography>
      <div shuku-edit-id="e-9e28b1af-b55b-429d-bcd3-a0e13cc54cc8" className="vg-gan-train__cycle-networks"><Network kind="G" fixed={false} updating={stage === 2} /><Typography shuku-edit-id="e-c03c05a7-bbb9-402a-859e-4b7577875042" variant="body" tone="muted">→</Typography><Network kind="D" fixed /></div>
      <Typography shuku-edit-id="e-45b7aa85-6c66-4b22-9ec3-4acbdb2382da" variant="bodySmall">让生成图获得更高的真实评分。</Typography>
    </Reveal>
    {stage >= 2 && <Typography shuku-edit-id="e-3aa73ce2-bcf9-471c-a968-ccdae45c1af8" variant="bodySmall" tone="muted" className="vg-gan-train__cycle-next">用更新后的 D</Typography>}
    {stage >= 3 && <Typography shuku-edit-id="e-8eb007e3-2278-491b-871d-1db2878832d2" variant="bodySmall" tone="muted" className="vg-gan-train__cycle-repeat">用更新后的 G 生成新样本，继续下一轮</Typography>}
    {stage === 0 && <Typography shuku-edit-id="e-92797b7c-d922-4d77-a370-6b65833e77ba" variant="h3" tone="accent" className="vg-gan-train__cycle-intro">两个训练目标，轮流优化</Typography>}
  </div>;
}

function LossExplanation({ mode, stage }: { mode: 'd' | 'g'; stage: number }) {
  if (mode === 'g') return <Reveal show={stage >= 2} className="vg-gan-train__loss-layout is-inline">
    <section shuku-edit-id="e-83950e47-a07a-43dc-bbc5-a499fbf6d2db" className="vg-gan-train__loss" aria-label="生成器损失">
      <Typography shuku-edit-id="e-0deb252c-5f97-48b1-a484-7b52fbadfe86" as="h2" variant="body" tone="success">Lɢ：生成器损失</Typography>
      <Typography shuku-edit-id="e-d869321b-15a3-4986-bb1b-cce89bcde76a" variant="bodySmall" tone="muted">𝔼：取平均；log：对数。</Typography>
    </section>
    <div shuku-edit-id="e-06b59dd6-11c4-44be-ab7c-c66957240c4f" className="vg-gan-train__equation"><MathFormulaStatic latex={String.raw`L_G=-\mathbb E_{z\sim p_z}[\log D(G(z))]`} /></div>
    <section shuku-edit-id="e-fb7f7633-a0b8-461c-bde1-fab2d7bb78bf" className="vg-gan-train__loss" aria-label="生成器损失的含义">
      <Typography shuku-edit-id="e-f9b062cc-9be7-4c2e-9640-5d4580917e25" variant="bodySmall">生成图得分 → 1，损失减小。</Typography>
      <Typography shuku-edit-id="e-f9907ab1-a0ba-4af8-905b-c5992b5b3c99" variant="bodySmall" tone="success">D 参数固定，梯度仍传回 G。</Typography>
    </section>
  </Reveal>;

  return <Reveal show={stage >= 3} className="vg-gan-train__loss-layout">
    <section shuku-edit-id="e-844ed0d2-59a0-42ba-8067-27ab0420a4ca" className="vg-gan-train__loss" aria-label="判别器损失及其含义">
      <Typography shuku-edit-id="e-710364a5-a59e-42e3-88cd-49a135a00541" as="h2" variant="body" tone="danger">Lᴅ：两类判断的损失相加</Typography>
      <Typography shuku-edit-id="e-f45adc14-2bc6-4904-9baa-89b98741cc95" variant="bodySmall" tone="muted">𝔼：取平均；log：对数。</Typography>
      <>
        <div shuku-edit-id="e-08369d8c-72fe-4e4d-b567-bef98c9f27d5" className="vg-gan-train__equation"><MathFormulaStatic latex={String.raw`L_D=-\mathbb E_{x\sim p_{\mathrm{data}}}[\log D(x)]`} /><Typography shuku-edit-id="e-1235f644-79dc-4fa7-a636-841ea3414471" variant="bodySmall">真图得分 → 1，损失减小。</Typography></div>
        <div shuku-edit-id="e-c615e32d-566c-4ae2-beb7-6613a3ec2366" className="vg-gan-train__equation"><MathFormulaStatic latex={String.raw`\phantom{L_D=}-\mathbb E_{z\sim p_z}[\log(1-D(G(z)))]`} /><Typography shuku-edit-id="e-7aff0915-b96e-426a-b282-387a562357c8" variant="bodySmall">生成图得分 → 0，损失减小。</Typography></div>
      </>
    </section>
    {mode === 'd' && <section shuku-edit-id="e-587c5cbc-d73c-4a84-87d2-dd1d37ae3b71" className="vg-gan-train__loss-goal" aria-label="判别器损失的训练目标">
      <Typography shuku-edit-id="e-ce28a38a-e6dd-4f71-bcf5-242af45c8fa5" variant="body">训练目标：让判别器对真实图片的评分接近 1，对生成图片的评分接近 0。</Typography>
    </section>}

  </Reveal>;
}

export function GanTrainingLesson({ mode, onComplete }: { mode: Mode; onComplete?: () => void }) {
  const lesson = lessons[mode];
  const { stage, controls } = useLecturePlayback(stageCount, 1000);
  const completed = useRef(false);
  useEffect(() => {
    if (stage !== stageCount - 1 || completed.current) return;
    completed.current = true;
    onComplete?.();
  }, [stage, onComplete]);
  return <ContentBlock shuku-edit-id="e-f0fe835a-0f6d-438f-b1f7-d13c6dcee394" headingLevel={1} title={lesson.title} subtitle={lesson.subtitle} className="vg-shared-page vg-gan-train" bodyClassName="vg-gan-train__body" data-mode={mode} data-stage={stage}>
    <div shuku-edit-id="e-2b45f458-ea26-41ba-882a-674a1350a7ab" className="vg-gan-train__visual">
      {mode === 'cycle' ? <CycleDiagram stage={stage} /> : <TrainingDiagram mode={mode} stage={stage} />}
      {mode === 'cycle' && <div shuku-edit-id="e-fb69e5b4-0ff6-4cbc-843d-4fd389515bde" className="vg-gan-train__narration" aria-live="polite" aria-atomic="true"><Typography shuku-edit-id="e-07c50ca6-ac06-494d-9477-80e0d9cec9c7" variant="bodySmall">{cycleDetails[stage]}</Typography></div>}
    </div>
    {mode === 'cycle' ? <Reveal show={stage >= 3} className="vg-gan-train__cycle-summary">
      <Typography shuku-edit-id="e-12a297f4-de24-4bf1-bc86-196dd8218692" as="h2" variant="h3" tone="accent">先练判断，再练生成，反复交替</Typography>
      <div shuku-edit-id="e-c4a9af87-f40f-4360-8fa0-fed1a8af15db" className="vg-gan-train__cycle-goals">
        <Typography shuku-edit-id="e-1ceae3fe-3f3d-47fc-8fc7-59ea8a2fa93a" variant="body">D 的目标是区分真假；G 的目标是让生成图被判为真。</Typography>
        <Reveal show={stage >= 4}><Typography shuku-edit-id="e-b8338400-eaec-43cd-9670-99ba10d8fadf" variant="bodySmall" tone="accent">固定 G 更新 D，再固定 D 更新 G；反复交替。</Typography></Reveal>
      </div>
    </Reveal> : <LossExplanation mode={mode} stage={stage} />}
    <footer shuku-edit-id="e-f5a6c7c9-356c-4eb6-81b4-acbd1b5a02fd" className="vg-gan-train__footer">
      {controls}
    </footer>
  </ContentBlock>;
}
