import { LessonFooter } from '../../shared/react';

const videos = [
  {
    title: '从“卷积”、到“图像卷积操作”、再到“卷积神经网络”，“卷积”意义的3次改变',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=418492547&bvid=BV1VV411478E&cid=353587154&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="卷积的三次意义变化"></iframe>',
  },
  {
    title: '【官方双语】那么……什么是卷积？',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=391585555&bvid=BV1Vd4y1e7pj&cid=931763043&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="什么是卷积"></iframe>',
  },
  {
    title: '所有的卷积神经网络动画都是错的！除了这个动画',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=486552336&bvid=BV16N411y7cV&cid=1140750257&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="卷积神经网络动画"></iframe>',
  },

];

export function ResourcesBlock() {
  return (
    <div className="ck-resource-finish">

      <LessonFooter
        className="ck-react-footer"
        title="继续你的学习旅程"
        description="你可以返回课程目录，或在准备好后继续前往下一步。"
        back={{ href: 'http://127.0.0.1:59411/CourseMap/', label: '返回课程目录' }}
        next={{ href: '/modules/lenet5-cnn-lab-react', label: '学习下一课' }}
        videos={videos}
        videosLabel="延伸观看"
      />
    </div>
  );
}
