import { moduleIdentity } from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { useRef, useState, type DragEvent } from 'react';
import { Button, ContentBlock, NoticeStrip, Typography } from "@shuku/course-style/react";
const bottleUpright = moduleAssetUrl("recycling/bottle-upright.webp");
const bottleCrushed = moduleAssetUrl("recycling/bottle-crushed.webp");
const canUpright = moduleAssetUrl("recycling/can-upright.webp");
const cartonUpright = moduleAssetUrl("recycling/carton-upright.webp");
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
    <ContentBlock shuku-edit-id="e-80db83e0-3de2-44ac-863e-9f13aa058af4"
      headingLevel={1}
      className="rtg-recycling-challenge"
      title="只有 300 张照片，怎样识别可回收物？"
      subtitle="模型只见过三类训练照片。现在来了一张外观发生变化的新照片。"
    >
      <div shuku-edit-id="e-972830ad-e4b9-4a40-8b3f-20b33663c4a2" className="rtg-recycling-challenge__stage">
        <section shuku-edit-id="e-c1776d83-61b2-4808-8c87-ffadb0e8b9f9" className="rtg-recycling-challenge__training" aria-labelledby="rtg-training-title">
          <div shuku-edit-id="e-04b80501-2737-42e9-8f98-880d0ba5424f" className="rtg-recycling-challenge__section-head">
            <Typography shuku-edit-id="e-1974ccbb-fd1c-47a8-95ce-e22e733d5868" as="span" variant="bodySmall" tone="warning">模型见过的照片</Typography>
            <Typography shuku-edit-id="e-4b4dcfe4-ea85-40f3-b836-eff6a4acaaa3" as="h2" variant="h2" tone="accent" id="rtg-training-title">训练集</Typography>
            <Typography shuku-edit-id="e-c114e2d1-7df1-43a8-a271-aed3ab1d5f5b" variant="body" tone="muted">教学情境：三类照片合计 300 张</Typography>
          </div>

          <div shuku-edit-id="e-73dbcbf0-cfb8-439e-928b-4bc0f0b4213f" className="rtg-recycling-challenge__examples">
            {trainingExamples.map((example) => (
              <figure shuku-edit-id="e-8746531f-cc0c-447c-ab31-3382a6e38351" className="rtg-recycling-challenge__example" key={example.id}>
                <div shuku-edit-id="e-50164220-6744-41bf-8e2e-27cf3c4816fd" className="rtg-recycling-challenge__example-image">
                  <img shuku-edit-id="e-08467826-6331-483c-814e-bfb9edbdff1e" src={example.image} alt={example.alt} />
                </div>
                <figcaption shuku-edit-id="e-343df6c7-953d-42d0-b0e5-c3e0c6ea26a8">
                  <Typography shuku-edit-id="e-2217fc2e-8e21-4163-bad0-8d56258097f6" as="strong" variant="body" tone="main">{example.label}</Typography>
                </figcaption>
              </figure>
            ))}
          </div>

          <div shuku-edit-id="e-61e56b38-7148-4f25-82d7-97985a537205" className="rtg-recycling-challenge__dataset-count">
            <Typography shuku-edit-id="e-16fdfc92-7f6a-47bd-9834-aaf79dd00557" as="strong" variant="display" tone="accent">300</Typography>
            <div shuku-edit-id="e-ff5ad9d8-f1bd-4534-a18b-0207cad946c7">
              <Typography shuku-edit-id="e-f6ab73bd-d281-4132-9874-a03c65825cdf" as="strong" variant="h3" tone="main">张训练照片</Typography>
              <Typography shuku-edit-id="e-af22c661-cf35-4f87-b9ce-38e8b6f8bc45" variant="bodySmall" tone="muted">数量有限，外观也不可能覆盖所有变化</Typography>
            </div>
          </div>
        </section>

        <div shuku-edit-id="e-c6b7989c-e2ea-42cf-8f26-fdb6cedc1c55" className="rtg-recycling-challenge__divider" aria-hidden="true" />

        <section shuku-edit-id="e-c2f7b739-bfc6-425f-a56a-14c73b01d81f" className="rtg-recycling-challenge__challenge" aria-labelledby="rtg-challenge-title">
          <div shuku-edit-id="e-3aaaa21e-4685-4e5b-b28b-e5d4edcf50f4" className="rtg-recycling-challenge__section-head">
            <Typography shuku-edit-id="e-e81ed591-5c11-402e-9102-1516dcaee7d5" as="span" variant="bodySmall" tone="warning">一张没见过的照片</Typography>
            <Typography shuku-edit-id="e-6c9ca7f2-2a3f-42c3-8771-d9d83c94ad9a" as="h2" variant="h2" tone="accent" id="rtg-challenge-title">它属于哪一类？</Typography>
            <Typography shuku-edit-id="e-5b4a66f5-76a6-4dba-9863-86a3f4b16fc3" variant="body" tone="muted">拖动照片到类别中，或直接点击一个类别。</Typography>
          </div>

          <div shuku-edit-id="e-4d25d192-8ce6-4f95-a1cf-e4cf44ffdd52" className="rtg-recycling-challenge__task">
            <figure shuku-edit-id="e-e4da2aba-e258-477c-a413-ef1f8964afbd"
              className={'rtg-recycling-challenge__mystery' + (correct ? ' is-revealed' : '')}
              draggable
              onDragStart={handleDragStart}
            >
              <div shuku-edit-id="e-debb9844-a30b-449a-bc3e-a65697628d8f" className="rtg-recycling-challenge__new-label">
                <Typography shuku-edit-id="e-c22ce3e2-2ed8-4aec-a1c0-7b546ace138b" as="span" variant="bodySmall" tone="inherit">新照片</Typography>
              </div>
              <img shuku-edit-id="e-097f309c-325c-4f97-983b-c3ead3e5eb6c" src={bottleCrushed} alt="等待分类的压扁透明塑料瓶" />
              {correct && (
                <div shuku-edit-id="e-e09b711f-f6f5-4205-8762-12edb0e34e68" className="rtg-recycling-challenge__clues" aria-label="支持判断的稳定线索">
                  <div shuku-edit-id="e-87d2f428-065d-46f5-82ba-e0cecc38eaef" className="rtg-recycling-challenge__clue rtg-recycling-challenge__clue--cap">
                    <span shuku-edit-id="e-b98febd8-6758-4984-abc1-eef7ab5d395d" aria-hidden="true" />
                    <Typography shuku-edit-id="e-d7fb18ea-cd6d-4084-b25f-8bd192d35721" as="strong" variant="bodySmall" tone="accent">瓶盖与瓶口仍在</Typography>
                  </div>
                  <div shuku-edit-id="e-f0440657-a777-42c3-8464-e7ee7eeb06e6" className="rtg-recycling-challenge__clue rtg-recycling-challenge__clue--shape">
                    <span shuku-edit-id="e-23af211e-24c6-4d54-a112-316403c98770" aria-hidden="true" />
                    <Typography shuku-edit-id="e-b779e557-dd7c-4a70-ba49-20c7a1fa8ed3" as="strong" variant="bodySmall" tone="accent">连续曲面仍像瓶身</Typography>
                  </div>
                </div>
              )}
              <figcaption shuku-edit-id="e-eef7ca0c-eb98-45dc-bc72-ef6912e61267">
                <Typography shuku-edit-id="e-5535227c-debe-40fa-918a-8432f3037a93" variant="bodySmall" tone="muted">可拖动</Typography>
              </figcaption>
            </figure>

            <div shuku-edit-id="e-fd708594-1ee3-43ce-bd1f-e4a7fd43b6a3" className="rtg-recycling-challenge__targets" role="group" aria-label="可选择的分类">
              {categories.map((category) => {
                const selected = answer === category.id;
                const stateClass = selected ? (category.id === 'bottle' ? ' is-correct' : ' is-incorrect') : '';
                const overClass = dragOver === category.id ? ' is-drag-over' : '';
                return (
                  <button shuku-edit-id="e-bbe7f193-ef27-4bc3-93f8-a7aaa86cd0d1"
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
                    <Typography shuku-edit-id="e-5df38b29-50a2-45a3-920d-6d5e1c1ae092" as="strong" variant="h3" tone="inherit">{category.label}</Typography>
                    <Typography shuku-edit-id="e-d1489c69-b26f-440c-b679-d4f2fb84a627" as="span" variant="bodySmall" tone="inherit">{category.count}</Typography>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <div shuku-edit-id="e-514594d6-3245-46bb-b4a0-e9eeb6a9d769" className="rtg-recycling-challenge__feedback">
        <NoticeStrip
          tone={answer === null ? 'blue' : correct ? 'green' : 'orange'}
          role="status"
          aria-live="polite"
        >
          <Typography shuku-edit-id="e-14541d8a-8609-4999-8e10-be519cb6558a" variant="body" tone="inherit">
            {answer === null ? '照片的姿态变了。你会把它放进哪一类？' : feedbackCopy[answer]}
          </Typography>
        </NoticeStrip>
        {answer !== null && (
          <Button variant="default" onClick={() => setAnswer(null)}>
            <Typography shuku-edit-id="e-82645041-5dc5-429f-a11a-418b9999b502" as="span" variant="body" tone="inherit">再判断一次</Typography>
          </Button>
        )}
      </div>
    </ContentBlock>
  );
}
