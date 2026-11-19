import { transformerAsset } from '../../assetUrls';
import { useEffect, useId, useState } from 'react';
import { Button } from "@shuku/course-style/react/controls/Button";
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
    return <g shuku-edit-id="e-3d4cf3b7-00e0-42ee-9efd-1e42abe7ee69" transform={`translate(${x} ${y})`} aria-hidden="true">
    {Array.from({ length: 15 }, (_, i) => <rect shuku-edit-id="e-17a5607f-0d53-4842-b23d-bce55bf90cf8" key={i} x={(i % 5) * 8} y={Math.floor(i / 5) * 8} width="6" height="6" rx="1" fill={color} opacity={.35 + (i % 4) * .2}/>)}
  </g>;
}
function OrdinaryFlow() {
    const id = useId().replace(/:/g, '');
    return <svg shuku-edit-id="e-41d86b0d-6310-4d57-867d-12e4e7a85698" className="rl-ordinary-flow" viewBox="0 0 790 174" role="img" aria-label="没有残差连接：输入X依次经过多头注意力、逐位前馈网络，得到完整新表示H(X)">
    <defs shuku-edit-id="e-7c67438e-7d16-4a66-b271-153d8e4c2c67"><marker shuku-edit-id="e-6a0f5d79-6f93-40b2-82ff-3ec66e1008b5" id={id} markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto"><path shuku-edit-id="e-f760bf9b-9ccc-481b-9d48-84cc55fb1b2e" d="M0 0 L8 4 L0 8" fill="none" stroke="#71879b" strokeWidth="1.7"/></marker></defs>
    <g shuku-edit-id="e-18d81754-e7d2-465a-9262-c1c48d9eed25" fill="none" stroke="#71879b" strokeWidth="2.8" markerEnd={`url(#${id})`}><path shuku-edit-id="e-622b9da8-4f76-4755-8d71-a0d70b33e48c" d="M105 76H149"/><path shuku-edit-id="e-acdb6514-0f8b-40ca-83a3-0374361bdc1d" d="M337 76H386"/><path shuku-edit-id="e-b9105a6b-2e72-4a3a-9a9a-f5bfc569ccf9" d="M574 76H617"/></g>
    <rect shuku-edit-id="e-78d7229b-a877-4406-851e-4db1fa5ae71c" x="8" y="42" width="96" height="68" rx="13" fill="#eaf5fb" stroke="#438bb0"/>
    <text shuku-edit-id="e-bb151444-977d-446a-a554-aae72d9f5e26" x="56" y="84" textAnchor="middle" className="rl-svg-math" fill="#2b7296">X</text>
    <rect shuku-edit-id="e-6dbeb30a-7eeb-4021-98da-63e6aa555467" x="152" y="34" width="182" height="84" rx="13" fill="#fff" stroke="#9dbdce"/>
    <text shuku-edit-id="e-0224ed6c-0391-4664-aa3e-cd8392ca5321" x="243" y="83" textAnchor="middle" className="rl-svg-module">注意力子层</text>
    <rect shuku-edit-id="e-9a96c2e4-7436-488a-b354-2043edbd6585" x="389" y="34" width="182" height="84" rx="13" fill="#fff" stroke="#e2b58f"/>
    <text shuku-edit-id="e-e4e67f1b-15ce-4f2e-b7da-09ae7b020c43" x="480" y="83" textAnchor="middle" className="rl-svg-module">FFN 子层</text>
    <rect shuku-edit-id="e-32847ac5-a2e7-498d-9ea5-d3ee347234c2" x="622" y="42" width="155" height="68" rx="13" fill="#fff0e8" stroke="#df977b"/>
    <text shuku-edit-id="e-94d43dd6-87a9-4fca-a50e-5a0dae15f7d8" x="699" y="84" textAnchor="middle" className="rl-svg-math" fill="#c56438">H(X)</text>
    <text shuku-edit-id="e-f8239165-bb94-4f52-ba2f-77c2061b6dff" x="56" y="151" textAnchor="middle" className="rl-svg-label">输入表示</text>
    <text shuku-edit-id="e-f7c491a4-fece-40b3-8070-acb93db10ec8" x="699" y="151" textAnchor="middle" className="rl-svg-label">完整新表示</text>
  </svg>;
}
export function ResidualIntroCard({ onComplete }: Props) {
    return <LessonStage title="子层怎样保留已有信息？" description="先看原输入经过的路径，再想想：能否让它直接参与输出？" className="tr-stage rl-page rl-intro">
    <div shuku-edit-id="e-bdec91f9-691c-419b-9c63-c2ee02035e39" className="rl-intro-layout">
      <section shuku-edit-id="e-9c7c63db-1d6b-4d58-9d5b-846ac9aabece" className="rl-panel rl-problem-panel">
        <header shuku-edit-id="e-8fd32d00-06d3-4a30-a0c4-63b96c0d646a">当下模型的问题</header>
        <div shuku-edit-id="e-d81cb006-e748-4c71-bdfb-b7b77f55ae37" className="rl-problem-flow"><OrdinaryFlow /></div>
        <div shuku-edit-id="e-64fa8378-561c-4a29-b83a-42a7fe23c5f6" className="rl-problems">
          <article shuku-edit-id="e-1d7e8a13-2d72-4a41-a19d-ddb41a916924" className="rl-two-tasks">
            <h3 shuku-edit-id="e-ae118fec-97bd-42bd-bbca-5a0d2626f90b">既要保留，又要学习</h3>
            <div shuku-edit-id="e-67908ae8-efd8-4556-9542-b661b7798967" className="rl-task-art"><img shuku-edit-id="e-54289c2a-ff19-496f-a327-1037e04827d0" src={transformerAsset("06_残差连接/机器人双任务.webp")} alt="课程机器人冒汗，吃力地抱着两个任务箱"/><span shuku-edit-id="e-698c1813-bd59-4aa2-aaec-cf937c898fef" className="rl-task-label rl-task-old">保留<br shuku-edit-id="e-443d9d71-1493-41dd-b911-56596287d8d0" />已有信息 X</span><span shuku-edit-id="e-5f8aba04-89c6-4aff-8dc3-47eb04088213" className="rl-task-label rl-task-new">学习<br shuku-edit-id="e-c000cee6-8dce-4789-a77e-144352fada23" />新的关系</span></div>
          </article>
          <article shuku-edit-id="e-2f8121c9-7f25-4aeb-86bf-1efb33d36b97" className="rl-gradient-problem">
            <h3 shuku-edit-id="e-c8bf63d9-6688-4904-893b-f51eac5ccefb">梯度的路也很长</h3>
            <div shuku-edit-id="e-ad24ba2d-a189-4c1d-b250-d91cac7bea05" className="rl-gradient-stairs"><svg shuku-edit-id="e-e276e849-306f-4cf2-afde-2ef72b812d13" viewBox="0 0 790 1024" role="img" aria-label="梯度从深层向浅层逐层传播，机器人沿多段折返楼梯吃力下行"><image shuku-edit-id="e-fa211a91-d159-4c4a-8d18-c1606bcb5eb8" href={transformerAsset("06_残差连接/梯度阶梯与电梯.webp")} width="1536" height="1024"/></svg><span shuku-edit-id="e-93e57bac-2ce4-49c9-8ecb-96ad1ac110f6" className="rl-stairs-deep">深层</span><span shuku-edit-id="e-b574d825-0789-46a9-b0e9-777511369378" className="rl-stairs-shallow">浅层</span></div>
            <p shuku-edit-id="e-c70cd5b0-935c-4951-bde7-16ccc762eb66">梯度连续穿过复杂变换，<br shuku-edit-id="e-3dc6acd5-bef0-4c35-b2ca-833a6c18d017" /><strong shuku-edit-id="e-10fd9ecb-86ef-4bf4-8e65-4598c0e9bcda">深层网络更难优化。</strong></p>
          </article>
        </div>
      </section>
      <section shuku-edit-id="e-e4b5d2c1-346f-4574-ac10-5a4f717e3f71" className="rl-panel rl-idea-panel">
        <header shuku-edit-id="e-2d58cf7d-5dbd-4792-bc93-dfaac95ced1c">如果模型只学习“变化”呢？</header>
        <p shuku-edit-id="e-691eda2f-6e18-4ebb-b542-cbf0993d3e47" className="rl-idea-lead">保留已有信息，<br shuku-edit-id="e-f50eed98-5880-430c-bd41-3e1b8a54fe94" />专注于<strong shuku-edit-id="e-8ba1ee17-20da-4659-a42e-da8b1d7b4734">补充变化</strong>。</p>
        <div shuku-edit-id="e-817ee7f9-cc9e-46a8-8fc2-753e6c4b543b" className="rl-residual-definition" aria-label="残差F(X)等于完整新表示H(X)减去原输入X">
          <div shuku-edit-id="e-8f0a528e-fba0-43d6-8b47-0fdec90ac230" className="rl-residual-term"><b shuku-edit-id="e-2a545da3-750f-4c11-8b56-bdc164d3eca0">F(X)</b><span shuku-edit-id="e-ff568cf9-6515-4d09-85e3-c14eec3f5b06">残差 · 变化量</span></div>
          <i shuku-edit-id="e-867c01da-c054-4dcc-a035-72308b936329">=</i>
          <div shuku-edit-id="e-617a4c5a-2065-440e-aa67-dddc7f95038d" className="rl-definition-pair"><div shuku-edit-id="e-30adbd26-0449-4ca3-b7d8-ae92d8893372"><b shuku-edit-id="e-3bc093fa-5016-40cc-bfe6-a32714c05127">H(X)</b><span shuku-edit-id="e-097685b7-4767-4b19-841f-acff960448c2">完整新表示</span></div><i shuku-edit-id="e-eae083b6-e1d7-41e8-a3f9-82d8e38bc8d8">−</i><div shuku-edit-id="e-66545a47-a2f4-46fb-94f1-66b794ab542a"><b shuku-edit-id="e-486bd376-8a0d-4a72-bf7b-b807a6ca5c4c">X</b><span shuku-edit-id="e-dce7d3ba-5221-4650-820e-3342da8ecef7">原输入</span></div></div>
        </div>
      </section>
    </div>
    <footer shuku-edit-id="e-de0cf70d-964e-4a68-8874-8834403eff91" className="rl-footer"><Button variant="primary" onClick={onComplete}>加入残差连接 →</Button></footer>
  </LessonStage>;
}
function ResidualCombinedFlow({ run, replay }: {
    run: number;
    replay: number;
}) {
    const id = useId().replace(/:/g, '');
    const firstSkip = 'M72 132 V66 Q72 52 86 52 H646 Q660 52 660 66 V108';
    const secondSkip = 'M770 132 V66 Q770 52 784 52 H1336 Q1350 52 1350 66 V108';
    return <svg shuku-edit-id="e-2ed1c2d3-30d1-4b14-9943-4bbc68035b21" className="rl-combined-flow" viewBox="0 0 1530 260" role="img" aria-label="完整残差流程：X经过多头注意力产生F₁(X)，与X相加得到H；H经过逐位前馈网络产生F₂(H)，与H相加得到Z。两个子层分别有跳线。">
      <defs shuku-edit-id="e-b2d27854-8de2-4e56-95cf-64b95da7cbde">
        <marker shuku-edit-id="e-55363f78-9875-4828-b187-7ef08b6ab5b8" id={`${id}-blue`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path shuku-edit-id="e-41212049-80b1-4e7b-9f07-9c50fb60c937" d="M0 0L7 3L0 6" fill="#438bb0"/></marker>
        <marker shuku-edit-id="e-ad71cea9-5b0d-4cfe-bcde-6c489bd1c7f0" id={`${id}-orange`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path shuku-edit-id="e-8a97fdd4-db92-4f09-9e14-eccf455acda8" d="M0 0L7 3L0 6" fill="#d58342"/></marker>
        <marker shuku-edit-id="e-1d9357ed-f821-4802-bd4c-b8104c26e467" id={`${id}-green`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path shuku-edit-id="e-6055d689-48e9-4b61-93f8-b8c73d8ded2c" d="M0 0L7 3L0 6" fill="#3c9b91"/></marker>
      </defs>
      <path shuku-edit-id="e-d5f074bc-b34c-4677-8a9d-d041644b6f3f" d={firstSkip} className="rl-skip-path" markerEnd={`url(#${id}-blue)`}/>
      <path shuku-edit-id="e-ec6aad78-8f57-4827-8dc4-3ce576ade805" d={secondSkip} className="rl-skip-path" markerEnd={`url(#${id}-blue)`}/>
      <text shuku-edit-id="e-a67eeca9-3724-4def-9cb0-9831232724d7" x="365" y="30" textAnchor="middle" className="rl-svg-label">保留 X · 跳线</text>
      <text shuku-edit-id="e-e073b43c-3033-452c-92a2-db90be98191b" x="1060" y="30" textAnchor="middle" className="rl-svg-label">保留 H · 跳线</text>
      {['M121 132H177', 'M820 132H882'].map(path => <path shuku-edit-id="e-07171e21-0146-4eb3-a934-04551a8fbe91" key={path} d={path} className="rl-input-path" markerEnd={`url(#${id}-blue)`}/>)}
      {['M370 132H437', 'M585 132H632', 'M1085 132H1147', 'M1295 132H1322'].map(path => <path shuku-edit-id="e-0bb4f021-cdbd-408c-a163-bbe812d971c7" key={path} d={path} className="rl-delta-path" markerEnd={`url(#${id}-orange)`}/>)}
      {['M686 132H717', 'M1376 132H1417'].map(path => <path shuku-edit-id="e-51d73fc8-e9ed-4f54-93e4-f30ba9be6bac" key={path} d={path} className="rl-result-path" markerEnd={`url(#${id}-green)`}/>)}
      <rect shuku-edit-id="e-680be15f-7566-41d7-83ac-87213b8bd089" x="23" y="96" width="98" height="72" rx="12" fill="#eaf5fb" stroke="#7aaac3"/>
      <text shuku-edit-id="e-67c86cfc-b6ae-4a3f-92d4-ae211eba1de7" x="72" y="128" textAnchor="middle" className="rl-svg-math" fill="#2b7296">X</text><TinyMatrix x={53} y={139}/>
      <rect shuku-edit-id="e-fbba10c1-5baf-4d22-85e3-4aafc98b61ad" x="180" y="89" width="190" height="86" rx="13" fill="#f1f8fc" stroke="#8eb7cc"/>
      <text shuku-edit-id="e-6fd90e25-cc1f-4612-873a-7e7c7705aa36" x="275" y="141" textAnchor="middle" className="rl-svg-module">注意力子层</text>
      <rect shuku-edit-id="e-e02e5caf-9c20-4c96-b230-e5d010b184da" x="440" y="96" width="145" height="72" rx="12" fill="#fff0df" stroke="#d58342"/>
      <text shuku-edit-id="e-5baf84e1-5e29-4089-ade0-7c6a5961263b" x="512" y="128" textAnchor="middle" className="rl-svg-math rl-svg-delta">F₁(X)</text><TinyMatrix x={493} y={139} color="#d58342"/>
      <circle shuku-edit-id="e-6b43b650-b67a-451b-a8e9-4a0976b241ca" cx="660" cy="132" r="25" fill="#fff" stroke="#3c9b91" strokeWidth="3"/><text shuku-edit-id="e-eb23a183-167a-4ff6-a9c5-2e6b4676bd49" x="660" y="143" textAnchor="middle" fontSize="37" fill="#3c9b91">+</text>
      <g shuku-edit-id="e-1904b09d-b0db-4a0f-9189-5e9acfc444ac" visibility={run >= 2 ? 'visible' : 'hidden'} data-result="H">
        <rect shuku-edit-id="e-6cf3429f-f94b-43c8-aec9-f028835d2b0b" x="720" y="96" width="100" height="72" rx="12" fill="#eef9f5" stroke="#3c9b91"/>
        <text shuku-edit-id="e-e5717552-5bad-434c-88d8-f5ea7a3b35c2" x="770" y="128" textAnchor="middle" className="rl-svg-math" fill="#27877c">H</text><TinyMatrix x={751} y={139} color="#3c9b91"/>
        <text shuku-edit-id="e-af3849bb-224d-4952-adf0-eafcf737b5cc" x="770" y="204" textAnchor="middle" className="rl-svg-label">相加输出</text>
        <text shuku-edit-id="e-5a1527fb-47fd-4e82-a9e2-e07bfd3ae04d" x="360" y="251" textAnchor="middle" className="rl-svg-math rl-flow-equation">H = X + F₁(X)</text>
      </g>
      <rect shuku-edit-id="e-a42e4f71-a7a1-48d9-a596-f104ce6b2682" x="885" y="89" width="200" height="86" rx="13" fill="#fff7ee" stroke="#e2b58f"/>
      <text shuku-edit-id="e-683bdf6c-0289-4c07-a8a7-2205d120e8fe" x="985" y="141" textAnchor="middle" className="rl-svg-module">FFN 子层</text>
      <rect shuku-edit-id="e-fb39786b-5b02-4836-b391-5b1d6b9bb244" x="1150" y="96" width="145" height="72" rx="12" fill="#fff0df" stroke="#d58342"/>
      <text shuku-edit-id="e-a919b660-f4a0-4d2e-93f1-f6bae9e50aed" x="1222" y="128" textAnchor="middle" className="rl-svg-math rl-svg-delta">F₂(H)</text><TinyMatrix x={1203} y={139} color="#d58342"/>
      <circle shuku-edit-id="e-5c3bd1af-8de2-42f3-9610-f447c3f135bf" cx="1350" cy="132" r="25" fill="#fff" stroke="#3c9b91" strokeWidth="3"/><text shuku-edit-id="e-693a2dce-105d-492b-a007-e683ec1293d1" x="1350" y="143" textAnchor="middle" fontSize="37" fill="#3c9b91">+</text>
      <g shuku-edit-id="e-28b36846-bffc-4470-8077-f1e9beb3e087" visibility={run >= 3 ? 'visible' : 'hidden'} data-result="Z">
        <rect shuku-edit-id="e-6aed2571-b2b3-4039-8395-cd3c3142cace" x="1420" y="96" width="88" height="72" rx="12" fill="#eef9f5" stroke="#3c9b91"/>
        <text shuku-edit-id="e-8cc666cb-bf4a-4ae9-8929-67ce9fdbc001" x="1464" y="128" textAnchor="middle" className="rl-svg-math" fill="#27877c">Z</text><TinyMatrix x={1445} y={139} color="#3c9b91"/>
        <text shuku-edit-id="e-357a519b-6008-406b-83b2-6a1d8726e37d" x="1464" y="204" textAnchor="middle" className="rl-svg-label">相加输出</text>
        <text shuku-edit-id="e-977207db-10a0-4d41-8c19-8adad951bdd7" x="1055" y="251" textAnchor="middle" className="rl-svg-math rl-flow-equation">Z = H + F₂(H)</text>
      </g>
      <text shuku-edit-id="e-c7182093-8cc5-4d29-91b3-2fd914810dd3" x="72" y="204" textAnchor="middle" className="rl-svg-label">输入</text>
      <text shuku-edit-id="e-d440ce7d-4f4f-4eb8-9480-09092ccd6aa0" x="512" y="204" textAnchor="middle" className="rl-svg-label rl-delta-label">子层输出 · 残差</text>
      <text shuku-edit-id="e-d089b827-7763-4ed7-b5ab-c0bf58946a95" x="1222" y="204" textAnchor="middle" className="rl-svg-label rl-delta-label">子层输出 · 残差</text>
      {(run === 1 || run === 2) && <SvgPathTraveler key={`skip-${run}-${replay}`} path={run === 1 ? firstSkip : secondSkip} durationMs={1800} className="rl-traveler"><rect shuku-edit-id="e-6d0a246b-8485-4f2f-a139-b9844e1a3b3c" x="-24" y="-18" width="48" height="36" rx="6" fill="#fff" stroke="#438bb0" strokeWidth="2"/><TinyMatrix x={-19} y={-10}/></SvgPathTraveler>}
    </svg>;
}
function NearPath() {
    return <svg shuku-edit-id="e-8fb2f4ac-228c-4afa-9535-e5b7acb52664" viewBox="0 0 200 70" role="img" aria-label="输入有直接通路，也经过子层分支">
    <path shuku-edit-id="e-9280c5b2-8ebf-4d4d-b6de-8975f379d6de" d="M18 20H168 M18 20V56H168V20" fill="none" stroke="#95abba" strokeWidth="3"/>
    <path shuku-edit-id="e-144f9a7b-9976-4da1-9eed-220782ec2895" d="M18 20H168" stroke="#438bb0" strokeWidth="4"/><circle shuku-edit-id="e-4de29a0d-ed9a-4038-938b-bbbd73e93eb9" cx="18" cy="20" r="10" fill="#438bb0"/><circle shuku-edit-id="e-fcb21071-7e26-4dac-b498-2cdcf165d30b" cx="174" cy="20" r="15" fill="#fff" stroke="#3c9b91" strokeWidth="2"/><text shuku-edit-id="e-3e7138d9-da50-4607-9056-c03964233c30" x="174" y="28" textAnchor="middle" fontSize="26" fill="#3c9b91">+</text>
    <rect shuku-edit-id="e-c6a9733c-059b-4552-9dd2-0f1eb2a2aec0" x="79" y="4" width="36" height="29" rx="5" fill="#f5fafc"/><text shuku-edit-id="e-0d69bb39-2a79-4623-bd37-f9d6193a682d" x="97" y="27" textAnchor="middle" fontSize="26" fontStyle="italic" fontFamily="Georgia,serif" fill="#2b7296">X</text>
    <rect shuku-edit-id="e-45d11160-7590-4551-9892-7757767453c8" x="64" y="40" width="68" height="30" rx="6" fill="#fff0df" stroke="#d58342"/><text shuku-edit-id="e-2e85bdc4-af20-42be-a6f7-c404edeb6fd3" x="98" y="62" textAnchor="middle" fontSize="23" fill="#bb672c">F(X)</text>
  </svg>;
}
function IncrementPicture() {
    return <svg shuku-edit-id="e-b310c49d-d349-48c5-866e-55df4db02f37" viewBox="0 0 200 70" role="img" aria-label="原输入加上接近零的增量，近似保留原输入">
    <rect shuku-edit-id="e-e15a5dd5-76e7-45ba-a369-e5edcde411af" x="8" y="12" width="40" height="43" rx="6" fill="#eaf5fb" stroke="#438bb0"/><TinyMatrix x={9} y={22}/>
    <text shuku-edit-id="e-06beb7a9-a486-4c3d-b646-ee62f0953f8f" x="60" y="44" fontSize="28" fill="#6c8293">+</text><text shuku-edit-id="e-77c26bf2-97f9-41ad-8daa-833e476de557" x="85" y="46" fontSize="39" fill="#d58342">0</text><text shuku-edit-id="e-3bd2d0f4-6db5-41fd-b414-1420df9cc407" x="120" y="44" fontSize="28" fill="#6c8293">≈</text>
    <rect shuku-edit-id="e-ff6c857d-6c93-42c8-9afc-f2657478f557" x="157" y="12" width="40" height="43" rx="6" fill="#eef9f5" stroke="#3c9b91"/><TinyMatrix x={158} y={22} color="#3c9b91"/>
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
    <div shuku-edit-id="e-686beb54-fade-43ec-978f-496cb3ea0124" className="rl-mechanism-body">
      <div shuku-edit-id="e-bc7a946a-f8d7-4a37-acce-6c1cc6cf24ef" className="rl-module-row">
        <ResidualCombinedFlow run={run} replay={replay}/>
      </div>
      <div shuku-edit-id="e-f5f6b813-b4af-4ee4-9528-8138ca7b8564" className="rl-explanation-row">
        <section shuku-edit-id="e-0bb7d207-0ffd-4bd4-94d2-5591f7fbcec1" className="rl-panel rl-role-panel">
          <header shuku-edit-id="e-45b492d1-a1d1-4419-9177-a010c0ed9427">子层输出的角色变了</header>
          <div shuku-edit-id="e-0d5a6e15-81c8-498d-b534-cc6ddfbe4f6c" className="rl-role-prose"><p shuku-edit-id="e-36206ee5-d3b2-4c32-8e1a-df3512fac1ac">无跳线：子层输出<strong shuku-edit-id="e-cbf04aeb-21b4-41e1-a1f7-0dda53d89e46" className="rl-original-key">完整表示 <em shuku-edit-id="e-07a05027-c0b1-477e-a0e8-35b4dbd1f392">H(X)</em></strong>。</p><p shuku-edit-id="e-78efaef2-885a-4673-b98f-d73f0f171ed5">加入跳线并训练后，<em shuku-edit-id="e-1796af0f-5bf9-466b-8906-74047c23e19b">X</em> 提供基础，<strong shuku-edit-id="e-2c548f25-9343-4103-b466-132eb1457491">F(X)</strong> 学习<strong shuku-edit-id="e-f5ff030d-cc5b-4f69-9779-49f0976e6604">残差增量</strong>。</p></div>
        </section>
        <section shuku-edit-id="e-99e378f3-c814-4cae-9877-5a2161aeb452" className="rl-panel rl-benefits-panel">
          <header shuku-edit-id="e-7e115508-3b31-4b34-b879-c53459beb44d">为什么这样更容易堆深？</header>
          <div shuku-edit-id="e-5ced3243-ae05-4b2b-b5f2-750e0986763e" className="rl-benefits">
            <article shuku-edit-id="e-f68a6c0c-16fb-4848-8550-76451d05156b"><div shuku-edit-id="e-aedca409-2544-4ead-b1dc-ba7453c9b984" className="rl-benefit-art"><NearPath /></div><div shuku-edit-id="e-6df45c37-10a0-4842-a6ca-43070f3bd121"><h3 shuku-edit-id="e-b25f34d4-1060-48a9-891a-c37a9273d6bb">信息有路可走</h3><p shuku-edit-id="e-97c96d9e-c761-47b5-a8fd-4d50aac02619">X 直接参与新表示。</p></div></article>
            <article shuku-edit-id="e-914d4478-74ca-41f5-a344-445ef9003aa5" className="rl-gradient-benefit"><div shuku-edit-id="e-de3aae54-5437-4b88-9a2b-8e718394a47c" className="rl-gradient-art"><svg shuku-edit-id="e-c270dcae-9687-4527-99f1-cd6ce96ace75" viewBox="820 40 660 960" role="img" aria-label="梯度近路：机器人乘电梯沿恒等路径下行"><image shuku-edit-id="e-2234b8bf-9787-4c9a-a102-adf87bf0a43e" href={transformerAsset("06_残差连接/梯度阶梯与电梯.webp")} width="1536" height="1024"/></svg></div><div shuku-edit-id="e-160b7000-5f02-4da9-b393-95ef3d8bba70"><h3 shuku-edit-id="e-a2530364-eb4a-4f28-b23c-d45f8ad1ff46">梯度多一条近路</h3><p shuku-edit-id="e-960b9cf3-6d7e-45b1-ab50-695be6ece433">深层网络<strong shuku-edit-id="e-45f30e71-7079-4807-98bc-41fac3665e66">更容易优化</strong>。</p></div></article>
            <article shuku-edit-id="e-b6129f11-b6df-499d-ae14-ea237e3f4e2a"><div shuku-edit-id="e-cf2c39c6-9def-46f3-b1aa-7830d28a09b2" className="rl-benefit-art"><IncrementPicture /></div><div shuku-edit-id="e-8aa2d88a-573c-4e9b-b532-f968ab3571e7"><h3 shuku-edit-id="e-b89e3b3e-1992-4d74-bcaa-416271d2465a">只需学习增量</h3><p shuku-edit-id="e-011ce28b-f60e-4c98-824c-f05493dff883">无需修改时，<strong shuku-edit-id="e-48b58b5a-1577-4290-861b-63685bd9bb28">F(X) ≈ 0</strong>。</p></div></article>
          </div>
        </section>
      </div>
    </div>
    <footer shuku-edit-id="e-8a44d824-7146-49a5-b330-8a8d7b536266" className="rl-footer"><span shuku-edit-id="e-2b558bb8-3714-4f17-b283-2ae09a30c10c">逐元素相加，形状不变 · 本页暂略层规范化</span><div shuku-edit-id="e-c81b6afa-302d-4128-8f4a-7c191140f294"><Button disabled={run === 1 || run === 2} onClick={() => { setReplay(value => value + 1); setRun(1); }}>{run === 3 ? '重新演示两条跳线' : '演示两条跳线'}</Button><Button variant="primary" onClick={onComplete}>继续：层规范化 →</Button></div></footer>
  </LessonStage>;
}
