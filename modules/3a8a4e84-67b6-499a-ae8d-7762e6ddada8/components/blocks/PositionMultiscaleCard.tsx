import { useEffect, useRef, useState } from 'react';
import { Button, Typography } from '../../../shared/react';
import { LessonPageFrame } from '../LessonPageFrame';
import './PositionMultiscaleCard.css';
interface PositionMultiscaleCardProps {
    onComplete: () => void;
    page?: 0 | 1 | 2;
}
const groups = [0, 128, 255];
const comparisonGroups = [24, 40, 56, 72, 88];
const comparisonColors = ["#c77a42", "#3295a0", "#596ca6", "#ab6b94", "#7b9050"];
const omega = (i: number) => 1 / 10000 ** ((2 * i) / 512);
const score = (gap: number, i: number) => Math.cos(gap * omega(i));
function curvePath(i: number, width = 720, height = 350) {
    const left = 62, right = 20, top = 30, bottom = 65;
    return Array.from({ length: 701 }, (_, index) => {
        const xValue = 100 * index / 700;
        const value = score(xValue, i);
        const x = left + xValue / 100 * (width - left - right);
        const y = top + (1 - value) / 2 * (height - top - bottom);
        return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(' ');
}
function MiniPeriodChart({ indices }: {
    indices: number[];
}) {
    const path = (i: number) => Array.from({ length: 301 }, (_, n) => {
        const x = 45 + n;
        const y = 20 + (1 - score(n / 300 * 1000, i)) * 65;
        return `${n ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(' ');
    return <svg viewBox="0 0 360 205" role="img" aria-label={`维度组${indices.join('、')}的点积曲线，横轴位置差0到1000，纵轴点积负1到1`}>
    {[-1, 0, 1].map(v => <g key={v}><line className="tr-mini-grid" x1="45" x2="345" y1={20 + (1 - v) * 65} y2={20 + (1 - v) * 65}/><text className="tr-mini-tick" x="35" y={25 + (1 - v) * 65} textAnchor="end">{v}</text></g>)}
    <path className="tr-mini-axis" d="M45 20V150H345"/>
    {[0, 500, 1000].map(v => <text className="tr-mini-tick" x={45 + v * .3} y="174" textAnchor="middle" key={v}>{v}</text>)}
    {indices.map((i, n) => <path key={i} className={indices.length === 1 ? i === 100 ? 'fast' : 'slow' : ['fast', 'middle', 'slow'][n]} d={path(i)}/>)}
    <text className="tr-mini-axis-label" x="195" y="199" textAnchor="middle">位置差 Δp</text><text className="tr-mini-axis-label" transform="translate(14 85) rotate(-90)" textAnchor="middle">点积</text>
  </svg>;
}
export function PositionMultiscaleCard({ onComplete, page = 0 }: PositionMultiscaleCardProps) {
    const act = page;
    const [distance, setDistance] = useState(0);
    const [pairIndex, setPairIndex] = useState(0);
    const [showComparison, setShowComparison] = useState(false);
    useEffect(() => {
        setShowComparison(false);
        if (act !== 1 || pairIndex !== 255)
            return;
        const reveal = window.setTimeout(() => setShowComparison(true), 650);
        return () => window.clearTimeout(reveal);
    }, [act, pairIndex]);
    const distanceFrame = useRef<number | null>(null);
    const pendingDistance = useRef(0);
    const scores = groups.map((item) => score(distance, item));
    const updateDistanceSmoothly = (value: number) => {
        pendingDistance.current = value;
        if (distanceFrame.current !== null)
            return;
        distanceFrame.current = requestAnimationFrame(() => {
            setDistance(pendingDistance.current);
            distanceFrame.current = null;
        });
    };
    useEffect(() => () => {
        if (distanceFrame.current !== null)
            cancelAnimationFrame(distanceFrame.current);
    }, []);
    return (<LessonPageFrame>
      <section className="tr-multiscale" aria-labelledby="tr-multiscale-title">
        <header className="tr-lesson-header tr-multiscale__header">
          <div><Typography id="tr-multiscale-title" as="h1" variant="display" tone="accent">{act === 0 ? '不同维度组，点积变化的快慢不同' : act === 1 ? '维度组编号越大，变化周期越长' : '多个周期：共同刻画远近位置'}</Typography></div>
          <Typography as="p" variant="subtitle" tone="muted">{act === 0 ? '拖动位置差滑块，比较三组点积变化的快慢。' : act === 1 ? '拖动维度组号 i，观察周期变化；拉到最右端，叠加比较五组曲线。' : '对照短周期、长周期与组合曲线，观察重复出现的位置。'}</Typography>
        </header>

        <main className="tr-multiscale__main">
          {act === 0 && <section className="tr-multi-act is-observe">
            <div className="tr-distance-formula"><div>r<sub>i</sub>(p<sub>1</sub>)<sup>T</sup>r<sub>i</sub>(p<sub>2</sub>) = cos(<mark>(p<sub>1</sub> − p<sub>2</sub>)</mark>ω<sub>i</sub>)</div><span>改变<mark>位置差</mark>，观察不同维度组的点积。</span></div>
            <div className="tr-distance-control">
              <div><label htmlFor="tr-distance">两个位置的间隔</label><strong>Δp = {distance}</strong></div>
              <input id="tr-distance" type="range" min="0" max="10000" step="1" value={distance} onInput={(event) => updateDistanceSmoothly(Number(event.currentTarget.value))}/>
              <div><span>0</span><span>2500</span><span>5000</span><span>7500</span><span>10000</span></div>
            </div>
            <div className="tr-score-lanes">
              {groups.map((item, index) => <div className={`tr-score-lane is-group-${index}`} key={item}>
                <div><strong>维度组 i = {item}</strong><span>第 {item * 2}、{item * 2 + 1} 维</span></div>
                <div className="tr-score-track"><span>−1</span><i /><span>0</span><i /><span>1</span><b style={{ left: `${(scores[index] + 1) * 50}%` }}/></div>
                <div><small>点积</small><output>{scores[index].toFixed(4)}</output></div>
              </div>)}
            </div>
            <div className="tr-multi-observation">同样的位置差，<b>不同维度组的点积变化快慢不同。</b></div>
          </section>}

          {act === 1 && <section className="tr-multi-act is-period">
            <div className="tr-period-body is-explained">
              <div className="tr-period-steps">
                <section className="tr-period-step is-source">
                  <div className="tr-period-step-heading"><span>01</span><h2>从一对 sin、cos 开始</h2></div>
                  <div className="tr-period-math">PE(p, 2i) = sin(p / 10000<sup>2i / 512</sup>)</div>
                  <div className="tr-period-math">PE(p, 2i+1) = cos(p / 10000<sup>2i / 512</sup>)</div>
                  <p>i 是组号，每组对应相邻的两个维度。</p>
                </section>
                <section className="tr-period-step is-dot">
                  <div className="tr-period-step-heading"><span>02</span><h2>比较两个位置</h2></div>
                  <div className="tr-period-math">S<sub>i</sub>(Δp) = cos(Δp / <mark>10000<sup>2i / 512</sup></mark>)</div>
                  <p>S<sub>i</sub> 是这一组的点积；Δp 是位置差。</p>
                </section>
                <section className="tr-period-step is-conclusion">
                  <div className="tr-period-step-heading"><span>03</span><h2>分母决定快慢</h2></div>
                  <strong className="tr-period-takeaway">i 越大，变化越慢</strong>
                  <p>分母越大，同样移动一格，角度改变越小。</p>
                  <div className="tr-period-math">周期 T<sub>i</sub> = 2π · 10000<sup>2i / 512</sup></div>
                </section>
              </div>
              <div className={`tr-period-comparison tr-period-interactive ${showComparison ? 'is-overlay' : ''}`}>
                <div className="tr-period-chart-heading"><h2>{showComparison ? '比较五组曲线的周期' : '拖动组号，观察周期变化'}</h2><span>{showComparison ? '五组叠加' : `第 ${2 * pairIndex}、${2 * pairIndex + 1} 维`}</span></div>
                <div className="tr-period-slider">
                  <label htmlFor="tr-period-group">维度组 <strong>i = {pairIndex}</strong></label>
                  <input id="tr-period-group" aria-label="维度组 i" type="range" min="0" max="255" step="1" value={pairIndex} onChange={event => setPairIndex(Number(event.currentTarget.value))}/>
                  <div><span>0 · 快</span><span>255 · 慢</span></div>
                </div>
                <svg viewBox="0 0 720 350" role="img" aria-label="横轴位置差0到100，纵轴位置编码点积负1到1。拖动维度组滑条观察快慢，拉到最右端自动叠加五组曲线。">
                  {[-1, 0, 1].map(v => <g key={v}><line className="tr-period-grid" x1="62" x2="700" y1={30 + (1 - v) * 127.5} y2={30 + (1 - v) * 127.5}/><text x="49" y={36 + (1 - v) * 127.5} textAnchor="end">{v}</text></g>)}
                  {[0, 25, 50, 75, 100].map(v => <g key={v}><line className="tr-period-grid" x1={62 + v * 6.38} x2={62 + v * 6.38} y1="30" y2="285"/><text x={62 + v * 6.38} y="309" textAnchor="middle">{v}</text></g>)}
                  <line className="tr-period-axis" x1="62" x2="62" y1="30" y2="285"/><line className="tr-period-axis" x1="62" x2="700" y1="285" y2="285"/>
                  <path className="tr-period-single" d={curvePath(pairIndex)} stroke="#318c9e"/>
                  <g className="tr-period-overlays" aria-hidden={!showComparison}>{comparisonGroups.map((i, index) => <path key={i} d={curvePath(i)} stroke={comparisonColors[index]} pathLength="1" style={{ animationDelay: `${index * 120}ms` }}/>)}</g>
                  <text x="381" y="343" textAnchor="middle" className="tr-period-axis-label">位置差 Δp</text><text transform="translate(19 157) rotate(-90)" textAnchor="middle" className="tr-period-axis-label">点积 Sᵢ</text>
                </svg>
                <div className="tr-period-chart-footer">
                  <div className="tr-period-current">周期约 <b>{(2 * Math.PI / omega(pairIndex)).toLocaleString('en-US', { maximumFractionDigits: 1 })}</b> 格<span>拉到最右端，自动叠加对比</span></div>
                  <div className="tr-period-overlay-legend">{comparisonGroups.map((i, index) => <div key={i} style={{ color: comparisonColors[index] }}><strong><i />i = {i}</strong><span>周期 ≈ {Math.round(2 * Math.PI / omega(i))} 格</span></div>)}</div>
                </div>
              </div>
            </div>

          </section>}

          {act === 2 && <section className="tr-multi-act is-benefit">
            <div className="tr-benefit-grid">
              <article><h3>短周期：区分近距离</h3><MiniPeriodChart indices={[100]}/><p>位置差稍有变化，点积就明显改变，便于区分附近位置。</p></article>
              <article><h3>长周期：覆盖远距离</h3><MiniPeriodChart indices={[164]}/><p>点积在较大范围内缓慢变化，提供远距离参照。</p></article>
              <article><h3>多个周期：兼顾远近</h3><MiniPeriodChart indices={[100, 128, 164]}/><p>快慢变化组合，让不同距离呈现更丰富的位置模式。</p></article>
            </div>
          </section>}

        </main>

        <footer className="tr-multiscale__footer">
          <span className="tr-period-boundary-note">{act !== 1 && '点积有周期性，并非距离越大就越小。'}</span>
          <Button className="tr-multi-primary" variant="primary" onClick={onComplete}>{act === 0 ? '下一页：为什么快慢不同？' : act === 1 ? '下一页：不同周期的价值' : '继续：注意力之后怎样加工信息？'}</Button>
        </footer>
      </section>
    </LessonPageFrame>);
}
