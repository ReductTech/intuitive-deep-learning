// @refresh reset
import { useEffect, useState } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography, type QuestionCheckResult } from "@shuku/course-style/react";
import { RtgQuestion } from '../../components/RtgQuestion/RtgQuestion';
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
import { useTeachingPlayback } from '../../hooks/useTeachingPlayback';
import { neighborsFor, getQuerySamples, startingFrames, type StartingSample } from './model';
import './StartingPointsPage.css';
import { withAssetResources } from "@shuku/course-style/react/withAssetResources";

export interface StartingPointsPageProps { onComplete?: () => void; }
function SamplePicture({ sample, className = '' }: { sample: StartingSample; className?: string }) {
  return <svg shuku-edit-id="e-56cf8a9f-9cae-4d24-bb4a-380db4e10d76" className={'rtg-starting__sample ' + className} viewBox={sample.viewBox} role="img" aria-label={sample.label} data-picture-id={sample.id}>
    <image shuku-edit-id="e-28c00f3a-9f54-45b6-bb89-b051d3035e64" href={sample.image} width={sample.width} height={sample.height} />
  </svg>;
}
function WeightFile() {
  return <div shuku-edit-id="e-e1a09e0e-de28-41f0-998c-03d0ff5e8a48" className="rtg-starting__weight-file"><svg shuku-edit-id="e-402cef8a-6b1f-4a8e-9411-2842e7cb03fe" viewBox="0 0 60 72" aria-hidden="true"><path shuku-edit-id="e-4cf934ef-6c43-4fb0-ace4-a10a21c6f0f2" d="M5 2H39L58 21V69H5Z" /><path shuku-edit-id="e-a80176f7-3b02-4a01-913f-f475ee4ef018" className="file-fold" d="M39 2V21H58" /></svg>
    <MathFormulaBlock appearance="plain" ariaLabel="预训练权重theta星"><MathFormulaStatic latex="\theta^{*}" /></MathFormulaBlock>
  </div>;
}
function StartingArchitecture({ loaded, loading, frame }: { loaded: boolean; loading: boolean; frame: number }) {
  const QUERY_SAMPLES = getQuerySamples();
  return <div shuku-edit-id="e-6990741d-3bc3-48ff-ac1c-2ce1cecdd844" className="rtg-starting__architecture" data-architecture="single">
    <figure shuku-edit-id="e-616883cc-e535-46b2-a813-9f578c5fa1f6" className="rtg-starting__input"><SamplePicture sample={QUERY_SAMPLES[0]} /><Typography shuku-edit-id="e-ae34dfb6-61f3-4d15-bab2-61d8890b6c75" as="figcaption" variant="bodySmall" tone="muted">输入图像</Typography></figure>
    <svg shuku-edit-id="e-2a6de747-83f3-4a10-a82d-d49c10e8389f" className="rtg-starting__input-arrow" viewBox="0 0 40 30" aria-hidden="true"><path shuku-edit-id="e-e1081b57-eb4d-41d0-85cb-58c96e5a5f99" d="M2 15H35M25 5L35 15L25 25" /></svg>
    <div shuku-edit-id="e-a64f2e3d-7dd0-42b1-a55d-a7e83626ef54" className="rtg-starting__backbone" data-backbone-structure="resnet18">
      <div shuku-edit-id="e-8a1629a7-1067-4a0f-a137-39599f73052f" className={'rtg-starting__checkpoint' + (loading ? ' is-loading' : '')} data-checkpoint={loading || loaded}>
        {(loading || loaded) && <><WeightFile /><svg shuku-edit-id="e-b2f07f85-7706-4d8e-94be-cc1215fc7f07" className={'rtg-starting__load-path' + (loaded || frame >= 1 ? ' is-flowing' : '')} viewBox="0 0 160 70" aria-hidden="true"><path shuku-edit-id="e-f7d3b687-cea2-4e73-b704-73dc7123a0d7" d="M15 2V24Q15 52 43 52H150M139 41L150 52L139 63" /></svg></>}
      </div>
      <svg shuku-edit-id="e-174adce1-425a-4e96-a9f5-75d246858f6d" className={'rtg-starting__slabs' + (loaded ? ' is-loaded' : loading && frame >= 2 ? ' is-receiving' : '')} viewBox="0 0 350 160" aria-hidden="true">
        {[0, 58, 116, 244, 280].map((x, index) => <g shuku-edit-id="e-4f9ca71a-db60-4285-b605-76f4c164b2b8" key={x} data-backbone-glyph transform={'translate(' + x + ',' + (index === 1 ? 8 : index === 2 ? 18 : 0) + ')'}>
          <path shuku-edit-id="e-e6081171-2db0-4969-9665-207dcfa1fbc1" className="slab-top" d="M2 35L29 9H58L31 35Z" /><path shuku-edit-id="e-25677ef6-e3ed-4e2e-865f-d5b13267ee6b" className="slab-side" d="M31 35L58 9V111L31 137Z" /><path shuku-edit-id="e-f902e717-a232-482f-94c8-a2e5cc78bda2" className="slab-front" d="M2 35H31V137H2Z" />
        </g>)}<g shuku-edit-id="e-7971dc53-6a43-4060-b2e8-2181543b81c1" className="rtg-starting__ellipsis">{[198, 216, 234].map(cx => <circle shuku-edit-id="e-96f41f10-28af-47c4-bb9a-5f36a7533bf2" key={cx} cx={cx} cy="89" r="3" />)}</g>
      </svg>
      <Typography shuku-edit-id="e-9c4a3dea-d850-4979-89dd-3c901ea5a033" variant="bodySmall" tone="accent" align="center">ResNet-18 · 结构保持不变</Typography>
    </div>
    <svg shuku-edit-id="e-6e58ff77-c82b-4ec9-a3bd-c07a61250b57" className="rtg-starting__head-arrow" viewBox="0 0 40 30" aria-hidden="true"><path shuku-edit-id="e-3be231ee-f594-43b0-a0f7-1636f6c60a78" d="M2 15H35M25 5L35 15L25 25" /></svg>
    <div shuku-edit-id="e-b571ef0e-4c43-4e9c-a237-e76d9b6faf31" className="rtg-starting__head" data-new-head><Typography shuku-edit-id="e-0f2841f3-acf1-474b-942d-611f5bd993a7" variant="bodySmall" tone="accent" align="center">新分类头</Typography></div>
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
  return <ContentBlock shuku-edit-id="e-5897baf3-a654-4416-9547-5721882463c8" headingLevel={1} className="rtg-starting" title="同样的 ResNet-18，不同的参数起点" subtitle="同一结构、不同起点"
    data-phase={phase} data-loaded={loaded} data-loading={loading} data-load-frame={playback.frame} data-query={query} data-compared={compared.join(',')} data-complete={complete} data-quiz={quiz}
    onKeyDown={event => { if ((event.key === 'Enter' || event.key === ' ') && (event.target as Element).closest('button')) { event.stopPropagation(); if (event.repeat) event.preventDefault(); } }}>
    <section shuku-edit-id="e-b2f56365-b21f-4b1a-9898-22f591a81e0f" className="rtg-starting__studio" aria-label="先装入参数，再用相同输入比较两组表示">
      <nav shuku-edit-id="e-7860d049-bbae-4906-82ab-5bbe4a1fb536" className="rtg-starting__nav" aria-label="实验阶段">{['1 · 参数装入', '2 · 相似对照'].map((label, index) => <Button key={label} data-phase-choice={index} variant={!quiz && phase === index ? 'primary' : 'default'} disabled={loading || index === 1 && !loaded} onClick={() => visit(index)}>{label}</Button>)}
        {!quiz && phase === 1 && <Typography shuku-edit-id="e-edea6c4e-4d7c-4db8-95c4-a289dbe19dc2" className="rtg-starting__conditions" variant="bodySmall" tone="accent">同一输入、结构、新分类头，仅骨干参数起点不同</Typography>}
      </nav>
      {quiz ? <div shuku-edit-id="e-cb2c6032-ca84-4b44-b0d2-aa0442e2443c" className="rtg-starting__quiz">
        <RtgQuestion pageId="5ec84a8d-a6ff-4dc2-a6ae-0ace5655bea1" questionId="same-network-different-start" type="choice" typeLabel="起点检查" title="网络结构相同，为什么训练前的表示也可能不同？"
          answer="weights" options={[{ value: 'weights', label: '参数起点不同：一组随机，一组来自预训练' },
            { value: 'architecture', label: '预训练增加了网络层数', wrongFeedback: '两边都使用相同的 ResNet-18 结构。' },
            { value: 'answers', label: '预训练已经包含新任务的标准答案', wrongFeedback: '视觉经验不等于新任务答案。' }]}
          feedback={{ correct: '预训练改变参数起点；新分类头仍需学习当前任务。' }} onCheck={setResult} />
        <Button onClick={() => setQuiz(false)}>返回对照实验</Button>
      </div> : phase === 0 ? <div shuku-edit-id="e-1823d667-a0ee-4423-a012-17afb3522f6e" className="rtg-starting__intro">
        <StartingArchitecture loaded={loaded} loading={loading} frame={playback.frame} />
        <div shuku-edit-id="e-35e9bddf-97c6-4cc8-873e-51b14ab4cb1f" className="rtg-starting__parameter-note" role="status" aria-live="polite"><div shuku-edit-id="e-8964dfa5-3928-4f5f-9388-8185c4c5a4ff">
          <Typography shuku-edit-id="e-47cd9ee0-b2d4-4959-92e8-785800dcda64" variant="body" tone="accent">{loading ? '正在装入预训练权重…' : loaded ? '✓ 已装入预训练权重' : '当前骨干：随机初始化'}</Typography>
          <Typography shuku-edit-id="e-4ab9c6f2-944f-4f3d-a2bf-fe42f2147680" variant="bodySmall" tone="muted">只替换骨干参数，结构与新分类头保持不变。</Typography>
        </div>{loaded ? <Button className="rtg-starting__open-comparison" data-open-comparison variant="primary" hint onClick={() => visit(1)}>查看随机起点/预训练起点相似对照</Button> : <Button data-load variant="primary" hint disabled={loading} onClick={load}>{loading ? '正在装入…' : '装入预训练权重'}</Button>}</div>
      </div> : <div shuku-edit-id="e-d71c31ad-cd07-4230-9bea-df42b0ed5bd4" className="rtg-starting__comparison">
        <aside shuku-edit-id="e-206df979-ccfa-49fd-8c94-b063f297b9b6" className="rtg-starting__query" aria-label="A与B共用同一张输入图片">
          <Typography shuku-edit-id="e-51c3674e-4fa9-4717-b00f-88d5d5589770" as="h2" variant="body" tone="accent" align="center">同一输入</Typography>
          <Button className="rtg-starting__query-image" data-query-input onClick={changeInput} aria-label={'点击改变输入，当前为' + input.label}><SamplePicture sample={input} /><Typography shuku-edit-id="e-f5600a8f-0ced-4c32-9bdd-432a2b85b52b" as="span" variant="body" tone="accent">{input.label}</Typography></Button>
          <Button data-change-input variant="primary" hint onClick={changeInput}>点击改变输入</Button>
          <Typography shuku-edit-id="e-3d807074-bd68-4993-90d5-8d7b109760b7" variant="bodySmall" tone="muted" align="center">两边同时换图，权重不变</Typography>
        </aside>
        {[false, true].map(pretrained => {
          const neighbors = neighborsFor(query, pretrained);
          return <article shuku-edit-id="e-adfd8922-9967-4239-8199-36c2b980d03c" className={'rtg-starting__parameter-side' + (pretrained ? ' is-pretrained' : '')} key={String(pretrained)} data-parameter-side={pretrained ? 'B' : 'A'} data-parameter-source={pretrained ? '预训练权重' : '随机初始化'} data-parameter-status={pretrained ? 'loaded' : 'random'} data-input-id={input.id}>
            <header shuku-edit-id="e-b72d3e7e-57ac-4139-aa8a-2c891461df84"><Typography shuku-edit-id="e-9a347719-66ba-4a83-ace8-8829cd29f953" as="h2" variant="body" tone="accent">{pretrained ? 'B · 预训练起点' : 'A · 随机起点'}</Typography><div shuku-edit-id="e-c09410bb-bdad-436c-9451-38521fb42ff5" className="rtg-starting__status">
              {pretrained && <MathFormulaBlock appearance="plain" ariaLabel="已装入的预训练权重theta星"><MathFormulaStatic latex="\theta^{*}" /></MathFormulaBlock>}
              <Typography shuku-edit-id="e-05d552ea-13dc-4847-927f-fd5bac3c5659" as="span" variant="bodySmall" tone="accent">{pretrained ? '已装入权重' : '随机初始化'}</Typography>
            </div></header>
            <div shuku-edit-id="e-a4151310-45f8-43f1-8350-0f59e55b193a" className="rtg-starting__neighbors" key={query} aria-label={(pretrained ? 'B' : 'A') + '组八张相似图片的教学排序'}>{neighbors.map((sample, rank) => <figure shuku-edit-id="e-aeef2db5-c13f-4417-90a7-22d8e6518475" key={sample.id} className={pretrained && rank < 4 ? 'is-leading' : ''} data-neighbor-side={pretrained ? 'B' : 'A'} data-sample-id={sample.id} data-category={sample.category} data-rank={rank + 1}>
              <Typography shuku-edit-id="e-674f95de-56c9-4a0f-83bd-ca73353b2981" as="span" className="rtg-starting__rank" variant="bodySmall" tone="accent">{rank + 1}</Typography>
              <SamplePicture sample={sample} /><Typography shuku-edit-id="e-e666924a-eb15-42d2-b8ff-d11f3358e4f9" as="figcaption" variant="bodySmall" tone="accent">{sample.label}</Typography>
            </figure>)}</div>
            <Typography shuku-edit-id="e-348193b0-1380-4d5c-a0aa-61a439cd51e4" variant="bodySmall" tone="muted">{pretrained ? '示例：多种' + (input.category === 0 ? '瓶子' : input.category === 1 ? '罐子' : '纸盒') + '共享的线索排在前面。' : '示例：同一批图片，相似排序较混杂。'}</Typography>
          </article>;
        })}
      </div>}
      <footer shuku-edit-id="e-a897ef93-5244-4982-8483-4a0d5960dd66" className="rtg-starting__footer"><Typography shuku-edit-id="e-d20404b0-f586-4f4b-bafa-6cf6637648b0" variant="bodySmall" tone="muted">{quiz ? '已有经验 ≠ 新任务答案' : phase === 0 ? '装入已有权重，不增加网络层数。' : 'A/B 候选图相同；相似排序为教学示意，非模型实测。'}</Typography>
        <Button data-reset onClick={reset}>重新开始</Button>
        {!quiz && phase === 1 && ready && <Button data-open-quiz variant="primary" onClick={() => setQuiz(true)}>理解检查 →</Button>}
      </footer>
    </section>
  </ContentBlock>;
}

export const StartingPointsPage = withAssetResources(StartingPointsContent, [startingFrames]);
