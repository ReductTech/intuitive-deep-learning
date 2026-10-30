import { useState, type CSSProperties, type KeyboardEvent } from 'react';
import { ContentBlock, Typography, moduleAssetUrl } from '../../../shared/react';
import outline from '../../outlines.json';
import './StudentCapabilitiesPage.css';

const capabilities = [
  { id: 'frontier', title: '前沿信息获取与筛选能力', detail: '追踪前沿　筛选信息', sprite: 'left', x: 195, y: 285, archX: 185, archY: 398, archW: 205, archH: 244, line: '195,410 298,419' },
  { id: 'understanding', title: '知识整合与理解能力', detail: '建立联系　理解方法', sprite: 'near-left', x: 500, y: 160, archX: 423, archY: 356, archW: 224, archH: 280, line: '500,280 541,374' },
  { id: 'expression', title: '知识表达能力', detail: '准确呈现专业理解', sprite: 'center', x: 800, y: 125, archX: 684, archY: 337, archW: 232, archH: 290, line: '800,245 800,358' },
  { id: 'practice', title: '实践应用与问题解决能力', detail: '应用知识　检验方案', sprite: 'near-right', x: 1100, y: 160, archX: 953, archY: 356, archW: 224, archH: 280, line: '1100,280 1057,374' },
  { id: 'innovation', title: '批判性思维与创新能力', detail: '独立判断　探索新思路', sprite: 'right', x: 1405, y: 285, archX: 1210, archY: 398, archW: 205, archH: 244, line: '1405,410 1300,419' },
] as const;

const asset = (file: string) => moduleAssetUrl(outline.moduleIdentity.id, `images/student-capabilities/${file}`);

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
    const next = (index + delta + capabilities.length) % capabilities.length;
    const buttons = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('.aipe-capability-arch');
    buttons?.[next]?.focus();
  }

  return <ContentBlock className="aipe-capabilities-page" headingLevel={1} title="学生能力培养目标" subtitle="系统掌握知识，持续追踪前沿" bodyClassName="aipe-capabilities-body">
    <div className="aipe-capability-hall" data-facing={capabilities[active].sprite}
      onPointerLeave={() => setActive(2)}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setActive(2); }}>
      <div className="aipe-capability-scenery">
        <img className="aipe-capability-background" src={asset('hall-background.png')} alt="五座相连的拱门构成能力殿堂，分别呈现文献、知识联系、表达、实践和创新" draggable={false}/>
        {capabilities.map((capability, index) => <button key={capability.id} type="button"
          className="aipe-capability-arch" data-capability={capability.id} data-active={active === index}
          aria-labelledby={`aipe-capability-${capability.id}`} aria-pressed={active === index}
          style={{ left: capability.archX, top: capability.archY, width: capability.archW, height: capability.archH,
            clipPath: `path('${archContours[index]} Z')` } as CSSProperties}
          onPointerEnter={() => setActive(index)} onFocus={() => setActive(index)}
          onClick={() => setActive(index)} onKeyDown={event => moveFocus(event, index)}>
          <svg className="aipe-capability-arch-outline" viewBox={`-3 -3 ${capability.archW + 6} ${capability.archH + 6}`} aria-hidden="true">
            <path d={archContours[index]}/>
          </svg>
        </button>) }
      </div>
      <svg className="aipe-capability-leaders" viewBox="0 0 1600 900" aria-hidden="true">
        {capabilities.map((capability, index) => <g key={capability.id} data-active={active === index}>
          <polyline points={capability.line}/>
          {capability.line.split(' ').map((point, i) => { const [cx, cy] = point.split(','); return <circle key={i} cx={cx} cy={cy} r="3"/>; })}
        </g>)}
      </svg>
      {capabilities.map((capability, index) => <div key={capability.id}
        className="aipe-capability-label" data-active={active === index}
        style={{ left: capability.x, top: capability.y }} onPointerEnter={() => setActive(index)}>
        <Typography as="h2" id={`aipe-capability-${capability.id}`} variant="subtitle" tone="accent">{capability.title}</Typography>
        <Typography as="p" variant="body" tone="muted">{capability.detail}</Typography>
      </div>)}
      <div className="aipe-capability-student" role="img" aria-label={`知识探索者面向${capabilities[active].title}`}>
        <span className="aipe-capability-student-shadow"/>
        {capabilities.map((capability, index) => <img key={capability.id}
          className="aipe-capability-sprite" src={asset(`student-${capability.sprite}-stylized-v2.png`)} alt="" aria-hidden="true"
          data-active={active === index} draggable={false} decoding="async"/>) }
      </div>
      <Typography as="p" variant="h3" tone="accent" className="aipe-capability-explorer">知识探索者</Typography>
    </div>
  </ContentBlock>;
}
