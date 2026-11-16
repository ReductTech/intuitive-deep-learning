import { useState } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from "@shuku/course-style/react";
import { RgbConvolutionScene, type KernelCount, type RgbPosition } from '../RgbConvolutionPage/RgbConvolutionScene';
import '../RgbConvolutionPage/RgbConvolutionPage.css';
import './MultiKernelPage.css';

const KERNEL_COUNTS: KernelCount[] = [1, 2, 4];

export function MultiKernelPage() {
  const [selected, setSelected] = useState<RgbPosition>({ row: 0, col: 0 });
  const [kernelCount, setKernelCount] = useState<KernelCount>(2);

  return <ContentBlock shuku-edit-id="e-8aa940c4-2fbf-45ef-8447-a0165b63143a" headingLevel={1} className="aipe-replay-cg-copy-ck-rgb aipe-replay-cg-copy-ck-multi-replica" title="多核卷积：卷积核数量决定输出深度" subtitle="每个 3 × 3 × 3 卷积核都覆盖三个输入通道；选择 1、2 或 4 个核，观察输出特征图的深度如何变化。">
    <div shuku-edit-id="e-33b13bc2-ca27-4876-8d0c-ae8e8aa27312" className="aipe-replay-cg-copy-ck-rgb__stage">
      <div shuku-edit-id="e-1779eee4-b298-4b80-993b-657eb5d833ce" className="aipe-replay-cg-copy-ck-rgb__scene-wrap">
        <RgbConvolutionScene selected={selected} onSelect={setSelected} kernelCount={kernelCount} />
        <div shuku-edit-id="e-1f7f7121-fa31-47c4-98bd-8a01fbee8b52" className="aipe-replay-cg-copy-ck-rgb__hint"><Typography shuku-edit-id="e-89c37cf6-b508-4bdd-abec-636b69867856" variant="bodySmall" tone="muted">卷积核依次读取输入 · 点击格子暂停观察 · 拖动旋转 · 滚轮缩放</Typography></div>
        <div shuku-edit-id="e-f1b170ea-4abc-407a-afb9-cb252aa69802" className="aipe-replay-cg-copy-ck-multi-replica__selector" role="group" aria-label="选择卷积核数量">
          {KERNEL_COUNTS.map((count) => <button shuku-edit-id="e-9517248b-aa7e-45a2-8ebe-dbad89d7a523" key={count} type="button" aria-pressed={kernelCount === count} className={kernelCount === count ? 'is-selected' : ''} onClick={() => setKernelCount(count)}><Typography shuku-edit-id="e-a92e3dc1-39ec-456c-97ea-77e27dc7a0a6" as="span" variant="bodySmall" tone="inherit">{count} 个核</Typography></button>)}
        </div>
      </div>
      <div shuku-edit-id="e-d3cb880c-36e9-4225-aac3-2c28246b98e4" className="aipe-replay-cg-copy-ck-rgb__channel-key" aria-label="输入通道颜色"><Typography shuku-edit-id="e-77022222-2a6e-4d5f-bb07-a7cf7392f0da" as="span" variant="bodySmall" tone="accent">R 红色通道</Typography><Typography shuku-edit-id="e-8dc3282d-86d2-430c-ac24-a67b512b154a" as="span" variant="bodySmall" tone="accent">G 绿色通道</Typography><Typography shuku-edit-id="e-fe40ad86-80d5-4d1f-a3cb-3574a354a4fe" as="span" variant="bodySmall" tone="accent">B 蓝色通道</Typography></div>
    </div>
    <div shuku-edit-id="e-6611951c-0eb9-4fc4-a745-12b2d06b3660" className="aipe-replay-cg-copy-ck-rgb__footer">
      <MathFormulaBlock ariaLabel="第 f 个卷积核产生第 f 个输出通道；悬浮在公式符号上可查看解释" className="aipe-replay-cg-copy-ck-rgb__formula">
        <MathFormulaTerm latex="Y_f" tooltip="Y₍f₎：第 f 个输出特征图；一个卷积核对应一个输出通道。" /><MathFormulaStatic latex="(" /><MathFormulaTerm latex="i" tooltip="i：输出位置的行索引。" /><MathFormulaStatic latex="," /><MathFormulaTerm latex="j" tooltip="j：输出位置的列索引。" /><MathFormulaStatic latex=")=" />
        <MathFormulaTerm latex={String.raw`\sum_{c\in\{R,G,B\}}`} tooltip="对 R、G、B 三个输入通道求和；每个卷积核都覆盖全部输入通道。" />
        <MathFormulaTerm latex={String.raw`\sum_{u,v=-1}^{1}`} tooltip="对 3 × 3 局部区域求和；u、v 是行列偏移。" />
        <MathFormulaTerm latex="X_c" tooltip="X₍c₎：输入图像的第 c 个颜色通道。" /><MathFormulaStatic latex="(" /><MathFormulaTerm latex="i" tooltip="i：输入窗口起始行。" /><MathFormulaStatic latex="+" /><MathFormulaTerm latex="u" tooltip="u：行偏移。" /><MathFormulaStatic latex="," /><MathFormulaTerm latex="j" tooltip="j：输入窗口起始列。" /><MathFormulaStatic latex="+" /><MathFormulaTerm latex="v" tooltip="v：列偏移。" /><MathFormulaStatic latex=")" />
        <MathFormulaTerm latex="K_{f,c}" tooltip="K₍f,c₎：第 f 个卷积核在第 c 个输入通道上的权重。" /><MathFormulaStatic latex="(" /><MathFormulaTerm latex="u" tooltip="u：核内行索引。" /><MathFormulaStatic latex="," /><MathFormulaTerm latex="v" tooltip="v：核内列索引。" /><MathFormulaStatic latex=")+" /><MathFormulaTerm latex="b_f" tooltip="b₍f₎：第 f 个卷积核对应的偏置。" />
      </MathFormulaBlock>
    </div>
  </ContentBlock>;
}
