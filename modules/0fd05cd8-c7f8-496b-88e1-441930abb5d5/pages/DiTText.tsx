import { useState } from 'react';
import { Button } from "@shuku/course-style/react/controls/Button";
import { Typography } from "@shuku/course-style/react/typography/Typography";
import { Frame, Text } from '../components/Diagrams';
import { Readout } from '../components/Story';
import { LessonSplit, TeachingPanel } from '../components/TeachingPanel';
import { Tokens } from '../components/Diagrams';
export function DiTText() {
  const [joint, setJoint] = useState(false);
  const [query, setQuery] = useState(0);
  const rows = joint ? 7 : 4;
  const cols = joint ? 7 : 3;
  return <Frame index={12} subtitle="打开注意力关系表：谁在发问，又允许读取谁？" takeaway="Cross-Attention 用视觉 Query 读取文本；联合注意力把两种序列纳入同一次交互。">
    <LessonSplit>
      <TeachingPanel title="① 选择交互结构" className="vga-sidebar">
        <Button active={!joint} data-testid="cross-mode" onClick={() => {setJoint(false);setQuery(0);}}>Cross-Attention</Button>
        <Button active={joint} data-testid="joint-mode" onClick={() => {setJoint(true);setQuery(0);}}>Joint Attention</Button>
        <div shuku-edit-id="e-a30fa749-8e54-4c21-80ed-2bd876477556" className="vga-token-legend"><Tokens count={3} warm /><div shuku-edit-id="e-ee9025b9-b72d-4098-96da-f26b0283dbac"><Text>文本序列</Text><Text muted>3 个文本 tokens</Text></div></div>
        <div shuku-edit-id="e-6000be5b-b98d-4636-a882-79a9bcf84b8b" className="vga-token-legend"><Tokens count={4} /><div shuku-edit-id="e-fab72903-d285-4d88-9580-b9f43319bc47"><Text>视觉序列</Text><Text muted>4 个视觉 tokens</Text></div></div>
        <Readout label="允许建立的 Query / Key 配对" value={`${rows} × ${cols} = ${rows*cols}`} warm />
      </TeachingPanel>
      <TeachingPanel title={joint ? '② 文本与视觉 · 联合交互' : '② 视觉 Query 读取文本 Key'} className="vga-matrix-panel">
        <div shuku-edit-id="e-5ddcfb75-da9e-4079-a979-bed62cdb77e2" className="vga-attention-board"><div shuku-edit-id="e-feae920d-aadc-4fa0-bf35-94f287cc2f3f" className="vga-center"><Text>{joint ? 'Key：文本 + 视觉' : 'Key：3 个文本 tokens'}</Text><div shuku-edit-id="e-efbffcbe-a358-40a0-be02-0debde8c1045" className="vga-attention-matrix" data-testid="attention-matrix" data-rows={rows} data-cols={cols} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>{Array.from({length:rows*cols},(_,i) => {const row=Math.floor(i/cols);const col=i%cols;return <button shuku-edit-id="e-163ed7f5-5992-43f0-9dbb-97e87c1f392a" key={i} type="button" className={query===row ? 'is-query' : ''} style={{ background: joint && col>=3 ? '#458fe3' : '#f4a44d',opacity:query===row?1:.25 }} aria-label={`查询第 ${row+1} 行与第 ${col+1} 列的关系`} onClick={() => setQuery(row)} />;})}</div><Text>{joint ? 'Query：文本 + 视觉' : 'Query：4 个视觉 tokens'}</Text></div><div shuku-edit-id="e-5d9c2c8e-4999-416a-9e93-ea1c78b2a2fc" className="vga-stack"><Typography variant="h3" tone="accent">第 {query+1} 个 Query</Typography><Text>{joint ? query<3 ? '来自文本，可以读取文本与视觉。' : '来自视觉，可以读取两种序列。' : '来自视觉，读取文本 Key / Value。'}</Text><Text muted>点击一行，观察允许读取的对象。</Text></div></div>
        <div shuku-edit-id="e-ca88b648-f20f-4a77-8588-b2bf1167252d" className="vga-panel-callout"><Text>矩阵表示允许的关系，并非实测权重。</Text><Text muted>此页对照文本条件主干的常见结构。</Text></div>
      </TeachingPanel>
    </LessonSplit>
  </Frame>;
}
