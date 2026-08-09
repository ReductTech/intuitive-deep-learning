import { Callout, LessonFooter } from '../../shared/react';

const videos = [{
  title: '2.4 特征工程【斯坦福 21 秋季：实用机器学习中文版】',
  embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=976027811&bvid=BV1t44y1x7Hw&cid=423753460&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="特征工程"></iframe>',
}];

export function ResourcesBlock() {
  return <div className="hdf-resource-finish"><Callout tone="green" label="人工特征的价值与边界" text="九宫格计数把 28 × 28 像素压缩成 9 个可解释数字，但它也会丢失笔画在格子内部的空间关系。卷积核将学习怎样自动提取更局部的图像特征。" /><LessonFooter className="hdf-react-footer" title="继续你的学习旅程" description="你可以返回课程目录，或在准备好后继续前往下一步。" back={{ href: '/', label: '返回课程目录' }} next={{ href: '/modules/convolution-kernel-intro-react', label: '学习下一课' }} videos={videos} videosLabel="延伸观看" /></div>;
}
