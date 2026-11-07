import { useEffect, useId, useState, type KeyboardEvent } from 'react';
import { Button } from '../../../shared/react/controls/Button';
import { LessonPageFrame } from '../LessonPageFrame';
import { QkvSourceQuiz } from './QkvSourceQuiz';
import './MaskParallelTransition.css';
const inputs = ['〈开始〉', '我', '爱', '深度', '学习'];
const targets = ['我', '爱', '深度', '学习', '〈结束〉'];
// Same illustrative scaled scores as the preceding single-position demonstration.
const scores = [[1.1, .6, .4, 1.2, .8], [.8, 1.3, .7, .9, 1.5], [1.6, .3, 1.1, 2, .7], [.2, 1.6, .5, 1.1, .8], [1.2, .1, 1.8, .6, 1]];
const weights = scores.map((row, i) => {
    const total = row.slice(0, i + 1).reduce((sum, value) => sum + Math.exp(value), 0);
    return row.map((value, j) => j <= i ? Math.exp(value) / total : 0);
});
export function MaskParallelTransition({ onComplete }: {
    onComplete: () => void;
}) {
    const [moving, setMoving] = useState(false);
    const [matrixVisible, setMatrixVisible] = useState(false);
    const [numeric, setNumeric] = useState(false);
    const [settled, setSettled] = useState(false);
    const [weighted, setWeighted] = useState(false);
    const [weightSettled, setWeightSettled] = useState(false);
    const [selected, setSelected] = useState(2);
    const [quiz, setQuiz] = useState(false);
    const hatch = `mask-parallel-${useId().replace(/:/g, '')}`;
    useEffect(() => {
        if (!moving)
            return;
        const timers = [
            setTimeout(() => setMatrixVisible(true), 1800),
            setTimeout(() => setNumeric(true), 4500),
            setTimeout(() => setSettled(true), 7800),
            setTimeout(() => setWeighted(true), 10000),
        ];
        return () => timers.forEach(clearTimeout);
    }, [moving]);
    useEffect(() => {
        if (!weighted)
            return;
        const timer = setTimeout(() => setWeightSettled(true), 3000);
        return () => clearTimeout(timer);
    }, [weighted]);
    const select = (event: KeyboardEvent<SVGGElement>, row: number) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setSelected(row);
        }
    };
    return <LessonPageFrame><section className="tr-mask-parallel-page tr-mask19-page">
    <header className="tr-lesson-header"><h2>训练时，同一句话的多个位置可以同时预测</h2><p>{!moving ? '点击下方按钮，观察同一句话的多个位置怎样同时计算，分别预测下一个词。' : !weightSettled ? '观察整张矩阵一起计算：每一行对应一个位置和它的预测任务。' : '点击不同行，对照各位置的输入与预测目标，看看一次计算包含哪些预测。'}</p></header>
    <main className={`tr-mask-parallel-board${moving ? ' is-moving' : ''}${matrixVisible ? ' has-matrix' : ''}${numeric ? ' is-numeric' : ''}${weighted ? ' is-weighted' : ''}`}>
      <div className="tr-mask-parallel-intro">训练时，<mark>完整正确译文已知</mark>，每个位置的输入都能提前准备。</div>
      <svg viewBox="0 0 1460 465" role="group" aria-label="可读前文逐渐增加的五个预测任务，与同一行的掩码后注意力分数对应">
        <defs><pattern id={hatch} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line y2="10" stroke="#c6d2d9" strokeWidth="2"/></pattern></defs>
        <g className="tr-mask-parallel-words">
          <text x="65" y="35" className="tr-mask-parallel-label">可读取的输入</text><text x="671" y="35" textAnchor="middle" className="tr-mask-parallel-target-label">预测目标</text>
          {inputs.map((word, row) => <g key={word} role="button" tabIndex={0} aria-label={`查看第${row + 1}行，预测${targets[row]}`} aria-pressed={selected === row} onClick={() => setSelected(row)} onKeyDown={event => select(event, row)} className={`tr-mask-parallel-word-row${selected === row ? ' is-selected' : ''}`}>
            <rect className="tr-mask-parallel-row-focus" x="0" y={64 + row * 70} width="730" height="61" rx="14"/>
            <text x="25" y={103 + row * 70} textAnchor="middle" className="tr-mask-parallel-position">{row + 1}</text>
            {inputs.slice(0, row + 1).map((token, col) => <g key={token}><rect className="tr-mask-parallel-word-cell" x={65 + col * 103} y={70 + row * 70} width="95" height="49" rx="13"/><text className="tr-mask-parallel-word-text" x={112.5 + col * 103} y={102 + row * 70} textAnchor="middle">{token}</text></g>)}
            <text className="tr-mask-parallel-arrow" x="596" y={103 + row * 70} textAnchor="middle">→</text><rect className="tr-mask-parallel-target-cell" x="621" y={70 + row * 70} width="100" height="49" rx="13"/><text className="tr-mask-parallel-target-text" x="671" y={103 + row * 70} textAnchor="middle">{targets[row]}</text>
          </g>)}
        </g>
        <g className="tr-mask-parallel-scores" aria-hidden={!matrixVisible}>
          <text x="1110" y="-9" textAnchor="middle" className="tr-mask-parallel-matrix-title tr-mask-parallel-score-title" aria-hidden={weighted}>掩码后的分数</text><text x="1110" y="-9" textAnchor="middle" className="tr-mask-parallel-matrix-title tr-mask-parallel-weight-title" aria-hidden={!weighted}>Softmax → 注意力权重</text>
          {inputs.map((word, col) => <text key={word} x={950 + col * 103} y="35" textAnchor="middle" className="tr-mask-parallel-column">{word}</text>)}
          {inputs.map((word, row) => <g key={word} role="button" tabIndex={matrixVisible ? 0 : -1} aria-label={`查看分数第${row + 1}行，当前位置${word}`} aria-pressed={selected === row} onClick={() => setSelected(row)} onKeyDown={event => select(event, row)} className={`tr-mask-parallel-score-row${selected === row ? ' is-selected' : ''}`}>
            <text x="872" y={103 + row * 70} textAnchor="end" className="tr-mask-parallel-row-label">{word}</text>
            {inputs.map((token, col) => <g key={token} className={col > row ? 'is-future' : 'is-readable'}>
              <rect className="tr-mask-parallel-score-cell" x={902 + col * 103} y={70 + row * 70} width="96" height="49" rx="11"/>
              {col > row && <rect x={902 + col * 103} y={70 + row * 70} width="96" height="49" rx="11" fill={`url(#${hatch})`} className="tr-mask-parallel-cell-hatch"/>}
              {col <= row && <text className="tr-mask-parallel-cell-word" x={950 + col * 103} y={103 + row * 70} textAnchor="middle" aria-hidden={numeric}>{token}</text>}
              <text className="tr-mask-parallel-cell-number tr-mask-parallel-cell-score" x={950 + col * 103} y={103 + row * 70} textAnchor="middle" aria-hidden={!numeric || weighted}>{col > row ? '−∞' : scores[row][col].toFixed(1)}</text><text className="tr-mask-parallel-cell-weight" x={950 + col * 103} y={103 + row * 70} textAnchor="middle" aria-hidden={!weighted}>{col > row ? '0' : weights[row][col].toFixed(2)}</text>
            </g>)}
          </g>)}
          <text x="1157" y="449" textAnchor="middle" className="tr-mask-parallel-legend tr-mask-parallel-score-title" aria-hidden={weighted}>右上方是 −∞，下一步经过 Softmax</text><text x="1157" y="449" textAnchor="middle" className="tr-mask-parallel-legend tr-mask-parallel-weight-title" aria-hidden={!weighted}>后文权重为 0；每一行的权重之和为 1</text>
        </g>
      </svg>
      <div className="tr-mask-parallel-takeaway"><span>输入已知</span><i>＋</i><span>掩码限制后文</span><i>→</i><strong>多个位置一起训练</strong></div>
    </main>
    <footer className="tr-mask19-footer"><small>生成时仍需逐词预测；数值为教学示例，显示权重经四舍五入。</small><div>{weightSettled && <Button variant="default" onClick={() => setQuiz(true)}>Q / K / V 小挑战</Button>}{moving && !weightSettled ? <span className="tr-mask-parallel-status" aria-live="polite">{!settled ? '文字与分数逐行对应' : !weighted ? '掩码后的分数' : 'Softmax：分数渐变为权重'}</span> : <Button variant="primary" onClick={() => moving ? onComplete() : setMoving(true)}>{!moving ? '看看多个位置怎样一起计算 →' : '继续：组装解码器'}</Button>}</div></footer>
    {quiz && <QkvSourceQuiz onClose={() => setQuiz(false)}/>}
  </section></LessonPageFrame>;
}
