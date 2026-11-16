import moduleAssetOutline from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Button, ContentBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { alphaBars, betas, denoisingPrediction, ForwardChain, gaussianNoise, histogram, pixelStatistics, TOTAL_STEPS } from './diffusionExperiment';
import './DiffusionPlaygroundPage.css';

const flower = moduleAssetUrl('images/diffusion-playground/flower.jpg');

function Label({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <Typography shuku-edit-id="e-742f4c89-ec8c-4362-84a1-719024a8fabd" variant="bodySmall" className={`vg-replica__label ${className}`}>{children}</Typography>;
}
function Control({ children, active = false, onClick, disabled = false, primary = false }: { children: ReactNode; active?: boolean; onClick: () => void; disabled?: boolean; primary?: boolean }) {
  return <Button active={active} variant={primary ? "primary" : "default"} disabled={disabled} onClick={onClick}>{children}</Button>;
}
function Metric({ label, value, accent = false, hot = false }: { label: ReactNode; value: string; accent?: boolean; hot?: boolean }) {
  return <div shuku-edit-id="e-031f7a9e-14a8-4f28-931b-ae8117dd8ced" className={`vg-replica__metric${accent ? ' is-accent' : ''}${hot ? ' is-hot' : ''}`}><Label>{label}</Label><Typography shuku-edit-id="e-3a57b8ce-716e-4c64-91f7-a5c8597237f7" variant="body" className="vg-replica__value">{value}</Typography></div>;
}
type Probe = { x: number; y: number };
const number = (value: number) => value.toFixed(4);
function Formula({ latex }: { latex: string }) { return <div shuku-edit-id="e-2cadff5f-8dd2-475e-b05b-c9521b80410d" className="vg-formula-lab__equation"><span shuku-edit-id="e-ed4053b6-b907-4304-8a02-f32c6aac80f1" className="math-formula" aria-label={latex}><MathFormulaStatic latex={latex} /></span></div>; }
function VariableLabel({ latex, children }: { latex: string; children?: ReactNode }) {
  return <span shuku-edit-id="e-0fc157e9-655a-47c0-8420-1c9a8171fd15" className="vg-formula-lab__variable-label"><span shuku-edit-id="e-f0c85406-5d3e-42f8-a1e5-0f29c1c83976" className="math-formula"><MathFormulaStatic latex={latex} /></span>{children && <span shuku-edit-id="e-e6184587-2d64-4683-9f89-88e7e844983c">{children}</span>}</span>;
}
function LiveValue({ label, value, tone = '', children }: { label: ReactNode; value: number; tone?: string; children?: ReactNode }) {
  return <div shuku-edit-id="e-51947739-9f98-4212-8777-35eb6b1d0545" className={`vg-formula-lab__variable ${tone}`}><Typography shuku-edit-id="e-e570d453-980f-4f01-b71a-656a4f234341" variant="bodySmall">{label}</Typography><Typography shuku-edit-id="e-fa3127d0-fc34-4186-b0be-e5558ebc93b8" variant="body" className="vg-formula-lab__value">{value < .0001 && value > 0 ? value.toExponential(3) : number(value)}</Typography>{children}</div>;
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
  return <div shuku-edit-id="e-70243ab4-e1d0-4e44-978c-50df0e0607f3" className="vg-alpha-schedule">
    <div shuku-edit-id="e-260780da-023b-4819-84b4-3d3c17b1fa8a" className="vg-alpha-schedule__plot"><svg shuku-edit-id="e-431f3cd9-dc6d-4c97-a432-061203018aa9" viewBox="0 0 320 122" role="img" aria-label={`${cumulative ? '累计 ᾱₜ' : '每步 αₜ'} 曲线，当前时间步 ${t}；点击曲线选择时间步`} onPointerDown={event => {
      const rect = event.currentTarget.getBoundingClientRect();
      onSelect(Math.max(0, Math.min(TOTAL_STEPS, Math.round(((event.clientX - rect.left) / rect.width * 320 - 28) / 280 * TOTAL_STEPS))));
    }}>
      {[0, .5, 1].map(value => <line shuku-edit-id="e-73929a03-0977-4138-a264-52e0cfdf6cae" key={value} x1="28" x2="308" y1={scheduleY(value)} y2={scheduleY(value)} stroke="#e4e4e7" />)}
      <path shuku-edit-id="e-c853eb06-3148-4086-8473-6295bb335922" d={cumulative ? alphaBarSchedulePath : alphaSchedulePath} fill="none" stroke={color} strokeWidth="2" />
      <line shuku-edit-id="e-0f46fc5b-1390-450f-af43-58d5009d99cb" x1={scheduleX(t)} x2={scheduleX(t)} y1="6" y2="114" stroke="#263650" strokeDasharray="4 4" />
      <circle shuku-edit-id="e-44835e52-46cc-4a33-af69-2cc6bd11655e" cx={scheduleX(t)} cy={scheduleY(values[t])} r="3" fill={color} />
    </svg>{[1, .5, 0].map(value => <Typography shuku-edit-id="e-2de8354a-11aa-4a6c-b696-9a3d80335eb9" key={value} variant="bodySmall" className="vg-alpha-schedule__tick" style={{ top: `${scheduleY(value) / 122 * 100}%` }}>{value}</Typography>)}</div>
    <div shuku-edit-id="e-16db9436-0e6c-4238-acf0-51c4abb65227" className="vg-alpha-schedule__scale"><Typography shuku-edit-id="e-66dd298c-51f2-4a76-818d-ca9773fe0018" variant="bodySmall">0</Typography><Typography shuku-edit-id="e-ae8ff847-fb3e-48af-acce-c271957984a1" variant="bodySmall">t = {t}</Typography><Typography shuku-edit-id="e-1370c9df-8845-4c68-9357-fa0894e542c2" variant="bodySmall">1000</Typography></div>
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
  return <figure shuku-edit-id="e-a47104f1-208f-4669-bea0-f56e03f5e74f" className="vg-replica__pixels"><figcaption shuku-edit-id="e-a34dfa56-143a-443d-8ab2-d8123a0dc452"><Label>{label}</Label>{sub && <Label className="vg-replica__sub">{sub}</Label>}</figcaption><div shuku-edit-id="e-b831f3a4-099c-431e-a81d-446809606c27" className={`vg-replica__canvas-wrap${onPick ? ' is-pickable' : ''}`}><canvas shuku-edit-id="e-d0c80dc2-7703-4fd7-829c-ca1a8e25af12" ref={canvas} width={size} height={size} aria-label={label} role="img" onPointerDown={onPick ? event => {
    const rect = event.currentTarget.getBoundingClientRect();
    onPick({ x: Math.max(0, Math.min(size - 1, Math.floor((event.clientX - rect.left) / rect.width * size))), y: Math.max(0, Math.min(size - 1, Math.floor((event.clientY - rect.top) / rect.height * size))) });
  } : undefined} />{probe && <span shuku-edit-id="e-3d47889c-c7b9-4875-8dd2-6c57a9d5f752" className="vg-replica__probe" aria-hidden="true" style={{ left: `${(probe.x + .5) / size * 100}%`, top: `${(probe.y + .5) / size * 100}%` }} />}</div></figure>;
}
function useImage(size: number) {
  const [source, setSource] = useState({ url: flower, name: 'flower.jpg' });
  const [pixels, setPixels] = useState<Float32Array | null>(null);
  const [error, setError] = useState('');
  const upload = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let cancelled = false;
    setPixels(null); setError('');
    const image = new Image(); image.crossOrigin = 'anonymous';
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
  const picker = <input shuku-edit-id="e-940acbbd-7540-4801-9c6b-cdf96c053127" ref={upload} type="file" accept="image/*" hidden onChange={event => {
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
  return <><section shuku-edit-id="e-47f1eedc-e54e-42d2-991d-e36e9278574d" ref={host} className="vg-replica__panel vg-replica__forward" aria-label="前向加噪交互模块">
    <div shuku-edit-id="e-fcbfa152-469e-42a0-b369-1c11fc74b04d" className="vg-replica__panel-body">
      <div shuku-edit-id="e-a116d56c-67e5-43cc-94f7-828bf0669069" className="vg-replica__metrics vg-replica__metrics--two">
        <Metric label="时间步 t" value={`${t} / 1000`} /><Metric label={<span shuku-edit-id="e-d17f4665-9456-4fd4-9f96-f7eb2f92395d" className="math-formula vg-replica__alpha-symbol" aria-label="αₜ"><MathFormulaStatic latex={String.raw`\alpha_t`} /></span>} value={alphaSchedule[t].toFixed(5)} />
      </div>
      <div shuku-edit-id="e-3823e09e-5e2e-48cb-ac42-6383bfddb5a4" className="vg-replica__forward-images">
        {pixels ? <Pixels pixels={pixels} size={128} label={`第 ${t} 步图像`} sub={image.name === 'flower.jpg' ? '示例花卉' : image.name} probe={probe} onPick={setProbe} /> : <Label>{image.error || '加载中…'}</Label>}
        <div shuku-edit-id="e-2916bf5b-f027-4861-a414-77fef02a3200" className="vg-replica__histogram">
          <div shuku-edit-id="e-3e506a00-d849-4707-b4ae-1499a1aaba68" className="vg-replica__hist-head"><Label>像素值分布</Label><Label className="vg-replica__sub">均值 {stats.mean.toFixed(2)}</Label></div>
          <svg shuku-edit-id="e-2e81cb88-e9e0-4af9-b764-2262f34720e3" viewBox="0 0 192 100" preserveAspectRatio="none" role="img" aria-label="像素直方图与标准正态分布">
            {bins.map((value, index) => { const reference = Math.exp(-.5 * (-3 + (index + .5) / 8) ** 2); return <g shuku-edit-id="e-b8a4a2a2-ba1c-4231-b159-13ce874083cc" key={index}><rect shuku-edit-id="e-e15c162b-272e-43cb-a308-264c3046b9c4" x={index * 4} y={100 - 96 * reference} width="3" height={96 * reference} fill="#71717a" opacity=".18" /><rect shuku-edit-id="e-3fca68f1-4a6b-46d9-b034-dfadd9764e5b" x={index * 4} y={100 - 96 * value} width="3" height={96 * value} fill="#2845d6" opacity=".85" /></g>; })}
          </svg>
          <div shuku-edit-id="e-fcf548e3-7879-483f-b63c-1e9c53196711" className="vg-replica__axis"><Label>-3</Label><Label>0</Label><Label>+3</Label></div>
          <div shuku-edit-id="e-fae8cdf0-e452-45d4-83ea-c1cdd437c914" className="vg-replica__legend"><Label><i shuku-edit-id="e-27cf6fa7-5d8b-4495-8409-25424d6d6d42" />当前图像像素</Label><Label><i shuku-edit-id="e-885f343e-ad72-471f-b8fe-faa1d0e8a68f" className="is-gray" />标准正态分布</Label></div>
        </div>
      </div>
      <div shuku-edit-id="e-9c9246f9-f59f-4502-920f-b99e4487296d" className="vg-replica__playback"><input shuku-edit-id="e-576d5fa8-42be-4b2c-b7ff-60065d3f493a" aria-label="前向时间步" type="range" min="0" max="1000" step="1" value={t} disabled={!pixels} onChange={e => { setPlaying(false); setT(Number(e.target.value)); }} /><Control primary disabled={!pixels} onClick={() => { if (t >= 1000) setT(0); setPlaying(value => !value); }}>{playing ? '暂停' : '播放'}</Control><Control onClick={() => { setPlaying(false); setT(0); }}>重置</Control></div>
      <div shuku-edit-id="e-b098c28e-735a-4a27-a94d-3cf1708e1ac7" className="vg-replica__presets">{[0, 50, 200, 500, 800, 1000].map(value => <Control key={value} active={t === value} onClick={() => { setPlaying(false); setT(value); }}>t={value}</Control>)}</div>
      <div shuku-edit-id="e-b22e3d11-8e38-4bef-a1b8-b59dc10e5e44" className="vg-replica__uploads"><Control onClick={() => setSeed(value => value + 1)}>更换噪声</Control><Control onClick={() => { setPlaying(false); image.open(); }}>上传自己的图像</Control>{image.picker}</div>
    </div>
  </section><aside shuku-edit-id="e-89cbf86e-dc40-4ca0-bbbe-2f323b2eb88b" className="vg-formula-lab__rail" aria-label="前向公式与实时变量">
    <Formula latex={String.raw`\color{#24945d}x_t\color{#263650}=\color{#2675c8}\sqrt{\overline{\alpha}_t}\,x_0\color{#263650}+\color{#d28a39}\sqrt{1-\overline{\alpha}_t}\,\epsilon`} />
    <div shuku-edit-id="e-53c0121e-d39c-4b73-9bbc-4af39c2aa0c8" className="vg-formula-lab__schedule-row"><LiveValue label={<VariableLabel latex={String.raw`\overline{\alpha}_t=\prod_{s=1}^{t}\alpha_s`} />} value={alphaBars[t]}><AlphaSchedule t={t} cumulative onSelect={value => { setPlaying(false); setT(value); }} /></LiveValue><div shuku-edit-id="e-03659024-b657-44fe-a081-93d86d24c96c" className="vg-formula-lab__coefficients"><LiveValue label={<VariableLabel latex={String.raw`\sqrt{\overline{\alpha}_t}`}>图像系数</VariableLabel>} value={a} tone="is-signal" /><LiveValue label={<VariableLabel latex={String.raw`\sqrt{1-\overline{\alpha}_t}`}>噪声系数</VariableLabel>} value={b} tone="is-noise" /></div></div>
    <div shuku-edit-id="e-affef09b-e193-4491-93ff-4fc023301a43" className="vg-formula-lab__amplitudes"><div shuku-edit-id="e-83e3851d-a077-4048-ad2c-738c0be47bd4" className="is-signal"><Typography shuku-edit-id="e-da6a3711-56b8-4089-b051-fa58b21b8be1" variant="bodySmall">图像系数</Typography><progress shuku-edit-id="e-423e2139-c5ca-4178-a6cd-97f1f1e2134d" max="1" value={a} /></div><div shuku-edit-id="e-e4ad7f26-7991-4318-861b-9b0660e85ee5" className="is-noise"><Typography shuku-edit-id="e-9027aa73-6a7f-4cce-9b30-770073f1b3bf" variant="bodySmall">噪声系数</Typography><progress shuku-edit-id="e-cf6b1008-5375-4d43-bbb3-3ce11d9e53aa" max="1" value={b} /></div></div>
    <div shuku-edit-id="e-89c9ed85-2e83-4a50-ba33-7b703d9bcdae" className="vg-formula-lab__pixel" aria-label="选中像素的公式代入">
      <div shuku-edit-id="e-962e86f3-e8e1-4f6b-afa9-b0b260f48b84" className="vg-formula-lab__probe-controls"><Label>({probe.x}, {probe.y})</Label>{['R', 'G', 'B'].map((name, i) => <Control key={name} active={channel === i} onClick={() => setChannel(i)}>{name}</Control>)}</div>
      <div shuku-edit-id="e-99113e53-1b49-42e9-9e3d-23ef5a26b5c4" className="vg-formula-lab__variables"><LiveValue label={<VariableLabel latex="x_0">原图像素</VariableLabel>} value={original} tone="is-signal" /><LiveValue label={<VariableLabel latex={String.raw`\epsilon`}>累计等效噪声</VariableLabel>} value={epsilon} tone="is-noise" /></div>
      <Typography shuku-edit-id="e-1f4f2ad3-5f48-44a0-b8b9-66cb42c9c0d0" variant="body" className="vg-formula-lab__substitution"><span shuku-edit-id="e-ae2e7de0-cc16-4249-baaa-b12c3e26950c" className="is-output">xₜ</span> = <span shuku-edit-id="e-8ca05265-8177-4eff-bbd3-dad06858513b" className="is-signal">{number(a)} × {number(original)}</span> ＋ <span shuku-edit-id="e-c3664d9f-eb7f-4c90-8578-4128b730390d" className="is-noise">{number(b)} × {number(epsilon)}</span> ＝ <span shuku-edit-id="e-2bedcdf1-2c05-4076-b180-3a6135067316" className="is-output">{number(current)}</span></Typography>
      <Typography shuku-edit-id="e-e1839e89-3598-452e-9ac8-5ee6bfba678c" variant="bodySmall" tone="muted">{t === 0 ? 't = 0：噪声系数为 0，xₜ 就是原图。' : '这里的 ε 是连续加噪到第 t 步的等效噪声。'}</Typography>
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
  return <><section shuku-edit-id="e-ce4e0dc5-4744-4c14-98fc-7a0baf9ec503" className="vg-replica__panel vg-replica__reverse" aria-label="反向去噪交互模块">
    <div shuku-edit-id="e-f1dfdd4f-f205-4d48-bea2-31840626b158" className="vg-replica__panel-body">
      <div shuku-edit-id="e-c41a347f-2e94-413f-8f5f-8cb952fa0a63" className="vg-replica__metrics vg-replica__metrics--four"><Metric label="时间步 t" value={String(t)} /><Metric label={<VariableLabel latex={String.raw`\overline{\alpha}_t`} />} value={alphaBars[t] < .001 ? alphaBars[t].toExponential(2) : alphaBars[t].toFixed(4)} /><Metric label="误差放大倍数" value={`${gain.toFixed(2)} 倍`} accent hot={gain > 5} /><Metric label="重建质量" value={`${(result?.psnr ?? 0).toFixed(1)} dB`} hot={!!result && result.psnr < 15} /></div>
      <div shuku-edit-id="e-b7fbe46e-0dd0-4acc-9da6-51443d165c0a" className="vg-replica__sliders"><label shuku-edit-id="e-659fe518-5092-41b9-bbe9-ef2f5f4fa15d"><Label>反向时间步 t = {t}</Label><input shuku-edit-id="e-dc846c12-0ba1-4aac-b017-5cb2a6be98e8" aria-label="反向时间步" aria-valuetext={`t = ${t}，从 x ${t} 去噪到 x ${t - 1}`} dir="rtl" type="range" min="1" max="1000" step="1" value={t} onChange={e => { setT(Number(e.target.value)); onSeen(); }} /></label><label shuku-edit-id="e-e8ca0829-6812-4645-a9a5-821e3100b198"><Label>噪声预测误差 = {error.toFixed(2)}（0 为准确预测）</Label><input shuku-edit-id="e-d6eed437-e230-4118-8763-530872612c3d" aria-label="噪声预测误差" type="range" min="0" max="0.6" step="0.01" value={error} onChange={e => { setError(Number(e.target.value)); onSeen(); }} /></label></div>
      {result && image.pixels && noise ? <>
        <div shuku-edit-id="e-67ca64e0-9143-41d0-a25f-837576d625b2" className="vg-replica__prediction-row"><div shuku-edit-id="e-63e97a39-1436-41d1-a287-f6e365b1fc89" className="vg-replica__four-images"><Pixels pixels={result.input} size={96} label="xₜ · 当前图像" probe={probe} onPick={setProbe} /><Pixels pixels={result.predicted} size={96} label="εθ · 预测噪声" noise /><Pixels pixels={result.recovered} size={96} label="x̂₀ · 估计原图" /><Pixels pixels={result.previous} size={96} label="xₜ₋₁ · 上一步" /></div></div>
        <div shuku-edit-id="e-54cd56fb-e1e9-43ad-95ca-fbf00cd4413a" className="vg-replica__target-row"><div shuku-edit-id="e-75cfeae5-ae8e-463b-84c8-4563caaba22b" className="vg-replica__three-images"><Pixels pixels={noise} size={96} label="ε · 真实噪声" noise /><Pixels pixels={image.pixels} size={96} label="x₀ · 原始图像" /><Pixels pixels={result.velocity} size={96} label="v · 速度目标" /></div></div>
      </> : <Label>{image.error || '加载中…'}</Label>}
      <div shuku-edit-id="e-d9668b97-5883-4c28-8ff0-2e76f8988f77" className="vg-replica__uploads"><Control onClick={image.open}>上传自己的图像</Control>{image.picker}</div>
    </div>
  </section><aside shuku-edit-id="e-4adf29d1-62f5-480d-9071-a66a3ee4990c" className="vg-formula-lab__rail" aria-label="反向公式与实时变量">
    <Formula latex={String.raw`\begin{aligned}x_{t-1}&=\sqrt{\overline{\alpha}_{t-1}}\left(\frac{x_t-\sqrt{1-\overline{\alpha}_t}\,\epsilon_\theta(x_t,t)}{\sqrt{\overline{\alpha}_t}}\right)\\&+\sqrt{1-\overline{\alpha}_{t-1}}\,\epsilon_\theta(x_t,t)\end{aligned}`} />
    <div shuku-edit-id="e-84ba0173-898e-4c86-aa93-81c1a55288ed" className="vg-formula-lab__variables"><LiveValue label={<VariableLabel latex={String.raw`\sqrt{\overline{\alpha}_t}`}>当前图像系数</VariableLabel>} value={a} tone="is-signal" /><LiveValue label={<VariableLabel latex={String.raw`\sqrt{1-\overline{\alpha}_t}`}>当前噪声系数</VariableLabel>} value={b} tone="is-noise" /><LiveValue label={<VariableLabel latex={String.raw`\sqrt{\overline{\alpha}_{t-1}}`}>上一步图像系数</VariableLabel>} value={previousA} tone="is-signal" /><LiveValue label={<VariableLabel latex={String.raw`\sqrt{1-\overline{\alpha}_{t-1}}`}>上一步噪声系数</VariableLabel>} value={previousB} tone="is-noise" /></div>
    {result && <div shuku-edit-id="e-fcfc1047-1909-4ead-b03b-3499869db0ad" className="vg-formula-lab__pixel" aria-label="选中像素的反向计算">
      <div shuku-edit-id="e-6220b28b-b930-4368-a4ce-09978249eb06" className="vg-formula-lab__probe-controls"><Label>({probe.x}, {probe.y})</Label>{['R', 'G', 'B'].map((name, i) => <Control key={name} active={channel === i} onClick={() => setChannel(i)}>{name}</Control>)}</div>
      <div shuku-edit-id="e-af53cd6e-6a0b-429e-803c-f780c1ff8ca6" className="vg-formula-lab__variables"><LiveValue label={<VariableLabel latex="x_t">当前像素</VariableLabel>} value={result.input[index]} /><LiveValue label={<VariableLabel latex={String.raw`\epsilon_\theta(x_t,t)`}>预测噪声</VariableLabel>} value={result.predicted[index]} tone="is-noise" /></div>
      <Formula latex={String.raw`\begin{aligned}x_{t-1}&=${number(previousA)}\times\left(\frac{${number(result.input[index])}-${number(b)}\times(${number(result.predicted[index])})}{${number(a)}}\right)\\&+${number(previousB)}\times(${number(result.predicted[index])})=${number(result.previous[index])}\end{aligned}`} />
    </div>}
  </aside></>;
}
export function DiffusionPlaygroundPage({ onComplete }: { onComplete?: () => void }) {
  const completed = useRef(false);
  return <ContentBlock shuku-edit-id="e-05cd8804-de62-4741-bfac-8688394ae5a3" headingLevel={1} title="反向去噪实验：公式里的变量怎样变化？" subtitle="拖动时间步与预测误差，观察图像变化；点击图像追踪一个像素。" className="vg-shared-page vg-replica vg-formula-lab is-reverse" bodyClassName="vg-formula-lab__body"><ReverseModule onSeen={() => { if (!completed.current) { completed.current = true; onComplete?.(); } }} /></ContentBlock>;
}
export function ForwardDiffusionPlaygroundPage({ onComplete }: { onComplete?: () => void }) {
  const completed = useRef(false);
  return <ContentBlock shuku-edit-id="e-3a59f83d-c476-484e-b9ca-e6b988581b9e" headingLevel={1} title="前向加噪实验：公式里的变量怎样变化？" subtitle="调整时间步，观察图像与噪声的比例；点击图像追踪一个像素。" className="vg-shared-page vg-replica vg-formula-lab is-forward" bodyClassName="vg-formula-lab__body"><ForwardModule onSeen={() => { if (!completed.current) { completed.current = true; onComplete?.(); } }} /></ContentBlock>;
}
