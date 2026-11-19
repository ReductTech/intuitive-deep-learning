import human_collaboration_blank_padsAsset0 from "../assets/images/human-collaboration-blank-pads.webp";
import { Typography } from "@shuku/course-style/react";
import './HumanCollaborationPage.css';

const stages = [
  { title: '人抓住概念的关键', description: <>从专业理解出发，<br shuku-edit-id="e-1f6bc84d-0a46-45f8-a89b-99dff609e0da"/>找出最值得让学生观察的区别。</>, speech: <>两边窗口一样大，<br shuku-edit-id="e-362b63df-6862-40e3-a67e-16e8edb458f0"/>为什么参数数量不同？</> },
  { title: '人把理解变成演示设计', description: <>保持其他条件一致，<br shuku-edit-id="e-adcaabfa-59cf-4352-a7b1-46e182d77a19"/>让关键区别随同一个动作显现。</>, speech: <>让两个窗口同步移动：<br shuku-edit-id="e-573c733b-8bb1-4ff9-8840-50055894fdc2"/>左边换一套颜色，右边保持不变。</> },
  { title: '人校准表达与结论', description: <>检查画面是否支撑讲解，<br shuku-edit-id="e-dc0ead00-c4fc-4ebb-9e60-12fb7f36f07f"/>补上关键对应，核对知识与数值。</>, speech: <>再对应参数数量：<br shuku-edit-id="e-b082a372-333e-43f2-bca4-847fa2261c75"/>9套与1套，各有多少权重？</> },
];

function Grid({ x, y, size, windowX, color = '#4395eb' }: { x: number; y: number; size: number; windowX?: number; color?: string }) {
  return <g shuku-edit-id="e-55c5b950-dad4-4b8f-beee-2a54cf30c2cc">
    {Array.from({ length: size * size }, (_, i) => <rect shuku-edit-id="e-8292f2b5-3889-4c6f-8c33-0d8074f168b3" key={i} x={x + i % size * 10} y={y + Math.floor(i / size) * 10} width="9" height="9" fill="#e7f0fc" stroke="#bfd5ee" strokeWidth=".5"/>)}
    {windowX !== undefined && <rect shuku-edit-id="e-81ec8f0b-4255-4b15-9b18-e0d21c4676b8" x={x + windowX * 10} y={y} width="29" height="29" fill={color} fillOpacity=".5" stroke={color} strokeWidth="1.2"/>}
  </g>;
}
function InputOutput() {
  return <div shuku-edit-id="e-8c1ab93b-07b1-4b1d-907b-be58e202e994" className="cg-human-io">
    <div shuku-edit-id="e-581a2135-c6f0-4298-8320-a6a25abf65f1" className="cg-human-io-labels"><Typography shuku-edit-id="e-364a812d-9ad2-4896-aca3-60bd62bd6d19" variant="bodySmall" tone="inherit">输入5×5</Typography><Typography shuku-edit-id="e-778843f0-80ac-4bef-a865-e7148fc782fc" variant="bodySmall" tone="inherit">输出3×3</Typography></div>
    <svg shuku-edit-id="e-4d6bf302-4057-4830-bf6d-ea0c7df189bc" viewBox="0 0 220 64" role="img" aria-label="五乘五输入用三乘三局部窗口，以步长一、无填充得到三乘三输出">
      <Grid x={27} y={4} size={5} windowX={0}/><path shuku-edit-id="e-614f52db-d6b5-4be8-bda5-1768154e31aa" d="M92 28h42m-7-5 7 5-7 5" fill="none" stroke="#839ebd" strokeWidth="1.5"/><Grid x={153} y={14} size={3}/>
    </svg>
  </div>;
}
function MovingWindows({ shared }: { shared: boolean }) {
  return <svg shuku-edit-id="e-364ad2c7-2245-48c0-a1e6-dd4cf4df573c" viewBox="0 0 132 60" className="cg-human-positions" role="img" aria-label={shared ? '窗口移动到新位置，仍使用同一套蓝色权重' : '窗口移动到新位置，从蓝色换成另一套橙色权重'}>
    <Grid x={1} y={5} size={5} windowX={0}/><Grid x={81} y={5} size={5} windowX={1} color={shared ? '#4395eb' : '#e9a13a'}/>
    <path shuku-edit-id="e-a34bff11-929d-4b8f-956a-48f31fed6fbd" d="M57 30h17m-5-4 5 4-5 4" fill="none" stroke="#839ebd" strokeWidth="1.5"/>
  </svg>;
}
function WeightSets({ shared }: { shared: boolean }) {
  return <svg shuku-edit-id="e-156440bf-3147-42e7-b104-9be03547868e" viewBox="0 0 110 53" className="cg-human-sets" role="img" aria-label={shared ? '九个位置复用同一套三乘三权重，共九个独立权重' : '九个位置各自一套三乘三权重，共八十一个独立权重'}>
    {Array.from({ length: shared ? 1 : 9 }, (_, set) => <g shuku-edit-id="e-d7ce65f4-9504-4820-818f-cd4fb1e5f6c6" key={set}>
      {Array.from({ length: 9 }, (_, i) => <rect shuku-edit-id="e-7ff9217e-41ca-4493-8529-667a1f3d521a" key={i} x={(shared ? 43 : 8 + set % 3 * 32) + i % 3 * (shared ? 8 : 4)} y={(shared ? 10 : 3 + Math.floor(set / 3) * 17) + Math.floor(i / 3) * (shared ? 8 : 4)} width={shared ? 7 : 3.5} height={shared ? 7 : 3.5} fill={shared ? '#4395eb' : ['#4e96e7','#e8ad50','#65b7b0','#9e88cd','#db9673','#76a6d1','#b3b866','#cf899e','#7198bd'][set]}/>)}
    </g>)}
  </svg>;
}

export function HumanCollaborationPage() {
  return <article shuku-edit-id="e-86edac27-7a1c-47a7-96b1-e1c4d32ecc7c" className="cg-human-page cg-creator-typography" aria-labelledby="cg-human-title">
    <img shuku-edit-id="e-ea27d082-d839-4d70-86a5-69704e1a6676" className="cg-human-art" src={human_collaboration_blank_padsAsset0} alt="同一位深蓝色上衣的创作者与机器人，在三个阶段使用同款空白平板协作"/>
    <header shuku-edit-id="e-1a84677e-1b52-40bd-9e17-a1786eecaf7b"><Typography shuku-edit-id="e-2aaf3b3c-fdf1-4b1f-9f6c-70c6b6016c29" as="h1" variant="display" tone="inherit" id="cg-human-title">制作交互直觉作品，人的作用是什么？</Typography></header>
    {stages.map((stage, i) => <section shuku-edit-id="e-8ce16ee2-2edc-48ff-83bd-88eec6a0d4f8" className={`cg-human-stage cg-human-stage-${i + 1}`} key={stage.title} aria-labelledby={`cg-human-stage-title-${i}`}>
      <div shuku-edit-id="e-7299b7d2-4e10-4e4f-b2ed-ec0af5bc37c0" className="cg-human-stage-heading"><Typography shuku-edit-id="e-dbdd0def-9ff8-411a-b12a-27150e7925b2" as="span" variant="body" tone="inherit" className="cg-human-number">{i + 1}</Typography><div shuku-edit-id="e-95317166-a8e2-4938-a21b-6dd29d9177ea" className="cg-human-heading-copy"><Typography shuku-edit-id="e-da0beb9a-9d17-4245-83bb-4b2fa7d71af4" as="h2" variant="h3" tone="inherit" wrap="nowrap" id={`cg-human-stage-title-${i}`}>{stage.title}</Typography></div></div>
      <Typography shuku-edit-id="e-ccbc416d-ae6f-482a-98d0-17d5fe47890b" variant="bodySmall" tone="inherit" className="cg-human-description">{stage.description}</Typography>
      <div shuku-edit-id="e-9eb3c2c2-70bb-4bd0-bc7a-939a64dee743" className="cg-human-speech"><Typography shuku-edit-id="e-6baaa0af-c3d7-4d7f-9bcf-576bbbfdce2f" variant="bodySmall" tone="inherit">{stage.speech}</Typography></div>
    </section>)}
    <div shuku-edit-id="e-da65fd45-0c7f-4245-9e62-79e72bdb0d18" className="cg-human-pad cg-human-pad-1"><InputOutput/><Typography shuku-edit-id="e-4857c973-c28c-4bf8-82bf-09bd92464ba6" variant="bodySmall" tone="inherit">两边都用3×3窗口</Typography></div>
    <div shuku-edit-id="e-e0223e25-a48c-402b-a961-0196feb95f38" className="cg-human-pad cg-human-pad-2"><div shuku-edit-id="e-f727a5e0-c1bd-4553-acfd-968d9361dfe4" className="cg-human-comparison">{[false, true].map(shared => <div shuku-edit-id="e-b65a8395-681c-4812-beec-83120e86484e" key={String(shared)}><Typography shuku-edit-id="e-b2272cd8-2f55-47e6-98a7-80f25b762fa1" variant="bodySmall" tone="inherit">{shared ? '共享' : '不共享'}</Typography><MovingWindows shared={shared}/><Typography shuku-edit-id="e-8abdb2c1-4ca1-4b3e-89a6-7bfa19c186b0" variant="bodySmall" tone="inherit">{shared ? '用同一套' : '换一套'}</Typography></div>)}</div></div>
    <div shuku-edit-id="e-a012bf84-6db7-4327-abe3-39c982a8e208" className="cg-human-pad cg-human-pad-3"><div shuku-edit-id="e-9a494acd-d3a5-4253-a71a-a7d4876d7f9b" className="cg-human-comparison">{[false, true].map(shared => <div shuku-edit-id="e-10e5775a-23c4-4e69-92e1-0740f352b3ee" key={String(shared)}><Typography shuku-edit-id="e-1ea90462-acea-4912-9427-81aa80de53e1" variant="bodySmall" tone="inherit">{shared ? '1套' : '9套'}</Typography><WeightSets shared={shared}/><Typography shuku-edit-id="e-44fc22f2-96c3-4260-b4be-2e0b532f0d4a" variant="bodySmall" tone="inherit">{shared ? '9个权重' : '81个权重'}</Typography></div>)}</div></div>
    <svg shuku-edit-id="e-0105e2ea-d0fb-4035-b647-f6c3ce0083c3" className="cg-human-arrows" viewBox="0 0 1600 900" fill="none" aria-hidden="true"><path shuku-edit-id="e-6c83a1f6-568f-49cb-b817-2b84c6cc979d" d="M516 519h29m-10-10 10 10-10 10M1041 519h29m-10-10 10 10-10 10" stroke="#9bb0c8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/></svg>
  </article>;
}
