import { useId, type CSSProperties } from 'react';
import { MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { FlowMatrix } from '../components/FlowMatrix';
import './RopePlacementPage.css';

function position(x: number, y: number): CSSProperties {
  return { left: `${x / 1488 * 100}%`, top: `${y / 600 * 100}%` };
}

function Matrix({ x, y, latex, tone, rotated = false, square = false }: {
  x: number; y: number; latex: string; tone: 'neutral' | 'q' | 'k' | 'v' | 'score' | 'output'; rotated?: boolean; square?: boolean;
}) {
  return <div shuku-edit-id="e-63f19e1d-1a2e-4c97-9161-715659296124" className={`rpb-node ${rotated ? 'rpb-node--rotated' : ''}`} style={position(x, y)}>
    <FlowMatrix label={<MathFormulaStatic latex={latex} />} shape="" rows={4} columns={square ? 4 : 6} tone={tone} />
  </div>;
}

function Rotation({ y }: { y: number }) {
  return <div shuku-edit-id="e-b9173fe9-e8bd-493a-8acb-4b913bebd148" className="rpb-rotation" style={position(480, y)}>
    <svg shuku-edit-id="e-cca97691-12ef-4399-804a-d603f6f1a1a6" viewBox="0 0 64 64" aria-hidden="true"><circle shuku-edit-id="e-cba2eff4-cadf-4877-99a2-094f12b986ef" cx="32" cy="32" r="22" /><path shuku-edit-id="e-897d5ddf-6180-4aa3-8866-759595040fb5" d="M32 32L51 21 M32 32L39 12 M51 21A22 22 0 0 0 39 12 M42 10L39 12L40 16" /><circle shuku-edit-id="e-3f2e5c4a-3784-4d75-a59c-56d2021227d5" cx="32" cy="32" r="2" /></svg>
    <Typography shuku-edit-id="e-a14833f1-b25d-4797-b5ed-2e5e340296b6" as="strong" variant="h2" tone="inherit">RoPE</Typography>
  </div>;
}

export function RopePlacementPage() {
  const marker = `rpb-${useId().replace(/:/g, '')}`;
  return <section shuku-edit-id="e-76ae335f-13c9-4ca5-b3ee-8d4dc34391bc" className="rpb-slide" aria-label="前面省略的位置处理：RoPE 位于 Q、K 生成之后，匹配计算之前，V 不旋转">
    <Typography shuku-edit-id="e-6a432a74-e363-4f69-9f69-f96d824f7631" as="h1" variant="h1" align="center">补上此前省略的位置编码：RoPE</Typography>
    <main shuku-edit-id="e-ddd2e3f6-486c-414c-b599-4f952770745d" className="rpb-diagram" aria-label="X 生成 Q、K、V；Q、K 分别旋转后计算分数，缩放、遮罩并 Softmax 后与 V 相乘得到 O">
      <svg shuku-edit-id="e-25f7e18e-bfad-4b56-af25-f066a091879e" className="rpb-wires" viewBox="0 0 1488 600" preserveAspectRatio="none" aria-hidden="true">
        <defs shuku-edit-id="e-31286ee0-b99a-4137-9b7e-936f88ec1af5"><marker shuku-edit-id="e-701f2134-3b9e-48e7-9fdc-a43b2ba1850f" id={marker} markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path shuku-edit-id="e-445e7999-e0b9-4221-859e-404363f31ac4" d="M1 1L8 4.5L1 8" /></marker></defs>
        <g shuku-edit-id="e-8e5f7f0e-70e7-4a18-a0b6-1fac76720e1e" markerEnd={`url(#${marker})`}>
          <path shuku-edit-id="e-04480721-eb68-49fd-a542-b2f8da3bf437" d="M148 325C190 325 185 130 220 130" />
          <path shuku-edit-id="e-6be149ee-17b5-4c75-b4c2-e0c04ce6701a" d="M148 325H220" />
          <path shuku-edit-id="e-52cb5342-b4a3-4914-b63c-d2a84f0cc772" d="M148 325C190 325 185 530 220 530" />
          <path shuku-edit-id="e-564e0673-ca8e-4a17-a9a8-3803b13f0cc1" className="rpb-wire--position" d="M350 130H404" />
          <path shuku-edit-id="e-29f0445e-f2d6-4113-ba70-2a527d711521" className="rpb-wire--position" d="M556 130H615" />
          <path shuku-edit-id="e-4efa27ac-b495-435a-9dd5-ebf0dce4b17e" className="rpb-wire--position" d="M350 340H404" />
          <path shuku-edit-id="e-69902553-9e9f-490c-87c2-d206eaa093c8" className="rpb-wire--position" d="M556 340H615" />
          <path shuku-edit-id="e-42ba36f4-4fbf-41ec-8d65-ca96af464725" d="M745 130C800 130 790 215 842 215" />
          <path shuku-edit-id="e-c844c2d8-d6f9-403f-b8eb-d81d469154a1" d="M745 340C800 340 790 255 842 255" />
          <path shuku-edit-id="e-27809f01-6298-4f61-bd83-d70a3186cdc3" d="M978 235H1020" />
          <path shuku-edit-id="e-43c3164c-5985-44a0-96e9-e1005f0b360e" d="M1172 235H1228" />
          <path shuku-edit-id="e-b9f810e0-d097-4ffa-87e3-ad507c3012aa" d="M1290 235H1335" />
          <path shuku-edit-id="e-a8ebffc7-0c81-4ee2-85df-0d0030947bdf" className="rpb-wire--v" d="M350 530H1260V278" />
        </g>
      </svg>
      <Matrix x={85} y={305} latex="X" tone="neutral" />
      <Matrix x={285} y={110} latex="Q" tone="q" />
      <Matrix x={285} y={320} latex="K" tone="k" />
      <Matrix x={285} y={510} latex="V" tone="v" />
      <Rotation y={130} /><Rotation y={340} />
      <Matrix x={680} y={110} latex="Q'" tone="q" rotated />
      <Matrix x={680} y={320} latex="K'" tone="k" rotated />
      <Matrix x={910} y={215} latex="S" tone="score" square />
      <Typography shuku-edit-id="e-5c246ac4-6025-4a32-8dc6-7839c5f2b930" as="p" variant="body" align="center" className="rpb-score-label" style={position(910, 330)}>匹配分数</Typography>
      <div shuku-edit-id="e-f0b9bf31-6da8-4de3-9174-d89e268c8f03" className="rpb-normalize" style={position(1095, 235)}><Typography shuku-edit-id="e-b1deb2c1-a2cb-4f90-9828-d60480b3d4a8" as="p" variant="bodySmall" tone="muted" align="center">缩放 · 遮罩</Typography><Typography shuku-edit-id="e-e557b382-5c36-498c-8b13-d0839d041d58" as="p" variant="h3" align="center">Softmax</Typography></div>
      <Typography shuku-edit-id="e-4a8ff1b0-8794-4c3a-8cb9-47c0af5e9003" as="span" variant="h1" className="rpb-multiply" style={position(1260, 235)}>×</Typography>
      <Matrix x={1400} y={215} latex="O" tone="output" />
    </main>
    <Typography shuku-edit-id="e-83a6a0ff-d85d-434b-a6d3-80226524844d" as="p" variant="h2" align="center" className="rpb-caption">前面暂未展示：Q、K 按位置旋转后，再计算匹配分数。</Typography>
  </section>;
}
