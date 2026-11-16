import { useState } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from "@shuku/course-style/react";
import { RgbConvolutionScene, type RgbPosition } from './RgbConvolutionScene';
import './RgbConvolutionPage.css';

export function RgbConvolutionPage() {
  const [selected, setSelected] = useState<RgbPosition>({ row: 2, col: 2 });
  return <ContentBlock shuku-edit-id="e-d2b6a570-895e-47f3-8cf9-8a962ee6f33f" headingLevel={1} className="aipe-replay-cg-copy-ck-rgb" title="RGB 多通道卷积" subtitle="一个 3 × 3 × 3 卷积核覆盖三个输入通道，不填充边界，逐位置合成输出。">
    <div shuku-edit-id="e-f8dbe52b-3d02-487e-8b43-603bebfaffd5" className="aipe-replay-cg-copy-ck-rgb__stage">
      <div shuku-edit-id="e-fca6c526-0163-4324-93da-493d0555e078" className="aipe-replay-cg-copy-ck-rgb__scene-wrap">
        <RgbConvolutionScene selected={selected} onSelect={setSelected} />
        <div shuku-edit-id="e-a146ca50-d8e4-427f-af55-ac7e29abdd4e" className="aipe-replay-cg-copy-ck-rgb__hint"><Typography shuku-edit-id="e-855de7bd-8b5f-453a-bbe5-18bd1f7a0bf3" variant="bodySmall" tone="muted">自动逐格卷积 · 点击格子暂停观察 · 拖动旋转 · 滚轮缩放</Typography></div>
      </div>
      <div shuku-edit-id="e-7f205fb9-bcf1-4177-8353-835a7e6f406b" className="aipe-replay-cg-copy-ck-rgb__channel-key" aria-label="输入通道颜色"><Typography shuku-edit-id="e-a4272108-2e9c-40d5-9592-846ff461b822" as="span" variant="bodySmall" tone="accent">R 红色通道</Typography><Typography shuku-edit-id="e-b484b41b-21e2-41ff-880b-b375d6af0513" as="span" variant="bodySmall" tone="accent">G 绿色通道</Typography><Typography shuku-edit-id="e-6394c504-7cbd-4c88-85e3-c8fb5a713622" as="span" variant="bodySmall" tone="accent">B 蓝色通道</Typography></div>
    </div>
    <div shuku-edit-id="e-ea2b0249-af6e-4758-ae0e-d972106e570e" className="aipe-replay-cg-copy-ck-rgb__footer">
      <MathFormulaBlock ariaLabel="RGB 三通道三乘三卷积公式；悬浮在各符号上可查看解释" className="aipe-replay-cg-copy-ck-rgb__formula">
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
