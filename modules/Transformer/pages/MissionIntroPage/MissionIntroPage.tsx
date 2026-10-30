import { transformerAsset } from '../../assetUrls';
import { Button, Typography } from '../../../shared/react';
import { LessonPageFrame } from '../../components/LessonPageFrame';
import './MissionIntroPage.overview.css';
interface MissionIntroPageProps {
    onComplete: () => void;
}
const translation = '我爱深度学习。';
const networkLayers = [
    { x: 18, ys: [24, 46, 68, 90, 112] },
    { x: 94, ys: [12, 30, 48, 66, 84, 102, 120] },
    { x: 170, ys: [24, 46, 68, 90, 112] },
];
function NeuralNetworkGlyph() {
    return (<svg className="tr-overview-network" viewBox="0 0 188 132" role="img" aria-label="由多层节点相互连接组成的神经网络示意图">
      {networkLayers.slice(0, -1).flatMap((layer, layerIndex) => layer.ys.flatMap((y, nodeIndex) => networkLayers[layerIndex + 1].ys.map((nextY, nextIndex) => (<line x1={layer.x} y1={y} x2={networkLayers[layerIndex + 1].x} y2={nextY} key={`${layerIndex}-${nodeIndex}-${nextIndex}`}/>))))}
      {networkLayers.flatMap((layer, layerIndex) => layer.ys.map((y, nodeIndex) => <circle cx={layer.x} cy={y} r="5.8" key={`${layerIndex}-${nodeIndex}`}/>))}
    </svg>);
}
export function MissionIntroPage({ onComplete }: MissionIntroPageProps) {
    const started = true;
    return (<section className="tr-intro-page" aria-labelledby="tr-intro-title">
      <header className="tr-lesson-header tr-intro-page__header">
        <Typography id="tr-intro-title" as="h1" variant="display" tone="accent">Transformer 怎样完成翻译？</Typography>
        <Typography variant="subtitle" tone="muted">沿箭头从左向右看：原文经过哪些步骤，变成译文？</Typography>
      </header>

      <div className="tr-intro-page__main">
        <section className="tr-intro-story" aria-label="翻译任务的信息流">
          <figure className="tr-intro-character tr-intro-character--human">
            <figcaption className="tr-intro-chat"><span>英文原文</span><strong>I love deep learning.</strong></figcaption>
            <img src={transformerAsset("01_翻译引入/原文输入.png")} alt="学生递出英文原文"/>
          </figure>

          <div className="tr-intro-pipeline" aria-label="编码器、上下文表示、解码器依次连接">
            <div className="tr-intro-module tr-intro-module--encoder">
              <strong>编码器</strong>
              <NeuralNetworkGlyph />
              <span>理解英文原文</span>
            </div>
            <span className="tr-intro-connector" aria-hidden="true"/>
            <div className="tr-intro-representation" aria-label="编码器输出的上下文表示矩阵，形状为 n 乘 512">
              <strong>上下文表示</strong>
              <div className="tr-intro-matrix" aria-hidden="true">
                {Array.from({ length: 5 }, (_, row) => <i key={row}>{Array.from({ length: 8 }, (_, column) => <b key={column} style={{ opacity: .45 + ((row * 5 + column * 3) % 6) * .09 }}/>)}</i>)}
              </div>
              <span>带有上下文的原文信息</span>
            </div>
            <span className="tr-intro-connector" aria-hidden="true"/>
            <div className="tr-intro-module tr-intro-module--decoder">
              <strong>解码器</strong>
              <NeuralNetworkGlyph />
              <span>生成中文译文</span>
            </div>
          </div>

          <figure className="tr-intro-character tr-intro-character--robot">
            <figcaption className={'tr-intro-chat' + (started ? ' is-generating' : '')} aria-live="polite" aria-label="机器人生成的译文">
              <span>中文译文</span>
              <strong>{translation}</strong>
            </figcaption>
            <img src={transformerAsset("01_翻译引入/译文生成.png")} alt="准备生成译文的 Transformer 机器人"/>
          </figure>
        </section>

        <section className="tr-intro-roles" aria-label="编码器和解码器的职责">
          <div><h2>编码器：理解原文</h2><p>读入整句，形成带有上下文信息的表示。</p></div>
          <div><h2>解码器：生成译文</h2><p>结合原文信息和已生成的词，预测下一个词。</p></div>
        </section>
      </div>

      <footer className="tr-intro-footer">
        <Button className="tr-intro-next" variant="primary" onClick={onComplete}>从编码器的输入开始 →</Button>
      </footer>
    </section>);
}
export function MissionIntroPageFrame({ onComplete }: MissionIntroPageProps) {
    return <LessonPageFrame><MissionIntroPage onComplete={onComplete}/></LessonPageFrame>;
}
