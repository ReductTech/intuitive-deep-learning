import { transformerAsset } from '../../assetUrls';
import { useEffect, useState } from 'react';
import { Button } from '../../../shared/react/controls/Button';
import { LessonStage } from '../LessonStage';
import './PptNarrativeCards.css';
import './PptReviewRefinements.css';
import { FfnNetworkCard } from './FfnNetworkCard';
import { LayerNormLessonCard } from './LayerNormLessonCard';
import { FFN_SAMPLE_INPUTS, ffnTeachingExample } from '../../domain/ffnTeachingExample';
interface CompleteProps {
    onComplete: () => void;
}
export function FfnCalculationCard({ onComplete }: CompleteProps) {
    return <FfnNetworkCard onComplete={onComplete}/>;
}
export function FfnCard({ onComplete, phase = 'intuition' }: CompleteProps & {
    phase?: 'intuition' | 'calculation';
}) {
    const started = phase === 'calculation';
    const [reveal, setReveal] = useState(0);
    const [replay, setReplay] = useState(0);
    const [autoPlay, setAutoPlay] = useState(true);
    const [selectedToken, setSelectedToken] = useState(1);
    const [smallExample, setSmallExample] = useState(false);
    const [showParameters, setShowParameters] = useState(false);
    const tokenExample = ffnTeachingExample(FFN_SAMPLE_INPUTS[selectedToken]);
    const showStep = (step: number) => { setAutoPlay(false); setReveal(Math.max(0, Math.min(3, step))); };
    useEffect(() => {
        if (!started || !autoPlay)
            return undefined;
        setReveal(0);
        const timers = [1, 2, 3, 4].map((step) => window.setTimeout(() => setReveal(step), 1200 + (step - 1) * 1650));
        return () => timers.forEach((timer) => window.clearTimeout(timer));
    }, [started, replay, autoPlay]);
    return (<LessonStage kicker="第五幕 · 注意力之后还要做什么？" title={started ? '逐位前馈网络：升维、激活、降维' : '逐位前馈网络：每个 Token 独立加工'} description={started ? '选一个 Token，逐步查看升维、激活与降维，也可切换小向量核对数值。' : '对照左右两幅图，区分从其他词汇聚信息与独立加工当前表示。'} className="tr-stage tr-ppt-equipment-stage tr-ffn-video-stage">
      {!started ? <section className="tr-ffn-intro">
        <div className="tr-ffn-intuition">
          <article className="tr-ffn-intuition-panel is-attention">
            <h3>注意力子层</h3>
            <div className="tr-ffn-person-scene is-discussion"><img src={transformerAsset("05_前馈网络/注意力到逐位加工.png")} alt="同学们互相讨论，交换笔记"/></div>
            <div className="tr-ffn-intuition-caption"><h4><span>1</span>先交流</h4><p>从其他 Token 中<strong>汇聚相关信息</strong>。</p></div>
          </article>
          <div className="tr-ffn-intuition-arrow" aria-label="从交流到加工"><svg viewBox="0 0 240 40" preserveAspectRatio="none" aria-hidden="true"><path d="M 0 20 H 224 M 208 6 L 224 20 L 208 34"/></svg></div>
          <article className="tr-ffn-intuition-panel is-processing">
            <h3>前馈网络（FFN）子层</h3>
            <div className="tr-ffn-person-scene is-study"><img src={transformerAsset("05_前馈网络/注意力到逐位加工.png")} alt="学生独立整理刚获得的笔记"/></div>
            <div className="tr-ffn-intuition-caption"><h4><span>2</span>再加工</h4><p>每个 Token <strong>独立加工</strong>已有信息。</p><p className="tr-ffn-shared-rule">各个位置<strong>共享同一套参数</strong>。</p></div>
          </article>
        </div>
        <footer className="tr-ffn-intro-action"><span className="tr-ffn-block-note">两个子层，各接残差与层规范化，组成一个编码器 Block。</span><Button variant="primary" onClick={onComplete}>继续：FFN 怎样加工</Button></footer>
        </section> : <section className="tr-ffn-overview" aria-label="逐位前馈网络的完整计算路径">
          <figure className="tr-ffn-overview-figure">
            <div className="tr-ffn-example-controls"><button type="button" aria-pressed={smallExample} onClick={() => { setSmallExample(value => !value); setShowParameters(false); showStep(3); }}>{smallExample ? '返回 512 维结构图' : '用小向量算一遍'}</button>{smallExample && <button type="button" aria-expanded={showParameters} onClick={() => setShowParameters(value => !value)}>查看共享参数</button>}</div>
            {smallExample && showParameters && <div className="tr-ffn-shared-parameters"><strong>三个位置，共用这两组参数</strong><code>W₁ = [[1, −1, 1], [1, 1, −1]]</code><code>W₂ = [[1, 0], [0, 1], [1, 1]]</code><span>b₁、b₂ 均为 0；数值为教学示例。</span></div>}
            <div className={`tr-ffn-overview-art is-stage-${reveal}`}>
              <svg viewBox="0 55 1400 325" preserveAspectRatio="xMidYMid meet" role="group" aria-label={smallExample ? '三个 Token 共用参数，独立经过 2 维输入、3 维升维、ReLU 激活和 2 维输出' : '三个 Token 各自在独立通道内经过 512 维输入、2048 维升维、ReLU 激活和 512 维输出，不同 Token 之间没有连线'}>
                {['Token 1', 'Token 2', 'Token 3'].map((label, lane) => {
                const y = 112 + lane * 90;
                const center = lane === selectedToken;
                const example = ffnTeachingExample(FFN_SAMPLE_INPUTS[lane]);
                const stations = [example.input, example.hidden, example.activated, example.output];
                return <g className={`tr-ffn-lane${center ? ' is-focus' : ''}`} key={label} role="button" tabIndex={0} aria-label={`关注 ${label}，各位置共享相同的 W₁、b₁、W₂、b₂`} aria-pressed={center} onClick={() => setSelectedToken(lane)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedToken(lane);
                } }}>
                    <text className="tr-ffn-lane-label" x="9" y={y + 28}>{label}</text>
                    {[0, 1, 2].map((step) => <path key={`path-${step}`} className={`tr-ffn-link tr-ffn-piece-${step + 1}`} d={`M ${[225, 645, 995][step]} ${y + 24} H ${[405, 755, 1175][step]}`}/>)}
                    <text className="tr-ffn-param tr-ffn-piece-1" x="310" y={y + 10} textAnchor="middle">W₁、b₁</text>
                    <text className="tr-ffn-param tr-ffn-piece-3" x="1085" y={y + 10} textAnchor="middle">W₂、b₂</text>
                    {[{ x: 125, w: 100 }, { x: 405, w: 240 }, { x: 755, w: 240 }, { x: 1175, w: 100 }].map(({ x, w }, station) => <g key={`station-${station}`} className={`tr-ffn-station tr-ffn-piece-${station}`}>
                      <rect className="tr-ffn-slab-front" x={x} y={y + 5} width={w} height="38" rx="5"/>
                      {smallExample ? <text className="tr-ffn-toy-values" x={x + w / 2} y={y + 31} textAnchor="middle">[{stations[station].join(', ')}]</text> : <>{Array.from({ length: Math.round(w / 14) - 1 }, (_, index) => <line className="tr-ffn-cell-line" key={index} x1={x + w * (index + 1) / Math.round(w / 14)} x2={x + w * (index + 1) / Math.round(w / 14)} y1={y + 6} y2={y + 42}/>)}<line className="tr-ffn-cell-line" x1={x + 1} x2={x + w - 1} y1={y + 24} y2={y + 24}/></>}
                    </g>)}
                  </g>;
            })}
              </svg>
            </div>
          <figcaption><span className="is-visible">输入<br /><b>{smallExample ? 2 : 512} 维</b></span><span className={reveal >= 1 ? 'is-visible' : ''}>升维后<br /><b>{smallExample ? 3 : 2048} 维</b></span><span className={reveal >= 2 ? 'is-visible' : ''}>ReLU 后<br /><b>{smallExample ? 3 : 2048} 维</b></span><span className={reveal >= 3 ? 'is-visible' : ''}>输出<br /><b>{smallExample ? 2 : 512} 维</b></span></figcaption>
        </figure>
        <div className="tr-ffn-overview-layers">
          <article role="button" tabIndex={0} aria-label="查看升维步骤" onClick={() => showStep(1)} onKeyDown={event => { if (event.key === 'Enter') {
            showStep(1);
        } }} className={`${reveal >= 1 ? 'is-revealed' : ''}${reveal === 1 ? ' is-active' : ''}`}><header><h3>全连接 · 升维</h3></header><b>{smallExample ? '2 → 3' : '512 → 2048'}</b><code>hᵢ = xᵢW₁ + b₁</code><p>{smallExample ? <>Token {selectedToken + 1}：<strong>[{tokenExample.hidden.join(', ')}]</strong></> : <>各位置用<strong>同一组 W₁、b₁</strong>。</>}</p></article>
          <article role="button" tabIndex={0} aria-label="查看激活步骤" onClick={() => showStep(2)} onKeyDown={event => { if (event.key === 'Enter') {
            showStep(2);
        } }} className={`${reveal >= 2 ? 'is-revealed' : ''}${reveal === 2 ? ' is-active' : ''}`}><header><h3>ReLU · 激活</h3></header><b>{smallExample ? '3 → 3' : '2048 → 2048'}</b><code>aᵢ = max(0, hᵢ)</code><p>{smallExample ? <>负值归零：<strong>[{tokenExample.activated.join(', ')}]</strong></> : <><strong>负值归零</strong>，引入非线性。</>}</p></article>
          <article role="button" tabIndex={0} aria-label="查看降维步骤" onClick={() => showStep(3)} onKeyDown={event => { if (event.key === 'Enter') {
            showStep(3);
        } }} className={`${reveal >= 3 ? 'is-revealed' : ''}${reveal === 3 ? ' is-active' : ''}`}><header><h3>全连接 · 降维</h3></header><b>{smallExample ? '3 → 2' : '2048 → 512'}</b><code>yᵢ = aᵢW₂ + b₂</code><p>{smallExample ? <>Token {selectedToken + 1}：<strong>[{tokenExample.output.join(', ')}]</strong></> : <>各位置用<strong>同一组 W₂、b₂</strong>。</>}</p></article>
        </div>
          <footer className="tr-ffn-overview-footer"><span className="tr-ffn-focus-note">{smallExample ? '小例子：2→3→2；三个 Token 共用同一组参数。' : '点击通道切换 Token；参数共享，输入和输出不必相同。'}</span><div><Button disabled={reveal === 0} onClick={() => showStep(reveal - 1)}>上一步</Button><Button disabled={reveal >= 3} onClick={() => showStep(reveal + 1)}>下一步</Button><Button onClick={() => { setAutoPlay(true); setReveal(0); setReplay((value) => value + 1); }}>重播过程</Button><Button variant="primary" onClick={onComplete}>继续：残差连接</Button></div></footer>
      </section>}
    </LessonStage>);
}
export function LayerNormCard({ onComplete }: CompleteProps) {
    return <LayerNormLessonCard onComplete={onComplete}/>;
}
