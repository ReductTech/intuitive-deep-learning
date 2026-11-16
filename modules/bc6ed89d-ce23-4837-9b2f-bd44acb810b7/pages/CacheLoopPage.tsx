import { useEffect, useId, useState } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
import './CacheLoopPage.css';

const TOKENS = ['我', '爱', '学', '习', '新'];
const CAPTIONS = ['缓存就绪，开始这一轮。', '计算当前 Q、K、V。', '从缓存取出已有的 K/V。', '当前 Q 与全部 K/V 计算注意力。', '只将新增的 K/V 存入缓存。', '模型继续计算，预测下一字。', '下一字进入新一轮。'];
const ACTIONS = ['计算新 Q/K/V', '读取旧 K/V', '完成注意力计算', '写入新 K/V', '预测下一个字', '送回新字', '开始下一轮'];

function Bars({ kind, tokens }: { kind: 'q' | 'k' | 'v'; tokens: string[] }) {
  return <div shuku-edit-id="e-ae4459a7-2efb-4785-a944-4f8ad1cfa288" className={`kvl-bars kvl-${kind}`}>
    {tokens.map(token => <Typography shuku-edit-id="e-1a28af68-cc78-4e90-a9d5-bacb3820ac31" as="span" variant="bodySmall" tone="inherit" className="kvl-bar" key={token}>{token}</Typography>)}
  </div>;
}

export function CacheLoopPage() {
  const marker = useId().replace(/:/g, '');
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => setRunning(false), phase === 6 ? 2400 : 2200);
    return () => window.clearTimeout(timer);
  }, [running, phase]);
  const current = TOKENS[round + 1];
  const next = TOKENS[round + 2];
  const old = TOKENS.slice(0, round + 1);
  const cache = TOKENS.slice(0, round + (phase > 4 || (phase === 4 && !running) ? 2 : 1));
  const all = [...old, current];
  const readPath = `M765 ${133 + round * 25} V342 Q765 360 783 360 H824 Q842 360 842 378 V${473 + round * 25}`;
  const writePath = `M344 559 H474 Q490 559 490 543 V355 Q490 337 508 337 H765 V${183 + round * 50}`;
  const advance = () => {
    if (phase === 6) {
      setRound(r => r === 2 ? 0 : r + 1); setPhase(0); return;
    }
    setPhase(phase + 1);
    if ([2, 4, 6].includes(phase + 1)) setRunning(true);
  };
  return <section shuku-edit-id="e-413ff292-b42a-42ed-8dd0-35288f58b6ca" className="kvl-slide" aria-label="KV Cache 第五页：缓存读取与追加">
    <header shuku-edit-id="e-73b3447e-715b-4b2f-a9f6-28cbf5fbe603" className="kvl-header">
      <Typography shuku-edit-id="e-57792d09-9eb4-40d4-a309-f28babc4c067" as="h1" variant="h1">把 K、V 存起来，不再重复计算</Typography>
      <Typography shuku-edit-id="e-0b4d3cbb-b099-4ab1-93f1-6933531427de" as="p" variant="bodySmall" tone="muted">每点一次走一步：读取旧向量，只追加新向量。</Typography>
    </header>
    <main shuku-edit-id="e-64f1814b-cd43-4b2b-9496-7f0d88f73332" className={`kvl-stage kvl-phase-${phase}`}>
      <svg shuku-edit-id="e-d91481ed-9a0a-4ebc-96f4-2f0e7b811c7b" className="kvl-paths" viewBox="0 0 1488 660" aria-hidden="true">
        <defs shuku-edit-id="e-236e371b-fb0d-445d-b79a-c4b3bf39113f"><marker shuku-edit-id="e-6c476a8c-7329-49a3-8ede-ccd91af8d9e9" id={marker} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path shuku-edit-id="e-6d2a2216-01c0-4d48-b58e-189db36b54ae" d="M0 0 L8 4 L0 8 Z" fill="currentColor" /></marker></defs>
        <g shuku-edit-id="e-675519a7-2c01-4d9a-9e56-5390080d7530" markerEnd={`url(#${marker})`}>
          <path shuku-edit-id="e-c8a6eb08-d70e-4b76-a71b-e75e5194b0c7" className={phase === 1 ? 'is-active' : ''} d="M145 477 H182" />
          <path shuku-edit-id="e-61028c37-1725-4c37-80e9-f9645e6558e4" className={phase === 3 ? 'is-active' : ''} d="M465 477 H548" />
          <path shuku-edit-id="e-c7f34ae4-8ecf-4cc4-ae14-6612d1c1ee87" className={phase === 5 ? 'is-active' : ''} d="M980 477 H1018" />
          <path shuku-edit-id="e-777a081e-5d78-47a0-89f2-203514d2fee8" className={phase === 5 ? 'is-active' : ''} d="M1250 477 H1340" />
          <path shuku-edit-id="e-0b8bf3c6-7974-414c-b4df-a6d829549eee" className={phase === 2 ? 'is-active' : ''} d="M765 332 V342 Q765 360 783 360 H824 Q842 360 842 378 V448" />
          <path shuku-edit-id="e-697a997f-9203-4c7e-bc93-5d5854d5b92d" className={phase === 4 ? 'is-active' : ''} d="M344 559 H474 Q490 559 490 543 V355 Q490 337 508 337 H765 V332" />
          <path shuku-edit-id="e-151ff82f-69ff-4219-977d-8455e13e193e" className={`kvl-return-path ${phase === 6 ? 'is-active' : ''}`} d="M1390 539 V628 Q1390 642 1376 642 H93 Q79 642 79 628 V539" />
        </g>
      </svg>
      <div shuku-edit-id="e-ac8a0494-6ac1-438b-a09a-17ba41d288cb" className="kvl-cache">
        <div shuku-edit-id="e-1f2936dd-d945-48b8-847f-d6179f64b08a" className="kvl-cache-header"><Typography shuku-edit-id="e-a6c5c4fd-2fac-4d7b-8333-fe816effaad6" as="strong" variant="h3">KV Cache</Typography><Typography shuku-edit-id="e-bfafd9c7-6c03-4b5a-bb3d-98b670eba2f6" as="span" variant="bodySmall" tone="muted">第 {round + 1} / 3 轮</Typography></div>
        <div shuku-edit-id="e-8588e514-2c77-4900-9dc3-7abfc6b39d45" className="kvl-cache-columns">
          <div shuku-edit-id="e-f6f471c1-24d4-461e-8ede-012f601137b7"><Typography shuku-edit-id="e-f6600467-1984-4818-9af7-b7d2557dfd5d" as="strong" variant="bodySmall">K</Typography><Bars kind="k" tokens={cache} /></div>
          <div shuku-edit-id="e-df0803aa-f397-43ed-bbf1-026f8cb47fde"><Typography shuku-edit-id="e-b9a4cb85-f4f6-4aaa-bf9b-f4e51bff11b8" as="strong" variant="bodySmall">V</Typography><Bars kind="v" tokens={cache} /></div>
        </div>
      </div>
      <Typography shuku-edit-id="e-e28ab5ad-f82d-491c-b34b-6f3246e57b37" as="span" variant="bodySmall" className="kvl-read-label" tone="muted">读取</Typography>
      <Typography shuku-edit-id="e-30c1dae6-4c12-4618-9854-12d587e05673" as="span" variant="bodySmall" className="kvl-write-label" tone="muted">追加</Typography>
      {running && (phase === 2 || phase === 4) && <div shuku-edit-id="e-f1de5c11-ce6c-40f7-adc8-96604fd9632b" className={`kvl-flight kvl-flight--${phase === 2 ? 'read' : 'write'}`} style={{ offsetPath: `path("${phase === 2 ? readPath : writePath}")` }} aria-hidden="true">
        <div shuku-edit-id="e-844fb3d7-2e7c-4b74-8de7-232580edbbe0"><Typography shuku-edit-id="e-a307dd08-8f87-49f8-9a5b-5e529bdf5a7a" as="span" variant="bodySmall">K</Typography><Bars kind="k" tokens={phase === 2 ? old : [current]} /></div>
        <div shuku-edit-id="e-b703cef5-be00-4ca0-be56-19650af44616"><Typography shuku-edit-id="e-a37d2871-559d-4b07-b90f-24b2dfce741a" as="span" variant="bodySmall">V</Typography><Bars kind="v" tokens={phase === 2 ? old : [current]} /></div>
      </div>}
      <div shuku-edit-id="e-a580f979-74fb-4190-94b3-3e2e66852e2b" className="kvl-input"><Typography shuku-edit-id="e-bcb5aa85-e29a-444e-a937-5c3ef167fe3b" as="span" variant="bodySmall" tone="muted">本轮送入</Typography><Typography shuku-edit-id="e-bdf51727-74d4-4a70-a040-532f28258947" as="strong" variant="h2" className={`kvl-token ${phase === 6 && running ? 'kvl-hidden' : ''}`}>{phase === 6 ? next : current}</Typography></div>
      <div shuku-edit-id="e-654b7315-0067-41d1-a95c-901fad6557c3" className={`kvl-project ${phase >= 1 ? 'is-visible' : ''}`}>
        <Typography shuku-edit-id="e-42126958-7988-4862-b7d7-61f680524a35" as="strong" variant="bodySmall">新字的 Q / K / V</Typography>
        <div shuku-edit-id="e-aa38edf4-c89f-45b0-a4c6-6a3a0cd415db" className="kvl-projection-row"><Typography shuku-edit-id="e-e3582761-08a4-4e98-bbc6-c78e8d906a79" as="span" variant="bodySmall">Q</Typography><Bars kind="q" tokens={[current]} /></div>
        <div shuku-edit-id="e-274158e6-ac37-459e-97cb-5513b5c0702f" className="kvl-projection-row"><Typography shuku-edit-id="e-3798bc81-2f9a-4854-98e0-4cffe314f105" as="span" variant="bodySmall">K</Typography><Bars kind="k" tokens={[current]} /></div>
        <div shuku-edit-id="e-ee5181f4-b1e4-4c2e-953e-b11c31868b2c" className="kvl-projection-row"><Typography shuku-edit-id="e-a5914831-d13f-4858-8e91-d26d9063bb73" as="span" variant="bodySmall">V</Typography><Bars kind="v" tokens={[current]} /></div>
      </div>
      <div shuku-edit-id="e-9ace28b0-51b1-4223-8cc8-718c5cd9c66b" className={`kvl-attention ${phase > 2 || (phase === 2 && !running) ? 'is-visible' : ''}`}>
        <Typography shuku-edit-id="e-cec0de2c-7e16-4f32-a9fe-0a36addcfa5c" as="strong" variant="bodySmall">注意力计算</Typography>
        <div shuku-edit-id="e-e65ff508-08aa-42e7-9de5-fa608b843619" className="kvl-use-matrices">
          <div shuku-edit-id="e-4d571521-f817-415c-bfb5-be3201110d94"><Typography shuku-edit-id="e-1d353beb-df11-47f0-aa87-e0bfa858d98c" as="span" variant="bodySmall">Q</Typography>{phase >= 3 && <div shuku-edit-id="e-3c7465f5-645b-4862-9325-4d0f4585521d" className="kvl-bars kvl-q">{old.map(token => <span shuku-edit-id="e-8e317bf2-d0c0-459e-9234-e54e8e4d28a5" className="kvl-empty-row" aria-hidden="true" key={token} />)}<Typography shuku-edit-id="e-8a13efa7-b32b-4f9e-b24f-e7f97a50cced" as="span" variant="bodySmall" tone="inherit" className="kvl-bar">{current}</Typography></div>}</div>
          <div shuku-edit-id="e-6ba7e15a-39ab-4c82-91e3-81a03ee4d57d"><Typography shuku-edit-id="e-23ae0cc8-b4d0-45f2-95b0-753e7c5ae433" as="span" variant="bodySmall">K</Typography><Bars kind="k" tokens={phase >= 3 ? all : old} /></div>
          <div shuku-edit-id="e-1ac939fe-e6d8-41cc-864d-e857e3eac310"><Typography shuku-edit-id="e-a3c4a717-52a9-4fd1-bded-54a4d763946e" as="span" variant="bodySmall">V</Typography><Bars kind="v" tokens={phase >= 3 ? all : old} /></div>
        </div>
      </div>
      <div shuku-edit-id="e-f49c5e41-e11a-418c-9c8d-f422385a52d6" className={`kvl-model ${phase >= 5 ? 'is-visible' : ''}`}><Typography shuku-edit-id="e-3390799d-e81d-44f0-990a-e83dd02624d8" as="strong" variant="bodySmall">模型其余计算<br shuku-edit-id="e-7fb57170-f981-4ffd-b080-f8eba020a8a7" />＋词表预测</Typography></div>
      <div shuku-edit-id="e-715067fc-4ea6-46f4-91b3-8a69c1375f1b" className={`kvl-result ${phase >= 5 ? 'is-visible' : ''}`}><Typography shuku-edit-id="e-a75fef9b-ee82-4c25-840c-7ae125f713fc" as="span" variant="bodySmall" tone="muted">下一个字</Typography><Typography shuku-edit-id="e-e61917ba-8f9f-46ad-941a-1c9e489ad018" as="strong" variant="h2" className="kvl-token">{next}</Typography></div>
      {phase === 6 && running && <Typography shuku-edit-id="e-95b3b14d-ce1e-4eaa-802c-711dea11992a" as="strong" variant="h2" className="kvl-feedback-token">{next}</Typography>}
    </main>
    <footer shuku-edit-id="e-de3f5849-c707-4285-87fb-82316c8552e8" className="kvl-footer">
      <Typography shuku-edit-id="e-1ee5296e-b764-4f0f-a948-e668a59815d2" as="p" variant="h2" align="center" className="kvl-subtitle" aria-live="polite">{phase === 6 && round === 2 ? '旧 K/V 被反复使用，却不必反复计算。' : CAPTIONS[phase]}</Typography>
      <Button variant="primary" onClick={advance} disabled={running}>{running ? '正在传递…' : phase === 6 && round === 2 ? '从头重看' : ACTIONS[phase]} →</Button>
    </footer>
  </section>;
}
