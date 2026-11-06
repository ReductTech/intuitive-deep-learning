import { moduleIdentity } from '../../outlines.json';
import { moduleAssetUrl } from '../../../shared/react/assets';
import { useEffect, useRef, useState } from 'react';
import {
  Button,
  Callout,
  ContentBlock,
  NoticeStrip,
  Question,
  Typography,
  type QuestionCheckResult,
} from '../../../shared/react';
const bottleFront = moduleAssetUrl(moduleIdentity.id, "recycling/camera-views/bottle-front.png");
import './HierarchicalFeaturesPage.css';

type LayerIndex = 0 | 1 | 2;
type CueId = 'arc' | 'edge' | 'boundary';
type PartId = 'cap' | 'body' | 'base';

interface LayerSpec {
  label: string;
  title: string;
  description: string;
  input: string;
  output: string;
}

interface CueSpec {
  id: CueId;
  label: string;
}

interface PartSpec {
  id: PartId;
  label: string;
}

const layers: LayerSpec[] = [
  {
    label: '浅层',
    title: '先记录局部变化',
    description: '每个响应只覆盖很小的区域。它能指出弧线、竖边或颜色边界，却还不能单独确定类别。',
    input: '照片局部像素',
    output: '边缘、颜色变化等简单响应',
  },
  {
    label: '中间层',
    title: '把相邻线索组合成部件',
    description: '这一层读取上一层的多张特征图，把邻近的边缘和纹理组合成瓶盖、瓶身纹理等局部结构。',
    input: '上一层的简单响应',
    output: '瓶盖、瓶身纹理和瓶底结构',
  },
  {
    label: '更深层',
    title: '整合更大范围的关系',
    description: '更大的感受范围让网络有机会把瓶盖、瓶颈、瓶身和瓶底之间的关系组织成更完整的表示。',
    input: '上一层形成的多个部件',
    output: '更适合分类的整体结构表示',
  },
];

const cues: CueSpec[] = [
  { id: 'arc', label: '瓶盖弧线' },
  { id: 'edge', label: '瓶身竖边' },
  { id: 'boundary', label: '颜色边界' },
];

const parts: PartSpec[] = [
  { id: 'cap', label: '瓶盖与瓶颈' },
  { id: 'body', label: '瓶身纹理' },
  { id: 'base', label: '瓶底结构' },
];

export interface HierarchicalFeaturesPageProps {
  onComplete?: () => void;
}

export function HierarchicalFeaturesPage({ onComplete }: HierarchicalFeaturesPageProps) {
  const completedRef = useRef(false);
  const [activeLayer, setActiveLayer] = useState<LayerIndex>(0);
  const [predictionSolved, setPredictionSolved] = useState(false);
  const [predictionResult, setPredictionResult] = useState<QuestionCheckResult | null>(null);
  const [visitedCues, setVisitedCues] = useState<Set<CueId>>(() => new Set());
  const [visitedParts, setVisitedParts] = useState<Set<PartId>>(() => new Set());

  const shallowComplete = predictionSolved && visitedCues.size === cues.length;
  const middleComplete = shallowComplete && visitedParts.size === parts.length;
  const completed = middleComplete && activeLayer === 2;

  useEffect(() => {
    if (!completed || completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
  }, [completed, onComplete]);

  const handlePrediction = (result: QuestionCheckResult) => {
    setPredictionResult(result);
    setPredictionSolved(result.ok);
  };

  const visitCue = (id: CueId) => {
    if (!predictionSolved) return;
    setVisitedCues((current) => {
      const next = new Set(current);
      next.add(id);
      return next;
    });
  };

  const visitPart = (id: PartId) => {
    setVisitedParts((current) => {
      const next = new Set(current);
      next.add(id);
      return next;
    });
  };

  const openLayer = (index: LayerIndex) => {
    if (index === 1 && !shallowComplete) return;
    if (index === 2 && !middleComplete) return;
    setActiveLayer(index);
  };

  const current = layers[activeLayer];
  const notice = completed
    ? '更深层不会重新读取原始照片。它在上一层表示的基础上继续组合，逐步形成更适合分类的结构信息。'
    : activeLayer === 0 && !predictionSolved
      ? predictionResult && !predictionResult.empty
        ? '一条边缘也可能来自纸盒、易拉罐或背景。'
        : '先回答左侧问题，再检查瓶子上的三个浅层线索。'
      : activeLayer === 0 && !shallowComplete
        ? `已检查 ${visitedCues.size} / ${cues.length} 个简单线索。把三个位置都点亮，中间层才会解锁。`
        : activeLayer === 0
          ? '中间层已解锁。进入下一层，看看这些简单线索会组合成什么。'
          : activeLayer === 1 && !middleComplete
            ? `已检查 ${visitedParts.size} / ${parts.length} 个局部结构。继续点亮瓶盖、瓶身和瓶底。`
            : activeLayer === 1
              ? '更深层已解锁。进入下一层，把多个部件组织成整体结构。'
              : '观察整条结构链：局部响应先组成部件，部件再形成更完整的物体表示。';

  return (
    <ContentBlock
      headingLevel={1}
      className="rtg-hierarchical"
      title="网络怎样逐层组合线索？"
      subtitle="后一层读取前一层的特征图，把相邻的简单响应组合成更大的结构。"
    >
      <div className="rtg-hierarchical__workspace">
        <aside className="rtg-hierarchical__controls" aria-label="网络深度与当前任务">
          <div className="rtg-hierarchical__depth-heading">
            <Typography as="span" variant="bodySmall" tone="warning">沿网络深度前进</Typography>
            <Typography as="h2" variant="h3" tone="accent">三层逐步组合</Typography>
          </div>

          <div className="rtg-hierarchical__depth-rail" role="tablist" aria-label="特征层级">
            {layers.map((layer, index) => {
              const layerIndex = index as LayerIndex;
              const unlocked = layerIndex === 0 || (layerIndex === 1 ? shallowComplete : middleComplete);
              const passed = activeLayer > layerIndex || (layerIndex === 0 ? shallowComplete : layerIndex === 1 ? middleComplete : completed);
              return (
                <Button
                  key={layer.label}
                  className={'rtg-hierarchical__depth-step' + (passed ? ' is-passed' : '')}
                  variant={activeLayer === layerIndex ? 'primary' : 'default'}
                  active={activeLayer === layerIndex}
                  disabled={!unlocked}
                  hint={unlocked && activeLayer + 1 === layerIndex}
                  role="tab"
                  aria-selected={activeLayer === layerIndex}
                  aria-label={`${index + 1}，${layer.label}，${unlocked ? layer.title : '完成上一层后解锁'}`}
                  onClick={() => openLayer(layerIndex)}
                >
                  <Typography as="span" variant="bodySmall" tone="inherit" className="rtg-hierarchical__step-number">
                    {index + 1}
                  </Typography>
                  <Typography as="strong" variant="bodySmall" tone="inherit">{layer.label}</Typography>
                </Button>
              );
            })}
          </div>

          {activeLayer === 0 && (
            <Question
              className="rtg-hierarchical__question"
              type="judgement"
              typeLabel="先判断"
              title="只凭一条边缘，能确定它是塑料瓶吗？"
              answer="no"
              options={[
                {
                  key: 'A',
                  value: 'yes',
                  label: '能，一条边已经足够',
                  wrongFeedback: '纸盒、易拉罐和背景中也可能出现相似边缘。',
                },
                {
                  key: 'B',
                  value: 'no',
                  label: '不能，还需要更多线索',
                },
              ]}
              feedback={{
                correct: '对。单一局部线索还不足以确定类别。',
                wrong: '再想想：一条竖边也可能来自纸盒或背景。',
              }}
              persistenceKey="resnet-transfer-guide:05-hierarchical-features:edge-question"
              showFeedback={false}
              onCheck={handlePrediction}
            />
          )}

          <div className="rtg-hierarchical__layer-copy">
            <Typography as="span" variant="bodySmall" tone="warning">当前层正在做什么</Typography>
            <Typography as="h3" variant="h3" tone="accent">{current.title}</Typography>
            <Typography variant="bodySmall" tone="muted">{current.description}</Typography>
          </div>

          {activeLayer === 1 && (
            <Callout
              tone="blue"
              label="组合规则"
              text="点击瓶子上的三个局部结构。它们都来自上一层多个相邻响应的共同作用。"
            />
          )}

          {activeLayer === 2 && (
            <Callout
              tone="orange"
              label="结构关系"
              text="瓶盖、瓶颈、瓶身和瓶底之间的空间关系，比一条孤立边缘提供了更完整的证据。"
            />
          )}
        </aside>

        <section className={'rtg-hierarchical__visual rtg-hierarchical__visual--layer-' + activeLayer} aria-labelledby="rtg-hierarchical-visual-title">
          <header className="rtg-hierarchical__visual-head">
            <div>
              <Typography as="span" variant="bodySmall" tone="warning">同一个塑料瓶</Typography>
              <Typography as="h2" variant="h3" tone="accent" id="rtg-hierarchical-visual-title">
                {activeLayer === 0 ? '点亮局部线索' : activeLayer === 1 ? '查看组合后的部件' : '观察完整结构关系'}
              </Typography>
            </div>
            <Typography variant="bodySmall" tone="muted">
              教学示意：真实表示通常由多个通道共同形成。
            </Typography>
          </header>

          <div className="rtg-hierarchical__scene">
            <div className="rtg-hierarchical__photo-frame">
              <img src={bottleFront} alt="统一背景下的透明塑料瓶正面照片" />

              <div className="rtg-hierarchical__shallow-traces" aria-hidden="true">
                <span className="rtg-hierarchical__trace rtg-hierarchical__trace--arc" />
                <span className="rtg-hierarchical__trace rtg-hierarchical__trace--edge" />
                <span className="rtg-hierarchical__trace rtg-hierarchical__trace--boundary" />
              </div>

              <div className="rtg-hierarchical__part-outlines" aria-hidden="true">
                <span className="rtg-hierarchical__part-outline rtg-hierarchical__part-outline--cap" />
                <span className="rtg-hierarchical__part-outline rtg-hierarchical__part-outline--body" />
                <span className="rtg-hierarchical__part-outline rtg-hierarchical__part-outline--base" />
              </div>

              <div className="rtg-hierarchical__structure-overlay" aria-hidden="true">
                <span className="rtg-hierarchical__structure-halo" />
                <span className="rtg-hierarchical__structure-spine" />
                <span className="rtg-hierarchical__structure-node rtg-hierarchical__structure-node--cap" />
                <span className="rtg-hierarchical__structure-node rtg-hierarchical__structure-node--neck" />
                <span className="rtg-hierarchical__structure-node rtg-hierarchical__structure-node--body" />
                <span className="rtg-hierarchical__structure-node rtg-hierarchical__structure-node--base" />
              </div>

              <div className="rtg-hierarchical__cue-buttons" aria-label="浅层线索">
                {cues.map((cue, index) => (
                  <Button
                    key={cue.id}
                    className={'rtg-hierarchical__marker rtg-hierarchical__marker--cue rtg-hierarchical__marker--' + cue.id + (visitedCues.has(cue.id) ? ' is-visited' : '')}
                    variant={visitedCues.has(cue.id) ? 'primary' : 'default'}
                    active={visitedCues.has(cue.id)}
                    hint={activeLayer === 0 && predictionSolved && index === 0 && visitedCues.size === 0}
                    disabled={activeLayer !== 0 || !predictionSolved}
                    onClick={() => visitCue(cue.id)}
                  >
                    <span className="rtg-hierarchical__marker-dot" aria-hidden="true" />
                    <Typography as="strong" variant="bodySmall" tone="inherit">{cue.label}</Typography>
                  </Button>
                ))}
              </div>

              <div className="rtg-hierarchical__part-buttons" aria-label="中间层局部结构">
                {parts.map((part, index) => (
                  <Button
                    key={part.id}
                    className={'rtg-hierarchical__marker rtg-hierarchical__marker--part rtg-hierarchical__marker--' + part.id + (visitedParts.has(part.id) ? ' is-visited' : '')}
                    variant={visitedParts.has(part.id) ? 'primary' : 'default'}
                    active={visitedParts.has(part.id)}
                    hint={activeLayer === 1 && index === 0 && visitedParts.size === 0}
                    disabled={activeLayer !== 1}
                    onClick={() => visitPart(part.id)}
                  >
                    <span className="rtg-hierarchical__marker-dot" aria-hidden="true" />
                    <Typography as="strong" variant="bodySmall" tone="inherit">{part.label}</Typography>
                  </Button>
                ))}
              </div>

              <div className="rtg-hierarchical__structure-labels" aria-label="更深层整合的物体部件">
                <Typography as="span" variant="bodySmall" tone="accent" className="rtg-hierarchical__structure-label rtg-hierarchical__structure-label--cap">瓶盖</Typography>
                <Typography as="span" variant="bodySmall" tone="accent" className="rtg-hierarchical__structure-label rtg-hierarchical__structure-label--neck">瓶颈</Typography>
                <Typography as="span" variant="bodySmall" tone="accent" className="rtg-hierarchical__structure-label rtg-hierarchical__structure-label--body">瓶身</Typography>
                <Typography as="span" variant="bodySmall" tone="accent" className="rtg-hierarchical__structure-label rtg-hierarchical__structure-label--base">瓶底</Typography>
              </div>
            </div>
          </div>

          <div className="rtg-hierarchical__representation" aria-label="当前层的输入和输出">
            <div>
              <Typography as="span" variant="bodySmall" tone="muted">这一层接收</Typography>
              <Typography as="strong" variant="body" tone="accent">{current.input}</Typography>
            </div>
            <span className="rtg-hierarchical__representation-arrow" aria-hidden="true" />
            <div>
              <Typography as="span" variant="bodySmall" tone="muted">这一层产生</Typography>
              <Typography as="strong" variant="body" tone="accent">{current.output}</Typography>
            </div>
          </div>
        </section>
      </div>

      <NoticeStrip tone={completed ? 'green' : 'blue'} role="status" aria-live="polite">
        <Typography variant="body" tone="inherit">{notice}</Typography>
      </NoticeStrip>
    </ContentBlock>
  );
}
