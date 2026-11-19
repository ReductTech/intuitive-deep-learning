import { transformerAsset } from '../../assetUrls';
import { Button, Typography } from "@shuku/course-style/react";
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
    return (<svg shuku-edit-id="e-091c7c18-dbea-4c2d-8874-9fff66f499a9" className="tr-overview-network" viewBox="0 0 188 132" role="img" aria-label="由多层节点相互连接组成的神经网络示意图">
      {networkLayers.slice(0, -1).flatMap((layer, layerIndex) => layer.ys.flatMap((y, nodeIndex) => networkLayers[layerIndex + 1].ys.map((nextY, nextIndex) => (<line shuku-edit-id="e-266ad7a2-3167-45d9-8ad2-4c773a23de71" x1={layer.x} y1={y} x2={networkLayers[layerIndex + 1].x} y2={nextY} key={`${layerIndex}-${nodeIndex}-${nextIndex}`}/>))))}
      {networkLayers.flatMap((layer, layerIndex) => layer.ys.map((y, nodeIndex) => <circle shuku-edit-id="e-e295a77f-6f8f-4f84-9250-bddafe1f5df0" cx={layer.x} cy={y} r="5.8" key={`${layerIndex}-${nodeIndex}`}/>))}
    </svg>);
}
export function MissionIntroPage({ onComplete }: MissionIntroPageProps) {
    const started = true;
    return (<section shuku-edit-id="e-88b2a735-b86c-427f-9636-554471cb88a2" className="tr-intro-page" aria-labelledby="tr-intro-title">
      <header shuku-edit-id="e-3cea7766-134a-4c95-9bfb-23bf38b3c47f" className="tr-lesson-header tr-intro-page__header">
        <Typography shuku-edit-id="e-618f0c1c-9f5f-41f4-af5a-eff300504c00" id="tr-intro-title" as="h1" variant="display" tone="accent">Transformer 怎样完成翻译？</Typography>
        <Typography shuku-edit-id="e-2244ac2f-a2a4-44eb-9d3f-f930a1b225f1" variant="subtitle" tone="muted">沿箭头从左向右看：原文经过哪些步骤，变成译文？</Typography>
      </header>

      <div shuku-edit-id="e-f1a1392b-157e-4ffe-9f78-ed22d4b2af56" className="tr-intro-page__main">
        <section shuku-edit-id="e-cdb022d5-7a4e-46fb-b29f-5907b1c02bff" className="tr-intro-story" aria-label="翻译任务的信息流">
          <figure shuku-edit-id="e-5d837eeb-4a8f-4262-a1c6-3b2dd930a878" className="tr-intro-character tr-intro-character--human">
            <figcaption shuku-edit-id="e-1a206d86-fbf9-4c8d-8a51-015d478c329a" className="tr-intro-chat"><span shuku-edit-id="e-1d3bc164-002c-4bd2-9e95-7cec510fb7fe">英文原文</span><strong shuku-edit-id="e-94080932-0ff3-40d8-ad4c-8d92761a712a">I love deep learning.</strong></figcaption>
            <img shuku-edit-id="e-84eac9aa-cb5d-4b5a-9848-7ba303ae2e82" src={transformerAsset("01_翻译引入/原文输入.webp")} alt="学生递出英文原文"/>
          </figure>

          <div shuku-edit-id="e-af063396-8caa-4c91-a415-b81acc994f33" className="tr-intro-pipeline" aria-label="编码器、上下文表示、解码器依次连接">
            <div shuku-edit-id="e-6f080de2-fbfd-44fd-aab6-41a31d500c8e" className="tr-intro-module tr-intro-module--encoder">
              <strong shuku-edit-id="e-1c67a6ea-6f0c-4a48-82c2-069a4b9b2e5f">编码器</strong>
              <NeuralNetworkGlyph />
              <span shuku-edit-id="e-b59d84fd-7cc9-4e33-a0cd-0d0861369c87">理解英文原文</span>
            </div>
            <span shuku-edit-id="e-e47ede5a-d018-4019-8348-27e7963968f9" className="tr-intro-connector" aria-hidden="true"/>
            <div shuku-edit-id="e-16ca6827-2926-4522-84ab-e7702ef7ccfa" className="tr-intro-representation" aria-label="编码器输出的上下文表示矩阵，形状为 n 乘 512">
              <strong shuku-edit-id="e-069a2511-7264-48b8-a042-4531b0962418">上下文表示</strong>
              <div shuku-edit-id="e-ea872076-77e5-4b79-8a7b-a0e03fdd8451" className="tr-intro-matrix" aria-hidden="true">
                {Array.from({ length: 5 }, (_, row) => <i shuku-edit-id="e-5fcded4f-d862-4390-b21a-89c5787a24cf" key={row}>{Array.from({ length: 8 }, (_, column) => <b shuku-edit-id="e-55e5cd17-2d6c-4e2c-bfe2-6ff40c19e626" key={column} style={{ opacity: .45 + ((row * 5 + column * 3) % 6) * .09 }}/>)}</i>)}
              </div>
              <span shuku-edit-id="e-6cd8691e-6061-4250-9e32-17f623648cef">带有上下文的原文信息</span>
            </div>
            <span shuku-edit-id="e-05d02a5b-be35-4e31-bed9-07badd162076" className="tr-intro-connector" aria-hidden="true"/>
            <div shuku-edit-id="e-9a4555bb-183d-467a-9748-7aa96be102db" className="tr-intro-module tr-intro-module--decoder">
              <strong shuku-edit-id="e-9cd91263-cec1-44b1-bde9-9972bc7f2729">解码器</strong>
              <NeuralNetworkGlyph />
              <span shuku-edit-id="e-c5f22aa1-2104-4e79-8ba0-8ecaf94d54d8">生成中文译文</span>
            </div>
          </div>

          <figure shuku-edit-id="e-22066e7f-1778-4a1b-a119-f5143db8777c" className="tr-intro-character tr-intro-character--robot">
            <figcaption shuku-edit-id="e-af3e539a-89c9-4c06-920a-bf45c51dcf86" className={'tr-intro-chat' + (started ? ' is-generating' : '')} aria-live="polite" aria-label="机器人生成的译文">
              <span shuku-edit-id="e-b702eb22-e244-4645-a664-852af999d486">中文译文</span>
              <strong shuku-edit-id="e-45ea0e19-3c05-4446-86e4-2b6ee6efd9e0">{translation}</strong>
            </figcaption>
            <img shuku-edit-id="e-6a6ed626-70d1-4570-95e2-deed16e469d6" src={transformerAsset("01_翻译引入/译文生成.webp")} alt="准备生成译文的 Transformer 机器人"/>
          </figure>
        </section>

        <section shuku-edit-id="e-0ff60e61-1e1f-410d-9d43-02792d11342e" className="tr-intro-roles" aria-label="编码器和解码器的职责">
          <div shuku-edit-id="e-234d2248-dc6f-4566-901b-a4a66b1e474f"><h2 shuku-edit-id="e-3cc5a69c-92f4-41c1-a53c-990ff73aaa78">编码器：理解原文</h2><p shuku-edit-id="e-4409954b-dca0-482f-bf5c-af25436c7de2">读入整句，形成带有上下文信息的表示。</p></div>
          <div shuku-edit-id="e-95b7f883-6e62-4daf-849a-ec72bcd53b96"><h2 shuku-edit-id="e-36410cd0-e2d2-404a-964b-b178aac07a48">解码器：生成译文</h2><p shuku-edit-id="e-0b9ddb32-fdbc-49f5-8911-3e7b2d502f90">结合原文信息和已生成的词，预测下一个词。</p></div>
        </section>
      </div>

      <footer shuku-edit-id="e-b2551dc5-e4f3-4106-8cc4-7f6ee0fd3684" className="tr-intro-footer">
        <Button className="tr-intro-next" variant="primary" onClick={onComplete}>从编码器的输入开始 →</Button>
      </footer>
    </section>);
}
export function MissionIntroPageFrame({ onComplete }: MissionIntroPageProps) {
    return <LessonPageFrame><MissionIntroPage onComplete={onComplete}/></LessonPageFrame>;
}
