import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
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

// Keep the arrowhead joined to the shaft, including at scaled canvas sizes.
const arrows = [
  { path: 'M885 82 Q970 90 1018 155', end: [1018, 155], control: [970, 90] },
  { path: 'M1142 488 Q1134 531 1092 555', end: [1092, 555], control: [1134, 531] },
  { path: 'M850 592 Q780 625 706 595', end: [706, 595], control: [780, 625] },
  { path: 'M465 558 Q442 558 425 528', end: [425, 528], control: [442, 558] },
  { path: 'M527 160 Q585 91 641 82', end: [641, 82], control: [585, 91] },
];

function arrowHead({ end: [x, y], control: [cx, cy] }: typeof arrows[number]) {
  const length = Math.hypot(x - cx, y - cy);
  const dx = (x - cx) / length, dy = (y - cy) / length;
  return `${x - dy * 20},${y + dx * 20} ${x + dx * 30},${y + dy * 30} ${x + dy * 20},${y - dx * 20}`;
}

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
    <div className="aipe-platform-diagram" data-active={active === null ? 'none' : abilities[active].id}
      data-motion={visible ? 'on' : 'off'} role="group" aria-label="围绕知识探索者的五项平台能力，按01到05顺时针阅读">
      <svg className="aipe-platform-arrows" viewBox="0 0 1538 760" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-blue`}><stop stopColor="#d2e7ff"/><stop offset="1" stopColor="#79b2f5"/></linearGradient>
        </defs>
        {arrows.map((arrow, index) => <g key={index} className="aipe-platform-arrow" data-active={active === index}>
          <path d={arrow.path} fill="none" stroke={`url(#${id}-blue)`} strokeWidth="20"/>
          <polygon points={arrowHead(arrow)} fill="#79b2f5"/>
          <path className="aipe-platform-arrow-flow" d={arrow.path} fill="none" stroke="white" strokeWidth="4" pathLength="100"/>
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
        className={`aipe-platform-ability aipe-platform-${ability.id}`} data-active={active === index}>
        <button ref={element => { circles.current[index] = element; }} type="button" className="aipe-platform-circle"
          aria-labelledby={`${id}-${ability.id}-title`} aria-describedby={`${id}-${ability.id}-description`}
          onPointerEnter={() => setHovered(index)} onPointerLeave={() => setHovered(null)}
          onFocus={() => setFocused(index)} onBlur={() => setFocused(null)} onKeyDown={event => navigate(event, index)}>
          <span className="aipe-platform-circle-halo" aria-hidden="true"/>
          <PlatformCapabilityIcon index={index}/>
          <span className="aipe-platform-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
        </button>
        <div className="aipe-platform-copy">
          <Typography as="h2" id={`${id}-${ability.id}-title`} variant="h3" tone="accent">{ability.lines.map(line => <span key={line}>{line}</span>)}</Typography>
          <span hidden id={`${id}-${ability.id}-description`}>{ability.description}</span>
        </div>
      </section>)}
    </div>
  </ContentBlock>;
}
