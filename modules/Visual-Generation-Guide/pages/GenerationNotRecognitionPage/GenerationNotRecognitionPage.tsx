import { type CSSProperties } from 'react';
import { ContentBlock, Typography } from '../../../shared/react';
import visualGenerationOverview from '../../assets/00visual-generation.svg';
import resultOne from '../../assets/00result-01.svg';
import resultTwo from '../../assets/00result-02.svg';
import resultThree from '../../assets/00result-03.svg';
import resultFour from '../../assets/00result-04.svg';
import './GenerationNotRecognitionPage.css';

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
    <ContentBlock
      headingLevel={1}
      className="vg-generation-page"
      title="视觉理解与视觉生成，学习方向正好相反"
      subtitle="典型的分类或识别任务把高维图像压缩为少量结果信息；生成任务则从有限条件中展开一张合理但不唯一的高维图像。"
    >
      <div
        className="vg-generation-page__visual"
        role="img"
        aria-label="视觉理解与视觉生成的对比。左侧把一张高维猫图片预测为低维类别 Cat；右侧根据一句有限的文字条件，生成四张不同但都符合条件的高维猫图片。"
      >
        <img className="vg-generation-page__source" src={visualGenerationOverview} alt="" aria-hidden="true" />
        <div
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
            <span
              className="vg-generation-page__result"
              key={`${result.x}-${result.y}`}
              style={{
                '--result-left': `${((result.x - resultStage.x) / resultStage.width) * 100}%`,
                '--result-top': `${((result.y - resultStage.y) / resultStage.height) * 100}%`,
                '--result-width': `${(result.width / resultStage.width) * 100}%`,
                '--result-height': `${(result.height / resultStage.height) * 100}%`,
              } as CSSProperties}
            >
              <img src={resultImages[index]} alt="" />
            </span>
          ))}
        </div>
      </div>

      <section className="vg-generation-page__insight" aria-label="视觉理解与视觉生成的信息方向">
        <article className="vg-generation-page__mapping vg-generation-page__mapping--understanding">
          <Typography as="h2" variant="h3" tone="accent">视觉理解</Typography>
          <div className="vg-generation-page__direction">
            <Typography as="span" variant="bodySmall" tone="main" className="vg-generation-page__endpoint">高维图像</Typography>
            <span className="vg-generation-page__arrow" aria-hidden="true">→</span>
            <Typography as="span" variant="bodySmall" tone="accent" className="vg-generation-page__endpoint vg-generation-page__endpoint--understanding">低维结果信息</Typography>
          </div>
          <Typography variant="bodySmall" tone="muted">从大量像素中提取类别、属性等少量结果信息。</Typography>
        </article>

        <article className="vg-generation-page__mapping vg-generation-page__mapping--generation">
          <Typography as="h2" variant="h3" tone="success">视觉生成</Typography>
          <div className="vg-generation-page__direction">
            <Typography as="span" variant="bodySmall" tone="main" className="vg-generation-page__endpoint">有限条件</Typography>
            <span className="vg-generation-page__arrow" aria-hidden="true">→</span>
            <Typography as="span" variant="bodySmall" tone="success" className="vg-generation-page__endpoint vg-generation-page__endpoint--generation">高维视觉图像</Typography>
          </div>
          <Typography variant="bodySmall" tone="muted">从提示词等有限信息中，生成一张合适但不唯一的图像。</Typography>
        </article>

        <div className="vg-generation-page__conclusion">
          <Typography as="strong" variant="body" tone="main">视觉理解压缩视觉信息；视觉生成展开视觉内容。</Typography>
        </div>
      </section>
    </ContentBlock>
  );
}
