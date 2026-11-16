import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useState, type CSSProperties, type KeyboardEvent } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import './StudentCapabilitiesPage.css';

const capabilities = [
  { id: 'frontier', title: '前沿信息获取与筛选能力', detail: '追踪前沿　筛选信息', sprite: 'left', x: 195, y: 285, archX: 185, archY: 398, archW: 205, archH: 244, line: '195,410 298,419' },
  { id: 'understanding', title: '知识整合与理解能力', detail: '建立联系　理解方法', sprite: 'near-left', x: 500, y: 160, archX: 423, archY: 356, archW: 224, archH: 280, line: '500,280 541,374' },
  { id: 'expression', title: '知识表达能力', detail: '准确呈现专业理解', sprite: 'center', x: 800, y: 125, archX: 684, archY: 337, archW: 232, archH: 290, line: '800,245 800,358' },
  { id: 'practice', title: '实践应用与问题解决能力', detail: '应用知识　检验方案', sprite: 'near-right', x: 1100, y: 160, archX: 953, archY: 356, archW: 224, archH: 280, line: '1100,280 1057,374' },
  { id: 'innovation', title: '批判性思维与创新能力', detail: '独立判断　探索新思路', sprite: 'right', x: 1405, y: 285, archX: 1210, archY: 398, archW: 205, archH: 244, line: '1405,410 1300,419' },
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

  return <ContentBlock shuku-edit-id="e-9f6aa62e-89da-4895-a893-1b29aac5bf2e" className="aipe-capabilities-page" headingLevel={1} title="学生能力培养目标" subtitle="系统掌握知识，持续追踪前沿" bodyClassName="aipe-capabilities-body">
    <div shuku-edit-id="e-c618dcbd-c070-45e3-8645-55605c4659a4" className="aipe-capability-hall" data-facing={capabilities[active].sprite}
      onPointerLeave={() => setActive(2)}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setActive(2); }}>
      <div shuku-edit-id="e-a247c352-b005-4e1d-b04f-296e257eda34" className="aipe-capability-scenery">
        <img shuku-edit-id="e-29cd583c-cf1d-4878-96e1-95a1f47cbaac" className="aipe-capability-background" src={asset('hall-background.jpg')} alt="五座相连的拱门构成能力殿堂，分别呈现文献、知识联系、表达、实践和创新" draggable={false}/>
        {capabilities.map((capability, index) => <button shuku-edit-id="e-3f05c8f0-51fb-48f0-8b8b-7715603e4004" key={capability.id} type="button"
          className="aipe-capability-arch" data-capability={capability.id} data-active={active === index}
          aria-labelledby={`aipe-capability-${capability.id}`} aria-pressed={active === index}
          style={{ left: capability.archX, top: capability.archY, width: capability.archW, height: capability.archH,
            clipPath: `path('${archContours[index]} Z')` } as CSSProperties}
          onPointerEnter={() => setActive(index)} onFocus={() => setActive(index)}
          onClick={() => setActive(index)} onKeyDown={event => moveFocus(event, index)}>
          <svg shuku-edit-id="e-1ad72716-f95a-4a4a-b83b-444b4886baab" className="aipe-capability-arch-outline" viewBox={`-3 -3 ${capability.archW + 6} ${capability.archH + 6}`} aria-hidden="true">
            <path shuku-edit-id="e-13b152c6-9047-4618-b760-95cd71c2ab9e" d={archContours[index]}/>
          </svg>
        </button>) }
      </div>
      <svg shuku-edit-id="e-24757c4f-dd64-4677-b698-e09c51737d77" className="aipe-capability-leaders" viewBox="0 0 1600 900" aria-hidden="true">
        {capabilities.map((capability, index) => <g shuku-edit-id="e-cfe71b9e-38d5-48cd-9083-159807fdb218" key={capability.id} data-active={active === index}>
          <polyline shuku-edit-id="e-0bb85ccf-184a-41b6-b679-00df01b213f8" points={capability.line}/>
          {capability.line.split(' ').map((point, i) => { const [cx, cy] = point.split(','); return <circle shuku-edit-id="e-6c9e5380-b9c1-497d-99e4-bb940792c4b7" key={i} cx={cx} cy={cy} r="3"/>; })}
        </g>)}
      </svg>
      {capabilities.map((capability, index) => <div shuku-edit-id="e-bad11a49-b72c-4cf1-8742-49755cb794ba" key={capability.id}
        className="aipe-capability-label" data-active={active === index}
        style={{ left: capability.x, top: capability.y }} onPointerEnter={() => setActive(index)}>
        <Typography shuku-edit-id="e-e5f7bbce-fb01-4948-82d6-156faf87672e" as="h2" id={`aipe-capability-${capability.id}`} variant="subtitle" tone="accent">{capability.title}</Typography>
        <Typography shuku-edit-id="e-041f0c16-0438-497b-a935-ecf3e1dcfba6" as="p" variant="body" tone="muted">{capability.detail}</Typography>
      </div>)}
      <div shuku-edit-id="e-b3877f0c-390c-40d3-a64e-856125deabcb" className="aipe-capability-student" role="img" aria-label={`知识探索者面向${capabilities[active].title}`}>
        <span shuku-edit-id="e-1212676c-f674-4ff7-95dd-52ee84e2d160" className="aipe-capability-student-shadow"/>
        {capabilities.map((capability, index) => <img shuku-edit-id="e-30361605-65b3-4e8d-a5bd-1b992feae1cf" key={capability.id}
          className="aipe-capability-sprite" src={asset(`student-${capability.sprite}-stylized-v2.png`)} alt="" aria-hidden="true"
          data-active={active === index} draggable={false} decoding="async"/>) }
      </div>
      <Typography shuku-edit-id="e-f8dbdc44-372d-419a-bb3d-b3347387606c" as="p" variant="h3" tone="accent" className="aipe-capability-explorer">知识探索者</Typography>
    </div>
  </ContentBlock>;
}
