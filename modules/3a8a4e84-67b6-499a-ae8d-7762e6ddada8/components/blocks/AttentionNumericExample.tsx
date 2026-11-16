import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { WORDS, QUERIES, KEYS, SCORES, WEIGHTS, INPUTS, VALUES, OUTPUTS } from '../../domain/attentionMatrixExample';
import './AttentionNumericExample.css';
export function NumericCellHint({ text = '点圆圈，看数字' }: {
    text?: string;
}) {
    return <span shuku-edit-id="e-4e438c59-a10e-4597-8f4d-92686d0df608" className="tr-num-cell-hint">{text}<svg shuku-edit-id="e-72479894-e80a-4664-801a-bac49737327d" viewBox="0 0 130 76" aria-hidden="true"><path shuku-edit-id="e-c315926e-50c1-4aa8-ab0b-18402471ede9" d="M9 65 C51 70 113 52 110 12 M102 22 Q107 17 110 10 L119 21"/></svg></span>;
}
export type NumericAnchor = {
    x: number;
    y: number;
    width: number;
    height: number;
};
export function numericAnchorFor(element: HTMLElement): NumericAnchor {
    const page = element.closest('.tr-ks-page,.tr-va-page')!.getBoundingClientRect();
    const cell = element.getBoundingClientRect();
    const scale = 1600 / page.width;
    return { x: (cell.left - page.left) * scale, y: (cell.top - page.top) * scale, width: cell.width * scale, height: cell.height * scale };
}
export function AttentionNumericExample({ mode, initialRow: row = 5, initialColumn: column = 0, anchor, onClose }: {
    mode: 'scores' | 'weights' | 'projection' | 'aggregation';
    initialRow?: number;
    initialColumn?: number;
    anchor: NumericAnchor;
    onClose: () => void;
}) {
    const paper = useRef<HTMLElement>(null);
    const [position, setPosition] = useState<{
        left: number;
        top: number;
    } | null>(null);
    const width = mode === 'aggregation' ? 940 : mode === 'projection' ? 720 : 590;
    useLayoutEffect(() => {
        if (!paper.current)
            return;
        const height = paper.current.offsetHeight;
        const gap = 18, edge = 20;
        const clamp = (n: number, max: number) => Math.max(edge, Math.min(n, max - edge));
        let left: number, top: number;
        if (1600 - anchor.x - anchor.width >= width + gap + edge) {
            left = anchor.x + anchor.width + gap;
            top = clamp(anchor.y + anchor.height / 2 - height / 2, 900 - height);
        }
        else if (anchor.x >= width + gap + edge) {
            left = anchor.x - width - gap;
            top = clamp(anchor.y + anchor.height / 2 - height / 2, 900 - height);
        }
        else {
            left = clamp(anchor.x + anchor.width / 2 - width / 2, 1600 - width);
            top = anchor.y >= height + gap + edge ? anchor.y - height - gap : anchor.y + anchor.height + gap;
        }
        setPosition({ left, top });
    }, [anchor, mode, width]);
    const matching = mode === 'scores' || mode === 'weights';
    const dot = matching ? QUERIES[row].reduce((sum, x, d) => sum + x * KEYS[column][d], 0) : 0;
    const denominator = SCORES[row].reduce((sum, s) => sum + Math.exp(s), 0);
    const other = (column + 17) % 512;
    useEffect(() => { const handler = (event: KeyboardEvent) => { if (event.key === 'Escape')
        onClose(); }; document.addEventListener('keydown', handler); return () => document.removeEventListener('keydown', handler); }, [onClose]);
    return <div shuku-edit-id="e-9108a039-e180-4745-9b02-8b2b6fc3419f" className="tr-num-overlay tr-num-anchored"><section shuku-edit-id="e-87791a92-0934-4069-a5a3-c704dc99cad7" ref={paper} style={{ width, left: position?.left ?? 20, top: position?.top ?? 20, visibility: position ? 'visible' : 'hidden' }} className={`tr-num-paper tr-num-compact is-${mode}`} role="dialog" aria-label="这一格的数字计算" onClick={event => event.stopPropagation()}>
    <header shuku-edit-id="e-b47a0038-8e24-4155-862d-6621d196eb00" className="tr-num-heading"><h2 shuku-edit-id="e-ad8fb6b1-ddf4-40a0-a71d-0043a649a5ad">{matching ? <>{WORDS[row]} → {WORDS[column]}<small shuku-edit-id="e-436320df-c8d3-4c4c-92b7-ed07e1dc9149">{mode === 'scores' ? '匹配分数' : '关注权重'}</small></> : <>{WORDS[row]} · 第 {column + 1} 维<small shuku-edit-id="e-5872046d-369e-4bb3-ab48-b4781a42b31d">{mode === 'projection' ? '值向量 V' : '汇聚结果 Z'}</small></>}</h2><button shuku-edit-id="e-5af39bca-bb8e-404c-a262-8ea0339b2917" autoFocus type="button" aria-label="关闭数字示例" onClick={onClose}>×</button></header>
    {mode === 'scores' && <><div shuku-edit-id="e-479ef1ea-2038-494a-a331-82705d6ffeba" className="tr-num-simple-symbol">s<sub shuku-edit-id="e-aa3b16be-daa8-4026-b109-89c6a34865bf">{row + 1},{column + 1}</sub> = (q<sub shuku-edit-id="e-a7ba60a7-3d4e-45ef-a158-2a6b7ba1275c">{row + 1}</sub> · k<sub shuku-edit-id="e-806740ee-1daf-48a7-a731-e27709b895f4">{column + 1}</sub>) / √512</div><div shuku-edit-id="e-8c053496-c1d1-4e51-b23b-f7c8036a456c" className="tr-num-simple-result">{dot.toFixed(4)} ÷ √512 ≈ <strong shuku-edit-id="e-3bbde3e1-2f28-45fd-9818-74ba125ea38e">{SCORES[row][column].toFixed(4)}</strong></div></>}
    {mode === 'weights' && <><div shuku-edit-id="e-e1d1964e-1a66-47d2-a5e0-58ee76b0bdfe" className="tr-num-simple-symbol">a<sub shuku-edit-id="e-ffb52016-eebd-4971-b1be-9ec9d38493f7">{row + 1},{column + 1}</sub> = exp(s<sub shuku-edit-id="e-69914a3c-816c-4ecc-a1e6-aa9f073acfb0">{row + 1},{column + 1}</sub>) / ∑<sub shuku-edit-id="e-e84e893a-840e-4312-a98a-5d4710217df6">j=1</sub><sup shuku-edit-id="e-5bcd7756-8737-45d7-b47b-182ad50d5e72">6</sup> exp(s<sub shuku-edit-id="e-02b9aef8-c864-4019-b328-654d2b9605f3">{row + 1},j</sub>)</div><div shuku-edit-id="e-1ee8d862-c7ee-4c3c-8a08-7483e765fae1" className="tr-num-simple-result">exp({SCORES[row][column].toFixed(4)}) ÷ {denominator.toFixed(4)} ≈ <strong shuku-edit-id="e-0c518955-8c42-4b80-b096-b575e349b564">{WEIGHTS[row][column].toFixed(4)}</strong></div><p shuku-edit-id="e-12a6f284-46ed-4df9-b785-aa7c593d2ee1" className="tr-num-mini-note">分母是这一行六个分数取指数后的总和。</p></>}
    {mode === 'projection' && <><div shuku-edit-id="e-1f7cf71f-9749-4640-acd3-02818f18762b" className="tr-num-simple-symbol">v<sub shuku-edit-id="e-8b710192-d7ad-48d0-94f5-ab1769ba7d5d">{row + 1},{column + 1}</sub> = 0.65x<sub shuku-edit-id="e-99f63185-36f3-44ac-b39f-9707ef57e879">{row + 1},{column + 1}</sub> + 0.35x<sub shuku-edit-id="e-3749a95f-d8a9-4399-ac6a-c179be6309d4">{row + 1},{other + 1}</sub></div><div shuku-edit-id="e-bc9eb839-17dc-40b1-8bfa-60c21ad88829" className="tr-num-simple-result">0.65 × ({INPUTS[row][column].toFixed(3)}) + 0.35 × ({INPUTS[row][other].toFixed(3)}) ≈ <strong shuku-edit-id="e-0c71c73b-3f85-4110-8ebe-280464afd151">{VALUES[row][column].toFixed(4)}</strong></div></>}
    {mode === 'aggregation' && <><div shuku-edit-id="e-a9bdb11d-d6af-4c8d-bb4f-5f2338b5671e" className="tr-num-simple-symbol">z<sub shuku-edit-id="e-dec1b061-5069-47cd-a81f-84734be8457b">{row + 1},{column + 1}</sub> = ∑<sub shuku-edit-id="e-19062004-8a72-42b2-ac9a-fec345ac3bbe">j=1</sub><sup shuku-edit-id="e-027e3b27-f99a-485b-b8af-6aaa92e296e7">6</sup> a<sub shuku-edit-id="e-570a426d-9689-42ed-9b1b-a83754920667">{row + 1},j</sub>v<sub shuku-edit-id="e-5ae77a4a-463f-42c6-80e1-99248fa1e39c">j,{column + 1}</sub></div><div shuku-edit-id="e-28fe379c-6099-4a56-9acb-d3844b49e93e" className="tr-num-scalar-sum">{WORDS.map((word, j) => <span shuku-edit-id="e-1e6f930a-5ec3-41ae-ae09-68d2ef91bd31" key={word}>{j > 0 && <i shuku-edit-id="e-af06a780-fe8b-4214-a6b1-c2604a755591">＋</i>}<b shuku-edit-id="e-7c347a39-6ff8-4539-9409-93069a686d1a">{WEIGHTS[row][j].toFixed(3)}</b> × ({VALUES[j][column].toFixed(3)})</span>)}<strong shuku-edit-id="e-5ee04402-308e-490e-b1d7-46ed942aa2b5">≈ {OUTPUTS[row][column].toFixed(4)}</strong></div></>}
    <footer shuku-edit-id="e-977f50f3-0c0b-4135-ae7f-37415937e046">教学示例；数值已四舍五入。</footer>
  </section></div>;
}
