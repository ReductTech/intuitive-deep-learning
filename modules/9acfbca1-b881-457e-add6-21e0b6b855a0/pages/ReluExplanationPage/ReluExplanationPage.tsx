import { useCallback, useMemo, useState } from 'react';
import "./ReluExplanationPage.css";
import { Button, ContentBlock, FunctionPlot, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";

interface ReluInputParameters {
  a: number;
  b: number;
}

function rounded(value: number) {
  return Math.round(value * 100) / 100;
}

function randomParameters(): ReluInputParameters {
  const direction = Math.random() < 0.5 ? -1 : 1;
  return {
    a: rounded(direction * (0.55 + Math.random() * 1.25)),
    b: rounded(-0.9 + Math.random() * 1.8),
  };
}

function signed(value: number) {
  return value < 0 ? `− ${Math.abs(value).toFixed(2)}` : `+ ${value.toFixed(2)}`;
}

export function ReluExplanationPage() {
  const [parameters, setParameters] = useState<ReluInputParameters>({ a: 1, b: 0 });
  const randomize = useCallback(() => setParameters(randomParameters()), []);
  const formula = parameters.a === 1 && parameters.b === 0
    ? 'y = ReLU(x)'
    : `y = ReLU(${parameters.a.toFixed(2)}x ${signed(parameters.b)})`;
  const reluFunction = useMemo(
    () => (x: number) => Math.max(0, parameters.a * x + parameters.b),
    [parameters.a, parameters.b],
  );

  return (
    <ContentBlock shuku-edit-id="e-2d568390-adbb-43e0-9e52-87908781acd3"
      headingLevel={1}
      className="ngtw-relu-explanation"
      title="认识线性整流单元"
      subtitle="前面观察到的“负值被抑制、正值继续传递”，可以写成一个分段函数。这个函数称为 ReLU。"
    >
      <div shuku-edit-id="e-6909570d-0230-4f77-b4c6-b6d6c0af7e98" className="ngtw-relu-explanation__layout grid grid-cols-[minmax(0,_0.82fr)_minmax(0,_1.18fr)] gap-[28px] min-w-0 max-w-full">
        <section shuku-edit-id="e-8a167dd1-c517-4ccd-8b05-3d5659c1138e" className="ngtw-relu-explanation__definition" aria-labelledby="ngtw-relu-definition-title">
          <Typography shuku-edit-id="e-3266bf72-512b-443c-b48a-88348e745b5c" id="ngtw-relu-definition-title" as="h3" variant="h3" tone="accent">
            ReLU：修正线性单元
          </Typography>
          <Typography shuku-edit-id="e-dad9ff73-bf42-4aa8-b06b-00f00f9aa641" variant="body" tone="muted">
            ReLU 是 <Typography shuku-edit-id="e-5b73e5ad-47e0-4878-a66b-d4c595ab4a2f" as="span" variant="body" tone="accent">Rectified Linear Unit</Typography> 的缩写。它先接收加权结果 z，再按零点判断是否输出。
          </Typography>

          <MathFormulaBlock
            className="ngtw-relu-explanation__formula max-w-full"
            ariaLabel="ReLU 分段函数：z 小于等于零时输出零，z 大于零时输出 z"
          >
            <MathFormulaStatic latex={'\\operatorname{ReLU}(z)=\\begin{cases}0,&z\\le 0\\\\z,&z>0\\end{cases}'} />
          </MathFormulaBlock>

          <div shuku-edit-id="e-9d71d8a6-a13d-4361-8ad8-f3b612c45855" className="ngtw-relu-explanation__cases grid grid-cols-[repeat(2,_minmax(0,_1fr))] gap-[14px] min-w-0" aria-label="ReLU 分段规则">
            <div shuku-edit-id="e-fbb394bb-4dd9-47b8-92f9-a17799279fb1">
              <Typography shuku-edit-id="e-7582a75b-74ea-4a8c-9768-24d8b5f9a3be" as="span" variant="body" tone="muted">当 z ≤ 0</Typography>
              <Typography shuku-edit-id="e-0ef54eaa-f166-4519-8d79-495ee9c32253" as="strong" variant="h3" tone="accent">输出 0</Typography>
              <Typography shuku-edit-id="e-8862df36-0cca-4889-a302-c4229fc092dd" variant="body" tone="muted">信号被抑制</Typography>
            </div>
            <div shuku-edit-id="e-a1e23d73-ad7c-4984-a207-a1540b297c50">
              <Typography shuku-edit-id="e-9ce119e1-be40-4d8b-87b3-7b1ac1bb56ab" as="span" variant="body" tone="muted">当 z &gt; 0</Typography>
              <Typography shuku-edit-id="e-b7495991-822d-4d1c-9832-36d53d1e52f1" as="strong" variant="h3" tone="success">输出 z</Typography>
              <Typography shuku-edit-id="e-bbf49a56-95a2-4ad4-9630-3fdd8895bfaa" variant="body" tone="muted">信号被激活</Typography>
            </div>
          </div>

        </section>

        <figure shuku-edit-id="e-41cdf25c-33dd-479c-afd2-89c6bb16699f" className="ngtw-relu-explanation__figure" aria-labelledby="ngtw-relu-figure-title">
          <div shuku-edit-id="e-f683af71-dc78-42d3-8979-c67dba60cb25" className="ngtw-relu-explanation__figure-head flex items-center justify-between gap-[20px] min-w-0">
            <div shuku-edit-id="e-948acf41-aa67-48da-b0c7-b69f49063f89">
              <Typography shuku-edit-id="e-b6c76271-8ae4-4e95-beb2-a6ad08c699d5" id="ngtw-relu-figure-title" as="h3" variant="h3" tone="accent">观察 ReLU 的输出</Typography>
              <Typography shuku-edit-id="e-01cd8f82-0257-48ab-b173-0226463ae4d0" variant="body" tone="muted">{formula}</Typography>
            </div>
            <Button variant="primary" onClick={randomize}>随机参数</Button>
          </div>
          <div shuku-edit-id="e-b5f6d54b-fff6-411c-8c44-b54b0dad8393" className="ngtw-relu-explanation__plot min-w-0 min-h-[430px] max-w-full">
            <FunctionPlot
              className="ngtw-relu-explanation__function-plot w-full max-w-full"
              fn={reluFunction}
              ariaLabel={`${formula} 的函数图像：小于响应起点的部分输出零，越过响应起点后沿直线变化`}
              xLabel="输入 x"
              yLabel="输出 y"
              stroke="#228d5c"
              initialCenter={{ x: 0, y: 1 }}
              initialScale={{ x: 0.012, y: 0.012 }}
              minHeight={430}
            />
          </div>
        </figure>
      </div>
    </ContentBlock>
  );
}





