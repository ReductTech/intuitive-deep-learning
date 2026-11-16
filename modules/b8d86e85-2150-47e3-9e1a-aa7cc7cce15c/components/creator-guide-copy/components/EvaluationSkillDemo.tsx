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

  return <div shuku-edit-id="e-9168190f-773a-4a76-bc18-74d69c9d4246" className="aipe-replay-cg-eval-demo" data-evaluation-phase={phase} data-evaluation-enabled={enabled} data-evaluation-time={Math.floor(time)}>
    <div shuku-edit-id="e-6751ebe6-81e3-4e41-8aa9-659368c9ee0e" className="aipe-replay-cg-eval-toolbar">
      <label shuku-edit-id="e-04dba81f-eec0-43ed-97f6-131512a8e3c3" className="edu-check aipe-replay-cg-eval-autotoggle"><input shuku-edit-id="e-2b301052-38c9-4364-b8d1-17e5dc51e0b4" type="checkbox" checked={enabled} readOnly tabIndex={-1}/><Typography shuku-edit-id="e-cc0864e3-fea9-4dff-8643-525d6649c603" as="span" variant="body" tone="inherit">启用 AI 评估</Typography></label>
      <Typography shuku-edit-id="e-ed345c39-00d1-4aff-8bf0-b6a3d912bbd8" variant="bodySmall" tone="inherit" className="aipe-replay-cg-eval-stage-name">{stage}</Typography>
    </div>
    <div shuku-edit-id="e-9f0959af-9104-486d-9b58-e6ad48af1d64" className="aipe-replay-cg-mix-stage" role="group" aria-label={`颜色混合知识呈现作品自动演示：${stage}`} style={{ '--upgrade': upgrade } as CSSProperties}>
      <div shuku-edit-id="e-538cfe53-2c47-4bef-a6c2-1e826d4db2e4" className={`aipe-replay-cg-mix-content${reviewing ? ' is-under-review' : ''}`}>
        <Typography shuku-edit-id="e-000d455f-116b-4ee2-bcf7-ef72df268c8f" variant="h3" tone="inherit" className="aipe-replay-cg-mix-title">颜色混合</Typography>
        <div shuku-edit-id="e-032e2d4f-9433-404b-94e2-b49e9a11911f" className="aipe-replay-cg-mix-instruction"><Typography shuku-edit-id="e-0af6112a-8188-4636-b202-b34a6bbaa1f9" variant="body" tone="muted" style={{ opacity: 1 - upgrade }}>调节比例，点击混合。</Typography><Typography shuku-edit-id="e-908a31e0-515e-4226-abd6-84f434431205" variant="body" tone="inherit" style={{ opacity: upgrade }}>拖动颜料，直接观察颜色变化。</Typography></div>
        <div shuku-edit-id="e-76fde3c4-81bd-40f1-936b-7a683fb6e4c5" className="aipe-replay-cg-mix-controls" style={{ opacity: 1 - upgrade, transform: `translateY(${-12 * upgrade}px)`, visibility: upgrade === 1 ? 'hidden' : 'visible' }}>
          <RangeControl label={<Typography shuku-edit-id="e-9e518ed7-6296-40d5-8e7a-4b4f2fd6fbb7" as="span" variant="bodySmall" tone="inherit">红黄比例</Typography>} min={0} max={100} value={Math.round(slider * 100)} readOnly tabIndex={-1} formatValue={() => '红色  /  黄色'} controlClassName="aipe-replay-cg-mix-ratio"/>
          <Button className={`aipe-replay-cg-mix-start${pressed ? ' is-pressed' : ''}`} tabIndex={-1}><Typography shuku-edit-id="e-d6d1de27-0033-4dc3-946f-84edf9a649c5" as="span" variant="body" tone="inherit">开始混合</Typography></Button>
          <Button className="aipe-replay-cg-mix-reset" tabIndex={-1}><Typography shuku-edit-id="e-c3266ccd-18d0-4cef-98a7-b4f848ea6391" as="span" variant="body" tone="inherit">重置</Typography></Button>
        </div>
        <div shuku-edit-id="e-a1a019bd-74f7-454e-b5d9-52953fa81ebb" className="aipe-replay-cg-mix-source is-red" style={{ left: `${lerp(23, 18, upgrade)}%`, top: `${lerp(286, 180, upgrade)}px` }}><div shuku-edit-id="e-900d72ad-032d-46c5-878f-49898bd629db" className="aipe-replay-cg-paint-pot"><span shuku-edit-id="e-79a03d8e-1607-4e04-b618-01fbec2953c1"/></div><Typography shuku-edit-id="e-62c85988-3aad-4e74-9852-f6ad08dc81b2" variant="body" tone="inherit">红色颜料</Typography></div>
        <div shuku-edit-id="e-64129bb9-7a35-44dd-9f6d-c3c18a427b88" className="aipe-replay-cg-mix-source is-yellow" style={{ left: `${lerp(46, 82, upgrade)}%`, top: `${lerp(286, 180, upgrade)}px` }}><div shuku-edit-id="e-8756cec0-75c8-4786-857e-5323c7c2e036" className="aipe-replay-cg-paint-pot"><span shuku-edit-id="e-260c3f95-da0c-44d6-a400-6d69c0f2fd4d"/></div><Typography shuku-edit-id="e-fbd019c3-4359-483c-97e4-64479d2f9671" variant="body" tone="inherit">黄色颜料</Typography></div>
        <Typography shuku-edit-id="e-efd938fa-04f3-45ad-a510-0dd19ea7bd5b" as="span" variant="h2" tone="muted" className="aipe-replay-cg-mix-symbol is-plus" style={{ opacity: 1 - upgrade }}>＋</Typography>
        <Typography shuku-edit-id="e-8c3af277-35c8-4a8b-b92c-8bb806f48222" as="span" variant="h2" tone="muted" className="aipe-replay-cg-mix-symbol is-arrow" style={{ opacity: 1 - upgrade }}>→</Typography>
        <div shuku-edit-id="e-1e2f5f06-ab57-42e6-b3b7-f815324709fe" className="aipe-replay-cg-mix-palette-object" style={{ left: `${lerp(77, 50, upgrade)}%`, top: `${lerp(286, 302, upgrade)}px`, width: `${lerp(240, 336, upgrade)}px` }}>
          <div shuku-edit-id="e-e3268d5b-5365-4b8c-8f11-f294ed3be621" className={`aipe-replay-cg-mix-palette${redDrag || yellowDrag ? ' is-targeted' : ''}`} style={{ height: `${lerp(126, 154, upgrade)}px` }}><i shuku-edit-id="e-93c10d8f-3c01-4700-9175-ca15946ae4df" className="aipe-replay-cg-mix-palette-hole"/><div shuku-edit-id="e-546e8fe7-7a11-429e-b6fa-9d747999b40b" className="aipe-replay-cg-mix-pool" style={{ opacity: fill, '--mix-hue': hue, width: `${lerp(53, 66, yellowFill)}%` } as CSSProperties}><span shuku-edit-id="e-f07a4402-a8aa-4fc0-b91c-d454e462db12"/><i shuku-edit-id="e-28dd5100-9cfb-487f-8429-39984a598039"/></div></div>
          <Typography shuku-edit-id="e-3ba519e2-b0ac-4692-8776-31e2025b1032" variant="body" tone="inherit">{fill > .5 ? '混合后的颜色' : '调色盘'}</Typography>
        </div>
        <div shuku-edit-id="e-2ab23d92-2196-49e9-ae68-ed72c52f6d1e" className="aipe-replay-cg-mix-revision-label" style={{ opacity: upgrade > .02 && upgrade < .99 ? 1 : 0 }}><span shuku-edit-id="e-5ee79963-4d5d-4233-99c3-ca57d60fb732"/><Typography shuku-edit-id="e-7ccd649d-8f9d-470b-8946-2623ea4a0ee2" variant="body" tone="inherit">精简面板 · 直接操作颜料</Typography></div>
      </div>
      {reviewing && <div shuku-edit-id="e-ee6ef7b6-62e3-4a34-8398-76239510b7a8" className="aipe-replay-cg-eval-review-overlay" style={{ opacity: modalOpacity }}>
        <div shuku-edit-id="e-ae93bbd5-5fa2-480d-b4fb-155abdf2dec5" className="aipe-replay-cg-eval-review-sheet">
          <div shuku-edit-id="e-348b8293-56a3-4733-b54f-a632a098f12a" className="aipe-replay-cg-eval-review-heading"><span shuku-edit-id="e-96bfeb6b-2fc5-43d8-b45c-7a3541bc0765" className="aipe-replay-cg-eval-chip"><Typography shuku-edit-id="e-c9355fe7-2315-4009-a77c-dc4cad41dd5d" as="span" variant="bodySmall" tone="inherit">AI</Typography></span><Typography shuku-edit-id="e-cf902451-95f9-4ab4-a1ed-4ceafc02064a" variant="h3" tone="inherit">AI 评估</Typography><Typography shuku-edit-id="e-5d68d4df-b6a5-48e6-8c04-1e08508e7097" variant="bodySmall" tone="muted">依据 Creator Skill</Typography></div>
          <div shuku-edit-id="e-000067dd-5310-47f7-93a4-67cd06c0612a" className="aipe-replay-cg-eval-review-rows">{reviews.map((review, index) => <div shuku-edit-id="e-578247f7-be10-475b-9f92-23c9873671d8" key={review.title} className={`${index <= activeReview ? 'is-revealed' : ''}${index === activeReview ? ' is-active' : ''}`}><Typography shuku-edit-id="e-8dca1a74-19df-48f7-a6d4-a58e35752def" variant="body" tone="inherit">{review.title}</Typography><Typography shuku-edit-id="e-8026dabb-f060-4d45-8d20-a83284ab560e" variant="bodySmall" tone="inherit">{review.text}</Typography><Typography shuku-edit-id="e-93ea276a-4a3d-478b-b682-7da1c37b07c6" variant="bodySmall" tone="inherit">{review.result}</Typography></div>)}</div>
          <Typography shuku-edit-id="e-106d8e48-1bdd-41ac-9aa7-856d7bdeb08e" variant="body" tone="inherit" className="aipe-replay-cg-eval-recommendation">建议：直接拖动颜料，混色即时响应。</Typography>
        </div>
      </div>}
    </div>
    <div shuku-edit-id="e-4a3d404f-74b8-4583-883f-f477dd3c035f" className="aipe-replay-cg-eval-caption"><Typography shuku-edit-id="e-e92966b7-9d9c-46e1-b88c-ca63294d1032" variant="body" tone="inherit">{caption}</Typography></div>
    <div shuku-edit-id="e-6edb9a5e-e327-402d-9925-1ecd2eff85aa" className={`aipe-replay-cg-eval-virtual-cursor${pressed || (time >= 4720 && time < 4900) || redDrag || yellowDrag ? ' is-pressing' : ''}`} style={{ left: `${pointer.x}%`, top: pointer.y, opacity: pointerOpacity }} aria-hidden="true"><span shuku-edit-id="e-3a853955-9c9c-40b6-8a57-af6ac410fc1a"/><svg shuku-edit-id="e-c4acd565-fab0-49e6-8c2c-44bf79bae9b0" viewBox="0 0 32 40" fill="white" stroke="#253758" strokeWidth="2.2" strokeLinejoin="round"><path shuku-edit-id="e-c1c873ed-2989-4978-b806-928c96aa3261" d="M4 2v29l8-7 6 13 6-3-6-12 11-1Z"/></svg></div>
    {(redDrag || yellowDrag) && <div shuku-edit-id="e-f77abe71-8f32-4e69-b81e-c415cf5962fa" className={`aipe-replay-cg-eval-drag-paint${yellowDrag ? ' is-yellow' : ''}`} style={{ left: `${pointer.x}%`, top: pointer.y }} aria-hidden="true"/>}
  </div>;
}
