import { useState } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from '../../../shared/react';
import { RgbConvolutionScene, type KernelCount, type RgbPosition } from '../RgbConvolutionPage/RgbConvolutionScene';
import '../RgbConvolutionPage/RgbConvolutionPage.css';
import './MultiKernelPage.css';

const KERNEL_COUNTS: KernelCount[] = [1, 2, 4];

export function MultiKernelPage() {
  const [selected, setSelected] = useState<RgbPosition>({ row: 2, col: 2 });
  const [kernelCount, setKernelCount] = useState<KernelCount>(2);

  return <ContentBlock headingLevel={1} className="ck-rgb ck-multi-replica" title="多核卷积：卷积核数量决定输出深度" subtitle="每个 3 × 3 × 3 卷积核都覆盖三个输入通道；选择 1、2 或 4 个核，观察输出特征图的深度如何变化。">
    <div className="ck-rgb__stage">
      <div className="ck-rgb__scene-wrap">
        <RgbConvolutionScene selected={selected} onSelect={setSelected} kernelCount={kernelCount} />
        <div className="ck-rgb__hint"><Typography variant="bodySmall" tone="muted">自动逐格卷积 · 点击格子暂停观察 · 拖动旋转 · 滚轮缩放</Typography></div>
        <div className="ck-multi-replica__selector" role="group" aria-label="选择卷积核数量">
          {KERNEL_COUNTS.map((count) => <button key={count} type="button" aria-pressed={kernelCount === count} className={kernelCount === count ? 'is-selected' : ''} onClick={() => setKernelCount(count)}><Typography as="span" variant="bodySmall" tone="inherit">{count} 个核</Typography></button>)}
        </div>
      </div>
      <div className="ck-rgb__channel-key" aria-label="输入通道颜色"><Typography as="span" variant="bodySmall" tone="accent">R 红色通道</Typography><Typography as="span" variant="bodySmall" tone="accent">G 绿色通道</Typography><Typography as="span" variant="bodySmall" tone="accent">B 蓝色通道</Typography></div>
    </div>
    <div className="ck-rgb__footer">
      <MathFormulaBlock ariaLabel="第 f 个卷积核产生第 f 个输出通道；悬浮在公式符号上可查看解释" className="ck-rgb__formula">
        <MathFormulaTerm latex="Y_f" tooltip="Y₍f₎：第 f 个输出特征图；一个卷积核对应一个输出通道。" /><MathFormulaStatic latex="(" /><MathFormulaTerm latex="i" tooltip="i：输出位置的行索引。" /><MathFormulaStatic latex="," /><MathFormulaTerm latex="j" tooltip="j：输出位置的列索引。" /><MathFormulaStatic latex=")=" />
        <MathFormulaTerm latex={String.raw`\sum_{c\in\{R,G,B\}}`} tooltip="对 R、G、B 三个输入通道求和；每个卷积核都覆盖全部输入通道。" />
        <MathFormulaTerm latex={String.raw`\sum_{u,v=-1}^{1}`} tooltip="对 3 × 3 局部区域求和；u、v 是行列偏移。" />
        <MathFormulaTerm latex="X_c" tooltip="X₍c₎：输入图像的第 c 个颜色通道。" /><MathFormulaStatic latex="(" /><MathFormulaTerm latex="i" tooltip="i：输入窗口起始行。" /><MathFormulaStatic latex="+" /><MathFormulaTerm latex="u" tooltip="u：行偏移。" /><MathFormulaStatic latex="," /><MathFormulaTerm latex="j" tooltip="j：输入窗口起始列。" /><MathFormulaStatic latex="+" /><MathFormulaTerm latex="v" tooltip="v：列偏移。" /><MathFormulaStatic latex=")" />
        <MathFormulaTerm latex="K_{f,c}" tooltip="K₍f,c₎：第 f 个卷积核在第 c 个输入通道上的权重。" /><MathFormulaStatic latex="(" /><MathFormulaTerm latex="u" tooltip="u：核内行索引。" /><MathFormulaStatic latex="," /><MathFormulaTerm latex="v" tooltip="v：核内列索引。" /><MathFormulaStatic latex=")+" /><MathFormulaTerm latex="b_f" tooltip="b₍f₎：第 f 个卷积核对应的偏置。" />
      </MathFormulaBlock>
    </div>
  </ContentBlock>;
}
