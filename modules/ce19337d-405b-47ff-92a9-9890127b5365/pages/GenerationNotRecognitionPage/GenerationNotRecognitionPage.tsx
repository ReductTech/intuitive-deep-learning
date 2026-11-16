import moduleAssetOutline from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { type CSSProperties } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import './GenerationNotRecognitionPage.css';

const visualGenerationOverview = moduleAssetUrl('images/00visual-generation.svg');
const resultOne = moduleAssetUrl('images/00result-01.svg');
const resultTwo = moduleAssetUrl('images/00result-02.svg');
const resultThree = moduleAssetUrl('images/00result-03.svg');
const resultFour = moduleAssetUrl('images/00result-04.svg');

const resultMasks = [
  { x: 1197, y: 480, width: 399, height: 234 },
  { x: 1601, y: 480, width: 438, height: 234 },
  { x: 1197, y: 717, width: 399, height: 237 },
  { x: 1601, y: 717, width: 438, height: 237 },
] as const;

const resultStage = { x: 1197, y: 480, width: 842, height: 474 } as const;
const resultImages = [resultOne, resultTwo, resultThree, resultFour] as const;

export function GenerationNotRecognitionPage() {
  return (
    <ContentBlock shuku-edit-id="e-fff8efcd-79bd-4a24-a2d8-36c24d4e6316"
      headingLevel={1}
      className="vg-shared-page vg-generation-page"
      title="视觉理解与视觉生成，学习方向正好相反"
      subtitle="典型的分类或识别任务把高维图像压缩为少量结果信息；生成任务则从有限条件中展开一张合理但不唯一的高维图像。"
    >
      <div shuku-edit-id="e-0d719b10-3b40-48b9-8fa0-827379521b5b"
        className="vg-generation-page__visual"
        role="img"
        aria-label="视觉理解与视觉生成的对比。左侧把一张高维猫图片预测为低维类别 Cat；右侧根据一句有限的文字条件，生成四张不同但都符合条件的高维猫图片。"
      >
        <img shuku-edit-id="e-0dc18750-fdb2-41da-802e-c34db96446e8" className="vg-generation-page__source" src={visualGenerationOverview} alt="" aria-hidden="true" />
        <div shuku-edit-id="e-71bbda34-9731-4b4d-acb3-2a3200e335d5"
          className="vg-generation-page__result-stage"
          style={{
            '--stage-left': `${((resultStage.x - 40) / 2120) * 100}%`,
            '--stage-top': `${((resultStage.y - 160) / 840) * 100}%`,
            '--stage-width': `${(resultStage.width / 2120) * 100}%`,
            '--stage-height': `${(resultStage.height / 840) * 100}%`,
          } as CSSProperties}
          aria-hidden="true"
        >
          {resultMasks.map((result, index) => (
            <span shuku-edit-id="e-9ff4afe4-dd94-4ceb-878f-bcf28ad5618e"
              className="vg-generation-page__result"
              key={`${result.x}-${result.y}`}
              style={{
                '--result-left': `${((result.x - resultStage.x) / resultStage.width) * 100}%`,
                '--result-top': `${((result.y - resultStage.y) / resultStage.height) * 100}%`,
                '--result-width': `${(result.width / resultStage.width) * 100}%`,
                '--result-height': `${(result.height / resultStage.height) * 100}%`,
              } as CSSProperties}
            >
              <img shuku-edit-id="e-7f61b931-3c61-4346-b970-c4d55e076966" src={resultImages[index]} alt="" />
            </span>
          ))}
        </div>
      </div>

      <section shuku-edit-id="e-da46875d-18ee-4c43-929b-afb167578e66" className="vg-generation-page__insight" aria-label="视觉理解与视觉生成的信息方向">
        <article shuku-edit-id="e-c0f45ce5-f5dc-4194-8785-b2b1cd44a4c1" className="vg-generation-page__mapping vg-generation-page__mapping--understanding">
          <Typography shuku-edit-id="e-99fd7bff-66ff-4286-9a64-d850a49c58ef" as="h2" variant="h3" tone="accent">视觉理解</Typography>
          <div shuku-edit-id="e-595c75e4-647f-4626-8dfa-5d0993f54060" className="vg-generation-page__direction">
            <Typography shuku-edit-id="e-514ecd0e-79c3-448c-9a1e-e8c6593204e3" as="span" variant="bodySmall" tone="main" className="vg-generation-page__endpoint">高维图像</Typography>
            <span shuku-edit-id="e-123a1415-5a8b-4e6f-bc01-66299fc57a88" className="vg-generation-page__arrow" aria-hidden="true">→</span>
            <Typography shuku-edit-id="e-d2fcdfee-fd55-4c80-9f7d-1f027bfe87b5" as="span" variant="bodySmall" tone="accent" className="vg-generation-page__endpoint vg-generation-page__endpoint--understanding">低维结果信息</Typography>
          </div>
          <Typography shuku-edit-id="e-e5b9a7da-8f40-4216-aa5d-c133f264d302" variant="bodySmall" tone="muted">从大量像素中提取类别、属性等少量结果信息。</Typography>
        </article>

        <article shuku-edit-id="e-06568e44-88f8-4aae-81ef-f08b19d46220" className="vg-generation-page__mapping vg-generation-page__mapping--generation">
          <Typography shuku-edit-id="e-eabf248a-8be1-402c-8423-a175245c0be7" as="h2" variant="h3" tone="success">视觉生成</Typography>
          <div shuku-edit-id="e-09d35b7c-2364-4427-a4fd-2f29c52a07c1" className="vg-generation-page__direction">
            <Typography shuku-edit-id="e-277a5b1a-241e-41b3-a834-d0661101b754" as="span" variant="bodySmall" tone="main" className="vg-generation-page__endpoint">有限条件</Typography>
            <span shuku-edit-id="e-e3852cf2-c910-4a1a-b9ff-ae54ca9ec57b" className="vg-generation-page__arrow" aria-hidden="true">→</span>
            <Typography shuku-edit-id="e-fdde58e2-f107-47a3-bc5a-1516539be1ee" as="span" variant="bodySmall" tone="success" className="vg-generation-page__endpoint vg-generation-page__endpoint--generation">高维视觉图像</Typography>
          </div>
          <Typography shuku-edit-id="e-287bc8b9-7f0d-484c-af6c-1c15b8138476" variant="bodySmall" tone="muted">从提示词等有限信息中，生成一张合适但不唯一的图像。</Typography>
        </article>

      </section>
    </ContentBlock>
  );
}
