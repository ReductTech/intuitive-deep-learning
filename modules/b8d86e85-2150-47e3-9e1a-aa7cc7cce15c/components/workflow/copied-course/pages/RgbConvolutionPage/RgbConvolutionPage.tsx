import { useState } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from "@shuku/course-style/react";
import { RgbConvolutionScene, type RgbPosition } from './RgbConvolutionScene';
import './RgbConvolutionPage.css';

export function RgbConvolutionPage() {
  const [selected, setSelected] = useState<RgbPosition>({ row: 2, col: 2 });
  return <ContentBlock shuku-edit-id="e-5a7e236a-40dd-4f58-b3d8-32c0f6f24596" headingLevel={1} className="cg-copy-ck-rgb" title="RGB 多通道卷积" subtitle="一个 3 × 3 × 3 卷积核覆盖三个输入通道，不填充边界，逐位置合成输出。">
    <div shuku-edit-id="e-8fcd0196-c49e-4b3d-8351-eea978b57d15" className="cg-copy-ck-rgb__stage">
      <div shuku-edit-id="e-fb6d6adb-d104-4ffa-98ff-c63e18d9a812" className="cg-copy-ck-rgb__scene-wrap">
        <RgbConvolutionScene selected={selected} onSelect={setSelected} />
        <div shuku-edit-id="e-d6d7e48f-05e7-41ac-beee-6563d611f805" className="cg-copy-ck-rgb__hint"><Typography shuku-edit-id="e-4d0ee911-6aa2-49ec-909f-adf08f602a0a" variant="bodySmall" tone="muted">自动逐格卷积 · 点击格子暂停观察 · 拖动旋转 · 滚轮缩放</Typography></div>
      </div>
      <div shuku-edit-id="e-e4f81f85-e656-4b4e-9032-c1ab4a794266" className="cg-copy-ck-rgb__channel-key" aria-label="输入通道颜色"><Typography shuku-edit-id="e-ec59c209-56e5-4321-a0b6-978d3fb3023a" as="span" variant="bodySmall" tone="accent">R 红色通道</Typography><Typography shuku-edit-id="e-e9379ae2-00ce-49f3-8123-719669fef2d2" as="span" variant="bodySmall" tone="accent">G 绿色通道</Typography><Typography shuku-edit-id="e-adbb2116-415d-49cd-aa40-8ef8bc39ba4f" as="span" variant="bodySmall" tone="accent">B 蓝色通道</Typography></div>
    </div>
    <div shuku-edit-id="e-ac87304e-9c6c-4845-a81b-8aaaa2f313fe" className="cg-copy-ck-rgb__footer">
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
