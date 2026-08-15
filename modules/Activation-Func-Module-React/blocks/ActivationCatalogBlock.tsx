import { LessonFooter, LessonStage } from '../../shared/react';
import { ActivationFunctionPlot } from '../components/ActivationCharts';

const videos = [
  {
    title: '[5分钟深度学习] #03 激活函数',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=598297960&bvid=BV1qB4y1e7GJ&cid=769526570&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="5 分钟深度学习：激活函数"></iframe>',
  },
  {
    title: '【硬核】从最底层讲解，全网最详细激活函数教程！没有之一！',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=115774953887638&bvid=BV1NXBLB2EE2&cid=34956052957&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="激活函数详细教程"></iframe>',
  },
  {
    title: '激活函数：为神经网络注入灵魂',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=116584639108797&bvid=BV1RQL36cELq&cid=38383128217&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="激活函数：为神经网络注入灵魂"></iframe>',
  },
];

export function ActivationCatalogBlock() {
  return (
    <div className="af-react-summary">
      <LessonStage
        className="af-react-activations"
        title="认识这些被广泛使用的激活函数"
        variant="flat"
      >
        <div className="af-react-activation-grid">
          <article className="af-react-activation-card">
            <ActivationFunctionPlot type="relu" />
            <h3>ReLU</h3>
            <code>max(0, x)</code>
            <p>简单、计算快，负数截断为 0，正数保持线性，是理解折点最直接的入口。</p>
          </article>
          <article className="af-react-activation-card">
            <ActivationFunctionPlot type="sigmoid" />
            <h3>Sigmoid</h3>
            <code>1 / (1 + e^-x)</code>
            <p>把数值压到 0 到 1 之间，常用于二分类输出概率。</p>
          </article>
          <article className="af-react-activation-card">
            <ActivationFunctionPlot type="silu" />
            <h3>SiLU / Swish</h3>
            <code>x · sigmoid(x)</code>
            <p>现代网络里常见的平滑 ReLU 风格激活，公式简单，又保留了非线性的柔和过渡。</p>
          </article>
        </div>
      </LessonStage>

      <LessonFooter
        title="继续你的学习旅程"
        description="你可以返回课程目录，或在准备好后继续前往下一步。"
        back={{ href: '/', label: '返回课程目录' }}
        next={{ href: '/modules/mlp-playground-react', label: '学习下一课' }}
        videos={videos}
        videosLabel="延伸观看"
      />
    </div>
  );
}
