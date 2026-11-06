import { useState, type CSSProperties, type ReactNode } from 'react';
import { Button } from '../../../shared/react/controls/Button';
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
    return <div className={`tr-vocab-matrix${processed ? ' is-processed' : ''}`}>
    {words.map((word, row) => <div className={`tr-vocab-matrix__row${highlightLast && row === words.length - 1 ? ' is-current' : ''}`} key={word}>
      <strong>{word}</strong>
      <div className="tr-vocab-matrix__cells">
        {Array.from({ length: 8 }, (_, column) => <span key={column} style={{ '--cell-index': (row * 3 + column * 5) % 9 } as CSSProperties}/>)
                .reduce<ReactNode[]>((cells, cell, index) => {
                if (index === 5)
                    cells.push(<b key="ellipsis">···</b>);
                cells.push(cell);
                return cells;
            }, [])}
      </div>
    </div>)}
    <small>4 × 512</small>
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
    <section className="tr-vocab-page">
      <header className="tr-lesson-header tr-vocab-page__header">
        <h1>解码器怎样把向量变成下一个词？</h1>
        <p>逐步展开信息流，观察最终是哪一行进入词表预测。</p>
      </header>

      <main className="tr-vocab-stage">
        <section className="tr-vocab-panel tr-vocab-panel--input">
          <h2>交叉注意力输出</h2>
          <VectorMatrix />
          <p className="tr-vocab-panel__caption">融合原文后，每行是<strong>512 维向量</strong>。</p>
        </section>

        {phase >= 2 && <section className="tr-vocab-panel tr-vocab-panel--process tr-vocab-reveal">
          <h2>后续处理</h2>
          <div className="tr-vocab-process">
            <span>残差与层规范化</span>
            <span>前馈网络</span><span>后续解码器块</span>
          </div>
          <p className="tr-vocab-panel__caption">完成本 Block，再经过后续 Block，得到<strong>解码器最终表示</strong>。</p>
        </section>}

        {phase >= 3 && <section className="tr-vocab-panel tr-vocab-panel--final tr-vocab-reveal">
          <h2>解码器最终表示</h2>
          <VectorMatrix processed highlightLast={phase >= 4}/>
          <p className="tr-vocab-panel__caption"><strong>形状不变</strong>，数值更新；生成时只取<strong>最后一行</strong>。</p>
        </section>}

        {phase >= 4 && <section className="tr-vocab-panel tr-vocab-panel--predict tr-vocab-reveal">
          <h2>预测下一个词</h2>
          <div className="tr-vocab-prediction">
            <div className="tr-vocab-extract">
              <div className="tr-vocab-extract__strip" aria-label="最后一行转为竖向向量">
                {Array.from({ length: 5 }, (_, index) => <i key={index}/>)}
                <b>⋮</b>
                {Array.from({ length: 3 }, (_, index) => <i key={index}/>)}
              </div>
              <strong>512 × 1</strong>
            </div>
            <span className="tr-vocab-flow-arrow" aria-hidden="true">→</span>
            <div className="tr-vocab-linear">
              <strong>Linear</strong>
              <span>W<sub>vocab</sub></span>
            </div>
            <span className="tr-vocab-flow-arrow" aria-hidden="true">→</span>
            <div className="tr-vocab-results">
              <div className="tr-vocab-results__head"><span>词元</span><span>分数</span><span>{phase >= 5 ? 'Softmax 概率' : ''}</span></div>
              {shownCandidates.map((candidate, index) => {
                const probability = Math.exp(candidate.score) / total * 100;
                return <div className={`tr-vocab-results__row${phase >= 5 && index === 0 ? ' is-leading' : ''}`} key={candidate.token}>
                  <strong>{candidate.token}</strong>
                  <b>{candidate.score.toFixed(2)}</b>
                  <span className={`tr-vocab-results__prob${phase < 5 ? ' is-pending' : ' tr-vocab-reveal'}`}>
                    {phase >= 5 && <><i style={{ width: `${probability}%` }}/><em>{probability.toFixed(1)}%</em></>}
                  </span>
                </div>;
            })}
              <div className="tr-vocab-results__row is-remainder">
                <strong>其余词</strong><b>···</b>
                <span className={`tr-vocab-results__prob${phase < 5 ? ' is-pending' : ' tr-vocab-reveal'}`}>
                  {phase >= 5 && <><i style={{ width: `${remainingProbability}%` }}/><em>{remainingProbability.toFixed(1)}%</em></>}
                </span>
              </div>
              <small>32,000 × 1</small>
            </div>
          </div>
          <p className="tr-vocab-panel__caption tr-vocab-panel__caption--prediction">
            <span><strong>W<sub>vocab</sub></strong>（32,000 × 512）：得到词表分数。</span>
            {phase >= 5 && <span className="tr-vocab-reveal"><strong>Softmax</strong>：将分数变成下一词概率。</span>}
          </p>
        </section>}
      </main>

      <footer className="tr-vocab-page__footer"><small className="tr-vocab-teaching-note">词表大小和分数为教学示例；真实参数通过训练学得。</small>
        {phase < 5
            ? <Button variant="primary" onClick={() => setPhase((current) => current + 1)}>{advanceLabels[phase - 1]}</Button>
            : <Button variant="primary" onClick={onComplete}>继续：训练时能读取哪些信息？</Button>}
      </footer>
    </section>
  </LessonPageFrame>;
}
