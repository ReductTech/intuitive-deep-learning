import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { WORDS, QUERIES, KEYS, SCORES, WEIGHTS, INPUTS, VALUES, OUTPUTS } from '../../domain/attentionMatrixExample';
import './AttentionNumericExample.css';
export function NumericCellHint({ text = '点圆圈，看数字' }: {
    text?: string;
}) {
    return <span className="tr-num-cell-hint">{text}<svg viewBox="0 0 130 76" aria-hidden="true"><path d="M9 65 C51 70 113 52 110 12 M102 22 Q107 17 110 10 L119 21"/></svg></span>;
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
    return <div className="tr-num-overlay tr-num-anchored"><section ref={paper} style={{ width, left: position?.left ?? 20, top: position?.top ?? 20, visibility: position ? 'visible' : 'hidden' }} className={`tr-num-paper tr-num-compact is-${mode}`} role="dialog" aria-label="这一格的数字计算" onClick={event => event.stopPropagation()}>
    <header className="tr-num-heading"><h2>{matching ? <>{WORDS[row]} → {WORDS[column]}<small>{mode === 'scores' ? '匹配分数' : '关注权重'}</small></> : <>{WORDS[row]} · 第 {column + 1} 维<small>{mode === 'projection' ? '值向量 V' : '汇聚结果 Z'}</small></>}</h2><button autoFocus type="button" aria-label="关闭数字示例" onClick={onClose}>×</button></header>
    {mode === 'scores' && <><div className="tr-num-simple-symbol">s<sub>{row + 1},{column + 1}</sub> = (q<sub>{row + 1}</sub> · k<sub>{column + 1}</sub>) / √512</div><div className="tr-num-simple-result">{dot.toFixed(4)} ÷ √512 ≈ <strong>{SCORES[row][column].toFixed(4)}</strong></div></>}
    {mode === 'weights' && <><div className="tr-num-simple-symbol">a<sub>{row + 1},{column + 1}</sub> = exp(s<sub>{row + 1},{column + 1}</sub>) / ∑<sub>j=1</sub><sup>6</sup> exp(s<sub>{row + 1},j</sub>)</div><div className="tr-num-simple-result">exp({SCORES[row][column].toFixed(4)}) ÷ {denominator.toFixed(4)} ≈ <strong>{WEIGHTS[row][column].toFixed(4)}</strong></div><p className="tr-num-mini-note">分母是这一行六个分数取指数后的总和。</p></>}
    {mode === 'projection' && <><div className="tr-num-simple-symbol">v<sub>{row + 1},{column + 1}</sub> = 0.65x<sub>{row + 1},{column + 1}</sub> + 0.35x<sub>{row + 1},{other + 1}</sub></div><div className="tr-num-simple-result">0.65 × ({INPUTS[row][column].toFixed(3)}) + 0.35 × ({INPUTS[row][other].toFixed(3)}) ≈ <strong>{VALUES[row][column].toFixed(4)}</strong></div></>}
    {mode === 'aggregation' && <><div className="tr-num-simple-symbol">z<sub>{row + 1},{column + 1}</sub> = ∑<sub>j=1</sub><sup>6</sup> a<sub>{row + 1},j</sub>v<sub>j,{column + 1}</sub></div><div className="tr-num-scalar-sum">{WORDS.map((word, j) => <span key={word}>{j > 0 && <i>＋</i>}<b>{WEIGHTS[row][j].toFixed(3)}</b> × ({VALUES[j][column].toFixed(3)})</span>)}<strong>≈ {OUTPUTS[row][column].toFixed(4)}</strong></div></>}
    <footer>教学示例；数值已四舍五入。</footer>
  </section></div>;
}
