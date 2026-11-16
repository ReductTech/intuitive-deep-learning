import { useState } from 'react';
import { Button } from "@shuku/course-style/react/controls/Button";
import { Typography } from "@shuku/course-style/react/typography/Typography";
import { Arrow, Frame, Latent, Photo, Text } from '../components/Diagrams';
import { Reveal, StoryCaption, useStory } from '../components/Story';
import { LessonSplit, TeachingPanel } from '../components/TeachingPanel';
import './VaeBridge.css';

const steps = ['先看起点：已有图像，还是随机噪声？', 'Encoder 压缩图像；扩散模型从噪声逐步生成 latent。', '两种 latent 都交给同一个 Decoder。', '重建原图，或得到新图像。'];

function RouteComparison({ generated }: { generated: boolean }) {
  const story = useStory(steps, 950);
  return <>
    <div shuku-edit-id="e-201fdfe7-5f0e-4ef8-87a2-8cdd80d66b30" className="vga-vae-routes" data-testid="vae-routes" data-route={generated ? 'generate' : 'reconstruct'}>
      {[false, true].map(isGeneration => {
        const active = generated === isGeneration;
        const show = (at: number) => !active || story.step >= at;
        return <div shuku-edit-id="e-d15a0503-3579-4b77-8b6e-d8fabdc5ba98" key={String(isGeneration)} className={'vga-vae-route' + (active ? ' is-selected' : '')} data-testid={isGeneration ? 'route-generate' : 'route-reconstruct'}>
          <div shuku-edit-id="e-27146d5f-420b-46cc-b86b-dfb007f37274" className="vga-vae-route-heading"><Typography variant="bodySmall" tone="accent">{isGeneration ? '生成 · 从噪声创造新图' : '压缩重建 · 还原输入图像'}</Typography><Text muted>{isGeneration ? '无需原图 · 不经过 Encoder' : '需要原图 · 经过 Encoder'}</Text></div>
          <div shuku-edit-id="e-aab65893-3cdd-441f-ab2a-6e0adda85673" className="vga-vae-route-flow">
            <div shuku-edit-id="e-c40899ef-ffff-4725-a718-4e623597e83b" className="vga-vae-stage">{isGeneration ? <><Latent small variant="noisy" /><Text>随机噪声</Text></> : <Photo small label="原图 x" />}</div>
            <Arrow warm={isGeneration} />
            <Reveal show={show(1)} ghost><div shuku-edit-id="e-487f5b02-ce03-49d9-bcf4-9caf319638b3" className={'vga-vae-operation' + (isGeneration ? ' is-diffusion' : '')}><Typography variant="bodySmall" tone="accent">{isGeneration ? '扩散采样' : 'Encoder'}</Typography><Text muted>{isGeneration ? '反复去噪' : '编码压缩'}</Text></div></Reveal>
            <Arrow warm={isGeneration} />
            <Reveal show={show(1)} ghost><div shuku-edit-id="e-5ee50421-6d5e-4e02-af95-ea8653bd9bed" className="vga-vae-stage"><Latent small variant={isGeneration ? 'denoised' : 'encoded'} /><Text>{isGeneration ? '生成 latent' : '编码 latent'}</Text></div></Reveal>
            <Arrow />
            <Reveal show={show(2)} ghost><div shuku-edit-id="e-4f716b86-5ead-4c73-ad52-7b2bf3251a1a" className="vga-vae-operation is-decoder"><Typography variant="bodySmall" tone="accent">Decoder</Typography><Text muted>同一套参数</Text></div></Reveal>
            <Arrow />
            <Reveal show={show(3)} ghost><Photo small label={isGeneration ? '新图像（示意）' : '重建图像 x̂'} /></Reveal>
          </div>
        </div>;
      })}
    </div>
    <StoryCaption story={story} notes={[{at: 0, text: '起点：原图 / 随机噪声'}, {at: 1, text: 'latent：编码 / 采样'}, {at: 3, text: '共用 Decoder 解码'}]} />
  </>;
}

export function VAEBridge() {
  const [route, setRoute] = useState('reconstruct');
  const generated = route === 'generate';
  return <Frame index={6} subtitle="同一个 Decoder，两种 latent 来源：压缩已有图像，或从噪声生成新图像" takeaway="重建依赖原图与 Encoder；生成从噪声采样 latent，再使用同一个 Decoder 解码。">
    <LessonSplit>
      <TeachingPanel title="① 比较两条路线" className="vga-sidebar vga-vae-sidebar">
        <Button active={!generated} data-testid="vae-reconstruct" onClick={() => setRoute('reconstruct')}>观察压缩重建</Button>
        <Button active={generated} data-testid="vae-generate" onClick={() => setRoute('generate')}>观察生成路线</Button>
        <div shuku-edit-id="e-ca854a50-6399-458b-8cc8-0b996ecd7be5" className="vga-vae-premise" data-testid="vae-premise">
          <Typography variant="h3" tone="accent">{generated ? '手里没有原图' : '手里已有原图'}</Typography>
          {generated ? <Latent variant="noisy" /> : <Photo small label="原图" />}
          <Text>{generated ? '随机噪声 → 扩散采样 → latent' : '原图 → 编码 latent → 重建'}</Text>
        </div>
        <Text muted>{generated ? '文本条件将在后续接入。' : '压缩重建会损失部分细节。'}</Text>
      </TeachingPanel>
      <TeachingPanel title="② 起点不同，latent 来源不同，解码器相同" className="vga-vae-comparison">
        <RouteComparison key={route} generated={generated} />
      </TeachingPanel>
    </LessonSplit>
  </Frame>;
}
