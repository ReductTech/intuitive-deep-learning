import { moduleIdentity } from '../../outlines.json';
import { moduleAssetUrl } from '../../../shared/react/assets';
// @refresh reset
import { useState } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
const bottle = moduleAssetUrl(moduleIdentity.id, "pretraining/bottle-white-cap-hd.png");
import './PretrainingPage.css';

export const PRETRAINING_CUES = [
  { name: '底层', text: '边缘、线条、明暗变化', region: '瓶身边缘', crop: '210 300 260 260', box: [230, 300, 180, 300] },
  { name: '中层', text: '纹理、拐角、局部形状', region: '瓶身纹理', crop: '230 850 380 380', box: [190, 930, 640, 280] },
  { name: '高层', text: '基础部件', region: '瓶口与瓶盖', crop: '270 30 480 480', box: [330, 55, 365, 260] },
] as const;
export interface PretrainingPageProps { onComplete?: () => void; }
export function PretrainingPage({ onComplete }: PretrainingPageProps) {
  const [active, setActive] = useState(2), [seen, setSeen] = useState<number[]>([]);
  const complete = seen.length === PRETRAINING_CUES.length, cue = PRETRAINING_CUES[active];
  const sourceY = (cue.box[1] + cue.box[3] / 2) / 1536 * 100;
  useCompleteOnce(complete, onComplete);
  function inspect(index: number) {
    if (!Number.isInteger(index) || index < 0 || index > 2) return;
    setActive(index); setSeen(previous => previous.includes(index) ? previous : [...previous, index]);
  }
  return <ContentBlock headingLevel={1} className="rtg-pretraining" title="预训练，预先训练了什么？" subtitle="从局部线索，到基础部件"
    data-cue={active} data-seen={seen.join(',')} data-complete={complete}
    onKeyDown={event => { if ((event.key === 'Enter' || event.key === ' ') && (event.target as Element).closest('button')) {
      event.stopPropagation(); if (event.repeat) event.preventDefault();
    } }}>
    <section className="rtg-pretraining__lab" aria-label="观察已学到的三层线索与预训练参数的联系">
      <div className="rtg-pretraining__visual">
        <div className="rtg-pretraining__source">
          <figure className="rtg-pretraining__observation">
            <div className="rtg-pretraining__photo"><img src={bottle} alt="白色瓶盖、无标签的透明塑料瓶高清教学配图" />
              <svg viewBox="0 0 1024 1536" role="img" aria-label={'当前定位：' + cue.region} data-highlight={active}>
                <rect x={cue.box[0]} y={cue.box[1]} width={cue.box[2]} height={cue.box[3]} rx="12" />
                <path d={'M' + (cue.box[0] + cue.box[2]) + ' ' + (cue.box[1] + cue.box[3] / 2) + 'H1024'} />
              </svg>
            </div>
            <Typography as="figcaption" variant="bodySmall" tone="muted">同一张图 · 观察线索</Typography>
          </figure>
          <svg className="rtg-pretraining__connector" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" data-connector={active}>
            <path d={'M0 ' + sourceY + 'H30Q45 ' + sourceY + ' 45 ' + [17, 50, 83][active] + 'H92'} />
            <path className="rtg-pretraining__connector-dot" d={'M92 ' + [17, 50, 83][active] + 'h.01'} />
          </svg>
          <div className="rtg-pretraining__cues" aria-label="选择要观察的层级">{PRETRAINING_CUES.map((item, index) =>
            <Button key={item.name} data-cue-choice={index} data-inspected={seen.includes(index)} className={'rtg-pretraining__cue' + (active === index ? ' is-current' : '')}
              hint={seen.length === 0 && index === 2} aria-pressed={active === index} aria-label={item.name + '：' + item.text + (seen.includes(index) ? '，已观察' : '，点击观察')} onClick={() => inspect(index)}>
              <svg className={'rtg-pretraining__crop cue-' + index} viewBox={item.crop} aria-hidden="true">
                <image href={bottle} width="1024" height="1536" />
              </svg>
              <div><Typography as="strong" variant="body" tone="inherit">{item.name}</Typography>
                <Typography variant="bodySmall" tone="inherit">{item.text}</Typography></div>
              {seen.includes(index) && <svg className="rtg-pretraining__observed" viewBox="0 0 36 36" role="img" aria-label="已观察" data-observed-cue={index}><circle cx="18" cy="18" r="17" /><path d="M10 18L15 23L26 11" /></svg>}
            </Button>)}</div>
        </div>
        <svg className="rtg-pretraining__weight-link" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" data-weight-connector={active}>
          <path d={'M8 ' + [17, 50, 83][active] + 'H28Q50 ' + [17, 50, 83][active] + ' 50 50H92'} />
          <path className="rtg-pretraining__weight-link-dot" d={'M8 ' + [17, 50, 83][active] + 'h.01M92 50h.01'} />
        </svg>
        <aside className="rtg-pretraining__weights" aria-label="已经训练好的预训练权重，可作为新任务的起点">
          <div className="rtg-pretraining__file" data-weight-file>
            <svg viewBox="0 0 180 210" aria-hidden="true"><path className="rtg-pretraining__file-body" d="M18 4H116L174 62V194Q174 206 162 206H18Q6 206 6 194V16Q6 4 18 4Z" /><path className="rtg-pretraining__file-fold" d="M116 4V62H174" /></svg>
            <MathFormulaBlock appearance="plain" ariaLabel="theta星：预训练已经学到的参数"><MathFormulaStatic latex="\theta^{*}" /></MathFormulaBlock>
          </div>
          <Typography variant="h3" tone="accent" align="center">预训练权重</Typography>
          <Typography variant="bodySmall" tone="muted" align="center" data-weight-status="pretrained">已训练 · 可复用</Typography>
        </aside>
      </div>
      <div className="rtg-pretraining__conclusion" role="status" aria-live="polite">
        <Typography as="h2" variant="h3" tone="accent" align="center" data-pretraining-conclusion>视觉经验保存在预训练参数中。</Typography>
        <Typography variant="bodySmall" tone="muted" align="center">这些参数，是新任务的起点。</Typography>
      </div>
    </section>
    <footer className="rtg-pretraining__footer">
      <Button data-reset onClick={() => { setActive(2); setSeen([]); }}>重新观察</Button></footer>
  </ContentBlock>;
}
