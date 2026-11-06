import { moduleIdentity } from '../../outlines.json';
import { moduleAssetUrl } from '../../../shared/react/assets';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, NoticeStrip, RangeControl, Typography } from '../../../shared/react';
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
const reference = moduleAssetUrl(moduleIdentity.id, "super-resolution/reference-flower.png");
import { preparePixels, reconstructPixels, type ResidualPixels } from './pixels';
import { drawResidualReveal, pictureTravel, type PictureTravel } from './motion';
import { isSubtractionLayout, layoutDestinations, panelColumns, TRANSPOSE_DURATION_MS, type ResidualMotion, type ResidualStep } from './scene';
import './SuperResolutionPage.css';

export interface SuperResolutionPageProps { onComplete?: () => void; }
const stationary: PictureTravel = { x: 0, y: 0, scale: 1 };
export function SuperResolutionPage({ onComplete }: SuperResolutionPageProps) {
  const [step, setStep] = useState<ResidualStep>('question'), [motion, setMotion] = useState<ResidualMotion | null>(null), [strength, setStrength] = useState(0);
  const [pixels, setPixels] = useState<ResidualPixels | null>(null), [error, setError] = useState(''), [retry, setRetry] = useState(0);
  const [travel, setTravel] = useState<PictureTravel[]>([stationary, stationary, stationary]), [operatorTravel, setOperatorTravel] = useState<PictureTravel[]>([stationary, stationary]);
  const generation = useRef(0), initialStrength = useRef(0);
  const canvases = useRef<(HTMLCanvasElement | null)[]>([]), figures = useRef<(HTMLElement | null)[]>([]), operators = useRef<(HTMLDivElement | null)[]>([]);
  const scanline = useRef<HTMLSpanElement | null>(null);
  const reconstruction = useMemo(() => pixels ? reconstructPixels(pixels, strength) : null, [pixels, strength]);
  const playing = motion !== null, moving = motion === 'transpose' || motion === 'restore', difference = isSubtractionLayout(step);
  const stage = step === 'reconstruction' ? 2 : step === 'residual' && motion !== 'subtract' ? 1 : 0;
  const complete = Boolean(pixels) && step === 'reconstruction' && !playing && strength === 100;
  useCompleteOnce(complete, onComplete);
  useEffect(() => {
    let active = true;
    setError('');
    const image = new Image(); image.src = reference;
    void image.decode().then(() => { if (active) { try { setPixels(preparePixels(image)); } catch (failure) { setError(failure instanceof Error ? failure.message : '像素读取失败。'); } } }).catch(() => { if (active) setError('图片加载失败，请重试。'); });
    return () => { active = false; };
  }, [retry]);
  useEffect(() => {
    if (!pixels || !reconstruction) return;
    const images = [pixels.baseline, motion === 'subtract' ? pixels.target : pixels.visualization, step === 'reconstruction' ? reconstruction.bytes : pixels.target];
    images.forEach((bytes, index) => { const context = canvases.current[index]?.getContext('2d'); context?.putImageData(new ImageData(new Uint8ClampedArray(bytes), pixels.size, pixels.size), 0, 0); });
  }, [pixels, reconstruction, step, motion]);
  useEffect(() => {
    if (!motion || !pixels) return;
    let active = true, finished = false, request = 0, start: number | undefined;
    const token = generation.current, adding = motion === 'restore' || motion === 'fill', from = initialStrength.current;
    const finish = () => {
      if (!active || finished || token !== generation.current) return;
      finished = true;
      if (adding) setStrength(100);
      setMotion(null);
    };
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { finish(); return; }
    const delay = motion === 'restore' ? 1050 : 0, duration = motion === 'subtract' ? 1600 : 1400;
    const timer = window.setTimeout(finish, motion === 'transpose' ? TRANSPOSE_DURATION_MS + 100 : delay + duration + 250);
    if (motion !== 'transpose') {
      const context = canvases.current[1]?.getContext('2d');
      const image = (bytes: Uint8ClampedArray) => new ImageData(new Uint8ClampedArray(bytes), pixels.size, pixels.size);
      const target = motion === 'subtract' && context ? image(pixels.target) : null;
      const residual = motion === 'subtract' && context ? image(pixels.visualization) : null;
      const animate = (now: number) => {
        if (!active || finished || token !== generation.current) return;
        start ??= now;
        const progress = Math.max(0, Math.min(1, (now - start - delay) / duration));
        if (context && target && residual) {
          drawResidualReveal(context, target, residual, progress);
          scanline.current?.style.setProperty('--rtg-reveal', String(progress * 100) + '%');
        }
        if (adding) setStrength(Math.round(from + (100 - from) * progress));
        if (progress < 1) request = window.requestAnimationFrame(animate); else finish();
      };
      request = window.requestAnimationFrame(animate);
    }
    return () => { active = false; window.clearTimeout(timer); window.cancelAnimationFrame(request); };
  }, [motion, pixels]);
  function moveLayout(subtraction: boolean) {
    const destinations = layoutDestinations(subtraction);
    setTravel(destinations.map((destination, index) => pictureTravel(figures.current[index]?.getBoundingClientRect(), figures.current[destination]?.getBoundingClientRect(), figures.current[destination]?.offsetWidth)));
    setOperatorTravel([0, 1].map(index => pictureTravel(operators.current[index]?.getBoundingClientRect(), operators.current[1 - index]?.getBoundingClientRect(), operators.current[1 - index]?.offsetWidth)));
    generation.current += 1; initialStrength.current = 0;
    setStrength(0); setStep(subtraction ? 'transposed' : 'reconstruction'); setMotion(subtraction ? 'transpose' : 'restore');
  }
  function advance() {
    if (!pixels || playing) return;
    if (step === 'question') moveLayout(true);
    else if (step === 'transposed') { generation.current += 1; setStep('residual'); setMotion('subtract'); }
    else if (step === 'residual') moveLayout(false);
  }
  function fill() { if (!pixels || playing || strength === 100) return; generation.current += 1; initialStrength.current = strength; setMotion('fill'); }
  function reset() { generation.current += 1; setMotion(null); setStep('question'); setStrength(0); }
  const known = step === 'residual' || step === 'reconstruction';
  const columns = panelColumns(step);
  const panels = [
    { role: 'baseline', title: '保留底图', math: 'b=U(x)', caption: '低清输入放大到同尺寸' },
    { role: 'residual', title: known ? '细节残差' : '待求残差', math: step === 'residual' ? 'R=Y-b' : 'R', caption: known ? '灰底为零，正负差值增强显示' : difference ? '目标减去底图，得到什么？' : '与底图相加，还缺少什么？' },
    { role: 'target', title: step === 'reconstruction' ? '重构结果' : '高清目标', math: step === 'reconstruction' ? 'b+\\lambda R' : 'Y', caption: step === 'reconstruction' ? '当前加入 ' + strength + '% 的真实差值' : '已知目标，用于定义差值' },
  ];
  const actionLabel = motion === 'transpose' ? '底图正在移到等号另一侧…' : motion === 'subtract' ? '正在从左向右计算残差…' : step === 'question' ? '移项：改为相减 →' : step === 'transposed' ? '计算：从左向右求残差 →' : '加回：还原清晰图像 →';
  const guidance = error || (!pixels ? '正在准备图像…' : motion === 'transpose' ? '底图跨过等号，原来的加上底图，变为减去底图。' : step === 'transposed' ? '移项完成：残差＝高清图－底图。点击计算，观察差值。' : motion === 'subtract' ? '从左向右逐像素相减，留下正负细节差值。' : step === 'residual' ? '已得到残差。点击加回，验证它能补回底图缺少的细节。' : motion === 'restore' ? '先把图块移回加法位置，再将残差逐渐加回底图。' : complete ? '底图加回全部真实差值，逐像素还原目标。' : step === 'reconstruction' ? '拖动橙色滑杆，观察加入不同比例的细节。' : '先移动图块，把加法关系变成求差关系。');
  const motionStyle = (offset: PictureTravel, arc = 0) => ({
    '--rtg-source-x': String(offset.x) + 'px', '--rtg-source-y': String(offset.y) + 'px', '--rtg-source-scale': offset.scale,
    '--rtg-mid-x': String(offset.x / 2) + 'px', '--rtg-mid-y': String(offset.y / 2 + arc) + 'px', '--rtg-mid-scale': arc === 0 ? 1 : Math.min(1, offset.scale) * .86,
  } as CSSProperties);
  return <ContentBlock headingLevel={1} className="rtg-super-resolution" style={{ '--rtg-layout-duration': String(motion === 'transpose' ? TRANSPOSE_DURATION_MS : 1000) + 'ms' } as CSSProperties} data-stage={stage} data-step={step} data-motion={motion ?? ''} data-strength={strength} data-ready={Boolean(pixels)} data-complete={complete} data-mean-error={reconstruction?.meanError ?? ''} data-animation-playing={playing} data-layout={difference ? 'subtraction' : 'addition'}
    title="把低清图变清晰，网络只学“细节差值”" subtitle="保留底图，只补上与高清目标的差值。"
    onKeyDown={event => { if ((event.target as Element).matches('input[type="range"]')) event.stopPropagation(); if ((event.key === ' ' || event.key === 'Enter') && (event.target as Element).closest('button')) { event.stopPropagation(); if (event.repeat) event.preventDefault(); } }}>
    <div className="rtg-super-resolution__toolbar"><ol>{['移项求差', '算出残差', '加回验证'].map((label, index) => <li className={stage === index ? 'is-current' : index < stage ? 'is-seen' : ''} aria-current={stage === index ? 'step' : undefined} key={label}><Typography as="span" variant="bodySmall" tone="inherit">{index + 1} · {label}</Typography></li>)}</ol><Button data-reset onClick={reset}>重新观察</Button></div>
    <section className="rtg-super-resolution__lab" aria-label="移动图块求残差，再把残差加回底图" aria-busy={playing}>
      <div className="rtg-super-resolution__pictures">
        {panels.map((panel, index) => <figure key={panel.role} ref={element => { figures.current[index] = element; }} data-panel-role={panel.role} style={{ gridColumn: columns[index], ...motionStyle(travel[index], index === 0 ? 26 : -14) }} className={moving ? 'is-moving' : ''}>
          <header className="rtg-super-resolution__panel-title" data-panel-title={index}>
            <Typography as="h2" variant="bodySmall" tone={index === 1 ? 'warning' : index === 2 ? 'success' : 'accent'}>{panel.title}</Typography>
            <MathFormulaBlock appearance="plain" ariaLabel={panel.title + ' ' + panel.math}><MathFormulaStatic latex={panel.math} /></MathFormulaBlock>
          </header>
          <div className="rtg-super-resolution__picture-viewport">
            {index === 1 && step !== 'reconstruction' ? <button type="button" className={'rtg-super-resolution__picture ' + (known ? 'is-action' : 'is-question')} data-reveal-residual={!known || undefined} data-add-details={step === 'residual' || undefined} data-picture-role={panel.role} disabled={!pixels || playing} onClick={advance} aria-label={actionLabel}>
              <canvas width={256} height={256} hidden={!known} ref={element => { canvases.current[index] = element; }} role="img" aria-label="细节残差 R" />
              {!known && <div className="rtg-super-resolution__question-prompt"><Typography as="span" variant="h1" tone="inherit" aria-hidden="true">?</Typography><Typography as="span" variant="body" tone="inherit">{step === 'question' ? '点击移项 →' : '点击计算残差 →'}</Typography></div>}
              {motion === 'subtract' && <span className="rtg-super-resolution__scanline" data-residual-scan ref={scanline} />}
              {known && <Typography as="span" variant="bodySmall" tone="inherit" className="rtg-super-resolution__picture-label">{playing ? '从左向右，逐像素求差' : '点击加回底图 →'}</Typography>}
            </button> : <div className="rtg-super-resolution__picture" data-picture-role={panel.role}><canvas width={256} height={256} ref={element => { canvases.current[index] = element; }} role="img" aria-label={panel.title} /></div>}
          </div>
          <figcaption>{index === 0 ? <MathFormulaBlock appearance="plain" ariaLabel="32乘32放大到256乘256"><MathFormulaStatic latex="32\times32\rightarrow256\times256" /></MathFormulaBlock> : <Typography variant="bodySmall" tone="muted">{panel.caption}</Typography>}</figcaption>
        </figure>)}
        {[0, 1].map(index => <div key={index} ref={element => { operators.current[index] = element; }} className={'rtg-super-resolution__operator' + (moving ? ' is-moving' : '')} style={{ gridColumn: index === 0 ? difference ? 4 : 2 : difference ? 2 : 4, ...motionStyle(operatorTravel[index]) }} data-operator={index === 0 ? 'operation' : 'equals'} data-symbol={index === 0 ? difference ? '-' : '+' : '='} role="img" aria-label={index === 0 ? difference ? '减去底图' : '加上残差' : '等于'}>
          {moving && index === 0 && <MathFormulaBlock appearance="plain" className="rtg-super-resolution__operator-before" aria-hidden="true"><MathFormulaStatic latex={difference ? '+' : '-'} /></MathFormulaBlock>}
          <MathFormulaBlock appearance="plain" className={moving && index === 0 ? 'rtg-super-resolution__operator-after' : ''} aria-hidden="true"><MathFormulaStatic latex={index === 0 ? difference ? '-' : '+' : '='} /></MathFormulaBlock>
        </div>)}
      </div>
      <div className="rtg-super-resolution__controls">
        <MathFormulaBlock appearance="plain" ariaLabel={difference ? '残差等于目标减底图' : step === 'question' ? '底图加待求差值等于目标' : '底图加比例乘残差'}><MathFormulaStatic latex={difference ? 'R=Y-b' : step === 'question' ? 'b+?=Y' : 'b+\\lambda R'} /></MathFormulaBlock>
        {step === 'reconstruction' ? <RangeControl label={playing ? '正在加回细节…' : '拖动：加入多少细节？'} aria-label="加入细节的比例" data-details-range min={0} max={100} step={5} value={strength} suffix="%" hint disabled={playing} onChange={event => setStrength(Number(event.currentTarget.value))} /> : <Button data-advance variant="primary" hint={!playing} disabled={!pixels || playing} onClick={advance}>{actionLabel}</Button>}
        {step === 'reconstruction' ? <div className="rtg-super-resolution__result"><Button data-fill-details onClick={fill} disabled={playing || complete}>加入全部细节</Button><Typography variant="bodySmall" tone={complete ? 'success' : 'muted'}>平均像素差：{(reconstruction?.meanError ?? 0).toFixed(1)}</Typography></div> : <Typography variant="bodySmall" tone="muted">同尺寸图像，逐像素计算</Typography>}
      </div>
    </section>
    <NoticeStrip tone={error ? 'orange' : complete ? 'green' : 'blue'} role="status" aria-live="polite">{guidance}{error && <Button data-retry onClick={() => setRetry(value => value + 1)}>重试加载</Button>}</NoticeStrip>
  </ContentBlock>;
}
