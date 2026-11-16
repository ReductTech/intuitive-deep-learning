import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useState, type CSSProperties } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
import outline from '../outlines.json';
import type { WorkflowArtifact } from './workflowDemo';

const asset = (name: string) => moduleAssetUrl(`workflow/${name}`);

export function CaoChongPreview({ firstDesign = false, interactive = false, fixed = true }: { firstDesign?: boolean; interactive?: boolean; fixed?: boolean }) {
  const [phase, setPhase] = useState<'start' | 'stones'>('start');
  const [stones, setStones] = useState(0);
  const [records, setRecords] = useState<number[]>([]);
  const addStone = () => {
    const next = Math.min(stones + 1, 5);
    setStones(next);
    if (next !== stones) setRecords(previous => [...previous, next]);
  };
  const reset = () => { setPhase('start'); setStones(0); if (fixed) setRecords([]); };
  return <div shuku-edit-id="e-c2ed6ccf-cc53-48b7-9803-f125ba324c4a" className={`cg-workflow-cao${interactive ? ' is-interactive' : ''}`} style={{ '--cg-workflow-river': `url("${asset('river-video-poster.jpg')}")` } as CSSProperties}>
    <div shuku-edit-id="e-77b7fa14-2592-4314-8e95-2cbea317ecc7" className="cg-workflow-cao-title"><Typography shuku-edit-id="e-0cd048f1-0a92-45c5-9e4d-77f66e158d7f" variant="h2" tone="inherit">曹冲称象</Typography><Typography shuku-edit-id="e-61a42aac-6327-408d-a2aa-1cb131ab7778" variant="bodySmall" tone="inherit">一艘船，能称出大象多重吗？</Typography></div>
    <div shuku-edit-id="e-65d01dfa-74bd-43b8-8f47-168d76f4df9f" className="cg-workflow-boat" style={{ transform: `translateY(${phase === 'start' ? 0 : stones * 5}px)` }}>
      <img shuku-edit-id="e-b0541cd6-7ed4-4a2f-93a2-2f58cc9c57dc" className="cg-workflow-boat-back" src={asset('boat-rectangular.png')} alt="河面上的木船" />
      {phase === 'start' ? <img shuku-edit-id="e-0676969a-31e5-4452-be40-eff7581bef3f" className="cg-workflow-elephant" src={asset('elephant.png')} alt="站在木船上的大象" /> : Array.from({ length: stones }, (_, i) => <img shuku-edit-id="e-d352a31e-3f4a-47ba-a0d1-1149d82b332c" key={i} className="cg-workflow-stone" style={{ left: `${28 + i * 9}%` }} src={asset('rock.png')} alt="" />)}
      <img shuku-edit-id="e-c7b2015d-1a83-4b90-a5c6-9509c05b2064" className="cg-workflow-boat-front" src={asset('boat-rectangular.png')} alt="" />
      {phase === 'stones' && <div shuku-edit-id="e-3ab2a349-7b34-4641-ab62-6a1e973fa285" className="cg-workflow-watermark"><Typography shuku-edit-id="e-e1ea4f70-260f-4fc7-8694-f18202e490f3" variant="bodySmall" tone="inherit">大象的水位刻痕</Typography></div>}
    </div>
    {firstDesign && <div shuku-edit-id="e-8a3517d5-9715-4d40-8a40-d8e01bb2c02c" className="cg-workflow-early-answer"><Typography shuku-edit-id="e-54264b23-4ea4-434d-894e-8a3fb21fec61" variant="bodySmall" tone="inherit">用石头替代大象，直到船沉到同一刻痕</Typography></div>}
    {interactive && <aside shuku-edit-id="e-d4db143a-dfb6-4a5e-98ae-fb3227ff494e" className="cg-workflow-notebook"><Typography shuku-edit-id="e-cebf0d61-fa96-4c9e-aaf4-2cc4678f6800" variant="h3" tone="inherit">投石手记</Typography>{records.length ? records.map((n, i) => <div shuku-edit-id="e-80f54eca-884a-4056-97f7-746358026f87" key={i}><Typography shuku-edit-id="e-04a5f144-aad7-41a4-84bb-413afd5e736b" variant="bodySmall" tone="inherit">第 {i + 1} 次</Typography><Typography shuku-edit-id="e-bee917dd-44b1-4ffa-99d5-fd497d20ed1e" variant="bodySmall" tone="inherit">{n * 120} kg · {(n * 2.1).toFixed(1)} cm</Typography></div>) : <Typography shuku-edit-id="e-e195bc7e-a176-4622-af9f-f090482e06bb" variant="bodySmall" tone="muted">还没有记录</Typography>}</aside>}
    <div shuku-edit-id="e-f37021ec-9316-44f9-8827-62c57b781327" className="cg-workflow-cao-actions">{interactive ? <><Button variant="primary" onClick={() => phase === 'start' ? setPhase('stones') : addStone()} disabled={stones === 5}>{phase === 'start' ? '开始称重' : stones === 5 ? '石头用完了' : '投入一块石头'}</Button><Button onClick={reset}>重新开始</Button></> : <span shuku-edit-id="e-0938352c-f94c-4723-bd73-c2e185aafa65" className="cg-workflow-cao-start"><Typography shuku-edit-id="e-06dbe8a6-2a4c-4801-a272-c817cde70f6a" variant="bodySmall" tone="inherit">开始称重 →</Typography></span>}</div>
  </div>;
}

export function WorkflowArtifactCard({ artifact, onOpen }: { artifact: WorkflowArtifact; onOpen: (artifact: WorkflowArtifact) => void }) {
  if (artifact.startsWith('outline')) {
    const revised = artifact === 'outline-revised';
    const titles = revised ? ['曹冲称象：先试着称一称', '石头不够，如何估象重？', '从投石记录寻找趋势', '预测和观测差多少？', '用损失比较不同的模型', '寻找更合适的参数'] : ['曹冲称象：先试着称一称', '用回归公式估计象重', '预测和观测差多少？', '认识 MAE 与 MSE', '寻找更合适的参数', '检验模型的预测'];
    return <div shuku-edit-id="e-2aff685a-da6d-4cf5-97dd-4dcad82f34ee" className="cg-workflow-outline"><div shuku-edit-id="e-728f595d-16a7-4eb2-bde1-0c37ed46470c" className="cg-workflow-artifact-heading"><Typography shuku-edit-id="e-27611423-bb92-4553-ab32-681bfa0157ce" variant="bodySmall" tone="accent">outlines.json</Typography><Typography shuku-edit-id="e-7d826202-d4a3-4a9e-9b45-0106f723b906" variant="bodySmall" tone={revised ? 'success' : 'muted'}>{revised ? '已调整知识顺序' : '大纲草案'}</Typography></div><div shuku-edit-id="e-b2e22294-50ba-4b9e-ba88-f1e3ff49e3c2" className="cg-workflow-outline-grid">{titles.map((title, i) => <div shuku-edit-id="e-0e76ff5e-7293-4f67-b9ea-d082f4ce7b21" key={title} className={revised && (i === 1 || i === 2) ? 'is-revised' : ''}><Typography shuku-edit-id="e-d25d968e-d7a7-484c-93a5-d6c437be1d3b" as="span" variant="bodySmall" tone="muted">{String(i + 1).padStart(2, '0')}</Typography><Typography shuku-edit-id="e-523d41d0-5118-49a6-82d1-ff28331a5a60" variant="bodySmall" tone="inherit">{title}</Typography></div>)}</div></div>;
  }
  const design = artifact.startsWith('design');
  return <div shuku-edit-id="e-eaf1beb8-260d-428e-b48f-cb9e1626ae75" className="cg-workflow-artifact"><Button className="cg-workflow-preview-link" onClick={() => onOpen(artifact)} aria-label={design ? '放大查看设计示意图' : '打开网页预览'}><CaoChongPreview firstDesign={artifact === 'design-first'} /><span shuku-edit-id="e-e25961df-46af-4765-ad0f-6c8800678c60" className="cg-workflow-preview-open"><Typography shuku-edit-id="e-05e5ac4d-cc5d-4e63-b754-707c5448bedf" variant="bodySmall" tone="inherit">{design ? '放大设计图 ↗' : '打开网页预览 ↗'}</Typography></span></Button><div shuku-edit-id="e-e59bbab5-4fd4-425c-8454-049e03983a5c" className="cg-workflow-artifact-caption"><Typography shuku-edit-id="e-40568396-6aae-4c9a-ba64-f580e20ff65f" variant="bodySmall" tone="muted">{design ? `第一页 · 设计示意图 ${artifact === 'design-first' ? '01' : '02'}` : artifact === 'audit' || artifact === 'reviewed' ? '实践作品预览 · 浏览关键页面' : '曹冲称象 · 页面预览'}</Typography>{artifact === 'page-fixed' && <Typography shuku-edit-id="e-7a5357ed-8a4d-48f1-bbe6-e1636b00246e" variant="bodySmall" tone="success">已更新</Typography>}</div></div>;
}

export function WorkflowBrowser({ artifact }: { artifact: WorkflowArtifact }) {
  const [page, setPage] = useState(0);
  const audit = artifact === 'audit' || artifact === 'reviewed';
  return <div shuku-edit-id="e-bd95f368-c201-46b7-bfc4-8d5d911d6ced" className="cg-workflow-browser"><div shuku-edit-id="e-3492f0a3-10aa-406b-b988-8854294bf27b" className="cg-workflow-address"><span shuku-edit-id="e-d3727600-ad04-4f5e-a94e-f9d7266ce2d6" aria-hidden="true">‹　›　↻</span><Typography shuku-edit-id="e-069a7a95-4212-438a-90c4-8a92db926b22" variant="bodySmall" tone="muted">localhost:5173 / modules / regression-loss</Typography></div>{audit && <nav shuku-edit-id="e-38d37cd6-af98-4981-9d2b-b6916683eb1f" className="cg-workflow-browser-pages" aria-label="实践作品预览页面">{['01 曹冲称象', '02 石头不够，如何估重？', '03 预测误差'].map((title, i) => <Button key={title} active={page === i} onClick={() => setPage(i)}>{title}</Button>)}</nav>}
    <div shuku-edit-id="e-720d30aa-1c2e-4c0b-84e3-4a2fa2608ccf" className="cg-workflow-browser-viewport">{page === 0 ? <CaoChongPreview key={artifact} interactive fixed={artifact !== 'page-bug'} /> : <div shuku-edit-id="e-d309fbde-0639-4fbc-8bd3-785da7064982" className="cg-workflow-regression"><Typography shuku-edit-id="e-3cd409e4-b055-4313-bbb3-cbe4abd099ec" variant="h2" tone="accent">{page === 1 ? '石头不够，如何估计象重？' : '预测和观测，差了多少？'}</Typography>{artifact === 'reviewed' && <Typography shuku-edit-id="e-fc18f3b4-b7c8-4731-ab0c-d645771ad49d" variant="bodySmall" tone="success">这些点来自刚才的投石记录</Typography>}<svg shuku-edit-id="e-65bce69b-2463-4d6a-b930-3c8fe6cea21e" viewBox="0 0 800 300" role="img" aria-label="投石记录散点与预测趋势线的示意图"><path shuku-edit-id="e-67e1826a-59cc-434c-a70c-b1b93f291132" d="M80 20v240h650" fill="none" stroke="#9bb2c7" strokeWidth="2"/><path shuku-edit-id="e-6503db30-3a06-4679-a594-57d220bb500a" d="M80 260 680 40" stroke="#378fcc" strokeWidth="4"/>{[120, 210, 300, 390, 480].map((x, i) => <g shuku-edit-id="e-de462bd6-654a-49a4-8ab8-c5d715a3e5a5" key={x}><circle shuku-edit-id="e-239168e0-2471-4ed5-9f43-53021f2c44f9" cx={x} cy={250 - i * 38 + (i % 2 ? -24 : 8)} r="8" fill="#e9a33a"/>{page === 2 && <path shuku-edit-id="e-3862fdf2-52bc-4880-acd3-e147fc64bfda" d={`M${x} ${250 - i * 38 + (i % 2 ? -24 : 8)}V${260 - (x - 80) * 220 / 600}`} stroke="#c65c51" strokeWidth="4"/>}</g>)}</svg><Typography shuku-edit-id="e-651311e1-2577-4b3d-9006-5518b2c5e02a" variant="body" tone="accent">{page === 1 ? '根据已有记录，试着寻找一条趋势线。' : '同一个载重下，比较观测与预测的深度。'}</Typography></div>}</div><Typography shuku-edit-id="e-2f232868-6a29-4d76-8e79-63d85491099a" variant="bodySmall" tone="muted" className="cg-workflow-browser-status">{audit ? `课堂浏览 · ${page + 1} / 3 个示例页面` : '第一页 · 点击称重、投石，再试试重新开始'}</Typography></div>;
}
