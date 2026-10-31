import { moduleIdentity } from '../../outlines.json';
import { moduleAssetUrl } from '../../../shared/react/assets';
import { useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, NoticeStrip, Typography, type QuestionCheckResult } from '../../../shared/react';
import { RtgQuestion } from '../../components/RtgQuestion/RtgQuestion';
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
import { useTeachingPlayback } from '../../hooks/useTeachingPlayback';
const bottle = moduleAssetUrl(moduleIdentity.id, "recycling/bottle-upright.png");
const can = moduleAssetUrl(moduleIdentity.id, "recycling/can-upright.png");
const carton = moduleAssetUrl(moduleIdentity.id, "recycling/carton-upright.png");
import './ReplaceHeadPage.css';

const samples = [
  { id: 'bottle', label: '塑料瓶', image: bottle, scores: [2.8, .5, -.2] },
  { id: 'can', label: '易拉罐', image: can, scores: [.3, 2.6, .1] },
  { id: 'carton', label: '纸盒', image: carton, scores: [-.1, .4, 2.5] },
] as const;
const classNames = ['塑料瓶', '易拉罐', '纸盒'];

export interface ReplaceHeadPageProps { onComplete?: () => void; }

export function ReplaceHeadPage({ onComplete }: ReplaceHeadPageProps) {
  const [phase, setPhase] = useState<'old' | 'removing' | 'removed' | 'new'>('old');
  const removal = useTeachingPlayback(320);
  const removalStarted = useRef(false);
  const [sampleId, setSampleId] = useState<(typeof samples)[number]['id']>('bottle');
  const [tested, setTested] = useState<Set<string>>(() => new Set());
  const [questionResult, setQuestionResult] = useState<QuestionCheckResult | null>(null);
  const sample = samples.find((item) => item.id === sampleId)!;
  const testedAll = tested.size === samples.length;
  const complete = phase === 'new' && testedAll && Boolean(questionResult?.ok);
  useCompleteOnce(complete, onComplete);
  useEffect(() => { if (phase === 'removing' && removal.frame === 3) setPhase('removed'); }, [phase, removal.frame]);

  function removeOldHead() {
    if (phase !== 'old' || removalStarted.current) return;
    removalStarted.current = true;
    setPhase('removing'); removal.play();
  }

  const test = (id: (typeof samples)[number]['id']) => { if (phase !== 'new') return; setSampleId(id); setTested((current) => new Set([...current, id])); };

  return (
    <ContentBlock headingLevel={1} className="rtg-replace-head" title="旧分类头会答旧问题，怎样让它答新问题？" subtitle="保留预训练视觉骨干，只替换负责输出类别分数的最后一段。" data-phase={phase} data-removal-frame={removal.frame} data-complete={complete} onKeyDown={event => { if (event.key === ' ' && event.target instanceof HTMLButtonElement) event.stopPropagation(); }}>
      <section className={`rtg-replace-head__lab${testedAll ? ' has-bottom-panel' : ''}`} aria-label="替换分类头实验">
        <div className="rtg-replace-head__samples">
          <Typography as="strong" variant="body" tone="warning">新任务输入</Typography>
          {samples.map((item) => <Button key={item.id} data-sample-id={item.id} variant={sampleId === item.id ? 'primary' : 'default'} active={sampleId === item.id} disabled={phase !== 'new'} onClick={() => test(item.id)}><img src={item.image} alt="" aria-hidden="true" /><Typography as="span" variant="bodySmall" tone="inherit">{item.label}</Typography></Button>)}
          <Typography variant="bodySmall" tone="muted">接入新分类头后，依次检查三类样本。</Typography>
        </div>

        <div className="rtg-replace-head__model">
          <article className="rtg-replace-head__backbone" data-retained-backbone><Typography variant="bodySmall" tone="accent">保留结构与预训练参数</Typography><Typography as="strong" variant="h2" tone="accent">预训练 ResNet-18</Typography><div>{['边缘','纹理','部件','结构'].map((label) => <Typography as="span" variant="bodySmall" tone="accent" key={label}>{label}</Typography>)}</div></article>
          <Typography as="span" className="rtg-replace-head__connection" data-connected={phase === 'old' || phase === 'new'} variant="h2" tone="warning">→</Typography>
          <div className={'rtg-replace-head__head-slot is-' + phase} aria-busy={phase === 'removing'}>
          <article className={`rtg-replace-head__head is-${phase}`}>
            {(phase === 'old' || phase === 'removing') && <><Typography variant="bodySmall" tone="warning">旧分类头 · 仅替换这里</Typography><Typography as="strong" variant="h3" tone="accent">它属于哪个旧类别？</Typography><Typography variant="bodySmall" tone="muted">例如：猫、狗、汽车</Typography><Typography variant="bodySmall" tone="accent">输出旧类别分数</Typography></>}
            {phase === 'removed' && <><Typography variant="bodySmall" tone="warning">接口空缺</Typography><Typography as="strong" variant="h2" tone="muted">?</Typography><Typography variant="bodySmall" tone="muted">骨干仍输出特征 z</Typography></>}
            {phase === 'new' && <><Typography variant="bodySmall" tone="warning">新分类头</Typography><Typography as="strong" variant="h3" tone="success">3 类分数</Typography><Typography variant="bodySmall" tone="muted">塑料瓶 · 易拉罐 · 纸盒</Typography></>}
          </article>
          </div>
        </div>

        <div className="rtg-replace-head__controls">
          <Button data-remove-head variant={phase === 'old' ? 'primary' : 'default'} disabled={phase !== 'old'} onClick={removeOldHead}><Typography as="span" variant="body" tone="inherit">{phase === 'removing' ? '① 正在移除…' : '① 移除旧分类头'}</Typography></Button>
          <Button data-install-head variant={phase === 'removed' ? 'primary' : 'default'} disabled={phase !== 'removed'} onClick={() => { if (phase === 'removed') setPhase('new'); }}><Typography as="span" variant="body" tone="inherit">② 接入三分类头</Typography></Button>
        </div>

        <article className={`rtg-replace-head__output${phase === 'new' ? ' is-ready' : ''}`}>
          <Typography as="strong" variant="body" tone="warning">当前输出</Typography>
          {phase !== 'new' ? <Typography variant="body" tone="muted">等待接入新分类头</Typography> : classNames.map((label, index) => <div key={label}><Typography variant="bodySmall" tone={index === samples.findIndex((item) => item.id === sampleId) ? 'success' : 'muted'}>{label}</Typography><span><i style={{ width: `${Math.max(8, (sample.scores[index] + .5) * 28)}%` }} /></span><Typography variant="bodySmall" tone="accent">{sample.scores[index].toFixed(1)}</Typography></div>)}
          {phase === 'new' && <Typography variant="bodySmall" tone="success">最高分：{sample.label}</Typography>}
        </article>
      </section>

      {testedAll && <RtgQuestion pageId="23-replace-head" questionId="new-output-count" className="rtg-replace-head__question" type="choice" typeLabel="分类头检查" title="为什么新的分类头需要输出 3 个类别分数？" answer="classes" options={[{ value: 'classes', label: '新任务需要比较塑料瓶、易拉罐和纸盒三种答案' }, { value: 'channels', label: '骨干网络最后只有3个通道', wrongFeedback: '骨干最后通常有很多通道，分类头把它们映射成任务类别分数。' }, { value: 'images', label: '训练集中只有3张图片', wrongFeedback: '类别数与图片总数不是一回事。' }]} feedback={{ correct: '正确。分类头的输出维度由新任务的类别空间决定。' }} onCheck={setQuestionResult} />}
      <NoticeStrip tone={complete ? 'green' : 'blue'} role="status"><Typography variant="body" tone="inherit">{complete ? '骨干继续提供视觉表示，新分类头把表示映射为当前任务的三个类别分数。' : phase === 'old' ? '先移除只会回答旧问题的分类头。' : phase === 'removing' ? '旧分类头正在划走，视觉骨干保持原样。' : phase === 'removed' ? '视觉骨干仍然存在；现在接入新的三分类头。' : !testedAll ? `新分类头已接入，还需检查 ${samples.length - tested.size} 类样本。` : '三类输出已经检查完毕，请完成理解题。'}</Typography></NoticeStrip>
    </ContentBlock>
  );
}
