import { useId, useState } from 'react';
import { Button } from '../../shared/react/controls/Button';
import { RangeControl } from '../../shared/react/controls/RangeControl';
import { courseAssetUrl } from '../assets';
import { Formula, Frame, Photo, Text } from '../components/Diagrams';
import { Readout } from '../components/Story';
import { LessonSplit, TeachingPanel } from '../components/TeachingPanel';
import './PixelToLatent.css';

// Fixed reference textures: only the illustrated noise contribution changes.
// These are not intermediate tensors produced by a trained diffusion model.
function SamplingLatent({ progress }: { progress: number }) {
  const id = useId().replaceAll(':', '');
  const asset = (name: string) => courseAssetUrl(`visuals/${name}.png`);
  const planes = [
    '395,9 522,44 522,238 433,212 433,50 395,39',
    '273,17 423,58 423,257 318,228 318,67 273,55',
    '142,26 306,72 306,266 203,237 203,76 142,59',
    '9,37 190,86 190,278 9,239',
  ];
  return <div className="vga-sampling-latent" data-testid="sampling-latent" data-progress={progress}>
    <svg viewBox="0 0 530 293" role="img" aria-label={`latent 去噪示意，已完成 ${Math.round(progress * 100)}%`}>
      <defs>{planes.map((points, i) => <clipPath key={i} id={`${id}-${i}`}><polygon points={points} /></clipPath>)}</defs>
      <image href={asset('latent-color')} width="530" height="293" />
      {planes.map((_, i) => <g key={i} clipPath={`url(#${id}-${i})`} opacity={1 - progress}>
        <image href={asset('noise-prediction')} x={i * 17 - 20} y={-i * 11} width="570" height="330" preserveAspectRatio="none" />
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
    <div className="vga-comparison-controls vga-sampling-controls"><div className="vga-stage-tabs"><Text>图像分辨率</Text>{[512,1024].map(n => <Button key={n} active={resolution === n} data-testid={`resolution-${n}`} onClick={() => setResolution(n)}>{n} × {n}</Button>)}</div>
      <RangeControl label="总采样步数 N" data-testid="sampling-total" value={steps} min={10} max={50} step={10} onChange={e => { const total = Number(e.target.value); setSteps(total); setCurrentStep(k => Math.min(k, total)); }} />
      <RangeControl label="当前已完成 k 步" data-testid="sampling-current" value={currentStep} min={0} max={steps} step={1} formatValue={value => `${value} / ${steps}`} onChange={e => setCurrentStep(Number(e.target.value))} />
    </div>
    <LessonSplit equal>
      <TeachingPanel title="① 像素空间 · Pixel Space" className="vga-space-panel">
        <Photo noise={1 - progress} label={`去噪进度 ${Math.round(progress * 100)}%`} />
        <Formula latex={`${resolution}\\times${resolution}\\times3`} />
        <Readout label="重复处理的位置数（空间 × 步数）" value={positions.toLocaleString()} />
        <div className="vga-work-bar"><div style={{width: '100%'}} /></div>
      </TeachingPanel>
      <TeachingPanel title="② 潜在空间 · Latent Space" className="vga-space-panel">
        <SamplingLatent progress={progress} />
        <Formula latex={`${resolution/8}\\times${resolution/8}\\times4`} />
        <Readout label="本例位置数缩小为 1 / 64" value={(positions/64).toLocaleString()} warm />
        <div className="vga-work-bar is-warm"><div style={{width: '1.5625%'}} /></div>
      </TeachingPanel>
    </LessonSplit>
    <div className="vga-sampling-explanation"><Text muted>总步数改变时保留当前步 k；状态按 k / N 示意。拖动 k 观察去噪，特征图尺寸保持不变。</Text></div>
  </Frame>;
}
