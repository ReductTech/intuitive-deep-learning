import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from '../../../shared/react';
import './ProbabilityLogOddsPage.css';

function Range({ latex, description }: { latex: string; description: string }) {
  return <MathFormulaBlock appearance="plain" className="rl-logit-range"><MathFormulaTerm latex={latex} tooltip={description} /></MathFormulaBlock>;
}

function Tendency({ latex, children }: { latex: string; children: string }) {
  return <div className="rl-logit-tendency"><MathFormulaBlock appearance="plain"><MathFormulaStatic latex={latex} /></MathFormulaBlock><Typography variant="bodySmall" tone="accent">{children}</Typography></div>;
}

function Transition({ children }: { children: string }) {
  return <div className="rl-logit-transition"><Typography variant="bodySmall" tone="accent" wrap="nowrap">{children}</Typography><span aria-hidden="true" /></div>;
}

export function ProbabilityLogOddsPage() {
  return <ContentBlock headingLevel={1} title="从概率到线性分数" subtitle="从概率反推，将取值范围逐步扩展到整个实数轴。" className="rl-logit-page">
    <div className="rl-logit-layout">
      <div className="rl-logit-sequence">
        <section className="rl-logit-panel rl-logit-panel--probability" aria-label="概率">
          <div className="rl-logit-heading"><Typography variant="h3" tone="inherit">概率</Typography><Typography variant="bodySmall" tone="muted">生还的可能性</Typography></div>
          <MathFormulaBlock appearance="plain" className="rl-logit-main"><MathFormulaTerm latex="p" tooltip="p表示给定乘客特征后的生还概率。本页讨论0与1之间的概率；端点可通过极限理解。" /></MathFormulaBlock>
          <Range latex="p\in(0,1)" description="概率介于0和1之间。在端点，几率或对数几率需要用极限表示。" />
          <div className="rl-logit-explanation">
            <Tendency latex="p">生还概率</Tendency>
            <Tendency latex="1-p">遇难概率</Tendency>
          </div>
          <div className="rl-logit-note"><Typography variant="bodySmall" tone="accent">两类概率都为正，尚未形成正负表达。</Typography></div>
        </section>
        <Transition>比较</Transition>
        <section className="rl-logit-panel rl-logit-panel--odds" aria-label="几率">
          <div className="rl-logit-heading"><Typography variant="h3" tone="inherit">几率</Typography><Typography variant="bodySmall" tone="muted">比较两类的可能性</Typography></div>
          <MathFormulaBlock appearance="plain" className="rl-logit-main"><MathFormulaTerm latex="r=\frac{p}{1-p}" tooltip="几率是生还概率与遇难概率之比，表达两类的相对倾向。例如生还概率80%、遇难概率20%，几率为4。" /></MathFormulaBlock>
          <Range latex="r\in(0,+\infty)" description="p从0趋向1时，几率从0趋向正无穷；几率仍然只能为正。" />
          <div className="rl-logit-explanation">
            <Tendency latex="r<1">偏向遇难</Tendency>
            <Tendency latex="r=1">两类同样可能</Tendency>
            <Tendency latex="r>1">偏向生还</Tendency>
          </div>
          <div className="rl-logit-note"><Typography variant="bodySmall" tone="accent">相对倾向已明确，但几率仍为正数。</Typography></div>
        </section>
        <Transition>取 ln</Transition>
        <section className="rl-logit-panel rl-logit-panel--log" aria-label="对数几率">
          <div className="rl-logit-heading"><Typography variant="h3" tone="inherit">对数几率</Typography><Typography variant="bodySmall" tone="muted">用正负表示类别倾向</Typography></div>
          <MathFormulaBlock appearance="plain" className="rl-logit-main rl-logit-main--log"><MathFormulaTerm latex="\ln r=\ln\frac{p}{1-p}" tooltip="自然对数将小于1的正数变成负数，将1变成0，将大于1的数变成正数。交换两类时，几率取倒数，对数几率恰好变号。" /></MathFormulaBlock>
          <Range latex="\ln r\in(-\infty,+\infty)" description="几率趋向0时，对数几率趋向负无穷；几率趋向正无穷时，对数几率趋向正无穷。" />
          <div className="rl-logit-explanation">
            <Tendency latex="\ln r<0">偏向遇难</Tendency>
            <Tendency latex="\ln r=0">两类同样可能</Tendency>
            <Tendency latex="\ln r>0">偏向生还</Tendency>
          </div>
          <div className="rl-logit-note"><Typography variant="bodySmall" tone="accent">中立对应 0，可取任意实数。</Typography></div>
        </section>
      </div>
      <div className="rl-logit-model"><Typography variant="body" tone="accent" className="rl-logit-model-label">模型假设</Typography><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="\ln\frac{p}{1-p}=z=\mathbf w^\top\mathbf x+b" tooltip="逻辑回归假设对数几率等于输入特征的线性分数。取值范围一致为这一选择提供动机，但不能推出它是唯一的映射。" tooltipPlacement="top" /></MathFormulaBlock></div>
    </div>
  </ContentBlock>;
}
