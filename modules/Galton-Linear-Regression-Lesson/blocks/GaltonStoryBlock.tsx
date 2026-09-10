import { ContentBlock, Typography } from '../../shared/react';
import { historicalNote } from '../data/galtonStory';

export function GaltonStoryBlock() {
  return (
    <ContentBlock
      className="grl-block grl-story"
      title="一百多年前，人们怎样把“像父母”变成一个可测量的问题？"
      subtitle="高尔顿把许多家庭的身高摆进同一张表，寻找父母与成年子女之间的稳定关系。"
    >
      <div className="grl-story__composition">
        <section className="grl-archive-sheet" aria-label="1886 年论文档案索引">
          <Typography as="span" variant="bodySmall" tone="accent">ARCHIVE INDEX · {historicalNote.year}</Typography>
          <Typography as="h3" variant="h1">“Regression” 最初讲的是身高</Typography>
          <Typography variant="body">
            极高父母的孩子通常仍较高，却往往更接近人群平均值；极矮父母的孩子也呈现相反方向的靠近。
          </Typography>
          <div className="grl-height-record" aria-hidden="true">
            <span className="grl-height-record__ruler" />
            <Typography as="span" variant="bodySmall" className="grl-height-record__person is-parent">父母</Typography>
            <span className="grl-height-record__arrow">→</span>
            <Typography as="span" variant="bodySmall" className="grl-height-record__person is-child">子女</Typography>
            <Typography as="span" variant="bodySmall" className="grl-height-record__mean">平均身高</Typography>
          </div>
          <Typography variant="bodySmall" tone="muted">
            原论文：{historicalNote.paper}。本课只借用其统计问题；高尔顿的优生学主张不应与统计贡献混为一谈。
          </Typography>
        </section>

        <section className="grl-story__question">
          <Typography as="span" variant="bodySmall" tone="muted">今天重做这次推理</Typography>
          <Typography as="h3" variant="display">如果只准用一条直线，怎样预测孩子的身高？</Typography>
          <Typography variant="body" tone="muted">先看点，再写线；先看错多少，再给“错”一个总分。</Typography>
        </section>
      </div>
      <Typography variant="bodySmall" tone="muted" className="grl-source-note">
        历史事实来源：Galton（1886）与 UCL Galton Papers；图形与身高样本为教学重绘。
      </Typography>
    </ContentBlock>
  );
}
