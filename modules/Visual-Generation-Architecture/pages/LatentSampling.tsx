import { Typography } from '../../shared/react/typography/Typography';
import { Arrow, Flow, Frame, Latent, Photo, ReferenceVisual, Text } from '../components/Diagrams';
import { Mission, StoryCaption, useStory } from '../components/Story';
import { LessonSplit, TeachingPanel } from '../components/TeachingPanel';

const steps = ['开始生成：只拿到随机 latent 噪声与文本委托。', '第一次预测：主干读取当前状态、时间与文本。', '第一次更新：采样器使用预测，得到新的 latent。', '第二次预测：同一套参数，再读取更新后的状态。', '第二次更新：采样器计算下一个状态。', '第三次预测：主干继续提供当前阶段的预测。', '第三次更新：latent 沿采样路径继续变化。', '最后一次预测：仍然由同一个主干完成。', '最后一次更新：得到最终 latent，准备解码。', '循环结束，Decoder 只在此时把最终 latent 转为图像。'];
export function LatentSampling() {
  const story = useStory(steps, 700);
  const finished = story.step === 9;
  const predicting = story.step % 2 === 1 && !finished;
  return <Frame index={8} subtitle="现在接下真正的委托：交替完成预测和更新，直到可以解码" takeaway="主干预测与采样更新交替发生；最终 latent 在循环结束后解码。">
    <LessonSplit>
      <TeachingPanel title="① 委托与生成结果" className="vga-sidebar vga-sampling-result">
        <Mission chapter="文本条件">一个正在学习的小猫</Mission>
        <div className={finished ? 'vga-decoded is-visible' : 'vga-decoded'}><Photo label="最终解码图像" /></div>
        <div className="vga-panel-callout"><Text>{finished ? '最终 latent → Decoder → 图像' : '采样完成后，才进行最终解码。'}</Text></div>
        <Text muted>文本复用，主干参数保持不变。</Text>
      </TeachingPanel>
      <TeachingPanel title="② 预测与更新 · 反复执行同一主干" className="vga-sampling-panel">
        <div className="vga-sampling-sequence" data-sampling-step={story.step}>
          <Flow><div className={'vga-story-station' + (predicting ? ' is-current' : '')}><Typography variant="h3" tone="accent">网络预测</Typography><ReferenceVisual name="unet-mini" alt="参考图中的去噪网络" style={{width: 180, height: 70}} /><Text>同一套主干参数</Text></div><Arrow warm /><div className={'vga-story-station is-warm' + (story.step>0 && !predicting && !finished ? ' is-current' : '')}><Typography variant="h3" tone="accent">采样更新</Typography><Text>计算下一状态</Text></div><Arrow /><div className="vga-center"><Latent variant={story.step < 2 ? 'noisy' : story.step < 8 ? 'encoded' : 'denoised'} phase={Math.floor(story.step/2)} /><Text>{story.step === 0 ? '随机 latent 噪声' : '当前 latent'}</Text></div></Flow>
          <div className="vga-loop-route"><svg viewBox="0 0 900 50" aria-hidden="true"><path d="M840 2V32H60V2M48 16L60 2 72 16" fill="none" stroke="var(--ui-accent-alt)" strokeWidth="3" strokeDasharray={story.playing ? '12 8' : undefined} /></svg><Text>更新状态 → 再次预测</Text></div>
        </div>
        <div className="vga-panel-callout"><Text>采样更新：{Math.floor(story.step/2)} / 4</Text></div>
        <StoryCaption story={story} notes={[{at: 0, text: '从 latent 噪声出发'}, {at: 1, text: '主干预测 → 采样更新'}, {at: 9, text: '循环结束后再解码'}]} />
      </TeachingPanel>
    </LessonSplit>
  </Frame>;
}
