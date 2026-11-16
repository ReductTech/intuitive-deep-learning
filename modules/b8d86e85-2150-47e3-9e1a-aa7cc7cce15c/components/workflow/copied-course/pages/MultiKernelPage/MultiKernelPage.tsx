import { useState } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from "@shuku/course-style/react";
import { RgbConvolutionScene, type KernelCount, type RgbPosition } from '../RgbConvolutionPage/RgbConvolutionScene';
import '../RgbConvolutionPage/RgbConvolutionPage.css';
import './MultiKernelPage.css';

const KERNEL_COUNTS: KernelCount[] = [1, 2, 4];

export function MultiKernelPage() {
  const [selected, setSelected] = useState<RgbPosition>({ row: 0, col: 0 });
  const [kernelCount, setKernelCount] = useState<KernelCount>(2);

  return <ContentBlock shuku-edit-id="e-80161345-d64e-4c1d-8fe8-9cd03cfd6440" headingLevel={1} className="cg-copy-ck-rgb cg-copy-ck-multi-replica" title="多核卷积：卷积核数量决定输出深度" subtitle="每个 3 × 3 × 3 卷积核都覆盖三个输入通道；选择 1、2 或 4 个核，观察输出特征图的深度如何变化。">
    <div shuku-edit-id="e-b6f7393a-7fde-4d92-be1e-f7f8727a05e2" className="cg-copy-ck-rgb__stage">
      <div shuku-edit-id="e-ae70af1c-7bc2-4547-89e3-c1927cf71278" className="cg-copy-ck-rgb__scene-wrap">
        <RgbConvolutionScene selected={selected} onSelect={setSelected} kernelCount={kernelCount} />
        <div shuku-edit-id="e-54358f25-00d5-4a36-9de2-48b7095714d0" className="cg-copy-ck-rgb__hint"><Typography shuku-edit-id="e-68e2a4cf-c295-494e-8c4b-ed8bfede5433" variant="bodySmall" tone="muted">卷积核依次读取输入 · 点击格子暂停观察 · 拖动旋转 · 滚轮缩放</Typography></div>
        <div shuku-edit-id="e-9cdb255f-12c2-4480-9b34-45fe8eea597e" className="cg-copy-ck-multi-replica__selector" role="group" aria-label="选择卷积核数量">
          {KERNEL_COUNTS.map((count) => <button shuku-edit-id="e-10b30bb8-6ca8-4b9d-b4c7-4bf8d8c873af" key={count} type="button" aria-pressed={kernelCount === count} className={kernelCount === count ? 'is-selected' : ''} onClick={() => setKernelCount(count)}><Typography shuku-edit-id="e-48b3358e-03cc-4265-9805-822eca7a5204" as="span" variant="bodySmall" tone="inherit">{count} 个核</Typography></button>)}
        </div>
      </div>
      <div shuku-edit-id="e-96693623-82c8-4d72-a919-42ed51e8b456" className="cg-copy-ck-rgb__channel-key" aria-label="输入通道颜色"><Typography shuku-edit-id="e-d33304f3-cef6-4efd-89d0-12b5ecf20dde" as="span" variant="bodySmall" tone="accent">R 红色通道</Typography><Typography shuku-edit-id="e-8f369bce-4f5a-4317-8e3f-5d1afb1774a7" as="span" variant="bodySmall" tone="accent">G 绿色通道</Typography><Typography shuku-edit-id="e-872771a5-0699-4b87-9d14-1f18ead4ec85" as="span" variant="bodySmall" tone="accent">B 蓝色通道</Typography></div>
    </div>
    <div shuku-edit-id="e-aa485e9f-d090-4587-a68d-87d0db06f6e8" className="cg-copy-ck-rgb__footer">
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
