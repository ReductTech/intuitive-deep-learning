import moduleAssetOutline from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { useEffect, useId, useRef, useState, type RefObject } from 'react';
import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
import { KnowledgeDiagramViewport, type DiagramView } from './KnowledgeDiagramViewport';
import './KnowledgeGrowthPage.css';
import { fieldDirections, frontierRadius, growingRadius } from './knowledgeGrowthModel';

const mountainStages = moduleAssetUrl("images/knowledge-mountain-stages.webp");
const eraPortraits = moduleAssetUrl("images/knowledge-era-portraits.webp");

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
  return <div shuku-edit-id="e-cec6107e-c916-4916-8d34-c8f4cfd9ec66" className="llmpe-kg-k-mountain" data-growth={position.toFixed(3)}>
    <svg shuku-edit-id="e-14d2ebd5-0352-4ab6-9975-b7ebc7d7fab2" viewBox="0 0 900 600" role="img" aria-label="同一座知识山随时代逐层升高，抵达前沿的攀登路径逐渐延长">
      {[index, index + 1].map((stage, layer) => <foreignObject shuku-edit-id="e-39b166bd-ad6c-4de9-8573-aa3a02d22c82" key={stage} x="0" y="0" width="900" height="600" opacity={layer ? t : 1 - t}>
        <div shuku-edit-id="e-601819be-1d61-46e9-a35f-16e9b58fa347" className="llmpe-kg-k-mountain-layer" style={{ backgroundImage: `url("${mountainStages}")`, backgroundPosition: `${(stage % 2) * 100}% ${Math.floor(stage / 2) * 100}%` }} />
      </foreignObject>)}
      <path shuku-edit-id="e-9a645fe5-ee17-44aa-9fee-28db4cd4432e" d={path} fill="none" stroke="var(--ui-bg-card)" strokeWidth="8" strokeLinecap="round" opacity=".8" />
      <path shuku-edit-id="e-8e3f1e1d-3c2f-4ba1-b3cb-f35b4778fbdd" d={path} fill="none" stroke="var(--ui-accent)" strokeWidth="2" opacity=".25" />
      <path shuku-edit-id="e-c484c6f0-cf46-4eee-90d9-f1ced322d0f4" ref={pathRef} d={path} pathLength="1" strokeDasharray={`${clamp(climb)} 1`} fill="none" stroke="var(--ui-accent)" strokeWidth="3.5" strokeLinecap="round" />
      <circle shuku-edit-id="e-ca9cc74f-aae2-4c32-bfee-5708504e0aa4" ref={climberRef} cx="130" cy="532" r="7" fill="var(--ui-accent-alt)" stroke="var(--ui-bg-card)" strokeWidth="3" />
      <path shuku-edit-id="e-1a076f38-e8b5-4906-b95c-97c21faf62e7" d={`M${peakX} ${peakY + 6} v-22`} stroke="var(--ui-accent-alt)" strokeWidth="2" />
      <circle shuku-edit-id="e-470564c9-6b01-4932-9ec8-2158c1d80e40" cx={peakX} cy={peakY - 16} r="6" fill="var(--ui-accent-alt)" />
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
  return <g shuku-edit-id="e-6b3da817-98da-4468-a28a-3532ee89dc5a" className="llmpe-kg-k-diagram-labels" pointerEvents="none">
    {labels.map(label => {
      const preferred = project(label.preferred);
      const options = candidates[label.kind];
      const score = (p: OutlinePoint) => Math.hypot(p.x - preferred.x, p.y - preferred.y)
        + (labels.some(box => p.x >= box.x - 5 && p.x <= box.x + box.width + 5 && p.y >= box.y - 5 && p.y <= box.y + 80) ? 10000 : 0);
      const target = label.kind === 'known' && inFrame(preferred) ? preferred : options.reduce<OutlinePoint | null>((best, point) => !best || score(point) < score(best) ? point : best, null);
      const outside = !target;
      const end = target ?? { x: Math.max(12, Math.min(638, preferred.x)), y: Math.max(12, Math.min(538, preferred.y)) };
      const color = label.kind === 'contribution' ? 'var(--ui-accent-alt)' : label.kind === 'personal' ? 'var(--ui-accent)' : 'var(--ui-border-strong)';
      return <g shuku-edit-id="e-fb227378-49b8-47b5-9a77-91691098962f" key={label.kind} data-label-kind={label.kind} data-offscreen={outside} data-target-x={end.x} data-target-y={end.y}>
        <path shuku-edit-id="e-4bca3a0d-f3c4-4323-beab-2fea55b6f716" d={`M${label.start.x} ${label.start.y} L${end.x} ${end.y}`} fill="none" stroke={color} strokeWidth="1.5" strokeDasharray={outside ? '4 4' : undefined} />
        <circle shuku-edit-id="e-a9cdd408-e7cc-457b-b329-fb7936d3a4d9" cx={end.x} cy={end.y} r="2.5" fill={color} />
        <foreignObject shuku-edit-id="e-8932d1ce-9406-49bf-bb52-2df47d6ec13c" className={`llmpe-kg-k-diagram-label${label.kind === 'contribution' ? ' llmpe-kg-k-label-new' : ''}`} x={label.x} y={label.y} width={label.width} height="80">
          <Typography shuku-edit-id="e-751ea5fd-0635-4a89-bffa-14f6c9707ae2" variant="bodySmall" tone={label.kind === 'contribution' ? 'inherit' : label.kind === 'unknown' ? 'muted' : 'accent'}>{label.text}{outside ? ' · 视野外' : ''}</Typography>
        </foreignObject>
      </g>;
    })}
  </g>;
}

function GrowthCircle({ position, foundation, depth }: { position: number; foundation: number; depth: number }) {
  const id = useId().replaceAll(':', '');
  const index = Math.min(2, Math.floor(position));
  const t = ease(position - index);
  return <div shuku-edit-id="e-0f6af5e1-e07a-468a-99e5-267f7df143e1" className="llmpe-kg-k-knowledge" data-transition="continuous-front" data-fields={fieldDirections[Math.round(position)].length}>
    <KnowledgeDiagramViewport note={position === 3 ? {
      point: outlinePoint(growingRadius(3, fieldDirections[3][0], foundation, depth), fieldDirections[3][0]),
      text: '知识疆域不断扩展，而人的寿命、精力与认知带宽有限。仅抵达一个方向的前沿，就可能耗去数十年积累；留给原创探索的时间，还要与持续追赶分享。',
    } : undefined} renderLabels={view => <KnowledgeLabels stage={Math.round(position)} foundation={foundation} depth={depth} view={view} />}>
      {[index, index + 1].map((stage, layer) => {
        const understanding = polarOutline(angle => growingRadius(stage, angle, foundation, depth), 960, fieldDirections[stage]);
        return <g shuku-edit-id="e-4cf5bb69-267b-42c8-8dd1-4d56c384b77f" key={stage} className="llmpe-kg-k-knowledge-stage" data-stage={stage} opacity={layer ? t : 1 - t}>
        <defs shuku-edit-id="e-b5c27cdc-2a41-43ef-849c-78904b0d8418">
          <clipPath shuku-edit-id="e-565b8adb-55ee-4d96-99dc-c13c8f22c969" id={`${id}-known-${stage}`}><path shuku-edit-id="e-da2ba76d-4995-4ac0-b24f-396c285699c7" d={knowledgeShapes[stage].frontier} /></clipPath>
          <mask shuku-edit-id="e-3a97175b-9bf4-484f-b0ef-6ca1b8388f81" id={`${id}-difference-${stage}`} maskUnits="userSpaceOnUse" x="0" y="0" width="650" height="550">
            <rect shuku-edit-id="e-5f460c2f-6899-4585-8ebd-483f71682d9f" x="0" y="0" width="650" height="550" fill="white" />
            <path shuku-edit-id="e-a032f935-0b1c-4b4d-b045-8d3d3bfa7f82" d={knowledgeShapes[stage].frontier} fill="black" />
          </mask>
        </defs>
        <path shuku-edit-id="e-d9c88c5c-8057-465b-982a-e0f43974eeda" className="llmpe-kg-k-frontier-shape" d={knowledgeShapes[stage].frontier} fill="var(--ui-bg-soft)" />
        <path shuku-edit-id="e-fcd7d865-d71b-4780-b82e-c613e6e89e49" className="llmpe-kg-k-understanding-shape" d={understanding} fill="var(--ui-accent)" clipPath={`url(#${id}-known-${stage})`} />
        <path shuku-edit-id="e-cf5adcbf-2b9b-4930-af6d-937ea50f0b42" className="llmpe-kg-k-contribution-shape" d={understanding} fill="var(--ui-accent-alt)" mask={`url(#${id}-difference-${stage})`} />
        <path shuku-edit-id="e-33928a24-e20b-4d42-a8a9-7f38a9ef8877" d={knowledgeShapes[stage].frontier} fill="none" stroke="var(--ui-border-strong)" strokeWidth="1.5" />
      </g>; })}
    </KnowledgeDiagramViewport>
    <div shuku-edit-id="e-38cf4711-7129-4f0e-984e-3e46472d9248" className="llmpe-kg-k-legend" aria-label="颜色含义">
      <Typography shuku-edit-id="e-5e4f63bb-bed2-4c08-9ec7-4cddbff39059" variant="bodySmall" tone="muted"><i shuku-edit-id="e-a57af173-3b77-4433-9193-0916149f5589" className="llmpe-kg-k-total"/>已有知识</Typography>
      <Typography shuku-edit-id="e-64e0cee9-f26a-4526-a2f2-b063db9df250" variant="bodySmall" tone="muted"><i shuku-edit-id="e-95f295c0-8f33-4ad9-aa5f-7cf34a549ebd" className="llmpe-kg-k-personal"/>个人积累</Typography>
      <Typography shuku-edit-id="e-86a4bcef-5c32-40ee-8264-04e90b8f2140" variant="bodySmall" tone="muted"><i shuku-edit-id="e-ffa25f52-4b9d-40f9-9c71-099a75bfeb88" className="llmpe-kg-k-new"/>新贡献</Typography>
    </div>
  </div>;
}

export function KnowledgeGrowthPage() {
  const [{ target, replay }, setSelection] = useState({ target: 0, replay: 0 });
  const container = useRef<HTMLElement>(null);
  const position = target;
  const active = Math.min(3, Math.round(target));
  const journey = useLearningJourney(active, replay, container);
  return <article shuku-edit-id="e-34a6a27a-3fba-4072-9c1c-7ce2cf775196" ref={container} className="llmpe-kg-knowledge-page llmpe-kg-creator-typography" aria-label="知识增长与有限的个人积累" data-era={active} data-progress={position.toFixed(3)} data-learning-step={journey.step} data-learning-depth={journey.depth.toFixed(3)} data-learning-complete={journey.done}>
    <ContentBlock shuku-edit-id="e-aa1ab46c-b115-40de-a3f5-b15275cf89a8" className="llmpe-kg-k-content" headingLevel={1}
      title="我们追赶的知识前沿，正在加速远离我们"
      subtitle="抵达前沿需要长期积累，留在前沿还要持续追赶">
      <section shuku-edit-id="e-99320017-5a4a-4775-8d32-67770ad25cdf" className="llmpe-kg-k-scene" aria-label="随时代同步变化的山景与知识圆">
        <GrowthMountain position={position} climb={journey.climb} />
        <GrowthCircle position={position} foundation={journey.foundation} depth={journey.depth} />
      </section>
      <section shuku-edit-id="e-009587e1-7e1e-4f8b-b13c-edb124e21627" className="llmpe-kg-k-era-options" aria-label="选择所处时代">
        {eras.map((era, i) => <Button key={era.name} className={`llmpe-kg-k-era-option${active === i ? ' is-selected' : ''}`} aria-label={`${era.name}，播放积累过程`} aria-pressed={active === i} onClick={() => setSelection(previous => ({ target: i, replay: previous.replay + 1 }))}>
          <Typography shuku-edit-id="e-aa65646d-ee58-4c6a-adfa-c6656c256dde" as="span" variant="h3" tone="inherit" className="llmpe-kg-k-era-name">{i === 0 ? <><span shuku-edit-id="e-d92b3c78-1511-49b8-b68f-d6ab89101f72">亚里士多德</span><span shuku-edit-id="e-2de28270-03ea-464e-b2e5-66bbe8bc28c8">时期</span></> : era.name}</Typography>
          <span shuku-edit-id="e-c41448cc-3862-44d6-8fba-49c76f966cfd" className="llmpe-kg-k-era-portrait" aria-hidden="true" style={{ backgroundImage: `url("${eraPortraits}")`, backgroundPosition: `${(i % 2) * 100}% ${Math.floor(i / 2) * 100}%` }} />
        </Button>)}
      </section>
    </ContentBlock>
  </article>;
}

