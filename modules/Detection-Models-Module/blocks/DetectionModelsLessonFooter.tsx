import { LessonFooter } from '../../shared/react';

const videos = [
  {
    title: '李沐：目标检测数据集',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&bvid=BV1Lh411Y7LX&p=3" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="李沐：目标检测数据集"></iframe>',
  },
  {
    title: '李沐：R-CNN、SSD 与 YOLO',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&bvid=BV1Db4y1C71g&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="李沐：R-CNN、SSD 与 YOLO"></iframe>',
  },
  {
    title: '李沐：SSD 多尺度锚框',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&bvid=BV1ZX4y1c7Sw&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="李沐：SSD 多尺度锚框"></iframe>',
  },
  {
    title: '李沐：SSD 完整实现',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&bvid=BV1ZX4y1c7Sw&p=2" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="李沐：SSD 完整实现"></iframe>',
  },
];

export function DetectionModelsLessonFooter() {
  return (
    <LessonFooter
      className="dmm-footer"
      title="你已经能从标签格式走到检测器架构选择"
      description={<>检测数据为每个目标保存类别和归一化边界框；SSD 直接在多尺度特征图上预测；R-CNN 系列通过共享特征、学习区域提议和增加掩码分支持续演进。<span className="dmm-source-links">对应阅读：<a href="https://zh-v2.d2l.ai/chapter_computer-vision/object-detection-dataset.html" target="_blank" rel="noreferrer">目标检测数据集</a> · <a href="https://zh-v2.d2l.ai/chapter_computer-vision/ssd.html" target="_blank" rel="noreferrer">SSD</a> · <a href="https://zh-v2.d2l.ai/chapter_computer-vision/rcnn.html" target="_blank" rel="noreferrer">R-CNN 系列</a></span></>}
      back={{ href: '/modules/object-detection-foundations', label: '上一课：目标检测基础' }}
      next={{ href: '/modules/pixel-vision', label: '下一课：语义分割与像素级预测' }}
      videos={videos}
      videosLabel="延伸观看 · D2L 配套课程"
    />
  );
}
