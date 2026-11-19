import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { creatorGuideAssetUrl } from '../creatorGuideAssets';
import { Typography } from "@shuku/course-style/react";
import outline from '../outlines.json';
import './HumanCollaborationPage.css';

const stages = [
  { title: '人抓住概念的关键', description: <>从专业理解出发，<br shuku-edit-id="e-67781f8e-c99d-461c-b4ed-ea759c4c898f"/>找出最值得让学生观察的区别。</>, speech: <>两边窗口一样大，<br shuku-edit-id="e-336d73f2-4f15-44ec-b80d-84079bc6f96a"/>为什么参数数量不同？</> },
  { title: '人把理解变成演示设计', description: <>保持其他条件一致，<br shuku-edit-id="e-f179e977-0365-4a4b-a844-eb04dfd12b3c"/>让关键区别随同一个动作显现。</>, speech: <>让两个窗口同步移动：<br shuku-edit-id="e-492887c8-ea81-4901-9011-bec5ce26438e"/>左边换一套颜色，右边保持不变。</> },
  { title: '人校准表达与结论', description: <>检查画面是否支撑讲解，<br shuku-edit-id="e-6fffba9c-9a54-4abd-b229-9fc33c850abb"/>补上关键对应，核对知识与数值。</>, speech: <>再对应参数数量：<br shuku-edit-id="e-43d280ab-b9a1-46a2-b3f9-46089b2efc0d"/>9套与1套，各有多少权重？</> },
];

function Grid({ x, y, size, windowX, color = '#4395eb' }: { x: number; y: number; size: number; windowX?: number; color?: string }) {
  return <g shuku-edit-id="e-0c6df40e-9540-4fb1-a128-54a72b597cac">
    {Array.from({ length: size * size }, (_, i) => <rect shuku-edit-id="e-8c1d7b75-e46f-4b75-a8ca-5d0e2715aa30" key={i} x={x + i % size * 10} y={y + Math.floor(i / size) * 10} width="9" height="9" fill="#e7f0fc" stroke="#bfd5ee" strokeWidth=".5"/>)}
    {windowX !== undefined && <rect shuku-edit-id="e-8154cdbb-133b-466a-9980-d01e295b776e" x={x + windowX * 10} y={y} width="29" height="29" fill={color} fillOpacity=".5" stroke={color} strokeWidth="1.2"/>}
  </g>;
}
function InputOutput() {
  return <div shuku-edit-id="e-03ac7f3c-0aca-49f6-9e8d-d8128249a45b" className="aipe-replay-cg-human-io">
    <div shuku-edit-id="e-d8c81329-b2a5-4284-95f8-a08adae2f5a5" className="aipe-replay-cg-human-io-labels"><Typography shuku-edit-id="e-f7436851-204e-4a52-8dd0-1efdffac2699" variant="bodySmall" tone="inherit">输入5×5</Typography><Typography shuku-edit-id="e-295600b8-5d1d-4c9c-9f96-9b2e2b02830d" variant="bodySmall" tone="inherit">输出3×3</Typography></div>
    <svg shuku-edit-id="e-a9865191-6e27-48b2-aa8a-e76d62dea371" viewBox="0 0 220 64" role="img" aria-label="五乘五输入用三乘三局部窗口，以步长一、无填充得到三乘三输出">
      <Grid x={27} y={4} size={5} windowX={0}/><path shuku-edit-id="e-aab094d0-b8a2-4945-9ceb-51ab7757dd12" d="M92 28h42m-7-5 7 5-7 5" fill="none" stroke="#839ebd" strokeWidth="1.5"/><Grid x={153} y={14} size={3}/>
    </svg>
  </div>;
}
function MovingWindows({ shared }: { shared: boolean }) {
  return <svg shuku-edit-id="e-6e84d457-6f28-4d22-bbaa-47c9193f25bc" viewBox="0 0 132 60" className="aipe-replay-cg-human-positions" role="img" aria-label={shared ? '窗口移动到新位置，仍使用同一套蓝色权重' : '窗口移动到新位置，从蓝色换成另一套橙色权重'}>
    <Grid x={1} y={5} size={5} windowX={0}/><Grid x={81} y={5} size={5} windowX={1} color={shared ? '#4395eb' : '#e9a13a'}/>
    <path shuku-edit-id="e-7d90a817-54cd-40f9-89df-4cacc71abc59" d="M57 30h17m-5-4 5 4-5 4" fill="none" stroke="#839ebd" strokeWidth="1.5"/>
  </svg>;
}
function WeightSets({ shared }: { shared: boolean }) {
  return <svg shuku-edit-id="e-cbdf1127-ae01-442f-8f36-fa0df76b4e65" viewBox="0 0 110 53" className="aipe-replay-cg-human-sets" role="img" aria-label={shared ? '九个位置复用同一套三乘三权重，共九个独立权重' : '九个位置各自一套三乘三权重，共八十一个独立权重'}>
    {Array.from({ length: shared ? 1 : 9 }, (_, set) => <g shuku-edit-id="e-97feefbd-a0c2-48d5-9367-2d4b64862a3a" key={set}>
      {Array.from({ length: 9 }, (_, i) => <rect shuku-edit-id="e-ce1c1855-91a1-4eb2-bd39-be103414a9a8" key={i} x={(shared ? 43 : 8 + set % 3 * 32) + i % 3 * (shared ? 8 : 4)} y={(shared ? 10 : 3 + Math.floor(set / 3) * 17) + Math.floor(i / 3) * (shared ? 8 : 4)} width={shared ? 7 : 3.5} height={shared ? 7 : 3.5} fill={shared ? '#4395eb' : ['#4e96e7','#e8ad50','#65b7b0','#9e88cd','#db9673','#76a6d1','#b3b866','#cf899e','#7198bd'][set]}/>)}
    </g>)}
  </svg>;
}

export function HumanCollaborationPage() {
  return <article shuku-edit-id="e-3f27feae-e964-4967-861a-8d93a6831edb" className="aipe-replay-cg-human-page aipe-replay-cg-creator-typography" aria-labelledby="aipe-replay-cg-human-title">
    <img shuku-edit-id="e-9122c6e8-cba6-4236-9c34-3bc45fc3cb23" className="aipe-replay-cg-human-art" src={creatorGuideAssetUrl(outline.moduleIdentity.id, "images/human-collaboration-blank-pads.webp")} alt="同一位深蓝色上衣的创作者与机器人，在三个阶段使用同款空白平板协作"/>
    <header shuku-edit-id="e-e6252bf5-836a-40eb-895b-b1108ce6eacc"><Typography shuku-edit-id="e-52214838-271c-4af7-aaa0-e8f241bc5c7c" as="h1" variant="display" tone="inherit" id="aipe-replay-cg-human-title">制作交互直觉作品，人的作用是什么？</Typography></header>
    {stages.map((stage, i) => <section shuku-edit-id="e-e2f79531-0bdb-4394-bfb4-e14b914c7f8e" className={`aipe-replay-cg-human-stage aipe-replay-cg-human-stage-${i + 1}`} key={stage.title} aria-labelledby={`aipe-replay-cg-human-stage-title-${i}`}>
      <div shuku-edit-id="e-9407d4d9-3b3f-4ec3-8347-f03ceb29c16e" className="aipe-replay-cg-human-stage-heading"><Typography shuku-edit-id="e-92715d21-480e-468a-97fb-1cd3386fb937" as="span" variant="body" tone="inherit" className="aipe-replay-cg-human-number">{i + 1}</Typography><div shuku-edit-id="e-f85c8e24-b0fc-47a4-8368-00267d48f30b" className="aipe-replay-cg-human-heading-copy"><Typography shuku-edit-id="e-d66fac97-ec48-4013-9e54-4971d7de6798" as="h2" variant="h3" tone="inherit" wrap="nowrap" id={`aipe-replay-cg-human-stage-title-${i}`}>{stage.title}</Typography></div></div>
      <Typography shuku-edit-id="e-d1900aef-32fd-4b37-b4fc-cdeb1ad73de9" variant="bodySmall" tone="inherit" className="aipe-replay-cg-human-description">{stage.description}</Typography>
      <div shuku-edit-id="e-9ebf26a7-1d7f-4124-9d67-3c1bfdb15774" className="aipe-replay-cg-human-speech"><Typography shuku-edit-id="e-7672bbaa-be26-4daa-b609-6dd38697430b" variant="bodySmall" tone="inherit">{stage.speech}</Typography></div>
    </section>)}
    <div shuku-edit-id="e-944a97cb-f8d0-4a2c-8351-2e046d09d979" className="aipe-replay-cg-human-pad aipe-replay-cg-human-pad-1"><InputOutput/><Typography shuku-edit-id="e-fd25904b-993c-44e1-ba39-bb4a5cf4b497" variant="bodySmall" tone="inherit">两边都用3×3窗口</Typography></div>
    <div shuku-edit-id="e-77b84bb0-a436-4be1-9ffb-a000c4df8de0" className="aipe-replay-cg-human-pad aipe-replay-cg-human-pad-2"><div shuku-edit-id="e-05327d2f-75b0-431c-ba89-5c188a3aaa7a" className="aipe-replay-cg-human-comparison">{[false, true].map(shared => <div shuku-edit-id="e-daad63c4-7237-434b-a5e0-bfb09d1122c3" key={String(shared)}><Typography shuku-edit-id="e-6096821b-08d9-4b6e-af04-9a4b0a8ad5dd" variant="bodySmall" tone="inherit">{shared ? '共享' : '不共享'}</Typography><MovingWindows shared={shared}/><Typography shuku-edit-id="e-fa3cd98d-c9af-4dc4-add7-0023703d5257" variant="bodySmall" tone="inherit">{shared ? '用同一套' : '换一套'}</Typography></div>)}</div></div>
    <div shuku-edit-id="e-8ecfbf4f-9022-4044-865e-505ff13e8d4c" className="aipe-replay-cg-human-pad aipe-replay-cg-human-pad-3"><div shuku-edit-id="e-21d19d2b-cf4c-4be7-91a0-663b4be8efe3" className="aipe-replay-cg-human-comparison">{[false, true].map(shared => <div shuku-edit-id="e-1494d6fb-6f43-4eb1-a3dd-97a455f14b6f" key={String(shared)}><Typography shuku-edit-id="e-00d98a81-926f-4a5d-acba-b6e2f33e66e8" variant="bodySmall" tone="inherit">{shared ? '1套' : '9套'}</Typography><WeightSets shared={shared}/><Typography shuku-edit-id="e-f9f7366c-bbf4-42aa-8a60-87c50b8b6fef" variant="bodySmall" tone="inherit">{shared ? '9个权重' : '81个权重'}</Typography></div>)}</div></div>
    <svg shuku-edit-id="e-92872a19-afd7-41e1-9fc7-2cfd352629ba" className="aipe-replay-cg-human-arrows" viewBox="0 0 1600 900" fill="none" aria-hidden="true"><path shuku-edit-id="e-920fe78f-4b47-4526-90c5-364c4459e6db" d="M516 519h29m-10-10 10 10-10 10M1041 519h29m-10-10 10 10-10 10" stroke="#9bb0c8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/></svg>
  </article>;
}
