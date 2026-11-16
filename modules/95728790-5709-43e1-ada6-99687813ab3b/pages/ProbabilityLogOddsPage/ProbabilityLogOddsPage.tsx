import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from "@shuku/course-style/react";
import './ProbabilityLogOddsPage.css';

function Range({ latex, description }: { latex: string; description: string }) {
  return <MathFormulaBlock appearance="plain" className="rl-logit-range"><MathFormulaTerm latex={latex} tooltip={description} /></MathFormulaBlock>;
}

function Tendency({ latex, children }: { latex: string; children: string }) {
  return <div shuku-edit-id="e-b2a81f64-4bef-4d04-8964-fff31cbc8701" className="rl-logit-tendency"><MathFormulaBlock appearance="plain"><MathFormulaStatic latex={latex} /></MathFormulaBlock><Typography shuku-edit-id="e-495d1189-1ed5-4df5-9fdd-46d2dc65905e" variant="bodySmall" tone="accent">{children}</Typography></div>;
}

function Transition({ children }: { children: string }) {
  return <div shuku-edit-id="e-7f98ff7c-dcd1-4f91-ae6f-44d244309c83" className="rl-logit-transition"><Typography shuku-edit-id="e-f8f0710a-a0f0-490b-a019-1c749840e547" variant="bodySmall" tone="accent" wrap="nowrap">{children}</Typography><span shuku-edit-id="e-3475eefd-5f0a-4100-abe2-3ab049afb2bf" aria-hidden="true" /></div>;
}

export function ProbabilityLogOddsPage() {
  return <ContentBlock shuku-edit-id="e-11ca0fac-247f-4c63-bf18-7ea22242e75a" headingLevel={1} title="从概率到线性分数" subtitle="从概率反推，将取值范围逐步扩展到整个实数轴。" className="rl-logit-page">
    <div shuku-edit-id="e-0b82cc38-0a58-4035-a266-38df7f9f63fe" className="rl-logit-layout">
      <div shuku-edit-id="e-a42a0e05-181b-40f8-86ea-b8088ef0b2e9" className="rl-logit-sequence">
        <section shuku-edit-id="e-07f1636d-2c4f-464f-9262-14ee59213bb2" className="rl-logit-panel rl-logit-panel--probability" aria-label="概率">
          <div shuku-edit-id="e-ee0d0c29-c2a0-4ec8-9c9b-ffaec5d3e879" className="rl-logit-heading"><Typography shuku-edit-id="e-f53c55c7-e487-4506-92cc-0e18cd9266e1" variant="h3" tone="inherit">概率</Typography><Typography shuku-edit-id="e-c697097d-e9a1-4541-a236-ba16f942126b" variant="bodySmall" tone="muted">生还的可能性</Typography></div>
          <MathFormulaBlock appearance="plain" className="rl-logit-main"><MathFormulaTerm latex="p" tooltip="p表示给定乘客特征后的生还概率。本页讨论0与1之间的概率；端点可通过极限理解。" /></MathFormulaBlock>
          <Range latex="p\in(0,1)" description="概率介于0和1之间。在端点，几率或对数几率需要用极限表示。" />
          <div shuku-edit-id="e-37650a47-d6b3-4960-a4fc-2510a4712765" className="rl-logit-explanation">
            <Tendency latex="p">生还概率</Tendency>
            <Tendency latex="1-p">遇难概率</Tendency>
          </div>
          <div shuku-edit-id="e-67d0d4ba-4f0d-4eef-a157-110a3264401c" className="rl-logit-note"><Typography shuku-edit-id="e-4f56ed22-9a48-4ef4-a649-b07c14be836c" variant="bodySmall" tone="accent">两类概率都为正，尚未形成正负表达。</Typography></div>
        </section>
        <Transition>比较</Transition>
        <section shuku-edit-id="e-66cf9223-db66-4ac2-b5bf-523bf4018d7d" className="rl-logit-panel rl-logit-panel--odds" aria-label="几率">
          <div shuku-edit-id="e-252ed860-1470-4732-b5bc-2469aad168cb" className="rl-logit-heading"><Typography shuku-edit-id="e-b491b97d-5a99-4799-85b6-e50a0c701a90" variant="h3" tone="inherit">几率</Typography><Typography shuku-edit-id="e-5abac3e1-adf3-477f-92ea-b90deab4dccb" variant="bodySmall" tone="muted">比较两类的可能性</Typography></div>
          <MathFormulaBlock appearance="plain" className="rl-logit-main"><MathFormulaTerm latex="r=\frac{p}{1-p}" tooltip="几率是生还概率与遇难概率之比，表达两类的相对倾向。例如生还概率80%、遇难概率20%，几率为4。" /></MathFormulaBlock>
          <Range latex="r\in(0,+\infty)" description="p从0趋向1时，几率从0趋向正无穷；几率仍然只能为正。" />
          <div shuku-edit-id="e-e29cf78e-e431-4d76-84fc-6b813a85ef1a" className="rl-logit-explanation">
            <Tendency latex="r<1">偏向遇难</Tendency>
            <Tendency latex="r=1">两类同样可能</Tendency>
            <Tendency latex="r>1">偏向生还</Tendency>
          </div>
          <div shuku-edit-id="e-5f3661b1-4631-4c40-873e-bd0d04d1c58a" className="rl-logit-note"><Typography shuku-edit-id="e-c73f0b4f-38fa-4b41-8171-a28d1c39b357" variant="bodySmall" tone="accent">相对倾向已明确，但几率仍为正数。</Typography></div>
        </section>
        <Transition>取 ln</Transition>
        <section shuku-edit-id="e-18a4ac8e-49f4-43b4-9e17-2e963ac4a1ff" className="rl-logit-panel rl-logit-panel--log" aria-label="对数几率">
          <div shuku-edit-id="e-c0dc3ab7-3c67-40b0-b7d3-9f3645f4b7f7" className="rl-logit-heading"><Typography shuku-edit-id="e-399f294c-4a33-4940-9066-43fc95f7e20a" variant="h3" tone="inherit">对数几率</Typography><Typography shuku-edit-id="e-931a9420-3713-42b8-b8ee-11ce7a68f29d" variant="bodySmall" tone="muted">用正负表示类别倾向</Typography></div>
          <MathFormulaBlock appearance="plain" className="rl-logit-main rl-logit-main--log"><MathFormulaTerm latex="\ln r=\ln\frac{p}{1-p}" tooltip="自然对数将小于1的正数变成负数，将1变成0，将大于1的数变成正数。交换两类时，几率取倒数，对数几率恰好变号。" /></MathFormulaBlock>
          <Range latex="\ln r\in(-\infty,+\infty)" description="几率趋向0时，对数几率趋向负无穷；几率趋向正无穷时，对数几率趋向正无穷。" />
          <div shuku-edit-id="e-6ce527ae-b9e3-40b4-af2c-ae695d106691" className="rl-logit-explanation">
            <Tendency latex="\ln r<0">偏向遇难</Tendency>
            <Tendency latex="\ln r=0">两类同样可能</Tendency>
            <Tendency latex="\ln r>0">偏向生还</Tendency>
          </div>
          <div shuku-edit-id="e-9e8e48db-b574-49c5-a8fc-6020b3ec3857" className="rl-logit-note"><Typography shuku-edit-id="e-be99948a-3b2b-427e-bdf1-9794151223fb" variant="bodySmall" tone="accent">中立对应 0，可取任意实数。</Typography></div>
        </section>
      </div>
      <div shuku-edit-id="e-aca1343b-f073-442a-9766-4456be3dff31" className="rl-logit-model"><Typography shuku-edit-id="e-927e409d-9f2d-4ae3-93d1-c8c21f3fa3b3" variant="body" tone="accent" className="rl-logit-model-label">模型假设</Typography><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="\ln\frac{p}{1-p}=z=\mathbf w^\top\mathbf x+b" tooltip="逻辑回归假设对数几率等于输入特征的线性分数。取值范围一致为这一选择提供动机，但不能推出它是唯一的映射。" tooltipPlacement="top" /></MathFormulaBlock></div>
    </div>
  </ContentBlock>;
}
