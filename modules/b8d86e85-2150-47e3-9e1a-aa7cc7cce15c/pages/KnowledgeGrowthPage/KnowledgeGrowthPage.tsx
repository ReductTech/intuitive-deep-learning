import moduleAssetOutline from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { useEffect, useId, useRef, useState, type RefObject } from 'react';
import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
import { KnowledgeDiagramViewport, type DiagramView } from './KnowledgeDiagramViewport';
import './KnowledgeGrowthPage.css';
import { fieldDirections, frontierRadius, growingRadius } from './knowledgeGrowthModel';

const mountainStages = moduleAssetUrl('images/knowledge-mountain-stages.png');
const eraPortraits = moduleAssetUrl('images/knowledge-era-portraits.jpg');

const eras = [
  { name: '亚里士多德时期', message: '有限积累，覆盖较宽的知识范围。', peak: [540, 320] },
  { name: '牛顿时期', message: '知识体系扩大，学习逐渐集中于少数方向。', peak: [550, 210] },
  { name: '今天', message: '基础更加扎实，专业深入收紧到很细的方向。', peak: [525, 120] },
  { name: '未来情景', message: '知识前沿继续扩展，专业方向进一步收紧。', peak: [535, 28] },
] as const;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => t * t * (3 - 2 * t);

const GROWTH_DURATION = 2800;

function journeyFrame(era: number, elapsed: number) {
  const progress = clamp(elapsed / GROWTH_DURATION);
  return { step: progress < .58 ? 0 : progress < .9 ? 1 : 2, foundation: progress, depth: progress, climb: progress * (era === 3 ? .8 : 1), done: progress === 1 };
}

function useLearningJourney(era: number, replay: number, container: RefObject<HTMLElement | null>) {
  const [clock, setClock] = useState({ replay, elapsed: 0 });
  const visible = useRef(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { visible.current = entry.isIntersecting; }, { threshold: .2 });
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, [container]);
  useEffect(() => {
    let frame = 0, elapsed = 0, last: number | undefined;
    const duration = GROWTH_DURATION;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    function tick(time: number) {
      if (reduced.matches) elapsed = duration;
      else if (visible.current && !document.hidden && last !== undefined) elapsed = Math.min(duration, elapsed + time - last);
      last = time;
      setClock({ replay, elapsed });
      if (elapsed < duration) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [era, replay]);
  return journeyFrame(era, clock.replay === replay ? clock.elapsed : 0);
}

function GrowthMountain({ position, climb }: { position: number; climb: number }) {
  const pathRef = useRef<SVGPathElement>(null);
  const climberRef = useRef<SVGCircleElement>(null);
  const index = Math.min(2, Math.floor(position));
  const t = ease(position - index);
  const peakX = mix(eras[index].peak[0], eras[index + 1].peak[0], t);
  const peakY = mix(eras[index].peak[1], eras[index + 1].peak[1], t);
  const path = `M130 532 C180 525 185 493 267 484 S340 ${peakY + 160} 408 ${peakY + 137} S${peakX - 80} ${peakY + 58} ${peakX} ${peakY + 7}`;
  useEffect(() => {
    const route = pathRef.current;
    if (route) {
      const point = route.getPointAtLength(route.getTotalLength() * clamp(climb));
      climberRef.current?.setAttribute('cx', String(point.x));
      climberRef.current?.setAttribute('cy', String(point.y));
    }
  }, [path, climb]);
  return <div shuku-edit-id="e-953027b2-6d0c-44ae-a903-b385cc2b0d4b" className="llmpe-kg-k-mountain" data-growth={position.toFixed(3)}>
    <svg shuku-edit-id="e-0fd8e223-de45-4f78-8418-016e0de7c178" viewBox="0 0 900 600" role="img" aria-label="同一座知识山随时代逐层升高，抵达前沿的攀登路径逐渐延长">
      {[index, index + 1].map((stage, layer) => <foreignObject shuku-edit-id="e-290ffafd-efac-487a-be6f-b5c1aa39b4c9" key={stage} x="0" y="0" width="900" height="600" opacity={layer ? t : 1 - t}>
        <div shuku-edit-id="e-ac3c00e1-1b27-4104-94b9-faeb9a55f0d6" className="llmpe-kg-k-mountain-layer" style={{ backgroundImage: `url("${mountainStages}")`, backgroundPosition: `${(stage % 2) * 100}% ${Math.floor(stage / 2) * 100}%` }} />
      </foreignObject>)}
      <path shuku-edit-id="e-0b667cf6-5825-4b38-bd71-d40770bc8429" d={path} fill="none" stroke="var(--ui-bg-card)" strokeWidth="8" strokeLinecap="round" opacity=".8" />
      <path shuku-edit-id="e-26a37e80-2eec-4bd7-a29a-e725a9c0eda5" d={path} fill="none" stroke="var(--ui-accent)" strokeWidth="2" opacity=".25" />
      <path shuku-edit-id="e-9feb264d-9d2b-450e-b638-3047390b2da6" ref={pathRef} d={path} pathLength="1" strokeDasharray={`${clamp(climb)} 1`} fill="none" stroke="var(--ui-accent)" strokeWidth="3.5" strokeLinecap="round" />
      <circle shuku-edit-id="e-b4188c36-4964-41d0-82aa-5663313ace81" ref={climberRef} cx="130" cy="532" r="7" fill="var(--ui-accent-alt)" stroke="var(--ui-bg-card)" strokeWidth="3" />
      <path shuku-edit-id="e-45ede9e7-47d8-427b-b915-da20c0ef098d" d={`M${peakX} ${peakY + 6} v-22`} stroke="var(--ui-accent-alt)" strokeWidth="2" />
      <circle shuku-edit-id="e-6bc8d30d-7032-4956-9925-11c668a21b17" cx={peakX} cy={peakY - 16} r="6" fill="var(--ui-accent-alt)" />
    </svg>
  </div>;
}

type OutlinePoint = { x: number; y: number };
const TAU = Math.PI * 2;
function outlinePoint(radius: number, angle: number): OutlinePoint {
  return { x: 325 + radius * Math.cos(angle), y: 277 + radius * Math.sin(angle) };
}

// Closed Catmull-Rom curves keep the frontier soft, without circular sectors or corners.
function smoothOutline(points: OutlinePoint[]) {
  const n = points.length;
  let path = `M${points[0].x} ${points[0].y}`;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n], p1 = points[i], p2 = points[(i + 1) % n], p3 = points[(i + 2) % n];
    path += ` C${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6} ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6} ${p2.x} ${p2.y}`;
  }
  return path + ' Z';
}

function polarOutline(radius: (angle: number) => number, samples = 320, tips: readonly number[] = []) {
  const angles = Array.from({ length: samples }, (_, i) => -Math.PI / 2 + TAU * i / samples);
  // Include exact tips so a very narrow new contribution survives sampling.
  angles.push(...tips.map(angle => ((angle + Math.PI / 2) % TAU + TAU) % TAU - Math.PI / 2));
  angles.sort((a, b) => a - b);
  const points = angles.map(angle => outlinePoint(radius(angle), angle));
  // Spline handles can overshoot and introduce a bulge before a branch tip.
  return tips.length ? points.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ') + ' Z' : smoothOutline(points);
}

const knowledgeShapes = fieldDirections.map((_, stage) => ({
  frontier: polarOutline(angle => frontierRadius(stage, angle)),
}));

function KnowledgeLabels({ stage, foundation, depth, view }: {
  stage: number; foundation: number; depth: number; view: DiagramView;
}) {
  type Kind = 'known' | 'personal' | 'unknown' | 'contribution';
  const candidates: Record<Kind, OutlinePoint[]> = { known: [], personal: [], unknown: [], contribution: [] };
  const project = (p: OutlinePoint) => ({ x: p.x * view.scale + view.x, y: p.y * view.scale + view.y });
  const inFrame = (p: OutlinePoint) => p.x >= 12 && p.x <= 638 && p.y >= 12 && p.y <= 538;
  function add(kind: Kind, point: OutlinePoint) {
    const screen = project(point);
    if (inFrame(screen)) candidates[kind].push(screen);
  }
  // Contour samples retain tiny contributions that a coarse viewport grid could miss.
  for (let i = 0; i < 720; i++) {
    const angle = TAU * i / 720;
    const known = frontierRadius(stage, angle);
    const personal = growingRadius(stage, angle, foundation, depth);
    add('known', outlinePoint(known, angle));
    add('personal', outlinePoint(Math.min(known, personal) * .7, angle));
    if (known > personal + .2) add('unknown', outlinePoint((known + personal) / 2, angle));
    if (personal > known + .05) add('contribution', outlinePoint((known + personal) / 2, angle));
  }
  for (const angle of fieldDirections[stage]) {
    const known = frontierRadius(stage, angle);
    const personal = growingRadius(stage, angle, foundation, depth);
    if (personal > known + .05) add('contribution', outlinePoint((known + personal) / 2, angle));
  }
  // At high magnification, find semantic regions inside the current visible crop.
  for (let y = 16; y <= 534; y += 18) for (let x = 16; x <= 634; x += 18) {
    const worldX = (x - view.x) / view.scale - 325;
    const worldY = (y - view.y) / view.scale - 277;
    const angle = Math.atan2(worldY, worldX), radius = Math.hypot(worldX, worldY);
    const known = frontierRadius(stage, angle), personal = growingRadius(stage, angle, foundation, depth);
    const point = { x, y };
    if (radius < known - .2) {
      if (radius < personal - .2) candidates.personal.push(point);
      else if (radius > personal + .2) candidates.unknown.push(point);
    } else if (radius > known + .2 && radius < personal - .2) candidates.contribution.push(point);
  }
  const labels: { kind: Kind; text: string; x: number; y: number; width: number; start: OutlinePoint; preferred: OutlinePoint }[] = [
    { kind: 'known', text: '人类知识边界', x: 18, y: 42, width: 220, start: { x: 238, y: 70 }, preferred: outlinePoint(frontierRadius(stage, -Math.PI / 2), -Math.PI / 2) },
    { kind: 'personal', text: '个人学到的知识', x: 14, y: 255, width: 200, start: { x: 214, y: 280 }, preferred: { x: 325, y: 277 } },
    { kind: 'unknown', text: '还没学到的知识', x: 420, y: 435, width: 218, start: { x: 420, y: 458 }, preferred: outlinePoint(frontierRadius(stage, stage === 0 ? 2.3 : 1.28) * .9, stage === 0 ? 2.3 : 1.28) },
  ];
  if (stage !== 3 && growingRadius(stage, fieldDirections[stage][0], foundation, depth) > frontierRadius(stage, fieldDirections[stage][0]) + .05) {
    const angle = fieldDirections[stage][0];
    labels.push({ kind: 'contribution', text: '新发现', x: 432, y: 145, width: 206, start: { x: 432, y: 172 },
      preferred: outlinePoint((frontierRadius(stage, angle) + growingRadius(stage, angle, foundation, depth)) / 2, angle) });
  }
  return <g shuku-edit-id="e-0d22220f-c47f-4d5e-810f-abbfcf01d387" className="llmpe-kg-k-diagram-labels" pointerEvents="none">
    {labels.map(label => {
      const preferred = project(label.preferred);
      const options = candidates[label.kind];
      const score = (p: OutlinePoint) => Math.hypot(p.x - preferred.x, p.y - preferred.y)
        + (labels.some(box => p.x >= box.x - 5 && p.x <= box.x + box.width + 5 && p.y >= box.y - 5 && p.y <= box.y + 80) ? 10000 : 0);
      const target = label.kind === 'known' && inFrame(preferred) ? preferred : options.reduce<OutlinePoint | null>((best, point) => !best || score(point) < score(best) ? point : best, null);
      const outside = !target;
      const end = target ?? { x: Math.max(12, Math.min(638, preferred.x)), y: Math.max(12, Math.min(538, preferred.y)) };
      const color = label.kind === 'contribution' ? 'var(--ui-accent-alt)' : label.kind === 'personal' ? 'var(--ui-accent)' : 'var(--ui-border-strong)';
      return <g shuku-edit-id="e-1f92e505-9886-4e04-9ca6-ed5f074e8f5a" key={label.kind} data-label-kind={label.kind} data-offscreen={outside} data-target-x={end.x} data-target-y={end.y}>
        <path shuku-edit-id="e-0f0cd56c-f67a-47c8-bc3f-e5927fef33d3" d={`M${label.start.x} ${label.start.y} L${end.x} ${end.y}`} fill="none" stroke={color} strokeWidth="1.5" strokeDasharray={outside ? '4 4' : undefined} />
        <circle shuku-edit-id="e-de5a5468-d0e1-4743-835f-42064e9fadea" cx={end.x} cy={end.y} r="2.5" fill={color} />
        <foreignObject shuku-edit-id="e-5d703cf8-3121-44a5-9823-e7f2798c9b52" className={`llmpe-kg-k-diagram-label${label.kind === 'contribution' ? ' llmpe-kg-k-label-new' : ''}`} x={label.x} y={label.y} width={label.width} height="80">
          <Typography shuku-edit-id="e-18cc1ef3-db4a-4296-8f01-31d4032c87ab" variant="bodySmall" tone={label.kind === 'contribution' ? 'inherit' : label.kind === 'unknown' ? 'muted' : 'accent'}>{label.text}{outside ? ' · 视野外' : ''}</Typography>
        </foreignObject>
      </g>;
    })}
  </g>;
}

function GrowthCircle({ position, foundation, depth }: { position: number; foundation: number; depth: number }) {
  const id = useId().replaceAll(':', '');
  const index = Math.min(2, Math.floor(position));
  const t = ease(position - index);
  return <div shuku-edit-id="e-ee399ea3-bd99-405d-a1cf-15d02ca2eb3c" className="llmpe-kg-k-knowledge" data-transition="continuous-front" data-fields={fieldDirections[Math.round(position)].length}>
    <div shuku-edit-id="e-559bb007-d79b-4b29-8d76-bbd580dcec94" className="llmpe-kg-k-ring-label"><Typography shuku-edit-id="e-cb318549-8eb5-4149-bde2-2059985e6914" variant="bodySmall" tone="accent" align="center">假设一个人一生能投入的<br shuku-edit-id="e-46a3e230-ab44-4594-a8f7-ae3e6e830a62" />学习时间大致有限。</Typography></div>
    <KnowledgeDiagramViewport note={position === 3 ? {
      point: outlinePoint(growingRadius(3, fieldDirections[3][0], foundation, depth), fieldDirections[3][0]),
      text: '穷尽一生，仍未抵达前沿？',
    } : undefined} renderLabels={view => <KnowledgeLabels stage={Math.round(position)} foundation={foundation} depth={depth} view={view} />}>
      {[index, index + 1].map((stage, layer) => {
        const understanding = polarOutline(angle => growingRadius(stage, angle, foundation, depth), 960, fieldDirections[stage]);
        return <g shuku-edit-id="e-d750551f-3535-4931-b85f-19f6dc25e9ca" key={stage} className="llmpe-kg-k-knowledge-stage" data-stage={stage} opacity={layer ? t : 1 - t}>
        <defs shuku-edit-id="e-6d0b033b-c889-4aec-b241-3ae7c0dd27c6">
          <clipPath shuku-edit-id="e-db61bca0-cc6b-49fb-8e14-235548431d85" id={`${id}-known-${stage}`}><path shuku-edit-id="e-891629f8-d939-4b13-9fc2-3863d3b07a50" d={knowledgeShapes[stage].frontier} /></clipPath>
          <mask shuku-edit-id="e-7e7d83d2-dbdc-4a8f-adb9-117941c71456" id={`${id}-difference-${stage}`} maskUnits="userSpaceOnUse" x="0" y="0" width="650" height="550">
            <rect shuku-edit-id="e-b139ab42-c966-4a2b-9f8a-19661e20356e" x="0" y="0" width="650" height="550" fill="white" />
            <path shuku-edit-id="e-21101d2a-5a31-4f3d-8ef4-c5b874fbf3b7" d={knowledgeShapes[stage].frontier} fill="black" />
          </mask>
        </defs>
        <path shuku-edit-id="e-be63ec13-c981-4988-9eb6-349f06e2d02c" className="llmpe-kg-k-frontier-shape" d={knowledgeShapes[stage].frontier} fill="var(--ui-bg-soft)" />
        <path shuku-edit-id="e-d61437a5-e1c4-458e-9f4c-29e3f1a27553" className="llmpe-kg-k-understanding-shape" d={understanding} fill="var(--ui-accent)" clipPath={`url(#${id}-known-${stage})`} />
        <path shuku-edit-id="e-add29bbf-0b50-448e-846d-d22995702525" className="llmpe-kg-k-contribution-shape" d={understanding} fill="var(--ui-accent-alt)" mask={`url(#${id}-difference-${stage})`} />
        <path shuku-edit-id="e-7091dbb2-93bd-4637-9e93-66d059a3dea5" d={knowledgeShapes[stage].frontier} fill="none" stroke="var(--ui-border-strong)" strokeWidth="1.5" />
      </g>; })}
    </KnowledgeDiagramViewport>
    <div shuku-edit-id="e-e81d63f0-28d2-4af0-88f4-23994f5d2e08" className="llmpe-kg-k-legend" aria-label="颜色含义">
      <Typography shuku-edit-id="e-f8e67ac4-4d33-4539-ae4d-98ce56b7fe22" variant="bodySmall" tone="muted"><i shuku-edit-id="e-4cc8ceae-56ae-4c31-bed5-949650c8ebd0" className="llmpe-kg-k-total"/>已有知识</Typography>
      <Typography shuku-edit-id="e-f2b4fc32-10df-4f3c-b2ec-5a9a53d20b58" variant="bodySmall" tone="muted"><i shuku-edit-id="e-8765a61a-b017-4bf8-a269-7a5cb6f8de80" className="llmpe-kg-k-personal"/>个人积累</Typography>
      <Typography shuku-edit-id="e-a584d71a-278a-424f-bf12-c611cb60fc90" variant="bodySmall" tone="muted"><i shuku-edit-id="e-002edb37-cbc5-4c63-9cd4-397fda4cb80a" className="llmpe-kg-k-new"/>新贡献</Typography>
    </div>
  </div>;
}

export function KnowledgeGrowthPage() {
  const [{ target, replay }, setSelection] = useState({ target: 0, replay: 0 });
  const container = useRef<HTMLElement>(null);
  const position = target;
  const active = Math.min(3, Math.round(target));
  const journey = useLearningJourney(active, replay, container);
  return <article shuku-edit-id="e-cfb36095-0cfd-4f11-adba-49cba7721987" ref={container} className="llmpe-kg-knowledge-page llmpe-kg-creator-typography" aria-label="知识增长与有限的个人积累" data-era={active} data-progress={position.toFixed(3)} data-learning-step={journey.step} data-learning-depth={journey.depth.toFixed(3)} data-learning-complete={journey.done}>
    <ContentBlock shuku-edit-id="e-aeec5172-983d-423c-a7f6-708ef5c5ce0a" className="llmpe-kg-k-content" headingLevel={1}
      title="我们会不会穷尽一生，也抵达不了知识前沿？">
      <section shuku-edit-id="e-e9e83f21-d0d7-4f87-9374-b7c3c9907087" className="llmpe-kg-k-scene" aria-label="随时代同步变化的山景与知识圆">
        <GrowthMountain position={position} climb={journey.climb} />
        <GrowthCircle position={position} foundation={journey.foundation} depth={journey.depth} />
      </section>
      <section shuku-edit-id="e-b2b828aa-e394-4bc3-873e-a3b6a8d17530" className="llmpe-kg-k-era-options" aria-label="选择所处时代">
        {eras.map((era, i) => <Button key={era.name} className={`llmpe-kg-k-era-option${active === i ? ' is-selected' : ''}`} aria-label={`${era.name}，播放积累过程`} aria-pressed={active === i} onClick={() => setSelection(previous => ({ target: i, replay: previous.replay + 1 }))}>
          <Typography shuku-edit-id="e-25b13562-760e-4134-bf24-ba2a0c19c4e1" as="span" variant="h3" tone="inherit" className="llmpe-kg-k-era-name">{i === 0 ? <><span shuku-edit-id="e-141fffe7-34a4-4662-aaa4-be9692aea672">亚里士多德</span><span shuku-edit-id="e-1a469bef-680f-4f0e-b26b-7992b11e7470">时期</span></> : era.name}</Typography>
          <span shuku-edit-id="e-b5adb7ab-e574-43d4-8090-28a502fcc7d5" className="llmpe-kg-k-era-portrait" aria-hidden="true" style={{ backgroundImage: `url("${eraPortraits}")`, backgroundPosition: `${(i % 2) * 100}% ${Math.floor(i / 2) * 100}%` }} />
        </Button>)}
      </section>
    </ContentBlock>
  </article>;
}

