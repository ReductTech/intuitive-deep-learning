import { ContentBlock, LessonFooter, Typography } from '../../../shared/react';
import '../ck-pages.css';
import './ResourcesPage.css';

const VIDEOS = [
  {
    title: '从「卷积」到「图像卷积操作」，再到「卷积神经网络」',
    embed: '<iframe title="从卷积到卷积神经网络" src="//player.bilibili.com/player.html?isOutside=true&aid=418492547&bvid=BV1VV411478E&cid=353587154&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>',
  },
  {
    title: '【官方双语】那么……什么是卷积？',
    embed: '<iframe title="那么……什么是卷积？" src="//player.bilibili.com/player.html?isOutside=true&aid=391585555&bvid=BV1Vd4y1e7pj&cid=931763043&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>',
  },
  {
    title: '所有的卷积神经网络动画都是错的！除了这个动画',
    embed: '<iframe title="所有的卷积神经网络动画都是错的" src="//player.bilibili.com/player.html?isOutside=true&aid=486552336&bvid=BV16N411y7cV&cid=1140750257&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>',
  },
];

const RECAP: readonly string[] = [
  '棋盘、手写数字，在程序里都是数字表格；「1」表示某个位置上有我们要找的东西。',
  '卷积核是一小块权重，它在图上滑动，每个位置做一次「按位相乘再相加」，得到一个响应值。',
  '所有位置的响应拼起来就是特征图；核的排列决定它突出什么方向和形状。',
  '整张图共用同一个核，这正是卷积比全连接更省参数的原因。',
];

export interface ResourcesPageProps {
  /** 收尾页没有需要完成的交互，保留回调接口以便课程流程统一。 */
  onComplete?: () => void;
}

export function ResourcesPage(_props: ResourcesPageProps) {
  return (
    <ContentBlock
      headingLevel={1}
      className="ck-page ck-page--resources"
      title="你已经走完了一次完整的卷积"
      subtitle="从一局五子棋到一张手写数字，用到的其实是同一件事：一个固定的小矩阵，在整张数字表格上重复做同样的计算。"
    >
      <div className="ck-resources-layout">
        <section className="ck-resources-recap" aria-label="本次课回顾">
          <Typography as="h2" variant="h3" tone="accent">一句话回顾</Typography>
          <ul className="ck-points">
            {RECAP.map((point) => (
              <Typography as="li" key={point} variant="bodySmall" tone="muted">{point}</Typography>
            ))}
          </ul>
        </section>
        <LessonFooter
          className="ck-guide-footer"
          title="推荐资源"
          eyebrow="本节完成"
          description="继续观看与卷积直接相关的视频。"
          videos={VIDEOS}
          videosLabel="延伸观看"
          back={{ href: '/', label: '返回课程目录' }}
        />
      </div>
    </ContentBlock>
  );
}
