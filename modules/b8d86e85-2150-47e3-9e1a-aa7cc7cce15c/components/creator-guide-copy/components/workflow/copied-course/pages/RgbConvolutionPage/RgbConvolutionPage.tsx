import { useState } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from "@shuku/course-style/react";
import { RgbConvolutionScene, type RgbPosition } from './RgbConvolutionScene';
import './RgbConvolutionPage.css';

export function RgbConvolutionPage() {
  const [selected, setSelected] = useState<RgbPosition>({ row: 2, col: 2 });
  return <ContentBlock shuku-edit-id="e-c2230b96-ad3c-4ba0-8d36-cfc75ebe60b3" headingLevel={1} className="aipe-replay-cg-copy-ck-rgb" title="RGB 多通道卷积" subtitle="一个 3 × 3 × 3 卷积核覆盖三个输入通道，不填充边界，逐位置合成输出。">
    <div shuku-edit-id="e-0becc257-79a6-482c-9d2d-c43d425081c5" className="aipe-replay-cg-copy-ck-rgb__stage">
      <div shuku-edit-id="e-23b922fa-7f20-41c5-b374-6cb27cabc707" className="aipe-replay-cg-copy-ck-rgb__scene-wrap">
        <RgbConvolutionScene selected={selected} onSelect={setSelected} />
        <div shuku-edit-id="e-fbd6e5ab-c27e-4d0f-acb0-185a477f5a0a" className="aipe-replay-cg-copy-ck-rgb__hint"><Typography shuku-edit-id="e-d5977184-f8cb-48a8-bcc3-4b08d00db148" variant="bodySmall" tone="muted">自动逐格卷积 · 点击格子暂停观察 · 拖动旋转 · 滚轮缩放</Typography></div>
      </div>
      <div shuku-edit-id="e-8c4e80a0-a631-4347-a495-457f195eff2d" className="aipe-replay-cg-copy-ck-rgb__channel-key" aria-label="输入通道颜色"><Typography shuku-edit-id="e-c44b26a8-38c5-419b-bc8a-07d1dbd6006f" as="span" variant="bodySmall" tone="accent">R 红色通道</Typography><Typography shuku-edit-id="e-3039fb2d-3e37-4b26-abc3-12f0b2a623bc" as="span" variant="bodySmall" tone="accent">G 绿色通道</Typography><Typography shuku-edit-id="e-03672bf3-24b8-4fbd-96ef-332bf0555a30" as="span" variant="bodySmall" tone="accent">B 蓝色通道</Typography></div>
    </div>
    <div shuku-edit-id="e-13c6139b-5ca9-430d-b5c5-875c97e08776" className="aipe-replay-cg-copy-ck-rgb__footer">
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
