import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { Typography } from "@shuku/course-style/react";
import outline from '../outlines.json';
import './HumanCollaborationPage.css';

const stages = [
  { title: '人抓住概念的关键', description: <>从专业理解出发，<br shuku-edit-id="e-31145fa0-3abd-4ef1-9815-e69ec7e5efff"/>找出最值得让学生观察的区别。</>, speech: <>两边窗口一样大，<br shuku-edit-id="e-1fbd0889-5fb9-4268-9684-68cf310a746f"/>为什么参数数量不同？</> },
  { title: '人把理解变成演示设计', description: <>保持其他条件一致，<br shuku-edit-id="e-a1a782d3-0072-400e-8bf9-87ce7f754b5f"/>让关键区别随同一个动作显现。</>, speech: <>让两个窗口同步移动：<br shuku-edit-id="e-b1a25381-4feb-414e-aa07-c58367e34784"/>左边换一套颜色，右边保持不变。</> },
  { title: '人校准表达与结论', description: <>检查画面是否支撑讲解，<br shuku-edit-id="e-016beef6-7a02-478e-8dd1-f43135bc3f08"/>补上关键对应，核对知识与数值。</>, speech: <>再对应参数数量：<br shuku-edit-id="e-82903685-2870-4fee-a55c-fc08e852ca78"/>9套与1套，各有多少权重？</> },
];

function Grid({ x, y, size, windowX, color = '#4395eb' }: { x: number; y: number; size: number; windowX?: number; color?: string }) {
  return <g shuku-edit-id="e-c7e7fd30-91d5-454c-a101-77b0cbd8f004">
    {Array.from({ length: size * size }, (_, i) => <rect shuku-edit-id="e-a4a70c54-573d-45b2-b400-cdbe19b8e414" key={i} x={x + i % size * 10} y={y + Math.floor(i / size) * 10} width="9" height="9" fill="#e7f0fc" stroke="#bfd5ee" strokeWidth=".5"/>)}
    {windowX !== undefined && <rect shuku-edit-id="e-72298f9d-9135-455e-b8d7-9cce90684701" x={x + windowX * 10} y={y} width="29" height="29" fill={color} fillOpacity=".5" stroke={color} strokeWidth="1.2"/>}
  </g>;
}
function InputOutput() {
  return <div shuku-edit-id="e-3975a7bb-3416-41fe-b6a5-cad4a42d95b5" className="cg-human-io">
    <div shuku-edit-id="e-7bdba68b-6cbd-4380-8ea5-e2d257e7eb83" className="cg-human-io-labels"><Typography shuku-edit-id="e-d03d2105-c4e3-4f94-bd99-afc67f05b0cd" variant="bodySmall" tone="inherit">输入5×5</Typography><Typography shuku-edit-id="e-8d7a14b5-414a-44d3-be7e-7c247293480d" variant="bodySmall" tone="inherit">输出3×3</Typography></div>
    <svg shuku-edit-id="e-4cc9eb95-9918-42c0-b300-fbb2ef64247f" viewBox="0 0 220 64" role="img" aria-label="五乘五输入用三乘三局部窗口，以步长一、无填充得到三乘三输出">
      <Grid x={27} y={4} size={5} windowX={0}/><path shuku-edit-id="e-9dd29add-3a15-4c25-a048-3d74502b9526" d="M92 28h42m-7-5 7 5-7 5" fill="none" stroke="#839ebd" strokeWidth="1.5"/><Grid x={153} y={14} size={3}/>
    </svg>
  </div>;
}
function MovingWindows({ shared }: { shared: boolean }) {
  return <svg shuku-edit-id="e-3827521d-d0f5-4d7e-8bfd-e77ea7e131b2" viewBox="0 0 132 60" className="cg-human-positions" role="img" aria-label={shared ? '窗口移动到新位置，仍使用同一套蓝色权重' : '窗口移动到新位置，从蓝色换成另一套橙色权重'}>
    <Grid x={1} y={5} size={5} windowX={0}/><Grid x={81} y={5} size={5} windowX={1} color={shared ? '#4395eb' : '#e9a13a'}/>
    <path shuku-edit-id="e-4fcb5b73-3115-4778-b810-47596b704259" d="M57 30h17m-5-4 5 4-5 4" fill="none" stroke="#839ebd" strokeWidth="1.5"/>
  </svg>;
}
function WeightSets({ shared }: { shared: boolean }) {
  return <svg shuku-edit-id="e-f5d7ed7a-9d23-4348-a747-0255b7abf044" viewBox="0 0 110 53" className="cg-human-sets" role="img" aria-label={shared ? '九个位置复用同一套三乘三权重，共九个独立权重' : '九个位置各自一套三乘三权重，共八十一个独立权重'}>
    {Array.from({ length: shared ? 1 : 9 }, (_, set) => <g shuku-edit-id="e-6d17f92d-0a43-473a-be34-f308d72c15cc" key={set}>
      {Array.from({ length: 9 }, (_, i) => <rect shuku-edit-id="e-87f0a9e3-7154-4097-a0c4-24f99fb1b3b0" key={i} x={(shared ? 43 : 8 + set % 3 * 32) + i % 3 * (shared ? 8 : 4)} y={(shared ? 10 : 3 + Math.floor(set / 3) * 17) + Math.floor(i / 3) * (shared ? 8 : 4)} width={shared ? 7 : 3.5} height={shared ? 7 : 3.5} fill={shared ? '#4395eb' : ['#4e96e7','#e8ad50','#65b7b0','#9e88cd','#db9673','#76a6d1','#b3b866','#cf899e','#7198bd'][set]}/>)}
    </g>)}
  </svg>;
}

export function HumanCollaborationPage() {
  return <article shuku-edit-id="e-877f6eba-8d46-416c-b38a-a9fe968a48ef" className="cg-human-page cg-creator-typography" aria-labelledby="cg-human-title">
    <img shuku-edit-id="e-0c9d390f-2fc4-473a-9eae-8d3e1cc3883e" className="cg-human-art" src={moduleAssetUrl('images/human-collaboration-blank-pads.jpg')} alt="同一位深蓝色上衣的创作者与机器人，在三个阶段使用同款空白平板协作"/>
    <header shuku-edit-id="e-d0a3c533-e13f-473f-9583-f865950f79f9"><Typography shuku-edit-id="e-2e5e6dbe-3ede-4016-81cd-2fcbf333ab37" as="h1" variant="display" tone="inherit" id="cg-human-title">制作交互直觉作品，人的作用是什么？</Typography></header>
    {stages.map((stage, i) => <section shuku-edit-id="e-b91a99d5-11d0-43e1-9e40-5d48d1ac2e5b" className={`cg-human-stage cg-human-stage-${i + 1}`} key={stage.title} aria-labelledby={`cg-human-stage-title-${i}`}>
      <div shuku-edit-id="e-7a13d902-b6fb-46c1-ab66-70d7f47569de" className="cg-human-stage-heading"><Typography shuku-edit-id="e-e6e3119c-e398-41a7-a91c-ed173b681ea1" as="span" variant="body" tone="inherit" className="cg-human-number">{i + 1}</Typography><div shuku-edit-id="e-ff3e6be4-d80e-4831-a10a-17c05dbde767" className="cg-human-heading-copy"><Typography shuku-edit-id="e-c5d76577-bc40-4c16-818b-619efe91df0e" as="h2" variant="h3" tone="inherit" wrap="nowrap" id={`cg-human-stage-title-${i}`}>{stage.title}</Typography></div></div>
      <Typography shuku-edit-id="e-1a70e963-8523-4e9a-8bda-7659e85ab26a" variant="bodySmall" tone="inherit" className="cg-human-description">{stage.description}</Typography>
      <div shuku-edit-id="e-9e232cfe-68a5-43d3-88b5-6b644b5a9085" className="cg-human-speech"><Typography shuku-edit-id="e-d028fd52-b0d9-46b7-8a23-9c00e8e67c19" variant="bodySmall" tone="inherit">{stage.speech}</Typography></div>
    </section>)}
    <div shuku-edit-id="e-723e862d-fb03-4b31-a526-fbc2dbc4f42c" className="cg-human-pad cg-human-pad-1"><InputOutput/><Typography shuku-edit-id="e-810c95af-9b3b-44c8-8717-2c0a5a3fd5ea" variant="bodySmall" tone="inherit">两边都用3×3窗口</Typography></div>
    <div shuku-edit-id="e-cc1a5a16-d13b-4e81-8dd3-c208fd0a1300" className="cg-human-pad cg-human-pad-2"><div shuku-edit-id="e-8bc18127-fca9-4382-8b2c-e8768bb25bf2" className="cg-human-comparison">{[false, true].map(shared => <div shuku-edit-id="e-d969f62c-27c2-4fc7-b26f-6df3b67f70c2" key={String(shared)}><Typography shuku-edit-id="e-45b266a9-d918-443b-9870-25627d7e8995" variant="bodySmall" tone="inherit">{shared ? '共享' : '不共享'}</Typography><MovingWindows shared={shared}/><Typography shuku-edit-id="e-27702454-b1a8-4ac6-8d5a-016f112fba12" variant="bodySmall" tone="inherit">{shared ? '用同一套' : '换一套'}</Typography></div>)}</div></div>
    <div shuku-edit-id="e-ba1a682b-3551-491b-9dc5-249fa06d1584" className="cg-human-pad cg-human-pad-3"><div shuku-edit-id="e-1fa00114-e36f-430e-8f81-27e6e97b85d3" className="cg-human-comparison">{[false, true].map(shared => <div shuku-edit-id="e-2e936c28-88db-4347-955b-b7c17daebda9" key={String(shared)}><Typography shuku-edit-id="e-15c07728-be30-4629-b869-3bf2b9daaa32" variant="bodySmall" tone="inherit">{shared ? '1套' : '9套'}</Typography><WeightSets shared={shared}/><Typography shuku-edit-id="e-4068deb6-f5d3-473f-aa74-c3158e8bab2e" variant="bodySmall" tone="inherit">{shared ? '9个权重' : '81个权重'}</Typography></div>)}</div></div>
    <svg shuku-edit-id="e-2fb6a437-2504-4b4d-888c-cec8f66f37b8" className="cg-human-arrows" viewBox="0 0 1600 900" fill="none" aria-hidden="true"><path shuku-edit-id="e-217c9e24-cdcd-405e-b87f-40381a88bdde" d="M516 519h29m-10-10 10 10-10 10M1041 519h29m-10-10 10 10-10 10" stroke="#9bb0c8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/></svg>
  </article>;
}
