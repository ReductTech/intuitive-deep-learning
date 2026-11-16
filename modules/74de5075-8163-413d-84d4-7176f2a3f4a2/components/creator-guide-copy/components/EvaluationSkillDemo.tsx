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

  return <div shuku-edit-id="e-ed5f336f-334e-4e98-a57a-32f167600ebe" className="aipe-replay-cg-eval-demo" data-evaluation-phase={phase} data-evaluation-enabled={enabled} data-evaluation-time={Math.floor(time)}>
    <div shuku-edit-id="e-f3d9b9fe-ffd9-485d-81f4-ab936e47aa00" className="aipe-replay-cg-eval-toolbar">
      <label shuku-edit-id="e-09140da3-e256-41f5-9e47-74b87456128d" className="edu-check aipe-replay-cg-eval-autotoggle"><input shuku-edit-id="e-6c989c2b-8088-4dc3-9b43-e989d32d2b82" type="checkbox" checked={enabled} readOnly tabIndex={-1}/><Typography shuku-edit-id="e-75b1d68f-3c36-455c-ad0f-edd4e00b7b17" as="span" variant="body" tone="inherit">启用 AI 评估</Typography></label>
      <Typography shuku-edit-id="e-a82065ac-0625-421a-b731-1f94e573d149" variant="bodySmall" tone="inherit" className="aipe-replay-cg-eval-stage-name">{stage}</Typography>
    </div>
    <div shuku-edit-id="e-1dcc6eec-b795-4a47-9323-0adb6cc98826" className="aipe-replay-cg-mix-stage" role="group" aria-label={`颜色混合知识呈现作品自动演示：${stage}`} style={{ '--upgrade': upgrade } as CSSProperties}>
      <div shuku-edit-id="e-2695483b-3e75-452b-b6fa-f75de01e4b9d" className={`aipe-replay-cg-mix-content${reviewing ? ' is-under-review' : ''}`}>
        <Typography shuku-edit-id="e-815d21e9-9a81-4ebb-8636-5812e14aa96a" variant="h3" tone="inherit" className="aipe-replay-cg-mix-title">颜色混合</Typography>
        <div shuku-edit-id="e-19071839-a5d5-4269-8037-dd7395d8cbf1" className="aipe-replay-cg-mix-instruction"><Typography shuku-edit-id="e-3b0c22bf-94cf-4aa2-9671-947e12fc5ede" variant="body" tone="muted" style={{ opacity: 1 - upgrade }}>调节比例，点击混合。</Typography><Typography shuku-edit-id="e-63f47899-5647-4a4f-ab3b-e11a402bd4c6" variant="body" tone="inherit" style={{ opacity: upgrade }}>拖动颜料，直接观察颜色变化。</Typography></div>
        <div shuku-edit-id="e-500acf0b-d2ac-4a67-a967-d1dd3c5f95f1" className="aipe-replay-cg-mix-controls" style={{ opacity: 1 - upgrade, transform: `translateY(${-12 * upgrade}px)`, visibility: upgrade === 1 ? 'hidden' : 'visible' }}>
          <RangeControl label={<Typography shuku-edit-id="e-5b12c588-b9e8-4c97-bc58-b1f151f16edb" as="span" variant="bodySmall" tone="inherit">红黄比例</Typography>} min={0} max={100} value={Math.round(slider * 100)} readOnly tabIndex={-1} formatValue={() => '红色  /  黄色'} controlClassName="aipe-replay-cg-mix-ratio"/>
          <Button className={`aipe-replay-cg-mix-start${pressed ? ' is-pressed' : ''}`} tabIndex={-1}><Typography shuku-edit-id="e-61240974-005b-4663-86af-bc78776ad0b8" as="span" variant="body" tone="inherit">开始混合</Typography></Button>
          <Button className="aipe-replay-cg-mix-reset" tabIndex={-1}><Typography shuku-edit-id="e-f0d079b0-6d6a-4583-b9ae-3eaaf2494fc8" as="span" variant="body" tone="inherit">重置</Typography></Button>
        </div>
        <div shuku-edit-id="e-12260537-0f64-46f4-97f0-5669f9f68d22" className="aipe-replay-cg-mix-source is-red" style={{ left: `${lerp(23, 18, upgrade)}%`, top: `${lerp(286, 180, upgrade)}px` }}><div shuku-edit-id="e-e8448fd1-2a10-4749-9be7-5ca177e2ad3e" className="aipe-replay-cg-paint-pot"><span shuku-edit-id="e-4b6339dd-3cc1-41ae-8f2a-9653bc86b378"/></div><Typography shuku-edit-id="e-a5723c52-12a5-421b-8bef-96cf572fb622" variant="body" tone="inherit">红色颜料</Typography></div>
        <div shuku-edit-id="e-b673c2d3-ba4f-4ea1-92b9-982b4189c3a3" className="aipe-replay-cg-mix-source is-yellow" style={{ left: `${lerp(46, 82, upgrade)}%`, top: `${lerp(286, 180, upgrade)}px` }}><div shuku-edit-id="e-295d06b4-0aa8-418b-b3cc-31cd08726ec5" className="aipe-replay-cg-paint-pot"><span shuku-edit-id="e-8becf535-db85-4f74-9476-b4c61e65d370"/></div><Typography shuku-edit-id="e-9eb5a91c-688e-47b1-a654-e0c4d9a9c1d1" variant="body" tone="inherit">黄色颜料</Typography></div>
        <Typography shuku-edit-id="e-535263fc-7833-43bf-bcb6-00b46cb7df23" as="span" variant="h2" tone="muted" className="aipe-replay-cg-mix-symbol is-plus" style={{ opacity: 1 - upgrade }}>＋</Typography>
        <Typography shuku-edit-id="e-d1b103a7-76c5-4851-9137-6d19b85ad754" as="span" variant="h2" tone="muted" className="aipe-replay-cg-mix-symbol is-arrow" style={{ opacity: 1 - upgrade }}>→</Typography>
        <div shuku-edit-id="e-d65f38c8-3e20-4589-be87-0ce48341ad80" className="aipe-replay-cg-mix-palette-object" style={{ left: `${lerp(77, 50, upgrade)}%`, top: `${lerp(286, 302, upgrade)}px`, width: `${lerp(240, 336, upgrade)}px` }}>
          <div shuku-edit-id="e-062a2124-ade2-45e3-a996-99c032eddd1f" className={`aipe-replay-cg-mix-palette${redDrag || yellowDrag ? ' is-targeted' : ''}`} style={{ height: `${lerp(126, 154, upgrade)}px` }}><i shuku-edit-id="e-464c4919-a002-4b34-946b-f1937c0a66a5" className="aipe-replay-cg-mix-palette-hole"/><div shuku-edit-id="e-e5d33692-4a22-4bbc-8bea-6b76324ac64e" className="aipe-replay-cg-mix-pool" style={{ opacity: fill, '--mix-hue': hue, width: `${lerp(53, 66, yellowFill)}%` } as CSSProperties}><span shuku-edit-id="e-d7a86af0-6830-49c4-8a4e-808290304907"/><i shuku-edit-id="e-aa44ffb6-3bb2-4411-9525-bb7e5ae55ace"/></div></div>
          <Typography shuku-edit-id="e-9923e83e-db7f-43a2-9b0a-7aa2ee86ec1b" variant="body" tone="inherit">{fill > .5 ? '混合后的颜色' : '调色盘'}</Typography>
        </div>
        <div shuku-edit-id="e-38321a90-f75f-4370-9414-bb485de5deda" className="aipe-replay-cg-mix-revision-label" style={{ opacity: upgrade > .02 && upgrade < .99 ? 1 : 0 }}><span shuku-edit-id="e-4ef45a39-946c-4df4-bd23-81112fee15a6"/><Typography shuku-edit-id="e-3fed6390-9f24-4b3b-9e15-324f7ba704be" variant="body" tone="inherit">精简面板 · 直接操作颜料</Typography></div>
      </div>
      {reviewing && <div shuku-edit-id="e-83864cb4-e3e7-4ebf-a6bd-dbd55d368ce3" className="aipe-replay-cg-eval-review-overlay" style={{ opacity: modalOpacity }}>
        <div shuku-edit-id="e-ba62de40-0b5b-4d25-84e8-0aa9d34bffd7" className="aipe-replay-cg-eval-review-sheet">
          <div shuku-edit-id="e-098e17c7-119f-4ca4-86a0-ca226a2b7e7f" className="aipe-replay-cg-eval-review-heading"><span shuku-edit-id="e-19ec446a-4128-4935-b77c-7a9e71f7fcfa" className="aipe-replay-cg-eval-chip"><Typography shuku-edit-id="e-a9c12b27-edcb-4866-95c1-d9ecc8ff66a5" as="span" variant="bodySmall" tone="inherit">AI</Typography></span><Typography shuku-edit-id="e-38abfe70-a93a-42cb-b9f7-b7df9a843db7" variant="h3" tone="inherit">AI 评估</Typography><Typography shuku-edit-id="e-71cdf785-6976-48bc-8da7-3de0ce49f377" variant="bodySmall" tone="muted">依据 Creator Skill</Typography></div>
          <div shuku-edit-id="e-5306b145-6ef2-41c9-8428-ca1ee7c9dda3" className="aipe-replay-cg-eval-review-rows">{reviews.map((review, index) => <div shuku-edit-id="e-232fb4e5-625c-49b3-b6f4-33a5fdd157c9" key={review.title} className={`${index <= activeReview ? 'is-revealed' : ''}${index === activeReview ? ' is-active' : ''}`}><Typography shuku-edit-id="e-ea1674a3-ff57-4f4d-8141-7aeb10c555c7" variant="body" tone="inherit">{review.title}</Typography><Typography shuku-edit-id="e-42fe37cc-0698-4493-b27e-5f23246514e0" variant="bodySmall" tone="inherit">{review.text}</Typography><Typography shuku-edit-id="e-b3f2b02d-1398-42ac-a5b8-7d864f7ccf11" variant="bodySmall" tone="inherit">{review.result}</Typography></div>)}</div>
          <Typography shuku-edit-id="e-095732fb-d947-4766-9082-488f99d82ee4" variant="body" tone="inherit" className="aipe-replay-cg-eval-recommendation">建议：直接拖动颜料，混色即时响应。</Typography>
        </div>
      </div>}
    </div>
    <div shuku-edit-id="e-499b2f27-4d94-4636-ac0b-ea9160d640af" className="aipe-replay-cg-eval-caption"><Typography shuku-edit-id="e-d51fddec-990e-4515-9b6f-e110a013530b" variant="body" tone="inherit">{caption}</Typography></div>
    <div shuku-edit-id="e-6450dc3b-783e-49fa-b586-d8dd20f8f02a" className={`aipe-replay-cg-eval-virtual-cursor${pressed || (time >= 4720 && time < 4900) || redDrag || yellowDrag ? ' is-pressing' : ''}`} style={{ left: `${pointer.x}%`, top: pointer.y, opacity: pointerOpacity }} aria-hidden="true"><span shuku-edit-id="e-65445b46-42b6-441b-abfd-850639dce715"/><svg shuku-edit-id="e-e5a0fd0e-3872-4d1c-bf2d-88fc28aa5c5d" viewBox="0 0 32 40" fill="white" stroke="#253758" strokeWidth="2.2" strokeLinejoin="round"><path shuku-edit-id="e-6ed4a17b-9663-4a3f-8903-41773e7d2434" d="M4 2v29l8-7 6 13 6-3-6-12 11-1Z"/></svg></div>
    {(redDrag || yellowDrag) && <div shuku-edit-id="e-78279ad6-6245-4912-a093-01fb4c7d7999" className={`aipe-replay-cg-eval-drag-paint${yellowDrag ? ' is-yellow' : ''}`} style={{ left: `${pointer.x}%`, top: pointer.y }} aria-hidden="true"/>}
  </div>;
}
