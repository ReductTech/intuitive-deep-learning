import { transformerAsset } from '../../assetUrls';
import { useEffect, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { Button } from "@shuku/course-style/react/controls/Button";
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
    {scene === 0 && <section shuku-edit-id="e-be35575d-d2bf-43b8-8b1e-63e6d3ca8705" className="tr-mh-transition">
      <div shuku-edit-id="e-2d24a6dd-cb3c-40cb-9599-42cf0130cb6e" className="tr-mh-focus-row"><strong shuku-edit-id="e-d74265a2-47ba-4a51-a060-074339deb67d">bank 的一套注意力权重</strong>{WORDS.map((word, index) => <span shuku-edit-id="e-b3f7970b-29f1-496a-be3c-00883e32b76e" style={{ '--weight': `${8 + Math.sqrt(WEIGHTS[5][index]) * 42}px` } as CSSProperties} key={word}><i shuku-edit-id="e-3b00bc95-174a-4736-8b30-080e7d9af7eb" />{word}</span>)}</div>
      <div shuku-edit-id="e-1e73ca4a-93fe-4664-b24c-d32d1da00baa" className="tr-mh-expert-conversation">
        <svg shuku-edit-id="e-68f7523a-beab-4e5e-8538-b1990bccf7af" className="tr-mh-weight-link" viewBox="0 0 1000 550" aria-hidden="true"><defs shuku-edit-id="e-91792576-307c-4cf4-8397-587a53a06928"><marker shuku-edit-id="e-299a4db8-6b02-4206-98f2-f760576b1de0" id="mh-weight-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path shuku-edit-id="e-80018d22-c1a8-45eb-83cb-d93619179be8" d="M0 0L7 3.5L0 7" fill="#bb7839"/></marker></defs><path shuku-edit-id="e-6226d605-1900-4f28-8ae5-318b8d127bee" d="M500 0V155" stroke="#bb7839" strokeWidth="2" fill="none" markerEnd="url(#mh-weight-arrow)"/></svg>
        <figure shuku-edit-id="e-30aebcee-89f8-4f34-9c55-26027192ccd0" className="tr-mh-question-circle"><div shuku-edit-id="e-f0807ad9-8260-4f12-9cf8-b657e08e01f9" className="tr-mh-ring-art" role="img" aria-label="多位专家分散围成一圈，从不同角度向中央着急的机器人提问">{['left', 'center', 'right'].map(part => <img shuku-edit-id="e-98a84f57-bb7e-4689-8a63-fca314c565a6" className={`tr-mh-ring-${part}`} src={transformerAsset("04_多头注意力/不同关注方式.png")} alt="" key={part}/>)}</div>
          {['谁在存钱？', '存了什么？', '存到哪里？', 'bank 是哪种意思？', '有形容词吗？', '这句话说什么？'].map((question, index) => <span shuku-edit-id="e-ffd825cc-2751-47cb-89e8-284873263651" className={`tr-mh-question q-${index}`} key={question}>{question}</span>)}
          <div shuku-edit-id="e-85bb8d55-e373-4fa2-b015-cfd677b930e6" className="tr-mh-robot-says">同一句话，能不能学到<br shuku-edit-id="e-0cd31e42-dae0-4373-b3d8-887906707959" /><strong shuku-edit-id="e-92838839-ef46-4419-a8f0-09813844819b">不同的关注方式</strong>？</div>
        </figure>
      </div>
    </section>}
    {false}
    {false}
    {false}
    {false}
    <footer shuku-edit-id="e-068f199c-5f16-469e-8abc-136069823a86" className="tr-mh-page-footer">{scene === 0 && <span shuku-edit-id="e-8b74deb1-c7c2-4df5-9808-b3fa41df5a12" className="tr-mh-demo-note">问题是帮助理解的比喻，不代表各头固定承担这些职责。</span>}{false}<Button variant="primary" onClick={onComplete}>{nextLabels[scene]}</Button></footer>
  </LessonStage>;
}
