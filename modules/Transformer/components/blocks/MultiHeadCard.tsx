import { transformerAsset } from '../../assetUrls';
import { useEffect, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { Button } from '../../../shared/react/controls/Button';
import { LessonStage } from '../LessonStage';
import './MultiHeadCard.css';
import { WORDS, WEIGHTS } from '../../domain/attentionMatrixExample';
import './MultiHeadPages.css';
interface MultiHeadCardProps {
    onComplete: () => void;
    page?: number;
}
const titles = ['多头注意力：同一句话的不同关注方式', '多头注意力：将 Q、K、V 分成 8 个头', '多头注意力：8 个头并行计算', '多头注意力：拼接并融合不同头的信息', '多头注意力：从输入到输出'];
const subtitles = ['先看 bank 的一行权重，再想想：同一句话还需要关注哪些关系？', '先展示 8 个头合并的 Q、K、V，再拆成每头 64 维。', '每个头用自己的 Q、K、V，得到一份上下文表示。', '先收集 8 个头的结果，再用输出投影重新组合。', '回看拆分、并行计算、拼接与输出投影。'];
const nextLabels = ['继续：让多个头分别关注', '继续：8 个头怎样计算？', '继续：把 8 个结果合起来', '继续：回看完整流程', '继续：逐位前馈网络'];
export function MultiHeadCard({ onComplete, page = 0 }: MultiHeadCardProps) {
    const scene = page;
    const [head, setHead] = useState(() => {
        try {
            const value = Number(sessionStorage.getItem('transformer-tracked-head') ?? 2);
            return Number.isInteger(value) && value >= 0 && value < 8 ? value : 2;
        }
        catch {
            return 2;
        }
    });
    useEffect(() => {
        try {
            sessionStorage.setItem('transformer-tracked-head', String(head));
        }
        catch { /* Selection still works without storage. */ }
    }, [head]);
    const selectHead = (index: number) => setHead(index);
    const headKey = (event: KeyboardEvent, index: number) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            selectHead(index);
        }
    };
    return <LessonStage title={titles[scene]} description={subtitles[scene]} className={`tr-stage tr-multihead-stage tr-mh-page-${scene}`}>
    {scene === 0 && <section className="tr-mh-transition">
      <div className="tr-mh-focus-row"><strong>bank 的一套注意力权重</strong>{WORDS.map((word, index) => <span style={{ '--weight': `${8 + Math.sqrt(WEIGHTS[5][index]) * 42}px` } as CSSProperties} key={word}><i />{word}</span>)}</div>
      <div className="tr-mh-expert-conversation">
        <svg className="tr-mh-weight-link" viewBox="0 0 1000 550" aria-hidden="true"><defs><marker id="mh-weight-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7" fill="#bb7839"/></marker></defs><path d="M500 0V155" stroke="#bb7839" strokeWidth="2" fill="none" markerEnd="url(#mh-weight-arrow)"/></svg>
        <figure className="tr-mh-question-circle"><div className="tr-mh-ring-art" role="img" aria-label="多位专家分散围成一圈，从不同角度向中央着急的机器人提问">{['left', 'center', 'right'].map(part => <img className={`tr-mh-ring-${part}`} src={transformerAsset("04_多头注意力/不同关注方式.png")} alt="" key={part}/>)}</div>
          {['谁在存钱？', '存了什么？', '存到哪里？', 'bank 是哪种意思？', '有形容词吗？', '这句话说什么？'].map((question, index) => <span className={`tr-mh-question q-${index}`} key={question}>{question}</span>)}
          <div className="tr-mh-robot-says">同一句话，能不能学到<br /><strong>不同的关注方式</strong>？</div>
        </figure>
      </div>
    </section>}
    {false}
    {false}
    {false}
    {false}
    <footer className="tr-mh-page-footer">{scene === 0 && <span className="tr-mh-demo-note">问题是帮助理解的比喻，不代表各头固定承担这些职责。</span>}{false}<Button variant="primary" onClick={onComplete}>{nextLabels[scene]}</Button></footer>
  </LessonStage>;
}
