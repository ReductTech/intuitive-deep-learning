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

  return <ContentBlock shuku-edit-id="e-651d2b75-d4e3-413f-b488-a7a30cc17dae" ref={root} className="aipe-platform-page" headingLevel={1} title={outline.pages.find(page => page.id === '76acaf20-39a6-420c-9283-e7340cd139c7')!.title}
    bodyClassName="aipe-platform-body">
    <div shuku-edit-id="e-c2b5937a-ca04-460f-93e6-0fede349f7f3" className="aipe-platform-diagram" style={{'--card-width':`${card.width}px`,'--card-height':`${card.height}px`,'--orbit-y':`${orbit.y}px`} as CSSProperties} data-active={active === null ? 'none' : abilities[active].id}
      data-motion={visible ? 'on' : 'off'} role="group" aria-label="围绕知识探索者的五项平台能力，按01到05顺时针阅读">
      <svg shuku-edit-id="e-48dc49ff-3043-4870-98ee-e9234ff3517d" className="aipe-platform-background" viewBox="0 0 1600 760" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <defs shuku-edit-id="e-c11cf269-081c-4e83-a5b9-dadd2d77c646">
          <linearGradient shuku-edit-id="e-5befed66-8bb3-454e-8384-ad5515fc903b" id={`${id}-grid-fade`} x1="0" y1="0" x2="0" y2="1">
            <stop shuku-edit-id="e-a4841cc0-e5f3-43be-a71b-8efcbb60a596" offset="0.59" stopColor="white" stopOpacity="0"/>
            <stop shuku-edit-id="e-abc3d73d-031b-4cd0-8cac-e5ff745d527d" offset="0.8" stopColor="white" stopOpacity="0.55"/>
            <stop shuku-edit-id="e-7bd8af1b-70f7-4cb2-a23c-553afacfb38e" offset="1" stopColor="white"/>
          </linearGradient>
          <mask shuku-edit-id="e-a4242ece-dd27-4afa-bd8f-3bd3ddb707a9" id={`${id}-grid-mask`}><rect shuku-edit-id="e-82812482-57f3-46fa-8909-679f2ddd798c" width="1600" height="760" fill={`url(#${id}-grid-fade)`}/></mask>
        </defs>
        <g shuku-edit-id="e-f0b37905-453c-4db0-9438-d7204cd9172c" mask={`url(#${id}-grid-mask)`}>
          <path shuku-edit-id="e-477a2340-995c-4bfc-9f8d-7bf0db686086" d="M0 440H1600V760H0Z" fill="#f5f9ff"/>
          <g shuku-edit-id="e-7754f278-a326-4330-b25d-a877eb2fbc70" stroke="#b9d7fa" strokeWidth="0.9" opacity="0.7">
            {Array.from({length: 65}, (_, i) => {
              const x = -1760 + i * 80;
              const startX = 800 + (x - 800) * 0.08;
              const endX = Math.max(0, Math.min(1600, x));
              const endY = 410 + 350 * (endX - startX) / (x - startX);
              return <path shuku-edit-id="e-a90c88da-dab3-4398-bf8f-af731488c6b2" key={`v${i}`} d={`M${startX} 410L${endX} ${endY}`}/>;
            })}
            {Array.from({length: 19}, (_, i) => {
              const y = 420 + 340 * ((i + 1) / 19) ** 1.7;
              return <path shuku-edit-id="e-4aaa310c-c105-4214-aa66-4111e382501c" key={`h${i}`} d={`M0 ${y}H1600`}/>;
            })}
          </g>
          <g shuku-edit-id="e-ee3482cd-5461-4ba5-93a9-b3cf4be6fff2" fill="none" stroke="#8eb5e5" strokeWidth="1.3" opacity="0.75">
            {[[90,722],[226,660],[390,718],[610,719],[841,694],[1060,722],[1368,671],[1478,718],[1510,602],[86,598]].map(([x,y]) =>
              <path shuku-edit-id="e-f9ca3578-f72b-475a-8f8f-928d307e2218" key={`${x}-${y}`} d={`M${x-5} ${y}h10M${x} ${y-5}v10`}/>)}
          </g>
        </g>
      </svg>
      <svg shuku-edit-id="e-ef19f283-6aa4-40bc-8876-db2713d3b8aa" className="aipe-platform-arrows" viewBox="0 0 1538 760" aria-hidden="true">
        <defs shuku-edit-id="e-6c9b37e8-1d68-4a51-84a4-091c3e29dab5">
          <linearGradient shuku-edit-id="e-666b269e-e21e-4dd5-939d-48598ebb010d" id={`${id}-blue`}><stop shuku-edit-id="e-fb1b0af5-967b-4752-a304-296a01827807" stopColor="#d2e7ff"/><stop shuku-edit-id="e-ad61a592-93b6-4667-87d9-598356d91c6b" offset="1" stopColor="#79b2f5"/></linearGradient>
        </defs>
        {arrows.map((arrow, index) => <g shuku-edit-id="e-a1aa0381-c7f2-4b7e-b4d2-a584c573d10f" key={index} className="aipe-platform-arrow" data-active={active === index}>
          <path shuku-edit-id="e-50936506-34a8-4b01-a177-1953e7403a58" d={arrow.shape} fill={`url(#${id}-blue)`}/>
          <path shuku-edit-id="e-feaa1dbc-4770-41bc-a315-9b0e0a5f2691" className="aipe-platform-arrow-flow" d={arrow.flow} fill="none" stroke="white" strokeWidth="4" pathLength="100"/>
        </g>)}
      </svg>
      <div shuku-edit-id="e-fce301aa-4862-4cec-92d2-6d6470a686f6" className="aipe-platform-center">
        <svg shuku-edit-id="e-272ace72-638b-4055-ab92-9878d684f777" className="aipe-platform-center-orbit" viewBox="0 0 320 280" aria-hidden="true">
          <ellipse shuku-edit-id="e-8be30134-be74-465f-9eca-5786e6cedc71" cx="160" cy="133" rx="137" ry="42" transform="rotate(-12 160 133)" fill="none" stroke="#d5eaff" strokeWidth="12" opacity=".38"/>
          <ellipse shuku-edit-id="e-556eb778-31c4-4140-8b55-6bb97dcb5548" cx="160" cy="133" rx="135" ry="42" transform="rotate(12 160 133)" fill="none" stroke="#fff" strokeWidth="3" opacity=".85"/>
          <circle shuku-edit-id="e-5016480a-bc57-42f8-aae9-13f34b7c866f" cx="283" cy="111" r="7" fill="#7abaff"/>
          <circle shuku-edit-id="e-e7b9cfcf-35c0-4d9c-8b7a-9a4ba5b1425d" cx="37" cy="156" r="5" fill="#badcfc"/>
        </svg>
        <PlatformLearnerIcon/>
        <Typography shuku-edit-id="e-77175c53-8730-45b7-a47a-e143a546e287" as="h2" variant="h2" tone="accent">知识探索者</Typography>
      </div>
      {abilities.map((ability, index) => <section shuku-edit-id="e-b66e9bf4-401a-42b9-9ed0-681411aefaab" key={ability.id}
        className={`aipe-platform-ability aipe-platform-${ability.id}`} data-active={active === index}
        style={{left:positions[index].x-card.width/2,top:positions[index].y-card.height/2}}
        onPointerEnter={() => setHovered(index)} onPointerLeave={() => setHovered(null)}>
        <span shuku-edit-id="e-867565ae-1976-438e-8be9-b0d8b34253f4" className="aipe-platform-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
        <button shuku-edit-id="e-d7223ef3-59bb-4135-b799-fb32c7b4dc1f" ref={element => { circles.current[index] = element; }} type="button" className="aipe-platform-circle"
          aria-labelledby={`${id}-${ability.id}-title`} aria-describedby={`${id}-${ability.id}-description`}
          onFocus={() => setFocused(index)} onBlur={() => setFocused(null)} onKeyDown={event => navigate(event, index)}>
          <span shuku-edit-id="e-b305b4c7-46f4-4759-96d7-5974e92828bb" className="aipe-platform-circle-halo" aria-hidden="true"/>
          <PlatformCapabilityIcon index={index}/>
        </button>
        <div shuku-edit-id="e-24cdad6c-5c4b-4f06-bd40-d313b7b3d1ff" className="aipe-platform-copy">
          <Typography shuku-edit-id="e-fb57dd22-0f1b-45c4-9910-e66c9fa4a078" as="h2" id={`${id}-${ability.id}-title`} variant="h3" tone="accent">{ability.lines.map(line => <span shuku-edit-id="e-9045b646-cd5f-43ac-862e-fc64ae80b884" key={line}>{line}</span>)}</Typography>
          <Typography shuku-edit-id="e-b7ecef00-742f-40ef-af82-eb1031c94493" as="p" id={`${id}-${ability.id}-description`} variant="bodySmall" tone="muted" wrap="nowrap">{ability.description}</Typography>
        </div>
      </section>)}
    </div>
  </ContentBlock>;
}
