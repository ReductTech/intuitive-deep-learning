import { useEffect, useState } from 'react';
import { Typography } from '../../../../shared/react';
import './EvolutionSkillDemo.css';
const DURATION = 22000;
const typing = (text: string, t: number, start: number, duration: number) => text.slice(0, Math.max(0, Math.floor((t - start) / duration * text.length)));
export function EvolutionSkillDemo() {
  const [time, setTime] = useState(0);
  useEffect(() => {
    let frame = 0, elapsed = 0, previous = performance.now(), painted = previous;
    const tick = (now: number) => {
      if (!document.hidden) elapsed += Math.min(now - previous, 100);
      previous = now;
      if (now - painted > 32 || elapsed >= DURATION) { setTime(Math.min(elapsed, DURATION)); painted = now; }
      if (elapsed < DURATION) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);
  const feedback = time >= 6200, saving = time >= 8300, saved = time >= 9700, next = time >= 11000;
  const local = time - (next ? 13200 : 2200);
  const phase = next ? time >= 16000 ? 'applied' : 'next-creation' : saved ? 'saved' : saving ? 'saving' : feedback ? 'feedback' : 'first-creation';
  const request = next ? typing('再制作一个水果投票的教学示例', time, 11000, 1800) : typing('制作一个颜色混合的教学示例', time, 200, 1700);
  const markup = next ? '<Lesson title="水果投票" theme="pink">\n  <Text concise />\n  <Choices /><VoteBars />\n</Lesson>' : '<Lesson title="颜色混合" theme="blue">\n  <Text>调节比例，观察混色变化…</Text>\n  <Paints /><Slider /><Button />\n</Lesson>';
  return <div className={`aipe-replay-cg-evolution-demo${saving ? ' is-saving' : ''}${saved ? ' is-saved' : ''}${next ? ' is-applied' : ''}`} data-evolution-phase={phase} data-evolution-time={Math.round(time)}>
    <div className="aipe-replay-cg-evolution-request"><Typography variant="bodySmall" tone="muted">使用者</Typography><Typography variant="body" tone="inherit">{request}<span className={time < 1900 || (next && time < 12800) ? 'aipe-replay-cg-evolution-caret' : 'aipe-replay-cg-evolution-caret is-hidden'} aria-hidden="true"/></Typography></div>
    <div className="aipe-replay-cg-evolution-feedback-slot"><div className={`aipe-replay-cg-evolution-feedback${feedback ? ' is-visible' : ''}`}><Typography variant="bodySmall" tone="muted">使用者反馈</Typography><div className="aipe-replay-cg-evolution-bubble"><Typography variant="body" tone="inherit">{typing('文字少一些，继续沿用粉色。', time, 6200, 1500)}</Typography></div></div></div>
    <div className="aipe-replay-cg-evolution-scene">
      <div className="aipe-replay-cg-evolution-skill"><div className="aipe-replay-cg-evolution-skill-heading"><Typography variant="h2" tone="inherit">Skill</Typography><svg viewBox="0 0 40 48" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M7 3h17l10 10v32H7ZM24 3v12h10M14 25h13M14 33h13"/></svg></div>
        <div className="aipe-replay-cg-evolution-placeholder" aria-hidden={saved}><i/><i/><i/></div>
        <div className="aipe-replay-cg-evolution-memory"><Typography variant="bodySmall" tone="muted">{saved ? '已记住使用习惯' : saving ? '正在浓缩反馈…' : '等待使用反馈'}</Typography><div className="aipe-replay-cg-evolution-preferences">{['精简文字', '沿用粉色'].map(text => <div key={text}><span aria-hidden="true">✓</span><Typography variant="body" tone="inherit">{text}</Typography></div>)}</div></div>
      </div>
      <div className="aipe-replay-cg-evolution-generation"><Typography variant="bodySmall" tone="inherit">{next ? '沿用习惯' : saving ? '记录偏好' : '制作课件'}</Typography><svg viewBox="0 0 120 30" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><path d={saving && !next ? 'M118 15H7M21 3 6 15l15 12' : 'M2 15h111M99 3l15 12-15 12'}/></svg></div>
      <div className="aipe-replay-cg-evolution-workspace">
        <div className="aipe-replay-cg-evolution-build-status"><span className={local >= 0 && local < 2800 ? 'is-busy' : ''}/><Typography variant="bodySmall" tone="muted">{local < 0 ? '等待制作' : local < 2800 ? 'AI 正在制作…' : '课件已生成'}</Typography></div>
        <div className="aipe-replay-cg-evolution-lesson" key={next ? 'plant' : 'paint'}>
          <div className={`aipe-replay-cg-evolution-reveal${local > 150 ? ' is-visible' : ''}`}><Typography variant="h3" tone="inherit">{next ? '水果投票' : '颜色混合'}</Typography></div>
          <div className={`aipe-replay-cg-evolution-copy aipe-replay-cg-evolution-reveal${local > 700 ? ' is-visible' : ''}`}><Typography variant="bodySmall" tone="inherit">{next ? '选一种你喜欢的水果。' : '红色和黄色混合后会得到橙色。调节两种颜色的比例，观察混合后的颜色变化。'}</Typography></div>
          {next ? <div className={`aipe-replay-cg-evolution-poll aipe-replay-cg-evolution-reveal${local > 1300 ? ' is-visible' : ''}${time >= 17500 ? ' has-voted' : ''}`}>
            <div className="aipe-replay-cg-evolution-vote-choice"><Typography variant="bodySmall" tone="inherit">苹果</Typography><Typography variant="bodySmall" tone="inherit">{time >= 17500 ? '✓ 已投票' : '投一票'}</Typography></div>
            <div className="aipe-replay-cg-evolution-vote-row"><Typography variant="bodySmall" tone="inherit">苹果</Typography><div className="aipe-replay-cg-evolution-vote-track"><span style={{width:time >= 17500 ? '80%' : '60%'}}/></div><Typography variant="bodySmall" tone="inherit">{time >= 17500 ? '4' : '3'}</Typography></div>
            <div className="aipe-replay-cg-evolution-vote-row"><Typography variant="bodySmall" tone="inherit">香蕉</Typography><div className="aipe-replay-cg-evolution-vote-track"><span style={{width:'40%'}}/></div><Typography variant="bodySmall" tone="inherit">2</Typography></div>
            {time >= 16100 && time < 18600 && <svg className="aipe-replay-cg-evolution-vote-cursor" style={{top:time >= 17200 ? 14 : 64,left:time >= 17200 ? '78%' : '90%'}} viewBox="0 0 32 40" fill="white" stroke="#253758" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d="M4 2v29l8-7 6 13 6-3-6-12 11-1Z"/></svg>}
          </div> : <><div className={`aipe-replay-cg-evolution-paints aipe-replay-cg-evolution-reveal${local > 1300 ? ' is-visible' : ''}`} aria-label="红色加黄色得到橙色"><i/><Typography variant="h3" tone="muted">+</Typography><i/><Typography variant="h3" tone="muted">=</Typography><i/></div><div className={`aipe-replay-cg-evolution-reveal${local > 2000 ? ' is-visible' : ''}`}><div className="aipe-replay-cg-evolution-slider" aria-hidden="true"><span/></div><div className="aipe-replay-cg-evolution-mix-button"><Typography variant="body" tone="inherit">开始混合</Typography></div></div></>}
          {local < 2400 && <div className="aipe-replay-cg-evolution-stream"><Typography as="code" variant="bodySmall" tone="inherit">{typing(markup, local, 0, 2300)}<span className="aipe-replay-cg-evolution-caret" aria-hidden="true"/></Typography></div>}
        </div>
      </div>
    </div>
    <div className="aipe-replay-cg-evolution-conclusion"><Typography variant="body" tone="inherit">{next ? time >= 16000 ? '换个主题，也会沿用：粉色、少文字。' : '再做一个新主题，这次不用重复偏好。' : saved ? '两条使用习惯，已浓缩进 Skill。' : saving ? '把这次反馈，留下来。' : feedback ? '这次提出的偏好，下次还要再说吗？' : '先制作一个颜色混合的教学示例。'}</Typography></div>
  </div>;
}
