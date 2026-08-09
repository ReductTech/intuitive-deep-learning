import { ContentBlock, NoticeStrip } from '../../shared/react';

const styleCode = ['for X in generated_image:', '  Y_hat = net(X)', '  loss = content_loss(Y_hat)', '       + style_loss(gram(Y_hat))', '       + tv_loss(X)', '  update(X)'].join('\n');
const competitionCode = ['best = tune(train, valid)', 'model = train(train_valid, best)', 'prob = predict(model, test)', 'submission = align_ids(prob)', 'submission.to_csv("submission.csv")'].join('\n');

export function VisionPracticeBridgeBlock() {
  return (
    <ContentBlock className="vsc-block vsc-bridge-block" title="把概念落到代码：两个任务都遵循“定义目标—验证—定稿”" subtitle="风格迁移优化图像像素；竞赛训练优化模型参数。它们的优化对象不同，但都需要清楚的目标和独立检查。">
      <div className="vsc-code-pair">
        <section><header><span>STYLE</span><strong>更新合成图像</strong></header><pre><code>{styleCode}</code></pre></section>
        <section><header><span>KAGGLE</span><strong>搜索后重新训练</strong></header><pre><code>{competitionCode}</code></pre></section>
      </div>
      <NoticeStrip tone="green" lead="提交前检查：">类别列顺序、测试样本 ID 顺序和概率格式都要与竞赛模板完全一致。</NoticeStrip>
    </ContentBlock>
  );
}
