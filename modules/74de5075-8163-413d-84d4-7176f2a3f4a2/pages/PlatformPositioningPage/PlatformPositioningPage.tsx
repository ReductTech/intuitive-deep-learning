import { useEffect, useId, useRef, useState, type KeyboardEvent, type CSSProperties } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import { PlatformCapabilityIcon, PlatformLearnerIcon } from './PlatformCapabilityIcons';
import './PlatformPositioningPage.css';

const abilities = [
  { id: 'information', title: '科研信息供给', lines: ['科研信息供给'], description: '质量评价 · 个性推荐' },
  { id: 'content', title: '知识组织与直觉式学习', lines: ['知识组织与', '直觉式学习'], description: '知识关联 · 交互理解' },
  { id: 'practice', title: '编程与可视化实践', lines: ['编程与', '可视化实践'], description: '代码实现 · 实验验证' },
  { id: 'evaluation', title: '学习者建模与评价', lines: ['学习者建模与', '评价'], description: '多元证据 · 反馈改进' },
  { id: 'research', title: '科研探索与协同创新', lines: ['科研探索与', '协同创新'], description: '导师指导 · 问题探索' },
] as const;

// Cards and every connector share one closed orbit; no independently placed arrows.
const orbit = { x: 769, y: 390, rx: 500, ry: 280 };
const card = { width: 440, height: 180 };
const pointAt = (degrees: number) => {
  const angle = degrees * Math.PI / 180;
  return { x: orbit.x + orbit.rx * Math.cos(angle), y: orbit.y + orbit.ry * Math.sin(angle) };
};
const positions = abilities.map((_, index) => pointAt(-90 + index * 72));
const arrows = abilities.map((_, index) => {
  const from = -90 + index * 72, to = from + 72, middle = (from + to) / 2;
  function inside(angle: number, node: typeof positions[number]) {
    const p = pointAt(angle);
    return Math.abs(p.x - node.x) <= card.width / 2 && Math.abs(p.y - node.y) <= card.height / 2;
  }
  function edge(a: number, b: number, node: typeof positions[number], startsInside: boolean) {
    for (let n = 0; n < 24; n++) {
      const mid = (a + b) / 2;
      if (inside(mid, node) === startsInside) a = mid; else b = mid;
    }
    return (a + b) / 2;
  }
  const startAngle = edge(from, middle, positions[index], true) + 1.5;
  const endAngle = edge(middle, to, positions[(index + 1) % positions.length], false) - 1.5;
  const tip = pointAt(endAngle);
  // One filled outline avoids the shaft protruding through a translucent SVG marker.
  let headAngle = endAngle;
  while (headAngle > startAngle && Math.hypot(pointAt(headAngle).x - tip.x, pointAt(headAngle).y - tip.y) < 24) headAngle -= 0.1;
  function side(angle: number, width: number) {
    const p = pointAt(angle), radians = angle * Math.PI / 180;
    const dx = -orbit.rx * Math.sin(radians), dy = orbit.ry * Math.cos(radians);
    const length = Math.hypot(dx, dy);
    return `${p.x - dy / length * width} ${p.y + dx / length * width}`;
  }
  const count = Math.max(2, Math.ceil((headAngle - startAngle) / 0.5));
  const angles = Array.from({ length: count + 1 }, (_, i) => startAngle + (headAngle - startAngle) * i / count);
  const outline = [
    ...angles.map(angle => side(angle, 6)),
    side(headAngle, 16), `${tip.x} ${tip.y}`, side(headAngle, -16),
    ...[...angles].reverse().map(angle => side(angle, -6)),
  ];
  const start = pointAt(startAngle), end = pointAt(headAngle);
  return {
    shape: `M${outline.join(' L')} Z`,
    flow: `M${start.x} ${start.y} A${orbit.rx} ${orbit.ry} 0 0 1 ${end.x} ${end.y}`,
  };
});

export function PlatformPositioningPage() {
  const id = `aipe-platform-${useId().replaceAll(':', '')}`;
  const root = useRef<HTMLElement>(null);
  const circles = useRef<Array<HTMLButtonElement | null>>([]);
  const [hovered, setHovered] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);
  const active = visible ? hovered ?? focused : null;

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let intersecting = false;
    const update = () => {
      setVisible(intersecting && !document.hidden);
      // A slide can be hidden without dispatching pointerleave or blur.
      if (!intersecting || document.hidden) { setHovered(null); setFocused(null); }
    };
    const observer = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; update(); });
    observer.observe(element);
    document.addEventListener('visibilitychange', update);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, []);

  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      event.currentTarget.blur();
      setHovered(null);
      return;
    }
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    const count = abilities.length;
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? count - 1
      : (index + (event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : count - 1)) % count;
    circles.current[next]?.focus();
  }

  return <ContentBlock shuku-edit-id="e-267cf556-9d11-4248-8d04-4477720f6f8b" ref={root} className="aipe-platform-page" headingLevel={1} title={outline.pages.find(page => page.id === '8bca5254-091d-445c-b194-dce2c0dc354e')!.title}
    bodyClassName="aipe-platform-body">
    <div shuku-edit-id="e-07eec1e2-93fa-468b-9af1-7c664b10bd8c" className="aipe-platform-diagram" style={{'--card-width':`${card.width}px`,'--card-height':`${card.height}px`,'--orbit-y':`${orbit.y}px`} as CSSProperties} data-active={active === null ? 'none' : abilities[active].id}
      data-motion={visible ? 'on' : 'off'} role="group" aria-label="围绕知识探索者的五项平台能力，按01到05顺时针阅读">
      <svg shuku-edit-id="e-7832c438-8ed1-4b92-954a-45325b9e0eea" className="aipe-platform-background" viewBox="0 0 1600 760" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <defs shuku-edit-id="e-8bf5aa37-1cb1-4ef9-931b-535b7d38b672">
          <linearGradient shuku-edit-id="e-8c0caaf8-c71f-4aa9-93aa-aaa7c9d71010" id={`${id}-grid-fade`} x1="0" y1="0" x2="0" y2="1">
            <stop shuku-edit-id="e-79d1fc4c-2a81-4933-b8ef-dcb264164830" offset="0.59" stopColor="white" stopOpacity="0"/>
            <stop shuku-edit-id="e-a63f8dbe-f3bd-41ba-b2e6-8c392bf2bd39" offset="0.8" stopColor="white" stopOpacity="0.55"/>
            <stop shuku-edit-id="e-bc6fb1fc-c0f7-4987-bff1-d379c84089b8" offset="1" stopColor="white"/>
          </linearGradient>
          <mask shuku-edit-id="e-a11142d6-0fc1-4936-99a7-aef919471526" id={`${id}-grid-mask`}><rect shuku-edit-id="e-b518268b-dd96-41e2-95d2-c031b3b892b7" width="1600" height="760" fill={`url(#${id}-grid-fade)`}/></mask>
        </defs>
        <g shuku-edit-id="e-2f64385b-96e6-4c1f-bf1a-49a632a00d0f" mask={`url(#${id}-grid-mask)`}>
          <path shuku-edit-id="e-60986477-f0be-42b1-bb82-c03b6a92186e" d="M0 440H1600V760H0Z" fill="#f5f9ff"/>
          <g shuku-edit-id="e-598ad296-093a-4815-a88c-6333b5bb14be" stroke="#b9d7fa" strokeWidth="0.9" opacity="0.7">
            {Array.from({length: 65}, (_, i) => {
              const x = -1760 + i * 80;
              const startX = 800 + (x - 800) * 0.08;
              const endX = Math.max(0, Math.min(1600, x));
              const endY = 410 + 350 * (endX - startX) / (x - startX);
              return <path shuku-edit-id="e-c8f427a9-de02-4ea9-8ee1-646a31085adb" key={`v${i}`} d={`M${startX} 410L${endX} ${endY}`}/>;
            })}
            {Array.from({length: 19}, (_, i) => {
              const y = 420 + 340 * ((i + 1) / 19) ** 1.7;
              return <path shuku-edit-id="e-8b3f6a23-6137-4259-8cb4-e44c7818bf5d" key={`h${i}`} d={`M0 ${y}H1600`}/>;
            })}
          </g>
          <g shuku-edit-id="e-cbea30c4-87f1-4139-827e-364f40fff251" fill="none" stroke="#8eb5e5" strokeWidth="1.3" opacity="0.75">
            {[[90,722],[226,660],[390,718],[610,719],[841,694],[1060,722],[1368,671],[1478,718],[1510,602],[86,598]].map(([x,y]) =>
              <path shuku-edit-id="e-cbac9f52-0807-47ee-b0f3-030f58965a0c" key={`${x}-${y}`} d={`M${x-5} ${y}h10M${x} ${y-5}v10`}/>)}
          </g>
        </g>
      </svg>
      <svg shuku-edit-id="e-68284dac-408b-484d-9abc-356c4f709824" className="aipe-platform-arrows" viewBox="0 0 1538 760" aria-hidden="true">
        <defs shuku-edit-id="e-580c49e8-54dc-4c97-9ccb-1dfb4850906c">
          <linearGradient shuku-edit-id="e-2d331a49-13a2-4b84-a06f-f827da4ac6e4" id={`${id}-blue`}><stop shuku-edit-id="e-5fb0bb9d-07bc-4163-aa2d-d848d5191c9e" stopColor="#d2e7ff"/><stop shuku-edit-id="e-248a4ed5-b7c3-4f43-918e-86133f3a2256" offset="1" stopColor="#79b2f5"/></linearGradient>
        </defs>
        {arrows.map((arrow, index) => <g shuku-edit-id="e-117e6447-f66b-4c42-98b7-f57501efc102" key={index} className="aipe-platform-arrow" data-active={active === index}>
          <path shuku-edit-id="e-ba8204bd-c5ef-452e-aa97-a231888723a1" d={arrow.shape} fill={`url(#${id}-blue)`}/>
          <path shuku-edit-id="e-1683cca9-557b-49a0-a562-0f63fc10c00f" className="aipe-platform-arrow-flow" d={arrow.flow} fill="none" stroke="white" strokeWidth="4" pathLength="100"/>
        </g>)}
      </svg>
      <div shuku-edit-id="e-95380fc5-599c-4ec1-a16a-b4c9aecbec8e" className="aipe-platform-center">
        <svg shuku-edit-id="e-32e66789-3554-45ef-8f0b-835bbfbc5d1e" className="aipe-platform-center-orbit" viewBox="0 0 320 280" aria-hidden="true">
          <ellipse shuku-edit-id="e-906a14d0-933a-49bb-9086-eea6c15f5642" cx="160" cy="133" rx="137" ry="42" transform="rotate(-12 160 133)" fill="none" stroke="#d5eaff" strokeWidth="12" opacity=".38"/>
          <ellipse shuku-edit-id="e-cfbc7ed2-8f04-41ac-9743-278ad7f805a4" cx="160" cy="133" rx="135" ry="42" transform="rotate(12 160 133)" fill="none" stroke="#fff" strokeWidth="3" opacity=".85"/>
          <circle shuku-edit-id="e-478448bf-1831-4af0-865b-3b2dad6f0de0" cx="283" cy="111" r="7" fill="#7abaff"/>
          <circle shuku-edit-id="e-04b80648-37f4-4ece-bc33-cad9168b6f3e" cx="37" cy="156" r="5" fill="#badcfc"/>
        </svg>
        <PlatformLearnerIcon/>
        <Typography shuku-edit-id="e-ba71821e-79c3-42f8-a46f-ecbcd5ea229e" as="h2" variant="h2" tone="accent">知识探索者</Typography>
      </div>
      {abilities.map((ability, index) => <section shuku-edit-id="e-d36e18ba-f24f-487b-a3bc-527e03a2239f" key={ability.id}
        className={`aipe-platform-ability aipe-platform-${ability.id}`} data-active={active === index}
        style={{left:positions[index].x-card.width/2,top:positions[index].y-card.height/2}}
        onPointerEnter={() => setHovered(index)} onPointerLeave={() => setHovered(null)}>
        <span shuku-edit-id="e-821a9615-47a1-4b4b-bbe3-1b4dd16713d8" className="aipe-platform-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
        <button shuku-edit-id="e-4ea53e36-1325-4793-8d7a-725a4ff0077b" ref={element => { circles.current[index] = element; }} type="button" className="aipe-platform-circle"
          aria-labelledby={`${id}-${ability.id}-title`} aria-describedby={`${id}-${ability.id}-description`}
          onFocus={() => setFocused(index)} onBlur={() => setFocused(null)} onKeyDown={event => navigate(event, index)}>
          <span shuku-edit-id="e-c62a59ca-3b7a-442b-a4d9-4e2c2be41fc5" className="aipe-platform-circle-halo" aria-hidden="true"/>
          <PlatformCapabilityIcon index={index}/>
        </button>
        <div shuku-edit-id="e-c4b9a582-6bbd-4a74-ac60-fe9e4dab8e2a" className="aipe-platform-copy">
          <Typography shuku-edit-id="e-28d9a95b-4322-4178-9b23-87cf0949f1bc" as="h2" id={`${id}-${ability.id}-title`} variant="h3" tone="accent">{ability.lines.map(line => <span shuku-edit-id="e-9b400380-46d2-4c34-aab4-365bd349881e" key={line}>{line}</span>)}</Typography>
          <Typography shuku-edit-id="e-4433e817-bcf0-4d4f-8d13-c0d374b1b61e" as="p" id={`${id}-${ability.id}-description`} variant="bodySmall" tone="muted" wrap="nowrap">{ability.description}</Typography>
        </div>
      </section>)}
    </div>
    <Typography shuku-edit-id="e-8163a243-8f1c-4e66-9cbb-5e9672c6cb5a" variant="h3" tone="accent" align="center" className="aipe-platform-thesis">用 AI，解决 AI 带来的问题。</Typography>
  </ContentBlock>;
}
