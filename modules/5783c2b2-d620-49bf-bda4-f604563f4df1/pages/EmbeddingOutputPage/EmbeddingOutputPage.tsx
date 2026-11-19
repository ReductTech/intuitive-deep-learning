import { moduleIdentity } from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { useEffect, useMemo, useRef, useState } from 'react';
import { ContentBlock, NoticeStrip, Typography } from "@shuku/course-style/react";
import { HeadReplacementLab } from './HeadReplacementLab';
const bottleFront = moduleAssetUrl("recycling/camera-views/bottle-front.webp");
const bottleAngle = moduleAssetUrl("recycling/camera-views/bottle-angle-45.webp");
const bottleSide = moduleAssetUrl("recycling/camera-views/bottle-side-90.webp");
const bottleCrushed = moduleAssetUrl("recycling/bottle-crushed-severe.webp");
const canUpright = moduleAssetUrl("recycling/can-upright.webp");
const canCrushed = moduleAssetUrl("recycling/can-crushed.webp");
const cartonUpright = moduleAssetUrl("recycling/carton-upright.webp");
const cartonDrink = moduleAssetUrl("recycling/embedding/carton-drink.webp");
const cartonCrushed = moduleAssetUrl("recycling/embedding/carton-crushed.webp");
import { routeLink, smoothLink, thumbnailUnits } from './mapGeometry';
import similarityData from './similarityData.json';
import './EmbeddingOutputPage.css';

// Temporarily hide the entire optional index and its navigation. Keep the
// implementation and data intact so it can be restored without rebuilding it.
const SHOW_SIMILARITY_RETRIEVAL = false;

const points = [
  { id: 'bottle-front', label: '正面塑料瓶', category: '塑料瓶', image: bottleFront, x: 19, y: 28 },
  { id: 'bottle-angle', label: '斜侧塑料瓶', category: '塑料瓶', image: bottleAngle, x: 31, y: 25 },
  { id: 'bottle-side', label: '侧面塑料瓶', category: '塑料瓶', image: bottleSide, x: 31, y: 55 },
  { id: 'bottle-crushed', label: '压扁塑料瓶', category: '塑料瓶', image: bottleCrushed, x: 19, y: 57 },
  { id: 'can-upright', label: '直立易拉罐', category: '易拉罐', image: canUpright, x: 70, y: 16 },
  { id: 'can-crushed', label: '压扁易拉罐', category: '易拉罐', image: canCrushed, x: 84, y: 40 },
  { id: 'carton', label: '直立纸盒', category: '纸盒', image: cartonUpright, x: 54, y: 76 },
  { id: 'carton-drink', label: '饮品纸盒', category: '纸盒', image: cartonDrink, x: 70, y: 77 },
  { id: 'carton-crushed', label: '压扁纸盒', category: '纸盒', image: cartonCrushed, x: 57, y: 48 },
] as const;

// Keep two different questions explicit: known-label examples illustrate task
// semantics; model neighbors use only the actual 512-D descriptors. Neither
// relation uses hand-arranged screen coordinates or claims classification success.
const vectors: Record<string, number[]> = similarityData.vectors;
function cosine(a: string, b: string) {
  const first = vectors[a], second = vectors[b];
  const dot = first.reduce((sum, value, index) => sum + value * second[index], 0);
  return dot / Math.sqrt(first.reduce((sum, value) => sum + value * value, 0) * second.reduce((sum, value) => sum + value * value, 0));
}

export interface EmbeddingOutputPageProps { onComplete?: () => void; }

export function EmbeddingOutputPage({ onComplete }: EmbeddingOutputPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [showMethod, setShowMethod] = useState(false);
  const [retrievalBasis, setRetrievalBasis] = useState<'label' | 'feature'>('label');
  const [requestedUseMode, setUseMode] = useState<'transfer' | 'retrieval'>('transfer');
  const useMode = SHOW_SIMILARITY_RETRIEVAL ? requestedUseMode : 'transfer';
  const rootRef = useRef<HTMLElement>(null);
  const selected = points.find((point) => point.id === selectedId) ?? null;
  const neighbors = useMemo(() => {
    if (!selected) return [];
    const candidates = points.filter(point => point.id !== selected.id);
    // Label examples are not a re-ranked model result: there are no invented
    // similarity scores, thresholds, or top-k claims in this view.
    if (retrievalBasis === 'label') return candidates
      .filter(point => point.category === selected.category)
      .map(point => ({ point, score: null }));
    return candidates
      .map(point => ({ point, score: cosine(selected.id, point.id) }))
      .sort((a, b) => b.score - a.score || a.point.id.localeCompare(b.point.id))
      .slice(0, 3);
  }, [selected, retrievalBasis]);
  const nearest = new Set(neighbors.map(item => item.point.id));
  const compared = neighbors.find(item => item.point.id === (hoveredId ?? focusedId ?? pinnedId))?.point ?? null;
  const links = useMemo(() => !selected ? [] : neighbors.map(({ point }) => {
    const route = routeLink(selected, point, points);
    return { id: point.id, route, path: smoothLink(route) };
  }), [selected, neighbors]);
  useEffect(() => {
    if (useMode !== 'retrieval') return;
    rootRef.current?.querySelector<HTMLButtonElement>('[data-map-point]')?.focus({ preventScroll: true });
  }, [useMode]);

  function selectPoint(id: string) {
    setSelectedId(id); setHoveredId(null); setFocusedId(null); setPinnedId(null);
  }

  function changeBasis(basis: 'label' | 'feature') {
    setRetrievalBasis(basis); setHoveredId(null); setFocusedId(null); setPinnedId(null);
  }

  const notice = retrievalBasis === 'label'
          ? !selected
            ? '点选图片，连起同类外观对照。依据已有标签，不代表模型已识别；切换“模型近邻”可看真实排序。'
            : `已连接其余 ${neighbors.length} 张${selected.category}样例${compared ? `，当前突出${compared.label}` : ''}；连线依据已知标签，不是模型相似度。`
          : !selected
            ? '点选图片，查看通用模型的最近三张；未进前三，不代表不是同类。'
            : `已连接通用特征最接近的 3 张${compared ? `，当前突出${compared.label}` : ''}；未进前三 ≠ 不同类，余弦分数也不是分类概率。`;

  return (
    <ContentBlock shuku-edit-id="e-fd659070-96de-4d92-93a0-0320579b5e7c"
      ref={rootRef}
      headingLevel={1}
      className="rtg-embedding-output"
      data-selected={selectedId ?? ''}
      data-compared={compared?.id ?? ''}
      data-use={useMode}
      data-retrieval-basis={retrievalBasis}
      onKeyDown={event => {
        if ((event.key === ' ' || event.key === 'Enter') && (event.target as Element).closest('button')) {
          event.stopPropagation();
          if (event.repeat) event.preventDefault();
        }
        if (event.key === 'Escape' && useMode === 'retrieval') { event.stopPropagation(); setPinnedId(null); setHoveredId(null); setFocusedId(null); }
      }}
      title="换一个分类头，模型会回答什么问题？"
      subtitle="保留特征提取器，把识别物品换成判断外观，再换图比较。"
    >
        <section shuku-edit-id="e-5fd28c15-a68d-4f15-9c36-737f1948fed3" className="rtg-embedding-output__lab" aria-label="特征表示的用途，重点为迁移到新任务">
          {SHOW_SIMILARITY_RETRIEVAL && <nav shuku-edit-id="e-9c9ac4ce-6d1e-464a-8f31-c2cd1fa43dbb" className="rtg-embedding-output__use-switch" aria-label="切换特征表示的用途"><button shuku-edit-id="e-98a03005-b46a-45c7-8efb-360f75da0023" type="button" data-use-choice="transfer" aria-pressed={useMode === 'transfer'} onClick={() => setUseMode('transfer')}><Typography shuku-edit-id="e-ae03a51d-89a6-4063-8a6b-dfd4376269fc" as="span" variant="bodySmall" tone="inherit">迁移到新任务</Typography></button><button shuku-edit-id="e-5216c308-6c5b-4321-a145-023870630481" type="button" data-use-choice="retrieval" aria-pressed={useMode === 'retrieval'} onClick={() => setUseMode('retrieval')}><Typography shuku-edit-id="e-7b48cd3e-81e5-482c-bd21-ac290473ddfd" as="span" variant="bodySmall" tone="inherit">辅助示例 · 相似图片检索</Typography></button></nav>}
          {useMode === 'transfer' ? <HeadReplacementLab onComplete={onComplete} /> : <>
          <div shuku-edit-id="e-e713d946-0a58-4967-b3c1-869c4c843b41" className="rtg-embedding-output__lab-head">
            <div shuku-edit-id="e-beca3ff7-8e91-4d96-a889-4b9065bf30b5">
              <Typography shuku-edit-id="e-b2a0e2b3-4c7e-4d4b-8a78-0a6cef80ef7a" as="strong" variant="h3" tone="accent">{retrievalBasis === 'label' ? '同类物品，外观可以很不同' : '通用特征最近，不一定是同类'}</Typography>
            </div>
            <div shuku-edit-id="e-29885cd6-2ccd-4420-908c-b7b4b3958b46" className="rtg-embedding-output__method-entry">
              <div shuku-edit-id="e-3039802a-a7cf-4171-8383-b88171f3610e" className="rtg-embedding-output__basis-switch" role="group" aria-label="区分标签同类与模型特征近邻">
                <button shuku-edit-id="e-f166ca38-2ae2-4c6c-ac64-ba7f12f2c37c" type="button" data-retrieval-choice="label" aria-pressed={retrievalBasis === 'label'} onClick={() => changeBasis('label')}><Typography shuku-edit-id="e-e0cbd38d-24b9-4fbd-b7ed-c17a1ebba3bc" as="span" variant="bodySmall" tone="inherit">同类对照</Typography></button>
                <button shuku-edit-id="e-8dbf2216-80d2-4ef5-961b-bf5e225bcd5a" type="button" data-retrieval-choice="feature" aria-pressed={retrievalBasis === 'feature'} onClick={() => changeBasis('feature')}><Typography shuku-edit-id="e-25d4bd51-811e-4670-94fd-bf1195aa5c30" as="span" variant="bodySmall" tone="inherit">模型近邻</Typography></button>
              </div>
              <button shuku-edit-id="e-d325c9bf-a67e-4ee1-bf59-da6baf37ce3a" type="button" data-similarity-method aria-expanded={showMethod} aria-controls="rtg-embedding-method" onClick={() => setShowMethod(value => !value)}><Typography shuku-edit-id="e-2d3d0787-ef7d-499a-a10d-4159ee08c7cb" as="span" variant="bodySmall" tone="inherit">{showMethod ? '← 返回图片' : '依据是什么？'}</Typography></button>
            </div>
          </div>
          {showMethod ? <section shuku-edit-id="e-5791727e-1807-4d0b-b4c0-786fbbff0c3a" id="rtg-embedding-method" className="rtg-embedding-output__method" aria-label="同类对照与模型近邻的不同依据">
            <div shuku-edit-id="e-952f509d-db62-4107-8868-653985d5f90c"><Typography shuku-edit-id="e-a8616b1d-4f61-4456-81d1-b9315771e007" as="h2" variant="h3" tone="success">同类，是任务的标签</Typography><Typography shuku-edit-id="e-7349af5e-c558-4912-b0d2-b0200f27ee5d" variant="bodySmall">直立与压扁易拉罐都已标注为“易拉罐”。同类对照连接该标签下的全部其他样例，不排序、不显示分数。</Typography><Typography shuku-edit-id="e-42830374-614b-4e47-a25d-83aa2874b066" variant="bodySmall">这是人工标签索引，不是模型识别成功的证据。</Typography><Typography shuku-edit-id="e-45f53f6b-0a28-48b7-bc4b-923715954a23" as="h3" variant="body" tone="accent">为什么之前没连到另一个易拉罐？</Typography><Typography shuku-edit-id="e-c4446603-e277-4506-8302-68980cac2c74" variant="bodySmall">两张易拉罐的余弦值为 {cosine('can-upright', 'can-crushed').toFixed(3)}，互相都未进前三；这不代表它们不是同类。</Typography><Typography shuku-edit-id="e-fc447dd0-abc5-4698-8e67-dfb722f33401" variant="bodySmall" tone="success">新任务需要标签训练与验证，不能直接把通用近邻当成类别答案。</Typography></div>
            <div shuku-edit-id="e-adcc1d13-5ee9-45bf-b91f-23cdeb627317"><Typography shuku-edit-id="e-7263de72-5c12-4087-b646-fbc342d1105f" as="h2" variant="h3" tone="accent">近邻，是模型的比较结果</Typography><Typography shuku-edit-id="e-dad4f6d0-fa08-49df-90f0-bd615e493f01" variant="bodySmall">统一预处理，经过 ImageNet 预训练的 ResNet-18；取全局平均池化后的 512 维表示，不使用分类头。</Typography><Typography shuku-edit-id="e-a646f159-3cbd-4132-9d4d-0a3f728ea531" as="code" variant="body" tone="accent">余弦相似度 = z₁·z₂ / (‖z₁‖‖z₂‖)</Typography><Typography shuku-edit-id="e-5d821b20-5f69-43d9-bbfd-13785b9d6c51" variant="bodySmall">按余弦值降序取前三，不用类别筛选，也不设“同类”阈值。特征已离线实算，点击不上传照片、不运行大模型。</Typography><Typography shuku-edit-id="e-8f3b1a6b-589a-4c25-bc21-92f2e7d0472c" variant="bodySmall" tone="warning">位置仅为排版；分数不是分类概率，模型排序未被人工改成同类。</Typography><Typography shuku-edit-id="e-c8c84a83-24c8-4fec-a9c4-ea774ffe2615" variant="bodySmall" tone="muted"><a shuku-edit-id="e-54fc55cd-07b1-4af4-bb46-2b444abafa9e" href="https://docs.pytorch.org/vision/stable/models/generated/torchvision.models.resnet18.html" target="_blank" rel="noreferrer">官方权重与预处理说明</a> · {similarityData.weights}</Typography></div>
          </section> : <div shuku-edit-id="e-06de5229-cb71-4c11-a537-88544dc7c2a7" className="rtg-embedding-output__workspace">
            <section shuku-edit-id="e-5740dd3a-e24a-4208-b147-f47f5c63e4a2" className="rtg-embedding-output__map" aria-label="可点选的特征地图">
              <header shuku-edit-id="e-ebc03794-ac32-43a7-a9a6-c3381d64ac6e" className="rtg-embedding-output__map-head">
                <Typography shuku-edit-id="e-1fac734f-47e8-4764-932c-2f44aebbc89b" as="h2" variant="body" tone="accent">图片索引图</Typography>
                <div shuku-edit-id="e-29dee445-ca68-4b08-9c2f-5e53d79d0c45" className="rtg-embedding-output__legend" aria-label="已知类别标签，不代表模型预测">
                  <Typography shuku-edit-id="e-ad554487-b07a-4240-afba-04e2757f2a9b" as="span" variant="bodySmall" tone="accent">塑料瓶</Typography>
                  <Typography shuku-edit-id="e-58f27822-cc97-40ba-a769-42b2147fd7fc" as="span" variant="bodySmall" tone="success">易拉罐</Typography>
                  <Typography shuku-edit-id="e-d8a0d904-afcb-479b-b266-0d49fd9a6070" as="span" variant="bodySmall" tone="warning">纸盒</Typography>
                </div>
              </header>
              <div shuku-edit-id="e-e19f0a87-722a-473d-8651-d036477426c8" className="rtg-embedding-output__map-viewport">
                <div shuku-edit-id="e-3427442c-97eb-4e89-b8eb-7806a180a36b" className="rtg-embedding-output__plot" role="group" aria-label="九张图片的索引布局，不用于计算相似度">
                  <span shuku-edit-id="e-9ce01fad-14b5-4bf8-b974-4d8f649e95b9" className="rtg-embedding-output__cluster rtg-embedding-output__cluster--bottle" aria-hidden="true" />
                  <span shuku-edit-id="e-e462a3ea-b5c5-4ba4-8659-e9d7e61f195e" className="rtg-embedding-output__cluster rtg-embedding-output__cluster--can" aria-hidden="true" />
                  <span shuku-edit-id="e-1e995fc3-8621-4e20-804d-bdcec43b2a94" className="rtg-embedding-output__cluster rtg-embedding-output__cluster--carton" aria-hidden="true" />
                  {links.length > 0 && <svg shuku-edit-id="e-dc160bad-709b-49f7-8e2b-c40af6b9a9e2" className="rtg-embedding-output__links" viewBox="0 0 1000 400" aria-hidden="true" data-link-from={selected?.id} data-link-basis={retrievalBasis}>
                    {links.filter(link => link.path).map(link => <g shuku-edit-id="e-ed2b7e2d-a4b9-43c1-93c3-66d53285e937" key={link.id} data-link-to={link.id} className={compared?.id === link.id ? 'is-active' : ''}>
                      <path shuku-edit-id="e-1e8cab19-765f-44cf-96fa-586ac2723d4c" d={link.path} />
                      <circle shuku-edit-id="e-cda044bb-0041-4862-a45b-a3e1aa21fc2e" cx={link.route[0].x} cy={link.route[0].y} r="2.5" /><circle shuku-edit-id="e-f1524416-1634-4c66-b96e-b38d9f9523fa" cx={link.route.at(-1)?.x} cy={link.route.at(-1)?.y} r="2.5" />
                    </g>)}
                  </svg>}
                  {points.map(point => <button shuku-edit-id="e-dbac77b5-c5db-4873-aa36-a271c83c4f07"
                    className={`rtg-embedding-output__point rtg-embedding-output__point--${point.category}${selectedId === point.id ? ' is-selected' : ''}${nearest.has(point.id) ? ' is-near' : ''}${compared?.id === point.id ? ' is-compared' : ''}`}
                    style={{ left: `${point.x}%`, top: `${point.y}%`, width: `${thumbnailUnits / 10}%` }}
                    type="button" key={point.id} data-map-point={point.id} data-x={point.x} data-y={point.y}
                    aria-label={point.label} title={point.label} aria-pressed={selectedId === point.id}
                    aria-controls="rtg-embedding-neighbor-results" aria-describedby="rtg-embedding-map-instruction"
                    onClick={() => selectPoint(point.id)}
                    onPointerEnter={() => { if (nearest.has(point.id)) setHoveredId(point.id); }}
                    onPointerLeave={() => setHoveredId(null)}
                    onFocus={() => { if (nearest.has(point.id)) setFocusedId(point.id); }}
                    onBlur={() => setFocusedId(null)}
                  ><img shuku-edit-id="e-443deca6-b7c8-49db-bc1d-fcec2cec8284" src={point.image} alt="" aria-hidden="true" /></button>)}
                </div>
              </div>
              <Typography shuku-edit-id="e-4662d25f-ec7b-4aca-b22e-23516b8c0050" id="rtg-embedding-map-instruction" variant="bodySmall" tone="muted">{retrievalBasis === 'label' ? '连线依据已有类别标签，展示同类外观变化；不是模型检索结果。' : 'ResNet-18 · 512维余弦近邻；位置仅为排版，不参与排序。'}</Typography>
            </section>

            <aside shuku-edit-id="e-85bb7edd-f73d-435b-bf1b-011c784a0473" id="rtg-embedding-neighbor-results" className="rtg-embedding-output__results" aria-label={retrievalBasis === 'label' ? '已知标签下的同类外观对照' : '所选图片与实算特征近邻'}>
              {!selected && <Typography shuku-edit-id="e-8c287bec-b90d-4768-b799-f8238db0d401" as="h2" variant="body" tone="accent">{retrievalBasis === 'label' ? '同类外观对照' : '模型最近三张'}</Typography>}
              {selected ? <>
                <div shuku-edit-id="e-60fc705d-474a-4195-a42d-8d335bece8a2" className="rtg-embedding-output__query" aria-live="polite">
                  <div shuku-edit-id="e-2fb3789e-f0c6-4720-afed-313844ef5f8e" className="rtg-embedding-output__query-photo"><img shuku-edit-id="e-7273a23f-a3cc-40d1-8222-b0ad3a2a09b7" src={selected.image} alt="" /></div>
                  <div shuku-edit-id="e-5f6aa5fe-11de-4121-bb20-affe869af8a9"><Typography shuku-edit-id="e-f75a1b2b-ebc6-4ce0-a8b7-3731bc91b13f" variant="bodySmall" tone="muted">{retrievalBasis === 'label' ? `已知标签 · ${selected.category}` : '当前选中 · 余弦近邻'}</Typography><Typography shuku-edit-id="e-668ddb55-f0ce-4eac-8820-9966fa75496c" as="h2" variant="h3" tone="accent">{selected.label}</Typography></div>
                </div>
                <div shuku-edit-id="e-b21af60d-1497-44e0-aa9b-a37ccf9890eb" className="rtg-embedding-output__neighbor-list">
                  <ol shuku-edit-id="e-57ad1860-5d00-48a6-b52f-219e3735bf0c" aria-label={retrievalBasis === 'label' ? '同一标签的全部其他样例，无相似度排名' : '按512维特征余弦相似度降序排列'}>{neighbors.map(({ point, score }, index) => <li shuku-edit-id="e-c4e07a65-1438-4972-935f-a2e576374ee7" key={point.id}>
                    <button shuku-edit-id="e-e046407f-ab79-4aa4-912d-bb14d8e897af" type="button" data-neighbor={point.id} data-score={score ?? undefined} data-relation={retrievalBasis} aria-pressed={compared?.id === point.id}
                      aria-label={`突出与${point.label}的${retrievalBasis === 'label' ? '同类对照' : '特征近邻'}连线`}
                      className={compared?.id === point.id ? 'is-active' : ''}
                      onPointerEnter={() => setHoveredId(point.id)} onPointerLeave={() => setHoveredId(null)}
                      onFocus={() => setFocusedId(point.id)} onBlur={() => setFocusedId(null)}
                      onClick={() => setPinnedId(point.id)}>
                      <Typography shuku-edit-id="e-ef5f1a98-c398-4028-b089-5d77c69980fd" as="span" variant="bodySmall" tone="inherit" className="rtg-embedding-output__rank">{retrievalBasis === 'label' ? '↔' : `0${index + 1}`}</Typography>
                      <img shuku-edit-id="e-c18f9cd4-0894-45b5-8f8b-54b80d06389d" src={point.image} alt="" aria-hidden="true" />
                      <Typography shuku-edit-id="e-11c8b2a9-6d39-451a-a4c4-a3f229fb14c0" as="span" variant="bodySmall" tone="inherit">{point.label}</Typography>
                      <Typography as={score === null ? 'span' : 'code'} variant="bodySmall" tone="inherit">{score === null ? '同类' : score.toFixed(3)}</Typography>
                    </button>
                  </li>)}</ol>
                </div>
                <div shuku-edit-id="e-7c93e21d-ffb0-4a31-8960-79cee9b8f8e1" className="rtg-embedding-output__relation-note">
                  <Typography shuku-edit-id="e-4ac1bca7-b3b7-4927-882e-950c5bc5fc09" variant="bodySmall" tone={retrievalBasis === 'label' ? 'success' : 'warning'}>{retrievalBasis === 'label' ? '外观变化，物品标签不变' : '没进前三，不等于不同类'}</Typography>
                  <Typography shuku-edit-id="e-2223b696-a70c-45b1-ad81-67fad1e607b6" variant="bodySmall" tone="muted">{retrievalBasis === 'label' ? '用任务标签训练，再验证能否区分。' : '余弦分数不是分类概率。'}</Typography>
                </div>
              </> : <div shuku-edit-id="e-73610d60-81bf-4b14-9d1c-d647bc44cfde" className="rtg-embedding-output__empty">
                <div shuku-edit-id="e-65fc11c6-91d3-402b-98a6-2079060c11c8" className={`rtg-embedding-output__empty-photos${retrievalBasis === 'label' ? ' is-pair' : ''}`} aria-hidden="true"><img shuku-edit-id="e-3b71928a-da92-406c-bb4d-4d4618c5915a" src={canUpright} alt="" /><img shuku-edit-id="e-3601c6d9-e382-4918-ba41-0def22fa8eb3" src={retrievalBasis === 'label' ? canCrushed : bottleFront} alt="" />{retrievalBasis === 'feature' && <img shuku-edit-id="e-d36afbf3-658c-4de7-9eb8-83545f5866c8" src={cartonUpright} alt="" />}</div>
                <Typography shuku-edit-id="e-2253c4fa-a0bb-44e8-b57f-bfd8ff938162" as="h3" variant="h3" tone="accent">{retrievalBasis === 'label' ? '直立、压扁，仍是易拉罐' : '从一张图片开始'}</Typography>
                <Typography shuku-edit-id="e-490133ab-d471-46ee-8721-5d5fc0825e9f" variant="bodySmall" tone="muted">{retrievalBasis === 'label' ? '点选任意图片，连起已知标签中的其他同类；再与模型近邻比较。' : '点选左侧图片，比较真实特征最接近的三张，而不是判定物品类别。'}</Typography>
              </div>}
            </aside>
          </div>}
          </>}
        </section>

      {useMode === 'retrieval' && <NoticeStrip tone="blue" role="status" aria-live="polite">
        <Typography shuku-edit-id="e-583b6170-6b99-40cd-b103-c478f45121a0" variant="bodySmall" tone="inherit">{notice}</Typography>
      </NoticeStrip>}
    </ContentBlock>
  );
}
