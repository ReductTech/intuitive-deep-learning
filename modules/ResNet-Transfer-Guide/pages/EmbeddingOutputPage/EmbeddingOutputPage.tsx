import { moduleIdentity } from '../../outlines.json';
import { moduleAssetUrl } from '../../../shared/react/assets';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ContentBlock, NoticeStrip, Typography } from '../../../shared/react';
import { HeadReplacementLab } from './HeadReplacementLab';
const bottleFront = moduleAssetUrl(moduleIdentity.id, "recycling/camera-views/bottle-front.png");
const bottleAngle = moduleAssetUrl(moduleIdentity.id, "recycling/camera-views/bottle-angle-45.png");
const bottleSide = moduleAssetUrl(moduleIdentity.id, "recycling/camera-views/bottle-side-90.png");
const bottleCrushed = moduleAssetUrl(moduleIdentity.id, "recycling/bottle-crushed-severe.png");
const canUpright = moduleAssetUrl(moduleIdentity.id, "recycling/can-upright.png");
const canCrushed = moduleAssetUrl(moduleIdentity.id, "recycling/can-crushed.png");
const cartonUpright = moduleAssetUrl(moduleIdentity.id, "recycling/carton-upright.png");
const cartonDrink = moduleAssetUrl(moduleIdentity.id, "recycling/embedding/carton-drink.png");
const cartonCrushed = moduleAssetUrl(moduleIdentity.id, "recycling/embedding/carton-crushed.png");
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
    <ContentBlock
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
        <section className="rtg-embedding-output__lab" aria-label="特征表示的用途，重点为迁移到新任务">
          {SHOW_SIMILARITY_RETRIEVAL && <nav className="rtg-embedding-output__use-switch" aria-label="切换特征表示的用途"><button type="button" data-use-choice="transfer" aria-pressed={useMode === 'transfer'} onClick={() => setUseMode('transfer')}><Typography as="span" variant="bodySmall" tone="inherit">迁移到新任务</Typography></button><button type="button" data-use-choice="retrieval" aria-pressed={useMode === 'retrieval'} onClick={() => setUseMode('retrieval')}><Typography as="span" variant="bodySmall" tone="inherit">辅助示例 · 相似图片检索</Typography></button></nav>}
          {useMode === 'transfer' ? <HeadReplacementLab onComplete={onComplete} /> : <>
          <div className="rtg-embedding-output__lab-head">
            <div>
              <Typography as="strong" variant="h3" tone="accent">{retrievalBasis === 'label' ? '同类物品，外观可以很不同' : '通用特征最近，不一定是同类'}</Typography>
            </div>
            <div className="rtg-embedding-output__method-entry">
              <div className="rtg-embedding-output__basis-switch" role="group" aria-label="区分标签同类与模型特征近邻">
                <button type="button" data-retrieval-choice="label" aria-pressed={retrievalBasis === 'label'} onClick={() => changeBasis('label')}><Typography as="span" variant="bodySmall" tone="inherit">同类对照</Typography></button>
                <button type="button" data-retrieval-choice="feature" aria-pressed={retrievalBasis === 'feature'} onClick={() => changeBasis('feature')}><Typography as="span" variant="bodySmall" tone="inherit">模型近邻</Typography></button>
              </div>
              <button type="button" data-similarity-method aria-expanded={showMethod} aria-controls="rtg-embedding-method" onClick={() => setShowMethod(value => !value)}><Typography as="span" variant="bodySmall" tone="inherit">{showMethod ? '← 返回图片' : '依据是什么？'}</Typography></button>
            </div>
          </div>
          {showMethod ? <section id="rtg-embedding-method" className="rtg-embedding-output__method" aria-label="同类对照与模型近邻的不同依据">
            <div><Typography as="h2" variant="h3" tone="success">同类，是任务的标签</Typography><Typography variant="bodySmall">直立与压扁易拉罐都已标注为“易拉罐”。同类对照连接该标签下的全部其他样例，不排序、不显示分数。</Typography><Typography variant="bodySmall">这是人工标签索引，不是模型识别成功的证据。</Typography><Typography as="h3" variant="body" tone="accent">为什么之前没连到另一个易拉罐？</Typography><Typography variant="bodySmall">两张易拉罐的余弦值为 {cosine('can-upright', 'can-crushed').toFixed(3)}，互相都未进前三；这不代表它们不是同类。</Typography><Typography variant="bodySmall" tone="success">新任务需要标签训练与验证，不能直接把通用近邻当成类别答案。</Typography></div>
            <div><Typography as="h2" variant="h3" tone="accent">近邻，是模型的比较结果</Typography><Typography variant="bodySmall">统一预处理，经过 ImageNet 预训练的 ResNet-18；取全局平均池化后的 512 维表示，不使用分类头。</Typography><Typography as="code" variant="body" tone="accent">余弦相似度 = z₁·z₂ / (‖z₁‖‖z₂‖)</Typography><Typography variant="bodySmall">按余弦值降序取前三，不用类别筛选，也不设“同类”阈值。特征已离线实算，点击不上传照片、不运行大模型。</Typography><Typography variant="bodySmall" tone="warning">位置仅为排版；分数不是分类概率，模型排序未被人工改成同类。</Typography><Typography variant="bodySmall" tone="muted"><a href="https://docs.pytorch.org/vision/stable/models/generated/torchvision.models.resnet18.html" target="_blank" rel="noreferrer">官方权重与预处理说明</a> · {similarityData.weights}</Typography></div>
          </section> : <div className="rtg-embedding-output__workspace">
            <section className="rtg-embedding-output__map" aria-label="可点选的特征地图">
              <header className="rtg-embedding-output__map-head">
                <Typography as="h2" variant="body" tone="accent">图片索引图</Typography>
                <div className="rtg-embedding-output__legend" aria-label="已知类别标签，不代表模型预测">
                  <Typography as="span" variant="bodySmall" tone="accent">塑料瓶</Typography>
                  <Typography as="span" variant="bodySmall" tone="success">易拉罐</Typography>
                  <Typography as="span" variant="bodySmall" tone="warning">纸盒</Typography>
                </div>
              </header>
              <div className="rtg-embedding-output__map-viewport">
                <div className="rtg-embedding-output__plot" role="group" aria-label="九张图片的索引布局，不用于计算相似度">
                  <span className="rtg-embedding-output__cluster rtg-embedding-output__cluster--bottle" aria-hidden="true" />
                  <span className="rtg-embedding-output__cluster rtg-embedding-output__cluster--can" aria-hidden="true" />
                  <span className="rtg-embedding-output__cluster rtg-embedding-output__cluster--carton" aria-hidden="true" />
                  {links.length > 0 && <svg className="rtg-embedding-output__links" viewBox="0 0 1000 400" aria-hidden="true" data-link-from={selected?.id} data-link-basis={retrievalBasis}>
                    {links.filter(link => link.path).map(link => <g key={link.id} data-link-to={link.id} className={compared?.id === link.id ? 'is-active' : ''}>
                      <path d={link.path} />
                      <circle cx={link.route[0].x} cy={link.route[0].y} r="2.5" /><circle cx={link.route.at(-1)?.x} cy={link.route.at(-1)?.y} r="2.5" />
                    </g>)}
                  </svg>}
                  {points.map(point => <button
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
                  ><img src={point.image} alt="" aria-hidden="true" /></button>)}
                </div>
              </div>
              <Typography id="rtg-embedding-map-instruction" variant="bodySmall" tone="muted">{retrievalBasis === 'label' ? '连线依据已有类别标签，展示同类外观变化；不是模型检索结果。' : 'ResNet-18 · 512维余弦近邻；位置仅为排版，不参与排序。'}</Typography>
            </section>

            <aside id="rtg-embedding-neighbor-results" className="rtg-embedding-output__results" aria-label={retrievalBasis === 'label' ? '已知标签下的同类外观对照' : '所选图片与实算特征近邻'}>
              {!selected && <Typography as="h2" variant="body" tone="accent">{retrievalBasis === 'label' ? '同类外观对照' : '模型最近三张'}</Typography>}
              {selected ? <>
                <div className="rtg-embedding-output__query" aria-live="polite">
                  <div className="rtg-embedding-output__query-photo"><img src={selected.image} alt="" /></div>
                  <div><Typography variant="bodySmall" tone="muted">{retrievalBasis === 'label' ? `已知标签 · ${selected.category}` : '当前选中 · 余弦近邻'}</Typography><Typography as="h2" variant="h3" tone="accent">{selected.label}</Typography></div>
                </div>
                <div className="rtg-embedding-output__neighbor-list">
                  <ol aria-label={retrievalBasis === 'label' ? '同一标签的全部其他样例，无相似度排名' : '按512维特征余弦相似度降序排列'}>{neighbors.map(({ point, score }, index) => <li key={point.id}>
                    <button type="button" data-neighbor={point.id} data-score={score ?? undefined} data-relation={retrievalBasis} aria-pressed={compared?.id === point.id}
                      aria-label={`突出与${point.label}的${retrievalBasis === 'label' ? '同类对照' : '特征近邻'}连线`}
                      className={compared?.id === point.id ? 'is-active' : ''}
                      onPointerEnter={() => setHoveredId(point.id)} onPointerLeave={() => setHoveredId(null)}
                      onFocus={() => setFocusedId(point.id)} onBlur={() => setFocusedId(null)}
                      onClick={() => setPinnedId(point.id)}>
                      <Typography as="span" variant="bodySmall" tone="inherit" className="rtg-embedding-output__rank">{retrievalBasis === 'label' ? '↔' : `0${index + 1}`}</Typography>
                      <img src={point.image} alt="" aria-hidden="true" />
                      <Typography as="span" variant="bodySmall" tone="inherit">{point.label}</Typography>
                      <Typography as={score === null ? 'span' : 'code'} variant="bodySmall" tone="inherit">{score === null ? '同类' : score.toFixed(3)}</Typography>
                    </button>
                  </li>)}</ol>
                </div>
                <div className="rtg-embedding-output__relation-note">
                  <Typography variant="bodySmall" tone={retrievalBasis === 'label' ? 'success' : 'warning'}>{retrievalBasis === 'label' ? '外观变化，物品标签不变' : '没进前三，不等于不同类'}</Typography>
                  <Typography variant="bodySmall" tone="muted">{retrievalBasis === 'label' ? '用任务标签训练，再验证能否区分。' : '余弦分数不是分类概率。'}</Typography>
                </div>
              </> : <div className="rtg-embedding-output__empty">
                <div className={`rtg-embedding-output__empty-photos${retrievalBasis === 'label' ? ' is-pair' : ''}`} aria-hidden="true"><img src={canUpright} alt="" /><img src={retrievalBasis === 'label' ? canCrushed : bottleFront} alt="" />{retrievalBasis === 'feature' && <img src={cartonUpright} alt="" />}</div>
                <Typography as="h3" variant="h3" tone="accent">{retrievalBasis === 'label' ? '直立、压扁，仍是易拉罐' : '从一张图片开始'}</Typography>
                <Typography variant="bodySmall" tone="muted">{retrievalBasis === 'label' ? '点选任意图片，连起已知标签中的其他同类；再与模型近邻比较。' : '点选左侧图片，比较真实特征最接近的三张，而不是判定物品类别。'}</Typography>
              </div>}
            </aside>
          </div>}
          </>}
        </section>

      {useMode === 'retrieval' && <NoticeStrip tone="blue" role="status" aria-live="polite">
        <Typography variant="bodySmall" tone="inherit">{notice}</Typography>
      </NoticeStrip>}
    </ContentBlock>
  );
}
