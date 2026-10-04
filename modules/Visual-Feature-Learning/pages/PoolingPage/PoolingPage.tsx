import { useState } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import './PoolingPage.css';

const INPUT = [
  [1, 3, 2, 4],
  [0, 2, 1, 3],
  [5, 6, 2, 1],
  [4, 1, 8, 7],
] as const;

type PoolingMode = 'max' | 'average';

function windowValues(index: number) {
  const top = Math.floor(index / 2) * 2;
  const left = (index % 2) * 2;
  return [INPUT[top][left], INPUT[top][left + 1], INPUT[top + 1][left], INPUT[top + 1][left + 1]];
}

function pooledValue(index: number, mode: PoolingMode) {
  const values = windowValues(index);
  return mode === 'max' ? Math.max(...values) : values.reduce<number>((sum, value) => sum + value, 0) / 4;
}

export function PoolingPage() {
  const [mode, setMode] = useState<PoolingMode>('max');
  const [active, setActive] = useState(0);
  const values = windowValues(active);
  const result = pooledValue(active, mode);
  const top = Math.floor(active / 2) * 2;
  const left = (active % 2) * 2;
  const formula = mode === 'max'
    ? `\\max\\{${values.join(',')}\\}=${result}`
    : `\\frac{${values.join('+')}}{4}=${result}`;

  function chooseMode(next: PoolingMode) { setMode(next); }
  function chooseWindow(index: number) { setActive(index); }

  return <ContentBlock
    headingLevel={1}
    className="vfl-pooling-page"
    title="池化：汇聚局部响应"
    subtitle="每个局部窗口保留一个汇总值，得到更小的特征图。"
  >
    <div className="vfl-pooling-workspace">
      <section className="vfl-pooling-stage" aria-label="输入特征图">
        <div className="vfl-pooling-stage-title"><Typography as="h2" variant="h3" tone="accent">输入特征图</Typography><MathFormulaBlock ariaLabel="四乘四"><MathFormulaStatic latex={'4\\times4'} /></MathFormulaBlock></div>
        <div className="vfl-pooling-input-grid" role="grid" aria-label="四乘四输入特征图">
          {INPUT.flatMap((row, rowIndex) => row.map((value, colIndex) => {
            const selected = rowIndex >= top && rowIndex < top + 2 && colIndex >= left && colIndex < left + 2;
            const strongest = mode === 'max' && selected && value === result;
            return <div key={`${rowIndex}-${colIndex}`} role="gridcell" aria-selected={selected} className={`vfl-pooling-input-cell${selected ? ' is-window' : ''}${strongest ? ' is-strongest' : ''}`}>
              <Typography as="span" variant="h2" tone="inherit">{value}</Typography>
            </div>;
          }))}
          <div className="vfl-pooling-window" aria-hidden="true" style={{ left: `${left * 25}%`, top: `${top * 25}%` }} />
        </div>
        <Typography as="p" variant="body" tone="muted">蓝框内：参与汇聚的四个数值</Typography>
      </section>

      <div className="vfl-pooling-arrow" aria-hidden="true">→</div>

      <section className="vfl-pooling-operation" aria-label="池化计算">
        <div className="vfl-pooling-modes" role="group" aria-label="选择池化方式">
          <Button variant={mode === 'max' ? 'primary' : 'default'} active={mode === 'max'} aria-pressed={mode === 'max'} onClick={() => chooseMode('max')}><Typography as="span" variant="body" tone="inherit">最大池化</Typography></Button>
          <Button variant={mode === 'average' ? 'primary' : 'default'} active={mode === 'average'} aria-pressed={mode === 'average'} onClick={() => chooseMode('average')}><Typography as="span" variant="body" tone="inherit">平均池化</Typography></Button>
        </div>
        <MathFormulaBlock className="vfl-pooling-setting" ariaLabel="池化窗口二乘二，步长二"><MathFormulaStatic latex="K=2\times2,\quad S=2" /></MathFormulaBlock>
        <div className="vfl-pooling-calculation">
          <MathFormulaBlock className="vfl-pooling-formula" ariaLabel={`${mode === 'max' ? '取最大值' : '取平均值'}，得到 ${result}`}><MathFormulaStatic latex={formula} /></MathFormulaBlock>
        </div>
        <Typography as="p" variant="body" tone="accent" className="vfl-pooling-instruction">点击输出格，查看对应窗口</Typography>
      </section>

      <div className="vfl-pooling-arrow" aria-hidden="true">→</div>

      <section className="vfl-pooling-stage vfl-pooling-output-stage" aria-label="输出特征图">
        <div className="vfl-pooling-stage-title"><Typography as="h2" variant="h3" tone="accent">输出特征图</Typography><MathFormulaBlock ariaLabel="二乘二"><MathFormulaStatic latex={'2\\times2'} /></MathFormulaBlock></div>
        <div className="vfl-pooling-output-grid" role="group" aria-label="二乘二池化输出，点击数值查看对应窗口">
          {Array.from({ length: 4 }, (_, index) => <Button
            key={index}
            variant={index === active ? 'primary' : 'default'}
            active={index === active}
            aria-label={`查看第 ${index + 1} 个输出位置，值为 ${pooledValue(index, mode)}`}
            aria-pressed={index === active}
            onClick={() => chooseWindow(index)}
            className="vfl-pooling-output-cell"
          ><Typography as="span" variant="h2" tone="inherit">{pooledValue(index, mode)}</Typography></Button>)}
        </div>
        <Typography as="p" variant="body" tone="muted">四个窗口 → 四个汇总值</Typography>
      </section>
    </div>

    <div className="vfl-pooling-takeaway">
      <div><Typography variant="body" tone="accent">最大池化</Typography><Typography variant="body" tone="muted">保留最强响应</Typography></div>
      <div><Typography variant="body" tone="accent">平均池化</Typography><Typography variant="body" tone="muted">保留局部平均水平</Typography></div>
      <Typography variant="h3" tone="accent">池化汇聚已有响应，不学习新的权重。</Typography>
    </div>
  </ContentBlock>;
}
