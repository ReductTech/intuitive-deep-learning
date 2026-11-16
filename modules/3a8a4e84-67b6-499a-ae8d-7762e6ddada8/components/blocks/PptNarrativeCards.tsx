import { transformerAsset } from '../../assetUrls';
import { useEffect, useState } from 'react';
import { Button } from "@shuku/course-style/react/controls/Button";
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
      {!started ? <section shuku-edit-id="e-709479d6-5516-4a4a-894d-222441ee517c" className="tr-ffn-intro">
        <div shuku-edit-id="e-f5ff2e43-99bb-4496-a407-e4ce97a7765a" className="tr-ffn-intuition">
          <article shuku-edit-id="e-f16d4109-a8bc-4226-99b9-770a072680f7" className="tr-ffn-intuition-panel is-attention">
            <h3 shuku-edit-id="e-e7d8f995-ad5c-4bab-8e96-78a85fc31663">注意力子层</h3>
            <div shuku-edit-id="e-ed8e6d5a-c609-4973-98e6-117ee44f5942" className="tr-ffn-person-scene is-discussion"><img shuku-edit-id="e-64a4fe99-8a81-4076-8398-b77f7535b98e" src={transformerAsset("05_前馈网络/注意力到逐位加工.jpg")} alt="同学们互相讨论，交换笔记"/></div>
            <div shuku-edit-id="e-b47d4df5-f96d-4554-bece-6f69369fcfe6" className="tr-ffn-intuition-caption"><h4 shuku-edit-id="e-294084aa-be33-45f5-8d3e-39c308b456a9"><span shuku-edit-id="e-30bf9161-52f2-43f2-b955-adbab40b904d">1</span>先交流</h4><p shuku-edit-id="e-2c491f21-657c-4ead-9257-65f951abff47">从其他 Token 中<strong shuku-edit-id="e-71006130-4e18-4cfa-8504-2d5f282de4c4">汇聚相关信息</strong>。</p></div>
          </article>
          <div shuku-edit-id="e-fca4464e-7353-4615-9b52-87ae4b84ae7e" className="tr-ffn-intuition-arrow" aria-label="从交流到加工"><svg shuku-edit-id="e-8b6925cd-0e63-4bfa-a7af-0ea74204f4e5" viewBox="0 0 240 40" preserveAspectRatio="none" aria-hidden="true"><path shuku-edit-id="e-b27baad7-cce3-4a2d-a873-da91cf8fe7a1" d="M 0 20 H 224 M 208 6 L 224 20 L 208 34"/></svg></div>
          <article shuku-edit-id="e-d358a68d-e5a3-4756-98d6-dfe900aa3c1f" className="tr-ffn-intuition-panel is-processing">
            <h3 shuku-edit-id="e-f8d44603-ffa7-4eb6-810d-a2d1f9f21c93">前馈网络（FFN）子层</h3>
            <div shuku-edit-id="e-48f07f39-efd6-418f-ade3-ffc427198d83" className="tr-ffn-person-scene is-study"><img shuku-edit-id="e-c666fa11-6782-4f2d-ad6c-a2cc8dace3b9" src={transformerAsset("05_前馈网络/注意力到逐位加工.jpg")} alt="学生独立整理刚获得的笔记"/></div>
            <div shuku-edit-id="e-3025a18e-c6cb-4633-92af-58d6001af0bc" className="tr-ffn-intuition-caption"><h4 shuku-edit-id="e-2a445a0e-1455-40d9-a00b-0dfdd8daff7f"><span shuku-edit-id="e-877df6d3-5ece-4659-8dbd-ae330aa10471">2</span>再加工</h4><p shuku-edit-id="e-ccecdf95-93bd-4d85-bc5c-d0399f746815">每个 Token <strong shuku-edit-id="e-f8712c1e-3c78-425d-9dd0-4763b039f8e9">独立加工</strong>已有信息。</p><p shuku-edit-id="e-82e5b39d-a790-40b3-a940-6f8779e7e982" className="tr-ffn-shared-rule">各个位置<strong shuku-edit-id="e-2ca6600c-c02e-4f5a-a780-ed137975eb96">共享同一套参数</strong>。</p></div>
          </article>
        </div>
        <footer shuku-edit-id="e-f8c6db49-d6c3-48b0-87ea-f5d3a583ca17" className="tr-ffn-intro-action"><span shuku-edit-id="e-75c2c907-1e5a-4982-9970-af81fa919bf2" className="tr-ffn-block-note">两个子层，各接残差与层规范化，组成一个编码器 Block。</span><Button variant="primary" onClick={onComplete}>继续：FFN 怎样加工</Button></footer>
        </section> : <section shuku-edit-id="e-d1e38592-3d61-429f-8278-b7937a1e9224" className="tr-ffn-overview" aria-label="逐位前馈网络的完整计算路径">
          <figure shuku-edit-id="e-b5b8aadf-a85e-44ae-afb3-1cb50c56318b" className="tr-ffn-overview-figure">
            <div shuku-edit-id="e-31573f9f-fd47-46dc-b99d-00ae2b91e510" className="tr-ffn-example-controls"><button shuku-edit-id="e-3e065670-5194-43f0-8b6a-1e4d465a5590" type="button" aria-pressed={smallExample} onClick={() => { setSmallExample(value => !value); setShowParameters(false); showStep(3); }}>{smallExample ? '返回 512 维结构图' : '用小向量算一遍'}</button>{smallExample && <button shuku-edit-id="e-33e4f62d-942b-471b-b416-b7f8407910be" type="button" aria-expanded={showParameters} onClick={() => setShowParameters(value => !value)}>查看共享参数</button>}</div>
            {smallExample && showParameters && <div shuku-edit-id="e-3d5d1328-8e34-4c50-93a0-3b2afda2de54" className="tr-ffn-shared-parameters"><strong shuku-edit-id="e-146313b0-f659-4bed-9eb8-986ed340dded">三个位置，共用这两组参数</strong><code shuku-edit-id="e-26f915fd-6ba1-4cd7-838a-a561c9099a0e">W₁ = [[1, −1, 1], [1, 1, −1]]</code><code shuku-edit-id="e-b67ec084-788a-4382-9579-a8759bd0ac40">W₂ = [[1, 0], [0, 1], [1, 1]]</code><span shuku-edit-id="e-6b2765a6-d765-47c1-ba98-069e114b4f94">b₁、b₂ 均为 0；数值为教学示例。</span></div>}
            <div shuku-edit-id="e-fa06334b-7b79-43d7-b31c-6968b955c21d" className={`tr-ffn-overview-art is-stage-${reveal}`}>
              <svg shuku-edit-id="e-9d3b5e0e-2933-480d-ab2f-93fc41cd19c5" viewBox="0 55 1400 325" preserveAspectRatio="xMidYMid meet" role="group" aria-label={smallExample ? '三个 Token 共用参数，独立经过 2 维输入、3 维升维、ReLU 激活和 2 维输出' : '三个 Token 各自在独立通道内经过 512 维输入、2048 维升维、ReLU 激活和 512 维输出，不同 Token 之间没有连线'}>
                {['Token 1', 'Token 2', 'Token 3'].map((label, lane) => {
                const y = 112 + lane * 90;
                const center = lane === selectedToken;
                const example = ffnTeachingExample(FFN_SAMPLE_INPUTS[lane]);
                const stations = [example.input, example.hidden, example.activated, example.output];
                return <g shuku-edit-id="e-50d1e386-d4aa-4013-ad7d-d59b4b9076ac" className={`tr-ffn-lane${center ? ' is-focus' : ''}`} key={label} role="button" tabIndex={0} aria-label={`关注 ${label}，各位置共享相同的 W₁、b₁、W₂、b₂`} aria-pressed={center} onClick={() => setSelectedToken(lane)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedToken(lane);
                } }}>
                    <text shuku-edit-id="e-8aac8aeb-933b-4eec-9f02-3a673a0bbd92" className="tr-ffn-lane-label" x="9" y={y + 28}>{label}</text>
                    {[0, 1, 2].map((step) => <path shuku-edit-id="e-293321f4-ebd5-48b6-b125-f9c74b77e340" key={`path-${step}`} className={`tr-ffn-link tr-ffn-piece-${step + 1}`} d={`M ${[225, 645, 995][step]} ${y + 24} H ${[405, 755, 1175][step]}`}/>)}
                    <text shuku-edit-id="e-755963b5-3b86-47b3-9821-610f5a5c6b0b" className="tr-ffn-param tr-ffn-piece-1" x="310" y={y + 10} textAnchor="middle">W₁、b₁</text>
                    <text shuku-edit-id="e-49c74c2e-91a8-4e05-b072-1d9ff441dee4" className="tr-ffn-param tr-ffn-piece-3" x="1085" y={y + 10} textAnchor="middle">W₂、b₂</text>
                    {[{ x: 125, w: 100 }, { x: 405, w: 240 }, { x: 755, w: 240 }, { x: 1175, w: 100 }].map(({ x, w }, station) => <g shuku-edit-id="e-bf40b111-ed6c-40fd-a502-b4acf8d2fc55" key={`station-${station}`} className={`tr-ffn-station tr-ffn-piece-${station}`}>
                      <rect shuku-edit-id="e-05d54026-394a-4b13-8abe-c6735de549b4" className="tr-ffn-slab-front" x={x} y={y + 5} width={w} height="38" rx="5"/>
                      {smallExample ? <text shuku-edit-id="e-f6445fe7-0fbc-40f3-82a0-e412ca0ae2c6" className="tr-ffn-toy-values" x={x + w / 2} y={y + 31} textAnchor="middle">[{stations[station].join(', ')}]</text> : <>{Array.from({ length: Math.round(w / 14) - 1 }, (_, index) => <line shuku-edit-id="e-459a1371-f71a-4fdb-9d20-56e228582864" className="tr-ffn-cell-line" key={index} x1={x + w * (index + 1) / Math.round(w / 14)} x2={x + w * (index + 1) / Math.round(w / 14)} y1={y + 6} y2={y + 42}/>)}<line shuku-edit-id="e-1c0e1a78-71ce-48ce-ad41-5b706f2b5f43" className="tr-ffn-cell-line" x1={x + 1} x2={x + w - 1} y1={y + 24} y2={y + 24}/></>}
                    </g>)}
                  </g>;
            })}
              </svg>
            </div>
          <figcaption shuku-edit-id="e-9a4e22c7-5b59-4939-91aa-de0d42c75952"><span shuku-edit-id="e-a08d456f-4f77-4a5a-b2fd-9e83831bdffe" className="is-visible">输入<br shuku-edit-id="e-a19f7986-8044-44bf-9193-91f8fa33838f" /><b shuku-edit-id="e-8e75799b-a9bc-4597-b942-3c6c808151bf">{smallExample ? 2 : 512} 维</b></span><span shuku-edit-id="e-a34001d2-e512-4b9b-8dfe-1ccbb54759de" className={reveal >= 1 ? 'is-visible' : ''}>升维后<br shuku-edit-id="e-fa3c4bb1-6331-438d-9257-7a037e37dca5" /><b shuku-edit-id="e-416f7e25-c814-4998-8cde-10ac6b0299c8">{smallExample ? 3 : 2048} 维</b></span><span shuku-edit-id="e-1c019909-c456-45af-88bc-26568ac3631a" className={reveal >= 2 ? 'is-visible' : ''}>ReLU 后<br shuku-edit-id="e-48f211ab-f54b-40dc-a97e-de3cba8e4178" /><b shuku-edit-id="e-10fc2322-3354-46f5-b5cf-91b6f966a56e">{smallExample ? 3 : 2048} 维</b></span><span shuku-edit-id="e-b1566c74-8f03-40e3-85e7-06923c729d4e" className={reveal >= 3 ? 'is-visible' : ''}>输出<br shuku-edit-id="e-71aedbf6-e488-4a54-ab66-f32e86faffba" /><b shuku-edit-id="e-efc81b8c-9f68-4e6f-934d-69dbe679ed71">{smallExample ? 2 : 512} 维</b></span></figcaption>
        </figure>
        <div shuku-edit-id="e-ea818822-008c-48c6-b079-d4d46cd23ef7" className="tr-ffn-overview-layers">
          <article shuku-edit-id="e-7036fa4b-0360-4ff2-a9e2-87e31881c286" role="button" tabIndex={0} aria-label="查看升维步骤" onClick={() => showStep(1)} onKeyDown={event => { if (event.key === 'Enter') {
            showStep(1);
        } }} className={`${reveal >= 1 ? 'is-revealed' : ''}${reveal === 1 ? ' is-active' : ''}`}><header shuku-edit-id="e-1ad4fa6a-ad55-4942-a2a1-3fb875b8fc87"><h3 shuku-edit-id="e-6fd00e57-356d-4ad7-893b-1714bf410ae7">全连接 · 升维</h3></header><b shuku-edit-id="e-9fc24d56-8787-4e03-a6d1-76a39b813be9">{smallExample ? '2 → 3' : '512 → 2048'}</b><code shuku-edit-id="e-4efcba2a-b24f-4da4-b9bd-36aa719826f4">hᵢ = xᵢW₁ + b₁</code><p shuku-edit-id="e-b36db0ea-29e0-44f7-83bb-f802615716e1">{smallExample ? <>Token {selectedToken + 1}：<strong shuku-edit-id="e-13054f9b-5582-458f-89f3-2710ff719bc0">[{tokenExample.hidden.join(', ')}]</strong></> : <>各位置用<strong shuku-edit-id="e-ad1a17e6-609b-4e9b-a05f-0232d5c23a1d">同一组 W₁、b₁</strong>。</>}</p></article>
          <article shuku-edit-id="e-717db4e7-d698-4e7f-94e6-72c966f975d4" role="button" tabIndex={0} aria-label="查看激活步骤" onClick={() => showStep(2)} onKeyDown={event => { if (event.key === 'Enter') {
            showStep(2);
        } }} className={`${reveal >= 2 ? 'is-revealed' : ''}${reveal === 2 ? ' is-active' : ''}`}><header shuku-edit-id="e-fc6286a5-7e74-400b-b0ec-92de1dfa19c5"><h3 shuku-edit-id="e-76268e9f-f8bc-4b31-86a2-6d34630aa92b">ReLU · 激活</h3></header><b shuku-edit-id="e-b8b5f86c-f121-4f51-9e9b-e98ea3f3c4b1">{smallExample ? '3 → 3' : '2048 → 2048'}</b><code shuku-edit-id="e-dbff8b33-713b-4abb-98db-e76e9a1991f8">aᵢ = max(0, hᵢ)</code><p shuku-edit-id="e-17c3a1bf-9cef-44b5-bc2c-974c4b2181ca">{smallExample ? <>负值归零：<strong shuku-edit-id="e-5da3bd39-6c76-4a7e-89d2-2ae9841cb929">[{tokenExample.activated.join(', ')}]</strong></> : <><strong shuku-edit-id="e-aff5936d-7e47-47bc-9a53-e5df2ddf3663">负值归零</strong>，引入非线性。</>}</p></article>
          <article shuku-edit-id="e-f8aa1244-a51f-4917-b618-ac50677171f4" role="button" tabIndex={0} aria-label="查看降维步骤" onClick={() => showStep(3)} onKeyDown={event => { if (event.key === 'Enter') {
            showStep(3);
        } }} className={`${reveal >= 3 ? 'is-revealed' : ''}${reveal === 3 ? ' is-active' : ''}`}><header shuku-edit-id="e-b2a90400-9c21-4580-8dfe-849558f54bf1"><h3 shuku-edit-id="e-76bd72ab-e35d-4a25-b26b-c2fb50df2ddb">全连接 · 降维</h3></header><b shuku-edit-id="e-9cd03fec-28d4-4154-a9ae-97426b090ca1">{smallExample ? '3 → 2' : '2048 → 512'}</b><code shuku-edit-id="e-1315a133-8dec-48e7-a5f3-f1ea2735c983">yᵢ = aᵢW₂ + b₂</code><p shuku-edit-id="e-c9ad2f68-ee33-4a4f-ba32-9f7bcc0628b3">{smallExample ? <>Token {selectedToken + 1}：<strong shuku-edit-id="e-41228c42-4828-441d-8819-f8ae4d4068c7">[{tokenExample.output.join(', ')}]</strong></> : <>各位置用<strong shuku-edit-id="e-c9b6ed3f-26e3-4ff8-b8d7-7815b9e6133e">同一组 W₂、b₂</strong>。</>}</p></article>
        </div>
          <footer shuku-edit-id="e-040848f3-fde3-444c-8e9f-1f1f8200bb74" className="tr-ffn-overview-footer"><span shuku-edit-id="e-38262902-cc17-4948-bcfc-f59ed6ac5c71" className="tr-ffn-focus-note">{smallExample ? '小例子：2→3→2；三个 Token 共用同一组参数。' : '点击通道切换 Token；参数共享，输入和输出不必相同。'}</span><div shuku-edit-id="e-a201384d-a41f-4435-8992-a42b2db35832"><Button disabled={reveal === 0} onClick={() => showStep(reveal - 1)}>上一步</Button><Button disabled={reveal >= 3} onClick={() => showStep(reveal + 1)}>下一步</Button><Button onClick={() => { setAutoPlay(true); setReveal(0); setReplay((value) => value + 1); }}>重播过程</Button><Button variant="primary" onClick={onComplete}>继续：残差连接</Button></div></footer>
      </section>}
    </LessonStage>);
}
export function LayerNormCard({ onComplete }: CompleteProps) {
    return <LayerNormLessonCard onComplete={onComplete}/>;
}
