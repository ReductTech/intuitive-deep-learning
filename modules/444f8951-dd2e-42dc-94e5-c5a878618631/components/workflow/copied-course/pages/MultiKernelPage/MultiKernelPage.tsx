import { useState } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from "@shuku/course-style/react";
import { RgbConvolutionScene, type KernelCount, type RgbPosition } from '../RgbConvolutionPage/RgbConvolutionScene';
import '../RgbConvolutionPage/RgbConvolutionPage.css';
import './MultiKernelPage.css';

const KERNEL_COUNTS: KernelCount[] = [1, 2, 4];

export function MultiKernelPage() {
  const [selected, setSelected] = useState<RgbPosition>({ row: 0, col: 0 });
  const [kernelCount, setKernelCount] = useState<KernelCount>(2);

  return <ContentBlock shuku-edit-id="e-b0ebd166-3338-4493-a93c-1cb1f466d35b" headingLevel={1} className="cg-copy-ck-rgb cg-copy-ck-multi-replica" title="多核卷积：卷积核数量决定输出深度" subtitle="每个 3 × 3 × 3 卷积核都覆盖三个输入通道；选择 1、2 或 4 个核，观察输出特征图的深度如何变化。">
    <div shuku-edit-id="e-ce51ca84-1b2f-4801-b037-0efbe43281d0" className="cg-copy-ck-rgb__stage">
      <div shuku-edit-id="e-41fa4458-313b-4c04-bc1b-80ef6e22e432" className="cg-copy-ck-rgb__scene-wrap">
        <RgbConvolutionScene selected={selected} onSelect={setSelected} kernelCount={kernelCount} />
        <div shuku-edit-id="e-ab0fb37b-9786-4a81-a398-e4d717d020c1" className="cg-copy-ck-rgb__hint"><Typography shuku-edit-id="e-3bee3391-8a03-43ae-8fac-ee93fb9db3fb" variant="bodySmall" tone="muted">卷积核依次读取输入 · 点击格子暂停观察 · 拖动旋转 · 滚轮缩放</Typography></div>
        <div shuku-edit-id="e-910c4b10-c887-465d-9dc5-7de28d9c83c3" className="cg-copy-ck-multi-replica__selector" role="group" aria-label="选择卷积核数量">
          {KERNEL_COUNTS.map((count) => <button shuku-edit-id="e-6188e55b-bfd7-4f03-a9bb-2e6bbc72f205" key={count} type="button" aria-pressed={kernelCount === count} className={kernelCount === count ? 'is-selected' : ''} onClick={() => setKernelCount(count)}><Typography shuku-edit-id="e-7b10bb7e-22e2-4d65-ae05-698e30018f40" as="span" variant="bodySmall" tone="inherit">{count} 个核</Typography></button>)}
        </div>
      </div>
      <div shuku-edit-id="e-5e714d17-f496-4720-86eb-f7309194f1d5" className="cg-copy-ck-rgb__channel-key" aria-label="输入通道颜色"><Typography shuku-edit-id="e-a8a786c4-f4d5-4f6b-ab5a-b3a74fac3f2b" as="span" variant="bodySmall" tone="accent">R 红色通道</Typography><Typography shuku-edit-id="e-9215aedf-44c2-4f28-bd03-e18af09c407d" as="span" variant="bodySmall" tone="accent">G 绿色通道</Typography><Typography shuku-edit-id="e-3c3d1793-7524-4541-9d48-032bec7676b2" as="span" variant="bodySmall" tone="accent">B 蓝色通道</Typography></div>
    </div>
    <div shuku-edit-id="e-5d88c0b7-96ad-49f0-965d-a26236bd0413" className="cg-copy-ck-rgb__footer">
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
