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

  return <div shuku-edit-id="e-577bf144-3804-4007-95d5-1deaa2fea7aa" className="cg-eval-demo" data-evaluation-phase={phase} data-evaluation-enabled={enabled} data-evaluation-time={Math.floor(time)}>
    <div shuku-edit-id="e-c3a95e81-092b-443d-ad11-d32121afd362" className="cg-eval-toolbar">
      <label shuku-edit-id="e-a6cf8a1d-12c7-4854-8dfc-2fd191729215" className="edu-check cg-eval-autotoggle"><input shuku-edit-id="e-baadfddf-1ce3-4358-8d4e-b799e8b4b4d2" type="checkbox" checked={enabled} readOnly tabIndex={-1}/><Typography shuku-edit-id="e-3712858d-92d6-4b17-b3a3-f5a62e94ff19" as="span" variant="body" tone="inherit">启用 AI 评估</Typography></label>
      <Typography shuku-edit-id="e-f3ad054f-50ca-4f34-9ad5-27296553e7d1" variant="bodySmall" tone="inherit" className="cg-eval-stage-name">{stage}</Typography>
    </div>
    <div shuku-edit-id="e-81b47634-5102-49aa-acb2-4b10659c159c" className="cg-mix-stage" role="group" aria-label={`颜色混合知识呈现作品自动演示：${stage}`} style={{ '--upgrade': upgrade } as CSSProperties}>
      <div shuku-edit-id="e-eb7871cd-be19-468a-8870-28915bdbb37a" className={`cg-mix-content${reviewing ? ' is-under-review' : ''}`}>
        <Typography shuku-edit-id="e-3be82d41-aabd-4226-ac50-b8bedf8b1faa" variant="h3" tone="inherit" className="cg-mix-title">颜色混合</Typography>
        <div shuku-edit-id="e-bf73d6ea-ebaa-4545-aedb-d65912a945b5" className="cg-mix-instruction"><Typography shuku-edit-id="e-8a5748f9-3c04-44e7-9d90-004a85ca9bde" variant="body" tone="muted" style={{ opacity: 1 - upgrade }}>调节比例，点击混合。</Typography><Typography shuku-edit-id="e-245715f5-8fb3-40ba-9c7e-2675faea6721" variant="body" tone="inherit" style={{ opacity: upgrade }}>拖动颜料，直接观察颜色变化。</Typography></div>
        <div shuku-edit-id="e-24cf89b8-9412-4027-baae-ffbe17f05a1a" className="cg-mix-controls" style={{ opacity: 1 - upgrade, transform: `translateY(${-12 * upgrade}px)`, visibility: upgrade === 1 ? 'hidden' : 'visible' }}>
          <RangeControl label={<Typography shuku-edit-id="e-e328e2df-12b1-4494-a9af-7a0321fa41a8" as="span" variant="bodySmall" tone="inherit">红黄比例</Typography>} min={0} max={100} value={Math.round(slider * 100)} readOnly tabIndex={-1} formatValue={() => '红色  /  黄色'} controlClassName="cg-mix-ratio"/>
          <Button className={`cg-mix-start${pressed ? ' is-pressed' : ''}`} tabIndex={-1}><Typography shuku-edit-id="e-97110086-d364-4514-ad47-d255ecb9004e" as="span" variant="body" tone="inherit">开始混合</Typography></Button>
          <Button className="cg-mix-reset" tabIndex={-1}><Typography shuku-edit-id="e-00cab6f9-4b37-4793-8cbc-c60becaa154e" as="span" variant="body" tone="inherit">重置</Typography></Button>
        </div>
        <div shuku-edit-id="e-23a12e85-cc63-44d3-a142-306676344f90" className="cg-mix-source is-red" style={{ left: `${lerp(23, 18, upgrade)}%`, top: `${lerp(286, 180, upgrade)}px` }}><div shuku-edit-id="e-8e73bda4-acb0-40c7-aab4-019e8af10030" className="cg-paint-pot"><span shuku-edit-id="e-19c48ab1-ccab-40b7-941a-5b38bf09fed2"/></div><Typography shuku-edit-id="e-d3abe1bf-12c8-4ba9-b9ad-6dcd71f53422" variant="body" tone="inherit">红色颜料</Typography></div>
        <div shuku-edit-id="e-189d3506-6e30-40d1-876b-35a6fad9e235" className="cg-mix-source is-yellow" style={{ left: `${lerp(46, 82, upgrade)}%`, top: `${lerp(286, 180, upgrade)}px` }}><div shuku-edit-id="e-8f67bc4d-7ef3-40ac-83c5-f313faa3adc9" className="cg-paint-pot"><span shuku-edit-id="e-a4a2a28a-d487-43d7-a62b-569093ef8eeb"/></div><Typography shuku-edit-id="e-22ce23ba-3515-4425-8044-ff51fa6e3d15" variant="body" tone="inherit">黄色颜料</Typography></div>
        <Typography shuku-edit-id="e-ca70a630-3ebe-4795-8ac8-bf2a0aa241ff" as="span" variant="h2" tone="muted" className="cg-mix-symbol is-plus" style={{ opacity: 1 - upgrade }}>＋</Typography>
        <Typography shuku-edit-id="e-888729e0-e56a-4bb7-b8c5-e255ddf32175" as="span" variant="h2" tone="muted" className="cg-mix-symbol is-arrow" style={{ opacity: 1 - upgrade }}>→</Typography>
        <div shuku-edit-id="e-9876068a-f474-4562-bc29-81e37c526ab0" className="cg-mix-palette-object" style={{ left: `${lerp(77, 50, upgrade)}%`, top: `${lerp(286, 302, upgrade)}px`, width: `${lerp(240, 336, upgrade)}px` }}>
          <div shuku-edit-id="e-1e281f8d-1c2e-4bf7-857b-2ea81457b854" className={`cg-mix-palette${redDrag || yellowDrag ? ' is-targeted' : ''}`} style={{ height: `${lerp(126, 154, upgrade)}px` }}><i shuku-edit-id="e-2b586380-448f-4fa9-b1fc-d24dc9f1aa52" className="cg-mix-palette-hole"/><div shuku-edit-id="e-8fb122d3-d55d-49f6-96d5-ef9246e5c3f0" className="cg-mix-pool" style={{ opacity: fill, '--mix-hue': hue, width: `${lerp(53, 66, yellowFill)}%` } as CSSProperties}><span shuku-edit-id="e-f392f019-c66a-438c-9170-ad0a5b1d3a33"/><i shuku-edit-id="e-ff9120af-62b9-483d-a0b1-f4245bbbe444"/></div></div>
          <Typography shuku-edit-id="e-ca0c75b5-a2bf-4cff-9985-955d506708e0" variant="body" tone="inherit">{fill > .5 ? '混合后的颜色' : '调色盘'}</Typography>
        </div>
        <div shuku-edit-id="e-dad107ab-840b-4ec0-b550-2150391ab84e" className="cg-mix-revision-label" style={{ opacity: upgrade > .02 && upgrade < .99 ? 1 : 0 }}><span shuku-edit-id="e-985f701b-cce7-45e3-a4e0-be5447d0661a"/><Typography shuku-edit-id="e-78877d1c-7286-4c29-acab-bd23b311d2f9" variant="body" tone="inherit">精简面板 · 直接操作颜料</Typography></div>
      </div>
      {reviewing && <div shuku-edit-id="e-aa1b1427-415e-4e31-b7a0-620d80d999da" className="cg-eval-review-overlay" style={{ opacity: modalOpacity }}>
        <div shuku-edit-id="e-6674d4b5-9c1c-4d06-89f4-d60da49a3fc9" className="cg-eval-review-sheet">
          <div shuku-edit-id="e-93d3e96c-f631-4617-a8ea-d514a19ed143" className="cg-eval-review-heading"><span shuku-edit-id="e-41721ab2-c10f-4104-a882-bfd756d2e583" className="cg-eval-chip"><Typography shuku-edit-id="e-579a0885-cf6c-428d-9020-3ea693c8e20a" as="span" variant="bodySmall" tone="inherit">AI</Typography></span><Typography shuku-edit-id="e-e4d32072-0d62-48dd-91e8-e0d9c2bbf0c5" variant="h3" tone="inherit">AI 评估</Typography><Typography shuku-edit-id="e-fd812ee9-f3a1-44aa-88ed-cede9c225891" variant="bodySmall" tone="muted">依据 Creator Skill</Typography></div>
          <div shuku-edit-id="e-38184488-2898-4704-90f6-40fc534dc562" className="cg-eval-review-rows">{reviews.map((review, index) => <div shuku-edit-id="e-57bca6db-9293-4620-93ce-9114d427cfbe" key={review.title} className={`${index <= activeReview ? 'is-revealed' : ''}${index === activeReview ? ' is-active' : ''}`}><Typography shuku-edit-id="e-c49d9424-ec6f-4d2d-b50d-ef24ae64a389" variant="body" tone="inherit">{review.title}</Typography><Typography shuku-edit-id="e-c5d33149-93eb-44c3-864c-0bdfd7fe1f43" variant="bodySmall" tone="inherit">{review.text}</Typography><Typography shuku-edit-id="e-59d83623-5b65-4d66-8d29-4f0913d5adaa" variant="bodySmall" tone="inherit">{review.result}</Typography></div>)}</div>
          <Typography shuku-edit-id="e-512960b0-799e-482f-938a-fc1946127eba" variant="body" tone="inherit" className="cg-eval-recommendation">建议：直接拖动颜料，混色即时响应。</Typography>
        </div>
      </div>}
    </div>
    <div shuku-edit-id="e-47a91b20-4079-452f-b551-6d877574d940" className="cg-eval-caption"><Typography shuku-edit-id="e-501795f4-9d39-474d-9fb7-c096e611a8e9" variant="body" tone="inherit">{caption}</Typography></div>
    <div shuku-edit-id="e-291a2507-c478-4d74-af77-79ac6525c117" className={`cg-eval-virtual-cursor${pressed || (time >= 4720 && time < 4900) || redDrag || yellowDrag ? ' is-pressing' : ''}`} style={{ left: `${pointer.x}%`, top: pointer.y, opacity: pointerOpacity }} aria-hidden="true"><span shuku-edit-id="e-498f2e39-eda1-45b5-82cf-329e6bd3a4df"/><svg shuku-edit-id="e-7566ea5b-20a0-44dc-b3fe-f84283f784dc" viewBox="0 0 32 40" fill="white" stroke="#253758" strokeWidth="2.2" strokeLinejoin="round"><path shuku-edit-id="e-5959c27e-23e5-4354-aed1-eb0abc83ce1a" d="M4 2v29l8-7 6 13 6-3-6-12 11-1Z"/></svg></div>
    {(redDrag || yellowDrag) && <div shuku-edit-id="e-4c0f2a24-90f8-4739-aba4-d6bfeeeba894" className={`cg-eval-drag-paint${yellowDrag ? ' is-yellow' : ''}`} style={{ left: `${pointer.x}%`, top: pointer.y }} aria-hidden="true"/>}
  </div>;
}
