import { Typography } from "@shuku/course-style/react";
import outline from '../outlines.json';
import './CourseCoverPage.css';

export const COURSE_TOPICS = 'KV Cache · FlashAttention · MLA';

function Tiles({ x, y, cols, rows, color }: {
  x: number; y: number; cols: number; rows: number; color: string;
}) {
  return <g shuku-edit-id="e-57a082e9-5b93-459e-bbfd-27a29906f17e" fill={color}>{Array.from({ length: cols * rows }, (_, i) =>
    <rect shuku-edit-id="e-c86201d0-fe93-4d24-8d55-f8bbd7c083a7" key={i} x={x + i % cols * 15} y={y + Math.floor(i / cols) * 15} width="12" height="12" rx="1" />
  )}</g>;
}

function Arrow({ x, y }: { x: number; y: number }) {
  return <path shuku-edit-id="e-d35265ee-7f06-4bb5-80e3-58523d36fbc0" d={`M${x} ${y}h32m-8 -7 8 7-8 7`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />;
}

export function CourseCoverPage() {
  return <section shuku-edit-id="e-68a89d7f-64f7-4c76-901e-0785484ccbd8" className="kvc-cover" aria-labelledby="kvc-cover-title">
    <header shuku-edit-id="e-4725fc16-03b2-4bd7-b6c1-5bcfde306482" className="kvc-cover-heading">
      <Typography shuku-edit-id="e-94575c76-26f8-4161-877f-c8c71a98aac0" id="kvc-cover-title" as="h1" variant="display" align="center">{outline.title}</Typography>
    </header>
    <div shuku-edit-id="e-c688e267-7c4b-4639-aa11-98acc67d36c1" className="kvc-cover-topics">
      <div shuku-edit-id="e-662b1b96-229f-44a0-9b6b-3b1317499391" className="kvc-cover-topic">
        <svg shuku-edit-id="e-35972a88-f671-4022-b586-c093fda6fd2b" viewBox="0 0 260 150" role="img" aria-label="旧 K、V 保留，追加新 token 的 K、V">
          <Tiles x={18} y={51} cols={4} rows={1} color="#d9b65e" />
          <Tiles x={18} y={81} cols={4} rows={1} color="#d58888" />
          <Arrow x={94} y={72} />
          <Tiles x={144} y={51} cols={4} rows={1} color="#d9b65e" />
          <Tiles x={144} y={81} cols={4} rows={1} color="#d58888" />
          <Tiles x={210} y={51} cols={1} rows={1} color="#a97613" />
          <Tiles x={210} y={81} cols={1} rows={1} color="#bf4e56" />
        </svg>
        <Typography shuku-edit-id="e-b2de96d1-e0ea-482b-963d-5d84237d35fd" as="h2" variant="h2" align="center">KV Cache</Typography>
      </div>
      <div shuku-edit-id="e-307a0ab2-85b4-4588-a77d-e984015efc49" className="kvc-cover-topic">
        <svg shuku-edit-id="e-891610d6-ccff-4b04-9bde-a0813d3d0dd3" viewBox="0 0 260 150" role="img" aria-label="完整注意力矩阵分块，当前只计算一个块">
          <Tiles x={72} y={17} cols={4} rows={4} color="#c9bce1" />
          <Tiles x={138} y={17} cols={4} rows={4} color="#e5dfee" />
          <Tiles x={72} y={83} cols={4} rows={4} color="#e5dfee" />
          <Tiles x={138} y={83} cols={4} rows={4} color="#e5dfee" />
          <rect shuku-edit-id="e-81c5c964-e142-4957-acf5-3e51a3b17b9d" x="66" y="11" width="69" height="69" rx="4" fill="none" stroke="#8966b4" strokeWidth="2.5" />
        </svg>
        <Typography shuku-edit-id="e-f53d041b-2482-4dce-80d6-e5fb40f399d1" as="h2" variant="h2" align="center">FlashAttention</Typography>
      </div>
      <div shuku-edit-id="e-bd1725ad-410a-47cf-8477-b24a1b1aab06" className="kvc-cover-topic">
        <svg shuku-edit-id="e-bdadf211-3868-49cb-92b1-cc48a77bf753" viewBox="0 0 260 150" role="img" aria-label="完整内容 K、V 改为缓存更短的共享潜在向量">
          <Tiles x={24} y={35} cols={7} rows={2} color="#d9b65e" />
          <Tiles x={24} y={83} cols={7} rows={2} color="#d58888" />
          <Arrow x={143} y={72} />
          <Tiles x={198} y={51} cols={2} rows={3} color="#54a4b7" />
        </svg>
        <Typography shuku-edit-id="e-f1d4b0fa-a173-4a8b-a7e1-2216acd6e6bb" as="h2" variant="h2" align="center">MLA</Typography>
      </div>
    </div>
  </section>;
}
