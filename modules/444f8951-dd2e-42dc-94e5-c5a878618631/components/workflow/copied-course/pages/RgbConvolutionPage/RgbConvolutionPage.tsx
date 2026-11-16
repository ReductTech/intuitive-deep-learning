import { useState } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from "@shuku/course-style/react";
import { RgbConvolutionScene, type RgbPosition } from './RgbConvolutionScene';
import './RgbConvolutionPage.css';

export function RgbConvolutionPage() {
  const [selected, setSelected] = useState<RgbPosition>({ row: 2, col: 2 });
  return <ContentBlock shuku-edit-id="e-37366a54-4bc2-451e-9475-8f943a32827f" headingLevel={1} className="cg-copy-ck-rgb" title="RGB 多通道卷积" subtitle="一个 3 × 3 × 3 卷积核覆盖三个输入通道，不填充边界，逐位置合成输出。">
    <div shuku-edit-id="e-2ed8dfae-ffe7-4933-83ba-eae5850c98a8" className="cg-copy-ck-rgb__stage">
      <div shuku-edit-id="e-44fba291-257b-4636-aada-f0a6d6bdc7a9" className="cg-copy-ck-rgb__scene-wrap">
        <RgbConvolutionScene selected={selected} onSelect={setSelected} />
        <div shuku-edit-id="e-71f3c825-e105-4a23-8889-c36c6fe863fb" className="cg-copy-ck-rgb__hint"><Typography shuku-edit-id="e-dae31531-bd8c-47c4-b3e4-a051caf3d8ec" variant="bodySmall" tone="muted">自动逐格卷积 · 点击格子暂停观察 · 拖动旋转 · 滚轮缩放</Typography></div>
      </div>
      <div shuku-edit-id="e-8aa2593f-25bc-4926-92d5-ffb1ccf979cf" className="cg-copy-ck-rgb__channel-key" aria-label="输入通道颜色"><Typography shuku-edit-id="e-c86d4f2e-bb63-4258-8d39-ad52d2b43c35" as="span" variant="bodySmall" tone="accent">R 红色通道</Typography><Typography shuku-edit-id="e-51380298-3e78-4661-8020-e33ccc4db61e" as="span" variant="bodySmall" tone="accent">G 绿色通道</Typography><Typography shuku-edit-id="e-2ac2a1f1-5881-4b29-b750-f3781f9b34a8" as="span" variant="bodySmall" tone="accent">B 蓝色通道</Typography></div>
    </div>
    <div shuku-edit-id="e-bd7bc163-e72f-4f1e-876e-d56121fd2441" className="cg-copy-ck-rgb__footer">
      <MathFormulaBlock ariaLabel="RGB 三通道三乘三卷积公式；悬浮在各符号上可查看解释" className="cg-copy-ck-rgb__formula">
        <MathFormulaTerm latex="Y" tooltip="Y：输出特征图。" /><MathFormulaStatic latex="(" /><MathFormulaTerm latex="i" tooltip="i：输出位置的行索引。" /><MathFormulaStatic latex="," /><MathFormulaTerm latex="j" tooltip="j：输出位置的列索引。" /><MathFormulaStatic latex=")=" />
        <MathFormulaTerm latex={String.raw`\sum_{c\in\{R,G,B\}}`} tooltip="对 R、G、B 三个输入通道分别求和；c 表示当前通道。" />
        <MathFormulaTerm latex={String.raw`\sum_{u,v=-1}^{1}`} tooltip="在每个通道的 3 × 3 局部区域求和；u 是行偏移，v 是列偏移。" />
        <MathFormulaTerm latex="X_c" tooltip="X₍c₎：输入图像的第 c 个颜色通道。" />
        <MathFormulaStatic latex="(" /><MathFormulaTerm latex="i" tooltip="i：当前输出位置对应的输入起始行。" /><MathFormulaStatic latex="+" /><MathFormulaTerm latex="u" tooltip="u：卷积核中的行偏移。" /><MathFormulaStatic latex="," /><MathFormulaTerm latex="j" tooltip="j：当前输出位置对应的输入起始列。" /><MathFormulaStatic latex="+" /><MathFormulaTerm latex="v" tooltip="v：卷积核中的列偏移。" /><MathFormulaStatic latex=")" />
        <MathFormulaTerm latex="K_c" tooltip="K₍c₎：卷积核在第 c 个输入通道上的权重。" />
        <MathFormulaStatic latex="(" /><MathFormulaTerm latex="u" tooltip="u：权重所在的核内行。" /><MathFormulaStatic latex="," /><MathFormulaTerm latex="v" tooltip="v：权重所在的核内列。" /><MathFormulaStatic latex=")+" /><MathFormulaTerm latex="b" tooltip="b：加在求和结果上的偏置。" />
      </MathFormulaBlock>
    </div>
  </ContentBlock>;
}
