import { transformerAsset } from '../../assetUrls';
import { useEffect, useId, useState } from 'react';
import { Button } from '../../../shared/react/controls/Button';
import { LessonStage } from '../LessonStage';
import { SvgPathTraveler } from './SvgPathTraveler';
import './ResidualLessonCards.css';
interface Props {
    onComplete: () => void;
}

function TinyMatrix({ x, y, color = '#438bb0' }: {
    x: number;
    y: number;
    color?: string;
}) {
    return <g transform={`translate(${x} ${y})`} aria-hidden="true">
    {Array.from({ length: 15 }, (_, i) => <rect key={i} x={(i % 5) * 8} y={Math.floor(i / 5) * 8} width="6" height="6" rx="1" fill={color} opacity={.35 + (i % 4) * .2}/>)}
  </g>;
}
function OrdinaryFlow() {
    const id = useId().replace(/:/g, '');
    return <svg className="rl-ordinary-flow" viewBox="0 0 790 174" role="img" aria-label="没有残差连接：输入X依次经过多头注意力、逐位前馈网络，得到完整新表示H(X)">
    <defs><marker id={id} markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" fill="none" stroke="#71879b" strokeWidth="1.7"/></marker></defs>
    <g fill="none" stroke="#71879b" strokeWidth="2.8" markerEnd={`url(#${id})`}><path d="M105 76H149"/><path d="M337 76H386"/><path d="M574 76H617"/></g>
    <rect x="8" y="42" width="96" height="68" rx="13" fill="#eaf5fb" stroke="#438bb0"/>
    <text x="56" y="84" textAnchor="middle" className="rl-svg-math" fill="#2b7296">X</text>
    <rect x="152" y="34" width="182" height="84" rx="13" fill="#fff" stroke="#9dbdce"/>
    <text x="243" y="83" textAnchor="middle" className="rl-svg-module">注意力子层</text>
    <rect x="389" y="34" width="182" height="84" rx="13" fill="#fff" stroke="#e2b58f"/>
    <text x="480" y="83" textAnchor="middle" className="rl-svg-module">FFN 子层</text>
    <rect x="622" y="42" width="155" height="68" rx="13" fill="#fff0e8" stroke="#df977b"/>
    <text x="699" y="84" textAnchor="middle" className="rl-svg-math" fill="#c56438">H(X)</text>
    <text x="56" y="151" textAnchor="middle" className="rl-svg-label">输入表示</text>
    <text x="699" y="151" textAnchor="middle" className="rl-svg-label">完整新表示</text>
  </svg>;
}
export function ResidualIntroCard({ onComplete }: Props) {
    return <LessonStage title="子层怎样保留已有信息？" description="先看原输入经过的路径，再想想：能否让它直接参与输出？" className="tr-stage rl-page rl-intro">
    <div className="rl-intro-layout">
      <section className="rl-panel rl-problem-panel">
        <header>当下模型的问题</header>
        <div className="rl-problem-flow"><OrdinaryFlow /></div>
        <div className="rl-problems">
          <article className="rl-two-tasks">
            <h3>既要保留，又要学习</h3>
            <div className="rl-task-art"><img src={transformerAsset("06_残差连接/机器人双任务.png")} alt="课程机器人冒汗，吃力地抱着两个任务箱"/><span className="rl-task-label rl-task-old">保留<br />已有信息 X</span><span className="rl-task-label rl-task-new">学习<br />新的关系</span></div>
          </article>
          <article className="rl-gradient-problem">
            <h3>梯度的路也很长</h3>
            <div className="rl-gradient-stairs"><svg viewBox="0 0 790 1024" role="img" aria-label="梯度从深层向浅层逐层传播，机器人沿多段折返楼梯吃力下行"><image href={transformerAsset("06_残差连接/梯度阶梯与电梯.png")} width="1536" height="1024"/></svg><span className="rl-stairs-deep">深层</span><span className="rl-stairs-shallow">浅层</span></div>
            <p>梯度连续穿过复杂变换，<br /><strong>深层网络更难优化。</strong></p>
          </article>
        </div>
      </section>
      <section className="rl-panel rl-idea-panel">
        <header>如果模型只学习“变化”呢？</header>
        <p className="rl-idea-lead">保留已有信息，<br />专注于<strong>补充变化</strong>。</p>
        <div className="rl-residual-definition" aria-label="残差F(X)等于完整新表示H(X)减去原输入X">
          <div className="rl-residual-term"><b>F(X)</b><span>残差 · 变化量</span></div>
          <i>=</i>
          <div className="rl-definition-pair"><div><b>H(X)</b><span>完整新表示</span></div><i>−</i><div><b>X</b><span>原输入</span></div></div>
        </div>
      </section>
    </div>
    <footer className="rl-footer"><Button variant="primary" onClick={onComplete}>加入残差连接 →</Button></footer>
  </LessonStage>;
}
function ResidualCombinedFlow({ run, replay }: {
    run: number;
    replay: number;
}) {
    const id = useId().replace(/:/g, '');
    const firstSkip = 'M72 132 V66 Q72 52 86 52 H646 Q660 52 660 66 V108';
    const secondSkip = 'M770 132 V66 Q770 52 784 52 H1336 Q1350 52 1350 66 V108';
    return <svg className="rl-combined-flow" viewBox="0 0 1530 260" role="img" aria-label="完整残差流程：X经过多头注意力产生F₁(X)，与X相加得到H；H经过逐位前馈网络产生F₂(H)，与H相加得到Z。两个子层分别有跳线。">
      <defs>
        <marker id={`${id}-blue`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0L7 3L0 6" fill="#438bb0"/></marker>
        <marker id={`${id}-orange`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0L7 3L0 6" fill="#d58342"/></marker>
        <marker id={`${id}-green`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0L7 3L0 6" fill="#3c9b91"/></marker>
      </defs>
      <path d={firstSkip} className="rl-skip-path" markerEnd={`url(#${id}-blue)`}/>
      <path d={secondSkip} className="rl-skip-path" markerEnd={`url(#${id}-blue)`}/>
      <text x="365" y="30" textAnchor="middle" className="rl-svg-label">保留 X · 跳线</text>
      <text x="1060" y="30" textAnchor="middle" className="rl-svg-label">保留 H · 跳线</text>
      {['M121 132H177', 'M820 132H882'].map(path => <path key={path} d={path} className="rl-input-path" markerEnd={`url(#${id}-blue)`}/>)}
      {['M370 132H437', 'M585 132H632', 'M1085 132H1147', 'M1295 132H1322'].map(path => <path key={path} d={path} className="rl-delta-path" markerEnd={`url(#${id}-orange)`}/>)}
      {['M686 132H717', 'M1376 132H1417'].map(path => <path key={path} d={path} className="rl-result-path" markerEnd={`url(#${id}-green)`}/>)}
      <rect x="23" y="96" width="98" height="72" rx="12" fill="#eaf5fb" stroke="#7aaac3"/>
      <text x="72" y="128" textAnchor="middle" className="rl-svg-math" fill="#2b7296">X</text><TinyMatrix x={53} y={139}/>
      <rect x="180" y="89" width="190" height="86" rx="13" fill="#f1f8fc" stroke="#8eb7cc"/>
      <text x="275" y="141" textAnchor="middle" className="rl-svg-module">注意力子层</text>
      <rect x="440" y="96" width="145" height="72" rx="12" fill="#fff0df" stroke="#d58342"/>
      <text x="512" y="128" textAnchor="middle" className="rl-svg-math rl-svg-delta">F₁(X)</text><TinyMatrix x={493} y={139} color="#d58342"/>
      <circle cx="660" cy="132" r="25" fill="#fff" stroke="#3c9b91" strokeWidth="3"/><text x="660" y="143" textAnchor="middle" fontSize="37" fill="#3c9b91">+</text>
      <g visibility={run >= 2 ? 'visible' : 'hidden'} data-result="H">
        <rect x="720" y="96" width="100" height="72" rx="12" fill="#eef9f5" stroke="#3c9b91"/>
        <text x="770" y="128" textAnchor="middle" className="rl-svg-math" fill="#27877c">H</text><TinyMatrix x={751} y={139} color="#3c9b91"/>
        <text x="770" y="204" textAnchor="middle" className="rl-svg-label">相加输出</text>
        <text x="360" y="251" textAnchor="middle" className="rl-svg-math rl-flow-equation">H = X + F₁(X)</text>
      </g>
      <rect x="885" y="89" width="200" height="86" rx="13" fill="#fff7ee" stroke="#e2b58f"/>
      <text x="985" y="141" textAnchor="middle" className="rl-svg-module">FFN 子层</text>
      <rect x="1150" y="96" width="145" height="72" rx="12" fill="#fff0df" stroke="#d58342"/>
      <text x="1222" y="128" textAnchor="middle" className="rl-svg-math rl-svg-delta">F₂(H)</text><TinyMatrix x={1203} y={139} color="#d58342"/>
      <circle cx="1350" cy="132" r="25" fill="#fff" stroke="#3c9b91" strokeWidth="3"/><text x="1350" y="143" textAnchor="middle" fontSize="37" fill="#3c9b91">+</text>
      <g visibility={run >= 3 ? 'visible' : 'hidden'} data-result="Z">
        <rect x="1420" y="96" width="88" height="72" rx="12" fill="#eef9f5" stroke="#3c9b91"/>
        <text x="1464" y="128" textAnchor="middle" className="rl-svg-math" fill="#27877c">Z</text><TinyMatrix x={1445} y={139} color="#3c9b91"/>
        <text x="1464" y="204" textAnchor="middle" className="rl-svg-label">相加输出</text>
        <text x="1055" y="251" textAnchor="middle" className="rl-svg-math rl-flow-equation">Z = H + F₂(H)</text>
      </g>
      <text x="72" y="204" textAnchor="middle" className="rl-svg-label">输入</text>
      <text x="512" y="204" textAnchor="middle" className="rl-svg-label rl-delta-label">子层输出 · 残差</text>
      <text x="1222" y="204" textAnchor="middle" className="rl-svg-label rl-delta-label">子层输出 · 残差</text>
      {(run === 1 || run === 2) && <SvgPathTraveler key={`skip-${run}-${replay}`} path={run === 1 ? firstSkip : secondSkip} durationMs={1800} className="rl-traveler"><rect x="-24" y="-18" width="48" height="36" rx="6" fill="#fff" stroke="#438bb0" strokeWidth="2"/><TinyMatrix x={-19} y={-10}/></SvgPathTraveler>}
    </svg>;
}
function NearPath() {
    return <svg viewBox="0 0 200 70" role="img" aria-label="输入有直接通路，也经过子层分支">
    <path d="M18 20H168 M18 20V56H168V20" fill="none" stroke="#95abba" strokeWidth="3"/>
    <path d="M18 20H168" stroke="#438bb0" strokeWidth="4"/><circle cx="18" cy="20" r="10" fill="#438bb0"/><circle cx="174" cy="20" r="15" fill="#fff" stroke="#3c9b91" strokeWidth="2"/><text x="174" y="28" textAnchor="middle" fontSize="26" fill="#3c9b91">+</text>
    <rect x="79" y="4" width="36" height="29" rx="5" fill="#f5fafc"/><text x="97" y="27" textAnchor="middle" fontSize="26" fontStyle="italic" fontFamily="Georgia,serif" fill="#2b7296">X</text>
    <rect x="64" y="40" width="68" height="30" rx="6" fill="#fff0df" stroke="#d58342"/><text x="98" y="62" textAnchor="middle" fontSize="23" fill="#bb672c">F(X)</text>
  </svg>;
}
function IncrementPicture() {
    return <svg viewBox="0 0 200 70" role="img" aria-label="原输入加上接近零的增量，近似保留原输入">
    <rect x="8" y="12" width="40" height="43" rx="6" fill="#eaf5fb" stroke="#438bb0"/><TinyMatrix x={9} y={22}/>
    <text x="60" y="44" fontSize="28" fill="#6c8293">+</text><text x="85" y="46" fontSize="39" fill="#d58342">0</text><text x="120" y="44" fontSize="28" fill="#6c8293">≈</text>
    <rect x="157" y="12" width="40" height="43" rx="6" fill="#eef9f5" stroke="#3c9b91"/><TinyMatrix x={158} y={22} color="#3c9b91"/>
  </svg>;
}
export function ResidualMechanismCard({ onComplete }: Props) {
    const [run, setRun] = useState(0);
    const [replay, setReplay] = useState(0);
    useEffect(() => {
        if (run !== 1 && run !== 2)
            return;
        const timer = window.setTimeout(() => setRun(run === 1 ? 2 : 3), 1900);
        return () => window.clearTimeout(timer);
    }, [run]);
    return <LessonStage title="残差连接：保留输入，让子层学习增量" description="点击“演示两条跳线”，跟随原输入，观察它在哪里与子层输出相加。" className="tr-stage rl-page rl-mechanism">
    <div className="rl-mechanism-body">
      <div className="rl-module-row">
        <ResidualCombinedFlow run={run} replay={replay}/>
      </div>
      <div className="rl-explanation-row">
        <section className="rl-panel rl-role-panel">
          <header>子层输出的角色变了</header>
          <div className="rl-role-prose"><p>无跳线：子层输出<strong className="rl-original-key">完整表示 <em>H(X)</em></strong>。</p><p>加入跳线并训练后，<em>X</em> 提供基础，<strong>F(X)</strong> 学习<strong>残差增量</strong>。</p></div>
        </section>
        <section className="rl-panel rl-benefits-panel">
          <header>为什么这样更容易堆深？</header>
          <div className="rl-benefits">
            <article><div className="rl-benefit-art"><NearPath /></div><div><h3>信息有路可走</h3><p>X 直接参与新表示。</p></div></article>
            <article className="rl-gradient-benefit"><div className="rl-gradient-art"><svg viewBox="820 40 660 960" role="img" aria-label="梯度近路：机器人乘电梯沿恒等路径下行"><image href={transformerAsset("06_残差连接/梯度阶梯与电梯.png")} width="1536" height="1024"/></svg></div><div><h3>梯度多一条近路</h3><p>深层网络<strong>更容易优化</strong>。</p></div></article>
            <article><div className="rl-benefit-art"><IncrementPicture /></div><div><h3>只需学习增量</h3><p>无需修改时，<strong>F(X) ≈ 0</strong>。</p></div></article>
          </div>
        </section>
      </div>
    </div>
    <footer className="rl-footer"><span>逐元素相加，形状不变 · 本页暂略层规范化</span><div><Button disabled={run === 1 || run === 2} onClick={() => { setReplay(value => value + 1); setRun(1); }}>{run === 3 ? '重新演示两条跳线' : '演示两条跳线'}</Button><Button variant="primary" onClick={onComplete}>继续：层规范化 →</Button></div></footer>
  </LessonStage>;
}
