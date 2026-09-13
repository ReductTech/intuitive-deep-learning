import { ContentBlock, Typography } from '../../../shared/react';
import appleImage from '../../assets/newton-apple-tree.jpg';
import galtonImage from '../../assets/galton.jpg';
import './UncertaintyOpeningPage.css';

const childHeights = [42, 51, 58, 48, 66, 55, 72, 61, 78];

export function UncertaintyOpeningPage() {
  return (
    <ContentBlock
      headingLevel={1}
      className="lr-opening"
      title="有些规律像定律，有些规律只表现为趋势"
      subtitle="先不急着寻找公式。先看一看：世界是不是总会给出同一个答案。"
    >
      <div className="lr-opening__panels">
        <section className="lr-opening__panel lr-opening__panel--certain" aria-labelledby="lr-certain-title">
          <div className="lr-opening__panel-heading">
            <Typography as="span" variant="bodySmall" tone="warning" className="lr-opening__eyebrow">一种世界</Typography>
            <Typography as="h2" variant="h2" tone="accent" id="lr-certain-title">确定性</Typography>
            <Typography variant="body" tone="muted">条件相同，结果稳定地重复出现。</Typography>
          </div>

          <figure className="lr-opening__media">
            <img src={appleImage} alt="一颗苹果悬在树枝与果实之间，作为苹果落地的占位画面" />
            <div className="lr-opening__media-wash" />
            <div className="lr-opening__fall-path" aria-hidden="true">
              <span className="lr-opening__fall-dot" />
              <span className="lr-opening__fall-line" />
              <span className="lr-opening__fall-arrow">↓</span>
            </div>
            <figcaption>
              <Typography variant="bodySmall" tone="inherit">同样的起点</Typography>
              <Typography as="strong" variant="h3" tone="inherit">苹果 → 地面</Typography>
            </figcaption>
          </figure>
          <div className="lr-opening__statement">
            <Typography as="span" variant="bodySmall" tone="muted">规律像一条清楚的规则</Typography>
            <Typography as="p" variant="h3" tone="accent">一条路径，一个结果</Typography>
          </div>
        </section>

        <section className="lr-opening__panel lr-opening__panel--uncertain" aria-labelledby="lr-uncertain-title">
          <div className="lr-opening__panel-heading">
            <Typography as="span" variant="bodySmall" tone="warning" className="lr-opening__eyebrow">另一种世界</Typography>
            <Typography as="h2" variant="h2" tone="accent" id="lr-uncertain-title">不确定性</Typography>
            <Typography variant="body" tone="muted">有联系，但相同的条件不会保证相同的结果。</Typography>
          </div>

          <figure className="lr-opening__media lr-opening__media--galton">
            <img src={galtonImage} alt="弗朗西斯·高尔顿的历史肖像，作为身高研究的占位画面" />
            <div className="lr-opening__media-wash" />
            <div className="lr-opening__height-study" aria-hidden="true">
              <div className="lr-opening__height-family">
                <span className="lr-opening__person lr-opening__person--parent lr-opening__person--tall" />
                <span className="lr-opening__person lr-opening__person--parent lr-opening__person--medium" />
                <span className="lr-opening__person lr-opening__person--child lr-opening__person--short" />
                <span className="lr-opening__person lr-opening__person--child lr-opening__person--medium" />
                <span className="lr-opening__person lr-opening__person--child lr-opening__person--tall" />
              </div>
              <div className="lr-opening__height-bars">
                {childHeights.map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}
              </div>
            </div>
            <figcaption>
              <Typography variant="bodySmall" tone="inherit">高尔顿观察到</Typography>
              <Typography as="strong" variant="h3" tone="inherit">父母身高 → 子女身高</Typography>
            </figcaption>
          </figure>
          <div className="lr-opening__statement">
            <Typography as="span" variant="bodySmall" tone="muted">规律藏在一群结果里</Typography>
            <Typography as="p" variant="h3" tone="accent">一片范围，多种可能</Typography>
          </div>
        </section>
      </div>

      <div className="lr-opening__closing">
        <Typography as="span" variant="bodySmall" tone="warning">重要的转变</Typography>
        <Typography as="p" variant="h2" tone="accent">科学不只寻找确定的答案，也寻找不确定结果中的稳定趋势。</Typography>
      </div>
    </ContentBlock>
  );
}
