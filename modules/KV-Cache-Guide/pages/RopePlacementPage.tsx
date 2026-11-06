import { useId, type CSSProperties } from 'react';
import { MathFormulaStatic, Typography } from '../../shared/react';
import { FlowMatrix } from '../components/FlowMatrix';
import './RopePlacementPage.css';

function position(x: number, y: number): CSSProperties {
  return { left: `${x / 1488 * 100}%`, top: `${y / 600 * 100}%` };
}

function Matrix({ x, y, latex, tone, rotated = false, square = false }: {
  x: number; y: number; latex: string; tone: 'neutral' | 'q' | 'k' | 'v' | 'score' | 'output'; rotated?: boolean; square?: boolean;
}) {
  return <div className={`rpb-node ${rotated ? 'rpb-node--rotated' : ''}`} style={position(x, y)}>
    <FlowMatrix label={<MathFormulaStatic latex={latex} />} shape="" rows={4} columns={square ? 4 : 6} tone={tone} />
  </div>;
}

function Rotation({ y }: { y: number }) {
  return <div className="rpb-rotation" style={position(480, y)}>
    <svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="22" /><path d="M32 32L51 21 M32 32L39 12 M51 21A22 22 0 0 0 39 12 M42 10L39 12L40 16" /><circle cx="32" cy="32" r="2" /></svg>
    <Typography as="strong" variant="h2" tone="inherit">RoPE</Typography>
  </div>;
}

export function RopePlacementPage() {
  const marker = `rpb-${useId().replace(/:/g, '')}`;
  return <section className="rpb-slide" aria-label="前面省略的位置处理：RoPE 位于 Q、K 生成之后，匹配计算之前，V 不旋转">
    <Typography as="h1" variant="h1" align="center">补上此前省略的位置编码：RoPE</Typography>
    <main className="rpb-diagram" aria-label="X 生成 Q、K、V；Q、K 分别旋转后计算分数，缩放、遮罩并 Softmax 后与 V 相乘得到 O">
      <svg className="rpb-wires" viewBox="0 0 1488 600" preserveAspectRatio="none" aria-hidden="true">
        <defs><marker id={marker} markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M1 1L8 4.5L1 8" /></marker></defs>
        <g markerEnd={`url(#${marker})`}>
          <path d="M148 325C190 325 185 130 220 130" />
          <path d="M148 325H220" />
          <path d="M148 325C190 325 185 530 220 530" />
          <path className="rpb-wire--position" d="M350 130H404" />
          <path className="rpb-wire--position" d="M556 130H615" />
          <path className="rpb-wire--position" d="M350 340H404" />
          <path className="rpb-wire--position" d="M556 340H615" />
          <path d="M745 130C800 130 790 215 842 215" />
          <path d="M745 340C800 340 790 255 842 255" />
          <path d="M978 235H1020" />
          <path d="M1172 235H1228" />
          <path d="M1290 235H1335" />
          <path className="rpb-wire--v" d="M350 530H1260V278" />
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
      <Typography as="p" variant="body" align="center" className="rpb-score-label" style={position(910, 330)}>匹配分数</Typography>
      <div className="rpb-normalize" style={position(1095, 235)}><Typography as="p" variant="bodySmall" tone="muted" align="center">缩放 · 遮罩</Typography><Typography as="p" variant="h3" align="center">Softmax</Typography></div>
      <Typography as="span" variant="h1" className="rpb-multiply" style={position(1260, 235)}>×</Typography>
      <Matrix x={1400} y={215} latex="O" tone="output" />
    </main>
    <Typography as="p" variant="h2" align="center" className="rpb-caption">前面暂未展示：Q、K 按位置旋转后，再计算匹配分数。</Typography>
  </section>;
}
