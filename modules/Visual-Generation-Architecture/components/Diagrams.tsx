import { useId, type CSSProperties, type ReactNode } from 'react';
import { ContentBlock } from '../../shared/react/layout/ContentBlock';
import { Typography } from '../../shared/react/typography/Typography';
import { MathFormulaBlock, MathFormulaStatic } from '../../shared/react/learning/MathFormulaBlock';
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
    <div className="vga-content">{children}</div>
    <div className="vga-takeaway"><Typography variant="bodySmall" tone="accent">一句话总结</Typography><Typography variant="body" tone="accent">{takeaway}</Typography></div>
  </ContentBlock>;
}
export function Arrow({ warm = false }: { warm?: boolean }) {
  return <svg className={'vga-arrow' + (warm ? ' vga-warm' : '')} viewBox="0 0 64 32" aria-hidden="true"><path d="M2 16H56M43 4L57 16 43 28" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" /></svg>;
}
export function Flow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`vga-flow ${className}`}>{children}</div>;
}
export function Block({ title, detail, warm = false, children }: { title: string; detail?: string; warm?: boolean; children?: ReactNode }) {
  return <div className={'vga-block' + (warm ? ' vga-block--warm' : '')}>{children}<Typography variant="h3" tone="accent">{title}</Typography>{detail && <Text muted>{detail}</Text>}</div>;
}
export function ReferenceVisual({ name, alt = '', className = '', style }: { name: string; alt?: string; className?: string; style?: CSSProperties }) {
  return <img className={`vga-reference-visual ${className}`} src={courseAssetUrl(`visuals/${name}.png`)} alt={alt} style={style} draggable={false} data-reference-visual={name} />;
}
const featureNames = ['feature-fine', 'feature-coarse', 'feature-mid', 'feature-up-coarse', 'feature-up-fine'];
export function Feature({ size = 120, seed = 0, warm = false, level }: { size?: number; seed?: number; warm?: boolean; level?: number }) {
  const index = level ?? ((Math.floor(seed) % 5 + 5) % 5);
  return <div className={'vga-feature' + (warm ? ' is-highlighted' : '')} style={{ width: size, height: size }}><ReferenceVisual name={featureNames[index]} alt="参考图中的透视特征图：小猫与书本的空间纹理（教学示意）" /></div>;
}
export function Latent({ small = false, phase = 0, variant = 'encoded' }: { small?: boolean; phase?: number; variant?: 'encoded' | 'noisy' | 'denoised' | 'color' }) {
  return <div className={'vga-latent' + (small ? ' vga-latent--small' : '')} data-latent-phase={phase}><ReferenceVisual name={`latent-${variant}`} alt="参考图中的多通道 latent 透视堆叠（教学示意）" /></div>;
}
export function Photo({ noise = 0, label = '一个正在学习的小猫', small = false, feature = false }: { noise?: number; label?: string; small?: boolean; feature?: boolean }) {
  return <div className={'vga-photo-wrap' + (small ? ' vga-photo-wrap--small' : '')}>
    <div className="vga-photo" role="img" aria-label={label}>
      <ReferenceVisual name={feature ? 'attention-feature' : 'cat'} />
      <ReferenceVisual name="noise-prediction" className="vga-noise-overlay" style={{ opacity: noise }} />
    </div><Text muted>{label}</Text>
  </div>;
}
export function Tokens({ warm = false, count = 8 }: { warm?: boolean; count?: number }) {
  return <div className={'vga-tokens' + (warm ? ' vga-tokens--warm' : '')} aria-label={warm ? '文本 tokens 示意' : '视觉 tokens 示意'}>{Array.from({ length: count }, (_, i) => <ReferenceVisual key={i} name={warm ? 'token-modulated' : 'token-blue'} style={{ filter: `brightness(${1 + (i % 3) * .06})` }} />)}</div>;
}
export function Note({ children, warm = false }: { children: ReactNode; warm?: boolean }) {
  return <div className={'vga-note' + (warm ? ' vga-note--warm' : '')}><Text>{children}</Text></div>;
}
export function Node({ x, y, width = 180, children, warm = false, active = true }: { x: number; y: number; width?: number; children: ReactNode; warm?: boolean; active?: boolean }) {
  return <div className={'vga-node' + (warm ? ' vga-node--warm' : '') + (!active ? ' vga-dim' : '')} style={{ left: `${x / 14}%`, top: y, width: `${width / 14}%` }}>{children}</div>;
}
export function Diagram({ children, paths = [], height = 380 }: { children: ReactNode; paths?: { d: string; warm?: boolean; dashed?: boolean; dim?: boolean }[]; height?: number }) {
  const id = useId().replaceAll(':', '');
  return <div className="vga-diagram" style={{ height }}><svg viewBox={`0 0 1400 ${height}`} preserveAspectRatio="none" aria-hidden="true"><defs>{[false, true].map(warm => <marker key={String(warm)} id={`${id}-${warm}`} markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8" fill="none" stroke={warm ? 'var(--ui-accent-alt)' : 'var(--ui-accent)'} strokeWidth="1.7" /></marker>)}</defs>{paths.map((p, i) => <path key={i} d={p.d} stroke={p.warm ? 'var(--ui-accent-alt)' : 'var(--ui-accent)'} strokeWidth="3" strokeDasharray={p.dashed ? '8 8' : undefined} opacity={p.dim ? .15 : 1} fill="none" markerEnd={`url(#${id}-${!!p.warm})`} />)}</svg>{children}</div>;
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
  return <div className="vga-step-label"><Typography variant="bodySmall" tone="warning">{n}</Typography><Typography variant="h3" tone="accent">{title}</Typography>{children}</div>;
}
export type Style = CSSProperties;
