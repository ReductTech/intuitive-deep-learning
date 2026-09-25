import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import './WeightSharingPage.css';

const matrixCells = Array.from({ length: 9 }, (_, index) => index);
const positions = [
  { x: 40, y: 38 },
  { x: 170, y: 38 },
  { x: 40, y: 168 },
  { x: 170, y: 168 },
];

function WeightMatrix({ x, y, shared = false, index = 0 }: { x: number; y: number; shared?: boolean; index?: number }) {
  return (
    <g className={shared ? 'ck-share__matrix is-shared' : 'ck-share__matrix'} transform={`translate(${x} ${y})`}>
      {matrixCells.map((cell) => <rect key={cell} x={(cell % 3) * 18} y={Math.floor(cell / 3) * 18} width="16" height="16" rx="2" />)}
      {!shared && <text x="24" y="65">W{index + 1}</text>}
    </g>
  );
}

function NonSharedDiagram() {
  return (
    <svg className="ck-share__svg" viewBox="0 0 520 270" role="img" aria-label="四个局部位置分别使用四组独立的卷积核权重">
      <rect className="ck-share__input-plane" x="26" y="28" width="190" height="190" rx="4" />
      {Array.from({ length: 16 }, (_, index) => <rect key={index} className="ck-share__input-cell" x={31 + (index % 4) * 46} y={33 + Math.floor(index / 4) * 46} width="41" height="41" rx="2" />)}
      {positions.map((position, index) => <rect key={index} className="ck-share__window" x={31 + (index % 2) * 46} y={33 + Math.floor(index / 2) * 46} width="133" height="133" rx="3" />)}
      {positions.map((position, index) => <line key={`line-${index}`} className="ck-share__connector" x1={216} y1={120} x2={286 + (index % 2) * 106} y2={64 + Math.floor(index / 2) * 105} />)}
      {positions.map((position, index) => <WeightMatrix key={index} x={286 + (index % 2) * 106} y={30 + Math.floor(index / 2) * 105} index={index} />)}
      <text className="ck-share__label" x="90" y="244">输入图像 X</text>
      <text className="ck-share__label" x="342" y="244">W₁、W₂、W₃、W₄</text>
    </svg>
  );
}

function SharedDiagram() {
  return (
    <svg className="ck-share__svg" viewBox="0 0 520 270" role="img" aria-label="四个局部位置重复使用同一个卷积核权重">
      <rect className="ck-share__input-plane" x="26" y="28" width="190" height="190" rx="4" />
      {Array.from({ length: 16 }, (_, index) => <rect key={index} className="ck-share__input-cell" x={31 + (index % 4) * 46} y={33 + Math.floor(index / 4) * 46} width="41" height="41" rx="2" />)}
      {positions.map((position, index) => <rect key={index} className="ck-share__window is-shared" x={31 + (index % 2) * 46} y={33 + Math.floor(index / 2) * 46} width="133" height="133" rx="3" />)}
      {positions.map((position, index) => <line key={`line-${index}`} className="ck-share__shared-connector" x1={216} y1={120} x2={345} y2={120} />)}
      <WeightMatrix x={300} y={72} shared />
      <text className="ck-share__label" x="90" y="244">输入图像 X</text>
      <text className="ck-share__label" x="327" y="244">同一个卷积核 W</text>
    </svg>
  );
}

function NoteRow({ children }: { children: string }) {
  return <div className="ck-share__note"><span /><Typography variant="bodySmall" tone="muted">{children}</Typography></div>;
}

export function WeightSharingPage() {
  return (
    <ContentBlock headingLevel={1} className="ck-share" title="权重共享：同一个卷积核反复使用" subtitle="在相同的四个局部位置上，对比独立权重与共享权重的参数数量。">
      <div className="ck-share__comparison">
        <article className="ck-share__panel">
          <header className="ck-share__panel-head"><span className="ck-share__number"><Typography as="span" variant="h3" tone="light">1</Typography></span><Typography as="h2" variant="h3" tone="accent">不共享</Typography><Typography variant="bodySmall" tone="muted">每个位置一组权重</Typography></header>
          <div className="ck-share__diagram"><NonSharedDiagram /></div>
          <div className="ck-share__notes"><NoteRow>四个位置各自学习 W₁、W₂、W₃、W₄</NoteRow><NoteRow>相同形状也会被重复存储</NoteRow></div>
          <div className="ck-share__parameter"><Typography variant="bodySmall" tone="accent">独立参数</Typography><MathFormulaBlock ariaLabel="不共享权重的参数数量，九乘四加四等于四十"><MathFormulaStatic latex={String.raw`9\times4+4=40`} /></MathFormulaBlock><Typography variant="bodySmall" tone="muted">权重 36 + 偏置 4</Typography></div>
        </article>
        <div className="ck-share__versus"><Typography as="span" variant="h3" tone="muted">VS</Typography></div>
        <article className="ck-share__panel">
          <header className="ck-share__panel-head"><span className="ck-share__number"><Typography as="span" variant="h3" tone="light">2</Typography></span><Typography as="h2" variant="h3" tone="accent">共享</Typography><Typography variant="bodySmall" tone="muted">所有位置使用同一组权重</Typography></header>
          <div className="ck-share__diagram"><SharedDiagram /></div>
          <div className="ck-share__notes"><NoteRow>同一个卷积核 W 扫描所有位置</NoteRow><NoteRow>学到的模式可以在空间中复用</NoteRow></div>
          <div className="ck-share__parameter is-shared"><Typography variant="bodySmall" tone="accent">独立参数</Typography><MathFormulaBlock ariaLabel="共享权重的参数数量，九加一等于十"><MathFormulaStatic latex={String.raw`9+1=10`} /></MathFormulaBlock><Typography variant="bodySmall" tone="muted">权重 9 + 偏置 1</Typography></div>
        </article>
      </div>
      <footer className="ck-share__summary"><Typography as="span" variant="h3" tone="accent">40 → 10</Typography><Typography variant="body">权重共享不改变扫描位置的数量，却把四组独立权重压缩成一组。</Typography></footer>
    </ContentBlock>
  );
}
