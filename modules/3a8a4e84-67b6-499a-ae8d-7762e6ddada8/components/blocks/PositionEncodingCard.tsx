import { Fragment, useState } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
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
      <section shuku-edit-id="e-5983bddc-7cdf-4eec-b593-187dd5aac030" className="tr-pe-guide" aria-labelledby="tr-pe-guide-title">
        <header shuku-edit-id="e-472be41f-6c7d-4c67-b6ab-ccc176050224" className="tr-lesson-header tr-pe-guide__header">
          <Typography shuku-edit-id="e-1ddaf470-2b57-4545-927c-fa6d578a17cc" id="tr-pe-guide-title" as="h1" variant="display" tone="accent">位置编码：用正余弦记录顺序</Typography>
          <Typography shuku-edit-id="e-f7a77bcf-8215-4d5d-b9cf-9b028b0e233b" as="p" variant="subtitle" tone="muted">点击任意空白格，将位置 pos 和维度组 i 代入公式，生成一个位置编码值。</Typography>
        </header>

        <main shuku-edit-id="e-a4c71532-ad43-440b-8960-4bcb2d6c9e6b" className="tr-pe-guide__main">
          <section shuku-edit-id="e-12004ca7-61bb-48b1-9ce3-264c2f27e1b4" className="tr-pe-table-card" aria-label="位置编码表格">
            <table shuku-edit-id="e-c6492ca0-9dac-4c40-b5a6-ffabcae87b55" className="tr-pe-table">
              <thead shuku-edit-id="e-2c0372c4-ef48-4c16-84e5-c3463fdc44d8">
                <tr shuku-edit-id="e-97c8f949-3cc5-4b23-b9d7-05c152770434"><th shuku-edit-id="e-cd321703-1dd6-48e8-9042-15c38e4ce6a0" className="tr-pe-pos-head" rowSpan={2}>pos <span shuku-edit-id="e-ce6f76bf-ae26-414a-86f7-9eb75e18df01">（词在句中的位置）</span></th><th shuku-edit-id="e-3054dbca-87ec-4507-aedf-e1282e3a762d" className="tr-pe-i-head" colSpan={2}>i = 0 <span shuku-edit-id="e-04b03b01-26f9-453f-848f-8eb0f608e1bc">（第 0 组维度）</span></th><th shuku-edit-id="e-8f393adf-522d-41a1-9443-cf899d1fc763" className="tr-pe-i-head" colSpan={2}>i = 1 <span shuku-edit-id="e-63593bed-17f6-4260-b768-58f584114407">（第 1 组维度）</span></th><th shuku-edit-id="e-34fd757c-0832-4064-b470-e295aaef178a" className="is-gap" rowSpan={2}>…</th><th shuku-edit-id="e-f391c9d3-04c8-4629-9d20-dedee352feaf" className="tr-pe-i-head" colSpan={2}>i = 255 <span shuku-edit-id="e-8402cfe3-b64f-4c23-875f-c4a4991e64f4">（第 255 组维度）</span></th></tr>
                <tr shuku-edit-id="e-70409aa9-0805-4559-a3bd-cdae8fbbd80e"><th shuku-edit-id="e-e01ebc99-db1b-4543-8a61-26b521a05b96" className="is-sin">第0维　sin</th><th shuku-edit-id="e-3a1363fa-c3b3-438a-95b6-4932ba6939c5" className="is-cos">第1维　cos</th><th shuku-edit-id="e-9f561b28-0515-4159-ad9c-18e6e1c8730d" className="is-sin">第2维　sin</th><th shuku-edit-id="e-47bdeb01-1025-4221-b871-118deac01dea" className="is-cos">第3维　cos</th><th shuku-edit-id="e-2673dc82-1869-4d14-a64e-47269eb33c04" className="is-sin">第510维　sin</th><th shuku-edit-id="e-7a2b14eb-a2ab-46b0-b7f5-900f81354613" className="is-cos">第511维　cos</th></tr>
              </thead>
              <tbody shuku-edit-id="e-cd83c075-945e-43f7-9048-05cc39432183">
                {positions.map((pos) => (<tr shuku-edit-id="e-ef7206cf-927f-4fea-934b-f7129fd30ca1" className={selected?.pos === pos ? 'is-row-selected' : ''} key={pos}>
                    <th shuku-edit-id="e-362fa279-fc4b-4481-8f7b-f5bf7ed40691" className="tr-pe-pos">{pos}</th>
                    {dimensions.map((dim, index) => {
                const key = `${pos}-${dim}`;
                const isSelected = selected?.pos === pos && selected.dim === dim;
                return <Fragment key={key}>
                        {index === 4 && <td shuku-edit-id="e-bdf73647-acb3-419e-85fe-2a538406c9dd" className="is-gap" key={`gap-${pos}`}>…</td>}
                        <td shuku-edit-id="e-2647f754-6b58-4149-b832-0448d1eafd13" className={dim % 2 === 0 ? 'is-sin' : 'is-cos'}>
                          <button shuku-edit-id="e-2fb19248-47fc-47c7-9a9a-36ca051fe8e1" className={isSelected ? 'is-selected' : ''} type="button" onClick={() => calculateCell(pos, dim)} aria-label={`位置${pos}，第${dim}维，点击计算`}>
                            {filled[key] === undefined ? '' : filled[key].toFixed(4)}
                          </button>
                        </td>
                      </Fragment>;
            })}
                  </tr>))}
              </tbody>
            </table>
          </section>

          <section shuku-edit-id="e-b826dbec-b716-4038-b373-96c27f8b5921" className="tr-pe-lower">
            <div shuku-edit-id="e-0d433732-85bb-4073-b3d9-0527eee1476e" className="tr-pe-formula-card" aria-live="polite">
              <span shuku-edit-id="e-b1a9a4f6-3f75-476a-8e57-03098c809f47">计算公式</span>
              <div shuku-edit-id="e-910dac76-5ca9-4285-9dc9-ca3c7cbf288c" className="tr-pe-general">偶数维： PE(pos, 2i) = sin( pos / 10000<sup shuku-edit-id="e-030977f1-b41a-48f6-a3a5-8237b1069192">2i / d<sub shuku-edit-id="e-f708783a-bfcc-40b0-957e-9c41d87448c3">model</sub></sup> )</div>
              <div shuku-edit-id="e-9c157a27-6a87-482e-b579-bbf8e6e46e48" className="tr-pe-general">奇数维： PE(pos, 2i+1) = cos( pos / 10000<sup shuku-edit-id="e-2115d78c-93ef-47b6-aa3c-905c1cba99e7">2i / d<sub shuku-edit-id="e-60bcea1f-71d5-4ba7-9e2c-67cb7acc8642">model</sub></sup> )</div>
              {selected && <div shuku-edit-id="e-4017a298-5ab1-4bdb-a90e-b2c396be0f86" className="tr-pe-substitution">
                PE(<b shuku-edit-id="e-9ed621f7-31b5-4e87-8fb5-8ff97d36472c">{selected.pos}</b>, <b shuku-edit-id="e-95d6e1ed-db45-4794-a2e0-5add5694b2ae">{selected.dim}</b>) = {selectedFn}( <b shuku-edit-id="e-05cdad9f-1e33-4de2-9ac8-4a821e6c90cd">{selected.pos}</b> / 10000<sup shuku-edit-id="e-82b4a059-b303-4fdc-b7f2-1b216669ec9a">2×<i shuku-edit-id="e-743e517e-9431-4d4d-b56b-ffefe1cf9a31">{selectedPair}</i> / <i shuku-edit-id="e-6926dfb8-55fe-4eab-bb9f-33fe81a3ecbe">512</i></sup> ) ≈ <strong shuku-edit-id="e-cb9e4281-7386-42c3-b381-d998e116dd08">{valueAt(selected.pos, selected.dim).toFixed(6)}</strong>
              </div>}
            </div>
          </section>
        </main>

        <footer shuku-edit-id="e-cffe5949-0d65-4342-881f-ff162058df77" className="tr-pe-guide__footer">
          <span shuku-edit-id="e-bfbd7193-347e-44a7-9056-7380c8295314" className="tr-pe-example-note">仅展示部分维度</span>
          <div shuku-edit-id="e-02c61ca2-323f-4299-bf7c-4e43fddcf6ca" className="tr-pe-table-actions">
            <Button className="tr-pe-table-action" disabled={allCalculated} onClick={generateRemaining}>生成其余示例值</Button>
            <Button className="tr-pe-table-action" disabled={!hasCalculated} onClick={clearExample}>清空示例表</Button>
            {hasCalculated && <Button className="tr-pe-next" variant="primary" onClick={onComplete}>继续：这种编码好在哪里？</Button>}
          </div>
        </footer>
      </section>
    </LessonPageFrame>);
}
