import { useEffect, useState, type CSSProperties } from 'react';
import { Button, RangeControl, Typography } from "@shuku/course-style/react";
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

  return <div shuku-edit-id="e-edd64d5f-5038-42b2-bd4d-67a3a13dde82" className="cg-eval-demo" data-evaluation-phase={phase} data-evaluation-enabled={enabled} data-evaluation-time={Math.floor(time)}>
    <div shuku-edit-id="e-ab294728-a9aa-4283-a21e-61c5b2f2f18a" className="cg-eval-toolbar">
      <label shuku-edit-id="e-d08892b0-39d7-462c-b264-f295f7c3cb16" className="edu-check cg-eval-autotoggle"><input shuku-edit-id="e-987db826-0881-4bda-9055-b95d5710d487" type="checkbox" checked={enabled} readOnly tabIndex={-1}/><Typography shuku-edit-id="e-6388d795-e583-427d-b229-f4863cbc5469" as="span" variant="body" tone="inherit">启用 AI 评估</Typography></label>
      <Typography shuku-edit-id="e-a86b18be-aa89-4910-8528-fefd4ceaf083" variant="bodySmall" tone="inherit" className="cg-eval-stage-name">{stage}</Typography>
    </div>
    <div shuku-edit-id="e-f8dd7f61-194a-4ae2-95ac-f13987ff17d3" className="cg-mix-stage" role="group" aria-label={`颜色混合知识呈现作品自动演示：${stage}`} style={{ '--upgrade': upgrade } as CSSProperties}>
      <div shuku-edit-id="e-bdbff31f-416c-4404-837a-fa269b010317" className={`cg-mix-content${reviewing ? ' is-under-review' : ''}`}>
        <Typography shuku-edit-id="e-769160d5-8ac3-4cc0-bd04-183c632b0156" variant="h3" tone="inherit" className="cg-mix-title">颜色混合</Typography>
        <div shuku-edit-id="e-a2541d3e-764b-4cf9-808f-f70f282f490b" className="cg-mix-instruction"><Typography shuku-edit-id="e-616414a6-641e-462b-b1b7-8e6f7c667361" variant="body" tone="muted" style={{ opacity: 1 - upgrade }}>调节比例，点击混合。</Typography><Typography shuku-edit-id="e-f34f9cda-092a-45a1-84b8-8c2bef30d1cc" variant="body" tone="inherit" style={{ opacity: upgrade }}>拖动颜料，直接观察颜色变化。</Typography></div>
        <div shuku-edit-id="e-136fabae-7262-4586-b818-5772198b0896" className="cg-mix-controls" style={{ opacity: 1 - upgrade, transform: `translateY(${-12 * upgrade}px)`, visibility: upgrade === 1 ? 'hidden' : 'visible' }}>
          <RangeControl label={<Typography shuku-edit-id="e-5e5380be-8a48-4c3e-be1d-512c40521f6f" as="span" variant="bodySmall" tone="inherit">红黄比例</Typography>} min={0} max={100} value={Math.round(slider * 100)} readOnly tabIndex={-1} formatValue={() => '红色  /  黄色'} controlClassName="cg-mix-ratio"/>
          <Button className={`cg-mix-start${pressed ? ' is-pressed' : ''}`} tabIndex={-1}><Typography shuku-edit-id="e-62a01d0b-6c9c-4b4c-ad20-d85086517a15" as="span" variant="body" tone="inherit">开始混合</Typography></Button>
          <Button className="cg-mix-reset" tabIndex={-1}><Typography shuku-edit-id="e-58d232bc-46a4-4b2a-9315-a024dac273f7" as="span" variant="body" tone="inherit">重置</Typography></Button>
        </div>
        <div shuku-edit-id="e-2ba9f7cf-fb43-4368-b9d1-9d3f24a2f5e0" className="cg-mix-source is-red" style={{ left: `${lerp(23, 18, upgrade)}%`, top: `${lerp(286, 180, upgrade)}px` }}><div shuku-edit-id="e-f3e7491a-b0b4-4e91-b70c-0cf563c04c36" className="cg-paint-pot"><span shuku-edit-id="e-6d3192c9-5733-4f41-a90b-2a1a0c404b67"/></div><Typography shuku-edit-id="e-253d2677-7dbe-4811-92ff-5eb65958e1c0" variant="body" tone="inherit">红色颜料</Typography></div>
        <div shuku-edit-id="e-8b78ee39-658a-42c0-9bf0-a3ef44f002df" className="cg-mix-source is-yellow" style={{ left: `${lerp(46, 82, upgrade)}%`, top: `${lerp(286, 180, upgrade)}px` }}><div shuku-edit-id="e-a8d5a7ad-31b8-4d9f-a023-1af0ad4d0fab" className="cg-paint-pot"><span shuku-edit-id="e-d85c46a9-7c7e-4573-96a0-8e920f294b3b"/></div><Typography shuku-edit-id="e-c8132158-34f9-467c-9077-d582f823b635" variant="body" tone="inherit">黄色颜料</Typography></div>
        <Typography shuku-edit-id="e-42afa001-d562-46eb-8a36-045bf03f18d8" as="span" variant="h2" tone="muted" className="cg-mix-symbol is-plus" style={{ opacity: 1 - upgrade }}>＋</Typography>
        <Typography shuku-edit-id="e-4d0fba80-9699-4d79-9e7d-c391ef9d546b" as="span" variant="h2" tone="muted" className="cg-mix-symbol is-arrow" style={{ opacity: 1 - upgrade }}>→</Typography>
        <div shuku-edit-id="e-20e2cdd3-7ac1-4142-b193-5952a8717523" className="cg-mix-palette-object" style={{ left: `${lerp(77, 50, upgrade)}%`, top: `${lerp(286, 302, upgrade)}px`, width: `${lerp(240, 336, upgrade)}px` }}>
          <div shuku-edit-id="e-31d08f69-61f7-4f37-83f3-e474007b32df" className={`cg-mix-palette${redDrag || yellowDrag ? ' is-targeted' : ''}`} style={{ height: `${lerp(126, 154, upgrade)}px` }}><i shuku-edit-id="e-e429a234-5a15-476c-96b2-a56cd0ebca9f" className="cg-mix-palette-hole"/><div shuku-edit-id="e-5a09ee01-b86b-4dea-b579-229eabca2a52" className="cg-mix-pool" style={{ opacity: fill, '--mix-hue': hue, width: `${lerp(53, 66, yellowFill)}%` } as CSSProperties}><span shuku-edit-id="e-9bff694f-57c5-45da-989a-158ef48be28a"/><i shuku-edit-id="e-66f4826e-7e9f-47d2-9cee-f9f04212c858"/></div></div>
          <Typography shuku-edit-id="e-94bdb092-1bc4-46a5-a3a5-427b0bf4a188" variant="body" tone="inherit">{fill > .5 ? '混合后的颜色' : '调色盘'}</Typography>
        </div>
        <div shuku-edit-id="e-d8ac07a1-915d-44f9-b7d0-523bc55230a5" className="cg-mix-revision-label" style={{ opacity: upgrade > .02 && upgrade < .99 ? 1 : 0 }}><span shuku-edit-id="e-c10b060c-3116-4889-b222-3ff832f7d1bc"/><Typography shuku-edit-id="e-cb3a414e-b861-4a1f-9be8-4362a6b0b29e" variant="body" tone="inherit">精简面板 · 直接操作颜料</Typography></div>
      </div>
      {reviewing && <div shuku-edit-id="e-55ac7ab5-b754-4b74-bd49-3c1d5764a6e2" className="cg-eval-review-overlay" style={{ opacity: modalOpacity }}>
        <div shuku-edit-id="e-01ff6bc2-c3a8-4632-9ae5-c301ae94cb58" className="cg-eval-review-sheet">
          <div shuku-edit-id="e-42275c83-e579-4209-a512-c83a598461a9" className="cg-eval-review-heading"><span shuku-edit-id="e-a54318e6-f0b7-4ab4-8dd6-eafff36659fc" className="cg-eval-chip"><Typography shuku-edit-id="e-0c4efbe0-ac93-4814-ab45-28786ac790b6" as="span" variant="bodySmall" tone="inherit">AI</Typography></span><Typography shuku-edit-id="e-2d04de51-ff96-4a56-b7b2-64a2484a42a0" variant="h3" tone="inherit">AI 评估</Typography><Typography shuku-edit-id="e-38b55447-59ad-4154-8df1-4eb50ea1bc9b" variant="bodySmall" tone="muted">依据 Creator Skill</Typography></div>
          <div shuku-edit-id="e-934f7924-cd6a-4fe9-8a20-f7a1f1e68989" className="cg-eval-review-rows">{reviews.map((review, index) => <div shuku-edit-id="e-c04399fe-2e07-49d1-8ce2-deac683b82fe" key={review.title} className={`${index <= activeReview ? 'is-revealed' : ''}${index === activeReview ? ' is-active' : ''}`}><Typography shuku-edit-id="e-521af258-215e-428a-bdc0-cc6ec9c863cc" variant="body" tone="inherit">{review.title}</Typography><Typography shuku-edit-id="e-09ed62c3-35de-4e2c-a51b-6d00a5b3a542" variant="bodySmall" tone="inherit">{review.text}</Typography><Typography shuku-edit-id="e-1133d841-a96a-4647-b76d-d5c214c3a30b" variant="bodySmall" tone="inherit">{review.result}</Typography></div>)}</div>
          <Typography shuku-edit-id="e-ad7b0896-52ac-4d49-8c62-006c768c93cf" variant="body" tone="inherit" className="cg-eval-recommendation">建议：直接拖动颜料，混色即时响应。</Typography>
        </div>
      </div>}
    </div>
    <div shuku-edit-id="e-ea621c2a-a412-4e00-8f6c-04d654d63b2e" className="cg-eval-caption"><Typography shuku-edit-id="e-4bd5a254-9acb-4e01-bcb3-b432aaf515ab" variant="body" tone="inherit">{caption}</Typography></div>
    <div shuku-edit-id="e-12dd7a39-42ce-4bdf-8e2b-2208e0938c21" className={`cg-eval-virtual-cursor${pressed || (time >= 4720 && time < 4900) || redDrag || yellowDrag ? ' is-pressing' : ''}`} style={{ left: `${pointer.x}%`, top: pointer.y, opacity: pointerOpacity }} aria-hidden="true"><span shuku-edit-id="e-756cb219-4f50-454a-84ae-601252bc5703"/><svg shuku-edit-id="e-0083b6b8-037f-41e3-b94b-840121e1003b" viewBox="0 0 32 40" fill="white" stroke="#253758" strokeWidth="2.2" strokeLinejoin="round"><path shuku-edit-id="e-12c382aa-1954-488c-8c9a-fc13f5db7dc7" d="M4 2v29l8-7 6 13 6-3-6-12 11-1Z"/></svg></div>
    {(redDrag || yellowDrag) && <div shuku-edit-id="e-3ec11cbf-5e4f-4036-9984-46ac0900962f" className={`cg-eval-drag-paint${yellowDrag ? ' is-yellow' : ''}`} style={{ left: `${pointer.x}%`, top: pointer.y }} aria-hidden="true"/>}
  </div>;
}
