import { Fragment, useState } from 'react';
import { Button, Typography } from '../../../shared/react';
import { LessonPageFrame } from '../LessonPageFrame';
import './PositionEncodingCard.css';
interface PositionEncodingCardProps {
    onComplete: () => void;
}
const positions = [0, 1, 2];
const dimensions = [0, 1, 2, 3, 510, 511];
function valueAt(pos: number, dim: number) {
    const i = Math.floor(dim / 2);
    const angle = pos / 10000 ** ((2 * i) / 512);
    return dim % 2 === 0 ? Math.sin(angle) : Math.cos(angle);
}
export function PositionEncodingCard({ onComplete }: PositionEncodingCardProps) {
    const [filled, setFilled] = useState<Record<string, number>>({});
    const [selected, setSelected] = useState<{
        pos: number;
        dim: number;
    }>({ pos: 0, dim: 0 });
    const calculateCell = (pos: number, dim: number) => {
        const key = `${pos}-${dim}`;
        setFilled((current) => ({ ...current, [key]: valueAt(pos, dim) }));
        setSelected({ pos, dim });
    };
    const hasCalculated = Object.keys(filled).length > 0;
    const allCalculated = Object.keys(filled).length === positions.length * dimensions.length;
    const generateRemaining = () => {
        setFilled(current => {
            const next = { ...current };
            positions.forEach(pos => dimensions.forEach(dim => {
                const key = `${pos}-${dim}`;
                if (next[key] === undefined)
                    next[key] = valueAt(pos, dim);
            }));
            return next;
        });
    };
    const clearExample = () => {
        setFilled({});
        setSelected({ pos: 0, dim: 0 });
    };
    const selectedPair = selected ? Math.floor(selected.dim / 2) : 0;
    const selectedFn = selected && selected.dim % 2 === 0 ? 'sin' : 'cos';
    return (<LessonPageFrame>
      <section className="tr-pe-guide" aria-labelledby="tr-pe-guide-title">
        <header className="tr-lesson-header tr-pe-guide__header">
          <Typography id="tr-pe-guide-title" as="h1" variant="display" tone="accent">位置编码：用正余弦记录顺序</Typography>
          <Typography as="p" variant="subtitle" tone="muted">点击任意空白格，将位置 pos 和维度组 i 代入公式，生成一个位置编码值。</Typography>
        </header>

        <main className="tr-pe-guide__main">
          <section className="tr-pe-table-card" aria-label="位置编码表格">
            <table className="tr-pe-table">
              <thead>
                <tr><th className="tr-pe-pos-head" rowSpan={2}>pos <span>（词在句中的位置）</span></th><th className="tr-pe-i-head" colSpan={2}>i = 0 <span>（第 0 组维度）</span></th><th className="tr-pe-i-head" colSpan={2}>i = 1 <span>（第 1 组维度）</span></th><th className="is-gap" rowSpan={2}>…</th><th className="tr-pe-i-head" colSpan={2}>i = 255 <span>（第 255 组维度）</span></th></tr>
                <tr><th className="is-sin">第0维　sin</th><th className="is-cos">第1维　cos</th><th className="is-sin">第2维　sin</th><th className="is-cos">第3维　cos</th><th className="is-sin">第510维　sin</th><th className="is-cos">第511维　cos</th></tr>
              </thead>
              <tbody>
                {positions.map((pos) => (<tr className={selected?.pos === pos ? 'is-row-selected' : ''} key={pos}>
                    <th className="tr-pe-pos">{pos}</th>
                    {dimensions.map((dim, index) => {
                const key = `${pos}-${dim}`;
                const isSelected = selected?.pos === pos && selected.dim === dim;
                return <Fragment key={key}>
                        {index === 4 && <td className="is-gap" key={`gap-${pos}`}>…</td>}
                        <td className={dim % 2 === 0 ? 'is-sin' : 'is-cos'}>
                          <button className={isSelected ? 'is-selected' : ''} type="button" onClick={() => calculateCell(pos, dim)} aria-label={`位置${pos}，第${dim}维，点击计算`}>
                            {filled[key] === undefined ? '' : filled[key].toFixed(4)}
                          </button>
                        </td>
                      </Fragment>;
            })}
                  </tr>))}
              </tbody>
            </table>
          </section>

          <section className="tr-pe-lower">
            <div className="tr-pe-formula-card" aria-live="polite">
              <span>计算公式</span>
              <div className="tr-pe-general">偶数维： PE(pos, 2i) = sin( pos / 10000<sup>2i / d<sub>model</sub></sup> )</div>
              <div className="tr-pe-general">奇数维： PE(pos, 2i+1) = cos( pos / 10000<sup>2i / d<sub>model</sub></sup> )</div>
              {selected && <div className="tr-pe-substitution">
                PE(<b>{selected.pos}</b>, <b>{selected.dim}</b>) = {selectedFn}( <b>{selected.pos}</b> / 10000<sup>2×<i>{selectedPair}</i> / <i>512</i></sup> ) ≈ <strong>{valueAt(selected.pos, selected.dim).toFixed(6)}</strong>
              </div>}
            </div>
          </section>
        </main>

        <footer className="tr-pe-guide__footer">
          <span className="tr-pe-example-note">仅展示部分维度</span>
          <div className="tr-pe-table-actions">
            <Button className="tr-pe-table-action" disabled={allCalculated} onClick={generateRemaining}>生成其余示例值</Button>
            <Button className="tr-pe-table-action" disabled={!hasCalculated} onClick={clearExample}>清空示例表</Button>
            {hasCalculated && <Button className="tr-pe-next" variant="primary" onClick={onComplete}>继续：这种编码好在哪里？</Button>}
          </div>
        </footer>
      </section>
    </LessonPageFrame>);
}
