import { useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { Button } from '../../../shared/react/controls/Button';
import { LessonPageFrame } from '../LessonPageFrame';
import './CrossAttentionMatrixCard.css';
interface CrossAttentionMatrixCardProps {
    onComplete: () => void;
}
const source = ['I', 'love', 'deep', 'learning'];
const target = ['〈开始〉', '我', '爱', '深度'];
const weights = [
    [0.76, 0.10, 0.08, 0.06],
    [0.08, 0.74, 0.14, 0.04],
    [0.05, 0.14, 0.68, 0.13],
    [0.04, 0.05, 0.17, 0.74],
];
const shownDimensions = [0, 1, null, 62, 63] as const;
const dimensionLabel = (dimension: number) => `第 ${dimension + 1} 维`;
const dimensionSymbol = (dimension: number) => `d${String(dimension + 1).replace(/[0-9]/g, (digit) => '₀₁₂₃₄₅₆₇₈₉'[Number(digit)])}`;
const value = source.map((_, row) => Array.from({ length: 64 }, (_, column) => column === 0 ? [0.2, 0.1, 0.3, 0.8][row] : (1 + (((row + 2) * 17 + column * 11) % 9)) / 10));
const result = weights.map((weightRow) => Array.from({ length: 64 }, (_, column) => weightRow.reduce((sum, weight, sourceIndex) => sum + weight * value[sourceIndex][column], 0)));
export function CrossAttentionMatrixCard({ onComplete }: CrossAttentionMatrixCardProps) {
    const [selectedRow, setSelectedRow] = useState(3);
    const [selectedColumn, setSelectedColumn] = useState(0);
    const dragging = useRef(false);
    const selectAt = (x: number, y: number) => {
        const element = document.elementFromPoint(x, y) as HTMLElement | null;
        const weightCell = element?.closest<HTMLElement>('[data-cross17-a-row]');
        const valueCell = element?.closest<HTMLElement>('[data-cross17-v-column]');
        const resultCell = element?.closest<HTMLElement>('[data-cross17-c-row][data-cross17-c-column]');
        if (weightCell)
            setSelectedRow(Number(weightCell.dataset.cross17ARow));
        if (valueCell)
            setSelectedColumn(Number(valueCell.dataset.cross17VColumn));
        if (resultCell) {
            setSelectedRow(Number(resultCell.dataset.cross17CRow));
            setSelectedColumn(Number(resultCell.dataset.cross17CColumn));
        }
    };
    const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
        const element = event.target as HTMLElement;
        if (!element.closest('[data-cross17-a-row], [data-cross17-v-column], [data-cross17-c-row]'))
            return;
        dragging.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        selectAt(event.clientX, event.clientY);
        event.preventDefault();
    };
    const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
        if (dragging.current)
            selectAt(event.clientX, event.clientY);
    };
    const endDrag = () => { dragging.current = false; };
    return <LessonPageFrame>
    <section className="tr-cross17-page">
      <header className="tr-lesson-header tr-cross17-header">
        <h2>交叉注意力：译文怎样读取原文？</h2>
        <p>点 A 的一行，再点 V 的一列，查看下方对应结果格的加权算式。</p>
      </header>

      <main className="tr-cross17-body" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
        <section className="tr-cross17-workspace" aria-label="选择矩阵行列并观察汇聚">
        <div className="tr-cross17-guide"><span>原文：I love deep learning.</span><i>→</i><span>已生成：〈开始〉我 爱 深度</span><i>→</i><strong>下一词：学习</strong></div>
        <div className="tr-cross17-panels">
          <section className="tr-cross17-panel tr-cross17-a" aria-label="注意力权重矩阵 A">
            <h3>A：注意力权重</h3>
            <div className="tr-cross17-axis">原文 <strong>K</strong></div>
            <div className="tr-cross17-matrix tr-cross17-matrix-a">
              <span className="tr-cross17-corner">译文 <strong>Q</strong></span>
              {source.map((token) => <span className="tr-cross17-column-label" key={token}>{token}</span>)}
              {target.map((token, row) => <div className="tr-cross17-row" key={token}>
                <button type="button" className={`tr-cross17-row-label${selectedRow === row ? ' is-selected' : ''}`} data-cross17-a-row={row} aria-label={`选择 ${token} 的注意力权重`} onClick={() => setSelectedRow(row)}>{token}</button>
                {weights[row].map((weight, column) => <button type="button" className={`tr-cross17-weight-cell${selectedRow === row ? ' is-selected' : ''}`} data-cross17-a-row={row} aria-label={`${token} 对 ${source[column]} 的注意力权重 ${Math.round(weight * 100)}%`} onClick={() => setSelectedRow(row)} style={{ '--cross17-dot': `${Math.round(7 + Math.sqrt(weight) * 24)}px` } as CSSProperties} key={column}>{selectedRow === row ? <b>{weight.toFixed(2)}</b> : <span aria-hidden="true"/>}</button>)}
              </div>)}
            </div>
            <div className="tr-cross17-dimension">4 × 4 / 头</div>
            <div className="tr-cross17-panel-note"><b>A = Softmax(QKᵀ / √64)</b><span>Q 来自译文，K 来自原文。</span></div>
          </section>

          <span className="tr-cross17-multiply" aria-hidden="true">×</span>

          <section className="tr-cross17-panel tr-cross17-v" aria-label="原文 Value 矩阵 V">
            <h3>V：原文信息矩阵</h3>
            <div className="tr-cross17-axis">列：向量维度</div>
            <div className="tr-cross17-matrix tr-cross17-matrix-vector">
              <span aria-hidden="true"/>
              {shownDimensions.map((dimension, index) => dimension === null
            ? <span className="tr-cross17-ellipsis" aria-hidden="true" key="ellipsis">···</span>
            : <button type="button" className={`tr-cross17-column-label${selectedColumn === dimension ? ' is-selected' : ''}`} data-cross17-v-column={dimension} aria-label={`选择 ${dimensionLabel(dimension)}`} onClick={() => setSelectedColumn(dimension)} key={index}>{dimensionSymbol(dimension)}</button>)}
              {source.map((token, row) => <div className="tr-cross17-row" key={token}>
                <span className="tr-cross17-row-label">{token}</span>
                {shownDimensions.map((dimension, index) => dimension === null
                ? <span className="tr-cross17-ellipsis" aria-hidden="true" key="ellipsis">···</span>
                : <button type="button" className={`tr-cross17-vector-cell${selectedColumn === dimension ? ' is-selected' : ''}`} data-cross17-v-column={dimension} aria-label={`${token} 的 ${dimensionLabel(dimension)}`} onClick={() => setSelectedColumn(dimension)} key={index}>{selectedColumn === dimension ? value[row][dimension].toFixed(1) : null}</button>)}
              </div>)}
            </div>
            <div className="tr-cross17-dimension">4 × 64 / 头</div>
            <div className="tr-cross17-panel-note"><b>V = H<sub>enc</sub>W<sub>V</sub></b><span>每行提供一个原文位置的信息。</span></div>
          </section>

          <span className="tr-cross17-equals" aria-hidden="true">=</span>

          <section className="tr-cross17-panel tr-cross17-c" aria-label="单头交叉注意力输出 C">
            <h3>C：单头汇聚结果</h3>
            <div className="tr-cross17-axis">列：向量维度</div>
            <div className="tr-cross17-matrix tr-cross17-matrix-vector">
              <span aria-hidden="true"/>
              {shownDimensions.map((dimension, index) => dimension === null
            ? <span className="tr-cross17-ellipsis" aria-hidden="true" key="ellipsis">···</span>
            : <span className="tr-cross17-column-label" key={index}>{dimensionSymbol(dimension)}</span>)}
              {target.map((token, row) => <div className="tr-cross17-row" key={token}>
                <span className="tr-cross17-row-label">{token}</span>
                {shownDimensions.map((dimension, index) => dimension === null
                ? <span className="tr-cross17-ellipsis" aria-hidden="true" key="ellipsis">···</span>
                : <button type="button" className={`tr-cross17-result-cell${selectedRow === row && selectedColumn === dimension ? ' is-selected' : ''}`} data-cross17-c-row={row} data-cross17-c-column={dimension} aria-label={`${token} 的 ${dimensionLabel(dimension)}，汇聚值 ${result[row][dimension].toFixed(3)}`} onClick={() => { setSelectedRow(row); setSelectedColumn(dimension); }} key={index}>{selectedRow === row && selectedColumn === dimension ? result[row][dimension].toFixed(3) : null}</button>)}
              </div>)}
            </div>
            <div className="tr-cross17-dimension">4 × 64 / 头</div>
            <div className="tr-cross17-panel-note"><b>C = AV</b><span>单头 64 维，多头融合后 512 维。</span></div>
          </section>
        </div>

        </section>
        <section className="tr-cross17-calculation" aria-live="polite" aria-label="选中结果格的加权计算">
          <div className="tr-cross17-calculation-heading"><strong>{target[selectedRow]} · 第 {selectedColumn + 1} 维</strong><span>C<sub>{selectedRow + 1},{selectedColumn + 1}</sub> = ∑<sub>j=1</sub><sup>4</sup> A<sub>{selectedRow + 1},j</sub> V<sub>j,{selectedColumn + 1}</sub></span><small>教学数值，非模型实测；A 每行之和为 1。</small></div>
          <div className="tr-cross17-sum">{source.map((token, j) => <div className="tr-cross17-sum-item" key={token}>{j > 0 && <i>＋</i>}<span><b>{weights[selectedRow][j].toFixed(2)}</b><em>×</em><strong>{value[j][selectedColumn].toFixed(1)}</strong></span></div>)}<i>=</i><output>{result[selectedRow][selectedColumn].toFixed(3)}</output></div>
        </section>
      </main>

      <footer className="tr-cross17-footer">

        <Button variant="primary" onClick={onComplete}>继续：向量怎样变成下一个词？</Button>
      </footer>
    </section>
  </LessonPageFrame>;
}
