import { useEffect, useId, useState, type KeyboardEvent } from 'react';
import { Button } from "@shuku/course-style/react/controls/Button";
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
    return <LessonPageFrame><section shuku-edit-id="e-03bd590f-171c-4c16-8e64-ceb6a7d6b138" className="tr-mask-parallel-page tr-mask19-page">
    <header shuku-edit-id="e-5944ccc6-1025-401a-8256-f17536acf293" className="tr-lesson-header"><h2 shuku-edit-id="e-313e8b84-f16f-4632-8178-93e9bd121ff6">训练时，同一句话的多个位置可以同时预测</h2><p shuku-edit-id="e-e81b5dcb-92ed-4dd1-9a15-388be473ecdf">{!moving ? '点击下方按钮，观察同一句话的多个位置怎样同时计算，分别预测下一个词。' : !weightSettled ? '观察整张矩阵一起计算：每一行对应一个位置和它的预测任务。' : '点击不同行，对照各位置的输入与预测目标，看看一次计算包含哪些预测。'}</p></header>
    <main shuku-edit-id="e-4541c159-a1ad-459e-b02a-3bb3cd238fff" className={`tr-mask-parallel-board${moving ? ' is-moving' : ''}${matrixVisible ? ' has-matrix' : ''}${numeric ? ' is-numeric' : ''}${weighted ? ' is-weighted' : ''}`}>
      <div shuku-edit-id="e-d690fe62-b0e6-4a81-90aa-80d4208e8800" className="tr-mask-parallel-intro">训练时，<mark shuku-edit-id="e-70d93631-a84d-4a03-ac56-086382209622">完整正确译文已知</mark>，每个位置的输入都能提前准备。</div>
      <svg shuku-edit-id="e-bd2a65e8-1ad9-4625-a542-a65a208ca0a2" viewBox="0 0 1460 465" role="group" aria-label="可读前文逐渐增加的五个预测任务，与同一行的掩码后注意力分数对应">
        <defs shuku-edit-id="e-d1b58dec-ab5b-4404-8617-b69c4135d8d6"><pattern shuku-edit-id="e-f81c3f76-d9fd-44d7-ad03-66afcdcaea60" id={hatch} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line shuku-edit-id="e-ec116113-39a6-44bb-8749-c6679878ba00" y2="10" stroke="#c6d2d9" strokeWidth="2"/></pattern></defs>
        <g shuku-edit-id="e-44260bc8-efc1-4b50-81a2-4bbd669ed68e" className="tr-mask-parallel-words">
          <text shuku-edit-id="e-3e0de6a1-e522-4c9c-802b-5eae14113f8a" x="65" y="35" className="tr-mask-parallel-label">可读取的输入</text><text shuku-edit-id="e-a4fd36cb-76d1-4cef-8b31-88b58e97170e" x="671" y="35" textAnchor="middle" className="tr-mask-parallel-target-label">预测目标</text>
          {inputs.map((word, row) => <g shuku-edit-id="e-1838cfd7-e785-4c5c-b5ac-42c0ded7de07" key={word} role="button" tabIndex={0} aria-label={`查看第${row + 1}行，预测${targets[row]}`} aria-pressed={selected === row} onClick={() => setSelected(row)} onKeyDown={event => select(event, row)} className={`tr-mask-parallel-word-row${selected === row ? ' is-selected' : ''}`}>
            <rect shuku-edit-id="e-069ff4e5-3fbb-41e6-9c1e-154c94bcc032" className="tr-mask-parallel-row-focus" x="0" y={64 + row * 70} width="730" height="61" rx="14"/>
            <text shuku-edit-id="e-886c58bd-58c1-445a-9db2-fca456be6c43" x="25" y={103 + row * 70} textAnchor="middle" className="tr-mask-parallel-position">{row + 1}</text>
            {inputs.slice(0, row + 1).map((token, col) => <g shuku-edit-id="e-4c907f29-4d32-4432-9fa9-fffb0c85f265" key={token}><rect shuku-edit-id="e-b886f45d-f172-4def-931a-ec49092d76f0" className="tr-mask-parallel-word-cell" x={65 + col * 103} y={70 + row * 70} width="95" height="49" rx="13"/><text shuku-edit-id="e-1900c0b4-c6db-4d79-a70b-cdf5891e08f9" className="tr-mask-parallel-word-text" x={112.5 + col * 103} y={102 + row * 70} textAnchor="middle">{token}</text></g>)}
            <text shuku-edit-id="e-b87484a6-0ae8-46f6-abcd-495f6e6849d7" className="tr-mask-parallel-arrow" x="596" y={103 + row * 70} textAnchor="middle">→</text><rect shuku-edit-id="e-40af36fb-418c-4d53-9d55-6b83defb9ed1" className="tr-mask-parallel-target-cell" x="621" y={70 + row * 70} width="100" height="49" rx="13"/><text shuku-edit-id="e-d5aa05b8-0723-4c76-a6b0-b06bdc52a59c" className="tr-mask-parallel-target-text" x="671" y={103 + row * 70} textAnchor="middle">{targets[row]}</text>
          </g>)}
        </g>
        <g shuku-edit-id="e-ab8f2510-60bb-49ac-8098-587c673c3c1f" className="tr-mask-parallel-scores" aria-hidden={!matrixVisible}>
          <text shuku-edit-id="e-41f4e6be-0857-48b2-b96d-b77a388ebc44" x="1110" y="-9" textAnchor="middle" className="tr-mask-parallel-matrix-title tr-mask-parallel-score-title" aria-hidden={weighted}>掩码后的分数</text><text shuku-edit-id="e-1ccf9b3a-082c-4744-a082-35e0457f0e21" x="1110" y="-9" textAnchor="middle" className="tr-mask-parallel-matrix-title tr-mask-parallel-weight-title" aria-hidden={!weighted}>Softmax → 注意力权重</text>
          {inputs.map((word, col) => <text shuku-edit-id="e-23aaa892-af01-4c4e-acf7-5bc18f01459e" key={word} x={950 + col * 103} y="35" textAnchor="middle" className="tr-mask-parallel-column">{word}</text>)}
          {inputs.map((word, row) => <g shuku-edit-id="e-5f4b1f38-0a13-4706-89f4-60054fd34115" key={word} role="button" tabIndex={matrixVisible ? 0 : -1} aria-label={`查看分数第${row + 1}行，当前位置${word}`} aria-pressed={selected === row} onClick={() => setSelected(row)} onKeyDown={event => select(event, row)} className={`tr-mask-parallel-score-row${selected === row ? ' is-selected' : ''}`}>
            <text shuku-edit-id="e-b07fe18a-a9cc-44ef-9e3f-7a48be54199b" x="872" y={103 + row * 70} textAnchor="end" className="tr-mask-parallel-row-label">{word}</text>
            {inputs.map((token, col) => <g shuku-edit-id="e-2549696c-6915-4bc2-8440-c1286ac8fedc" key={token} className={col > row ? 'is-future' : 'is-readable'}>
              <rect shuku-edit-id="e-cfb861cb-77ff-446c-903a-a2ee31b9ab43" className="tr-mask-parallel-score-cell" x={902 + col * 103} y={70 + row * 70} width="96" height="49" rx="11"/>
              {col > row && <rect shuku-edit-id="e-c34340e0-1ea5-444a-b87d-88e28d030a5e" x={902 + col * 103} y={70 + row * 70} width="96" height="49" rx="11" fill={`url(#${hatch})`} className="tr-mask-parallel-cell-hatch"/>}
              {col <= row && <text shuku-edit-id="e-693a59c8-0a8b-48a7-8348-443de0d8a813" className="tr-mask-parallel-cell-word" x={950 + col * 103} y={103 + row * 70} textAnchor="middle" aria-hidden={numeric}>{token}</text>}
              <text shuku-edit-id="e-cb9273e3-beee-4320-843d-68a3c78e3165" className="tr-mask-parallel-cell-number tr-mask-parallel-cell-score" x={950 + col * 103} y={103 + row * 70} textAnchor="middle" aria-hidden={!numeric || weighted}>{col > row ? '−∞' : scores[row][col].toFixed(1)}</text><text shuku-edit-id="e-6bdfddc5-a9fd-45a4-8aff-157044c236fb" className="tr-mask-parallel-cell-weight" x={950 + col * 103} y={103 + row * 70} textAnchor="middle" aria-hidden={!weighted}>{col > row ? '0' : weights[row][col].toFixed(2)}</text>
            </g>)}
          </g>)}
          <text shuku-edit-id="e-d2156bd2-3ff9-486e-b35c-8eef9230d92f" x="1157" y="449" textAnchor="middle" className="tr-mask-parallel-legend tr-mask-parallel-score-title" aria-hidden={weighted}>右上方是 −∞，下一步经过 Softmax</text><text shuku-edit-id="e-456e81bd-7b7f-422e-89bd-e76e6aa69278" x="1157" y="449" textAnchor="middle" className="tr-mask-parallel-legend tr-mask-parallel-weight-title" aria-hidden={!weighted}>后文权重为 0；每一行的权重之和为 1</text>
        </g>
      </svg>
      <div shuku-edit-id="e-e6c5e889-7893-4113-a711-586f835b1506" className="tr-mask-parallel-takeaway"><span shuku-edit-id="e-4ad44ec0-06ab-4670-8506-d85293c28229">输入已知</span><i shuku-edit-id="e-af629d47-5af4-4d51-af78-48502c9627c0">＋</i><span shuku-edit-id="e-41d3a6ff-897f-4732-a72c-17d65b9eb477">掩码限制后文</span><i shuku-edit-id="e-2850470f-2c41-4401-83dc-9802f6e07e7b">→</i><strong shuku-edit-id="e-c5df83cb-3015-4402-a1cb-99fbb8468e98">多个位置一起训练</strong></div>
    </main>
    <footer shuku-edit-id="e-ccee99f9-a728-4748-a36b-03c6a45ee2ce" className="tr-mask19-footer"><small shuku-edit-id="e-2913c428-1945-42d1-9224-71ab9575b060">生成时仍需逐词预测；数值为教学示例，显示权重经四舍五入。</small><div shuku-edit-id="e-db4519ba-4a0f-480a-aeae-2dbc7214124f">{weightSettled && <Button variant="default" onClick={() => setQuiz(true)}>Q / K / V 小挑战</Button>}{moving && !weightSettled ? <span shuku-edit-id="e-bd5f25e0-0597-4059-b0f2-cb05bd69e555" className="tr-mask-parallel-status" aria-live="polite">{!settled ? '文字与分数逐行对应' : !weighted ? '掩码后的分数' : 'Softmax：分数渐变为权重'}</span> : <Button variant="primary" onClick={() => moving ? onComplete() : setMoving(true)}>{!moving ? '看看多个位置怎样一起计算 →' : '继续：组装解码器'}</Button>}</div></footer>
    {quiz && <QkvSourceQuiz onClose={() => setQuiz(false)}/>}
  </section></LessonPageFrame>;
}
