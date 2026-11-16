import { useState } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
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

  return <ContentBlock shuku-edit-id="e-6226233d-ec47-4e1e-9806-cbcfa020c407"
    headingLevel={1}
    className="vfl-pooling-page"
    title="池化：汇聚局部响应"
    subtitle="每个局部窗口保留一个汇总值，得到更小的特征图。"
  >
    <div shuku-edit-id="e-b7c3ac05-45b3-4245-9827-a7e2d5ecaf34" className="vfl-pooling-workspace">
      <section shuku-edit-id="e-ae90bdb1-f40e-4ed4-b8a1-dd4881e552f5" className="vfl-pooling-stage" aria-label="输入特征图">
        <div shuku-edit-id="e-adaa4444-7b3e-4cd5-b697-27e87b006b25" className="vfl-pooling-stage-title"><Typography shuku-edit-id="e-1e98097a-229f-425f-a994-b09493e95c7b" as="h2" variant="h3" tone="accent">输入特征图</Typography><MathFormulaBlock ariaLabel="四乘四"><MathFormulaStatic latex={'4\\times4'} /></MathFormulaBlock></div>
        <div shuku-edit-id="e-4b6a52f0-443e-4d3e-9c1d-eea441eb4cec" className="vfl-pooling-input-grid" role="grid" aria-label="四乘四输入特征图">
          {INPUT.flatMap((row, rowIndex) => row.map((value, colIndex) => {
            const selected = rowIndex >= top && rowIndex < top + 2 && colIndex >= left && colIndex < left + 2;
            const strongest = mode === 'max' && selected && value === result;
            return <div shuku-edit-id="e-c0ed86d5-8e2c-4aea-ab82-f301921fbafc" key={`${rowIndex}-${colIndex}`} role="gridcell" aria-selected={selected} className={`vfl-pooling-input-cell${selected ? ' is-window' : ''}${strongest ? ' is-strongest' : ''}`}>
              <Typography shuku-edit-id="e-571cf4c2-c640-4c50-9be5-8db814caac79" as="span" variant="h2" tone="inherit">{value}</Typography>
            </div>;
          }))}
          <div shuku-edit-id="e-96eefe24-b7fc-4450-b952-81cb869c1a29" className="vfl-pooling-window" aria-hidden="true" style={{ left: `${left * 25}%`, top: `${top * 25}%` }} />
        </div>
        <Typography shuku-edit-id="e-22befeb5-d7a5-4af3-908c-1e4b7c86cad6" as="p" variant="body" tone="muted">当前窗口</Typography>
      </section>

      <div shuku-edit-id="e-40887f02-8ee8-4bee-ba03-3e105cdff83d" className="vfl-pooling-arrow" aria-hidden="true">→</div>

      <section shuku-edit-id="e-d5a401b5-f777-414f-b815-54df15901a6b" className="vfl-pooling-operation" aria-label="池化计算">
        <div shuku-edit-id="e-c83a0bd6-d9e6-4c26-9767-554d5ca27e52" className="vfl-pooling-modes" role="group" aria-label="选择池化方式">
          <Button variant={mode === 'max' ? 'primary' : 'default'} active={mode === 'max'} aria-pressed={mode === 'max'} onClick={() => chooseMode('max')}><Typography shuku-edit-id="e-caa907c7-623f-4475-a73c-1c0a3b025227" as="span" variant="body" tone="inherit">最大池化</Typography></Button>
          <Button variant={mode === 'average' ? 'primary' : 'default'} active={mode === 'average'} aria-pressed={mode === 'average'} onClick={() => chooseMode('average')}><Typography shuku-edit-id="e-0c26f63e-7995-4239-8731-1eb9bcafc5df" as="span" variant="body" tone="inherit">平均池化</Typography></Button>
        </div>
        <MathFormulaBlock className="vfl-pooling-setting" ariaLabel="池化窗口二乘二，步长二"><MathFormulaStatic latex={String.raw`K=2\times2,\quad S=2`} /></MathFormulaBlock>
        <div shuku-edit-id="e-3f11f1f7-5beb-4cf6-80bb-49f77bb47a9b" className="vfl-pooling-calculation">
          <MathFormulaBlock className="vfl-pooling-formula" ariaLabel={`${mode === 'max' ? '取最大值' : '取平均值'}，得到 ${result}`}><MathFormulaStatic latex={formula} /></MathFormulaBlock>
        </div>
      </section>

      <div shuku-edit-id="e-6ba6110d-d307-43ec-baac-a8cb8628b549" className="vfl-pooling-arrow" aria-hidden="true">→</div>

      <section shuku-edit-id="e-9dba597a-81aa-4600-aa70-1ca3cd3b528a" className="vfl-pooling-stage vfl-pooling-output-stage" aria-label="输出特征图">
        <div shuku-edit-id="e-ce9b3bf4-763f-4714-b9b2-7164ddd0fadf" className="vfl-pooling-stage-title"><Typography shuku-edit-id="e-6b4f4c17-3581-4d94-9a2b-e32e2b2fda18" as="h2" variant="h3" tone="accent">输出特征图</Typography><MathFormulaBlock ariaLabel="二乘二"><MathFormulaStatic latex={'2\\times2'} /></MathFormulaBlock></div>
        <div shuku-edit-id="e-7e1711de-c8b9-4ce4-9ec8-de458ecfd623" className="vfl-pooling-output-grid" role="group" aria-label="二乘二池化输出，点击数值查看对应窗口">
          {Array.from({ length: 4 }, (_, index) => <Button
            key={index}
            variant={index === active ? 'primary' : 'default'}
            active={index === active}
            aria-label={`查看第 ${index + 1} 个输出位置，值为 ${pooledValue(index, mode)}`}
            aria-pressed={index === active}
            onClick={() => chooseWindow(index)}
            className="vfl-pooling-output-cell"
          ><Typography shuku-edit-id="e-682f6c88-8386-4a0a-8b63-1091b563e95f" as="span" variant="h2" tone="inherit">{pooledValue(index, mode)}</Typography></Button>)}
        </div>
        <Typography shuku-edit-id="e-6a1aa558-d086-4554-85ad-7fbdc2a6fc61" as="p" variant="body" tone="muted">点击输出格查看对应窗口</Typography>
      </section>
    </div>

    <div shuku-edit-id="e-b714be6c-e04b-4c95-9639-853e3710edd1" className="vfl-pooling-takeaway">
      <Typography shuku-edit-id="e-0435a9b9-f0de-4e95-be22-b3af610fb619" variant="h3" tone="accent">池化汇聚已有响应，不学习新的权重。</Typography>
    </div>
  </ContentBlock>;
}
