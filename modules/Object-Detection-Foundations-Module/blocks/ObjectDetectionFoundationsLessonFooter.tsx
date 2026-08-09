import { LessonFooter } from '../../shared/react';

const videos = [
  {
    title: '李沐：物体检测',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&bvid=BV1Lh411Y7LX&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="李沐：物体检测"></iframe>',
  },
  {
    title: '李沐：边界框代码实现',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&bvid=BV1Lh411Y7LX&p=2" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="李沐：边界框代码实现"></iframe>',
  },
  {
    title: '李沐：锚框、IoU 与 NMS',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&bvid=BV1aB4y1K7za&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="李沐：锚框"></iframe>',
  },
  {
    title: '李沐：锚框代码实现',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&bvid=BV1aB4y1K7za&p=2" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="李沐：锚框代码实现"></iframe>',
  },
];

export function ObjectDetectionFoundationsLessonFooter() {
  return (
    <LessonFooter
      className="odf-footer"
      title="你已经能解释候选框从产生到筛选的完整链路"
      description={<>用边界框表示位置，用 IoU 衡量匹配质量，用类别与偏移量训练锚框，用 NMS 清理重复预测，再让不同尺度的特征图负责不同大小的目标。<span className="odf-source-links">对应阅读：<a href="https://zh-v2.d2l.ai/chapter_computer-vision/bounding-box.html" target="_blank" rel="noreferrer">边界框</a> · <a href="https://zh-v2.d2l.ai/chapter_computer-vision/anchor.html" target="_blank" rel="noreferrer">锚框</a> · <a href="https://zh-v2.d2l.ai/chapter_computer-vision/multiscale-object-detection.html" target="_blank" rel="noreferrer">多尺度目标检测</a></span></>}
      back={{ href: '/modules/image-augmentation-finetuning', label: '上一课：图像增广与微调' }}
      next={{ href: '/modules/detection-models', label: '下一课：检测数据与模型' }}
      videos={videos}
      videosLabel="延伸观看 · D2L 配套课程"
    />
  );
}
