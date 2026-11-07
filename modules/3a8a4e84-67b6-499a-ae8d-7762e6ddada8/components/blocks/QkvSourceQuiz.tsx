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
    return <div className="tr-qkv-quiz-shade" onClick={onClose}><section className="tr-qkv-quiz-paper" role="dialog" aria-modal="true" aria-label="QKV来源判断" onClick={event => event.stopPropagation()}><header><span>Q / K / V 来源 · {question + 1} / {questions.length}</span><button autoFocus aria-label="关闭来源判断" onClick={onClose}>×</button></header><h2>{item.title}</h2><p>{item.prompt}</p><div className="tr-qkv-quiz-choices">{item.choices.map((choice, i) => <button key={choice} disabled={answer !== null} className={answer === i ? 'is-chosen' : ''} onClick={() => setAnswer(i)}>{choice}</button>)}</div>{answer !== null && <div className={`tr-qkv-quiz-feedback ${correct ? 'is-correct' : ''}`} aria-live="polite"><strong>{correct ? '判断正确' : '再想想：谁在提问，谁在提供信息？'}</strong><p>{correct ? item.reason : '先辨认当前计算是在译文内部交流，还是由译文去读取原文。'}</p>{!correct && <button onClick={() => setAnswer(null)}>重新选择 ↶</button>}</div>}<footer>{correct && <button onClick={() => { if (question < questions.length - 1) {
        setQuestion(question + 1);
        setAnswer(null);
    }
    else
        onClose(); }}>{question < questions.length - 1 ? '换个情境，再判断 →' : '完成判断 ✓'}</button>}</footer></section></div>;
}
