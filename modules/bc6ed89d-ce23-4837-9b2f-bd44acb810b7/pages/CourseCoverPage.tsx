import { Typography } from "@shuku/course-style/react";
import outline from '../outlines.json';
import './CourseCoverPage.css';

export const COURSE_TOPICS = 'KV Cache · FlashAttention · MLA';

function Tiles({ x, y, cols, rows, color }: {
  x: number; y: number; cols: number; rows: number; color: string;
}) {
  return <g fill={color}>{Array.from({ length: cols * rows }, (_, i) =>
    <rect key={i} x={x + i % cols * 15} y={y + Math.floor(i / cols) * 15} width="12" height="12" rx="1" />
  )}</g>;
}

function Arrow({ x, y }: { x: number; y: number }) {
  return <path d={`M${x} ${y}h32m-8 -7 8 7-8 7`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />;
}

export function CourseCoverPage() {
  return <section className="kvc-cover" aria-labelledby="kvc-cover-title">
    <header className="kvc-cover-heading">
      <Typography id="kvc-cover-title" as="h1" variant="display" align="center">{outline.title}</Typography>
    </header>
    <div className="kvc-cover-topics">
      <div className="kvc-cover-topic">
        <svg viewBox="0 0 260 150" role="img" aria-label="旧 K、V 保留，追加新 token 的 K、V">
          <Tiles x={18} y={51} cols={4} rows={1} color="#d9b65e" />
          <Tiles x={18} y={81} cols={4} rows={1} color="#d58888" />
          <Arrow x={94} y={72} />
          <Tiles x={144} y={51} cols={4} rows={1} color="#d9b65e" />
          <Tiles x={144} y={81} cols={4} rows={1} color="#d58888" />
          <Tiles x={210} y={51} cols={1} rows={1} color="#a97613" />
          <Tiles x={210} y={81} cols={1} rows={1} color="#bf4e56" />
        </svg>
        <Typography as="h2" variant="h2" align="center">KV Cache</Typography>
      </div>
      <div className="kvc-cover-topic">
        <svg viewBox="0 0 260 150" role="img" aria-label="完整注意力矩阵分块，当前只计算一个块">
          <Tiles x={72} y={17} cols={4} rows={4} color="#c9bce1" />
          <Tiles x={138} y={17} cols={4} rows={4} color="#e5dfee" />
          <Tiles x={72} y={83} cols={4} rows={4} color="#e5dfee" />
          <Tiles x={138} y={83} cols={4} rows={4} color="#e5dfee" />
          <rect x="66" y="11" width="69" height="69" rx="4" fill="none" stroke="#8966b4" strokeWidth="2.5" />
        </svg>
        <Typography as="h2" variant="h2" align="center">FlashAttention</Typography>
      </div>
      <div className="kvc-cover-topic">
        <svg viewBox="0 0 260 150" role="img" aria-label="完整内容 K、V 改为缓存更短的共享潜在向量">
          <Tiles x={24} y={35} cols={7} rows={2} color="#d9b65e" />
          <Tiles x={24} y={83} cols={7} rows={2} color="#d58888" />
          <Arrow x={143} y={72} />
          <Tiles x={198} y={51} cols={2} rows={3} color="#54a4b7" />
        </svg>
        <Typography as="h2" variant="h2" align="center">MLA</Typography>
      </div>
    </div>
  </section>;
}
