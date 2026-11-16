import { useState } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from "@shuku/course-style/react";
import { RgbConvolutionScene, type KernelCount, type RgbPosition } from '../RgbConvolutionPage/RgbConvolutionScene';
import '../RgbConvolutionPage/RgbConvolutionPage.css';
import './MultiKernelPage.css';

const KERNEL_COUNTS: KernelCount[] = [1, 2, 4];

export function MultiKernelPage() {
  const [selected, setSelected] = useState<RgbPosition>({ row: 0, col: 0 });
  const [kernelCount, setKernelCount] = useState<KernelCount>(2);

  return <ContentBlock shuku-edit-id="e-3fc6cf81-1036-4cdb-8c93-a6c892165b01" headingLevel={1} className="cg-copy-ck-rgb cg-copy-ck-multi-replica" title="多核卷积：卷积核数量决定输出深度" subtitle="每个 3 × 3 × 3 卷积核都覆盖三个输入通道；选择 1、2 或 4 个核，观察输出特征图的深度如何变化。">
    <div shuku-edit-id="e-f5c18d09-88ee-4a84-8536-6ec45a34a7d5" className="cg-copy-ck-rgb__stage">
      <div shuku-edit-id="e-916dd333-e0ff-4f01-9dc0-c0831fd0c8c6" className="cg-copy-ck-rgb__scene-wrap">
        <RgbConvolutionScene selected={selected} onSelect={setSelected} kernelCount={kernelCount} />
        <div shuku-edit-id="e-ac8e9e43-c6be-4f04-90b8-e71b694ff379" className="cg-copy-ck-rgb__hint"><Typography shuku-edit-id="e-26b42d9a-a084-4198-8c69-47e5d366633a" variant="bodySmall" tone="muted">卷积核依次读取输入 · 点击格子暂停观察 · 拖动旋转 · 滚轮缩放</Typography></div>
        <div shuku-edit-id="e-8ac8d039-4ad4-4c62-a8cb-16b1ffe58e0f" className="cg-copy-ck-multi-replica__selector" role="group" aria-label="选择卷积核数量">
          {KERNEL_COUNTS.map((count) => <button shuku-edit-id="e-a9e654ff-f776-45be-8646-878353d49d9b" key={count} type="button" aria-pressed={kernelCount === count} className={kernelCount === count ? 'is-selected' : ''} onClick={() => setKernelCount(count)}><Typography shuku-edit-id="e-ecbf872a-b743-4fbe-b400-f7895c4d21b2" as="span" variant="bodySmall" tone="inherit">{count} 个核</Typography></button>)}
        </div>
      </div>
      <div shuku-edit-id="e-cc8160a4-8300-4b11-8c76-f400f397d901" className="cg-copy-ck-rgb__channel-key" aria-label="输入通道颜色"><Typography shuku-edit-id="e-a866708b-00a1-4182-90f4-09a4eb29627d" as="span" variant="bodySmall" tone="accent">R 红色通道</Typography><Typography shuku-edit-id="e-cfc98e2c-b4d3-43a5-80b3-a8cbb297cebc" as="span" variant="bodySmall" tone="accent">G 绿色通道</Typography><Typography shuku-edit-id="e-b15ef823-f499-47e0-a967-cc0a214c6aa5" as="span" variant="bodySmall" tone="accent">B 蓝色通道</Typography></div>
    </div>
    <div shuku-edit-id="e-6e94c050-d8d8-4dc8-9e61-92a207654740" className="cg-copy-ck-rgb__footer">
      <MathFormulaBlock ariaLabel="第 f 个卷积核产生第 f 个输出通道；悬浮在公式符号上可查看解释" className="cg-copy-ck-rgb__formula">
        <MathFormulaTerm latex="Y_f" tooltip="Y₍f₎：第 f 个输出特征图；一个卷积核对应一个输出通道。" /><MathFormulaStatic latex="(" /><MathFormulaTerm latex="i" tooltip="i：输出位置的行索引。" /><MathFormulaStatic latex="," /><MathFormulaTerm latex="j" tooltip="j：输出位置的列索引。" /><MathFormulaStatic latex=")=" />
        <MathFormulaTerm latex={String.raw`\sum_{c\in\{R,G,B\}}`} tooltip="对 R、G、B 三个输入通道求和；每个卷积核都覆盖全部输入通道。" />
        <MathFormulaTerm latex={String.raw`\sum_{u,v=-1}^{1}`} tooltip="对 3 × 3 局部区域求和；u、v 是行列偏移。" />
        <MathFormulaTerm latex="X_c" tooltip="X₍c₎：输入图像的第 c 个颜色通道。" /><MathFormulaStatic latex="(" /><MathFormulaTerm latex="i" tooltip="i：输入窗口起始行。" /><MathFormulaStatic latex="+" /><MathFormulaTerm latex="u" tooltip="u：行偏移。" /><MathFormulaStatic latex="," /><MathFormulaTerm latex="j" tooltip="j：输入窗口起始列。" /><MathFormulaStatic latex="+" /><MathFormulaTerm latex="v" tooltip="v：列偏移。" /><MathFormulaStatic latex=")" />
        <MathFormulaTerm latex="K_{f,c}" tooltip="K₍f,c₎：第 f 个卷积核在第 c 个输入通道上的权重。" /><MathFormulaStatic latex="(" /><MathFormulaTerm latex="u" tooltip="u：核内行索引。" /><MathFormulaStatic latex="," /><MathFormulaTerm latex="v" tooltip="v：核内列索引。" /><MathFormulaStatic latex=")+" /><MathFormulaTerm latex="b_f" tooltip="b₍f₎：第 f 个卷积核对应的偏置。" />
      </MathFormulaBlock>
    </div>
  </ContentBlock>;
}
