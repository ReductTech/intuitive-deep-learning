import { useState } from 'react';
import './QkvSourceQuiz.css';
const questions = [
    { title: '当前中文译文，要去读取英文原文。', prompt: '这次计算的 Q、K、V 分别来自哪里？', choices: ['Q 来自英文；K、V 来自中文', 'Q 来自中文；K、V 来自英文', 'Q、K、V 都来自中文'], correct: 1, reason: '中文端提出查询，英文编码器输出提供用于匹配的 K 和待汇聚的 V。' },
    { title: '暂时不读取英文，只让中文译文读取前文。', prompt: '这次计算的 Q、K、V 分别来自哪里？', choices: ['Q、K、V 都来自中文', 'Q 来自中文；K、V 来自英文', 'Q、K、V 都来自英文'], correct: 0, reason: '只在译文内部建立上下文，Q、K、V 来自同一份译文表示；掩码限制能读取的位置。' },
    { title: '若任务改成“中文 → 英文”，英文译文读取中文原文。', prompt: '交叉注意力中的 Q、K、V 从哪里来？', choices: ['Q 来自中文；K、V 来自英文', 'Q、K、V 都来自英文', 'Q 来自英文；K、V 来自中文'], correct: 2, reason: '语言换了，关系没变：Q 来自译文端，K、V 来自编码器提供的原文表示。' },
];
export function QkvSourceQuiz({ onClose }: {
    onClose: () => void;
}) {
    const [question, setQuestion] = useState(0);
    const [answer, setAnswer] = useState<number | null>(null);
    const item = questions[question], correct = answer === item.correct;
    return <div shuku-edit-id="e-8bb2b387-9edf-4a6c-be55-77cd05fd9bd0" className="tr-qkv-quiz-shade" onClick={onClose}><section shuku-edit-id="e-94564179-31eb-4669-bd63-68a427b4ae14" className="tr-qkv-quiz-paper" role="dialog" aria-modal="true" aria-label="QKV来源判断" onClick={event => event.stopPropagation()}><header shuku-edit-id="e-14ca1681-e356-41cf-a08e-62cf3e6266fc"><span shuku-edit-id="e-c1636838-f04e-4c14-8b8a-a9a4f31db354">Q / K / V 来源 · {question + 1} / {questions.length}</span><button shuku-edit-id="e-fbab6407-c353-4094-9680-e85b9bdb7d6e" autoFocus aria-label="关闭来源判断" onClick={onClose}>×</button></header><h2 shuku-edit-id="e-1f82a37a-1408-42e5-83e0-2e771271dbec">{item.title}</h2><p shuku-edit-id="e-32f6646b-c31c-493e-981a-004017546d3d">{item.prompt}</p><div shuku-edit-id="e-ed70d116-f6fa-4f65-a9a2-53118debc808" className="tr-qkv-quiz-choices">{item.choices.map((choice, i) => <button shuku-edit-id="e-01c3a66c-be44-47c7-98bd-4710159c6153" key={choice} disabled={answer !== null} className={answer === i ? 'is-chosen' : ''} onClick={() => setAnswer(i)}>{choice}</button>)}</div>{answer !== null && <div shuku-edit-id="e-df42eab5-0ebe-4360-9fe5-1174831544ed" className={`tr-qkv-quiz-feedback ${correct ? 'is-correct' : ''}`} aria-live="polite"><strong shuku-edit-id="e-cdadaa0d-f284-498c-af42-dcb04205b5f7">{correct ? '判断正确' : '再想想：谁在提问，谁在提供信息？'}</strong><p shuku-edit-id="e-dc5e397f-4bad-409f-b20e-faca4462fe82">{correct ? item.reason : '先辨认当前计算是在译文内部交流，还是由译文去读取原文。'}</p>{!correct && <button shuku-edit-id="e-b2d913bb-3bc1-45f6-80e0-31ec7ca521ac" onClick={() => setAnswer(null)}>重新选择 ↶</button>}</div>}<footer shuku-edit-id="e-1493d0ad-a7af-4aa0-9dfc-10ea0641194a">{correct && <button shuku-edit-id="e-40ca0ce1-b2da-4ddb-a875-905576cf177a" onClick={() => { if (question < questions.length - 1) {
        setQuestion(question + 1);
        setAnswer(null);
    }
    else
        onClose(); }}>{question < questions.length - 1 ? '换个情境，再判断 →' : '完成判断 ✓'}</button>}</footer></section></div>;
}
