import { ContentBlock, Typography, moduleAssetUrl } from '../../../shared/react';
import outline from '../../outlines.json';
import './FlexibleTeachingModesPage.css';

const illustration = (name: string) => moduleAssetUrl(
  outline.moduleIdentity.id,
  `images/teaching-mode/${name}-cartoon-v1.png`,
);

export function FlexibleTeachingModesPage() {
  return <ContentBlock
    title="推荐授课模式"
    subtitle="上半节教师讲授，下半节小组共创与讲解"
    headingLevel={1}
    className="aipe-teaching-mode-page"
    bodyClassName="aipe-teaching-mode-body"
  >
    <section className="aipe-teaching-half aipe-teaching-half--lecture" aria-labelledby="aipe-teaching-lecture-title">
      <header className="aipe-teaching-half-heading">
        <Typography as="p" variant="bodySmall" tone="inherit" className="aipe-teaching-half-label">上半节</Typography>
        <Typography as="h2" id="aipe-teaching-lecture-title" variant="h3" tone="accent">教师借助交互直觉讲授知识</Typography>
      </header>
      <figure className="aipe-teaching-half-illustration">
        <img src={illustration('interactive-classroom')}
          alt="卡通课堂：教师指向交互式知识呈现中的概念关系图，学生面向屏幕听讲。"
          draggable={false}/>
      </figure>
      <div className="aipe-teaching-half-summary">
        <Typography as="p" variant="body" tone="accent">讲清知识点与关键方法</Typography>
        <Typography as="p" variant="bodySmall" tone="muted">结合交互演示，帮助学生理解</Typography>
      </div>
    </section>
    <section className="aipe-teaching-half aipe-teaching-half--cocreation" aria-labelledby="aipe-teaching-cocreation-title">
      <header className="aipe-teaching-half-heading">
        <Typography as="p" variant="bodySmall" tone="inherit" className="aipe-teaching-half-label">下半节</Typography>
        <Typography as="h2" id="aipe-teaching-cocreation-title" variant="h3" tone="accent">小组共创，代表讲解，知识进化</Typography>
      </header>
      <figure className="aipe-teaching-half-illustration">
        <img src={illustration('group-cocreation')}
          alt="卡通课堂：学生小组共同讨论和改进交互式知识呈现，随后选出代表向全班讲解，教师在旁倾听。"
          draggable={false}/>
      </figure>
      <div className="aipe-teaching-half-summary">
        <Typography as="p" variant="bodySmall" tone="accent">理解知识 → 分组共创 → 代表讲解 → 知识进化</Typography>
        <Typography as="p" variant="bodySmall" tone="muted">把自己的理解讲清楚，优秀创作更新下一代课程体系</Typography>
      </div>
    </section>
  </ContentBlock>;
}

