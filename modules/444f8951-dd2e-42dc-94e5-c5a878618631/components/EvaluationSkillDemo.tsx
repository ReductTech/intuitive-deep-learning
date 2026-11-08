import { useEffect, useState, type CSSProperties } from 'react';
import { Button, RangeControl, Typography } from '../../shared/react';
import './EvaluationSkillDemo.css';

const DURATION = 22000;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t); };
const between = (time: number, start: number, end: number) => ease((time - start) / (end - start));
const lerp = (start: number, end: number, amount: number) => start + (end - start) * amount;
const reviews = [
  { title: '直接操纵', text: '通过面板间接操作，与颜料对象分离', result: '改进' },
  { title: '界面退后', text: '控件占据主视觉，混色结果不够突出', result: '改进' },
  { title: '信息取舍', text: '精简操作面板，让注意力回到颜色', result: '精简' },
  { title: '内容准确', text: '本例混色结果正确，知识内容保留', result: '保留' },
];
const cursorFrames = [
  [0, 88, 216], [650, 35, 235], [1100, 35, 235], [1650, 22.1, 235], [2250, 47.9, 235], [2600, 35, 235],
  [2900, 77.2, 216], [3200, 77.2, 216], [4100, 77.2, 216], [4650, 1.3, 36], [5100, 1.3, 36],
  [12800, 76, 112], [13200, 18, 231], [13600, 18, 231], [14700, 50, 352], [15100, 50, 352],
  [15500, 82, 231], [15900, 82, 231], [17000, 50, 352], [17400, 50, 352], [18100, 63, 375], [22000, 63, 375],
];
function cursorAt(time: number) {
  const index = cursorFrames.findIndex(frame => frame[0] > time);
  const end = cursorFrames[index < 0 ? cursorFrames.length - 1 : index];
  const start = cursorFrames[Math.max(0, (index < 0 ? cursorFrames.length - 1 : index) - 1)];
  const amount = end[0] === start[0] ? 0 : between(time, start[0], end[0]);
  return { x: lerp(start[1], end[1], amount), y: lerp(start[2], end[2], amount) };
}

export function EvaluationSkillDemo() {
  const [time, setTime] = useState(0);
  useEffect(() => {
    let animation = 0;
    let elapsed = 0;
    let previous = performance.now();
    let lastPaint = previous;
    const frame = (now: number) => {
      if (!document.hidden) elapsed += Math.min(now - previous, 100);
      previous = now;
      if (now - lastPaint >= 32 || elapsed >= DURATION) { setTime(Math.min(elapsed, DURATION)); lastPaint = now; }
      if (elapsed < DURATION) animation = requestAnimationFrame(frame);
    };
    animation = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animation);
  }, []);

  const enabled = time >= 4800;
  const reviewing = time >= 5400 && time < 11200;
  const upgrade = between(time, 11200, 12800);
  const phase = time < 4800 ? 'without' : time < 5400 ? 'enabled' : time < 11200 ? 'assessment' : time < 12800 ? 'revision' : time < 18400 ? 'direct' : 'result';
  const slider = time < 1100 ? .5 : time < 1650 ? lerp(.5, .3, between(time, 1100, 1650)) : time < 2250 ? lerp(.3, .7, between(time, 1650, 2250)) : lerp(.7, .5, between(time, 2250, 2600));
  const pressed = time >= 2900 && time < 3160;
  const redDrag = time >= 13600 && time < 14900;
  const yellowDrag = time >= 15900 && time < 17200;
  const directFill = between(time, 14600, 15000);
  const yellowFill = between(time, 16900, 17700);
  const fill = upgrade < 1 ? between(time, 3170, 3650) * (1 - upgrade) : directFill;
  const hue = upgrade < 1 ? 29 : lerp(2, 29, yellowFill);
  const pointer = cursorAt(time);
  const pointerOpacity = time < 500 ? between(time, 200, 500) : time < 5100 ? 1 : time < 12800 ? 0 : time < 18400 ? between(time, 12800, 13100) : 1 - between(time, 18400, 18900);
  const modalOpacity = between(time, 5400, 5700) * (1 - between(time, 10800, 11200));
  const activeReview = Math.min(3, Math.max(0, Math.floor((time - 5800) / 1000)));
  const stage = !enabled ? '初稿：面板操作' : reviewing ? 'AI 多维评价' : phase === 'enabled' ? '启用 AI 评估' : phase === 'revision' ? '按建议改进中' : '成品：直接操纵';
  const caption = !enabled ? '未启用：用滑杆和按钮间接控制混色。' : reviewing || phase === 'enabled' ? 'AI 依据 Creator Skill 评价，再给出改进建议。' : phase === 'revision' ? '保留知识内容，精简控件，重排交互。' : '已启用：直接拖动颜料，混色即时响应。';

  return <div className="cg-eval-demo" data-evaluation-phase={phase} data-evaluation-enabled={enabled} data-evaluation-time={Math.floor(time)}>
    <div className="cg-eval-toolbar">
      <label className="edu-check cg-eval-autotoggle"><input type="checkbox" checked={enabled} readOnly tabIndex={-1}/><Typography as="span" variant="body" tone="inherit">启用 AI 评估</Typography></label>
      <Typography variant="bodySmall" tone="inherit" className="cg-eval-stage-name">{stage}</Typography>
    </div>
    <div className="cg-mix-stage" role="group" aria-label={`颜色混合知识呈现作品自动演示：${stage}`} style={{ '--upgrade': upgrade } as CSSProperties}>
      <div className={`cg-mix-content${reviewing ? ' is-under-review' : ''}`}>
        <Typography variant="h3" tone="inherit" className="cg-mix-title">颜色混合</Typography>
        <div className="cg-mix-instruction"><Typography variant="body" tone="muted" style={{ opacity: 1 - upgrade }}>调节比例，点击混合。</Typography><Typography variant="body" tone="inherit" style={{ opacity: upgrade }}>拖动颜料，直接观察颜色变化。</Typography></div>
        <div className="cg-mix-controls" style={{ opacity: 1 - upgrade, transform: `translateY(${-12 * upgrade}px)`, visibility: upgrade === 1 ? 'hidden' : 'visible' }}>
          <RangeControl label={<Typography as="span" variant="bodySmall" tone="inherit">红黄比例</Typography>} min={0} max={100} value={Math.round(slider * 100)} readOnly tabIndex={-1} formatValue={() => '红色  /  黄色'} controlClassName="cg-mix-ratio"/>
          <Button className={`cg-mix-start${pressed ? ' is-pressed' : ''}`} tabIndex={-1}><Typography as="span" variant="body" tone="inherit">开始混合</Typography></Button>
          <Button className="cg-mix-reset" tabIndex={-1}><Typography as="span" variant="body" tone="inherit">重置</Typography></Button>
        </div>
        <div className="cg-mix-source is-red" style={{ left: `${lerp(23, 18, upgrade)}%`, top: `${lerp(286, 180, upgrade)}px` }}><div className="cg-paint-pot"><span/></div><Typography variant="body" tone="inherit">红色颜料</Typography></div>
        <div className="cg-mix-source is-yellow" style={{ left: `${lerp(46, 82, upgrade)}%`, top: `${lerp(286, 180, upgrade)}px` }}><div className="cg-paint-pot"><span/></div><Typography variant="body" tone="inherit">黄色颜料</Typography></div>
        <Typography as="span" variant="h2" tone="muted" className="cg-mix-symbol is-plus" style={{ opacity: 1 - upgrade }}>＋</Typography>
        <Typography as="span" variant="h2" tone="muted" className="cg-mix-symbol is-arrow" style={{ opacity: 1 - upgrade }}>→</Typography>
        <div className="cg-mix-palette-object" style={{ left: `${lerp(77, 50, upgrade)}%`, top: `${lerp(286, 302, upgrade)}px`, width: `${lerp(240, 336, upgrade)}px` }}>
          <div className={`cg-mix-palette${redDrag || yellowDrag ? ' is-targeted' : ''}`} style={{ height: `${lerp(126, 154, upgrade)}px` }}><i className="cg-mix-palette-hole"/><div className="cg-mix-pool" style={{ opacity: fill, '--mix-hue': hue, width: `${lerp(53, 66, yellowFill)}%` } as CSSProperties}><span/><i/></div></div>
          <Typography variant="body" tone="inherit">{fill > .5 ? '混合后的颜色' : '调色盘'}</Typography>
        </div>
        <div className="cg-mix-revision-label" style={{ opacity: upgrade > .02 && upgrade < .99 ? 1 : 0 }}><span/><Typography variant="body" tone="inherit">精简面板 · 直接操作颜料</Typography></div>
      </div>
      {reviewing && <div className="cg-eval-review-overlay" style={{ opacity: modalOpacity }}>
        <div className="cg-eval-review-sheet">
          <div className="cg-eval-review-heading"><span className="cg-eval-chip"><Typography as="span" variant="bodySmall" tone="inherit">AI</Typography></span><Typography variant="h3" tone="inherit">AI 评估</Typography><Typography variant="bodySmall" tone="muted">依据 Creator Skill</Typography></div>
          <div className="cg-eval-review-rows">{reviews.map((review, index) => <div key={review.title} className={`${index <= activeReview ? 'is-revealed' : ''}${index === activeReview ? ' is-active' : ''}`}><Typography variant="body" tone="inherit">{review.title}</Typography><Typography variant="bodySmall" tone="inherit">{review.text}</Typography><Typography variant="bodySmall" tone="inherit">{review.result}</Typography></div>)}</div>
          <Typography variant="body" tone="inherit" className="cg-eval-recommendation">建议：直接拖动颜料，混色即时响应。</Typography>
        </div>
      </div>}
    </div>
    <div className="cg-eval-caption"><Typography variant="body" tone="inherit">{caption}</Typography></div>
    <div className={`cg-eval-virtual-cursor${pressed || (time >= 4720 && time < 4900) || redDrag || yellowDrag ? ' is-pressing' : ''}`} style={{ left: `${pointer.x}%`, top: pointer.y, opacity: pointerOpacity }} aria-hidden="true"><span/><svg viewBox="0 0 32 40" fill="white" stroke="#253758" strokeWidth="2.2" strokeLinejoin="round"><path d="M4 2v29l8-7 6 13 6-3-6-12 11-1Z"/></svg></div>
    {(redDrag || yellowDrag) && <div className={`cg-eval-drag-paint${yellowDrag ? ' is-yellow' : ''}`} style={{ left: `${pointer.x}%`, top: pointer.y }} aria-hidden="true"/>}
  </div>;
}
