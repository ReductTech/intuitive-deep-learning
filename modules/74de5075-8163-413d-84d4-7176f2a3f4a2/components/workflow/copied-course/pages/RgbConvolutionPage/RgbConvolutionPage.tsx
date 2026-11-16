import { useState } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from "@shuku/course-style/react";
import { RgbConvolutionScene, type RgbPosition } from './RgbConvolutionScene';
import './RgbConvolutionPage.css';

export function RgbConvolutionPage() {
  const [selected, setSelected] = useState<RgbPosition>({ row: 2, col: 2 });
  return <ContentBlock shuku-edit-id="e-4bfefb74-08b7-4b98-b42e-fe53e226d99b" headingLevel={1} className="cg-copy-ck-rgb" title="RGB 多通道卷积" subtitle="一个 3 × 3 × 3 卷积核覆盖三个输入通道，不填充边界，逐位置合成输出。">
    <div shuku-edit-id="e-98776e15-d217-4d4b-8bbb-6c9a2d7a15fb" className="cg-copy-ck-rgb__stage">
      <div shuku-edit-id="e-4e6e174f-b381-4e58-b52c-8b98236092a1" className="cg-copy-ck-rgb__scene-wrap">
        <RgbConvolutionScene selected={selected} onSelect={setSelected} />
        <div shuku-edit-id="e-fb244010-8278-4683-8f9b-b59419e9eeb2" className="cg-copy-ck-rgb__hint"><Typography shuku-edit-id="e-7f0e4c66-a6b0-4b0e-8019-433834a1b0b2" variant="bodySmall" tone="muted">自动逐格卷积 · 点击格子暂停观察 · 拖动旋转 · 滚轮缩放</Typography></div>
      </div>
      <div shuku-edit-id="e-c98f4724-117d-40ad-a36b-38371ab8a294" className="cg-copy-ck-rgb__channel-key" aria-label="输入通道颜色"><Typography shuku-edit-id="e-d1d09ee9-6152-49f3-9c7b-b0f86f34c213" as="span" variant="bodySmall" tone="accent">R 红色通道</Typography><Typography shuku-edit-id="e-af99ee4c-56bf-4316-9a0b-91e82a1e4e6f" as="span" variant="bodySmall" tone="accent">G 绿色通道</Typography><Typography shuku-edit-id="e-94391661-7e11-46d1-b7db-3a26d971df36" as="span" variant="bodySmall" tone="accent">B 蓝色通道</Typography></div>
    </div>
    <div shuku-edit-id="e-c3774104-7a58-4b9f-83d8-3c9c3ac097d5" className="cg-copy-ck-rgb__footer">
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
