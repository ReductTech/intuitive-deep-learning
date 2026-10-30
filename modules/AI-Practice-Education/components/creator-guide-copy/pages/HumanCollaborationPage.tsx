import { creatorGuideAssetUrl } from '../creatorGuideAssets';
import { Typography, moduleAssetUrl } from '../../../../shared/react';
import outline from '../outlines.json';
import './HumanCollaborationPage.css';

const stages = [
  { title: '人抓住概念的关键', description: <>从专业理解出发，<br/>找出最值得让学生观察的区别。</>, speech: <>两边窗口一样大，<br/>为什么参数数量不同？</> },
  { title: '人把理解变成演示设计', description: <>保持其他条件一致，<br/>让关键区别随同一个动作显现。</>, speech: <>让两个窗口同步移动：<br/>左边换一套颜色，右边保持不变。</> },
  { title: '人校准表达与结论', description: <>检查画面是否支撑讲解，<br/>补上关键对应，核对知识与数值。</>, speech: <>再对应参数数量：<br/>9套与1套，各有多少权重？</> },
];

function Grid({ x, y, size, windowX, color = '#4395eb' }: { x: number; y: number; size: number; windowX?: number; color?: string }) {
  return <g>
    {Array.from({ length: size * size }, (_, i) => <rect key={i} x={x + i % size * 10} y={y + Math.floor(i / size) * 10} width="9" height="9" fill="#e7f0fc" stroke="#bfd5ee" strokeWidth=".5"/>)}
    {windowX !== undefined && <rect x={x + windowX * 10} y={y} width="29" height="29" fill={color} fillOpacity=".5" stroke={color} strokeWidth="1.2"/>}
  </g>;
}
function InputOutput() {
  return <div className="aipe-replay-cg-human-io">
    <div className="aipe-replay-cg-human-io-labels"><Typography variant="bodySmall" tone="inherit">输入5×5</Typography><Typography variant="bodySmall" tone="inherit">输出3×3</Typography></div>
    <svg viewBox="0 0 220 64" role="img" aria-label="五乘五输入用三乘三局部窗口，以步长一、无填充得到三乘三输出">
      <Grid x={27} y={4} size={5} windowX={0}/><path d="M92 28h42m-7-5 7 5-7 5" fill="none" stroke="#839ebd" strokeWidth="1.5"/><Grid x={153} y={14} size={3}/>
    </svg>
  </div>;
}
function MovingWindows({ shared }: { shared: boolean }) {
  return <svg viewBox="0 0 132 60" className="aipe-replay-cg-human-positions" role="img" aria-label={shared ? '窗口移动到新位置，仍使用同一套蓝色权重' : '窗口移动到新位置，从蓝色换成另一套橙色权重'}>
    <Grid x={1} y={5} size={5} windowX={0}/><Grid x={81} y={5} size={5} windowX={1} color={shared ? '#4395eb' : '#e9a13a'}/>
    <path d="M57 30h17m-5-4 5 4-5 4" fill="none" stroke="#839ebd" strokeWidth="1.5"/>
  </svg>;
}
function WeightSets({ shared }: { shared: boolean }) {
  return <svg viewBox="0 0 110 53" className="aipe-replay-cg-human-sets" role="img" aria-label={shared ? '九个位置复用同一套三乘三权重，共九个独立权重' : '九个位置各自一套三乘三权重，共八十一个独立权重'}>
    {Array.from({ length: shared ? 1 : 9 }, (_, set) => <g key={set}>
      {Array.from({ length: 9 }, (_, i) => <rect key={i} x={(shared ? 43 : 8 + set % 3 * 32) + i % 3 * (shared ? 8 : 4)} y={(shared ? 10 : 3 + Math.floor(set / 3) * 17) + Math.floor(i / 3) * (shared ? 8 : 4)} width={shared ? 7 : 3.5} height={shared ? 7 : 3.5} fill={shared ? '#4395eb' : ['#4e96e7','#e8ad50','#65b7b0','#9e88cd','#db9673','#76a6d1','#b3b866','#cf899e','#7198bd'][set]}/>)}
    </g>)}
  </svg>;
}

export function HumanCollaborationPage() {
  return <article className="aipe-replay-cg-human-page aipe-replay-cg-creator-typography" aria-labelledby="aipe-replay-cg-human-title">
    <img className="aipe-replay-cg-human-art" src={creatorGuideAssetUrl(outline.moduleIdentity.id, 'images/human-collaboration-blank-pads.jpg')} alt="同一位深蓝色上衣的创作者与机器人，在三个阶段使用同款空白平板协作"/>
    <header><Typography as="h1" variant="display" tone="inherit" id="aipe-replay-cg-human-title">制作交互直觉作品，人的作用是什么？</Typography></header>
    {stages.map((stage, i) => <section className={`aipe-replay-cg-human-stage aipe-replay-cg-human-stage-${i + 1}`} key={stage.title} aria-labelledby={`aipe-replay-cg-human-stage-title-${i}`}>
      <div className="aipe-replay-cg-human-stage-heading"><Typography as="span" variant="body" tone="inherit" className="aipe-replay-cg-human-number">{i + 1}</Typography><div className="aipe-replay-cg-human-heading-copy"><Typography as="h2" variant="h3" tone="inherit" wrap="nowrap" id={`aipe-replay-cg-human-stage-title-${i}`}>{stage.title}</Typography></div></div>
      <Typography variant="bodySmall" tone="inherit" className="aipe-replay-cg-human-description">{stage.description}</Typography>
      <div className="aipe-replay-cg-human-speech"><Typography variant="bodySmall" tone="inherit">{stage.speech}</Typography></div>
    </section>)}
    <div className="aipe-replay-cg-human-pad aipe-replay-cg-human-pad-1"><InputOutput/><Typography variant="bodySmall" tone="inherit">两边都用3×3窗口</Typography></div>
    <div className="aipe-replay-cg-human-pad aipe-replay-cg-human-pad-2"><div className="aipe-replay-cg-human-comparison">{[false, true].map(shared => <div key={String(shared)}><Typography variant="bodySmall" tone="inherit">{shared ? '共享' : '不共享'}</Typography><MovingWindows shared={shared}/><Typography variant="bodySmall" tone="inherit">{shared ? '用同一套' : '换一套'}</Typography></div>)}</div></div>
    <div className="aipe-replay-cg-human-pad aipe-replay-cg-human-pad-3"><div className="aipe-replay-cg-human-comparison">{[false, true].map(shared => <div key={String(shared)}><Typography variant="bodySmall" tone="inherit">{shared ? '1套' : '9套'}</Typography><WeightSets shared={shared}/><Typography variant="bodySmall" tone="inherit">{shared ? '9个权重' : '81个权重'}</Typography></div>)}</div></div>
    <svg className="aipe-replay-cg-human-arrows" viewBox="0 0 1600 900" fill="none" aria-hidden="true"><path d="M516 519h29m-10-10 10 10-10 10M1041 519h29m-10-10 10 10-10 10" stroke="#9bb0c8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/></svg>
  </article>;
}
