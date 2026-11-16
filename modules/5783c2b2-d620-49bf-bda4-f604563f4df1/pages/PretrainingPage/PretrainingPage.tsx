import { moduleIdentity } from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
// @refresh reset
import { useState } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
const bottle = moduleAssetUrl("pretraining/bottle-white-cap-hd.jpg");
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
  return <ContentBlock shuku-edit-id="e-ed8033d3-aa86-49fb-9634-6a94ccceb54b" headingLevel={1} className="rtg-pretraining" title="预训练，预先训练了什么？" subtitle="从局部线索，到基础部件"
    data-cue={active} data-seen={seen.join(',')} data-complete={complete}
    onKeyDown={event => { if ((event.key === 'Enter' || event.key === ' ') && (event.target as Element).closest('button')) {
      event.stopPropagation(); if (event.repeat) event.preventDefault();
    } }}>
    <section shuku-edit-id="e-7bc59364-07ad-4f33-9b35-94f6a6dfab9a" className="rtg-pretraining__lab" aria-label="观察已学到的三层线索与预训练参数的联系">
      <div shuku-edit-id="e-37ffc4e3-8a99-487e-a690-e49a495bf896" className="rtg-pretraining__visual">
        <div shuku-edit-id="e-47cefd81-2ccd-40a4-8378-6ff961fb791f" className="rtg-pretraining__source">
          <figure shuku-edit-id="e-00f6d536-25b6-4dc8-afff-2f480f9bb27f" className="rtg-pretraining__observation">
            <div shuku-edit-id="e-37a211e4-401a-43e6-99c2-c18224640a10" className="rtg-pretraining__photo"><img shuku-edit-id="e-ed123d09-5bce-4938-a832-a6142a4bc4db" src={bottle} alt="白色瓶盖、无标签的透明塑料瓶高清教学配图" />
              <svg shuku-edit-id="e-756671ed-a7d5-4c3b-8be8-2b885ceb5ace" viewBox="0 0 1024 1536" role="img" aria-label={'当前定位：' + cue.region} data-highlight={active}>
                <rect shuku-edit-id="e-69fd62f6-c93d-4ffb-9994-b60a0f813a2a" x={cue.box[0]} y={cue.box[1]} width={cue.box[2]} height={cue.box[3]} rx="12" />
                <path shuku-edit-id="e-649dbfed-d390-424d-b0c0-24ddefbf4c96" d={'M' + (cue.box[0] + cue.box[2]) + ' ' + (cue.box[1] + cue.box[3] / 2) + 'H1024'} />
              </svg>
            </div>
            <Typography shuku-edit-id="e-9d553dae-bd79-4535-84e7-a8e3ecde5f74" as="figcaption" variant="bodySmall" tone="muted">同一张图 · 观察线索</Typography>
          </figure>
          <svg shuku-edit-id="e-84b28eb8-8dcd-48d7-81c3-dc2d7ff87d1f" className="rtg-pretraining__connector" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" data-connector={active}>
            <path shuku-edit-id="e-28489325-5ad3-495d-bc4b-de625e23b63b" d={'M0 ' + sourceY + 'H30Q45 ' + sourceY + ' 45 ' + [17, 50, 83][active] + 'H92'} />
            <path shuku-edit-id="e-d6404479-78d4-48d4-affc-1463bd4411e0" className="rtg-pretraining__connector-dot" d={'M92 ' + [17, 50, 83][active] + 'h.01'} />
          </svg>
          <div shuku-edit-id="e-bd5b44ed-ef9f-43ae-8a60-c517bfc6a982" className="rtg-pretraining__cues" aria-label="选择要观察的层级">{PRETRAINING_CUES.map((item, index) =>
            <Button key={item.name} data-cue-choice={index} data-inspected={seen.includes(index)} className={'rtg-pretraining__cue' + (active === index ? ' is-current' : '')}
              hint={seen.length === 0 && index === 2} aria-pressed={active === index} aria-label={item.name + '：' + item.text + (seen.includes(index) ? '，已观察' : '，点击观察')} onClick={() => inspect(index)}>
              <svg shuku-edit-id="e-a44d25f6-9f3b-450c-bd6d-fbfefc3cfed7" className={'rtg-pretraining__crop cue-' + index} viewBox={item.crop} aria-hidden="true">
                <image shuku-edit-id="e-c468a60e-afed-44b3-ba17-13a417a8c1f2" href={bottle} width="1024" height="1536" />
              </svg>
              <div shuku-edit-id="e-755c3bc7-01ad-4c48-9048-ced4b51aca8d"><Typography shuku-edit-id="e-da37d0fb-7112-4fb0-878f-837a245ec236" as="strong" variant="body" tone="inherit">{item.name}</Typography>
                <Typography shuku-edit-id="e-3c90e87e-a875-488e-a1eb-eceb6bb1cf3b" variant="bodySmall" tone="inherit">{item.text}</Typography></div>
              {seen.includes(index) && <svg shuku-edit-id="e-a733280c-0b55-4bbd-9730-7300a3054df3" className="rtg-pretraining__observed" viewBox="0 0 36 36" role="img" aria-label="已观察" data-observed-cue={index}><circle shuku-edit-id="e-d9b77623-5b42-4251-9703-eb40967b5eec" cx="18" cy="18" r="17" /><path shuku-edit-id="e-d386649e-a67c-49e7-879f-f8f41aafeafa" d="M10 18L15 23L26 11" /></svg>}
            </Button>)}</div>
        </div>
        <svg shuku-edit-id="e-a3dcdf2d-5f4b-4bbe-824d-e176dba8a7e5" className="rtg-pretraining__weight-link" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" data-weight-connector={active}>
          <path shuku-edit-id="e-1d51e288-1940-444b-adad-89b8bae3507a" d={'M8 ' + [17, 50, 83][active] + 'H28Q50 ' + [17, 50, 83][active] + ' 50 50H92'} />
          <path shuku-edit-id="e-1dc6d595-cdfd-4acb-9efd-5d2d0fc6ccef" className="rtg-pretraining__weight-link-dot" d={'M8 ' + [17, 50, 83][active] + 'h.01M92 50h.01'} />
        </svg>
        <aside shuku-edit-id="e-94d927cc-ef8d-4b32-a38f-f8657063ee9d" className="rtg-pretraining__weights" aria-label="已经训练好的预训练权重，可作为新任务的起点">
          <div shuku-edit-id="e-f123706c-7d0e-4227-b021-e92cacbd9faf" className="rtg-pretraining__file" data-weight-file>
            <svg shuku-edit-id="e-5e98c09c-bf44-4e96-8ace-333369c08fe7" viewBox="0 0 180 210" aria-hidden="true"><path shuku-edit-id="e-db9f3ea7-0e89-42f8-93d3-9b16fdc37b67" className="rtg-pretraining__file-body" d="M18 4H116L174 62V194Q174 206 162 206H18Q6 206 6 194V16Q6 4 18 4Z" /><path shuku-edit-id="e-69c975ba-9c1f-46fa-be09-31a9da3a9dcf" className="rtg-pretraining__file-fold" d="M116 4V62H174" /></svg>
            <MathFormulaBlock appearance="plain" ariaLabel="theta星：预训练已经学到的参数"><MathFormulaStatic latex="\theta^{*}" /></MathFormulaBlock>
          </div>
          <Typography shuku-edit-id="e-d191825b-98be-4ed6-a090-6771f436c8f3" variant="h3" tone="accent" align="center">预训练权重</Typography>
          <Typography shuku-edit-id="e-d8e2c651-53fb-43e0-a328-b36ae8ab4a80" variant="bodySmall" tone="muted" align="center" data-weight-status="pretrained">已训练 · 可复用</Typography>
        </aside>
      </div>
      <div shuku-edit-id="e-d56cbd5b-72ee-48f4-8323-f09d9c023a33" className="rtg-pretraining__conclusion" role="status" aria-live="polite">
        <Typography shuku-edit-id="e-ca091a71-19c1-48a2-88d9-3a169551723c" as="h2" variant="h3" tone="accent" align="center" data-pretraining-conclusion>视觉经验保存在预训练参数中。</Typography>
        <Typography shuku-edit-id="e-3c1a03c9-b500-460e-a280-999f34f9737e" variant="bodySmall" tone="muted" align="center">这些参数，是新任务的起点。</Typography>
      </div>
    </section>
    <footer shuku-edit-id="e-6cede183-66e4-4b52-af41-ed81b5959a5e" className="rtg-pretraining__footer">
      <Button data-reset onClick={() => { setActive(2); setSeen([]); }}>重新观察</Button></footer>
  </ContentBlock>;
}
