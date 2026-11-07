import { useCallback, useMemo, useState } from 'react';
import "./ReluExplanationPage.css";
import { Button, ContentBlock, FunctionPlot, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';

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
    <ContentBlock
      headingLevel={1}
      className="ngtw-relu-explanation"
      title="认识线性整流单元"
      subtitle="前面观察到的“负值被抑制、正值继续传递”，可以写成一个分段函数。这个函数称为 ReLU。"
    >
      <div className="ngtw-relu-explanation__layout grid grid-cols-[minmax(0,_0.82fr)_minmax(0,_1.18fr)] gap-[28px] min-w-0 max-w-full">
        <section className="ngtw-relu-explanation__definition" aria-labelledby="ngtw-relu-definition-title">
          <Typography id="ngtw-relu-definition-title" as="h3" variant="h3" tone="accent">
            ReLU：修正线性单元
          </Typography>
          <Typography variant="body" tone="muted">
            ReLU 是 <Typography as="span" variant="body" tone="accent">Rectified Linear Unit</Typography> 的缩写。它先接收加权结果 z，再按零点判断是否输出。
          </Typography>

          <MathFormulaBlock
            className="ngtw-relu-explanation__formula max-w-full"
            ariaLabel="ReLU 分段函数：z 小于等于零时输出零，z 大于零时输出 z"
          >
            <MathFormulaStatic latex={'\\operatorname{ReLU}(z)=\\begin{cases}0,&z\\le 0\\\\z,&z>0\\end{cases}'} />
          </MathFormulaBlock>

          <div className="ngtw-relu-explanation__cases grid grid-cols-[repeat(2,_minmax(0,_1fr))] gap-[14px] min-w-0" aria-label="ReLU 分段规则">
            <div>
              <Typography as="span" variant="body" tone="muted">当 z ≤ 0</Typography>
              <Typography as="strong" variant="h3" tone="accent">输出 0</Typography>
              <Typography variant="body" tone="muted">信号被抑制</Typography>
            </div>
            <div>
              <Typography as="span" variant="body" tone="muted">当 z &gt; 0</Typography>
              <Typography as="strong" variant="h3" tone="success">输出 z</Typography>
              <Typography variant="body" tone="muted">信号被激活</Typography>
            </div>
          </div>

        </section>

        <figure className="ngtw-relu-explanation__figure" aria-labelledby="ngtw-relu-figure-title">
          <div className="ngtw-relu-explanation__figure-head flex items-center justify-between gap-[20px] min-w-0">
            <div>
              <Typography id="ngtw-relu-figure-title" as="h3" variant="h3" tone="accent">观察 ReLU 的输出</Typography>
              <Typography variant="body" tone="muted">{formula}</Typography>
            </div>
            <Button variant="primary" onClick={randomize}>随机参数</Button>
          </div>
          <div className="ngtw-relu-explanation__plot min-w-0 min-h-[430px] max-w-full">
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





