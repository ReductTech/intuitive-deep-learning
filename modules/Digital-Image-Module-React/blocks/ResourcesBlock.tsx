import { Callout, LessonFooter } from '../../shared/react';

const videos = [
  {
    title: '【硬核科普】全网最简洁易懂的 OLED 与 LCD 屏幕工作原理与优劣科普',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=200306152&bvid=BV1Wz411B7Tf&cid=178927590&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="OLED 与 LCD 屏幕工作原理"></iframe>',
  },
  {
    title: '什么是 RGB 和 CMYK？一个视频全搞懂',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=114703040775428&bvid=BV1K2Njz9EHH&cid=30560420849&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="RGB 和 CMYK"></iframe>',
  },
  {
    title: '纯干货 2 分钟搞懂：计算机眼中的图像是什么样的',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=360946842&bvid=BV1Q94y1B7Ze&cid=1198489854&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="计算机眼中的图像"></iframe>',
  },
];

export function ResourcesBlock() {
  return (
    <div className="di-resource-finish">
      <Callout
        className="di-resource-summary"
        tone="green"
        label="图像已经变成模型能读的形状"
        text="一张高 H、宽 W 的彩色图可以看成三个 H × W 矩阵；按 RGB 顺序叠在一起，就是 H × W × 3 图像张量。"
      />
      <LessonFooter
        className="di-react-footer"
        title="继续你的学习旅程"
        description="你可以返回课程目录，或在准备好后继续前往下一步。"
        back={{
          href: '/',
          label: '返回课程目录',
        }}
        next={{
          href: '/modules/manual-feature-classification-react',
          label: '学习下一课',
        }}
        videos={videos}
        videosLabel="延伸观看"
      />
    </div>
  );
}
