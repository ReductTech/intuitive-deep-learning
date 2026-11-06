// @refresh reset
import { useEffect, useState } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography, type QuestionCheckResult } from '../../../shared/react';
import { RtgQuestion } from '../../components/RtgQuestion/RtgQuestion';
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
import { useTeachingPlayback } from '../../hooks/useTeachingPlayback';
import { neighborsFor, getQuerySamples, startingFrames, type StartingSample } from './model';
import './StartingPointsPage.css';
import { withAssetResources } from '../../../shared/react/withAssetResources';

export interface StartingPointsPageProps { onComplete?: () => void; }
function SamplePicture({ sample, className = '' }: { sample: StartingSample; className?: string }) {
  return <svg className={'rtg-starting__sample ' + className} viewBox={sample.viewBox} role="img" aria-label={sample.label} data-picture-id={sample.id}>
    <image href={sample.image} width={sample.width} height={sample.height} />
  </svg>;
}
function WeightFile() {
  return <div className="rtg-starting__weight-file"><svg viewBox="0 0 60 72" aria-hidden="true"><path d="M5 2H39L58 21V69H5Z" /><path className="file-fold" d="M39 2V21H58" /></svg>
    <MathFormulaBlock appearance="plain" ariaLabel="预训练权重theta星"><MathFormulaStatic latex="\theta^{*}" /></MathFormulaBlock>
  </div>;
}
function StartingArchitecture({ loaded, loading, frame }: { loaded: boolean; loading: boolean; frame: number }) {
  const QUERY_SAMPLES = getQuerySamples();
  return <div className="rtg-starting__architecture" data-architecture="single">
    <figure className="rtg-starting__input"><SamplePicture sample={QUERY_SAMPLES[0]} /><Typography as="figcaption" variant="bodySmall" tone="muted">输入图像</Typography></figure>
    <svg className="rtg-starting__input-arrow" viewBox="0 0 40 30" aria-hidden="true"><path d="M2 15H35M25 5L35 15L25 25" /></svg>
    <div className="rtg-starting__backbone" data-backbone-structure="resnet18">
      <div className={'rtg-starting__checkpoint' + (loading ? ' is-loading' : '')} data-checkpoint={loading || loaded}>
        {(loading || loaded) && <><WeightFile /><svg className={'rtg-starting__load-path' + (loaded || frame >= 1 ? ' is-flowing' : '')} viewBox="0 0 160 70" aria-hidden="true"><path d="M15 2V24Q15 52 43 52H150M139 41L150 52L139 63" /></svg></>}
      </div>
      <svg className={'rtg-starting__slabs' + (loaded ? ' is-loaded' : loading && frame >= 2 ? ' is-receiving' : '')} viewBox="0 0 350 160" aria-hidden="true">
        {[0, 58, 116, 244, 280].map((x, index) => <g key={x} data-backbone-glyph transform={'translate(' + x + ',' + (index === 1 ? 8 : index === 2 ? 18 : 0) + ')'}>
          <path className="slab-top" d="M2 35L29 9H58L31 35Z" /><path className="slab-side" d="M31 35L58 9V111L31 137Z" /><path className="slab-front" d="M2 35H31V137H2Z" />
        </g>)}<g className="rtg-starting__ellipsis">{[198, 216, 234].map(cx => <circle key={cx} cx={cx} cy="89" r="3" />)}</g>
      </svg>
      <Typography variant="bodySmall" tone="accent" align="center">ResNet-18 · 结构保持不变</Typography>
    </div>
    <svg className="rtg-starting__head-arrow" viewBox="0 0 40 30" aria-hidden="true"><path d="M2 15H35M25 5L35 15L25 25" /></svg>
    <div className="rtg-starting__head" data-new-head><Typography variant="bodySmall" tone="accent" align="center">新分类头</Typography></div>
  </div>;
}
function StartingPointsContent({ onComplete }: StartingPointsPageProps) {
  const QUERY_SAMPLES = getQuerySamples();
  const [phase, setPhase] = useState<0 | 1>(0), [loaded, setLoaded] = useState(false), [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(0), [compared, setCompared] = useState<number[]>([]);
  const [quiz, setQuiz] = useState(false), [result, setResult] = useState<QuestionCheckResult | null>(null);
  const playback = useTeachingPlayback(500);
  const ready = compared.length === QUERY_SAMPLES.length, complete = ready && Boolean(result?.ok), input = QUERY_SAMPLES[query];
  useCompleteOnce(complete, onComplete);
  useEffect(() => { if (loading && playback.frame === 3) { setLoaded(true); setLoading(false); } }, [loading, playback.frame]);
  function reset() { playback.reset(); setPhase(0); setLoaded(false); setLoading(false); setQuery(0); setCompared([]); setQuiz(false); setResult(null); }
  function visit(index: number) {
    if (loading || index !== 0 && index !== 1 || index === 1 && !loaded) return;
    setQuiz(false); setPhase(index);
    if (index === 1) setCompared(previous => previous.includes(query) ? previous : [...previous, query]);
  }
  function load() { if (loading || loaded) return; setLoading(true); playback.play(); }
  function changeInput() {
    if (phase !== 1 || !loaded || loading) return;
    const next = (query + 1) % QUERY_SAMPLES.length;
    setQuery(next); setCompared(previous => previous.includes(next) ? previous : [...previous, next]);
  }
  return <ContentBlock headingLevel={1} className="rtg-starting" title="同样的 ResNet-18，不同的参数起点" subtitle="同一结构、不同起点"
    data-phase={phase} data-loaded={loaded} data-loading={loading} data-load-frame={playback.frame} data-query={query} data-compared={compared.join(',')} data-complete={complete} data-quiz={quiz}
    onKeyDown={event => { if ((event.key === 'Enter' || event.key === ' ') && (event.target as Element).closest('button')) { event.stopPropagation(); if (event.repeat) event.preventDefault(); } }}>
    <section className="rtg-starting__studio" aria-label="先装入参数，再用相同输入比较两组表示">
      <nav className="rtg-starting__nav" aria-label="实验阶段">{['1 · 参数装入', '2 · 相似对照'].map((label, index) => <Button key={label} data-phase-choice={index} variant={!quiz && phase === index ? 'primary' : 'default'} disabled={loading || index === 1 && !loaded} onClick={() => visit(index)}>{label}</Button>)}
        {!quiz && phase === 1 && <Typography className="rtg-starting__conditions" variant="bodySmall" tone="accent">同一输入、结构、新分类头，仅骨干参数起点不同</Typography>}
      </nav>
      {quiz ? <div className="rtg-starting__quiz">
        <RtgQuestion pageId="21-starting-points" questionId="same-network-different-start" type="choice" typeLabel="起点检查" title="网络结构相同，为什么训练前的表示也可能不同？"
          answer="weights" options={[{ value: 'weights', label: '参数起点不同：一组随机，一组来自预训练' },
            { value: 'architecture', label: '预训练增加了网络层数', wrongFeedback: '两边都使用相同的 ResNet-18 结构。' },
            { value: 'answers', label: '预训练已经包含新任务的标准答案', wrongFeedback: '视觉经验不等于新任务答案。' }]}
          feedback={{ correct: '预训练改变参数起点；新分类头仍需学习当前任务。' }} onCheck={setResult} />
        <Button onClick={() => setQuiz(false)}>返回对照实验</Button>
      </div> : phase === 0 ? <div className="rtg-starting__intro">
        <StartingArchitecture loaded={loaded} loading={loading} frame={playback.frame} />
        <div className="rtg-starting__parameter-note" role="status" aria-live="polite"><div>
          <Typography variant="body" tone="accent">{loading ? '正在装入预训练权重…' : loaded ? '✓ 已装入预训练权重' : '当前骨干：随机初始化'}</Typography>
          <Typography variant="bodySmall" tone="muted">只替换骨干参数，结构与新分类头保持不变。</Typography>
        </div>{loaded ? <Button className="rtg-starting__open-comparison" data-open-comparison variant="primary" hint onClick={() => visit(1)}>查看随机起点/预训练起点相似对照</Button> : <Button data-load variant="primary" hint disabled={loading} onClick={load}>{loading ? '正在装入…' : '装入预训练权重'}</Button>}</div>
      </div> : <div className="rtg-starting__comparison">
        <aside className="rtg-starting__query" aria-label="A与B共用同一张输入图片">
          <Typography as="h2" variant="body" tone="accent" align="center">同一输入</Typography>
          <Button className="rtg-starting__query-image" data-query-input onClick={changeInput} aria-label={'点击改变输入，当前为' + input.label}><SamplePicture sample={input} /><Typography as="span" variant="body" tone="accent">{input.label}</Typography></Button>
          <Button data-change-input variant="primary" hint onClick={changeInput}>点击改变输入</Button>
          <Typography variant="bodySmall" tone="muted" align="center">两边同时换图，权重不变</Typography>
        </aside>
        {[false, true].map(pretrained => {
          const neighbors = neighborsFor(query, pretrained);
          return <article className={'rtg-starting__parameter-side' + (pretrained ? ' is-pretrained' : '')} key={String(pretrained)} data-parameter-side={pretrained ? 'B' : 'A'} data-parameter-source={pretrained ? '预训练权重' : '随机初始化'} data-parameter-status={pretrained ? 'loaded' : 'random'} data-input-id={input.id}>
            <header><Typography as="h2" variant="body" tone="accent">{pretrained ? 'B · 预训练起点' : 'A · 随机起点'}</Typography><div className="rtg-starting__status">
              {pretrained && <MathFormulaBlock appearance="plain" ariaLabel="已装入的预训练权重theta星"><MathFormulaStatic latex="\theta^{*}" /></MathFormulaBlock>}
              <Typography as="span" variant="bodySmall" tone="accent">{pretrained ? '已装入权重' : '随机初始化'}</Typography>
            </div></header>
            <div className="rtg-starting__neighbors" key={query} aria-label={(pretrained ? 'B' : 'A') + '组八张相似图片的教学排序'}>{neighbors.map((sample, rank) => <figure key={sample.id} className={pretrained && rank < 4 ? 'is-leading' : ''} data-neighbor-side={pretrained ? 'B' : 'A'} data-sample-id={sample.id} data-category={sample.category} data-rank={rank + 1}>
              <Typography as="span" className="rtg-starting__rank" variant="bodySmall" tone="accent">{rank + 1}</Typography>
              <SamplePicture sample={sample} /><Typography as="figcaption" variant="bodySmall" tone="accent">{sample.label}</Typography>
            </figure>)}</div>
            <Typography variant="bodySmall" tone="muted">{pretrained ? '示例：多种' + (input.category === 0 ? '瓶子' : input.category === 1 ? '罐子' : '纸盒') + '共享的线索排在前面。' : '示例：同一批图片，相似排序较混杂。'}</Typography>
          </article>;
        })}
      </div>}
      <footer className="rtg-starting__footer"><Typography variant="bodySmall" tone="muted">{quiz ? '已有经验 ≠ 新任务答案' : phase === 0 ? '装入已有权重，不增加网络层数。' : 'A/B 候选图相同；相似排序为教学示意，非模型实测。'}</Typography>
        <Button data-reset onClick={reset}>重新开始</Button>
        {!quiz && phase === 1 && ready && <Button data-open-quiz variant="primary" onClick={() => setQuiz(true)}>理解检查 →</Button>}
      </footer>
    </section>
  </ContentBlock>;
}

export const StartingPointsPage = withAssetResources(StartingPointsContent, [startingFrames]);
