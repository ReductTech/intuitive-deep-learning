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

  return <div shuku-edit-id="e-cf9d432d-cb7c-4fc4-b255-db0e13c79e6c" className="cg-eval-demo" data-evaluation-phase={phase} data-evaluation-enabled={enabled} data-evaluation-time={Math.floor(time)}>
    <div shuku-edit-id="e-7235e9f8-10f3-4a33-bedf-dfe95626e269" className="cg-eval-toolbar">
      <label shuku-edit-id="e-96e7b3a5-c8a3-433f-8056-3cc4f525a2fd" className="edu-check cg-eval-autotoggle"><input shuku-edit-id="e-92795e50-80f0-4ea3-b06a-da65a5b74e59" type="checkbox" checked={enabled} readOnly tabIndex={-1}/><Typography shuku-edit-id="e-effa0157-47d9-41a0-8f24-9922ba17f833" as="span" variant="body" tone="inherit">启用 AI 评估</Typography></label>
      <Typography shuku-edit-id="e-084a85fd-9d43-4d9f-bbff-2f98ef958953" variant="bodySmall" tone="inherit" className="cg-eval-stage-name">{stage}</Typography>
    </div>
    <div shuku-edit-id="e-45acbcac-9478-4f21-9219-9ee6debbd7bb" className="cg-mix-stage" role="group" aria-label={`颜色混合知识呈现作品自动演示：${stage}`} style={{ '--upgrade': upgrade } as CSSProperties}>
      <div shuku-edit-id="e-fdf0a6e9-5843-4f39-b3e7-accc120f4b70" className={`cg-mix-content${reviewing ? ' is-under-review' : ''}`}>
        <Typography shuku-edit-id="e-d256a48c-8328-4b65-8a40-1d81a3a9ca81" variant="h3" tone="inherit" className="cg-mix-title">颜色混合</Typography>
        <div shuku-edit-id="e-0d5e459f-dbfe-47a4-ada4-8f648794ba07" className="cg-mix-instruction"><Typography shuku-edit-id="e-eb6591bc-09a5-4587-b055-5ecd5f5c0fe3" variant="body" tone="muted" style={{ opacity: 1 - upgrade }}>调节比例，点击混合。</Typography><Typography shuku-edit-id="e-4a448c58-9069-454e-ba67-482a5c4b8e38" variant="body" tone="inherit" style={{ opacity: upgrade }}>拖动颜料，直接观察颜色变化。</Typography></div>
        <div shuku-edit-id="e-bcaffd73-3a8e-4fcb-9514-b27b143ff863" className="cg-mix-controls" style={{ opacity: 1 - upgrade, transform: `translateY(${-12 * upgrade}px)`, visibility: upgrade === 1 ? 'hidden' : 'visible' }}>
          <RangeControl label={<Typography shuku-edit-id="e-5cf9a41a-450c-486a-86af-2c3d72cdef20" as="span" variant="bodySmall" tone="inherit">红黄比例</Typography>} min={0} max={100} value={Math.round(slider * 100)} readOnly tabIndex={-1} formatValue={() => '红色  /  黄色'} controlClassName="cg-mix-ratio"/>
          <Button className={`cg-mix-start${pressed ? ' is-pressed' : ''}`} tabIndex={-1}><Typography shuku-edit-id="e-328bd382-b568-4b55-b154-435b5abf0800" as="span" variant="body" tone="inherit">开始混合</Typography></Button>
          <Button className="cg-mix-reset" tabIndex={-1}><Typography shuku-edit-id="e-10228058-e05f-4979-8b9b-2431ae9db308" as="span" variant="body" tone="inherit">重置</Typography></Button>
        </div>
        <div shuku-edit-id="e-b3c7f496-8eb8-43f6-98c3-851f24b65965" className="cg-mix-source is-red" style={{ left: `${lerp(23, 18, upgrade)}%`, top: `${lerp(286, 180, upgrade)}px` }}><div shuku-edit-id="e-b05ef357-cf2b-418c-bf4d-c424758e5856" className="cg-paint-pot"><span shuku-edit-id="e-3b439d4d-fecc-427c-a5c7-53a9fca80f50"/></div><Typography shuku-edit-id="e-ced7ea89-e899-4b08-8c83-2dd606a7cd8a" variant="body" tone="inherit">红色颜料</Typography></div>
        <div shuku-edit-id="e-a0f93ffa-f9c2-4964-af95-379228301c66" className="cg-mix-source is-yellow" style={{ left: `${lerp(46, 82, upgrade)}%`, top: `${lerp(286, 180, upgrade)}px` }}><div shuku-edit-id="e-33053c5c-f789-4903-8cc8-0592cac6ef4d" className="cg-paint-pot"><span shuku-edit-id="e-89cbeb1a-0ffc-4fd0-b2ff-c10e72688659"/></div><Typography shuku-edit-id="e-de48c80b-da82-46ed-98cd-b19112cd81c4" variant="body" tone="inherit">黄色颜料</Typography></div>
        <Typography shuku-edit-id="e-22264c2f-bd84-44d2-976c-476403a340ed" as="span" variant="h2" tone="muted" className="cg-mix-symbol is-plus" style={{ opacity: 1 - upgrade }}>＋</Typography>
        <Typography shuku-edit-id="e-3a953acf-cbd1-4da5-8bb4-19684e384125" as="span" variant="h2" tone="muted" className="cg-mix-symbol is-arrow" style={{ opacity: 1 - upgrade }}>→</Typography>
        <div shuku-edit-id="e-3d9528bf-bd12-4f60-93d8-a0ee9c35f411" className="cg-mix-palette-object" style={{ left: `${lerp(77, 50, upgrade)}%`, top: `${lerp(286, 302, upgrade)}px`, width: `${lerp(240, 336, upgrade)}px` }}>
          <div shuku-edit-id="e-31617b23-7606-4185-abda-b8d0d9c60f68" className={`cg-mix-palette${redDrag || yellowDrag ? ' is-targeted' : ''}`} style={{ height: `${lerp(126, 154, upgrade)}px` }}><i shuku-edit-id="e-d0adbfc9-06da-4b9e-b3f3-232feacee6f0" className="cg-mix-palette-hole"/><div shuku-edit-id="e-4c47c716-7003-417a-bafd-2b4416b38e90" className="cg-mix-pool" style={{ opacity: fill, '--mix-hue': hue, width: `${lerp(53, 66, yellowFill)}%` } as CSSProperties}><span shuku-edit-id="e-5c968048-2260-4ce8-ae17-770d85e442ee"/><i shuku-edit-id="e-d08a546f-f8b5-450f-8739-250fa1283c00"/></div></div>
          <Typography shuku-edit-id="e-b5848507-a3c6-41f3-aa66-148757458162" variant="body" tone="inherit">{fill > .5 ? '混合后的颜色' : '调色盘'}</Typography>
        </div>
        <div shuku-edit-id="e-744dbd00-d3b7-42c4-b995-68502c3ba9aa" className="cg-mix-revision-label" style={{ opacity: upgrade > .02 && upgrade < .99 ? 1 : 0 }}><span shuku-edit-id="e-c2ac8aab-49fa-4a60-b8f9-020811596697"/><Typography shuku-edit-id="e-a2f4574f-a397-419d-93d2-de5def8b565a" variant="body" tone="inherit">精简面板 · 直接操作颜料</Typography></div>
      </div>
      {reviewing && <div shuku-edit-id="e-87272865-c15a-4362-8da5-04849681f508" className="cg-eval-review-overlay" style={{ opacity: modalOpacity }}>
        <div shuku-edit-id="e-10b6b286-4efd-4721-97f7-809f2d9a9b22" className="cg-eval-review-sheet">
          <div shuku-edit-id="e-db09dfc4-e503-466e-a508-4e484c8df971" className="cg-eval-review-heading"><span shuku-edit-id="e-ff436bc5-f388-4e49-b978-49cbcb2053df" className="cg-eval-chip"><Typography shuku-edit-id="e-2e1bf89b-838a-49c4-ac94-85a1140b03ac" as="span" variant="bodySmall" tone="inherit">AI</Typography></span><Typography shuku-edit-id="e-97aeaaf7-7b19-4f6c-a701-c039f1879867" variant="h3" tone="inherit">AI 评估</Typography><Typography shuku-edit-id="e-45657c4f-88a5-4530-9f09-1693e529487a" variant="bodySmall" tone="muted">依据 Creator Skill</Typography></div>
          <div shuku-edit-id="e-36ca398d-ac01-4ae4-ab0b-5aaaaa676652" className="cg-eval-review-rows">{reviews.map((review, index) => <div shuku-edit-id="e-1bd6d414-9e1a-4927-bdf3-d5e503498332" key={review.title} className={`${index <= activeReview ? 'is-revealed' : ''}${index === activeReview ? ' is-active' : ''}`}><Typography shuku-edit-id="e-29413fa6-6e54-4337-9b7b-32c906ae7a4a" variant="body" tone="inherit">{review.title}</Typography><Typography shuku-edit-id="e-bb5dab81-e560-4481-bef4-be66c2fc7cf7" variant="bodySmall" tone="inherit">{review.text}</Typography><Typography shuku-edit-id="e-a06807a6-6e64-47df-bf94-ccc8ef7d6313" variant="bodySmall" tone="inherit">{review.result}</Typography></div>)}</div>
          <Typography shuku-edit-id="e-364d23cb-31c0-4bb1-94a7-537f612863dd" variant="body" tone="inherit" className="cg-eval-recommendation">建议：直接拖动颜料，混色即时响应。</Typography>
        </div>
      </div>}
    </div>
    <div shuku-edit-id="e-e806b372-ec2a-4a71-9b22-2396d0eb8857" className="cg-eval-caption"><Typography shuku-edit-id="e-a88e3456-caab-4723-a5dd-e10e30f93b86" variant="body" tone="inherit">{caption}</Typography></div>
    <div shuku-edit-id="e-7accd251-790d-4c23-a1d7-56136361ffd7" className={`cg-eval-virtual-cursor${pressed || (time >= 4720 && time < 4900) || redDrag || yellowDrag ? ' is-pressing' : ''}`} style={{ left: `${pointer.x}%`, top: pointer.y, opacity: pointerOpacity }} aria-hidden="true"><span shuku-edit-id="e-821bb24e-6feb-4b26-8733-53e6c1500446"/><svg shuku-edit-id="e-a918fe01-5ac1-49c7-a60d-b9c5bf490d92" viewBox="0 0 32 40" fill="white" stroke="#253758" strokeWidth="2.2" strokeLinejoin="round"><path shuku-edit-id="e-5f760293-47d6-4f26-9a3c-19334a8ff21f" d="M4 2v29l8-7 6 13 6-3-6-12 11-1Z"/></svg></div>
    {(redDrag || yellowDrag) && <div shuku-edit-id="e-03ab03f1-e1c1-4f6a-a943-c05267825a5c" className={`cg-eval-drag-paint${yellowDrag ? ' is-yellow' : ''}`} style={{ left: `${pointer.x}%`, top: pointer.y }} aria-hidden="true"/>}
  </div>;
}
