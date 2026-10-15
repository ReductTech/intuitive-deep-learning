import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button, ContentBlock, Typography } from '../../shared/react';
import biological from '../assets/multi-format/biological-structure.png';
import combination from '../assets/multi-format/decision-bridge.png';
import weights from '../assets/multi-format/weighted-contribution.png';
import activation from '../assets/multi-format/activation-catalog.png';
import './MultiFormatPage.css';

const lessons = [
  { title: '从生物到人工神经元', image: biological, steps: [
    { title: '接收输入', text: '树突接收信号，对应人工神经元的多个输入。', box: [2, 18, 23, 68] },
    { title: '整合信号', text: '突触对应权重；细胞体的整合启发了加权求和与阈值判断。', box: [26, 18, 48, 68] },
    { title: '产生输出', text: '神经信号经轴突传递，对应模型输出。这是结构启发，并非完整的生物模拟。', box: [75, 18, 23, 68] },
  ] },
  { title: '组合带来复杂性', image: combination, steps: [
    { title: '三个输入', text: '食物、危险与饥饿各有两种状态，先从具体情境观察输入。', box: [3, 17, 23, 66] },
    { title: '形成判断', text: '神经元把三个输入的组合转成是否立即觅食的判断。', box: [33, 34, 31, 40] },
    { title: '组合增长', text: '三个二值输入已有八种组合；输入增加，可能的组合数迅速增长。', box: [66, 12, 32, 76] },
  ] },
  { title: '权重与矩阵表达', image: weights, steps: [
    { title: '逐项加权', text: '分别把每个输入与对应的权重相乘，再把贡献相加。', box: [2, 15, 96, 23] },
    { title: '整理对象', text: '将权重放在一行、输入放在一列，对应关系保持不变。', box: [2, 43, 96, 25] },
    { title: '合并表达', text: '矩阵乘法是同一组加权求和计算的紧凑表达。', box: [2, 73, 96, 16] },
  ] },
  { title: '认识激活函数', image: activation, steps: [
    { title: 'Leaky ReLU', text: '负区间保留一条较小斜率的线，正区间保持线性。', box: [2, 16, 30, 72] },
    { title: 'GELU', text: '曲线在零附近平滑变化，观察它怎样改变负输入的贡献。', box: [35, 16, 30, 72] },
    { title: 'Sigmoid', text: '输出压缩到零与一之间，曲线两端逐渐饱和。', box: [68, 16, 30, 72] },
  ] },
];
function FormatStyleIcon({ kind }: { kind: 'code' | 'screen' | 'person' | 'play' | 'devices' | 'book' | 'light' | 'video' }) {
  const paths = {
    code: 'm12 9-8 7 8 7m8-14 8 7-8 7m-2-19-4 24',
    screen: 'M3 5h26v18H3ZM16 23v7M10 30l6-7 6 7M12 13l4-3 4 3-4 3Z',
    person: 'M16 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12ZM4 29v-4a12 12 0 0 1 24 0v4Z',
    play: 'M16 2a14 14 0 1 0 0 28 14 14 0 0 0 0-28ZM12 9l11 7-11 7Z',
    devices: 'M2 4h23v17H2ZM8 27h12M14 21v6M23 14h8v16h-8Z',
    book: 'M16 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM2 19q7-5 14 0 7-5 14 0v11q-7-5-14 0-7-5-14 0ZM16 19v11',
    light: 'M11 24c0-5-6-5-6-12a11 11 0 0 1 22 0c0 7-6 7-6 12ZM12 28h8M14 31h4M16 1V-2M0 12h-3M32 12h3',
    video: 'M2 6h20v20H2ZM22 12l9-5v18l-9-5',
  };
  return <svg viewBox="-4 -4 40 40" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={paths[kind]} /></svg>;
}
function MiniWindow({ children }: { children: ReactNode }) {
  return <div className="cg-format-window"><div className="cg-format-mini">{children}</div></div>;
}
function ReadingPreview({ visible }: { visible: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const position = useRef(0);
  const images = useRef<HTMLImageElement[]>([]);
  const [ready, setReady] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const maxPosition = 4 * 474 - 24 - 480;
  function draw() {
    const el = canvas.current, ctx = el?.getContext('2d');
    if (!ctx || !el) return;
    ctx.fillStyle = '#eef3fb'; ctx.fillRect(0, 0, 800, 480);
    images.current.forEach((image, index) => { if (image.complete && image.naturalWidth) ctx.drawImage(image, 0, index * 474 - position.current, 800, 450); });
    el.dataset.position = String(Math.round(position.current));
    setCurrent(Math.min(3, Math.floor((position.current + 170) / 474)));
  }
  useEffect(() => {
    let cancelled = false;
    Promise.all(lessons.map(lesson => new Promise<HTMLImageElement>(resolve => { const img = new Image(); img.onload = () => resolve(img); img.onerror = () => resolve(img); img.src = lesson.image; }))).then(loaded => { if (!cancelled) { images.current = loaded; setReady(true); } });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => { if (ready) draw(); }, [ready]);
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault(); event.stopPropagation();
      const delta = event.deltaY * (event.deltaMode === 1 ? 24 : event.deltaMode === 2 ? 480 : 1);
      position.current = Math.max(0, Math.min(maxPosition, position.current + delta)); draw();
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  }, [ready]);
  useEffect(() => {
    if (!ready || !hovered || !visible || paused || reduced) return;
    let frame = 0, previous = 0, endWait = 0;
    const tick = (time: number) => {
      if (previous) {
        const elapsed = Math.min(time - previous, 80);
        if (position.current >= maxPosition) { endWait += elapsed; if (endWait > 1600) { position.current = 0; endWait = 0; } }
        else position.current += elapsed * .065;
        position.current = Math.min(maxPosition, position.current); draw();
      }
      previous = time; frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [ready, hovered, visible, paused, reduced]);
  return <MiniWindow>
    <div className="cg-format-mini-top"><Typography variant="bodySmall" tone="accent">自主阅读 · 神经元课程</Typography><Typography variant="bodySmall" tone="muted">{current + 1} / 4</Typography></div>
    <canvas ref={canvas} width={800} height={480} className="cg-format-reader" aria-label="连续阅读预览，可用滚轮或上下方向键浏览" tabIndex={0} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocus={() => setHovered(true)} onBlur={() => setHovered(false)} onKeyDown={event => {
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End', ' '].includes(event.key)) return;
      event.preventDefault(); event.stopPropagation();
      if (event.key === ' ') setPaused(value => !value);
      else { position.current = event.key === 'Home' ? 0 : event.key === 'End' ? maxPosition : Math.max(0, Math.min(maxPosition, position.current + (event.key === 'ArrowDown' ? 200 : -200))); draw(); }
    }} />
    <div className="cg-format-reader-bottom"><Typography variant="bodySmall" tone="muted">{hovered && !paused && !reduced ? '正在自动浏览 · 滚轮调整进度' : '移入自动浏览 · 滚轮上下阅读'}</Typography><Button active={paused} onClick={() => setPaused(value => !value)} aria-label={paused ? '继续自动浏览' : '暂停自动浏览'}><Typography as="span" variant="bodySmall" tone="inherit">{paused ? '继续' : '暂停'}</Typography></Button></div>
  </MiniWindow>;
}
export function MultiFormatPage() {
  const root = useRef<HTMLElement>(null);
  const [selected, setSelected] = useState(0), [step, setStep] = useState(0);
  const [explaining, setExplaining] = useState(false), [playing, setPlaying] = useState(false), [visible, setVisible] = useState(false);
  const lesson = lessons[selected], explanation = lesson.steps[step];
  const speechSupported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const [paused, setPaused] = useState(false);
  const [speechError, setSpeechError] = useState('');
  function stopNarration() {
    if (utterance.current) { utterance.current = null; window.speechSynthesis.cancel(); }
    setPlaying(false); setPaused(false);
  }
  function narrate(lessonIndex: number, stepIndex: number, continuous: boolean) {
    stopNarration();
    setSelected(lessonIndex); setStep(stepIndex); setExplaining(true); setSpeechError('');
    if (!speechSupported) return;
    const item = lessons[lessonIndex].steps[stepIndex];
    const next = new SpeechSynthesisUtterance(item.text);
    next.lang = 'zh-CN'; next.rate = 1;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(item => /^zh[-_]CN/i.test(item.lang)) ?? voices.find(item => /^zh/i.test(item.lang));
    if (voice) next.voice = voice;
    utterance.current = next;
    next.onend = () => {
      if (utterance.current !== next) return;
      utterance.current = null;
      if (continuous && stepIndex < lessons[lessonIndex].steps.length - 1) narrate(lessonIndex, stepIndex + 1, true);
      else setPlaying(false);
    };
    next.onerror = () => {
      if (utterance.current !== next) return;
      utterance.current = null; setPlaying(false); setPaused(false);
      setSpeechError('语音播放失败，请再次点击播放。');
    };
    window.speechSynthesis.cancel();
    setPlaying(true);
    window.speechSynthesis.resume();
    window.speechSynthesis.speak(next);
  }
  function toggleNarration() {
    if (playing) { window.speechSynthesis.pause(); setPlaying(false); setPaused(true); }
    else if (paused && utterance.current) { window.speechSynthesis.resume(); setPlaying(true); setPaused(false); }
    else narrate(selected, step, true);
  }
  useEffect(() => {
    if (!visible) stopNarration();
    return () => { if (utterance.current) { utterance.current = null; window.speechSynthesis.cancel(); } };
  }, [visible]);
  useEffect(() => {
    const el = root.current; if (!el) return;
    let intersecting = false;
    const update = () => setVisible(intersecting && document.visibilityState === 'visible');
    const observer = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; update(); });
    observer.observe(el); document.addEventListener('visibilitychange', update);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, []);
  function select(index: number) { stopNarration(); setSelected(index); setStep(0); setExplaining(false); setSpeechError(''); }
  return <ContentBlock ref={root} className="cg-format-page cg-creator-typography" headingLevel={1} title="一种全新的课件形态" bodyClassName="cg-format-body" onKeyDown={event => { if (event.key === ' ' && event.target instanceof Element && event.target.closest('button')) event.stopPropagation(); }}>
    <div className="cg-format-source-row"><svg className="cg-format-source-links" viewBox="0 0 1536 112" aria-hidden="true"><path d="M768 52C500 35 305 39 248 112M768 52v60M768 52c268-17 463-13 520 60" /></svg><div className="cg-format-source"><span className="cg-format-source-icon"><FormatStyleIcon kind="code" /></span><div><Typography variant="h3" tone="accent">同一份内容</Typography><Typography variant="bodySmall" tone="muted">HTML-based 交互课件</Typography></div></div><Typography variant="bodySmall" tone="warning">一次设计，多种应用场景</Typography></div>
    <div className="cg-format-columns">
      <section className="cg-format-card cg-format-teaching"><header><span className="cg-format-mode-icon"><FormatStyleIcon kind="screen" /></span><div><Typography as="h2" variant="h3" tone="accent">教学展示模式</Typography><Typography variant="bodySmall" tone="muted">面向课堂的组织化展示</Typography></div></header>
        <MiniWindow><div className="cg-format-mini-top"><Typography variant="bodySmall" tone="accent">教学课件 · 神经元课程</Typography><Typography variant="bodySmall" tone="muted">{selected + 1} / 4</Typography></div>
          <div className="cg-format-teaching-preview"><nav className="cg-format-slide-list" aria-label="选择预览课件">{lessons.map((item, index) => <Button key={item.title} active={selected === index} onClick={() => select(index)} aria-label={`展示第${index + 1}页：${item.title}`} aria-pressed={selected === index}><img src={item.image} alt={item.title} /></Button>)}</nav><div className="cg-format-main-preview"><img src={lesson.image} alt={lesson.title} /><Typography variant="bodySmall" tone="accent">{lesson.title}</Typography></div></div>
          <div className="cg-format-mini-footer"><Button onClick={() => select((selected + 3) % 4)} aria-label="预览上一页"><Typography as="span" variant="bodySmall" tone="inherit">上一页</Typography></Button><Typography variant="bodySmall" tone="muted">点选缩略图，切换课堂页面</Typography><Button onClick={() => select((selected + 1) % 4)} aria-label="预览下一页"><Typography as="span" variant="bodySmall" tone="inherit">下一页</Typography></Button></div>
        </MiniWindow>
      </section>
      <section className="cg-format-card cg-format-self"><header><span className="cg-format-mode-icon"><FormatStyleIcon kind="person" /></span><div><Typography as="h2" variant="h3" tone="success">自学交互模式</Typography><Typography variant="bodySmall" tone="muted">面向学习者的连续探索</Typography></div></header><ReadingPreview visible={visible} /></section>
      <section className="cg-format-card cg-format-script"><header><span className="cg-format-mode-icon"><FormatStyleIcon kind="play" /></span><div><Typography as="h2" variant="h3" tone="warning">智能讲稿模式</Typography><Typography variant="bodySmall" tone="muted">讲解与画面对应 · 视频扩展方向</Typography></div></header>
        <MiniWindow><div className="cg-format-mini-top"><Typography variant="bodySmall" tone="accent">{lesson.title}</Typography><Button active={playing} onClick={toggleNarration} disabled={!speechSupported} aria-label={!speechSupported ? '当前浏览器不支持语音播放' : playing ? '暂停语音讲解' : paused ? '继续语音讲解' : '播放语音讲解'}><Typography as="span" variant="bodySmall" tone="inherit">{!speechSupported ? '不支持语音' : playing ? '暂停' : paused ? '继续' : '播放讲解'}</Typography></Button></div>
          <div className="cg-format-script-preview"><nav aria-label="讲稿步骤" className="cg-format-script-list">{lesson.steps.map((item, index) => <Button key={item.title} active={explaining && step === index} onClick={() => narrate(selected, index, false)} aria-label={`讲解：${item.title}`}><Typography as="span" variant="bodySmall" tone="inherit">{index + 1}　{item.title}</Typography></Button>)}</nav><div className="cg-format-annotated"><img src={lesson.image} alt={lesson.title} />{lesson.steps.map((item, index) => <Button key={item.title} className="cg-format-hotspot" active={explaining && step === index} style={{ left: `${item.box[0]}%`, top: `${item.box[1]}%`, width: `${item.box[2]}%`, height: `${item.box[3]}%` }} aria-label={`高亮并讲解：${item.title}`} onClick={() => narrate(selected, index, false)}><span aria-hidden="true" /></Button>)}</div></div>
          <div className="cg-format-explanation" aria-live="polite">{explaining ? <><Typography variant="bodySmall" tone="warning">{step + 1} / 3 · {explanation.title}</Typography><Typography variant="bodySmall" tone="main">{speechError || explanation.text}</Typography></> : <Typography variant="bodySmall" tone="muted">点击图中区域或讲稿步骤，播放对应语音讲解。</Typography>}</div>
        </MiniWindow>
      </section>
    </div>
    <div className="cg-format-bottom"><section className="cg-format-traditional"><Typography as="h2" variant="h3" tone="muted">传统 PPT</Typography><Typography variant="bodySmall" tone="muted">主要服务课堂讲授</Typography></section><section className="cg-format-advantages"><Typography as="h2" variant="h3" tone="accent">相比传统 PPT 的优势</Typography><div>{(['一次设计，多端复用', '既能讲课，也能自学', '操作与反馈帮助理解', '讲稿可用于视频制作']).map((text, index) => <div className={`cg-format-benefit cg-format-benefit-${index}`} key={text}><span className="cg-format-benefit-icon"><FormatStyleIcon kind={(['devices', 'book', 'light', 'video'] as const)[index]} /></span><Typography variant="bodySmall" tone="main">{text}</Typography></div>)}</div></section></div>
  </ContentBlock>;
}
