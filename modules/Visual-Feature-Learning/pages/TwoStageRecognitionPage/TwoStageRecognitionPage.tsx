import { ContentBlock, MathFormulaBlock, MathFormulaStatic, moduleAssetUrl, Typography } from '../../../shared/react';
import './TwoStageRecognitionPage.css';

const imageUrl = moduleAssetUrl('80396753-7fc8-4f55-9188-bddbdb828169', 'mnist/3/60051.png');

function Arrow() {
  return <span className="vfl-limit-arrow" aria-hidden="true">→</span>;
}

export function TwoStageRecognitionPage() {
  return <ContentBlock
    className="vfl-limit-page"
    headingLevel={1}
    title="人工设计特征的局限"
    subtitle="识别流程由输入、特征提取器（backbone）和分类器（head）组成。"
  >
    <div className="vfl-limit-flow">
      <section className="vfl-limit-stage" aria-label="输入图像">
        <div className="vfl-limit-stage-head"><Typography as="h2" variant="h3" tone="accent">输入</Typography></div>
        <div className="vfl-limit-image-wrap"><img src={imageUrl} alt="真实 MNIST 手写数字 3" className="vfl-limit-digit" /></div>
        <Typography as="p" variant="body" tone="muted" className="vfl-limit-stage-caption">真实手写数字图像</Typography>
      </section>

      <Arrow />

      <section className="vfl-limit-stage vfl-limit-backbone" aria-label="固定的特征提取器 backbone">
        <div className="vfl-limit-stage-head"><Typography as="h2" variant="h3" tone="accent">特征提取器 · Backbone</Typography></div>
        <div className="vfl-limit-backbone-main">
          <div className="vfl-limit-kernel-block">
            <Typography as="h3" variant="body" tone="accent">固定卷积核</Typography>
            <MathFormulaBlock className="vfl-limit-kernel" ariaLabel="检测局部竖边的固定卷积核：三行均为负一、零、一">
              <MathFormulaStatic latex={'\\begin{bmatrix}-1&0&1\\\\-1&0&1\\\\-1&0&1\\end{bmatrix}'} />
            </MathFormulaBlock>
          </div>
          <Arrow />
          <div className="vfl-limit-feature-block">
            <Typography as="h3" variant="body" tone="accent">竖边响应示意</Typography>
            <div className="vfl-limit-edge-pattern" aria-hidden="true">
              <span /><span /><span /><span /><span /><span />
            </div>
          </div>
        </div>
        <div className="vfl-limit-status vfl-limit-status-fixed"><Typography as="p" variant="body" tone="warning">只提取预设模式 · 训练时不改变</Typography></div>
      </section>

      <Arrow />

      <section className="vfl-limit-stage" aria-label="可训练的分类器 head">
        <div className="vfl-limit-stage-head"><Typography as="h2" variant="h3" tone="accent">分类器 · Head</Typography></div>
        <div className="vfl-limit-classifier">
          <Typography as="p" variant="body" tone="accent">输入已提取的特征</Typography>
          <span className="vfl-limit-classifier-arrow" aria-hidden="true">↓</span>
          <Typography as="p" variant="body" tone="accent">学习特征与类别的关系</Typography>
          <span className="vfl-limit-classifier-arrow" aria-hidden="true">↓</span>
          <Typography as="p" variant="body" tone="accent">输出数字类别 0–9</Typography>
        </div>
        <div className="vfl-limit-status"><Typography as="p" variant="body" tone="accent">分类器参数可以训练</Typography></div>
      </section>
    </div>

    <div className="vfl-limit-takeaway">
      <Typography as="strong" variant="h3" tone="warning">固定卷积核的局限</Typography>
      <Typography as="p" variant="body" tone="accent">输入图像越复杂，越难预先设计充分的卷积特征；分类器只能利用特征提取器保留的信息。</Typography>
    </div>
  </ContentBlock>;
}
