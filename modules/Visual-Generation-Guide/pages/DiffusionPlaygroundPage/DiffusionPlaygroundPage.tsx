import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { MathFormulaStatic, Typography } from '../../../shared/react';
import flower from '../../assets/diffusion-playground/flower.jpg';
import { alphaBars, betas, denoisingPrediction, ForwardChain, gaussianNoise, histogram, pixelStatistics, TOTAL_STEPS } from './diffusionExperiment';
import './DiffusionPlaygroundPage.css';

function Label({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <Typography variant="bodySmall" className={`vg-replica__label ${className}`}>{children}</Typography>;
}
function Control({ children, active = false, onClick, disabled = false, primary = false }: { children: ReactNode; active?: boolean; onClick: () => void; disabled?: boolean; primary?: boolean }) {
  return <button type="button" className={`vg-replica__button${active || primary ? ' is-accent' : ''}`} disabled={disabled} onClick={onClick}><Typography as="span" variant="bodySmall">{children}</Typography></button>;
}
function Metric({ label, value, accent = false, hot = false }: { label: ReactNode; value: string; accent?: boolean; hot?: boolean }) {
  return <div className={`vg-replica__metric${accent ? ' is-accent' : ''}${hot ? ' is-hot' : ''}`}><Label>{label}</Label><Typography variant="body" className="vg-replica__value">{value}</Typography></div>;
}
type Probe = { x: number; y: number };
const number = (value: number) => value.toFixed(4);
function Formula({ latex }: { latex: string }) { return <div className="vg-formula-lab__equation"><span className="math-formula" aria-label={latex}><MathFormulaStatic latex={latex} /></span></div>; }
function VariableLabel({ latex, children }: { latex: string; children?: ReactNode }) {
  return <span className="vg-formula-lab__variable-label"><span className="math-formula"><MathFormulaStatic latex={latex} /></span>{children && <span>{children}</span>}</span>;
}
function LiveValue({ label, value, tone = '', children }: { label: ReactNode; value: number; tone?: string; children?: ReactNode }) {
  return <div className={`vg-formula-lab__variable ${tone}`}><Typography variant="bodySmall">{label}</Typography><Typography variant="body" className="vg-formula-lab__value">{value < .0001 && value > 0 ? value.toExponential(3) : number(value)}</Typography>{children}</div>;
}
const scheduleX = (t: number) => 28 + t / TOTAL_STEPS * 280;
const scheduleY = (value: number) => 10 + (1 - value) * 100;
const alphaSchedule = [1, ...betas.map(beta => 1 - beta)];
const schedulePath = (values: number[]) => values.map((value, t) => `${t ? 'L' : 'M'}${scheduleX(t)},${scheduleY(value)}`).join(' ');
const alphaSchedulePath = schedulePath(alphaSchedule);
const alphaBarSchedulePath = schedulePath(alphaBars);
function AlphaSchedule({ t, cumulative = false, onSelect }: { t: number; cumulative?: boolean; onSelect: (t: number) => void }) {
  const color = cumulative ? '#2675c8' : '#8c66ba';
  const values = cumulative ? alphaBars : alphaSchedule;
  return <div className="vg-alpha-schedule">
    <div className="vg-alpha-schedule__plot"><svg viewBox="0 0 320 122" role="img" aria-label={`${cumulative ? '累计 ᾱₜ' : '每步 αₜ'} 曲线，当前时间步 ${t}；点击曲线选择时间步`} onPointerDown={event => {
      const rect = event.currentTarget.getBoundingClientRect();
      onSelect(Math.max(0, Math.min(TOTAL_STEPS, Math.round(((event.clientX - rect.left) / rect.width * 320 - 28) / 280 * TOTAL_STEPS))));
    }}>
      {[0, .5, 1].map(value => <line key={value} x1="28" x2="308" y1={scheduleY(value)} y2={scheduleY(value)} stroke="#e4e4e7" />)}
      <path d={cumulative ? alphaBarSchedulePath : alphaSchedulePath} fill="none" stroke={color} strokeWidth="2" />
      <line x1={scheduleX(t)} x2={scheduleX(t)} y1="6" y2="114" stroke="#263650" strokeDasharray="4 4" />
      <circle cx={scheduleX(t)} cy={scheduleY(values[t])} r="3" fill={color} />
    </svg>{[1, .5, 0].map(value => <Typography key={value} variant="bodySmall" className="vg-alpha-schedule__tick" style={{ top: `${scheduleY(value) / 122 * 100}%` }}>{value}</Typography>)}</div>
    <div className="vg-alpha-schedule__scale"><Typography variant="bodySmall">0</Typography><Typography variant="bodySmall">t = {t}</Typography><Typography variant="bodySmall">1000</Typography></div>
  </div>;
}
function Pixels({ pixels, size, label, sub, noise = false, probe, onPick }: { pixels: Float32Array; size: number; label: string; sub?: string; noise?: boolean; probe?: Probe; onPick?: (probe: Probe) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    const image = ctx.createImageData(size, size);
    for (let i = 0, p = 0; i < pixels.length; i += 3, p += 4) {
      if (noise) {
        const gray = ((pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3 + 2.5) / 5 * 255;
        image.data[p] = image.data[p + 1] = image.data[p + 2] = gray;
      } else for (let channel = 0; channel < 3; channel++) image.data[p + channel] = (pixels[i + channel] + 1) * 127.5;
      image.data[p + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
  }, [pixels, size, noise]);
  return <figure className="vg-replica__pixels"><figcaption><Label>{label}</Label>{sub && <Label className="vg-replica__sub">{sub}</Label>}</figcaption><div className={`vg-replica__canvas-wrap${onPick ? ' is-pickable' : ''}`}><canvas ref={canvas} width={size} height={size} aria-label={label} role="img" onPointerDown={onPick ? event => {
    const rect = event.currentTarget.getBoundingClientRect();
    onPick({ x: Math.max(0, Math.min(size - 1, Math.floor((event.clientX - rect.left) / rect.width * size))), y: Math.max(0, Math.min(size - 1, Math.floor((event.clientY - rect.top) / rect.height * size))) });
  } : undefined} />{probe && <span className="vg-replica__probe" aria-hidden="true" style={{ left: `${(probe.x + .5) / size * 100}%`, top: `${(probe.y + .5) / size * 100}%` }} />}</div></figure>;
}
function useImage(size: number) {
  const [source, setSource] = useState({ url: flower, name: 'flower.jpg' });
  const [pixels, setPixels] = useState<Float32Array | null>(null);
  const [error, setError] = useState('');
  const upload = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let cancelled = false;
    setPixels(null); setError('');
    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) { setError('无法读取图像'); return; }
      const side = Math.min(image.naturalWidth, image.naturalHeight);
      ctx.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, 0, 0, size, size);
      const rgba = ctx.getImageData(0, 0, size, size).data;
      const values = new Float32Array(size * size * 3);
      for (let i = 0; i < values.length; i++) values[i] = rgba[Math.floor(i / 3) * 4 + i % 3] / 255 * 2 - 1;
      setPixels(values);
    };
    image.onerror = () => { if (!cancelled) setError('无法读取图像，请重新选择'); };
    image.src = source.url;
    return () => { cancelled = true; if (source.url.startsWith('blob:')) URL.revokeObjectURL(source.url); };
  }, [source, size]);
  const picker = <input ref={upload} type="file" accept="image/*" hidden onChange={event => {
    const file = event.target.files?.[0];
    if (file) setSource({ url: URL.createObjectURL(file), name: file.name });
    event.target.value = '';
  }} />;
  return { pixels, name: source.name, error, picker, open: () => upload.current?.click() };
}

function ForwardModule({ onSeen }: { onSeen: () => void }) {
  const image = useImage(128);
  const [t, setT] = useState(0);
  const [seed, setSeed] = useState(7);
  const [playing, setPlaying] = useState(false);
  const [probe, setProbe] = useState<Probe>({ x: 64, y: 64 });
  const [channel, setChannel] = useState(0);
  const host = useRef<HTMLElement>(null);
  const chain = useMemo(() => image.pixels ? new ForwardChain(image.pixels, seed) : null, [image.pixels, seed]);
  const pixels = useMemo(() => chain?.at(t).slice() ?? null, [chain, t]);
  const stats = useMemo(() => pixels ? pixelStatistics(pixels) : { mean: 0, std: 0 }, [pixels]);
  const bins = useMemo(() => pixels ? histogram(pixels) : Array<number>(48).fill(0), [pixels]);
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const tick = () => { setT(value => Math.min(TOTAL_STEPS, value + 4)); frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);
  useEffect(() => { if (t === TOTAL_STEPS) { setPlaying(false); onSeen(); } }, [t, onSeen]);
  useEffect(() => {
    const pause = () => { if (document.hidden) setPlaying(false); };
    const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) setPlaying(false); });
    if (host.current) observer.observe(host.current);
    document.addEventListener('visibilitychange', pause);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', pause); };
  }, []);
  const a = Math.sqrt(alphaBars[t]);
  const b = Math.sqrt(1 - alphaBars[t]);
  const index = (probe.y * 128 + probe.x) * 3 + channel;
  const original = image.pixels?.[index] ?? 0;
  const current = pixels?.[index] ?? 0;
  const epsilon = b ? (current - a * original) / b : 0;
  return <><section ref={host} className="vg-replica__panel vg-replica__forward" aria-label="前向加噪交互模块">
    <header><Typography variant="h3">前向加噪过程体验</Typography></header>
    <div className="vg-replica__panel-body">
      <div className="vg-replica__metrics vg-replica__metrics--two">
        <Metric label="时间步 t" value={`${t} / 1000`} /><Metric label={<span className="math-formula vg-replica__alpha-symbol" aria-label="αₜ"><MathFormulaStatic latex={String.raw`\alpha_t`} /></span>} value={alphaSchedule[t].toFixed(5)} />
      </div>
      <Typography variant="body" className="vg-replica__pick-hint">点击图像，追踪一个像素</Typography>
      <div className="vg-replica__forward-images">
        {pixels ? <Pixels pixels={pixels} size={128} label={`第 ${t} 步图像`} sub={image.name === 'flower.jpg' ? '示例花卉' : image.name} probe={probe} onPick={setProbe} /> : <Label>{image.error || '加载中…'}</Label>}
        <div className="vg-replica__histogram">
          <div className="vg-replica__hist-head"><Label>像素值分布</Label><Label className="vg-replica__sub">均值 {stats.mean.toFixed(2)}</Label></div>
          <svg viewBox="0 0 192 100" preserveAspectRatio="none" role="img" aria-label="像素直方图与标准正态分布">
            {bins.map((value, index) => { const reference = Math.exp(-.5 * (-3 + (index + .5) / 8) ** 2); return <g key={index}><rect x={index * 4} y={100 - 96 * reference} width="3" height={96 * reference} fill="#71717a" opacity=".18" /><rect x={index * 4} y={100 - 96 * value} width="3" height={96 * value} fill="#2845d6" opacity=".85" /></g>; })}
          </svg>
          <div className="vg-replica__axis"><Label>-3</Label><Label>0</Label><Label>+3</Label></div>
          <div className="vg-replica__legend"><Label><i />当前图像像素</Label><Label><i className="is-gray" />标准正态分布</Label></div>
        </div>
      </div>
      <div className="vg-replica__playback"><input aria-label="前向时间步" type="range" min="0" max="1000" step="1" value={t} disabled={!pixels} onChange={e => { setPlaying(false); setT(Number(e.target.value)); }} /><Control primary disabled={!pixels} onClick={() => { if (t >= 1000) setT(0); setPlaying(value => !value); }}>{playing ? '暂停' : '播放'}</Control><Control onClick={() => { setPlaying(false); setT(0); }}>重置</Control></div>
      <div className="vg-replica__presets">{[0, 50, 200, 500, 800, 1000].map(value => <Control key={value} active={t === value} onClick={() => { setPlaying(false); setT(value); }}>t={value}</Control>)}</div>
      <div className="vg-replica__uploads"><Control onClick={() => setSeed(value => value + 1)}>更换噪声</Control><Control onClick={() => { setPlaying(false); image.open(); }}>上传自己的图像</Control>{image.picker}</div>
    </div>
  </section><aside className="vg-formula-lab__rail" aria-label="前向公式与实时变量">
    <Formula latex={String.raw`\color{#24945d}x_t\color{#263650}=\color{#2675c8}\sqrt{\overline{\alpha}_t}\,x_0\color{#263650}+\color{#d28a39}\sqrt{1-\overline{\alpha}_t}\,\epsilon`} />
    <div className="vg-formula-lab__schedule-row"><LiveValue label={<VariableLabel latex={String.raw`\overline{\alpha}_t=\prod_{s=1}^{t}\alpha_s`} />} value={alphaBars[t]}><AlphaSchedule t={t} cumulative onSelect={value => { setPlaying(false); setT(value); }} /></LiveValue><div className="vg-formula-lab__coefficients"><LiveValue label={<VariableLabel latex={String.raw`\sqrt{\overline{\alpha}_t}`}>图像系数</VariableLabel>} value={a} tone="is-signal" /><LiveValue label={<VariableLabel latex={String.raw`\sqrt{1-\overline{\alpha}_t}`}>噪声系数</VariableLabel>} value={b} tone="is-noise" /></div></div>
    <div className="vg-formula-lab__amplitudes"><div className="is-signal"><Typography variant="bodySmall">图像系数</Typography><progress max="1" value={a} /></div><div className="is-noise"><Typography variant="bodySmall">噪声系数</Typography><progress max="1" value={b} /></div></div>
    <div className="vg-formula-lab__pixel" aria-label="选中像素的公式代入">
      <div className="vg-formula-lab__probe-controls"><Label>({probe.x}, {probe.y})</Label>{['R', 'G', 'B'].map((name, i) => <Control key={name} active={channel === i} onClick={() => setChannel(i)}>{name}</Control>)}</div>
      <div className="vg-formula-lab__variables"><LiveValue label={<VariableLabel latex="x_0">原图像素</VariableLabel>} value={original} tone="is-signal" /><LiveValue label={<VariableLabel latex={String.raw`\epsilon`}>累计等效噪声</VariableLabel>} value={epsilon} tone="is-noise" /></div>
      <Typography variant="body" className="vg-formula-lab__substitution"><span className="is-output">xₜ</span> = <span className="is-signal">{number(a)} × {number(original)}</span> ＋ <span className="is-noise">{number(b)} × {number(epsilon)}</span> ＝ <span className="is-output">{number(current)}</span></Typography>
      <Typography variant="bodySmall" tone="muted">{t === 0 ? 't = 0：噪声系数为 0，xₜ 就是原图。' : '这里的 ε 是连续加噪到第 t 步的等效噪声。'}</Typography>
    </div>
  </aside></>;
}

function ReverseModule({ onSeen }: { onSeen: () => void }) {
  const image = useImage(96);
  const [t, setT] = useState(TOTAL_STEPS);
  const [error, setError] = useState(.1);
  const [probe, setProbe] = useState<Probe>({ x: 48, y: 48 });
  const [channel, setChannel] = useState(0);
  const noise = useMemo(() => image.pixels ? gaussianNoise(image.pixels.length, 21) : null, [image.pixels]);
  const perturbation = useMemo(() => image.pixels ? gaussianNoise(image.pixels.length, 77) : null, [image.pixels]);
  const result = useMemo(() => image.pixels && noise && perturbation ? denoisingPrediction(image.pixels, noise, perturbation, t, error) : null, [image.pixels, noise, perturbation, t, error]);
  const gain = Math.sqrt((1 - alphaBars[t]) / alphaBars[t]);
  const a = Math.sqrt(alphaBars[t]);
  const b = Math.sqrt(1 - alphaBars[t]);
  const previousA = Math.sqrt(alphaBars[t - 1]);
  const previousB = Math.sqrt(1 - alphaBars[t - 1]);
  const index = (probe.y * 96 + probe.x) * 3 + channel;
  return <><section className="vg-replica__panel vg-replica__reverse" aria-label="反向去噪交互模块">
    <header><Typography variant="h3">反向去噪过程体验</Typography></header>
    <div className="vg-replica__panel-body">
      <div className="vg-replica__metrics vg-replica__metrics--four"><Metric label="时间步 t" value={String(t)} /><Metric label={<VariableLabel latex={String.raw`\overline{\alpha}_t`} />} value={alphaBars[t] < .001 ? alphaBars[t].toExponential(2) : alphaBars[t].toFixed(4)} /><Metric label="误差放大倍数" value={`${gain.toFixed(2)} 倍`} accent hot={gain > 5} /><Metric label="重建质量" value={`${(result?.psnr ?? 0).toFixed(1)} dB`} hot={!!result && result.psnr < 15} /></div>
      <div className="vg-replica__sliders"><label><Label>反向时间步 t = {t}</Label><input aria-label="反向时间步" aria-valuetext={`t = ${t}，从 x ${t} 去噪到 x ${t - 1}`} dir="rtl" type="range" min="1" max="1000" step="1" value={t} onChange={e => { setT(Number(e.target.value)); onSeen(); }} /></label><label><Label>噪声预测误差 = {error.toFixed(2)}（0 为准确预测）</Label><input aria-label="噪声预测误差" type="range" min="0" max="0.6" step="0.01" value={error} onChange={e => { setError(Number(e.target.value)); onSeen(); }} /></label></div>
      {result && image.pixels && noise ? <>
        <Typography variant="body" className="vg-replica__pick-hint">向右拖动去噪；点击图像追踪像素</Typography>
        <div className="vg-replica__prediction-row"><Label>第 {t} 步：预测噪声并去噪一步</Label><div className="vg-replica__four-images"><Pixels pixels={result.input} size={96} label="xₜ · 当前图像" probe={probe} onPick={setProbe} /><Pixels pixels={result.predicted} size={96} label="εθ · 预测噪声" noise /><Pixels pixels={result.recovered} size={96} label="x̂₀ · 估计原图" /><Pixels pixels={result.previous} size={96} label="xₜ₋₁ · 上一步" /></div></div>
        <div className="vg-replica__target-row"><Label>第 {t} 步：三种预测目标</Label><div className="vg-replica__three-images"><Pixels pixels={noise} size={96} label="ε · 真实噪声" noise /><Pixels pixels={image.pixels} size={96} label="x₀ · 原始图像" /><Pixels pixels={result.velocity} size={96} label="v · 速度目标" /></div></div>
      </> : <Label>{image.error || '加载中…'}</Label>}
      <div className="vg-replica__uploads"><Control onClick={image.open}>上传自己的图像</Control>{image.picker}</div>
    </div>
  </section><aside className="vg-formula-lab__rail" aria-label="反向公式与实时变量">
    <Formula latex={String.raw`\begin{aligned}x_{t-1}&=\sqrt{\overline{\alpha}_{t-1}}\left(\frac{x_t-\sqrt{1-\overline{\alpha}_t}\,\epsilon_\theta(x_t,t)}{\sqrt{\overline{\alpha}_t}}\right)\\&+\sqrt{1-\overline{\alpha}_{t-1}}\,\epsilon_\theta(x_t,t)\end{aligned}`} />
    <div className="vg-formula-lab__variables"><LiveValue label={<VariableLabel latex={String.raw`\sqrt{\overline{\alpha}_t}`}>当前图像系数</VariableLabel>} value={a} tone="is-signal" /><LiveValue label={<VariableLabel latex={String.raw`\sqrt{1-\overline{\alpha}_t}`}>当前噪声系数</VariableLabel>} value={b} tone="is-noise" /><LiveValue label={<VariableLabel latex={String.raw`\sqrt{\overline{\alpha}_{t-1}}`}>上一步图像系数</VariableLabel>} value={previousA} tone="is-signal" /><LiveValue label={<VariableLabel latex={String.raw`\sqrt{1-\overline{\alpha}_{t-1}}`}>上一步噪声系数</VariableLabel>} value={previousB} tone="is-noise" /></div>
    {result && <div className="vg-formula-lab__pixel" aria-label="选中像素的反向计算">
      <div className="vg-formula-lab__probe-controls"><Label>({probe.x}, {probe.y})</Label>{['R', 'G', 'B'].map((name, i) => <Control key={name} active={channel === i} onClick={() => setChannel(i)}>{name}</Control>)}</div>
      <div className="vg-formula-lab__variables"><LiveValue label={<VariableLabel latex="x_t">当前像素</VariableLabel>} value={result.input[index]} /><LiveValue label={<VariableLabel latex={String.raw`\epsilon_\theta(x_t,t)`}>预测噪声</VariableLabel>} value={result.predicted[index]} tone="is-noise" /></div>
      <Formula latex={String.raw`\begin{aligned}x_{t-1}&=${number(previousA)}\times\left(\frac{${number(result.input[index])}-${number(b)}\times(${number(result.predicted[index])})}{${number(a)}}\right)\\&+${number(previousB)}\times(${number(result.predicted[index])})=${number(result.previous[index])}\end{aligned}`} />
    </div>}
  </aside></>;
}
export function DiffusionPlaygroundPage({ onComplete }: { onComplete?: () => void }) {
  const completed = useRef(false);
  return <div className="vg-replica vg-formula-lab is-reverse"><ReverseModule onSeen={() => { if (!completed.current) { completed.current = true; onComplete?.(); } }} /></div>;
}
export function ForwardDiffusionPlaygroundPage({ onComplete }: { onComplete?: () => void }) {
  const completed = useRef(false);
  return <div className="vg-replica vg-formula-lab is-forward"><ForwardModule onSeen={() => { if (!completed.current) { completed.current = true; onComplete?.(); } }} /></div>;
}
