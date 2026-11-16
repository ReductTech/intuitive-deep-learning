import type { ReactNode } from 'react';
import { ContentBlock, FormulaBlock, FormulaTerm, Typography } from "@shuku/course-style/react";
import "./WeightedContributionTheoryPage.css";
import { effectiveInput, formatScore, normalizedWeight, useLesson, weightedSum } from '../../LessonContext';

const subscripts = ['₁', '₂', '₃'];

function FormulaVariable({ children, tooltip, className }: { children: ReactNode; tooltip: string; className?: string }) {
  return <FormulaTerm className={className} tooltip={tooltip}>{children}</FormulaTerm>;
}

function VectorBracket({
  values,
  tone,
  direction,
  tooltips,
}: {
  values: string[];
  tone: 'warm' | 'blue';
  direction: 'row' | 'column';
  tooltips: string[];
}) {
  return (
    <span shuku-edit-id="e-38b0b517-0c9e-4a36-85b1-f94bc4cbe664" className={`ngtw-matrix-representation__bracket-vector relative min-w-[92px] items-center gap-[8px] p-[12px_15px] text-center ngtw-matrix-representation__bracket-vector--${tone} ngtw-matrix-representation__bracket-vector--${direction}`}>
      {values.map((value, index) => (
        <FormulaVariable key={`${value}-${index}`} tooltip={tooltips[index]}>{value}</FormulaVariable>
      ))}
    </span>
  );
}

export function WeightedContributionTheoryPage() {
  const { scenario, state } = useLesson();
  const rawValues = scenario.factors.map((factor, index) => state.values[index] ?? factor.suggestedValue);
  const values = scenario.factors.map((factor, index) => effectiveInput(factor, rawValues[index]));
  const weights = scenario.factors.map((factor) => normalizedWeight(factor.suggestedImportance));
  const total = weightedSum(scenario, rawValues);

  return (
    <ContentBlock shuku-edit-id="e-97834add-abca-4f55-9e66-0fb6f762800c"
      headingLevel={1}
      className="ngtw-lecture-stage ngtw-matrix-representation"
      title="从加权求和到矩阵表示"
      subtitle="刚才那一长串乘法没有变，只是换了一种更紧凑的写法。"
    >
      <section shuku-edit-id="e-1dca6a9c-5a89-492f-9373-999198d75264" className="ngtw-matrix-representation__expanded">
        <div shuku-edit-id="e-de423117-b7b1-4d3f-b7d1-d2e176606f1c" className="ngtw-matrix-representation__section-copy grid min-w-0 content-center gap-[3px]">
          <Typography shuku-edit-id="e-a703ed94-3a0c-4786-abee-334724b5e4c8" variant="body" tone="warning">上一页的写法</Typography>
          <Typography shuku-edit-id="e-d6f97a92-2522-40f4-9a6a-acc482028eb6" as="h3" variant="h3" tone="accent">三个输入分别加权，再相加</Typography>
        </div>
        <FormulaBlock ariaLabel="三个输入的加权和以及当前数值">
          <div shuku-edit-id="e-7d291257-6acd-4346-9b62-ff061da9b147" className="ngtw-matrix-representation__formula-line">
            <FormulaVariable tooltip="y：三个输入经过加权后相加得到的总输入。">y</FormulaVariable>
            {' = '}
            {subscripts.map((subscript, index) => (
              <span shuku-edit-id="e-eae8e368-bdb8-4774-96ad-39d30c87f7e9" key={subscript}>
                {index > 0 && ' + '}
                <FormulaVariable tooltip={`w${subscript}x${subscript}：第 ${index + 1} 个输入乘以对应权重后的贡献。`}>
                  w{subscript}x{subscript}
                </FormulaVariable>
              </span>
            ))}
          </div>
          <div shuku-edit-id="e-051272d7-b9c2-4f57-930e-a762e277516d" className="ngtw-matrix-representation__formula-detail">
            {'= '}
            {weights.map((weight, index) => (
              <span shuku-edit-id="e-4dd6e3bf-c42b-40e0-b241-cf3cc3576eb5" key={index}>
                {index > 0 && ' + '}
                <FormulaVariable tooltip={`第 ${index + 1} 个权重与输入的数值：${formatScore(weight)} × ${formatScore(values[index])}。`}>
                  {formatScore(weight)} × {formatScore(values[index])}
                </FormulaVariable>
              </span>
            ))}
            {' = '}
            <FormulaVariable tooltip={`y：当前三个加权贡献相加后的总输入，为 ${formatScore(total)}。`}>{formatScore(total)}</FormulaVariable>
          </div>
        </FormulaBlock>
      </section>

      <div shuku-edit-id="e-76b1ed9b-5a57-4732-8104-339e88768d01" className="ngtw-matrix-representation__down-arrow grid place-items-center" aria-hidden="true">↓</div>
      <div shuku-edit-id="e-eaf71925-d0cf-4464-b1ae-bc9c98939c9c" className="ngtw-matrix-representation__bridge-label justify-self-center rounded-[999px] bg-[#edf4fd] p-[5px_25px] text-center">
        <Typography shuku-edit-id="e-afd45711-743e-4758-8814-d81632ec7d5e" as="strong" variant="body" tone="accent">把权重放在一起，把输入放在一起</Typography>
      </div>

      <section shuku-edit-id="e-4ff644a2-65f1-4af5-ab21-5906fa91391f" className="ngtw-matrix-representation__vectors grid min-w-0 min-h-0 grid-cols-[minmax(0,_1fr)_42px_minmax(0,_1fr)] items-stretch gap-[12px]" aria-label="权重向量和输入向量">
        <article shuku-edit-id="e-1d018d91-ab29-41a0-b472-bb53ff2bf83e" className="ngtw-matrix-representation__vector-card grid min-w-0 grid-cols-[minmax(120px,_.7fr)_minmax(0,_1.3fr)] items-center gap-[12px] rounded-[12px] bg-[#fffdfb] p-[12px_16px] ngtw-matrix-representation__vector-card--weights">
          <div shuku-edit-id="e-2ea73141-14e4-48af-a1ef-3ce724863b44" className="ngtw-matrix-representation__card-copy grid min-w-0 content-center gap-[3px]">
            <Typography shuku-edit-id="e-c92a4f8f-27d4-4e4f-8139-1bf91e7b4e68" variant="body" tone="warning">权重</Typography>
            <Typography shuku-edit-id="e-a5fb3a1d-fd10-4093-8607-23ff047a2cf8" variant="bodySmall" tone="muted">把三个权重排成一个行向量。</Typography>
          </div>
          <FormulaBlock ariaLabel="权重行向量 W 转置">
            <div shuku-edit-id="e-41d55d1a-59e3-4b5f-bb94-10a5eb3c033e" className="ngtw-matrix-representation__vector-equation flex min-w-0 items-center justify-center gap-[8px]">
              <FormulaVariable tooltip="Wᵀ：由三个输入权重组成的行向量。">Wᵀ</FormulaVariable>
              {' = '}
              <VectorBracket
                tone="warm"
                direction="row"
                values={weights.map(formatScore)}
                tooltips={weights.map((weight, index) => `w${subscripts[index]}：第 ${index + 1} 个因素的权重，为 ${formatScore(weight)}。`)}
              />
            </div>
          </FormulaBlock>
        </article>

        <div shuku-edit-id="e-42acf0d3-16c4-4053-913a-2cfb52c565b8" className="ngtw-matrix-representation__multiply grid place-items-center" aria-hidden="true">×</div>

        <article shuku-edit-id="e-59baec0b-4b9b-49ac-92d6-e788175d6954" className="ngtw-matrix-representation__vector-card grid min-w-0 grid-cols-[minmax(120px,_.7fr)_minmax(0,_1.3fr)] items-center gap-[12px] rounded-[12px] bg-[#fffdfb] p-[12px_16px] ngtw-matrix-representation__vector-card--inputs bg-[#fbfdff]">
          <div shuku-edit-id="e-9993b0d3-8ce4-49d7-a0e7-937ff7640d62" className="ngtw-matrix-representation__card-copy grid min-w-0 content-center gap-[3px]">
            <Typography shuku-edit-id="e-64037578-96f3-4fee-9d3e-da2dd52174f9" variant="body" tone="accent">输入</Typography>
            <Typography shuku-edit-id="e-2e1f6bc1-0b9f-4b66-a560-ad35ed47add7" variant="bodySmall" tone="muted">把三个输入排成一个列向量。</Typography>
          </div>
          <FormulaBlock ariaLabel="输入列向量 X">
            <div shuku-edit-id="e-65236982-40f2-495e-b903-0f4cf1bf93f6" className="ngtw-matrix-representation__vector-equation flex min-w-0 items-center justify-center gap-[8px]">
              <FormulaVariable tooltip="X：由三个输入组成的列向量。">X</FormulaVariable>
              {' = '}
              <VectorBracket
                tone="blue"
                direction="column"
                values={values.map(formatScore)}
                tooltips={values.map((value, index) => `x${subscripts[index]}：第 ${index + 1} 个输入，为 ${formatScore(value)}。`)}
              />
            </div>
          </FormulaBlock>
        </article>
      </section>

      <section shuku-edit-id="e-75adcf5b-e2b8-4403-b90d-271b3f2c66b5" className="ngtw-matrix-representation__compact">
        <div shuku-edit-id="e-1cee55c6-09a0-4287-be1b-96c0565ee208" className="ngtw-matrix-representation__section-copy grid min-w-0 content-center gap-[3px]">
          <Typography shuku-edit-id="e-5735159b-9a75-4896-acf9-b294449eebb4" variant="body" tone="success">合并写法</Typography>
          <Typography shuku-edit-id="e-9f659096-f512-4948-95f0-36441b6ad72c" as="h3" variant="h3" tone="accent">一次矩阵乘法</Typography>
        </div>
        <FormulaBlock ariaLabel="权重转置乘以输入向量得到神经元总输入">
          <div shuku-edit-id="e-a0d4a7d1-b5a8-4593-85c4-bff791fbbfe0" className="ngtw-matrix-representation__compact-formula">
            <FormulaVariable tooltip="y：神经元接收到的总输入。">y</FormulaVariable>
            {' = '}
            <FormulaVariable tooltip="Wᵀ：权重组成的行向量。">Wᵀ</FormulaVariable>
            {' × '}
            <FormulaVariable tooltip="X：输入组成的列向量。">X</FormulaVariable>
            {' = '}
            <FormulaVariable tooltip={`当前矩阵乘法的结果，为 ${formatScore(total)}。`}>{formatScore(total)}</FormulaVariable>
          </div>
          <div shuku-edit-id="e-17428b0d-5969-48a4-a401-fa232a37fb7a" className="ngtw-matrix-representation__compact-detail">
            {'= '}
            <FormulaVariable tooltip="WᵀX：把对应位置的权重和输入相乘，再把结果相加。">
              {weights.map((weight, index) => `${formatScore(weight)} × ${formatScore(values[index])}`).join(' + ')}
            </FormulaVariable>
            {' = '}
            <FormulaVariable tooltip={`y：矩阵表示与展开写法得到相同结果，为 ${formatScore(total)}。`}>{formatScore(total)}</FormulaVariable>
          </div>
        </FormulaBlock>
      </section>

      <aside shuku-edit-id="e-a6c88186-ceea-43b7-b22c-203b76e2a1e1" className="ngtw-matrix-representation__key-point flex min-w-0 items-baseline justify-center gap-[8px] rounded-[10px] bg-[#fffaf0] p-[7px_14px]">
        <Typography shuku-edit-id="e-f2ec5841-b807-4b32-9065-832d55a0fdca" as="strong" variant="body" tone="warning">理解重点：</Typography>
        <Typography shuku-edit-id="e-b051f531-5620-48d8-878b-cb7f7a4e359f" as="span" variant="bodySmall" tone="muted">矩阵写法没有发明新的计算，只是把同样的加权过程写得更紧凑。</Typography>
      </aside>
    </ContentBlock>
  );
}

