import { useState } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from "@shuku/course-style/react";
import { RgbConvolutionScene, type KernelCount, type RgbPosition } from '../RgbConvolutionPage/RgbConvolutionScene';
import '../RgbConvolutionPage/RgbConvolutionPage.css';
import './MultiKernelPage.css';

const KERNEL_COUNTS: KernelCount[] = [1, 2, 4];

export function MultiKernelPage() {
  const [selected, setSelected] = useState<RgbPosition>({ row: 0, col: 0 });
  const [kernelCount, setKernelCount] = useState<KernelCount>(2);

  return <ContentBlock shuku-edit-id="e-cd73126a-7ad5-4b12-9d8f-c9a9c41eeb8f" headingLevel={1} className="aipe-replay-cg-copy-ck-rgb aipe-replay-cg-copy-ck-multi-replica" title="多核卷积：卷积核数量决定输出深度" subtitle="每个 3 × 3 × 3 卷积核都覆盖三个输入通道；选择 1、2 或 4 个核，观察输出特征图的深度如何变化。">
    <div shuku-edit-id="e-6671d7e0-9311-40e7-9d6a-41597ddd21d9" className="aipe-replay-cg-copy-ck-rgb__stage">
      <div shuku-edit-id="e-d237010e-5991-48e0-893b-88d2e7573998" className="aipe-replay-cg-copy-ck-rgb__scene-wrap">
        <RgbConvolutionScene selected={selected} onSelect={setSelected} kernelCount={kernelCount} />
        <div shuku-edit-id="e-26cf2caf-a74d-49be-b734-b214c61f9eff" className="aipe-replay-cg-copy-ck-rgb__hint"><Typography shuku-edit-id="e-73300932-295f-4b5c-ae90-7af837426532" variant="bodySmall" tone="muted">卷积核依次读取输入 · 点击格子暂停观察 · 拖动旋转 · 滚轮缩放</Typography></div>
        <div shuku-edit-id="e-b92f6320-d85b-4f7a-bfc1-cbfba9272329" className="aipe-replay-cg-copy-ck-multi-replica__selector" role="group" aria-label="选择卷积核数量">
          {KERNEL_COUNTS.map((count) => <button shuku-edit-id="e-62307b75-f9f0-49e3-8712-cedb5bc0f2da" key={count} type="button" aria-pressed={kernelCount === count} className={kernelCount === count ? 'is-selected' : ''} onClick={() => setKernelCount(count)}><Typography shuku-edit-id="e-6f7f0f42-5586-4886-b8ef-587edd89514a" as="span" variant="bodySmall" tone="inherit">{count} 个核</Typography></button>)}
        </div>
      </div>
      <div shuku-edit-id="e-1db6ed4f-094c-4c15-8f4a-b51c47b8052a" className="aipe-replay-cg-copy-ck-rgb__channel-key" aria-label="输入通道颜色"><Typography shuku-edit-id="e-bf0cb887-da9f-449f-b9b4-25d35c26223e" as="span" variant="bodySmall" tone="accent">R 红色通道</Typography><Typography shuku-edit-id="e-eb24e0e6-0eab-4df1-a111-295de6759a3f" as="span" variant="bodySmall" tone="accent">G 绿色通道</Typography><Typography shuku-edit-id="e-ecdb7501-67fd-4125-a85b-de745f4a47e2" as="span" variant="bodySmall" tone="accent">B 蓝色通道</Typography></div>
    </div>
    <div shuku-edit-id="e-3cf00fc6-0b74-4dae-a3dd-7d56d43e7b86" className="aipe-replay-cg-copy-ck-rgb__footer">
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
