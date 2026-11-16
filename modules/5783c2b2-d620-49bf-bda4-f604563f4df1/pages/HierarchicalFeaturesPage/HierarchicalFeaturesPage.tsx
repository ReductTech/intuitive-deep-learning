import { moduleIdentity } from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { useEffect, useRef, useState } from 'react';
import { Button, Callout, ContentBlock, NoticeStrip, Question, Typography, type QuestionCheckResult } from "@shuku/course-style/react";
const bottleFront = moduleAssetUrl("recycling/camera-views/bottle-front.jpg");
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
    <ContentBlock shuku-edit-id="e-7ce19b02-0c10-48fd-8358-0d280e54347e"
      headingLevel={1}
      className="rtg-hierarchical"
      title="网络怎样逐层组合线索？"
      subtitle="后一层读取前一层的特征图，把相邻的简单响应组合成更大的结构。"
    >
      <div shuku-edit-id="e-6575d8db-e424-466d-8306-9df2681c55cb" className="rtg-hierarchical__workspace">
        <aside shuku-edit-id="e-cb77e6e5-cd17-446b-8139-8c5f787b0b1d" className="rtg-hierarchical__controls" aria-label="网络深度与当前任务">
          <div shuku-edit-id="e-87bf592c-033c-4926-bfff-77c651015ca7" className="rtg-hierarchical__depth-heading">
            <Typography shuku-edit-id="e-adcb4d1f-674b-4ac0-975d-0cf147e6246b" as="span" variant="bodySmall" tone="warning">沿网络深度前进</Typography>
            <Typography shuku-edit-id="e-2130f47b-2cbd-4f87-af98-fe72a5e3887b" as="h2" variant="h3" tone="accent">三层逐步组合</Typography>
          </div>

          <div shuku-edit-id="e-0e1b0a37-4ee6-4cfa-9c4b-a7899cb522a1" className="rtg-hierarchical__depth-rail" role="tablist" aria-label="特征层级">
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
                  <Typography shuku-edit-id="e-8628e712-2388-47df-9568-70f9a1cbac4f" as="span" variant="bodySmall" tone="inherit" className="rtg-hierarchical__step-number">
                    {index + 1}
                  </Typography>
                  <Typography shuku-edit-id="e-3831cfc2-1f2d-430b-b509-7a94c81d08f4" as="strong" variant="bodySmall" tone="inherit">{layer.label}</Typography>
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

          <div shuku-edit-id="e-bdfa9434-9132-4258-8f9e-fc5cd62a00be" className="rtg-hierarchical__layer-copy">
            <Typography shuku-edit-id="e-96ff5101-dc3c-49ad-a52b-4f890b5545e2" as="span" variant="bodySmall" tone="warning">当前层正在做什么</Typography>
            <Typography shuku-edit-id="e-70cf1ca2-6db7-47ee-962f-82756d1b4a3e" as="h3" variant="h3" tone="accent">{current.title}</Typography>
            <Typography shuku-edit-id="e-4a9622dd-55f8-42e6-8637-ca165aed4fa5" variant="bodySmall" tone="muted">{current.description}</Typography>
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

        <section shuku-edit-id="e-a00413b2-4492-4437-9339-3985f2668853" className={'rtg-hierarchical__visual rtg-hierarchical__visual--layer-' + activeLayer} aria-labelledby="rtg-hierarchical-visual-title">
          <header shuku-edit-id="e-200a6722-d98b-4c25-97ff-4d250c8916cc" className="rtg-hierarchical__visual-head">
            <div shuku-edit-id="e-76b9f3a9-cc15-4df7-9f8e-fa2f2d93b459">
              <Typography shuku-edit-id="e-18ba8805-2843-436c-9020-c379b2c92ccc" as="span" variant="bodySmall" tone="warning">同一个塑料瓶</Typography>
              <Typography shuku-edit-id="e-8c8a3428-2aa9-4314-a326-fc3f54af1cc5" as="h2" variant="h3" tone="accent" id="rtg-hierarchical-visual-title">
                {activeLayer === 0 ? '点亮局部线索' : activeLayer === 1 ? '查看组合后的部件' : '观察完整结构关系'}
              </Typography>
            </div>
            <Typography shuku-edit-id="e-773f5ab9-f83b-4818-bb4a-8c457469680c" variant="bodySmall" tone="muted">
              教学示意：真实表示通常由多个通道共同形成。
            </Typography>
          </header>

          <div shuku-edit-id="e-67cd8a63-2bab-4a32-a655-130236dccaef" className="rtg-hierarchical__scene">
            <div shuku-edit-id="e-c5962bc8-63c7-4fc6-b6e9-8db132c8fb7f" className="rtg-hierarchical__photo-frame">
              <img shuku-edit-id="e-39ce2adc-c064-4046-bd47-bcc6f02e263b" src={bottleFront} alt="统一背景下的透明塑料瓶正面照片" />

              <div shuku-edit-id="e-5891529a-ecd4-4f49-83d2-0e181878427a" className="rtg-hierarchical__shallow-traces" aria-hidden="true">
                <span shuku-edit-id="e-3c8a3704-139e-4535-8670-27510ca847e4" className="rtg-hierarchical__trace rtg-hierarchical__trace--arc" />
                <span shuku-edit-id="e-37180275-cada-46e7-bfd7-d552573d703a" className="rtg-hierarchical__trace rtg-hierarchical__trace--edge" />
                <span shuku-edit-id="e-d09d311e-bd69-4ef4-82f7-59f52b8b720c" className="rtg-hierarchical__trace rtg-hierarchical__trace--boundary" />
              </div>

              <div shuku-edit-id="e-e270b689-0af3-4bec-a61b-7765c9ef0c27" className="rtg-hierarchical__part-outlines" aria-hidden="true">
                <span shuku-edit-id="e-01d40619-43f1-455e-b423-2ee6ef81e151" className="rtg-hierarchical__part-outline rtg-hierarchical__part-outline--cap" />
                <span shuku-edit-id="e-45158ef1-bc1d-4119-9a03-ecad7d663fbc" className="rtg-hierarchical__part-outline rtg-hierarchical__part-outline--body" />
                <span shuku-edit-id="e-a2a5a87f-a704-4675-bcfe-0b6f14ea7d74" className="rtg-hierarchical__part-outline rtg-hierarchical__part-outline--base" />
              </div>

              <div shuku-edit-id="e-f54c46e3-7499-47a1-a139-0a699f2baee0" className="rtg-hierarchical__structure-overlay" aria-hidden="true">
                <span shuku-edit-id="e-c9523e0a-a724-4c5a-83d7-2370f86f4349" className="rtg-hierarchical__structure-halo" />
                <span shuku-edit-id="e-7f49213d-42f5-44a4-a783-6884507a71f4" className="rtg-hierarchical__structure-spine" />
                <span shuku-edit-id="e-5c7d8105-380f-404f-b278-25b4e14234f9" className="rtg-hierarchical__structure-node rtg-hierarchical__structure-node--cap" />
                <span shuku-edit-id="e-fc292237-a1a5-49e3-8600-8e5d55e4a228" className="rtg-hierarchical__structure-node rtg-hierarchical__structure-node--neck" />
                <span shuku-edit-id="e-6a5fcc78-150d-45e8-90b7-09fdae5122f7" className="rtg-hierarchical__structure-node rtg-hierarchical__structure-node--body" />
                <span shuku-edit-id="e-5617abfd-f1ed-43b8-9663-a58ade3efdd9" className="rtg-hierarchical__structure-node rtg-hierarchical__structure-node--base" />
              </div>

              <div shuku-edit-id="e-ff84e45f-6bad-43af-9bdc-050687faeff1" className="rtg-hierarchical__cue-buttons" aria-label="浅层线索">
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
                    <span shuku-edit-id="e-76c4919f-7c7e-4c2c-a5d8-5815b4265e47" className="rtg-hierarchical__marker-dot" aria-hidden="true" />
                    <Typography shuku-edit-id="e-5b25d8ee-e0d9-48bb-8ef4-2cb331736661" as="strong" variant="bodySmall" tone="inherit">{cue.label}</Typography>
                  </Button>
                ))}
              </div>

              <div shuku-edit-id="e-2b704c50-468c-4b76-9c82-16145929f0e7" className="rtg-hierarchical__part-buttons" aria-label="中间层局部结构">
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
                    <span shuku-edit-id="e-2c0b700a-566b-4981-a047-caa60b8b7234" className="rtg-hierarchical__marker-dot" aria-hidden="true" />
                    <Typography shuku-edit-id="e-a8bf0125-fd9b-4621-8e80-c4b01fd54b6b" as="strong" variant="bodySmall" tone="inherit">{part.label}</Typography>
                  </Button>
                ))}
              </div>

              <div shuku-edit-id="e-f4de6538-74d3-455c-a2e7-abba89b2c4bb" className="rtg-hierarchical__structure-labels" aria-label="更深层整合的物体部件">
                <Typography shuku-edit-id="e-649becd4-de7b-4d42-b0db-9a419622ca18" as="span" variant="bodySmall" tone="accent" className="rtg-hierarchical__structure-label rtg-hierarchical__structure-label--cap">瓶盖</Typography>
                <Typography shuku-edit-id="e-a7fb45a5-a850-43ae-9fc4-b4269ebe404f" as="span" variant="bodySmall" tone="accent" className="rtg-hierarchical__structure-label rtg-hierarchical__structure-label--neck">瓶颈</Typography>
                <Typography shuku-edit-id="e-7bfa6c20-b776-49bf-bf88-a93e1d81fb23" as="span" variant="bodySmall" tone="accent" className="rtg-hierarchical__structure-label rtg-hierarchical__structure-label--body">瓶身</Typography>
                <Typography shuku-edit-id="e-1a56fbe5-8f88-4427-9dc9-71c399a4917a" as="span" variant="bodySmall" tone="accent" className="rtg-hierarchical__structure-label rtg-hierarchical__structure-label--base">瓶底</Typography>
              </div>
            </div>
          </div>

          <div shuku-edit-id="e-282f7b38-a9c3-4a86-b476-fc8fec3649d5" className="rtg-hierarchical__representation" aria-label="当前层的输入和输出">
            <div shuku-edit-id="e-bfe9d060-ed0f-4ea9-b040-2b7aeebedf71">
              <Typography shuku-edit-id="e-3b4b3fd6-712c-4e55-8347-8a7ae20fc664" as="span" variant="bodySmall" tone="muted">这一层接收</Typography>
              <Typography shuku-edit-id="e-01d31b70-2c32-4e74-824f-248081da7d18" as="strong" variant="body" tone="accent">{current.input}</Typography>
            </div>
            <span shuku-edit-id="e-5ce4cf3c-700c-4a13-9dd8-0426787e89db" className="rtg-hierarchical__representation-arrow" aria-hidden="true" />
            <div shuku-edit-id="e-2580afad-ac3e-4287-acb9-5a0d008a5d1e">
              <Typography shuku-edit-id="e-24a0ea04-cc6f-4741-a146-6863d03d9eff" as="span" variant="bodySmall" tone="muted">这一层产生</Typography>
              <Typography shuku-edit-id="e-5a0faebd-d49e-4522-9e89-634f0748361f" as="strong" variant="body" tone="accent">{current.output}</Typography>
            </div>
          </div>
        </section>
      </div>

      <NoticeStrip tone={completed ? 'green' : 'blue'} role="status" aria-live="polite">
        <Typography shuku-edit-id="e-6604a59a-e372-4241-a925-3c2c21f0941a" variant="body" tone="inherit">{notice}</Typography>
      </NoticeStrip>
    </ContentBlock>
  );
}
