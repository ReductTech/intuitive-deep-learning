import { useState, type CSSProperties } from 'react';
import { Button, Typography, moduleAssetUrl } from '../../shared/react';
import outline from '../outlines.json';
import type { WorkflowArtifact } from './workflowDemo';

const asset = (name: string) => moduleAssetUrl(outline.moduleIdentity.id, `workflow/${name}`);

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
  return <div className={`cg-workflow-cao${interactive ? ' is-interactive' : ''}`} style={{ '--cg-workflow-river': `url("${asset('river-video-poster.jpg')}")` } as CSSProperties}>
    <div className="cg-workflow-cao-title"><Typography variant="h2" tone="inherit">曹冲称象</Typography><Typography variant="bodySmall" tone="inherit">一艘船，能称出大象多重吗？</Typography></div>
    <div className="cg-workflow-boat" style={{ transform: `translateY(${phase === 'start' ? 0 : stones * 5}px)` }}>
      <img className="cg-workflow-boat-back" src={asset('boat-rectangular.png')} alt="河面上的木船" />
      {phase === 'start' ? <img className="cg-workflow-elephant" src={asset('elephant.png')} alt="站在木船上的大象" /> : Array.from({ length: stones }, (_, i) => <img key={i} className="cg-workflow-stone" style={{ left: `${28 + i * 9}%` }} src={asset('rock.png')} alt="" />)}
      <img className="cg-workflow-boat-front" src={asset('boat-rectangular.png')} alt="" />
      {phase === 'stones' && <div className="cg-workflow-watermark"><Typography variant="bodySmall" tone="inherit">大象的水位刻痕</Typography></div>}
    </div>
    {firstDesign && <div className="cg-workflow-early-answer"><Typography variant="bodySmall" tone="inherit">用石头替代大象，直到船沉到同一刻痕</Typography></div>}
    {interactive && <aside className="cg-workflow-notebook"><Typography variant="h3" tone="inherit">投石手记</Typography>{records.length ? records.map((n, i) => <div key={i}><Typography variant="bodySmall" tone="inherit">第 {i + 1} 次</Typography><Typography variant="bodySmall" tone="inherit">{n * 120} kg · {(n * 2.1).toFixed(1)} cm</Typography></div>) : <Typography variant="bodySmall" tone="muted">还没有记录</Typography>}</aside>}
    <div className="cg-workflow-cao-actions">{interactive ? <><Button variant="primary" onClick={() => phase === 'start' ? setPhase('stones') : addStone()} disabled={stones === 5}>{phase === 'start' ? '开始称重' : stones === 5 ? '石头用完了' : '投入一块石头'}</Button><Button onClick={reset}>重新开始</Button></> : <span className="cg-workflow-cao-start"><Typography variant="bodySmall" tone="inherit">开始称重 →</Typography></span>}</div>
  </div>;
}

export function WorkflowArtifactCard({ artifact, onOpen }: { artifact: WorkflowArtifact; onOpen: (artifact: WorkflowArtifact) => void }) {
  if (artifact.startsWith('outline')) {
    const revised = artifact === 'outline-revised';
    const titles = revised ? ['曹冲称象：先试着称一称', '石头不够，如何估象重？', '从投石记录寻找趋势', '预测和观测差多少？', '用损失比较不同的模型', '寻找更合适的参数'] : ['曹冲称象：先试着称一称', '用回归公式估计象重', '预测和观测差多少？', '认识 MAE 与 MSE', '寻找更合适的参数', '检验模型的预测'];
    return <div className="cg-workflow-outline"><div className="cg-workflow-artifact-heading"><Typography variant="bodySmall" tone="accent">outlines.json</Typography><Typography variant="bodySmall" tone={revised ? 'success' : 'muted'}>{revised ? '已调整知识顺序' : '大纲草案'}</Typography></div><div className="cg-workflow-outline-grid">{titles.map((title, i) => <div key={title} className={revised && (i === 1 || i === 2) ? 'is-revised' : ''}><Typography as="span" variant="bodySmall" tone="muted">{String(i + 1).padStart(2, '0')}</Typography><Typography variant="bodySmall" tone="inherit">{title}</Typography></div>)}</div></div>;
  }
  const design = artifact.startsWith('design');
  return <div className="cg-workflow-artifact"><Button className="cg-workflow-preview-link" onClick={() => onOpen(artifact)} aria-label={design ? '放大查看设计示意图' : '打开网页预览'}><CaoChongPreview firstDesign={artifact === 'design-first'} /><span className="cg-workflow-preview-open"><Typography variant="bodySmall" tone="inherit">{design ? '放大设计图 ↗' : '打开网页预览 ↗'}</Typography></span></Button><div className="cg-workflow-artifact-caption"><Typography variant="bodySmall" tone="muted">{design ? `第一页 · 设计示意图 ${artifact === 'design-first' ? '01' : '02'}` : artifact === 'audit' || artifact === 'reviewed' ? '课件预览 · 浏览关键页面' : '曹冲称象 · 页面预览'}</Typography>{artifact === 'page-fixed' && <Typography variant="bodySmall" tone="success">已更新</Typography>}</div></div>;
}

export function WorkflowBrowser({ artifact }: { artifact: WorkflowArtifact }) {
  const [page, setPage] = useState(0);
  const audit = artifact === 'audit' || artifact === 'reviewed';
  return <div className="cg-workflow-browser"><div className="cg-workflow-address"><span aria-hidden="true">‹　›　↻</span><Typography variant="bodySmall" tone="muted">localhost:5173 / modules / regression-loss</Typography></div>{audit && <nav className="cg-workflow-browser-pages" aria-label="课件预览页面">{['01 曹冲称象', '02 石头不够，如何估重？', '03 预测误差'].map((title, i) => <Button key={title} active={page === i} onClick={() => setPage(i)}>{title}</Button>)}</nav>}
    <div className="cg-workflow-browser-viewport">{page === 0 ? <CaoChongPreview key={artifact} interactive fixed={artifact !== 'page-bug'} /> : <div className="cg-workflow-regression"><Typography variant="h2" tone="accent">{page === 1 ? '石头不够，如何估计象重？' : '预测和观测，差了多少？'}</Typography>{artifact === 'reviewed' && <Typography variant="bodySmall" tone="success">这些点来自刚才的投石记录</Typography>}<svg viewBox="0 0 800 300" role="img" aria-label="投石记录散点与预测趋势线的示意图"><path d="M80 20v240h650" fill="none" stroke="#9bb2c7" strokeWidth="2"/><path d="M80 260 680 40" stroke="#378fcc" strokeWidth="4"/>{[120, 210, 300, 390, 480].map((x, i) => <g key={x}><circle cx={x} cy={250 - i * 38 + (i % 2 ? -24 : 8)} r="8" fill="#e9a33a"/>{page === 2 && <path d={`M${x} ${250 - i * 38 + (i % 2 ? -24 : 8)}V${260 - (x - 80) * 220 / 600}`} stroke="#c65c51" strokeWidth="4"/>}</g>)}</svg><Typography variant="body" tone="accent">{page === 1 ? '根据已有记录，试着寻找一条趋势线。' : '同一个载重下，比较观测与预测的深度。'}</Typography></div>}</div><Typography variant="bodySmall" tone="muted" className="cg-workflow-browser-status">{audit ? `课堂浏览 · ${page + 1} / 3 个示例页面` : '第一页 · 点击称重、投石，再试试重新开始'}</Typography></div>;
}
