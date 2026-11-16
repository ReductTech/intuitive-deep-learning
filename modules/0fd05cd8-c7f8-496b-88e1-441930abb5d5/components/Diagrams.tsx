import { useId, type CSSProperties, type ReactNode } from 'react';
import { ContentBlock } from "@shuku/course-style/react/layout/ContentBlock";
import { Typography } from "@shuku/course-style/react/typography/Typography";
import { MathFormulaBlock, MathFormulaStatic } from "@shuku/course-style/react/learning/MathFormulaBlock";
import { courseAssetUrl } from '../assets';
import outline from '../outlines.json';
import './Diagrams.css';

export function Text({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return <Typography variant="bodySmall" tone={muted ? 'muted' : 'main'}>{children}</Typography>;
}
export function Formula({ latex }: { latex: string }) {
  return <MathFormulaBlock appearance="plain" ariaLabel={latex}><MathFormulaStatic latex={latex} /></MathFormulaBlock>;
}
export function Frame({ index, subtitle, children, takeaway }: { index: number; subtitle: string; children: ReactNode; takeaway: string }) {
  return <ContentBlock headingLevel={1} className="vga-page" data-lesson={outline.pages[index].id} title={outline.pages[index].title} subtitle={subtitle} bodyClassName="vga-body">
    <div shuku-edit-id="e-5f49e652-300a-4bdb-a05d-874aecaed423" className="vga-content">{children}</div>
    <div shuku-edit-id="e-d6c64999-76f7-489f-a060-b83acab49c7a" className="vga-takeaway"><Typography variant="bodySmall" tone="accent">一句话总结</Typography><Typography variant="body" tone="accent">{takeaway}</Typography></div>
  </ContentBlock>;
}
export function Arrow({ warm = false }: { warm?: boolean }) {
  return <svg shuku-edit-id="e-dfbb688b-b3d8-4840-ad6a-eb199165e0c3" className={'vga-arrow' + (warm ? ' vga-warm' : '')} viewBox="0 0 64 32" aria-hidden="true"><path shuku-edit-id="e-96077b83-c9e3-46ef-9cef-1f277934176f" d="M2 16H56M43 4L57 16 43 28" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" /></svg>;
}
export function Flow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div shuku-edit-id="e-a3bce45b-f782-43a6-b71f-c5acc39322db" className={`vga-flow ${className}`}>{children}</div>;
}
export function Block({ title, detail, warm = false, children }: { title: string; detail?: string; warm?: boolean; children?: ReactNode }) {
  return <div shuku-edit-id="e-53be3b77-54b3-442d-acf5-8f5d619eb65e" className={'vga-block' + (warm ? ' vga-block--warm' : '')}>{children}<Typography variant="h3" tone="accent">{title}</Typography>{detail && <Text muted>{detail}</Text>}</div>;
}
export function ReferenceVisual({ file, alt = '', className = '', style }: { file: string; alt?: string; className?: string; style?: CSSProperties }) {
  return <img shuku-edit-id="e-dfc11c64-70e7-4356-8fe0-4d5006086984" className={`vga-reference-visual ${className}`} src={courseAssetUrl(file)} alt={alt} style={style} draggable={false} data-reference-visual={file} />;
}
const featureFiles = ['visuals/feature-fine.png', 'visuals/feature-coarse.png', 'visuals/feature-mid.png', 'visuals/feature-up-coarse.png', 'visuals/feature-up-fine.png'];
export function Feature({ size = 120, seed = 0, warm = false, level }: { size?: number; seed?: number; warm?: boolean; level?: number }) {
  const index = level ?? ((Math.floor(seed) % 5 + 5) % 5);
  return <div shuku-edit-id="e-63a6ea5a-bbd6-4ccb-b825-a7ae4bc36a45" className={'vga-feature' + (warm ? ' is-highlighted' : '')} style={{ width: size, height: size }}><ReferenceVisual file={featureFiles[index]} alt="参考图中的透视特征图：小猫与书本的空间纹理（教学示意）" /></div>;
}
export function Latent({ small = false, phase = 0, variant = 'encoded' }: { small?: boolean; phase?: number; variant?: 'encoded' | 'noisy' | 'denoised' | 'color' }) {
  return <div shuku-edit-id="e-6b643dec-479e-486c-b939-bc1cc8f74acd" className={'vga-latent' + (small ? ' vga-latent--small' : '')} data-latent-phase={phase}><ReferenceVisual file={`visuals/latent-${variant}.png`} alt="参考图中的多通道 latent 透视堆叠（教学示意）" /></div>;
}
export function Photo({ noise = 0, label = '一个正在学习的小猫', small = false, feature = false }: { noise?: number; label?: string; small?: boolean; feature?: boolean }) {
  return <div shuku-edit-id="e-0899ae76-1a3f-4413-b20c-55b676d99179" className={'vga-photo-wrap' + (small ? ' vga-photo-wrap--small' : '')}>
    <div shuku-edit-id="e-26b9f6b9-a41e-4197-9350-444d4eb93227" className="vga-photo" role="img" aria-label={label}>
      <ReferenceVisual file={feature ? 'visuals/attention-feature.jpg' : 'visuals/cat.jpg'} />
      <ReferenceVisual file="visuals/noise-prediction.jpg" className="vga-noise-overlay" style={{ opacity: noise }} />
    </div><Text muted>{label}</Text>
  </div>;
}
export function Tokens({ warm = false, count = 8 }: { warm?: boolean; count?: number }) {
  return <div shuku-edit-id="e-b23e21f8-9dc4-4ceb-ba7d-95d3fb1346e8" className={'vga-tokens' + (warm ? ' vga-tokens--warm' : '')} aria-label={warm ? '文本 tokens 示意' : '视觉 tokens 示意'}>{Array.from({ length: count }, (_, i) => <ReferenceVisual key={i} file={warm ? 'visuals/token-modulated.jpg' : 'visuals/token-blue.jpg'} style={{ filter: `brightness(${1 + (i % 3) * .06})` }} />)}</div>;
}
export function Note({ children, warm = false }: { children: ReactNode; warm?: boolean }) {
  return <div shuku-edit-id="e-55cf4fc0-b212-4357-95ea-02988d257edf" className={'vga-note' + (warm ? ' vga-note--warm' : '')}><Text>{children}</Text></div>;
}
export function Node({ x, y, width = 180, children, warm = false, active = true }: { x: number; y: number; width?: number; children: ReactNode; warm?: boolean; active?: boolean }) {
  return <div shuku-edit-id="e-d3a7b5e9-8b4d-48be-b608-7dc9254c1767" className={'vga-node' + (warm ? ' vga-node--warm' : '') + (!active ? ' vga-dim' : '')} style={{ left: `${x / 14}%`, top: y, width: `${width / 14}%` }}>{children}</div>;
}
export function Diagram({ children, paths = [], height = 380 }: { children: ReactNode; paths?: { d: string; warm?: boolean; dashed?: boolean; dim?: boolean }[]; height?: number }) {
  const id = useId().replaceAll(':', '');
  return <div shuku-edit-id="e-1d308b15-629a-4250-93db-abcf5656d793" className="vga-diagram" style={{ height }}><svg shuku-edit-id="e-7cf27232-0574-4517-bda7-a3f8599b6ffd" viewBox={`0 0 1400 ${height}`} preserveAspectRatio="none" aria-hidden="true"><defs shuku-edit-id="e-9b0dd50a-b62d-4dbd-b9a9-5b1e8fc79ffc">{[false, true].map(warm => <marker shuku-edit-id="e-51619852-0567-4b31-9bc3-6b1058b98344" key={String(warm)} id={`${id}-${warm}`} markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto"><path shuku-edit-id="e-f4dd1838-fe3d-4c67-b870-4b50e3f4788a" d="M0 0L8 4L0 8" fill="none" stroke={warm ? 'var(--ui-accent-alt)' : 'var(--ui-accent)'} strokeWidth="1.7" /></marker>)}</defs>{paths.map((p, i) => <path shuku-edit-id="e-783f3371-db3d-4d3f-805d-1fc18e2df9d7" key={i} d={p.d} stroke={p.warm ? 'var(--ui-accent-alt)' : 'var(--ui-accent)'} strokeWidth="3" strokeDasharray={p.dashed ? '8 8' : undefined} opacity={p.dim ? .15 : 1} fill="none" markerEnd={`url(#${id}-${!!p.warm})`} />)}</svg>{children}</div>;
}
export function UNet({ condition = false, focus = 'all' }: { condition?: boolean; focus?: string }) {
  const points = [{ x: 160, y: 120, s: 112, label: '64 × 64' }, { x: 370, y: 220, s: 88, label: '32 × 32' }, { x: 630, y: 290, s: 64, label: 'Mid' }, { x: 900, y: 220, s: 88, label: '32 × 32' }, { x: 1110, y: 120, s: 112, label: '64 × 64' }];
  const paths = [
    { d: 'M40 180H150L360 260L620 330H700L890 260L1100 180H1360', dim: focus === 'skip' },
    { d: 'M220 125V85H1170V125', dashed: true, warm: focus === 'skip', dim: focus !== 'all' && focus !== 'skip' },
    { d: 'M410 220V180H940V220', dashed: true, warm: focus === 'skip', dim: focus !== 'all' && focus !== 'skip' },
    ...(condition ? [{ d: 'M620 35H220V112M620 35H1165V112M700 35V280', warm: true, dim: focus === 'text' }, { d: 'M160 440H415V320M160 440H665V365M160 440H945V320', warm: true, dashed: true, dim: focus === 'time' }] : []),
  ];
  return <Diagram height={condition ? 450 : 400} paths={paths}>
    {points.map((p, i) => <Node key={p.label + i} x={p.x} y={p.y} width={150}><Feature size={p.s} seed={i} /><Text>{p.label}</Text></Node>)}
    <Node x={10} y={240} width={170}><Text>带噪状态</Text></Node><Node x={1220} y={240} width={175}><Text>噪声预测</Text></Node>
    <Node x={380} y={105} width={600} active={focus === 'all' || focus === 'skip'}><Text muted>Skip Connections · 传回对应尺度的特征</Text></Node>
    {condition && <><Node x={495} y={0} width={350} warm active={focus !== 'text'}><Text>时间编码 → 多个块</Text></Node><Node x={0} y={400} width={400} warm active={focus !== 'time'}><Text>文本 → Cross-Attention</Text></Node></>}
  </Diagram>;
}
export function StepLabel({ n, title, children }: { n: string; title: string; children?: ReactNode }) {
  return <div shuku-edit-id="e-6e6cafe4-e411-45a3-8564-a087ad9ba710" className="vga-step-label"><Typography variant="bodySmall" tone="warning">{n}</Typography><Typography variant="h3" tone="accent">{title}</Typography>{children}</div>;
}
export type Style = CSSProperties;
