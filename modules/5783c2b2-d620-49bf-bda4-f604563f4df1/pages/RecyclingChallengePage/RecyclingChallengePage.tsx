import { moduleIdentity } from '../../outlines.json';
import { moduleAssetUrl } from '../../../shared/react/assets';
import { useRef, useState, type DragEvent } from 'react';
import { Button, ContentBlock, NoticeStrip, Typography } from '../../../shared/react';
const bottleUpright = moduleAssetUrl(moduleIdentity.id, "recycling/bottle-upright.png");
const bottleCrushed = moduleAssetUrl(moduleIdentity.id, "recycling/bottle-crushed.png");
const canUpright = moduleAssetUrl(moduleIdentity.id, "recycling/can-upright.png");
const cartonUpright = moduleAssetUrl(moduleIdentity.id, "recycling/carton-upright.png");
import './RecyclingChallengePage.css';

type CategoryId = 'bottle' | 'can' | 'carton';

const trainingExamples = [
  { id: 'bottle' as const, label: '塑料瓶', image: bottleUpright, alt: '训练样本中的直立透明塑料瓶' },
  { id: 'can' as const, label: '易拉罐', image: canUpright, alt: '训练样本中的银色直立易拉罐' },
  { id: 'carton' as const, label: '纸盒', image: cartonUpright, alt: '训练样本中的棕色纸盒' },
];

const categories = [
  { id: 'bottle' as const, label: '塑料瓶', count: '约 100 张训练照片' },
  { id: 'can' as const, label: '易拉罐', count: '约 100 张训练照片' },
  { id: 'carton' as const, label: '纸盒', count: '约 100 张训练照片' },
];

const feedbackCopy: Record<CategoryId, string> = {
  bottle: '你抓住的不是每个像素，而是瓶盖、瓶口和连续曲面这些较稳定的线索。',
  can: '压扁后的反光容易让人想到易拉罐，但瓶盖和瓶口仍然存在。再看一次物体结构。',
  carton: '轮廓虽然变形了，却没有纸盒的折面和棱角。瓶口是更可靠的线索。',
};

export interface RecyclingChallengePageProps {
  onComplete?: () => void;
}

export function RecyclingChallengePage({ onComplete }: RecyclingChallengePageProps) {
  const completedRef = useRef(false);
  const [answer, setAnswer] = useState<CategoryId | null>(null);
  const [dragOver, setDragOver] = useState<CategoryId | null>(null);
  const correct = answer === 'bottle';

  const chooseCategory = (category: CategoryId) => {
    setAnswer(category);
    setDragOver(null);
    if (category === 'bottle' && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  };

  const handleDragStart = (event: DragEvent<HTMLElement>) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', 'new-recycling-photo');
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>, category: CategoryId) => {
    event.preventDefault();
    if (event.dataTransfer.getData('text/plain') === 'new-recycling-photo') {
      chooseCategory(category);
    }
  };

  return (
    <ContentBlock
      headingLevel={1}
      className="rtg-recycling-challenge"
      title="只有 300 张照片，怎样识别可回收物？"
      subtitle="模型只见过三类训练照片。现在来了一张外观发生变化的新照片。"
    >
      <div className="rtg-recycling-challenge__stage">
        <section className="rtg-recycling-challenge__training" aria-labelledby="rtg-training-title">
          <div className="rtg-recycling-challenge__section-head">
            <Typography as="span" variant="bodySmall" tone="warning">模型见过的照片</Typography>
            <Typography as="h2" variant="h2" tone="accent" id="rtg-training-title">训练集</Typography>
            <Typography variant="body" tone="muted">教学情境：三类照片合计 300 张</Typography>
          </div>

          <div className="rtg-recycling-challenge__examples">
            {trainingExamples.map((example) => (
              <figure className="rtg-recycling-challenge__example" key={example.id}>
                <div className="rtg-recycling-challenge__example-image">
                  <img src={example.image} alt={example.alt} />
                </div>
                <figcaption>
                  <Typography as="strong" variant="body" tone="main">{example.label}</Typography>
                </figcaption>
              </figure>
            ))}
          </div>

          <div className="rtg-recycling-challenge__dataset-count">
            <Typography as="strong" variant="display" tone="accent">300</Typography>
            <div>
              <Typography as="strong" variant="h3" tone="main">张训练照片</Typography>
              <Typography variant="bodySmall" tone="muted">数量有限，外观也不可能覆盖所有变化</Typography>
            </div>
          </div>
        </section>

        <div className="rtg-recycling-challenge__divider" aria-hidden="true" />

        <section className="rtg-recycling-challenge__challenge" aria-labelledby="rtg-challenge-title">
          <div className="rtg-recycling-challenge__section-head">
            <Typography as="span" variant="bodySmall" tone="warning">一张没见过的照片</Typography>
            <Typography as="h2" variant="h2" tone="accent" id="rtg-challenge-title">它属于哪一类？</Typography>
            <Typography variant="body" tone="muted">拖动照片到类别中，或直接点击一个类别。</Typography>
          </div>

          <div className="rtg-recycling-challenge__task">
            <figure
              className={'rtg-recycling-challenge__mystery' + (correct ? ' is-revealed' : '')}
              draggable
              onDragStart={handleDragStart}
            >
              <div className="rtg-recycling-challenge__new-label">
                <Typography as="span" variant="bodySmall" tone="inherit">新照片</Typography>
              </div>
              <img src={bottleCrushed} alt="等待分类的压扁透明塑料瓶" />
              {correct && (
                <div className="rtg-recycling-challenge__clues" aria-label="支持判断的稳定线索">
                  <div className="rtg-recycling-challenge__clue rtg-recycling-challenge__clue--cap">
                    <span aria-hidden="true" />
                    <Typography as="strong" variant="bodySmall" tone="accent">瓶盖与瓶口仍在</Typography>
                  </div>
                  <div className="rtg-recycling-challenge__clue rtg-recycling-challenge__clue--shape">
                    <span aria-hidden="true" />
                    <Typography as="strong" variant="bodySmall" tone="accent">连续曲面仍像瓶身</Typography>
                  </div>
                </div>
              )}
              <figcaption>
                <Typography variant="bodySmall" tone="muted">可拖动</Typography>
              </figcaption>
            </figure>

            <div className="rtg-recycling-challenge__targets" role="group" aria-label="可选择的分类">
              {categories.map((category) => {
                const selected = answer === category.id;
                const stateClass = selected ? (category.id === 'bottle' ? ' is-correct' : ' is-incorrect') : '';
                const overClass = dragOver === category.id ? ' is-drag-over' : '';
                return (
                  <button
                    className={'rtg-recycling-challenge__target' + stateClass + overClass}
                    key={category.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => chooseCategory(category.id)}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = 'move';
                      setDragOver(category.id);
                    }}
                    onDragLeave={() => setDragOver((current) => current === category.id ? null : current)}
                    onDrop={(event) => handleDrop(event, category.id)}
                  >
                    <Typography as="strong" variant="h3" tone="inherit">{category.label}</Typography>
                    <Typography as="span" variant="bodySmall" tone="inherit">{category.count}</Typography>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <div className="rtg-recycling-challenge__feedback">
        <NoticeStrip
          tone={answer === null ? 'blue' : correct ? 'green' : 'orange'}
          role="status"
          aria-live="polite"
        >
          <Typography variant="body" tone="inherit">
            {answer === null ? '照片的姿态变了。你会把它放进哪一类？' : feedbackCopy[answer]}
          </Typography>
        </NoticeStrip>
        {answer !== null && (
          <Button variant="default" onClick={() => setAnswer(null)}>
            <Typography as="span" variant="body" tone="inherit">再判断一次</Typography>
          </Button>
        )}
      </div>
    </ContentBlock>
  );
}
