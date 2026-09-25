import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import './SparseConnectivityPage.css';

const inputNodes = Array.from({ length: 16 }, (_, index) => index);
const outputNodes = Array.from({ length: 4 }, (_, index) => index);

function DenseConnectionDiagram() {
  const inputs = inputNodes.map((index) => ({ x: 46 + (index % 4) * 43, y: 45 + Math.floor(index / 4) * 43 }));
  const outputs = outputNodes.map((index) => ({ x: index % 2 ? 698 : 603, y: index < 2 ? 88 : 212 }));

  return (
    <svg className="ck-sparse__diagram-svg" viewBox="0 0 760 300" role="img" aria-label="全连接层中，十六个输入位置都连接到四个输出位置">
      {inputs.flatMap((input, inputIndex) => outputs.map((output, outputIndex) => (
        <line key={`${inputIndex}-${outputIndex}`} x1={input.x + 15} y1={input.y + 15} x2={output.x} y2={output.y} />
      )))}
      {inputs.map((point, index) => <rect key={`i-${index}`} className="ck-sparse__dense-input-node" x={point.x} y={point.y} width="30" height="30" rx="3" />)}
      {outputs.map((point, index) => <circle key={`o-${index}`} className="ck-sparse__dense-output-node" cx={point.x} cy={point.y} r="24" />)}
    </svg>
  );
}

function ConvolutionDiagram() {
  const cell = 42;
  const gap = 3;
  const inputX = 30;
  const inputY = 54;
  const kernelX = 340;
  const kernelY = 102;
  const outputX = 602;
  const outputY = 96;
  const inputCells = inputNodes.map((index) => ({ x: inputX + (index % 4) * (cell + gap), y: inputY + Math.floor(index / 4) * (cell + gap), row: Math.floor(index / 4), col: index % 4 }));

  return (
    <svg className="ck-sparse__diagram-svg" viewBox="0 0 760 300" role="img" aria-label="三乘三卷积核只连接局部输入区域，并在四个位置共享使用，生成二乘二输出">
      <defs><marker id="ck-sparse-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="currentColor" /></marker></defs>
      {inputCells.map(({ x, y, row, col }, index) => <rect key={index} className={row < 3 && col < 3 ? 'ck-sparse__conv-input-node is-local' : 'ck-sparse__conv-input-node'} x={x} y={y} width={cell} height={cell} rx="2" />)}
      {[1, 2, 3].map((offset) => <rect key={offset} className="ck-sparse__window-outline" x={inputX + (offset === 1 ? 0 : (offset === 2 ? cell + gap : 0))} y={inputY + (offset === 3 ? cell + gap : 0)} width={cell * 3 + gap * 2} height={cell * 3 + gap * 2} rx="3" />)}
      <line className="ck-sparse__flow-line" x1="224" y1="150" x2="314" y2="150" />
      <line className="ck-sparse__flow-line" x1="480" y1="150" x2="575" y2="150" />
      {Array.from({ length: 9 }, (_, index) => <rect key={`k-${index}`} className="ck-sparse__kernel-cell" x={kernelX + (index % 3) * 34} y={kernelY + Math.floor(index / 3) * 34} width="31" height="31" rx="2" />)}
      {outputNodes.map((index) => <rect key={`o-${index}`} className="ck-sparse__conv-output-node" x={outputX + (index % 2) * 54} y={outputY + Math.floor(index / 2) * 54} width="48" height="48" rx="3" />)}
    </svg>
  );
}

function FeatureNotes({ notes }: { notes: string[] }) {
  return <div className="ck-sparse__notes">{notes.map((note) => <div key={note}><span /><Typography variant="bodySmall" tone="muted">{note}</Typography></div>)}</div>;
}

export function SparseConnectivityPage() {
  return (
    <ContentBlock
      headingLevel={1}
      className="ck-sparse"
      title="稀疏连接：卷积为什么更省参数？"
      subtitle="保持输入与输出尺寸相同，对比全连接层和卷积层的连接范围与独立参数量。"
    >
      <div className="ck-sparse__comparison">
        <article className="ck-sparse__panel">
          <header className="ck-sparse__panel-head">
            <span className="ck-sparse__number"><Typography as="span" variant="h3" tone="light">1</Typography></span>
            <Typography as="h2" variant="h3" tone="accent">全连接</Typography>
            <Typography variant="bodySmall" tone="muted">16 个输入 → 4 个输出</Typography>
          </header>
          <div className="ck-sparse__diagram ck-sparse__diagram--dense">
            <DenseConnectionDiagram />
            <div className="ck-sparse__diagram-labels"><Typography variant="bodySmall" tone="muted">4 × 4 输入</Typography><Typography variant="bodySmall" tone="muted">2 × 2 输出</Typography></div>
          </div>
          <FeatureNotes notes={['每个输出都连接全部 16 个输入', '每条连接拥有独立权重']} />
          <div className="ck-sparse__parameter ck-sparse__parameter--dense">
            <Typography variant="bodySmall" tone="accent">独立参数</Typography>
            <MathFormulaBlock ariaLabel="全连接层参数数量，十六乘四加四等于六十八">
              <MathFormulaStatic latex={String.raw`16\times4+4=68`} />
            </MathFormulaBlock>
            <Typography variant="bodySmall" tone="muted">权重 64 + 偏置 4</Typography>
          </div>
        </article>

        <div className="ck-sparse__versus"><Typography as="span" variant="h3" tone="muted">VS</Typography></div>

        <article className="ck-sparse__panel">
          <header className="ck-sparse__panel-head">
            <span className="ck-sparse__number"><Typography as="span" variant="h3" tone="light">2</Typography></span>
            <Typography as="h2" variant="h3" tone="accent">卷积</Typography>
            <Typography variant="bodySmall" tone="muted">3 × 3 卷积核 → 2 × 2 输出</Typography>
          </header>
          <div className="ck-sparse__diagram ck-sparse__diagram--conv">
            <ConvolutionDiagram />
            <div className="ck-sparse__diagram-labels"><Typography variant="bodySmall" tone="muted">4 × 4 输入</Typography><Typography variant="bodySmall" tone="muted">局部窗口</Typography><Typography variant="bodySmall" tone="muted">共享权重</Typography><Typography variant="bodySmall" tone="muted">2 × 2 输出</Typography></div>
          </div>
          <FeatureNotes notes={['每个输出只连接局部 3 × 3 区域', '同一组权重在四个位置重复使用']} />
          <div className="ck-sparse__parameter ck-sparse__parameter--conv">
            <Typography variant="bodySmall" tone="accent">独立参数</Typography>
            <MathFormulaBlock ariaLabel="卷积层参数数量，三乘三加一等于十">
              <MathFormulaStatic latex={String.raw`3\times3+1=10`} />
            </MathFormulaBlock>
            <Typography variant="bodySmall" tone="muted">权重 9 + 偏置 1</Typography>
          </div>
        </article>
      </div>
      <footer className="ck-sparse__summary">
        <Typography as="span" variant="h3" tone="accent">68 → 10</Typography>
        <Typography variant="body">相同的 2 × 2 输出规模下，局部连接减少连接数，权重共享进一步减少独立参数。</Typography>
      </footer>
    </ContentBlock>
  );
}
