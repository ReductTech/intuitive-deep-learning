import { useId, useState } from 'react';
import { Button } from "@shuku/course-style/react/controls/Button";
import { RangeControl } from "@shuku/course-style/react/controls/RangeControl";
import { courseAssetUrl } from '../assets';
import { Formula, Frame, Photo, Text } from '../components/Diagrams';
import { Readout } from '../components/Story';
import { LessonSplit, TeachingPanel } from '../components/TeachingPanel';
import './PixelToLatent.css';

// Fixed reference textures: only the illustrated noise contribution changes.
// These are not intermediate tensors produced by a trained diffusion model.
function SamplingLatent({ progress }: { progress: number }) {
  const id = useId().replaceAll(':', '');
  const asset = (file: string) => courseAssetUrl(file);
  const planes = [
    '395,9 522,44 522,238 433,212 433,50 395,39',
    '273,17 423,58 423,257 318,228 318,67 273,55',
    '142,26 306,72 306,266 203,237 203,76 142,59',
    '9,37 190,86 190,278 9,239',
  ];
  return <div shuku-edit-id="e-be08bbe4-6178-4407-ab0f-b3bef0c785ca" className="vga-sampling-latent" data-testid="sampling-latent" data-progress={progress}>
    <svg shuku-edit-id="e-c840f358-65dd-4fc1-9fff-5433a86273ca" viewBox="0 0 530 293" role="img" aria-label={`latent 去噪示意，已完成 ${Math.round(progress * 100)}%`}>
      <defs shuku-edit-id="e-c72f195a-878f-4e34-9c81-cf362d50b463">{planes.map((points, i) => <clipPath shuku-edit-id="e-bb5a1698-3300-4fc9-98c4-decc352e0de2" key={i} id={`${id}-${i}`}><polygon shuku-edit-id="e-2404dee0-299c-477a-9a2f-b5bf5f427d14" points={points} /></clipPath>)}</defs>
      <image shuku-edit-id="e-8d540c8b-e9e5-4bf0-87e6-1c232413dc51" href={asset("visuals/latent-color.webp")} width="530" height="293" />
      {planes.map((_, i) => <g shuku-edit-id="e-487fc65a-e3e4-4034-b7d9-3f2938be8c7e" key={i} clipPath={`url(#${id}-${i})`} opacity={1 - progress}>
        <image shuku-edit-id="e-4127d3c7-4bd7-4ac6-9765-5a9ae001311d" href={asset("visuals/noise-prediction.webp")} x={i * 17 - 20} y={-i * 11} width="570" height="330" preserveAspectRatio="none" />
      </g>)}
    </svg>
    <Text muted>去噪状态示意 · 固定初始噪声</Text>
  </div>;
}
export function PixelToLatent() {
  const [resolution, setResolution] = useState(512);
  const [steps, setSteps] = useState(30);
  const [currentStep, setCurrentStep] = useState(10);
  const progress = currentStep / steps;
  const positions = resolution ** 2 * steps;
  return <Frame index={5} subtitle="委托升级为高清图：每一步都处理完整像素网格，工作会增加多少？" takeaway="把重复工作搬到较小的空间；空间位置数可直接计算，实际速度仍取决于实现。">
    <div shuku-edit-id="e-92cee26b-b76e-42d9-a26a-8d6477458c65" className="vga-comparison-controls vga-sampling-controls"><div shuku-edit-id="e-5a364023-0ff0-4eda-9644-092658fdecc2" className="vga-stage-tabs"><Text>图像分辨率</Text>{[512,1024].map(n => <Button key={n} active={resolution === n} data-testid={`resolution-${n}`} onClick={() => setResolution(n)}>{n} × {n}</Button>)}</div>
      <RangeControl label="总采样步数 N" data-testid="sampling-total" value={steps} min={10} max={50} step={10} onChange={e => { const total = Number(e.target.value); setSteps(total); setCurrentStep(k => Math.min(k, total)); }} />
      <RangeControl label="当前已完成 k 步" data-testid="sampling-current" value={currentStep} min={0} max={steps} step={1} formatValue={value => `${value} / ${steps}`} onChange={e => setCurrentStep(Number(e.target.value))} />
    </div>
    <LessonSplit equal>
      <TeachingPanel title="① 像素空间 · Pixel Space" className="vga-space-panel">
        <Photo noise={1 - progress} label={`去噪进度 ${Math.round(progress * 100)}%`} />
        <Formula latex={`${resolution}\\times${resolution}\\times3`} />
        <Readout label="重复处理的位置数（空间 × 步数）" value={positions.toLocaleString()} />
        <div shuku-edit-id="e-d0b2515d-86d6-4a6d-8092-404cbc81fd91" className="vga-work-bar"><div shuku-edit-id="e-01e7cc0e-0d34-4cac-9072-113a804bc124" style={{width: '100%'}} /></div>
      </TeachingPanel>
      <TeachingPanel title="② 潜在空间 · Latent Space" className="vga-space-panel">
        <SamplingLatent progress={progress} />
        <Formula latex={`${resolution/8}\\times${resolution/8}\\times4`} />
        <Readout label="本例位置数缩小为 1 / 64" value={(positions/64).toLocaleString()} warm />
        <div shuku-edit-id="e-f08dd4b9-6f93-4394-9793-de956fbb7076" className="vga-work-bar is-warm"><div shuku-edit-id="e-330d8355-bc45-4fad-9032-0a6ca6fa61c3" style={{width: '1.5625%'}} /></div>
      </TeachingPanel>
    </LessonSplit>
    <div shuku-edit-id="e-7ddd61ef-cf26-44cc-aad3-65bcc5bb3727" className="vga-sampling-explanation"><Text muted>总步数改变时保留当前步 k；状态按 k / N 示意。拖动 k 观察去噪，特征图尺寸保持不变。</Text></div>
  </Frame>;
}
