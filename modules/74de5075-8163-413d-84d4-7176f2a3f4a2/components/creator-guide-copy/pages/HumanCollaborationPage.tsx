import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { creatorGuideAssetUrl } from '../creatorGuideAssets';
import { Typography } from "@shuku/course-style/react";
import outline from '../outlines.json';
import './HumanCollaborationPage.css';

const stages = [
  { title: '人抓住概念的关键', description: <>从专业理解出发，<br shuku-edit-id="e-c0abbcb4-4dde-418d-a7c7-2475ab38fdea"/>找出最值得让学生观察的区别。</>, speech: <>两边窗口一样大，<br shuku-edit-id="e-bc7402d0-a80c-4966-ba10-24f6169e8aa2"/>为什么参数数量不同？</> },
  { title: '人把理解变成演示设计', description: <>保持其他条件一致，<br shuku-edit-id="e-fbedf780-d3eb-4c45-8ae4-8badf8d9f2ba"/>让关键区别随同一个动作显现。</>, speech: <>让两个窗口同步移动：<br shuku-edit-id="e-f3b03bd2-2830-4173-8692-228ca5a2951f"/>左边换一套颜色，右边保持不变。</> },
  { title: '人校准表达与结论', description: <>检查画面是否支撑讲解，<br shuku-edit-id="e-c0e9dce6-8a45-4b3b-8583-331668fd1bc9"/>补上关键对应，核对知识与数值。</>, speech: <>再对应参数数量：<br shuku-edit-id="e-23c39193-42f1-4345-856f-3525d51588de"/>9套与1套，各有多少权重？</> },
];

function Grid({ x, y, size, windowX, color = '#4395eb' }: { x: number; y: number; size: number; windowX?: number; color?: string }) {
  return <g shuku-edit-id="e-7b75b99c-42a5-47eb-90c4-4a9f59fcdeaa">
    {Array.from({ length: size * size }, (_, i) => <rect shuku-edit-id="e-6c6991e2-125e-4147-b742-a7159a0da0aa" key={i} x={x + i % size * 10} y={y + Math.floor(i / size) * 10} width="9" height="9" fill="#e7f0fc" stroke="#bfd5ee" strokeWidth=".5"/>)}
    {windowX !== undefined && <rect shuku-edit-id="e-5425cc45-0e25-4ac3-8fca-2b0a8933db63" x={x + windowX * 10} y={y} width="29" height="29" fill={color} fillOpacity=".5" stroke={color} strokeWidth="1.2"/>}
  </g>;
}
function InputOutput() {
  return <div shuku-edit-id="e-19eef8ad-b94f-4acc-a1de-462002487cc8" className="aipe-replay-cg-human-io">
    <div shuku-edit-id="e-dca70e4e-7c6e-4ca7-a5a5-a6e2a0783c2f" className="aipe-replay-cg-human-io-labels"><Typography shuku-edit-id="e-c17dda9a-e52b-4c46-8f0a-15104e4b5ed5" variant="bodySmall" tone="inherit">输入5×5</Typography><Typography shuku-edit-id="e-2705a5b7-642e-4782-9f71-c22ba3d64e47" variant="bodySmall" tone="inherit">输出3×3</Typography></div>
    <svg shuku-edit-id="e-f45351ec-2060-4eca-8c40-34e577792bf5" viewBox="0 0 220 64" role="img" aria-label="五乘五输入用三乘三局部窗口，以步长一、无填充得到三乘三输出">
      <Grid x={27} y={4} size={5} windowX={0}/><path shuku-edit-id="e-ddcfafca-4d76-4b9a-8a78-038e9b94a4b3" d="M92 28h42m-7-5 7 5-7 5" fill="none" stroke="#839ebd" strokeWidth="1.5"/><Grid x={153} y={14} size={3}/>
    </svg>
  </div>;
}
function MovingWindows({ shared }: { shared: boolean }) {
  return <svg shuku-edit-id="e-f8e00c3d-2bec-44f2-be12-be063f71e086" viewBox="0 0 132 60" className="aipe-replay-cg-human-positions" role="img" aria-label={shared ? '窗口移动到新位置，仍使用同一套蓝色权重' : '窗口移动到新位置，从蓝色换成另一套橙色权重'}>
    <Grid x={1} y={5} size={5} windowX={0}/><Grid x={81} y={5} size={5} windowX={1} color={shared ? '#4395eb' : '#e9a13a'}/>
    <path shuku-edit-id="e-a458e1f1-e933-451b-9dd6-e02bc2fd9898" d="M57 30h17m-5-4 5 4-5 4" fill="none" stroke="#839ebd" strokeWidth="1.5"/>
  </svg>;
}
function WeightSets({ shared }: { shared: boolean }) {
  return <svg shuku-edit-id="e-9690f608-a0dd-4e92-83e3-35836ba6195e" viewBox="0 0 110 53" className="aipe-replay-cg-human-sets" role="img" aria-label={shared ? '九个位置复用同一套三乘三权重，共九个独立权重' : '九个位置各自一套三乘三权重，共八十一个独立权重'}>
    {Array.from({ length: shared ? 1 : 9 }, (_, set) => <g shuku-edit-id="e-a1763097-0338-40ab-830a-c4b56f7470b2" key={set}>
      {Array.from({ length: 9 }, (_, i) => <rect shuku-edit-id="e-56c14822-2bff-461e-8557-2c7443ddc2ff" key={i} x={(shared ? 43 : 8 + set % 3 * 32) + i % 3 * (shared ? 8 : 4)} y={(shared ? 10 : 3 + Math.floor(set / 3) * 17) + Math.floor(i / 3) * (shared ? 8 : 4)} width={shared ? 7 : 3.5} height={shared ? 7 : 3.5} fill={shared ? '#4395eb' : ['#4e96e7','#e8ad50','#65b7b0','#9e88cd','#db9673','#76a6d1','#b3b866','#cf899e','#7198bd'][set]}/>)}
    </g>)}
  </svg>;
}

export function HumanCollaborationPage() {
  return <article shuku-edit-id="e-177d2d3b-112a-4c23-8531-880f7282bfbb" className="aipe-replay-cg-human-page aipe-replay-cg-creator-typography" aria-labelledby="aipe-replay-cg-human-title">
    <img shuku-edit-id="e-24e8369d-e7ae-4c69-9459-f2db20e7fa1d" className="aipe-replay-cg-human-art" src={creatorGuideAssetUrl(outline.moduleIdentity.id, "images/human-collaboration-blank-pads.webp")} alt="同一位深蓝色上衣的创作者与机器人，在三个阶段使用同款空白平板协作"/>
    <header shuku-edit-id="e-b73616f9-0dcb-4779-8c58-e587854a8425"><Typography shuku-edit-id="e-9ff87f5f-e747-4d82-8fb3-778285a2427c" as="h1" variant="display" tone="inherit" id="aipe-replay-cg-human-title">制作交互直觉作品，人的作用是什么？</Typography></header>
    {stages.map((stage, i) => <section shuku-edit-id="e-e8558182-f380-482b-8417-fd7124c4e39f" className={`aipe-replay-cg-human-stage aipe-replay-cg-human-stage-${i + 1}`} key={stage.title} aria-labelledby={`aipe-replay-cg-human-stage-title-${i}`}>
      <div shuku-edit-id="e-7e828cfe-9093-4b3d-b826-16910f5e77db" className="aipe-replay-cg-human-stage-heading"><Typography shuku-edit-id="e-56f4c15d-b28d-4919-ba03-19824130ec60" as="span" variant="body" tone="inherit" className="aipe-replay-cg-human-number">{i + 1}</Typography><div shuku-edit-id="e-916b9b50-61b0-4207-9082-04208e20b906" className="aipe-replay-cg-human-heading-copy"><Typography shuku-edit-id="e-7a7aca1c-6f15-4bf4-b5de-98f7a203cfd9" as="h2" variant="h3" tone="inherit" wrap="nowrap" id={`aipe-replay-cg-human-stage-title-${i}`}>{stage.title}</Typography></div></div>
      <Typography shuku-edit-id="e-2308dbdf-60cf-4f72-8e76-2c454b35da17" variant="bodySmall" tone="inherit" className="aipe-replay-cg-human-description">{stage.description}</Typography>
      <div shuku-edit-id="e-e41edb02-0f86-495b-8f81-d35bbc194f0e" className="aipe-replay-cg-human-speech"><Typography shuku-edit-id="e-bc2ea1f1-02a5-4cca-a88a-e2f477470777" variant="bodySmall" tone="inherit">{stage.speech}</Typography></div>
    </section>)}
    <div shuku-edit-id="e-e166dbf4-8f33-48c2-9f8f-66325d8dcf2f" className="aipe-replay-cg-human-pad aipe-replay-cg-human-pad-1"><InputOutput/><Typography shuku-edit-id="e-906cd1e5-ce21-43ec-bba6-5cbce614a48a" variant="bodySmall" tone="inherit">两边都用3×3窗口</Typography></div>
    <div shuku-edit-id="e-9302bdb1-7ff3-4bfb-bf70-dabed5966373" className="aipe-replay-cg-human-pad aipe-replay-cg-human-pad-2"><div shuku-edit-id="e-741fc62f-1bcd-4266-be31-c2ac06fcff6d" className="aipe-replay-cg-human-comparison">{[false, true].map(shared => <div shuku-edit-id="e-2383027a-7a7c-4127-8fcb-dbe2122731a3" key={String(shared)}><Typography shuku-edit-id="e-e7e48e33-edff-453c-9b1b-b4f8ea39b447" variant="bodySmall" tone="inherit">{shared ? '共享' : '不共享'}</Typography><MovingWindows shared={shared}/><Typography shuku-edit-id="e-97b6a916-cfe8-4598-814a-60c8f7ec097a" variant="bodySmall" tone="inherit">{shared ? '用同一套' : '换一套'}</Typography></div>)}</div></div>
    <div shuku-edit-id="e-6ca13749-dfe3-4d8e-ae2c-6f2df31f31b8" className="aipe-replay-cg-human-pad aipe-replay-cg-human-pad-3"><div shuku-edit-id="e-456f4827-ee8a-424b-a132-5917433ef7e6" className="aipe-replay-cg-human-comparison">{[false, true].map(shared => <div shuku-edit-id="e-702e1ffa-0824-412a-a8e7-86840306a102" key={String(shared)}><Typography shuku-edit-id="e-a8e9f0b4-e3bb-47e9-9f6a-710c4cab2fc7" variant="bodySmall" tone="inherit">{shared ? '1套' : '9套'}</Typography><WeightSets shared={shared}/><Typography shuku-edit-id="e-dd546201-5224-4c76-b391-e2dae45c6241" variant="bodySmall" tone="inherit">{shared ? '9个权重' : '81个权重'}</Typography></div>)}</div></div>
    <svg shuku-edit-id="e-9979264c-134f-48ff-a40c-5a0e972f6894" className="aipe-replay-cg-human-arrows" viewBox="0 0 1600 900" fill="none" aria-hidden="true"><path shuku-edit-id="e-54e0f8cf-211d-4e98-8dd1-b4815545b13b" d="M516 519h29m-10-10 10 10-10 10M1041 519h29m-10-10 10 10-10 10" stroke="#9bb0c8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/></svg>
  </article>;
}
