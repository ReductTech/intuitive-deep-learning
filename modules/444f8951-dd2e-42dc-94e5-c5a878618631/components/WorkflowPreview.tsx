import river_video_posterAsset0 from '../assets/workflow/river-video-poster.jpg';
import boat_rectangularAsset1 from '../assets/workflow/boat-rectangular.png';
import elephantAsset2 from '../assets/workflow/elephant.png';
import rockAsset3 from '../assets/workflow/rock.png';
import { useState, type CSSProperties } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
import outline from '../outlines.json';
import type { WorkflowArtifact } from './workflowDemo';


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
  return <div shuku-edit-id="e-5fd73334-b943-4a62-bc1b-897cd898f8f4" className={`cg-workflow-cao${interactive ? ' is-interactive' : ''}`} style={{ '--cg-workflow-river': `url("${river_video_posterAsset0}")` } as CSSProperties}>
    <div shuku-edit-id="e-c0c1b1c8-b3cc-43ff-ac62-a4d5187a591f" className="cg-workflow-cao-title"><Typography shuku-edit-id="e-29cd4951-fcf4-4d79-8a1e-3c3ad9143f80" variant="h2" tone="inherit">曹冲称象</Typography><Typography shuku-edit-id="e-5dfb3601-77fd-455b-8a39-f6e753d63ad7" variant="bodySmall" tone="inherit">一艘船，能称出大象多重吗？</Typography></div>
    <div shuku-edit-id="e-b5f4901c-ff34-4dde-9d27-59cf1f5a154d" className="cg-workflow-boat" style={{ transform: `translateY(${phase === 'start' ? 0 : stones * 5}px)` }}>
      <img shuku-edit-id="e-96c2446c-e785-4005-891e-9b6484c15162" className="cg-workflow-boat-back" src={boat_rectangularAsset1} alt="河面上的木船" />
      {phase === 'start' ? <img shuku-edit-id="e-9c95c4c8-9d59-4402-9812-e16ba9142125" className="cg-workflow-elephant" src={elephantAsset2} alt="站在木船上的大象" /> : Array.from({ length: stones }, (_, i) => <img shuku-edit-id="e-238c92c3-a737-4efc-853c-183d714e0bf6" key={i} className="cg-workflow-stone" style={{ left: `${28 + i * 9}%` }} src={rockAsset3} alt="" />)}
      <img shuku-edit-id="e-c03dad0b-19bb-4f7f-8654-82fde295a850" className="cg-workflow-boat-front" src={boat_rectangularAsset1} alt="" />
      {phase === 'stones' && <div shuku-edit-id="e-a7567cee-d2de-48ae-be31-eb28fef29480" className="cg-workflow-watermark"><Typography shuku-edit-id="e-5285edc4-c63b-4328-8b13-bba8f0f3c7d8" variant="bodySmall" tone="inherit">大象的水位刻痕</Typography></div>}
    </div>
    {firstDesign && <div shuku-edit-id="e-8dec462d-0303-4566-a793-41077c36d7c9" className="cg-workflow-early-answer"><Typography shuku-edit-id="e-9d8e28d8-5fcc-48a6-875e-2c61e3f67524" variant="bodySmall" tone="inherit">用石头替代大象，直到船沉到同一刻痕</Typography></div>}
    {interactive && <aside shuku-edit-id="e-a32359fe-132b-4dfa-ab0a-1d0bb1004046" className="cg-workflow-notebook"><Typography shuku-edit-id="e-a83e8fb0-61b0-4326-8199-65dd6eece939" variant="h3" tone="inherit">投石手记</Typography>{records.length ? records.map((n, i) => <div shuku-edit-id="e-195cc612-daf0-4bc9-9e0e-ed5a139419a8" key={i}><Typography shuku-edit-id="e-4a7cabdb-b458-4900-b1af-6e73f303eba2" variant="bodySmall" tone="inherit">第 {i + 1} 次</Typography><Typography shuku-edit-id="e-647ec271-adde-4582-a2e7-c0ed8123b1aa" variant="bodySmall" tone="inherit">{n * 120} kg · {(n * 2.1).toFixed(1)} cm</Typography></div>) : <Typography shuku-edit-id="e-29fd05eb-6b92-4572-95fc-94085ae1758a" variant="bodySmall" tone="muted">还没有记录</Typography>}</aside>}
    <div shuku-edit-id="e-d71da9be-f17f-4917-8b05-85cf971c783a" className="cg-workflow-cao-actions">{interactive ? <><Button variant="primary" onClick={() => phase === 'start' ? setPhase('stones') : addStone()} disabled={stones === 5}>{phase === 'start' ? '开始称重' : stones === 5 ? '石头用完了' : '投入一块石头'}</Button><Button onClick={reset}>重新开始</Button></> : <span shuku-edit-id="e-2a6553b8-3a90-44df-b50a-71f7aea646e4" className="cg-workflow-cao-start"><Typography shuku-edit-id="e-8378602a-ce7b-44a2-9ba5-1eee925c2bc7" variant="bodySmall" tone="inherit">开始称重 →</Typography></span>}</div>
  </div>;
}

export function WorkflowArtifactCard({ artifact, onOpen }: { artifact: WorkflowArtifact; onOpen: (artifact: WorkflowArtifact) => void }) {
  if (artifact.startsWith('outline')) {
    const revised = artifact === 'outline-revised';
    const titles = revised ? ['曹冲称象：先试着称一称', '石头不够，如何估象重？', '从投石记录寻找趋势', '预测和观测差多少？', '用损失比较不同的模型', '寻找更合适的参数'] : ['曹冲称象：先试着称一称', '用回归公式估计象重', '预测和观测差多少？', '认识 MAE 与 MSE', '寻找更合适的参数', '检验模型的预测'];
    return <div shuku-edit-id="e-f3c27cd7-1134-42d5-ac41-cf972fee01ca" className="cg-workflow-outline"><div shuku-edit-id="e-a32d4f74-f72c-4057-9f06-6e44b3e2bc7c" className="cg-workflow-artifact-heading"><Typography shuku-edit-id="e-5f17bf59-bc05-485b-87eb-ca3420b64545" variant="bodySmall" tone="accent">outlines.json</Typography><Typography shuku-edit-id="e-f4dde735-b47c-47c5-8667-93c7767e361d" variant="bodySmall" tone={revised ? 'success' : 'muted'}>{revised ? '已调整知识顺序' : '大纲草案'}</Typography></div><div shuku-edit-id="e-e467e1cc-2d60-4a3f-a54b-cefd04997201" className="cg-workflow-outline-grid">{titles.map((title, i) => <div shuku-edit-id="e-c274865a-5bf2-44b4-bfc8-3a1ae4941913" key={title} className={revised && (i === 1 || i === 2) ? 'is-revised' : ''}><Typography shuku-edit-id="e-047737d1-a343-4b8e-b492-cd1057cb2000" as="span" variant="bodySmall" tone="muted">{String(i + 1).padStart(2, '0')}</Typography><Typography shuku-edit-id="e-ed96fb5b-ca21-4fc3-bc03-ecfdcc26d278" variant="bodySmall" tone="inherit">{title}</Typography></div>)}</div></div>;
  }
  const design = artifact.startsWith('design');
  return <div shuku-edit-id="e-c56b0f6f-880d-4e0b-a2df-cdb0f0ab06d5" className="cg-workflow-artifact"><Button className="cg-workflow-preview-link" onClick={() => onOpen(artifact)} aria-label={design ? '放大查看设计示意图' : '打开网页预览'}><CaoChongPreview firstDesign={artifact === 'design-first'} /><span shuku-edit-id="e-82effa17-efb6-4cf0-bc6c-bce2612d4f8f" className="cg-workflow-preview-open"><Typography shuku-edit-id="e-8943af7c-f28a-47c1-9cea-bcf71a098b0c" variant="bodySmall" tone="inherit">{design ? '放大设计图 ↗' : '打开网页预览 ↗'}</Typography></span></Button><div shuku-edit-id="e-26720b24-c64a-40c9-b306-267f8253e113" className="cg-workflow-artifact-caption"><Typography shuku-edit-id="e-d9ee18c4-1e3a-483c-b99e-c064ac69ce54" variant="bodySmall" tone="muted">{design ? `第一页 · 设计示意图 ${artifact === 'design-first' ? '01' : '02'}` : artifact === 'audit' || artifact === 'reviewed' ? '实践作品预览 · 浏览关键页面' : '曹冲称象 · 页面预览'}</Typography>{artifact === 'page-fixed' && <Typography shuku-edit-id="e-68df567a-0bdf-4001-9c06-12943e68959c" variant="bodySmall" tone="success">已更新</Typography>}</div></div>;
}

export function WorkflowBrowser({ artifact }: { artifact: WorkflowArtifact }) {
  const [page, setPage] = useState(0);
  const audit = artifact === 'audit' || artifact === 'reviewed';
  return <div shuku-edit-id="e-38ce27b4-956d-44ed-b92d-7d532996d1b6" className="cg-workflow-browser"><div shuku-edit-id="e-c50114ef-a118-421c-945c-6cc70b5cac05" className="cg-workflow-address"><span shuku-edit-id="e-c1fe36a3-b363-458a-89e6-2fcbc96acad5" aria-hidden="true">‹　›　↻</span><Typography shuku-edit-id="e-4ceaafdf-1a1d-4ed1-a6e1-5a152eb8d3a2" variant="bodySmall" tone="muted">localhost:5173 / modules / regression-loss</Typography></div>{audit && <nav shuku-edit-id="e-e3eac79a-9d6e-462b-85f6-f9f7b1c5333f" className="cg-workflow-browser-pages" aria-label="实践作品预览页面">{['01 曹冲称象', '02 石头不够，如何估重？', '03 预测误差'].map((title, i) => <Button key={title} active={page === i} onClick={() => setPage(i)}>{title}</Button>)}</nav>}
    <div shuku-edit-id="e-e3e2aba9-7eb2-4d1a-9e5a-65bb11ff97db" className="cg-workflow-browser-viewport">{page === 0 ? <CaoChongPreview key={artifact} interactive fixed={artifact !== 'page-bug'} /> : <div shuku-edit-id="e-0c14d980-df58-4ca0-a177-a19a2cf78e4c" className="cg-workflow-regression"><Typography shuku-edit-id="e-d65d0dc6-44c6-4f16-984a-ac16ba3bda05" variant="h2" tone="accent">{page === 1 ? '石头不够，如何估计象重？' : '预测和观测，差了多少？'}</Typography>{artifact === 'reviewed' && <Typography shuku-edit-id="e-8616bbea-ec05-46f5-87bf-055346b03cac" variant="bodySmall" tone="success">这些点来自刚才的投石记录</Typography>}<svg shuku-edit-id="e-20835002-e641-44e7-a112-acc66b6bfb1e" viewBox="0 0 800 300" role="img" aria-label="投石记录散点与预测趋势线的示意图"><path shuku-edit-id="e-1bbc0438-b0f1-4501-94b1-60d058f6bf1c" d="M80 20v240h650" fill="none" stroke="#9bb2c7" strokeWidth="2"/><path shuku-edit-id="e-5cd231e1-3731-4807-a34e-6ea0089a7cf8" d="M80 260 680 40" stroke="#378fcc" strokeWidth="4"/>{[120, 210, 300, 390, 480].map((x, i) => <g shuku-edit-id="e-911d8dcb-67e2-4920-951b-f6f5e27f6ffa" key={x}><circle shuku-edit-id="e-85411f0d-144a-4993-a4ef-ed7ce8925009" cx={x} cy={250 - i * 38 + (i % 2 ? -24 : 8)} r="8" fill="#e9a33a"/>{page === 2 && <path shuku-edit-id="e-501271f9-d13a-4a57-8e0a-399c39154348" d={`M${x} ${250 - i * 38 + (i % 2 ? -24 : 8)}V${260 - (x - 80) * 220 / 600}`} stroke="#c65c51" strokeWidth="4"/>}</g>)}</svg><Typography shuku-edit-id="e-9c2afbc2-b5d4-4148-ad85-d12ad6e5fec0" variant="body" tone="accent">{page === 1 ? '根据已有记录，试着寻找一条趋势线。' : '同一个载重下，比较观测与预测的深度。'}</Typography></div>}</div><Typography shuku-edit-id="e-da08d5ff-4c54-4f77-9b83-13e863d0a648" variant="bodySmall" tone="muted" className="cg-workflow-browser-status">{audit ? `课堂浏览 · ${page + 1} / 3 个示例页面` : '第一页 · 点击称重、投石，再试试重新开始'}</Typography></div>;
}
