import { useState, type CSSProperties, type ReactNode } from 'react';
import { Button } from "@shuku/course-style/react/controls/Button";
import { LessonPageFrame } from '../LessonPageFrame';
import './DecoderVocabularyCard.css';
interface CompleteProps {
    onComplete: () => void;
}
const words = ['〈开始〉', '我', '爱', '深度'];
const shownCandidates = [
    { token: '学习', score: 4.00 },
    { token: '研究', score: 2.78 },
    { token: '课程', score: 2.27 },
] as const;
const vocabularySize = 32000;
const remainingScore = -7;
const total = shownCandidates.reduce((sum, candidate) => sum + Math.exp(candidate.score), (vocabularySize - shownCandidates.length) * Math.exp(remainingScore));
const remainingProbability = (vocabularySize - shownCandidates.length) * Math.exp(remainingScore) / total * 100;
function VectorMatrix({ processed = false, highlightLast = false }: {
    processed?: boolean;
    highlightLast?: boolean;
}) {
    return <div shuku-edit-id="e-6912d49b-f0bf-48e9-8cf3-bff2e57761b7" className={`tr-vocab-matrix${processed ? ' is-processed' : ''}`}>
    {words.map((word, row) => <div shuku-edit-id="e-d3146476-df9a-4cf5-94fa-acfb7213ee57" className={`tr-vocab-matrix__row${highlightLast && row === words.length - 1 ? ' is-current' : ''}`} key={word}>
      <strong shuku-edit-id="e-37e46832-a777-42c1-8c8a-a55295c0c944">{word}</strong>
      <div shuku-edit-id="e-779ab7d9-1649-4e2a-9329-faad7f39a145" className="tr-vocab-matrix__cells">
        {Array.from({ length: 8 }, (_, column) => <span shuku-edit-id="e-de898279-90d3-4353-a839-4c2b032ed6e2" key={column} style={{ '--cell-index': (row * 3 + column * 5) % 9 } as CSSProperties}/>)
                .reduce<ReactNode[]>((cells, cell, index) => {
                if (index === 5)
                    cells.push(<b shuku-edit-id="e-443f8a8c-dc27-4d3f-98ff-e6f9b3459b40" key="ellipsis">···</b>);
                cells.push(cell);
                return cells;
            }, [])}
      </div>
    </div>)}
    <small shuku-edit-id="e-9e2ff1c7-6e13-4f53-b163-e52656ac93c2">4 × 512</small>
  </div>;
}
const advanceLabels = [
    '查看后续处理',
    '查看加工后的矩阵',
    '查看词元分数',
    '用 Softmax 计算概率',
];
export function DecoderVocabularyCard({ onComplete }: CompleteProps) {
    const [phase, setPhase] = useState(1);
    return <LessonPageFrame>
    <section shuku-edit-id="e-6df15272-1770-4c66-9939-4dc9bfb88e20" className="tr-vocab-page">
      <header shuku-edit-id="e-c0645b03-bd28-401b-a07f-565ce7c01b3a" className="tr-lesson-header tr-vocab-page__header">
        <h1 shuku-edit-id="e-794d0185-447b-4724-b26f-2f681fe17964">解码器怎样把向量变成下一个词？</h1>
        <p shuku-edit-id="e-6cea318c-5715-4ced-bf45-fc848d1ce7a4">逐步展开信息流，观察最终是哪一行进入词表预测。</p>
      </header>

      <main shuku-edit-id="e-8d1ad712-5991-4513-9173-a90d2bc79f7c" className="tr-vocab-stage">
        <section shuku-edit-id="e-4f1ae76a-b4b2-47ad-aab1-4b3d9a420008" className="tr-vocab-panel tr-vocab-panel--input">
          <h2 shuku-edit-id="e-f1940721-c31f-4bf1-a542-632a617c4121">交叉注意力输出</h2>
          <VectorMatrix />
          <p shuku-edit-id="e-1ec8907c-3b0f-4c15-8996-f44bbcb833cb" className="tr-vocab-panel__caption">融合原文后，每行是<strong shuku-edit-id="e-96316524-edc2-4214-b0ec-b72a808d78ae">512 维向量</strong>。</p>
        </section>

        {phase >= 2 && <section shuku-edit-id="e-94714a35-235b-4e3a-8e38-4cbdda3d3cd7" className="tr-vocab-panel tr-vocab-panel--process tr-vocab-reveal">
          <h2 shuku-edit-id="e-925c001c-6a0e-43fb-9c2d-1b056931eac2">后续处理</h2>
          <div shuku-edit-id="e-009e60b2-675a-4c66-aa7e-8756a7c5098c" className="tr-vocab-process">
            <span shuku-edit-id="e-d15d2d92-c83e-4147-8e6a-66a34d75d892">残差与层规范化</span>
            <span shuku-edit-id="e-afa0fa43-6ffa-47e4-b0ab-095813c9ba87">前馈网络</span><span shuku-edit-id="e-bc0137ce-1650-4d55-bb42-ad18bd8b72f0">后续解码器块</span>
          </div>
          <p shuku-edit-id="e-e5ff707a-5688-46d2-8f53-a6caefa6e547" className="tr-vocab-panel__caption">完成本 Block，再经过后续 Block，得到<strong shuku-edit-id="e-427cf3f9-0264-4f7a-b9df-cefedf24ed5d">解码器最终表示</strong>。</p>
        </section>}

        {phase >= 3 && <section shuku-edit-id="e-488bd8fd-c636-4b2c-b9d7-ab495fafbbe8" className="tr-vocab-panel tr-vocab-panel--final tr-vocab-reveal">
          <h2 shuku-edit-id="e-ed953328-ff37-43ee-95ff-f1678aeb4c66">解码器最终表示</h2>
          <VectorMatrix processed highlightLast={phase >= 4}/>
          <p shuku-edit-id="e-51f96bae-a3dc-4c0f-b6b0-106b5c674cf0" className="tr-vocab-panel__caption"><strong shuku-edit-id="e-afcc930a-5188-443a-a86b-f349dff6e5a9">形状不变</strong>，数值更新；生成时只取<strong shuku-edit-id="e-65037f52-6ffc-4664-94d7-7fd7c4ff5316">最后一行</strong>。</p>
        </section>}

        {phase >= 4 && <section shuku-edit-id="e-dd161ea1-47db-4cb9-a135-adae204f3ccc" className="tr-vocab-panel tr-vocab-panel--predict tr-vocab-reveal">
          <h2 shuku-edit-id="e-74616c21-e010-456e-ba56-16bde2f9c9f6">预测下一个词</h2>
          <div shuku-edit-id="e-e3c53c07-b500-4ac5-a3ed-383757ff1ff1" className="tr-vocab-prediction">
            <div shuku-edit-id="e-582aab8a-c25e-46a6-8a96-b6a20540235e" className="tr-vocab-extract">
              <div shuku-edit-id="e-d99bd8f2-873d-4392-853c-3e5b070b975b" className="tr-vocab-extract__strip" aria-label="最后一行转为竖向向量">
                {Array.from({ length: 5 }, (_, index) => <i shuku-edit-id="e-dd30993d-258d-4587-9dab-1860d7bcdef1" key={index}/>)}
                <b shuku-edit-id="e-dbeed480-c55f-4a71-a746-ab7d6a8c645f">⋮</b>
                {Array.from({ length: 3 }, (_, index) => <i shuku-edit-id="e-22c2e3ed-a484-4d19-bb18-b0d85162f41a" key={index}/>)}
              </div>
              <strong shuku-edit-id="e-57680b84-d4bd-49d6-8017-1079c8c04160">512 × 1</strong>
            </div>
            <span shuku-edit-id="e-6cf2f76a-771c-4f21-9c68-70058132f8c9" className="tr-vocab-flow-arrow" aria-hidden="true">→</span>
            <div shuku-edit-id="e-5a251dd7-2d2f-4c16-b179-4f503e957744" className="tr-vocab-linear">
              <strong shuku-edit-id="e-417f482b-b076-49f8-ab50-fa27596ac147">Linear</strong>
              <span shuku-edit-id="e-71491dab-4a3c-41e2-a4a7-f21274b428d8">W<sub shuku-edit-id="e-73181445-3702-4830-8947-4a4fc9c15ff2">vocab</sub></span>
            </div>
            <span shuku-edit-id="e-5e1c1df1-212e-43e5-aad9-1ded48e766ac" className="tr-vocab-flow-arrow" aria-hidden="true">→</span>
            <div shuku-edit-id="e-b8fd4b24-1e76-4117-b25e-3b3733f4a15d" className="tr-vocab-results">
              <div shuku-edit-id="e-f1a2452f-ef36-4882-a55b-c82e8afb23ad" className="tr-vocab-results__head"><span shuku-edit-id="e-95289c8a-2aa8-4a3f-9ed3-2aa887f021cf">词元</span><span shuku-edit-id="e-12f19f63-5767-494d-869d-b223e3deb448">分数</span><span shuku-edit-id="e-13027c0c-33c7-4ae7-98bc-aa1df7f87682">{phase >= 5 ? 'Softmax 概率' : ''}</span></div>
              {shownCandidates.map((candidate, index) => {
                const probability = Math.exp(candidate.score) / total * 100;
                return <div shuku-edit-id="e-a4f86e9a-12e6-4b69-927e-c63e20ff3bbc" className={`tr-vocab-results__row${phase >= 5 && index === 0 ? ' is-leading' : ''}`} key={candidate.token}>
                  <strong shuku-edit-id="e-48f95e64-0292-4840-afeb-1b8ec0e4a674">{candidate.token}</strong>
                  <b shuku-edit-id="e-b9395269-6d6b-4857-9979-dbd7c4a443b4">{candidate.score.toFixed(2)}</b>
                  <span shuku-edit-id="e-3602b497-7be6-41a6-b130-bab5d969d997" className={`tr-vocab-results__prob${phase < 5 ? ' is-pending' : ' tr-vocab-reveal'}`}>
                    {phase >= 5 && <><i shuku-edit-id="e-90c724b3-3c25-4ebe-ad70-a53083ab1393" style={{ width: `${probability}%` }}/><em shuku-edit-id="e-3780c71d-9f0c-482b-af03-9a11464ecb2e">{probability.toFixed(1)}%</em></>}
                  </span>
                </div>;
            })}
              <div shuku-edit-id="e-44701619-4629-4475-b6c7-6c2629036f22" className="tr-vocab-results__row is-remainder">
                <strong shuku-edit-id="e-d85caf79-1ee0-4021-b677-9fc38107aade">其余词</strong><b shuku-edit-id="e-d38ff5d1-c461-4535-aa42-a714d6a9889c">···</b>
                <span shuku-edit-id="e-dd9b2c55-9162-452b-8003-d7d1c585efd0" className={`tr-vocab-results__prob${phase < 5 ? ' is-pending' : ' tr-vocab-reveal'}`}>
                  {phase >= 5 && <><i shuku-edit-id="e-3344cc9d-dd76-4c7b-aaf0-8b9ec493e8cf" style={{ width: `${remainingProbability}%` }}/><em shuku-edit-id="e-2986e320-6faa-4d0a-b335-88a409e89686">{remainingProbability.toFixed(1)}%</em></>}
                </span>
              </div>
              <small shuku-edit-id="e-4f5252d9-69c0-4c0a-9948-c1a1465bef97">32,000 × 1</small>
            </div>
          </div>
          <p shuku-edit-id="e-a145e0bd-b311-4834-9393-d767659d1612" className="tr-vocab-panel__caption tr-vocab-panel__caption--prediction">
            <span shuku-edit-id="e-a2a0ba81-c09f-44f7-8a7f-0d0ffe6c511a"><strong shuku-edit-id="e-8670f0f7-c39f-468a-aca3-6bb36cb9943e">W<sub shuku-edit-id="e-61cc4a39-c143-4b7f-8f22-421f595a1615">vocab</sub></strong>（32,000 × 512）：得到词表分数。</span>
            {phase >= 5 && <span shuku-edit-id="e-5937d55f-bd25-4667-9c41-d126a34fbde5" className="tr-vocab-reveal"><strong shuku-edit-id="e-c834093c-9dc9-40ee-b4c9-4a3e0606d15e">Softmax</strong>：将分数变成下一词概率。</span>}
          </p>
        </section>}
      </main>

      <footer shuku-edit-id="e-269eee5e-e29d-424b-ac24-9ec494bc22d7" className="tr-vocab-page__footer"><small shuku-edit-id="e-53f2120b-ae9e-47b2-ae5e-36a168516948" className="tr-vocab-teaching-note">词表大小和分数为教学示例；真实参数通过训练学得。</small>
        {phase < 5
            ? <Button variant="primary" onClick={() => setPhase((current) => current + 1)}>{advanceLabels[phase - 1]}</Button>
            : <Button variant="primary" onClick={onComplete}>继续：训练时能读取哪些信息？</Button>}
      </footer>
    </section>
  </LessonPageFrame>;
}
