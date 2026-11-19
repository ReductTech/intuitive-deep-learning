import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { saveRecordedData } from '../../showcaseRegressionData';
import { Forbid } from '@icon-park/react';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Button, EChartsChart, Typography } from "@shuku/course-style/react";
import { depthForMass, MAX_STONES, createStoneWeights, resetElephantMeasurement, stonePositions, TARGET_DEPTH_CM, type Observation } from './experiment';
import './CaoChongPage.css';

const assetId = '74de5075-8163-413d-84d4-7176f2a3f4a2';
const asset = (name: string) => moduleAssetUrl(`cao-chong/${name}`);
const stoneAssets = ['rock.webp', 'rock-slate.webp', 'rock-basalt.webp', 'rock-sandstone.webp'];
const stoneAsset = (index: number) => asset(stoneAssets[index % stoneAssets.length]);
type Phase = 'idle' | 'falling' | 'settling';
type StoryPhase = 'before-elephant' | 'loading-elephant' | 'elephant' | 'unloading-elephant' | 'stones';

export function CaoChongPage() {
  const [count, setCount] = useState(0);
  const [weights,setWeights] = useState(createStoneWeights);
  const [flying,setFlying] = useState<number[]>([]);
  const [records, setRecords] = useState<Observation[]>([]);
  const recordsRef = useRef<Observation[]>([]);
  const appendRecord = (observation: Observation) => {
    const next = [...recordsRef.current, observation].sort((a, b) => a.mass - b.mass);
    recordsRef.current = next;
    setRecords(next);
    // Notify other pages outside a React state updater, which must stay pure.
    saveRecordedData(next);
  };
  const [phase, setPhase] = useState<Phase>('idle');
  const [storyPhase, setStoryPhase] = useState<StoryPhase>('before-elephant');
  const [targetRecorded, setTargetRecorded] = useState(false);
  const [movingDepth, setMovingDepth] = useState(0);
  const visibleDepth = useRef(0);
  const motion = useRef<{start:number;from:number;target:number;frequency:number;mode?:'elephant'|'unload'}|null>(null);
  useEffect(() => {
    let frame = 0;
    const animate = () => {
      const m = motion.current;
      if (m) {
        const t = (performance.now() - m.start) / 1000;
        // A damped heave response: preserve the depth at impact, then oscillate about equilibrium.
        let value: number;
        if (m.mode === 'elephant') {
          // Approach the measured waterline with a small transient, never a full-load overshoot.
          if (t >= 3.5) {
            value = m.target;
            motion.current = null;
          } else {
            if (t < .6) {
              const progress = t / .6;
              const approach = progress*progress*(3-2*progress);
              value = m.from + (m.target-m.from)*approach;
            } else {
              // Once aboard, visibly heave around the waterline before settling.
              const progress = (t-.6)/2.9;
              const remaining = Math.pow(1-progress, 1.35);
              // Asymmetric heave: a restrained downward overshoot and a stronger buoyant rebound.
              const wave = Math.sin(9.5*(t-.6));
              const amplitude = wave >= 0 ? 4.0 : 8.0;
              value = m.target + amplitude*remaining*wave;
            }
          }
        } else if (m.mode === 'unload') {
          const progress = Math.min(1, t / .7);
          value = m.from * Math.pow(1-progress, 2);
          if (progress === 1) { value = 0; motion.current = null; }
        } else {
          const displacement = Math.exp(-t / 2.4) * ((m.from-m.target)*Math.cos(m.frequency*t) + 2.7*Math.sin(m.frequency*t));
          const ambient = .18*Math.sin(t*2.1) + .08*Math.sin(t*3.7);
          value = m.target + displacement + ambient;
        }
        // Keep the gunwale above the foreground water, including transient motion.
        value = Math.max(0, Math.min(39, value));
        visibleDepth.current = value;
        setMovingDepth(value);
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const locked = useRef(false);
  const countRef = useRef(0);
  const pendingSingleMeasurement = useRef<{mass:number}|null>(null);
  const flightStart = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const waterRef = useRef<HTMLCanvasElement>(null);
  const completed = count === MAX_STONES && phase === 'idle';
  const mass = weights.slice(0,count).reduce((sum,w)=>sum+w,0);
  const batchSize = count < 3 ? 1 : Math.min(5,MAX_STONES-count);
  const nextBatchMass = weights.slice(count,count+batchSize).reduce((sum,w)=>sum+w,0);
  const elephantAboard = storyPhase === 'loading-elephant' || storyPhase === 'elephant';
  const depth = storyPhase === 'before-elephant' ? depthForMass(mass) : movingDepth;
  // One video supplies both the backdrop and foreground water: no independent playback clocks.
  const sink = depth * 1.65;
  const targetY = 610 - TARGET_DEPTH_CM * 1.65 + sink;

  useEffect(() => {
    const video = videoRef.current;
    const canvas = waterRef.current;
    const context = canvas?.getContext('2d');
    if (!video || !canvas || !context) return;
    let frame = 0;
    let fallbackFrame = 0;
    let disposed = false;
    const draw = () => {
      if (disposed) return;
      if (video.readyState >= 2) context.drawImage(video, 0, 0, 1600, 900);
      if (typeof video.requestVideoFrameCallback === 'function') frame = video.requestVideoFrameCallback(draw);
      else fallbackFrame = requestAnimationFrame(draw);
    };
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const applyMotion = () => {
      if (motion.matches) video.pause();
      else void video.play().catch(() => { /* Poster remains visible if autoplay is unavailable. */ });
    };
    const ready = () => {
      applyMotion();
      if (frame) video.cancelVideoFrameCallback(frame);
      if (fallbackFrame) cancelAnimationFrame(fallbackFrame);
      draw();
    };
    video.addEventListener('loadeddata', ready);
    motion.addEventListener('change', applyMotion);
    if (video.readyState >= 2) ready();
    return () => {
      disposed = true;
      video.removeEventListener('loadeddata', ready);
      motion.removeEventListener('change', applyMotion);
      if (frame) video.cancelVideoFrameCallback(frame);
      if (fallbackFrame) cancelAnimationFrame(fallbackFrame);
    };
  }, []);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (callback: () => void, ms: number) => timers.current.push(setTimeout(callback, ms));
  const loadElephant = () => {
    if (locked.current) return;
    locked.current = true;
    motion.current = {start:performance.now(),from:visibleDepth.current,target:TARGET_DEPTH_CM,frequency:5.4,mode:'elephant'};
    recordsRef.current = [];
    saveRecordedData([]);
    setRecords([]);
    setStoryPhase('loading-elephant'); setPhase('settling');
    later(() => { setTargetRecorded(true); setStoryPhase('elephant'); }, 3600);
    // Keep the waterline visible briefly, then leave without a second click.
    later(() => { motion.current = {start:performance.now(),from:visibleDepth.current,target:0,frequency:5.8,mode:'unload'}; setStoryPhase('unloading-elephant'); }, 4400);
    later(() => { motion.current = null; visibleDepth.current = 0; setMovingDepth(0); setStoryPhase('stones'); setPhase('idle'); locked.current = false; }, 5100);
  };
  const dropStone = () => {
    if (storyPhase !== 'stones' || locked.current || countRef.current >= MAX_STONES) return;
    // The next click ends the learner's waiting period for a single stone.
    // Capture the current heave before the new stone changes the load.
    const pending = pendingSingleMeasurement.current;
    if (pending) {
      const observed = {mass:pending.mass,depth:Math.round(visibleDepth.current*10)/10};
      pendingSingleMeasurement.current = null;
      appendRecord(observed);
    }
    locked.current = true;
    const start = countRef.current;
    flightStart.current = start;
    const amount = start < 3 ? 1 : Math.min(5,MAX_STONES-start);
    const indices = Array.from({length:amount},(_,i)=>start+i);
    const impactSpacing = 80;
    let pendingMeasurements = amount;
    setFlying(indices);
    setPhase('falling');
    indices.forEach((index,i)=>later(()=>{
      const next = index+1;
      countRef.current = next;
      setCount(next);
      setFlying(previous=>previous.filter(n=>n!==index));
      const loadedMass = weights.slice(0,next).reduce((sum,w)=>sum+w,0);
      motion.current = {start:performance.now(),from:visibleDepth.current,target:depthForMass(loadedMass),frequency:7.1+next*.83};
      if(i===amount-1)setPhase('settling');
      if (amount === 1) {
        pendingSingleMeasurement.current = {mass:loadedMass};
        setPhase('idle');
        locked.current = false;
        return;
      }
      // Independent sampling avoids a phase pattern tied to stone order.
      // Values are generated once and shared unchanged with the later pages.
      const sampleTime = .5 + Math.random()*.5;
      const targetDepth = depthForMass(loadedMass);
      const previousDepth = depthForMass(loadedMass-weights[index]);
      const frequency = 8 + Math.random()*2;
      const measurementAmplitude = 3.8 + Math.random()*.8;
      const singleStoneDepth = targetDepth + Math.exp(-sampleTime/2.4)*(
        (previousDepth-targetDepth)*Math.cos(frequency*sampleTime)
        + measurementAmplitude*Math.sin(frequency*sampleTime)
      ) + .18*Math.sin(sampleTime*2.1) + .08*Math.sin(sampleTime*3.7);
      const recordedDepth = Math.round(Math.max(0,singleStoneDepth)*10)/10;
      later(()=>{
        appendRecord({mass:loadedMass,depth:recordedDepth});
        pendingMeasurements -= 1;
        if(pendingMeasurements===0){setPhase('idle');locked.current=false;}
      },sampleTime*1000);
    },560+i*impactSpacing));
  };
  const reset = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    motion.current = null; visibleDepth.current = 0; setMovingDepth(0);
    pendingSingleMeasurement.current = null;
    countRef.current = 0;
    locked.current = false;
    recordsRef.current = [];
    resetElephantMeasurement();
    saveRecordedData([]);
    setWeights(createStoneWeights()); setFlying([]); setCount(0); setRecords([]); setPhase('idle'); setStoryPhase('before-elephant'); setTargetRecorded(false);
  };
  const option = useMemo(() => ({
    animationDuration: 440,
    backgroundColor: 'transparent',
    grid: { top: 58, right: 28, bottom: 76, left: 64 },
    tooltip: { trigger: 'item', formatter: (item: { value: number[] }) => `${item.value[0]} 千克 · 下沉 ${item.value[1]} 厘米` },
    xAxis: { type: 'value', min: 0, max: 3000, interval: 1000, name: '累计石重（千克）', nameLocation: 'middle', nameGap: 30,
      nameTextStyle: { color: '#27446e', fontSize: 28 }, axisLabel: { color: '#68778f', fontSize: 22 }, axisLine: { show: true, lineStyle: { color: '#9b8970' } }, splitLine: { show: false } },
    yAxis: { type: 'value', min: 0, max: 40, interval: 10, name: '下沉深度（厘米）', nameGap: 10,
      nameTextStyle: { color: '#27446e', fontSize: 28, align: 'left' }, axisLabel: { color: '#68778f', fontSize: 22 }, axisLine: { show: true, lineStyle: { color: '#9b8970' } }, splitLine: { lineStyle: { color: 'rgba(143,118,83,.13)' } } },
    series: [{ type: 'scatter', symbolSize: 13, data: records.map((record, index) => ({ value: [record.mass, record.depth],
      itemStyle: { color: index === records.length - 1 ? '#f07e47' : '#27446e', borderWidth: 2, borderColor: '#fff6e7' } })),
      markLine: { silent: true, symbol: ['none', 'none'], label: { show: false }, lineStyle: { color: '#c07100', type: 'dashed' }, data: targetRecorded ? [{ yAxis: TARGET_DEPTH_CM }] : [] } }],
  }), [records, targetRecorded]);

  return <section shuku-edit-id="e-9a543270-7b53-4704-afc8-d0c53cdcbc78" className="aipe-showcase-rl-cao-page" aria-labelledby="aipe-showcase-rl-cao-title">
    <div shuku-edit-id="e-f6ec54fc-da5d-4f20-92a5-d02b2dbe2537" className="aipe-showcase-rl-cao-world" style={{ '--aipe-showcase-rl-landscape': `url("${asset('river-video-poster.webp')}")`, '--aipe-showcase-rl-sink': `${sink}px` } as CSSProperties} data-phase={phase} data-count={count}>
      <video shuku-edit-id="e-f0d1e5b6-2eb9-4951-892e-91d589a6d563" ref={videoRef} className="aipe-showcase-rl-cao-scenery" src={asset('river-motion.mp4')} poster={asset('river-video-poster.webp')} autoPlay loop muted playsInline preload="auto" aria-hidden="true" />
      <div shuku-edit-id="e-c3436232-de42-495d-9a1e-e3511da5c8f1" className="aipe-showcase-rl-cao-atmosphere" aria-hidden="true" />
      <header shuku-edit-id="e-61799df2-8cfd-427d-a7b2-38fbea1de716" className="aipe-showcase-rl-cao-hero">
        <Typography shuku-edit-id="e-45b4ce40-491b-4f72-9753-d8234fbae76a" as="h1" variant="display" tone="inherit" className="aipe-showcase-rl-cao-title" id="aipe-showcase-rl-cao-title">曹冲称象</Typography>
        <Typography shuku-edit-id="e-b580ca96-c597-456e-866f-b88c23c528cd" as="p" variant="bodySmall" tone="inherit" className="aipe-showcase-rl-cao-subtitle">曹操想知道大象有多重，曹冲便让大象上船，在船身刻下水位。再换上石头，装到同一水位时，石头的总重就是象重。</Typography>
      </header>
      <div shuku-edit-id="e-d2ecc604-d430-4452-90b4-806266edb00b" className="aipe-showcase-rl-cao-scene" aria-label="称象实验：船随石重下沉，水面保持固定">
        <div shuku-edit-id="e-a56995fd-544f-4923-ab30-be0548a63806" className="aipe-showcase-rl-cao-water-back" aria-hidden="true" />
        <div shuku-edit-id="e-774cb13f-4eb3-4bd5-8dca-e4b04540929a" className="aipe-showcase-rl-cao-reflection" aria-hidden="true" />
        <div shuku-edit-id="e-a4f51d26-9dde-485e-86cf-9ddcb47291fd" className="aipe-showcase-rl-cao-boat-motion" data-testid="boat" style={{ transform: `translateY(${sink}px)`, transition: storyPhase !== 'before-elephant' ? 'none' : undefined }}>
          <img shuku-edit-id="e-c99b8e6a-5f87-4132-bd8c-c973f49db748" className="aipe-showcase-rl-cao-boat-back" src={asset('boat-rectangular.webp')} alt="直壁平底、船上无人的长方体木船" draggable={false} />
          <img shuku-edit-id="e-1223a7e0-9a7e-4691-8bfd-335ce18a78f7" className="aipe-showcase-rl-cao-elephant" data-aboard={elephantAboard} src={asset('elephant.webp')} alt={elephantAboard ? '上船称重的大象' : ''} aria-hidden={!elephantAboard} draggable={false} />
          <div shuku-edit-id="e-0a52676c-d200-4ce0-b4f9-7f06ebdbeea0" className="aipe-showcase-rl-cao-cargo" aria-hidden="true">
            {stonePositions.slice(0, count).map(([x, y], index) => <img shuku-edit-id="e-863e6a7f-1d97-4bea-a46c-0d3d2786c6dc" key={index} className="aipe-showcase-rl-cao-loaded-rock" src={stoneAsset(index)} draggable={false}
              style={{ left: `${x}%`, top: `${y}%`, rotate: `${(index % 5 - 2) * 13}deg`, width: `${6.6+(weights[index]-100)*.035}%`, zIndex: Math.round(y*10) }} alt="" />)}
          </div>
          <img shuku-edit-id="e-f4119978-e780-4892-bba5-134b98852b6b" className="aipe-showcase-rl-cao-boat-front" src={asset('boat-rectangular.webp')} alt="" aria-hidden="true" draggable={false} />
          <svg shuku-edit-id="e-a24deb34-345f-4de0-87a6-8d0d150e15bd" className="aipe-showcase-rl-cao-hull-ruler" viewBox="0 0 32 120" aria-hidden="true"><path shuku-edit-id="e-239fde8d-5f56-4263-ab85-edaf2be8df9c" d="M6 1V119" />{Array.from({ length: 13 }, (_, i) => <path shuku-edit-id="e-a9a60a8a-2511-4a60-9dca-e76543f9bb25" key={i} d={`M6 ${i * 9 + 5}h${i % 3 === 0 ? 22 : 12}`} />)}</svg>
        </div>
        {flying.map((index,i)=><div shuku-edit-id="e-50bf9107-0c91-4461-ad84-698d8d8acf44" key={index} className="aipe-showcase-rl-cao-flight" style={{ '--aipe-showcase-rl-landing-x': `${20 + stonePositions[index][0] * 9.7 - 179}px`, '--aipe-showcase-rl-landing-y': `${360 + stonePositions[index][1] * 3.5 + sink - 15}px`, animationDelay: `${(index-flightStart.current)*80}ms` } as CSSProperties} aria-hidden="true"><img shuku-edit-id="e-64068c36-8c19-47f0-8e85-594438e88cd9" src={stoneAsset(index)} alt="" /></div>)}
        <div shuku-edit-id="e-1fad1526-28d6-4bbb-ade0-8157de35bf49" className="aipe-showcase-rl-cao-water-front" aria-hidden="true"><canvas shuku-edit-id="e-7ecd5c63-5e08-4c5b-ba8b-ec27f23ac2cc" ref={waterRef} width={1000} height={900} className="aipe-showcase-rl-cao-water-texture" /><div shuku-edit-id="e-8e8ba956-13e6-4249-9514-767fc4068c0a" className="aipe-showcase-rl-cao-water-rim" /></div>
        {targetRecorded && <div shuku-edit-id="e-ba504c0a-8bf4-44d2-bb2a-6721fc259313" className="aipe-showcase-rl-cao-target" style={{ top: targetY, transition: storyPhase !== 'before-elephant' ? 'none' : undefined }} title="大象上船时留下的刻痕"><i shuku-edit-id="e-04b931ba-a587-43cb-aa1b-8d32bcf94ec3" /><Typography shuku-edit-id="e-7ceceb05-c907-43d7-b6eb-2b6b65121155" variant="bodySmall" as="span" tone="inherit">{`大象水位 · 下沉 ${TARGET_DEPTH_CM.toFixed(1)} 厘米`}</Typography></div>}
        <div shuku-edit-id="e-8178bdfb-e625-4ec0-894e-8a62f19d90e5" className="aipe-showcase-rl-cao-empty-mark" aria-hidden="true" style={{ top: 610 + sink, transition: storyPhase !== 'before-elephant' ? 'none' : undefined }} />
        {phase === 'settling' && <div shuku-edit-id="e-46b7f763-b14d-4715-bdc1-df5f29942789" key={count} className="aipe-showcase-rl-cao-ripple" aria-hidden="true"><i shuku-edit-id="e-b47d34ea-e5c1-4259-b587-500031083b15" /><i shuku-edit-id="e-c2e4e83b-f80c-4126-8ead-0460afb02bd5" /><i shuku-edit-id="e-8056e96b-bd22-49c8-84f5-9d1c677e75a3" /></div>}
        <div shuku-edit-id="e-87db4b45-ffce-4e01-9ae2-52681c36eebc" className="aipe-showcase-rl-cao-depth"><Typography shuku-edit-id="e-50e0705a-45cf-41e8-91c8-b08704e464a3" variant="body" tone="inherit">{`下沉 ${depth.toFixed(1)} 厘米`}</Typography></div>
        <div shuku-edit-id="e-5dfa73b5-9135-4820-b6ff-4e9427150919" className="aipe-showcase-rl-cao-stone-control">
          <Button className="aipe-showcase-rl-cao-stone-button" onClick={storyPhase === 'before-elephant' ? loadElephant : dropStone} disabled={phase !== 'idle' || completed} aria-label={completed ? '石头用完了' : storyPhase === 'before-elephant' ? '点击称重' : storyPhase === 'stones' ? `投放${batchSize}块石头，共${nextBatchMass}千克` : '称重中'}>
            <img shuku-edit-id="e-ce369ef7-914c-4f18-8d39-3e4bc23192f8" src={storyPhase === 'stones' ? stoneAsset(completed ? MAX_STONES - 1 : count) : asset('elephant.webp')} alt="" draggable={false} />
            {completed && <span shuku-edit-id="e-467bf261-2599-4ea8-bbd3-3272ebd69552" className="aipe-showcase-rl-cao-stone-forbid" aria-hidden="true"><Forbid theme="outline" size={142} fill="#ff715e" strokeWidth={3} /></span>}
            {!completed && <Typography shuku-edit-id="e-2b3101ee-4fc8-4dfb-8d3f-ebfc50a673b5" as="span" variant="h3" tone="inherit">{storyPhase === 'before-elephant' ? '点击称重' : storyPhase === 'unloading-elephant' ? '自动下船…' : storyPhase !== 'stones' ? '称重中…' : phase === 'falling' ? '石头落下…' : phase === 'settling' ? '记录水位…' : `投放 ${batchSize} 块`}</Typography>}
            {!completed && <Typography shuku-edit-id="e-d276f836-6d67-4c78-b438-ff5dda6fd3d7" as="span" variant="body" tone="inherit">{storyPhase === 'stones' ? `本次 ${nextBatchMass} 千克` : targetRecorded ? `已记下 ${TARGET_DEPTH_CM.toFixed(1)} 厘米` : '自动记录水位'}</Typography>}
            {storyPhase === 'stones' && !completed && <Typography shuku-edit-id="e-60cf3f76-909d-4484-b915-ea158183b6c2" as="span" variant="body" tone="inherit">剩余 {MAX_STONES - count} 块</Typography>}
          </Button>
        </div>
        {completed && <div shuku-edit-id="e-89477188-7d3b-4b33-a496-c37005d744b3" className="aipe-showcase-rl-cao-result" role="status"><Typography shuku-edit-id="e-c05de652-8586-40ba-8eae-2d40d2829f26" variant="h3" tone="inherit">石头用完了</Typography><Typography shuku-edit-id="e-1522e6a6-f72d-4585-a6c4-f85b509c9930" variant="body" tone="inherit">1500 千克，仍没到刻痕。</Typography><Typography shuku-edit-id="e-09eaa1aa-f0fb-4396-8022-eed73c210198" variant="body" tone="inherit">能估出象重吗？</Typography></div>}
      </div>

      <section shuku-edit-id="e-35304fb4-465a-438b-b381-fbdc896efa76" className="aipe-showcase-rl-cao-notebook" aria-label="称象实验记录本">
        <div shuku-edit-id="e-97e1ad74-e908-44dd-b797-aa41391387e8" className="aipe-showcase-rl-cao-book-binding" aria-hidden="true"><i shuku-edit-id="e-887206dd-9a59-4d5a-8701-9dfc6edabbda" /><i shuku-edit-id="e-49e5f954-a9e7-4a5e-b3ed-c1d6831530c4" /><i shuku-edit-id="e-7aa47952-857f-4e30-87d9-cccbfb8bbaa9" /></div>
        <div shuku-edit-id="e-1ee08864-5dfe-4f26-9222-bd43bc2b7680" className="aipe-showcase-rl-cao-book-header"><Typography shuku-edit-id="e-884a666e-2b98-4774-b632-b95de1402508" variant="h3" tone="accent">投石手记</Typography><Typography shuku-edit-id="e-1d83dc82-dcb9-41df-9f03-3f37525e3074" variant="bodySmall" tone="muted">{records.length} 条记录</Typography></div>
        <Typography shuku-edit-id="e-489e6b26-4f9c-4139-bee1-acbc43f8a73b" variant="bodySmall" tone={targetRecorded ? 'accent' : 'muted'} className="aipe-showcase-rl-cao-elephant-record">{targetRecorded ? `大象水位：${TARGET_DEPTH_CM.toFixed(1)} 厘米` : '大象水位：待记录'}</Typography>
        <EChartsChart className="aipe-showcase-rl-cao-chart" option={option} minHeight={0} aria-label={`石重与下沉深度散点图，共${records.length}个点`} />
        <div shuku-edit-id="e-58558d34-960c-4faf-b98c-422c85925e22" className="aipe-showcase-rl-cao-book-footer"><Button onClick={reset}>重新开始</Button></div>
      </section>
    </div>
  </section>;
}

