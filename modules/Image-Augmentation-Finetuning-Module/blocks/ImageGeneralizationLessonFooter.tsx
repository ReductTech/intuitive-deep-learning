import { LessonFooter } from '../../shared/react';

const videos = [
  {
    title: '李沐：数据增广（原理、代码与问答）',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&bvid=BV17y4y1g76q&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="李沐：数据增广"></iframe>',
  },
  {
    title: '李沐：数据增广 PyTorch 代码',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&bvid=BV17y4y1g76q&p=2" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="李沐：数据增广代码"></iframe>',
  },
  {
    title: '李沐：微调（原理、代码与问答）',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&bvid=BV1Sb4y1d7CR&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="李沐：微调"></iframe>',
  },
];

export function ImageGeneralizationLessonFooter() {
  return (
    <LessonFooter
      className="vgen-footer"
      title="你已经能为小数据图像分类设计训练策略"
      description="先检查增广是否保持标签，再用验证集寻找合理强度；需要迁移时，先复用预训练特征，再根据数据量和领域差异决定冻结、微调或重新训练。"
      back={{ href: '/', label: '返回课程目录' }}
      next={{ href: '/modules/object-detection-foundations', label: '下一课：目标检测基础' }}
      videos={videos}
      videosLabel="延伸观看 · D2L 配套课程"
    />
  );
}
