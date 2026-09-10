import { ContentBlock, LessonFooter } from '../../shared/react';
import { NeuronModelViewer } from '../components/NeuronModelViewer';

const videos = [
  {
    title: '什么是神经元，它们是如何工作的？',
    embed: '<iframe title="什么是神经元，它们是如何工作的？" src="//player.bilibili.com/player.html?isOutside=true&aid=480613389&bvid=BV1FT41127Qg&cid=972217281&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>',
  },
  {
    title: '神经网络：从一个神经元到万能逼近',
    embed: '<iframe title="神经网络：从一个神经元到万能逼近" src="//player.bilibili.com/player.html?isOutside=true&aid=116418058131506&bvid=BV1BPdqB6E9H&cid=37571920704&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>',
  },
];

export function NeuronCompletionBlock() {
  return (
    <ContentBlock
      className="ng-completion-stage"
      title="你已经搭出了一个人工神经元"
      subtitle="从生物神经元到人工神经元，真正被继承的不是结构，而是一种处理信息的方式。"
    >
      <NeuronModelViewer />
    </ContentBlock>
  );
}

export function NeuronLessonFooter() {
  return (
    <LessonFooter
      developerIds={['ssocean', 'zhasion', 'zero223', 'GGbondas', 'dengyuhai','ShuyangHou',]}
      className="ng-guide-footer"
      title="推荐资源"
      description="继续认识真实神经元，再进入激活函数，观察神经元如何获得非线性表达能力。"
      back={{ href: '/', label: '返回课程目录' }}
      videos={videos}
      videosLabel="延伸观看"
    />
  );
}
