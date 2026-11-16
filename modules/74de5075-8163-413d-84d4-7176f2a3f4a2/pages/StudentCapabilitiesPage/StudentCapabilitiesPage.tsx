import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useState, type CSSProperties, type KeyboardEvent } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import './StudentCapabilitiesPage.css';

const capabilities = [
  { id: 'frontier', title: '信息获取与判断能力', detail: '获取信息　判断价值', sprite: 'left', x: 195, y: 285, archX: 185, archY: 398, archW: 205, archH: 244, line: '195,410 298,419' },
  { id: 'understanding', title: '知识理解与表达能力', detail: '理解原理　清晰表达', sprite: 'near-left', x: 500, y: 160, archX: 423, archY: 356, archW: 224, archH: 280, line: '500,280 541,374' },
  { id: 'expression', title: '产品思维与审美能力', detail: '理解需求　设计体验', sprite: 'center', x: 800, y: 125, archX: 684, archY: 337, archW: 232, archH: 290, line: '800,245 800,358' },
  { id: 'practice', title: '动手解决问题的能力', detail: '动手实现　检验方案', sprite: 'near-right', x: 1100, y: 160, archX: 953, archY: 356, archW: 224, archH: 280, line: '1100,280 1057,374' },
  { id: 'innovation', title: '批判思考与创新能力', detail: '独立判断　提出新解', sprite: 'right', x: 1405, y: 285, archX: 1210, archY: 398, archW: 205, archH: 244, line: '1405,410 1300,419' },
] as const;

const asset = (file: string) => moduleAssetUrl(`images/student-capabilities/${file}`);

// Trace each front arch in the background's coordinate space. The side arches
// have different spring heights because the pavilion recedes in perspective.
// Leave the threshold open: it is a sloping marble step, not a rectangle.
const archContours = [
  'M0 232 L0 104 C0 46 44 0 96 0 C152 0 205 40 205 93 L205 222',
  'M0 270 L0 112 C0 51 54 0 108 0 C168 0 224 42 224 94 L224 260',
  'M0 280 L0 116 C0 51 52 0 116 0 C180 0 232 51 232 116 L232 280',
  'M0 260 L0 94 C0 42 56 0 116 0 C170 0 224 51 224 112 L224 270',
  'M0 222 L0 93 C0 40 53 0 109 0 C161 0 205 46 205 104 L205 232',
] as const;

export function StudentCapabilitiesPage() {
  const [active, setActive] = useState(2);
  function moveFocus(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const delta = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
    if (!delta) return;
    event.preventDefault();
    event.stopPropagation();
    const next = (index + delta + capabilities.length) % capabilities.length;
    const buttons = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('.aipe-capability-arch');
    buttons?.[next]?.focus();
  }

  return <ContentBlock shuku-edit-id="e-3c9cd89a-6f95-4e1a-9ffd-2da4e4cfb0bf" className="aipe-capabilities-page" headingLevel={1} title="学生能力培养目标" subtitle="系统掌握知识，持续追踪前沿" bodyClassName="aipe-capabilities-body">
    <div shuku-edit-id="e-41dca958-b27e-45a9-8f5d-82538e1295c4" className="aipe-capability-hall" data-facing={capabilities[active].sprite}
      onPointerLeave={() => setActive(2)}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setActive(2); }}>
      <div shuku-edit-id="e-fa515b5d-49fb-4a96-aeb0-2200bab1bb32" className="aipe-capability-scenery">
        <img shuku-edit-id="e-c0b36bcb-406b-4fd0-a099-7fec929bbe9d" className="aipe-capability-background" src={asset('hall-background.jpg')} alt="五座相连的拱门构成能力殿堂，分别对应信息判断、知识理解与表达、产品思维与审美、动手解决问题和批判创新" draggable={false}/>
        {capabilities.map((capability, index) => <button shuku-edit-id="e-c923c335-6085-4a96-baa1-b248cc0ba434" key={capability.id} type="button"
          className="aipe-capability-arch" data-capability={capability.id} data-active={active === index}
          aria-labelledby={`aipe-capability-${capability.id}`} aria-pressed={active === index}
          style={{ left: capability.archX, top: capability.archY, width: capability.archW, height: capability.archH,
            clipPath: `path('${archContours[index]} Z')` } as CSSProperties}
          onPointerEnter={() => setActive(index)} onFocus={() => setActive(index)}
          onClick={() => setActive(index)} onKeyDown={event => moveFocus(event, index)}>
          <svg shuku-edit-id="e-8dab1eb3-a8ad-43c8-83f9-a09f324a1dc7" className="aipe-capability-arch-outline" viewBox={`-3 -3 ${capability.archW + 6} ${capability.archH + 6}`} aria-hidden="true">
            <path shuku-edit-id="e-ff20626f-0d21-44ba-9860-ed006a7b5041" d={archContours[index]}/>
          </svg>
        </button>) }
      </div>
      <svg shuku-edit-id="e-54951e6e-4bcb-4ef3-8f1f-169e960460a7" className="aipe-capability-leaders" viewBox="0 0 1600 900" aria-hidden="true">
        {capabilities.map((capability, index) => <g shuku-edit-id="e-789cbb8d-9cf0-44cd-a10c-e30cc06893cc" key={capability.id} data-active={active === index}>
          <polyline shuku-edit-id="e-bd223dcb-4823-4078-8776-e4342832ded3" points={capability.line}/>
          {capability.line.split(' ').map((point, i) => { const [cx, cy] = point.split(','); return <circle shuku-edit-id="e-ea918475-a23d-4f36-a4e1-f0a14a1f2f85" key={i} cx={cx} cy={cy} r="3"/>; })}
        </g>)}
      </svg>
      {capabilities.map((capability, index) => <div shuku-edit-id="e-f7b7265a-63b8-4709-bd23-03e80db56b63" key={capability.id}
        className="aipe-capability-label" data-active={active === index}
        style={{ left: capability.x, top: capability.y }} onPointerEnter={() => setActive(index)}>
        <Typography shuku-edit-id="e-fc12ac5d-f1bd-4f0e-a6bb-49ff55ab40e8" as="h2" id={`aipe-capability-${capability.id}`} variant="subtitle" tone="accent">{capability.title}</Typography>
        <Typography shuku-edit-id="e-88d1ab9b-26f8-4094-99e4-14f733d5454f" as="p" variant="body" tone="muted">{capability.detail}</Typography>
      </div>)}
      <div shuku-edit-id="e-ed447c59-34b3-4d6b-8228-9ce01a9c2a10" className="aipe-capability-student" role="img" aria-label={`知识探索者面向${capabilities[active].title}`}>
        <span shuku-edit-id="e-f628981b-0e11-4070-b0ad-e44cdf2928de" className="aipe-capability-student-shadow"/>
        {capabilities.map((capability, index) => <img shuku-edit-id="e-29e58377-5f96-408e-9f35-b64ec93e8a93" key={capability.id}
          className="aipe-capability-sprite" src={asset(`student-${capability.sprite}-stylized-v2.png`)} alt="" aria-hidden="true"
          data-active={active === index} draggable={false} decoding="async"/>) }
      </div>
      <Typography shuku-edit-id="e-f843e244-a53e-4287-8c14-8f4c62d546c0" as="p" variant="h3" tone="accent" className="aipe-capability-explorer">知识探索者</Typography>
    </div>
  </ContentBlock>;
}
