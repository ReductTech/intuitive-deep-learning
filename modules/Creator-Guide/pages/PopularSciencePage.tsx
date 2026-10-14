import { useEffect, useRef, useState } from 'react';
import { Typography } from '../../shared/react';
import './PopularSciencePage.css';

// Hydrogen 1s: radial sampling has density proportional to r² exp(-2r/a₀).
// Gamma(shape=3, scale=a₀/2) plus an isotropic direction samples |ψ|² in 3D.
function samplePosition(random: () => number) {
  const r = -18 * Math.log(Math.max(1e-12, random() * random() * random()));
  const z = 2 * random() - 1;
  const phi = 2 * Math.PI * random();
  const xy = r * Math.sqrt(1 - z * z);
  return { x: xy * Math.cos(phi), y: xy * Math.sin(phi), z: r * z };
}
function ProbabilityCloud({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    let seed = 81283;
    const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
    const base = document.createElement('canvas');
    base.width = canvas.width; base.height = canvas.height;
    const baseCtx = base.getContext('2d')!;
    baseCtx.scale(2, 2);
    const mist = baseCtx.createRadialGradient(175, 162, 0, 175, 162, 156);
    mist.addColorStop(0, '#178bff35'); mist.addColorStop(.35, '#319bff20'); mist.addColorStop(.8, '#5cb5ff08'); mist.addColorStop(1, '#5cb5ff00');
    baseCtx.fillStyle = mist; baseCtx.fillRect(0, 0, 350, 330);
    for (let i = 0; i < 13000; i++) {
      const p = samplePosition(random);
      baseCtx.fillStyle = `rgba(12,115,243,${.06 + .11 * (p.z + 170) / 340})`;
      baseCtx.beginPath(); baseCtx.arc(175 + p.x, 162 + p.y, .45 + random() * .55, 0, 2 * Math.PI); baseCtx.fill();
    }
    let samples = Array.from({ length: 6 }, () => samplePosition(random));
    let frame = 0;
    let lastBatch = -1;
    let lastPaint = -1;
    const draw = (time: number) => {
      if (time - lastPaint >= 32) {
        lastPaint = time;
        const batch = Math.floor(time / 580);
        if (batch !== lastBatch) { samples = Array.from({ length: 6 }, () => samplePosition(random)); lastBatch = batch; }
        ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(base, 0, 0);
        ctx.save(); ctx.scale(2, 2);
        const strength = Math.sin(Math.PI * (time % 580) / 580);
        for (const p of samples) {
          const glow = ctx.createRadialGradient(175 + p.x, 162 + p.y, 0, 175 + p.x, 162 + p.y, 6);
          glow.addColorStop(0, `rgba(22,128,255,${.7 * strength})`); glow.addColorStop(1, 'rgba(22,128,255,0)');
          ctx.fillStyle = glow; ctx.fillRect(169 + p.x, 156 + p.y, 12, 12);
        }
        ctx.restore();
      }
      if (active) frame = requestAnimationFrame(draw);
    };
    draw(0);
    return () => cancelAnimationFrame(frame);
  }, [active]);
  return <div className="cg-cloud-visual"><canvas ref={canvasRef} width={700} height={660} aria-label="氢原子1s态位置概率分布的二维投影，亮点模拟重复位置测量的采样"/><span className="cg-atom-proton" aria-hidden="true"/></div>;
}
function BenefitIcon({ kind }: { kind: 'light' | 'book' | 'leaf' | 'warning' | 'target' }) {
  const paths = {
    light: 'M11 25c0-4-5-6-5-12a10 10 0 0 1 20 0c0 6-5 8-5 12H11ZM12 29h8M14 33h4M16 0v-3M2 6l-3-2M30 6l3-2M1 17h-4M31 17h4',
    book: 'M16 7C10 3 4 4 1 6v24c5-3 10-2 15 1V7ZM16 7c6-4 12-3 15-1v24c-5-3-10-2-15 1V7Z',
    leaf: 'M16 32V17M16 21C4 20 4 12 4 9c8 0 12 3 12 12ZM16 17C16 7 23 4 31 4c0 8-6 13-15 13ZM7 33h19',
    warning: 'M14 3a3 3 0 0 1 5 0l14 25a3 3 0 0 1-3 4H3a3 3 0 0 1-3-4L14 3ZM16 12v10M16 27h.01',
    target: 'M28 8a14 14 0 1 0 3 7M23 11a8 8 0 1 0 2 6M16 17 31 2M25 2h6v6',
  };
  return <svg viewBox="-5 -5 44 44" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={paths[kind]}/></svg>;
}
function Benefit({ kind, title, detail }: { kind: 'light' | 'book' | 'leaf'; title: string; detail: string }) {
  return <div className="cg-pop-benefit"><span><BenefitIcon kind={kind}/></span><div><Typography variant="h3" tone="inherit">{title}</Typography><Typography variant="bodySmall" tone="inherit">{detail}</Typography></div></div>;
}
export function PopularSciencePage() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let visible = false;
    const update = () => setActive(visible && document.visibilityState === 'visible');
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    observer.observe(el); document.addEventListener('visibilitychange', update);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, []);
  return <article ref={root} className="cg-pop-page" data-active={active} aria-labelledby="cg-pop-title">
    <header className="cg-pop-header"><Typography as="h1" id="cg-pop-title" variant="display" tone="inherit">科普教育的问题是什么？</Typography><Typography variant="subtitle" tone="inherit">它擅长让人快速看懂一个概念，但往往更难直接支撑进一步的专业理解与应用。</Typography></header>
    <section className="cg-pop-example"><div className="cg-pop-example-title"><Typography variant="h2" tone="inherit" className="cg-pop-example-pill">例子</Typography><Typography as="h2" variant="h1" tone="inherit">电子是怎样分布在原子里的？</Typography></div>
      <div className="cg-pop-comparison">
        <div className="cg-pop-model cg-pop-classical"><Typography as="h3" variant="h3" tone="inherit" className="cg-pop-model-title">传统电子轨道</Typography><div className="cg-orbit-visual"><svg viewBox="0 0 350 330" aria-hidden="true"><circle cx="175" cy="162" r="128" fill="none" stroke="#739bd2" strokeWidth="1.6"/></svg><div className="cg-orbit-rotor"><span className="cg-orbit-electron"/></div><span className="cg-atom-proton" aria-hidden="true"/></div><Typography variant="body" tone="inherit" className="cg-pop-model-caption">像行星绕太阳一样转</Typography><Typography variant="bodySmall" tone="inherit" className="cg-pop-model-note">直观，但不是电子的真实轨迹。</Typography><Typography variant="bodySmall" tone="inherit" className="cg-pop-physical-note">经典行星式示意 · 不按比例</Typography></div>
        <div className="cg-pop-model cg-pop-quantum"><Typography as="h3" variant="h3" tone="inherit" className="cg-pop-model-title">电子云</Typography><ProbabilityCloud active={active}/><Typography variant="body" tone="inherit" className="cg-pop-model-caption">电子云表示位置测量的概率分布，<br/>不是电子的飞行轨迹。</Typography><Typography variant="bodySmall" tone="inherit" className="cg-pop-model-note">亮点是重复测量的采样示意，并非电子瞬移。</Typography><Typography variant="bodySmall" tone="inherit" className="cg-pop-physical-note">氢原子 1s 态的投影示意 · 不按比例</Typography></div>
        <svg className="cg-pop-arrow" viewBox="0 0 90 70" aria-hidden="true"><defs><linearGradient id="cg-pop-arrow-fill"><stop stopColor="#dae8f500"/><stop offset="1" stopColor="#72b3ff"/></linearGradient></defs><path d="M0 22h55V4l35 31-35 31V48H0Z" fill="url(#cg-pop-arrow-fill)"/></svg>
      </div>
    </section>
    <aside className="cg-pop-right"><Typography as="h2" variant="h2" tone="inherit" className="cg-pop-right-title">科普教育的优势</Typography><Benefit kind="light" title="直观" detail="更快形成第一印象"/><Benefit kind="book" title="低门槛" detail="没有太多前置知识也能进入"/><Benefit kind="leaf" title="有兴趣" detail="更容易激发继续学习的动力"/><div className="cg-pop-limits"><Typography as="h3" variant="h2" tone="inherit">但问题在于</Typography><div className="cg-pop-limits-body"><span><BenefitIcon kind="warning"/></span><div><Typography variant="bodySmall" tone="inherit">• 更擅长回答“它是什么”</Typography><Typography variant="bodySmall" tone="inherit">• 较少继续展开“为什么会这样”</Typography><Typography variant="bodySmall" tone="inherit">• 更难直接支撑科研 / 工程思维</Typography></div></div></div></aside>
    <div className="cg-pop-conclusion"><BenefitIcon kind="target"/><Typography variant="body" tone="inherit">科普教育帮助学习者快速建立初步直觉；如果想继续深入，还需要更完整的知识展开。</Typography></div>
  </article>;
}
