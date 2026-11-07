import { useEffect, useId, useState } from 'react';
import { Button, Typography } from '../../shared/react';
import './CacheLoopPage.css';

const TOKENS = ['我', '爱', '学', '习', '新'];
const CAPTIONS = ['缓存就绪，开始这一轮。', '计算当前 Q、K、V。', '从缓存取出已有的 K/V。', '当前 Q 与全部 K/V 计算注意力。', '只将新增的 K/V 存入缓存。', '模型继续计算，预测下一字。', '下一字进入新一轮。'];
const ACTIONS = ['计算新 Q/K/V', '读取旧 K/V', '完成注意力计算', '写入新 K/V', '预测下一个字', '送回新字', '开始下一轮'];

function Bars({ kind, tokens }: { kind: 'q' | 'k' | 'v'; tokens: string[] }) {
  return <div className={`kvl-bars kvl-${kind}`}>
    {tokens.map(token => <Typography as="span" variant="bodySmall" tone="inherit" className="kvl-bar" key={token}>{token}</Typography>)}
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
  return <section className="kvl-slide" aria-label="KV Cache 第五页：缓存读取与追加">
    <header className="kvl-header">
      <Typography as="h1" variant="h1">把 K、V 存起来，不再重复计算</Typography>
      <Typography as="p" variant="bodySmall" tone="muted">每点一次走一步：读取旧向量，只追加新向量。</Typography>
    </header>
    <main className={`kvl-stage kvl-phase-${phase}`}>
      <svg className="kvl-paths" viewBox="0 0 1488 660" aria-hidden="true">
        <defs><marker id={marker} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="currentColor" /></marker></defs>
        <g markerEnd={`url(#${marker})`}>
          <path className={phase === 1 ? 'is-active' : ''} d="M145 477 H182" />
          <path className={phase === 3 ? 'is-active' : ''} d="M465 477 H548" />
          <path className={phase === 5 ? 'is-active' : ''} d="M980 477 H1018" />
          <path className={phase === 5 ? 'is-active' : ''} d="M1250 477 H1340" />
          <path className={phase === 2 ? 'is-active' : ''} d="M765 332 V342 Q765 360 783 360 H824 Q842 360 842 378 V448" />
          <path className={phase === 4 ? 'is-active' : ''} d="M344 559 H474 Q490 559 490 543 V355 Q490 337 508 337 H765 V332" />
          <path className={`kvl-return-path ${phase === 6 ? 'is-active' : ''}`} d="M1390 539 V628 Q1390 642 1376 642 H93 Q79 642 79 628 V539" />
        </g>
      </svg>
      <div className="kvl-cache">
        <div className="kvl-cache-header"><Typography as="strong" variant="h3">KV Cache</Typography><Typography as="span" variant="bodySmall" tone="muted">第 {round + 1} / 3 轮</Typography></div>
        <div className="kvl-cache-columns">
          <div><Typography as="strong" variant="bodySmall">K</Typography><Bars kind="k" tokens={cache} /></div>
          <div><Typography as="strong" variant="bodySmall">V</Typography><Bars kind="v" tokens={cache} /></div>
        </div>
      </div>
      <Typography as="span" variant="bodySmall" className="kvl-read-label" tone="muted">读取</Typography>
      <Typography as="span" variant="bodySmall" className="kvl-write-label" tone="muted">追加</Typography>
      {running && (phase === 2 || phase === 4) && <div className={`kvl-flight kvl-flight--${phase === 2 ? 'read' : 'write'}`} style={{ offsetPath: `path("${phase === 2 ? readPath : writePath}")` }} aria-hidden="true">
        <div><Typography as="span" variant="bodySmall">K</Typography><Bars kind="k" tokens={phase === 2 ? old : [current]} /></div>
        <div><Typography as="span" variant="bodySmall">V</Typography><Bars kind="v" tokens={phase === 2 ? old : [current]} /></div>
      </div>}
      <div className="kvl-input"><Typography as="span" variant="bodySmall" tone="muted">本轮送入</Typography><Typography as="strong" variant="h2" className={`kvl-token ${phase === 6 && running ? 'kvl-hidden' : ''}`}>{phase === 6 ? next : current}</Typography></div>
      <div className={`kvl-project ${phase >= 1 ? 'is-visible' : ''}`}>
        <Typography as="strong" variant="bodySmall">新字的 Q / K / V</Typography>
        <div className="kvl-projection-row"><Typography as="span" variant="bodySmall">Q</Typography><Bars kind="q" tokens={[current]} /></div>
        <div className="kvl-projection-row"><Typography as="span" variant="bodySmall">K</Typography><Bars kind="k" tokens={[current]} /></div>
        <div className="kvl-projection-row"><Typography as="span" variant="bodySmall">V</Typography><Bars kind="v" tokens={[current]} /></div>
      </div>
      <div className={`kvl-attention ${phase > 2 || (phase === 2 && !running) ? 'is-visible' : ''}`}>
        <Typography as="strong" variant="bodySmall">注意力计算</Typography>
        <div className="kvl-use-matrices">
          <div><Typography as="span" variant="bodySmall">Q</Typography>{phase >= 3 && <div className="kvl-bars kvl-q">{old.map(token => <span className="kvl-empty-row" aria-hidden="true" key={token} />)}<Typography as="span" variant="bodySmall" tone="inherit" className="kvl-bar">{current}</Typography></div>}</div>
          <div><Typography as="span" variant="bodySmall">K</Typography><Bars kind="k" tokens={phase >= 3 ? all : old} /></div>
          <div><Typography as="span" variant="bodySmall">V</Typography><Bars kind="v" tokens={phase >= 3 ? all : old} /></div>
        </div>
      </div>
      <div className={`kvl-model ${phase >= 5 ? 'is-visible' : ''}`}><Typography as="strong" variant="bodySmall">模型其余计算<br />＋词表预测</Typography></div>
      <div className={`kvl-result ${phase >= 5 ? 'is-visible' : ''}`}><Typography as="span" variant="bodySmall" tone="muted">下一个字</Typography><Typography as="strong" variant="h2" className="kvl-token">{next}</Typography></div>
      {phase === 6 && running && <Typography as="strong" variant="h2" className="kvl-feedback-token">{next}</Typography>}
    </main>
    <footer className="kvl-footer">
      <Typography as="p" variant="h2" align="center" className="kvl-subtitle" aria-live="polite">{phase === 6 && round === 2 ? '旧 K/V 被反复使用，却不必反复计算。' : CAPTIONS[phase]}</Typography>
      <Button variant="primary" onClick={advance} disabled={running}>{running ? '正在传递…' : phase === 6 && round === 2 ? '从头重看' : ACTIONS[phase]} →</Button>
    </footer>
  </section>;
}
