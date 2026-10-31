import { useEffect, useId, useRef, useState, type KeyboardEvent, type CSSProperties } from 'react';
import { ContentBlock, Typography } from '../../../shared/react';
import outline from '../../outlines.json';
import { PlatformCapabilityIcon, PlatformLearnerIcon } from './PlatformCapabilityIcons';
import './PlatformPositioningPage.css';

const abilities = [
  { id: 'information', title: '科研信息供给', lines: ['科研信息供给'], description: '质量评价 · 个性推荐' },
  { id: 'content', title: '知识组织与直觉式学习', lines: ['知识组织与', '直觉式学习'], description: '知识关联 · 交互理解' },
  { id: 'practice', title: '编程与可视化实践', lines: ['编程与', '可视化实践'], description: '核心实现 · 实验验证' },
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

  return <ContentBlock ref={root} className="aipe-platform-page" headingLevel={1} title={outline.pages[3].title}
    bodyClassName="aipe-platform-body">
    <div className="aipe-platform-diagram" style={{'--card-width':`${card.width}px`,'--card-height':`${card.height}px`,'--orbit-y':`${orbit.y}px`} as CSSProperties} data-active={active === null ? 'none' : abilities[active].id}
      data-motion={visible ? 'on' : 'off'} role="group" aria-label="围绕知识探索者的五项平台能力，按01到05顺时针阅读">
      <svg className="aipe-platform-background" viewBox="0 0 1600 760" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={`${id}-grid-fade`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.59" stopColor="white" stopOpacity="0"/>
            <stop offset="0.8" stopColor="white" stopOpacity="0.55"/>
            <stop offset="1" stopColor="white"/>
          </linearGradient>
          <mask id={`${id}-grid-mask`}><rect width="1600" height="760" fill={`url(#${id}-grid-fade)`}/></mask>
        </defs>
        <g mask={`url(#${id}-grid-mask)`}>
          <path d="M0 440H1600V760H0Z" fill="#f5f9ff"/>
          <g stroke="#b9d7fa" strokeWidth="0.9" opacity="0.7">
            {Array.from({length: 65}, (_, i) => {
              const x = -1760 + i * 80;
              const startX = 800 + (x - 800) * 0.08;
              const endX = Math.max(0, Math.min(1600, x));
              const endY = 410 + 350 * (endX - startX) / (x - startX);
              return <path key={`v${i}`} d={`M${startX} 410L${endX} ${endY}`}/>;
            })}
            {Array.from({length: 19}, (_, i) => {
              const y = 420 + 340 * ((i + 1) / 19) ** 1.7;
              return <path key={`h${i}`} d={`M0 ${y}H1600`}/>;
            })}
          </g>
          <g fill="none" stroke="#8eb5e5" strokeWidth="1.3" opacity="0.75">
            {[[90,722],[226,660],[390,718],[610,719],[841,694],[1060,722],[1368,671],[1478,718],[1510,602],[86,598]].map(([x,y]) =>
              <path key={`${x}-${y}`} d={`M${x-5} ${y}h10M${x} ${y-5}v10`}/>)}
          </g>
        </g>
      </svg>
      <svg className="aipe-platform-arrows" viewBox="0 0 1538 760" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-blue`}><stop stopColor="#d2e7ff"/><stop offset="1" stopColor="#79b2f5"/></linearGradient>
        </defs>
        {arrows.map((arrow, index) => <g key={index} className="aipe-platform-arrow" data-active={active === index}>
          <path d={arrow.shape} fill={`url(#${id}-blue)`}/>
          <path className="aipe-platform-arrow-flow" d={arrow.flow} fill="none" stroke="white" strokeWidth="4" pathLength="100"/>
        </g>)}
      </svg>
      <div className="aipe-platform-center">
        <svg className="aipe-platform-center-orbit" viewBox="0 0 320 280" aria-hidden="true">
          <ellipse cx="160" cy="133" rx="137" ry="42" transform="rotate(-12 160 133)" fill="none" stroke="#d5eaff" strokeWidth="12" opacity=".38"/>
          <ellipse cx="160" cy="133" rx="135" ry="42" transform="rotate(12 160 133)" fill="none" stroke="#fff" strokeWidth="3" opacity=".85"/>
          <circle cx="283" cy="111" r="7" fill="#7abaff"/>
          <circle cx="37" cy="156" r="5" fill="#badcfc"/>
        </svg>
        <PlatformLearnerIcon/>
        <Typography as="h2" variant="h2" tone="accent">知识探索者</Typography>
      </div>
      {abilities.map((ability, index) => <section key={ability.id}
        className={`aipe-platform-ability aipe-platform-${ability.id}`} data-active={active === index}
        style={{left:positions[index].x-card.width/2,top:positions[index].y-card.height/2}}
        onPointerEnter={() => setHovered(index)} onPointerLeave={() => setHovered(null)}>
        <span className="aipe-platform-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
        <button ref={element => { circles.current[index] = element; }} type="button" className="aipe-platform-circle"
          aria-labelledby={`${id}-${ability.id}-title`} aria-describedby={`${id}-${ability.id}-description`}
          onFocus={() => setFocused(index)} onBlur={() => setFocused(null)} onKeyDown={event => navigate(event, index)}>
          <span className="aipe-platform-circle-halo" aria-hidden="true"/>
          <PlatformCapabilityIcon index={index}/>
        </button>
        <div className="aipe-platform-copy">
          <Typography as="h2" id={`${id}-${ability.id}-title`} variant="h3" tone="accent">{ability.lines.map(line => <span key={line}>{line}</span>)}</Typography>
          <span hidden id={`${id}-${ability.id}-description`}>{ability.description}</span>
        </div>
      </section>)}
    </div>
  </ContentBlock>;
}
