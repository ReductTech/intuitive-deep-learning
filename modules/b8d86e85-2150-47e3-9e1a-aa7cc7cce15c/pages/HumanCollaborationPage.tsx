import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { Typography } from "@shuku/course-style/react";
import outline from '../outlines.json';
import './HumanCollaborationPage.css';

const stages = [
  { title: '人抓住概念的关键', description: <>从专业理解出发，<br shuku-edit-id="e-cc385e15-d44a-45ba-b664-5deae42b4144"/>找出最值得让学生观察的区别。</>, speech: <>两边窗口一样大，<br shuku-edit-id="e-a6d65b2e-acd7-4026-b7a2-74a80cbf0619"/>为什么参数数量不同？</> },
  { title: '人把理解变成演示设计', description: <>保持其他条件一致，<br shuku-edit-id="e-b2341a32-dea8-4a31-96df-92885fcb1319"/>让关键区别随同一个动作显现。</>, speech: <>让两个窗口同步移动：<br shuku-edit-id="e-90f04dd7-2d2e-4d66-8cbc-07025aa84c0f"/>左边换一套颜色，右边保持不变。</> },
  { title: '人校准表达与结论', description: <>检查画面是否支撑讲解，<br shuku-edit-id="e-369d0105-ceb1-4216-842d-59337c7d9081"/>补上关键对应，核对知识与数值。</>, speech: <>再对应参数数量：<br shuku-edit-id="e-ae35f384-ba5a-4be1-90c0-21458f62f729"/>9套与1套，各有多少权重？</> },
];

function Grid({ x, y, size, windowX, color = '#4395eb' }: { x: number; y: number; size: number; windowX?: number; color?: string }) {
  return <g shuku-edit-id="e-3996e1ea-927f-406e-b5ee-60e7c2641494">
    {Array.from({ length: size * size }, (_, i) => <rect shuku-edit-id="e-dbaac5f3-53af-4062-b141-bd1830181916" key={i} x={x + i % size * 10} y={y + Math.floor(i / size) * 10} width="9" height="9" fill="#e7f0fc" stroke="#bfd5ee" strokeWidth=".5"/>)}
    {windowX !== undefined && <rect shuku-edit-id="e-36c4e36a-e927-4ab6-b294-f37147ed7766" x={x + windowX * 10} y={y} width="29" height="29" fill={color} fillOpacity=".5" stroke={color} strokeWidth="1.2"/>}
  </g>;
}
function InputOutput() {
  return <div shuku-edit-id="e-45e6ebc6-12a3-4152-bf8c-8eb76b465f7a" className="cg-human-io">
    <div shuku-edit-id="e-10564ca6-9f5f-4e96-a1c6-c5df457593f8" className="cg-human-io-labels"><Typography shuku-edit-id="e-f8bfa008-a631-4592-b86f-384f2119d03a" variant="bodySmall" tone="inherit">输入5×5</Typography><Typography shuku-edit-id="e-8f631c89-49dc-4b8a-8c6c-f7ddfc01ef0e" variant="bodySmall" tone="inherit">输出3×3</Typography></div>
    <svg shuku-edit-id="e-590561b8-e86e-4bbe-a12d-4e57abffd03d" viewBox="0 0 220 64" role="img" aria-label="五乘五输入用三乘三局部窗口，以步长一、无填充得到三乘三输出">
      <Grid x={27} y={4} size={5} windowX={0}/><path shuku-edit-id="e-30a4a4d3-b9a4-4eeb-b4b8-f8b099a64722" d="M92 28h42m-7-5 7 5-7 5" fill="none" stroke="#839ebd" strokeWidth="1.5"/><Grid x={153} y={14} size={3}/>
    </svg>
  </div>;
}
function MovingWindows({ shared }: { shared: boolean }) {
  return <svg shuku-edit-id="e-a0ac13bd-c0d9-46d6-99b1-cf171f38a6aa" viewBox="0 0 132 60" className="cg-human-positions" role="img" aria-label={shared ? '窗口移动到新位置，仍使用同一套蓝色权重' : '窗口移动到新位置，从蓝色换成另一套橙色权重'}>
    <Grid x={1} y={5} size={5} windowX={0}/><Grid x={81} y={5} size={5} windowX={1} color={shared ? '#4395eb' : '#e9a13a'}/>
    <path shuku-edit-id="e-d7629663-212d-47d1-bf83-94adc51628ed" d="M57 30h17m-5-4 5 4-5 4" fill="none" stroke="#839ebd" strokeWidth="1.5"/>
  </svg>;
}
function WeightSets({ shared }: { shared: boolean }) {
  return <svg shuku-edit-id="e-815f1891-2ab1-4358-a48f-d509c080babf" viewBox="0 0 110 53" className="cg-human-sets" role="img" aria-label={shared ? '九个位置复用同一套三乘三权重，共九个独立权重' : '九个位置各自一套三乘三权重，共八十一个独立权重'}>
    {Array.from({ length: shared ? 1 : 9 }, (_, set) => <g shuku-edit-id="e-556d683b-6cd5-45a6-ba03-9040e09602d2" key={set}>
      {Array.from({ length: 9 }, (_, i) => <rect shuku-edit-id="e-881a44dc-ed65-40f3-b30a-de6c4d5afe3d" key={i} x={(shared ? 43 : 8 + set % 3 * 32) + i % 3 * (shared ? 8 : 4)} y={(shared ? 10 : 3 + Math.floor(set / 3) * 17) + Math.floor(i / 3) * (shared ? 8 : 4)} width={shared ? 7 : 3.5} height={shared ? 7 : 3.5} fill={shared ? '#4395eb' : ['#4e96e7','#e8ad50','#65b7b0','#9e88cd','#db9673','#76a6d1','#b3b866','#cf899e','#7198bd'][set]}/>)}
    </g>)}
  </svg>;
}

export function HumanCollaborationPage() {
  return <article shuku-edit-id="e-d3418667-2b55-44b2-9870-bf6bfccec9f4" className="cg-human-page cg-creator-typography" aria-labelledby="cg-human-title">
    <img shuku-edit-id="e-72be4f45-5f6b-43cf-b7ff-0e8620572d2b" className="cg-human-art" src={moduleAssetUrl("images/human-collaboration-blank-pads.webp")} alt="同一位深蓝色上衣的创作者与机器人，在三个阶段使用同款空白平板协作"/>
    <header shuku-edit-id="e-bfd1ed27-f870-42c9-9fa0-f0236174c8e7"><Typography shuku-edit-id="e-2056a390-23e1-4c72-b6d4-aab4b7190f70" as="h1" variant="display" tone="inherit" id="cg-human-title">制作交互直觉作品，人的作用是什么？</Typography></header>
    {stages.map((stage, i) => <section shuku-edit-id="e-0ea00a07-b4b6-4097-a324-83efa4c0f58f" className={`cg-human-stage cg-human-stage-${i + 1}`} key={stage.title} aria-labelledby={`cg-human-stage-title-${i}`}>
      <div shuku-edit-id="e-7dcf971e-a919-46d4-898c-e114e4493b15" className="cg-human-stage-heading"><Typography shuku-edit-id="e-ad1745bf-f791-4135-ae49-2ab1b1049fd8" as="span" variant="body" tone="inherit" className="cg-human-number">{i + 1}</Typography><div shuku-edit-id="e-e1ba6516-05e0-4ae1-870d-a68436f5489e" className="cg-human-heading-copy"><Typography shuku-edit-id="e-c92c57b6-a2bf-4913-af5f-7ee8d230bdbd" as="h2" variant="h3" tone="inherit" wrap="nowrap" id={`cg-human-stage-title-${i}`}>{stage.title}</Typography></div></div>
      <Typography shuku-edit-id="e-494fab7a-532b-47d5-b847-d182cc206c41" variant="bodySmall" tone="inherit" className="cg-human-description">{stage.description}</Typography>
      <div shuku-edit-id="e-41f33ce1-25b2-4439-9796-decbc6bb921d" className="cg-human-speech"><Typography shuku-edit-id="e-06f08e6e-b0a7-44fb-a712-45b5c61e4858" variant="bodySmall" tone="inherit">{stage.speech}</Typography></div>
    </section>)}
    <div shuku-edit-id="e-4d48d705-1e7e-4d76-a6d6-0e82411f8eb4" className="cg-human-pad cg-human-pad-1"><InputOutput/><Typography shuku-edit-id="e-06fc2ad8-8895-436a-bc3a-6f1f35fb96ba" variant="bodySmall" tone="inherit">两边都用3×3窗口</Typography></div>
    <div shuku-edit-id="e-3760212a-7bf6-42ca-b63c-b64519b8bc6e" className="cg-human-pad cg-human-pad-2"><div shuku-edit-id="e-dfc55d64-2303-4671-bff1-3c7771172eb4" className="cg-human-comparison">{[false, true].map(shared => <div shuku-edit-id="e-8da142e7-2c92-473c-af9f-c1ebdb6d74c1" key={String(shared)}><Typography shuku-edit-id="e-0864699d-1eb8-48ab-b892-eaf835617225" variant="bodySmall" tone="inherit">{shared ? '共享' : '不共享'}</Typography><MovingWindows shared={shared}/><Typography shuku-edit-id="e-4d76f6a4-4a48-48be-a900-3ccf587f0170" variant="bodySmall" tone="inherit">{shared ? '用同一套' : '换一套'}</Typography></div>)}</div></div>
    <div shuku-edit-id="e-d7586df6-d8b0-4adb-82a1-25d9567f1c9e" className="cg-human-pad cg-human-pad-3"><div shuku-edit-id="e-4f0cedb9-6aa9-4f3a-b413-d92275081593" className="cg-human-comparison">{[false, true].map(shared => <div shuku-edit-id="e-1c89e5b8-5d31-4f7c-a8de-38ed96ce2d8c" key={String(shared)}><Typography shuku-edit-id="e-fc0f1769-1fe6-44c7-b8c2-336522c485a7" variant="bodySmall" tone="inherit">{shared ? '1套' : '9套'}</Typography><WeightSets shared={shared}/><Typography shuku-edit-id="e-2bcfa078-7011-42b3-be86-ed318f6c409b" variant="bodySmall" tone="inherit">{shared ? '9个权重' : '81个权重'}</Typography></div>)}</div></div>
    <svg shuku-edit-id="e-c38a22b6-ab6e-403a-b840-19f06bf18753" className="cg-human-arrows" viewBox="0 0 1600 900" fill="none" aria-hidden="true"><path shuku-edit-id="e-4e6105a0-ccac-42ac-b1d2-6a11e29e21ff" d="M516 519h29m-10-10 10 10-10 10M1041 519h29m-10-10 10 10-10 10" stroke="#9bb0c8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/></svg>
  </article>;
}
