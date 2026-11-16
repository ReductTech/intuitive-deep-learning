import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { saveRecordedData } from '../../showcaseRegressionData';
import { Forbid } from '@icon-park/react';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Button, EChartsChart, Typography } from "@shuku/course-style/react";
import { depthForMass, MAX_STONES, createStoneWeights, resetElephantMeasurement, stonePositions, TARGET_DEPTH_CM, type Observation } from './experiment';
import './CaoChongPage.css';

const assetId = 'b8d86e85-2150-47e3-9e1a-aa7cc7cce15c';
const asset = (name: string) => moduleAssetUrl(`cao-chong/${name}`);
const stoneAssets = ['rock.png', 'rock-slate.png', 'rock-basalt.png', 'rock-sandstone.png'];
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

  return <section shuku-edit-id="e-56984496-9542-4a3f-af09-90125ba652c2" className="aipe-showcase-rl-cao-page" aria-labelledby="aipe-showcase-rl-cao-title">
    <div shuku-edit-id="e-c8b5a3ab-e8c0-4de6-bc9d-381f18fedcd1" className="aipe-showcase-rl-cao-world" style={{ '--aipe-showcase-rl-landscape': `url("${asset('river-video-poster.jpg')}")`, '--aipe-showcase-rl-sink': `${sink}px` } as CSSProperties} data-phase={phase} data-count={count}>
      <video shuku-edit-id="e-0736bba6-ce9d-48e9-8215-c7c72823ae04" ref={videoRef} className="aipe-showcase-rl-cao-scenery" src={asset('river-motion.mp4')} poster={asset('river-video-poster.jpg')} autoPlay loop muted playsInline preload="auto" aria-hidden="true" />
      <div shuku-edit-id="e-5d505464-017b-40ee-91bb-f8792d375c0b" className="aipe-showcase-rl-cao-atmosphere" aria-hidden="true" />
      <header shuku-edit-id="e-54db03a9-3095-42ae-8d27-4af567cd181e" className="aipe-showcase-rl-cao-hero">
        <Typography shuku-edit-id="e-081d7c63-63e5-4c62-a085-3c7922b9a44f" as="h1" variant="display" tone="inherit" className="aipe-showcase-rl-cao-title" id="aipe-showcase-rl-cao-title">曹冲称象</Typography>
        <Typography shuku-edit-id="e-afd2629b-fc9f-4fc2-98d8-0504efd81a8d" as="p" variant="bodySmall" tone="inherit" className="aipe-showcase-rl-cao-subtitle">曹操想知道大象有多重，曹冲便让大象上船，在船身刻下水位。再换上石头，装到同一水位时，石头的总重就是象重。</Typography>
      </header>
      <div shuku-edit-id="e-51ba9711-df2e-45d6-ba61-eb360644268f" className="aipe-showcase-rl-cao-scene" aria-label="称象实验：船随石重下沉，水面保持固定">
        <div shuku-edit-id="e-6e90090f-33a2-482f-bfe1-ba6ccba4d0db" className="aipe-showcase-rl-cao-water-back" aria-hidden="true" />
        <div shuku-edit-id="e-f39f1f6d-80c6-4c2d-8195-4b60c7b6210e" className="aipe-showcase-rl-cao-reflection" aria-hidden="true" />
        <div shuku-edit-id="e-fa1fb679-64d6-4375-bb3e-c9aaa0434603" className="aipe-showcase-rl-cao-boat-motion" data-testid="boat" style={{ transform: `translateY(${sink}px)`, transition: storyPhase !== 'before-elephant' ? 'none' : undefined }}>
          <img shuku-edit-id="e-e034c4fc-6c74-4e49-bf52-ec83bd9815fd" className="aipe-showcase-rl-cao-boat-back" src={asset('boat-rectangular.png')} alt="直壁平底、船上无人的长方体木船" draggable={false} />
          <img shuku-edit-id="e-db1b95fc-e9bb-4e11-a71d-179931691501" className="aipe-showcase-rl-cao-elephant" data-aboard={elephantAboard} src={asset('elephant.png')} alt={elephantAboard ? '上船称重的大象' : ''} aria-hidden={!elephantAboard} draggable={false} />
          <div shuku-edit-id="e-12a8aafa-edaa-40e4-915a-bac3511d023c" className="aipe-showcase-rl-cao-cargo" aria-hidden="true">
            {stonePositions.slice(0, count).map(([x, y], index) => <img shuku-edit-id="e-2d40ac35-eeca-4f4d-b749-c43c5f8a7f75" key={index} className="aipe-showcase-rl-cao-loaded-rock" src={stoneAsset(index)} draggable={false}
              style={{ left: `${x}%`, top: `${y}%`, rotate: `${(index % 5 - 2) * 13}deg`, width: `${6.6+(weights[index]-100)*.035}%`, zIndex: Math.round(y*10) }} alt="" />)}
          </div>
          <img shuku-edit-id="e-09b52b51-eb03-40b5-b24a-874ed6a1bded" className="aipe-showcase-rl-cao-boat-front" src={asset('boat-rectangular.png')} alt="" aria-hidden="true" draggable={false} />
          <svg shuku-edit-id="e-1ef15df6-cb90-4a1d-b67b-14221eed897a" className="aipe-showcase-rl-cao-hull-ruler" viewBox="0 0 32 120" aria-hidden="true"><path shuku-edit-id="e-54b3a6f8-ce2c-4f2b-9cd3-622dfde80476" d="M6 1V119" />{Array.from({ length: 13 }, (_, i) => <path shuku-edit-id="e-f0e806ef-24af-476c-9cbd-d22601242d7d" key={i} d={`M6 ${i * 9 + 5}h${i % 3 === 0 ? 22 : 12}`} />)}</svg>
        </div>
        {flying.map((index,i)=><div shuku-edit-id="e-f0d4d3f4-e60f-438b-880a-f2d2b051afda" key={index} className="aipe-showcase-rl-cao-flight" style={{ '--aipe-showcase-rl-landing-x': `${20 + stonePositions[index][0] * 9.7 - 179}px`, '--aipe-showcase-rl-landing-y': `${360 + stonePositions[index][1] * 3.5 + sink - 15}px`, animationDelay: `${(index-flightStart.current)*80}ms` } as CSSProperties} aria-hidden="true"><img shuku-edit-id="e-64f258d5-4c53-4848-b403-ef2823fcd764" src={stoneAsset(index)} alt="" /></div>)}
        <div shuku-edit-id="e-ec82309f-391e-487c-8532-aaa12912cf0f" className="aipe-showcase-rl-cao-water-front" aria-hidden="true"><canvas shuku-edit-id="e-cdd9018a-9e56-493d-af6e-50144e2bdd5d" ref={waterRef} width={1000} height={900} className="aipe-showcase-rl-cao-water-texture" /><div shuku-edit-id="e-461d1ab3-3fa3-4060-8166-0bb97071e8e0" className="aipe-showcase-rl-cao-water-rim" /></div>
        {targetRecorded && <div shuku-edit-id="e-4ccc2b8d-7f43-46ae-a5f0-d1b28352c317" className="aipe-showcase-rl-cao-target" style={{ top: targetY, transition: storyPhase !== 'before-elephant' ? 'none' : undefined }} title="大象上船时留下的刻痕"><i shuku-edit-id="e-08d67f50-7bae-4d70-9b6d-206bc0947914" /><Typography shuku-edit-id="e-fcba13f7-da63-468d-a0de-735ccf14c91d" variant="bodySmall" as="span" tone="inherit">{`大象水位 · 下沉 ${TARGET_DEPTH_CM.toFixed(1)} 厘米`}</Typography></div>}
        <div shuku-edit-id="e-41417644-f778-4347-aea5-78f1bc4a38dd" className="aipe-showcase-rl-cao-empty-mark" aria-hidden="true" style={{ top: 610 + sink, transition: storyPhase !== 'before-elephant' ? 'none' : undefined }} />
        {phase === 'settling' && <div shuku-edit-id="e-5e6d57f3-942b-488a-9625-8e3f955a1520" key={count} className="aipe-showcase-rl-cao-ripple" aria-hidden="true"><i shuku-edit-id="e-731d5ebc-5469-47b3-971e-631597fd0ee4" /><i shuku-edit-id="e-ed8078fe-6c12-457a-9f5a-5c09485f0a36" /><i shuku-edit-id="e-f366cca6-b327-4745-a4b6-c1e470025e89" /></div>}
        <div shuku-edit-id="e-cabde3d4-079c-4cb2-83a4-dcc9339debe3" className="aipe-showcase-rl-cao-depth"><Typography shuku-edit-id="e-ab06b03c-ac70-4c0b-89fb-9c0e0e5932f9" variant="body" tone="inherit">{`下沉 ${depth.toFixed(1)} 厘米`}</Typography></div>
        <div shuku-edit-id="e-a1a289af-0d90-4b36-8d9b-785037ad19b8" className="aipe-showcase-rl-cao-stone-control">
          <Button className="aipe-showcase-rl-cao-stone-button" onClick={storyPhase === 'before-elephant' ? loadElephant : dropStone} disabled={phase !== 'idle' || completed} aria-label={completed ? '石头用完了' : storyPhase === 'before-elephant' ? '点击称重' : storyPhase === 'stones' ? `投放${batchSize}块石头，共${nextBatchMass}千克` : '称重中'}>
            <img shuku-edit-id="e-9ad822b6-9b06-426c-9d70-4a97398f8477" src={storyPhase === 'stones' ? stoneAsset(completed ? MAX_STONES - 1 : count) : asset('elephant.png')} alt="" draggable={false} />
            {completed && <span shuku-edit-id="e-3bcbfa25-ad98-482e-b64f-a98fd2b6be89" className="aipe-showcase-rl-cao-stone-forbid" aria-hidden="true"><Forbid theme="outline" size={142} fill="#ff715e" strokeWidth={3} /></span>}
            {!completed && <Typography shuku-edit-id="e-b362e446-34b9-46c2-a7db-e97884467078" as="span" variant="h3" tone="inherit">{storyPhase === 'before-elephant' ? '点击称重' : storyPhase === 'unloading-elephant' ? '自动下船…' : storyPhase !== 'stones' ? '称重中…' : phase === 'falling' ? '石头落下…' : phase === 'settling' ? '记录水位…' : `投放 ${batchSize} 块`}</Typography>}
            {!completed && <Typography shuku-edit-id="e-972cac9d-24b3-48fa-af72-6b93f69be622" as="span" variant="body" tone="inherit">{storyPhase === 'stones' ? `本次 ${nextBatchMass} 千克` : targetRecorded ? `已记下 ${TARGET_DEPTH_CM.toFixed(1)} 厘米` : '自动记录水位'}</Typography>}
            {storyPhase === 'stones' && !completed && <Typography shuku-edit-id="e-a864ece5-07a4-4e71-a04f-1fde44d2e9b8" as="span" variant="body" tone="inherit">剩余 {MAX_STONES - count} 块</Typography>}
          </Button>
        </div>
        {completed && <div shuku-edit-id="e-d4f0a671-b85f-433c-ad4d-d3f3b40c4e02" className="aipe-showcase-rl-cao-result" role="status"><Typography shuku-edit-id="e-cb00eea4-b34d-4b97-8c2b-565704481758" variant="h3" tone="inherit">石头用完了</Typography><Typography shuku-edit-id="e-126abd73-2e68-4442-9894-f6c079898511" variant="body" tone="inherit">1500 千克，仍没到刻痕。</Typography><Typography shuku-edit-id="e-d10cc9e9-6f17-43e9-911c-b26137480773" variant="body" tone="inherit">能估出象重吗？</Typography></div>}
      </div>

      <section shuku-edit-id="e-fbe0b80f-b0e8-4e97-b7b7-9eb1d2b15206" className="aipe-showcase-rl-cao-notebook" aria-label="称象实验记录本">
        <div shuku-edit-id="e-a34ef238-6064-4d0c-bf72-4ba2cbc30a2b" className="aipe-showcase-rl-cao-book-binding" aria-hidden="true"><i shuku-edit-id="e-969f8d5d-df8b-4dab-bc08-c7738c135cff" /><i shuku-edit-id="e-05967094-d9f2-481f-a692-28b1ddcfc291" /><i shuku-edit-id="e-9e4dface-fc93-4076-85ad-1b13489f86da" /></div>
        <div shuku-edit-id="e-5036562e-562c-44af-aa56-cb767aaf66d8" className="aipe-showcase-rl-cao-book-header"><Typography shuku-edit-id="e-6a9d0093-3eeb-4927-bbbc-f6b58d8cd9b3" variant="h3" tone="accent">投石手记</Typography><Typography shuku-edit-id="e-b1aa7ae2-08a3-4a99-8a64-585ea9014ed9" variant="bodySmall" tone="muted">{records.length} 条记录</Typography></div>
        <Typography shuku-edit-id="e-b7cd8f57-21ea-466f-9fb3-150a2c5105fc" variant="bodySmall" tone={targetRecorded ? 'accent' : 'muted'} className="aipe-showcase-rl-cao-elephant-record">{targetRecorded ? `大象水位：${TARGET_DEPTH_CM.toFixed(1)} 厘米` : '大象水位：待记录'}</Typography>
        <EChartsChart className="aipe-showcase-rl-cao-chart" option={option} minHeight={0} aria-label={`石重与下沉深度散点图，共${records.length}个点`} />
        <div shuku-edit-id="e-feba5035-b179-42e6-9b7d-830c0eb09d0c" className="aipe-showcase-rl-cao-book-footer"><Button onClick={reset}>重新开始</Button></div>
      </section>
    </div>
  </section>;
}

