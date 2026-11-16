import { useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { Button } from "@shuku/course-style/react/controls/Button";
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
    <section shuku-edit-id="e-dd1cc5ce-2465-4f78-8dda-6d2a58a3461e" className="tr-cross17-page">
      <header shuku-edit-id="e-78640f1d-3b79-4125-9679-76d7125904cf" className="tr-lesson-header tr-cross17-header">
        <h2 shuku-edit-id="e-83786c10-fc60-4d20-9b3a-9d2f95e4636c">交叉注意力：译文怎样读取原文？</h2>
        <p shuku-edit-id="e-dc6a4c01-1c52-4572-a128-99612a5ef0ec">点 A 的一行，再点 V 的一列，查看下方对应结果格的加权算式。</p>
      </header>

      <main shuku-edit-id="e-e8c4148b-d4d8-41fd-999c-ba71fcfbb050" className="tr-cross17-body" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
        <section shuku-edit-id="e-f9b4f5e0-c813-47cf-83c3-6cb91ffb73bc" className="tr-cross17-workspace" aria-label="选择矩阵行列并观察汇聚">
        <div shuku-edit-id="e-577a4712-8ac7-48f2-b7c8-382ba07dffae" className="tr-cross17-guide"><span shuku-edit-id="e-3f790ffa-f646-4354-a65b-848666199823">原文：I love deep learning.</span><i shuku-edit-id="e-1624c2b2-9a2a-4bb5-99d2-ec0b39dcb7e6">→</i><span shuku-edit-id="e-0747fc20-7f24-442e-b1f2-6e66c72fb7df">已生成：〈开始〉我 爱 深度</span><i shuku-edit-id="e-959886ae-c245-4656-8879-36b856df6a7e">→</i><strong shuku-edit-id="e-6bddba19-653d-4f1f-b0c5-d230f47eab44">下一词：学习</strong></div>
        <div shuku-edit-id="e-47c42b0f-0349-4ba4-8876-59c2c33eb947" className="tr-cross17-panels">
          <section shuku-edit-id="e-3bcb5220-4e66-4ab3-98f2-1915cd38da83" className="tr-cross17-panel tr-cross17-a" aria-label="注意力权重矩阵 A">
            <h3 shuku-edit-id="e-4bbd59cc-64f0-4b63-9468-433b54323a34">A：注意力权重</h3>
            <div shuku-edit-id="e-d918d0b9-214b-44a1-883a-1e0fca308f84" className="tr-cross17-axis">原文 <strong shuku-edit-id="e-6b1457fa-7877-466b-970d-dc2a7f638f16">K</strong></div>
            <div shuku-edit-id="e-53315367-bad8-48cd-a0ed-e6cd36939e69" className="tr-cross17-matrix tr-cross17-matrix-a">
              <span shuku-edit-id="e-9cffc0d4-b541-451b-a99f-64556bd62e90" className="tr-cross17-corner">译文 <strong shuku-edit-id="e-f158502c-425a-41b7-934b-0a086ffca13b">Q</strong></span>
              {source.map((token) => <span shuku-edit-id="e-6cec8f92-10e7-468e-b56e-4270ae841c28" className="tr-cross17-column-label" key={token}>{token}</span>)}
              {target.map((token, row) => <div shuku-edit-id="e-0ab809c8-12c2-444c-b49d-5e1a9097d443" className="tr-cross17-row" key={token}>
                <button shuku-edit-id="e-5f15ddcb-38ec-4a68-b37d-9e9ac86039fc" type="button" className={`tr-cross17-row-label${selectedRow === row ? ' is-selected' : ''}`} data-cross17-a-row={row} aria-label={`选择 ${token} 的注意力权重`} onClick={() => setSelectedRow(row)}>{token}</button>
                {weights[row].map((weight, column) => <button shuku-edit-id="e-3be915be-8a60-439e-bb8a-6ae874c1bd0b" type="button" className={`tr-cross17-weight-cell${selectedRow === row ? ' is-selected' : ''}`} data-cross17-a-row={row} aria-label={`${token} 对 ${source[column]} 的注意力权重 ${Math.round(weight * 100)}%`} onClick={() => setSelectedRow(row)} style={{ '--cross17-dot': `${Math.round(7 + Math.sqrt(weight) * 24)}px` } as CSSProperties} key={column}>{selectedRow === row ? <b shuku-edit-id="e-016d8313-fa5e-44dc-8b56-accb5702be8b">{weight.toFixed(2)}</b> : <span shuku-edit-id="e-db507ee8-5303-4d2c-8ba8-a1824da51fde" aria-hidden="true"/>}</button>)}
              </div>)}
            </div>
            <div shuku-edit-id="e-2d384a94-25df-45bc-86da-14c7e3ee9f92" className="tr-cross17-dimension">4 × 4 / 头</div>
            <div shuku-edit-id="e-2832a5e9-ff5c-428f-9749-e44129bc4f6a" className="tr-cross17-panel-note"><b shuku-edit-id="e-bb0ecbbf-f363-474b-bbd7-c06df49465d8">A = Softmax(QKᵀ / √64)</b><span shuku-edit-id="e-92d6540a-7ec8-4f8a-af43-fa334764ffdb">Q 来自译文，K 来自原文。</span></div>
          </section>

          <span shuku-edit-id="e-527264b8-08ac-4ce9-b3dc-de2d2874d51d" className="tr-cross17-multiply" aria-hidden="true">×</span>

          <section shuku-edit-id="e-cca18037-af60-48af-91cb-aa3e747c72e9" className="tr-cross17-panel tr-cross17-v" aria-label="原文 Value 矩阵 V">
            <h3 shuku-edit-id="e-91ac2e0e-f6eb-44bd-9314-9b4870c0e7bb">V：原文信息矩阵</h3>
            <div shuku-edit-id="e-4aebeb45-7826-4a1f-aab4-23c64ee66147" className="tr-cross17-axis">列：向量维度</div>
            <div shuku-edit-id="e-1076104e-69cd-4ca0-b30c-44590fa83150" className="tr-cross17-matrix tr-cross17-matrix-vector">
              <span shuku-edit-id="e-69b8fe21-5eba-4262-a40e-f0534eab655d" aria-hidden="true"/>
              {shownDimensions.map((dimension, index) => dimension === null
            ? <span shuku-edit-id="e-713e701d-375f-4665-889b-c45fa9e111cd" className="tr-cross17-ellipsis" aria-hidden="true" key="ellipsis">···</span>
            : <button shuku-edit-id="e-f083f092-298e-4aa0-b1a8-fc7eb38533c7" type="button" className={`tr-cross17-column-label${selectedColumn === dimension ? ' is-selected' : ''}`} data-cross17-v-column={dimension} aria-label={`选择 ${dimensionLabel(dimension)}`} onClick={() => setSelectedColumn(dimension)} key={index}>{dimensionSymbol(dimension)}</button>)}
              {source.map((token, row) => <div shuku-edit-id="e-98684e5a-89c5-463c-a389-ef620343a0e9" className="tr-cross17-row" key={token}>
                <span shuku-edit-id="e-dd6e54c6-aee2-4f8d-91ea-f5c56469d72e" className="tr-cross17-row-label">{token}</span>
                {shownDimensions.map((dimension, index) => dimension === null
                ? <span shuku-edit-id="e-c948c77a-7101-4bd8-a448-d791d579aab7" className="tr-cross17-ellipsis" aria-hidden="true" key="ellipsis">···</span>
                : <button shuku-edit-id="e-09ab885d-eccb-4c8e-a8d8-ad64302ea754" type="button" className={`tr-cross17-vector-cell${selectedColumn === dimension ? ' is-selected' : ''}`} data-cross17-v-column={dimension} aria-label={`${token} 的 ${dimensionLabel(dimension)}`} onClick={() => setSelectedColumn(dimension)} key={index}>{selectedColumn === dimension ? value[row][dimension].toFixed(1) : null}</button>)}
              </div>)}
            </div>
            <div shuku-edit-id="e-348e4d1e-3098-432b-97ca-487e4dd856fb" className="tr-cross17-dimension">4 × 64 / 头</div>
            <div shuku-edit-id="e-9106bc32-39eb-48a5-9238-d1f1639010ae" className="tr-cross17-panel-note"><b shuku-edit-id="e-9635ae23-3c43-436d-9d7e-c7d879acebde">V = H<sub shuku-edit-id="e-165affc3-188c-44c1-a709-e7cf32fcabdc">enc</sub>W<sub shuku-edit-id="e-1364bba4-c893-4a24-9979-87c83ce8cd39">V</sub></b><span shuku-edit-id="e-e5769012-e4b0-40ef-b200-7421e7161940">每行提供一个原文位置的信息。</span></div>
          </section>

          <span shuku-edit-id="e-467c3fe8-fd6b-477f-92d4-0995188d2e57" className="tr-cross17-equals" aria-hidden="true">=</span>

          <section shuku-edit-id="e-40f2601b-11f8-48fd-b3a8-c82a86d209cc" className="tr-cross17-panel tr-cross17-c" aria-label="单头交叉注意力输出 C">
            <h3 shuku-edit-id="e-133c5f05-815a-420e-91bc-7a690fe4772f">C：单头汇聚结果</h3>
            <div shuku-edit-id="e-3fa8de93-008d-4490-941e-559def9cca03" className="tr-cross17-axis">列：向量维度</div>
            <div shuku-edit-id="e-389564ea-cce1-4843-8075-318ab27e46b0" className="tr-cross17-matrix tr-cross17-matrix-vector">
              <span shuku-edit-id="e-d0b93364-2c8a-47b7-84ad-92acd7039132" aria-hidden="true"/>
              {shownDimensions.map((dimension, index) => dimension === null
            ? <span shuku-edit-id="e-9379575e-ab62-44ac-8a57-febf3b056445" className="tr-cross17-ellipsis" aria-hidden="true" key="ellipsis">···</span>
            : <span shuku-edit-id="e-e833a177-39e7-4f95-adf9-a00e93807d7f" className="tr-cross17-column-label" key={index}>{dimensionSymbol(dimension)}</span>)}
              {target.map((token, row) => <div shuku-edit-id="e-e1a26a32-e2d0-42d7-8923-aabcbe1ca475" className="tr-cross17-row" key={token}>
                <span shuku-edit-id="e-1153798d-f262-4ea6-bed0-d436b5c9c96c" className="tr-cross17-row-label">{token}</span>
                {shownDimensions.map((dimension, index) => dimension === null
                ? <span shuku-edit-id="e-fbd5edb1-ade8-4bab-b8f0-df529c801511" className="tr-cross17-ellipsis" aria-hidden="true" key="ellipsis">···</span>
                : <button shuku-edit-id="e-f3f59418-fb4d-422d-a574-e0465b79749f" type="button" className={`tr-cross17-result-cell${selectedRow === row && selectedColumn === dimension ? ' is-selected' : ''}`} data-cross17-c-row={row} data-cross17-c-column={dimension} aria-label={`${token} 的 ${dimensionLabel(dimension)}，汇聚值 ${result[row][dimension].toFixed(3)}`} onClick={() => { setSelectedRow(row); setSelectedColumn(dimension); }} key={index}>{selectedRow === row && selectedColumn === dimension ? result[row][dimension].toFixed(3) : null}</button>)}
              </div>)}
            </div>
            <div shuku-edit-id="e-1c5d40bd-0c36-43a9-b316-b5586514230d" className="tr-cross17-dimension">4 × 64 / 头</div>
            <div shuku-edit-id="e-587a9682-b6e7-4990-aa34-2b9dc93a1ec7" className="tr-cross17-panel-note"><b shuku-edit-id="e-ddef8263-1547-4fc8-861e-449c35aef5dc">C = AV</b><span shuku-edit-id="e-774572e5-9ceb-4f2a-8d3b-c34c5f44150b">单头 64 维，多头融合后 512 维。</span></div>
          </section>
        </div>

        </section>
        <section shuku-edit-id="e-368cf688-f382-4cfe-ac7f-75aefcc85b39" className="tr-cross17-calculation" aria-live="polite" aria-label="选中结果格的加权计算">
          <div shuku-edit-id="e-61156996-915b-4bca-99a7-887f21551ce0" className="tr-cross17-calculation-heading"><strong shuku-edit-id="e-26b34407-3d9f-4f62-bb40-230d717933c6">{target[selectedRow]} · 第 {selectedColumn + 1} 维</strong><span shuku-edit-id="e-de4b3ba9-71a7-46f1-8661-4965388bfebc">C<sub shuku-edit-id="e-adb38083-0b25-443e-ae12-e2bddb931075">{selectedRow + 1},{selectedColumn + 1}</sub> = ∑<sub shuku-edit-id="e-52ec4244-08cf-4227-8fef-43e367e7d98a">j=1</sub><sup shuku-edit-id="e-9f06cd02-8a13-4a76-aa81-7da1d60daa99">4</sup> A<sub shuku-edit-id="e-79dc3208-2a95-4d09-8d42-3b571d59846a">{selectedRow + 1},j</sub> V<sub shuku-edit-id="e-2c0c02b0-da47-410b-992a-6c71e8ea5cfa">j,{selectedColumn + 1}</sub></span><small shuku-edit-id="e-2e52eded-ccc2-4343-b99c-80d2e8cf8eb0">教学数值，非模型实测；A 每行之和为 1。</small></div>
          <div shuku-edit-id="e-53e44de9-df70-4e2d-bb18-4e60492977af" className="tr-cross17-sum">{source.map((token, j) => <div shuku-edit-id="e-2622451e-aaee-42da-8e1c-529fd3bde1ec" className="tr-cross17-sum-item" key={token}>{j > 0 && <i shuku-edit-id="e-85b5fb55-6297-4b95-9921-530f96e36537">＋</i>}<span shuku-edit-id="e-c38fe625-e771-4293-88d7-c26eb21499a6"><b shuku-edit-id="e-c63088ec-d843-42ed-becc-21c49c1a4cd8">{weights[selectedRow][j].toFixed(2)}</b><em shuku-edit-id="e-df1d60f3-35e7-4e15-b0bd-eb5b718712b3">×</em><strong shuku-edit-id="e-04dbbca3-60bb-4c47-b2d7-9c8a5bbf6ba0">{value[j][selectedColumn].toFixed(1)}</strong></span></div>)}<i shuku-edit-id="e-87332aa2-223b-47d0-ba37-a18bba873c75">=</i><output shuku-edit-id="e-457bd368-c757-47ff-8dbc-111844d8974c">{result[selectedRow][selectedColumn].toFixed(3)}</output></div>
        </section>
      </main>

      <footer shuku-edit-id="e-7d79f998-e67c-49ae-a9a0-dcc9c9d3558a" className="tr-cross17-footer">

        <Button variant="primary" onClick={onComplete}>继续：向量怎样变成下一个词？</Button>
      </footer>
    </section>
  </LessonPageFrame>;
}
