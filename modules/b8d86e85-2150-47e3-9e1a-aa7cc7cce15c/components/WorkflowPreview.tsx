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
  return <div shuku-edit-id="e-844e7054-289e-436b-8ef5-d46ffae84a38" className={`cg-workflow-cao${interactive ? ' is-interactive' : ''}`} style={{ '--cg-workflow-river': `url("${asset('river-video-poster.jpg')}")` } as CSSProperties}>
    <div shuku-edit-id="e-f46c2e78-9831-4801-8f7a-c3028969dd89" className="cg-workflow-cao-title"><Typography shuku-edit-id="e-f43ef23d-b891-4386-9d0b-ddf284f940f1" variant="h2" tone="inherit">曹冲称象</Typography><Typography shuku-edit-id="e-503fd125-4d6b-444b-932a-a0bd41874530" variant="bodySmall" tone="inherit">一艘船，能称出大象多重吗？</Typography></div>
    <div shuku-edit-id="e-3038fdef-9f2d-4ea6-8ff8-964d31ada0f6" className="cg-workflow-boat" style={{ transform: `translateY(${phase === 'start' ? 0 : stones * 5}px)` }}>
      <img shuku-edit-id="e-dcc86632-3530-42f1-869c-789794ae3b7d" className="cg-workflow-boat-back" src={asset('boat-rectangular.png')} alt="河面上的木船" />
      {phase === 'start' ? <img shuku-edit-id="e-54fd9c0e-3222-42fa-8b96-47934b04cca6" className="cg-workflow-elephant" src={asset('elephant.png')} alt="站在木船上的大象" /> : Array.from({ length: stones }, (_, i) => <img shuku-edit-id="e-01ac475b-3727-4574-8980-bed5d5e2ba9c" key={i} className="cg-workflow-stone" style={{ left: `${28 + i * 9}%` }} src={asset('rock.png')} alt="" />)}
      <img shuku-edit-id="e-8e14c9b4-97f6-4283-9b47-45027b7c5f81" className="cg-workflow-boat-front" src={asset('boat-rectangular.png')} alt="" />
      {phase === 'stones' && <div shuku-edit-id="e-8aabd194-40ed-45af-add6-051c71c959e8" className="cg-workflow-watermark"><Typography shuku-edit-id="e-d4f96ec8-112c-489a-9890-a93104224e5d" variant="bodySmall" tone="inherit">大象的水位刻痕</Typography></div>}
    </div>
    {firstDesign && <div shuku-edit-id="e-fcad1377-b402-432e-9a7c-025ad1a6b807" className="cg-workflow-early-answer"><Typography shuku-edit-id="e-e8a0b163-b021-4744-b8a1-3e287ded78ad" variant="bodySmall" tone="inherit">用石头替代大象，直到船沉到同一刻痕</Typography></div>}
    {interactive && <aside shuku-edit-id="e-34afda8c-0682-4482-8073-303af8105421" className="cg-workflow-notebook"><Typography shuku-edit-id="e-99890597-a5e3-4efe-b5a1-44e3cc10cc74" variant="h3" tone="inherit">投石手记</Typography>{records.length ? records.map((n, i) => <div shuku-edit-id="e-7429c2f8-5dd0-4b8b-9758-acf77d637e48" key={i}><Typography shuku-edit-id="e-54d32ae3-6e70-439c-a182-37374a1bc576" variant="bodySmall" tone="inherit">第 {i + 1} 次</Typography><Typography shuku-edit-id="e-9bae8e59-eedc-473a-9eaa-048168d4a9ec" variant="bodySmall" tone="inherit">{n * 120} kg · {(n * 2.1).toFixed(1)} cm</Typography></div>) : <Typography shuku-edit-id="e-c37d66bf-f910-4a83-8d76-419ad9231138" variant="bodySmall" tone="muted">还没有记录</Typography>}</aside>}
    <div shuku-edit-id="e-4d3c3d14-e3ba-40db-9739-bf905cf01266" className="cg-workflow-cao-actions">{interactive ? <><Button variant="primary" onClick={() => phase === 'start' ? setPhase('stones') : addStone()} disabled={stones === 5}>{phase === 'start' ? '开始称重' : stones === 5 ? '石头用完了' : '投入一块石头'}</Button><Button onClick={reset}>重新开始</Button></> : <span shuku-edit-id="e-5f6f2200-f1d0-47db-a349-8531b821f737" className="cg-workflow-cao-start"><Typography shuku-edit-id="e-4b90915c-7250-4423-a008-6991832a99cb" variant="bodySmall" tone="inherit">开始称重 →</Typography></span>}</div>
  </div>;
}

export function WorkflowArtifactCard({ artifact, onOpen }: { artifact: WorkflowArtifact; onOpen: (artifact: WorkflowArtifact) => void }) {
  if (artifact.startsWith('outline')) {
    const revised = artifact === 'outline-revised';
    const titles = revised ? ['曹冲称象：先试着称一称', '石头不够，如何估象重？', '从投石记录寻找趋势', '预测和观测差多少？', '用损失比较不同的模型', '寻找更合适的参数'] : ['曹冲称象：先试着称一称', '用回归公式估计象重', '预测和观测差多少？', '认识 MAE 与 MSE', '寻找更合适的参数', '检验模型的预测'];
    return <div shuku-edit-id="e-01713340-00c4-40df-bd25-490ddfd4e235" className="cg-workflow-outline"><div shuku-edit-id="e-759b867c-777e-4951-ba80-9fdf3d27805f" className="cg-workflow-artifact-heading"><Typography shuku-edit-id="e-f7627ce3-7dab-457c-800c-dc996a632aec" variant="bodySmall" tone="accent">outlines.json</Typography><Typography shuku-edit-id="e-1a75d0de-9afd-4e6a-bb42-ce7d7afeddd0" variant="bodySmall" tone={revised ? 'success' : 'muted'}>{revised ? '已调整知识顺序' : '大纲草案'}</Typography></div><div shuku-edit-id="e-b793eca5-b24a-4a57-b062-f4bd64585675" className="cg-workflow-outline-grid">{titles.map((title, i) => <div shuku-edit-id="e-0bd84238-dc9a-472d-8976-07a4f47e2b44" key={title} className={revised && (i === 1 || i === 2) ? 'is-revised' : ''}><Typography shuku-edit-id="e-4b440d4c-295c-413b-9db3-c158cb38fd35" as="span" variant="bodySmall" tone="muted">{String(i + 1).padStart(2, '0')}</Typography><Typography shuku-edit-id="e-52710db7-40ff-4b6d-810c-ec2055104e65" variant="bodySmall" tone="inherit">{title}</Typography></div>)}</div></div>;
  }
  const design = artifact.startsWith('design');
  return <div shuku-edit-id="e-269db1de-6d44-4533-92b4-76dbe3917106" className="cg-workflow-artifact"><Button className="cg-workflow-preview-link" onClick={() => onOpen(artifact)} aria-label={design ? '放大查看设计示意图' : '打开网页预览'}><CaoChongPreview firstDesign={artifact === 'design-first'} /><span shuku-edit-id="e-c057b281-f1e9-43d8-a522-9f0e67f6c1bc" className="cg-workflow-preview-open"><Typography shuku-edit-id="e-f603954a-1c61-4bbe-aeaa-5978868122f6" variant="bodySmall" tone="inherit">{design ? '放大设计图 ↗' : '打开网页预览 ↗'}</Typography></span></Button><div shuku-edit-id="e-53a07da7-2fff-4b29-ab47-8505ef5eab47" className="cg-workflow-artifact-caption"><Typography shuku-edit-id="e-d259fc18-9252-4c95-a335-3a90c28cc12d" variant="bodySmall" tone="muted">{design ? `第一页 · 设计示意图 ${artifact === 'design-first' ? '01' : '02'}` : artifact === 'audit' || artifact === 'reviewed' ? '实践作品预览 · 浏览关键页面' : '曹冲称象 · 页面预览'}</Typography>{artifact === 'page-fixed' && <Typography shuku-edit-id="e-1ed98c6f-f754-44c0-98f2-894d97a6dee9" variant="bodySmall" tone="success">已更新</Typography>}</div></div>;
}

export function WorkflowBrowser({ artifact }: { artifact: WorkflowArtifact }) {
  const [page, setPage] = useState(0);
  const audit = artifact === 'audit' || artifact === 'reviewed';
  return <div shuku-edit-id="e-d38fe253-5aad-4eca-92b2-9360748983c3" className="cg-workflow-browser"><div shuku-edit-id="e-316b529f-ac43-47d9-b3ed-b0bf221fb704" className="cg-workflow-address"><span shuku-edit-id="e-0d0cb894-0437-4f2e-9166-aaea0b4a1b7a" aria-hidden="true">‹　›　↻</span><Typography shuku-edit-id="e-55ed9fd4-c376-4bb9-b0a6-09cf134dc68b" variant="bodySmall" tone="muted">localhost:5173 / modules / regression-loss</Typography></div>{audit && <nav shuku-edit-id="e-94a83ca0-33ef-4f5c-b9f2-12fb7a80b878" className="cg-workflow-browser-pages" aria-label="实践作品预览页面">{['01 曹冲称象', '02 石头不够，如何估重？', '03 预测误差'].map((title, i) => <Button key={title} active={page === i} onClick={() => setPage(i)}>{title}</Button>)}</nav>}
    <div shuku-edit-id="e-e4e463b4-d31a-4274-9681-b0279cb57148" className="cg-workflow-browser-viewport">{page === 0 ? <CaoChongPreview key={artifact} interactive fixed={artifact !== 'page-bug'} /> : <div shuku-edit-id="e-1806c892-cc52-4f8c-966c-b1fc682c2a64" className="cg-workflow-regression"><Typography shuku-edit-id="e-6ca82e6d-e441-4ad3-94d7-aec8a11271ff" variant="h2" tone="accent">{page === 1 ? '石头不够，如何估计象重？' : '预测和观测，差了多少？'}</Typography>{artifact === 'reviewed' && <Typography shuku-edit-id="e-1c1a76d7-1468-4ad9-b8ba-0083e52d06be" variant="bodySmall" tone="success">这些点来自刚才的投石记录</Typography>}<svg shuku-edit-id="e-05e9d36e-d7b5-49c7-bec1-3b86f6b6b1c6" viewBox="0 0 800 300" role="img" aria-label="投石记录散点与预测趋势线的示意图"><path shuku-edit-id="e-5b548a02-b933-44c2-9fea-395080893772" d="M80 20v240h650" fill="none" stroke="#9bb2c7" strokeWidth="2"/><path shuku-edit-id="e-7119e49e-dcc7-42d5-9b0c-714ea4a9f9d0" d="M80 260 680 40" stroke="#378fcc" strokeWidth="4"/>{[120, 210, 300, 390, 480].map((x, i) => <g shuku-edit-id="e-df671a64-d290-495a-9b13-8246d39cc43f" key={x}><circle shuku-edit-id="e-7f2dc92d-e6d9-4f75-9319-5f090f2f9e57" cx={x} cy={250 - i * 38 + (i % 2 ? -24 : 8)} r="8" fill="#e9a33a"/>{page === 2 && <path shuku-edit-id="e-3bbd0365-3aea-4353-b814-5f2af6bd4070" d={`M${x} ${250 - i * 38 + (i % 2 ? -24 : 8)}V${260 - (x - 80) * 220 / 600}`} stroke="#c65c51" strokeWidth="4"/>}</g>)}</svg><Typography shuku-edit-id="e-9adeea11-f1e9-4e9e-87aa-090037c66f65" variant="body" tone="accent">{page === 1 ? '根据已有记录，试着寻找一条趋势线。' : '同一个载重下，比较观测与预测的深度。'}</Typography></div>}</div><Typography shuku-edit-id="e-288ff9ae-05d8-4a2d-baf8-3e1e00c2c350" variant="bodySmall" tone="muted" className="cg-workflow-browser-status">{audit ? `课堂浏览 · ${page + 1} / 3 个示例页面` : '第一页 · 点击称重、投石，再试试重新开始'}</Typography></div>;
}
