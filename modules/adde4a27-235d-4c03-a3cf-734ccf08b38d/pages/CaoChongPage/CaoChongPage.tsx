import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { saveRecordedData } from '../../regressionData';
import { Forbid } from '@icon-park/react';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Button, EChartsChart, Typography } from "@shuku/course-style/react";
import { depthForMass, MAX_STONES, createStoneWeights, resetElephantMeasurement, stonePositions, TARGET_DEPTH_CM, type Observation } from './experiment';
import './CaoChongPage.css';

const assetId = 'adde4a27-235d-4c03-a3cf-734ccf08b38d';
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

  return <section shuku-edit-id="e-f7fdba72-985e-432d-980f-04a8f23dc4c4" className="rl-cao-page" aria-labelledby="rl-cao-title">
    <div shuku-edit-id="e-1a4a7130-af8c-41bc-9e55-417f1a7d5a3c" className="rl-cao-world" style={{ '--rl-landscape': `url("${asset('river-video-poster.jpg')}")`, '--rl-sink': `${sink}px` } as CSSProperties} data-phase={phase} data-count={count}>
      <video shuku-edit-id="e-f3ce3528-5840-46d7-9b14-eacf98862229" ref={videoRef} className="rl-cao-scenery" src={asset('river-motion.mp4')} poster={asset('river-video-poster.jpg')} autoPlay loop muted playsInline preload="auto" aria-hidden="true" />
      <div shuku-edit-id="e-877af073-67f6-4635-b019-cc056463076f" className="rl-cao-atmosphere" aria-hidden="true" />
      <header shuku-edit-id="e-c5c05e31-db69-4dd2-9c5f-55d259704e36" className="rl-cao-hero">
        <Typography shuku-edit-id="e-57e061a0-6b87-49bc-8e07-8df26e95eaa8" as="h1" variant="display" tone="inherit" className="rl-cao-title" id="rl-cao-title">曹冲称象</Typography>
        <Typography shuku-edit-id="e-b10cdb6c-d166-4caf-a417-a8cae310aaa0" as="p" variant="bodySmall" tone="inherit" className="rl-cao-subtitle">曹操想知道大象有多重，曹冲便让大象上船，在船身刻下水位。再换上石头，装到同一水位时，石头的总重就是象重。</Typography>
      </header>
      <div shuku-edit-id="e-c9f8e185-1515-4911-80c5-4a210526e880" className="rl-cao-scene" aria-label="称象实验：船随石重下沉，水面保持固定">
        <div shuku-edit-id="e-49f9bd89-0e3a-4e5d-b531-b705326007c3" className="rl-cao-water-back" aria-hidden="true" />
        <div shuku-edit-id="e-865f5787-2fb0-49ea-a136-92f3db968dcf" className="rl-cao-reflection" aria-hidden="true" />
        <div shuku-edit-id="e-ee9abe39-dd55-4dab-a451-d7e3ab118482" className="rl-cao-boat-motion" data-testid="boat" style={{ transform: `translateY(${sink}px)`, transition: storyPhase !== 'before-elephant' ? 'none' : undefined }}>
          <img shuku-edit-id="e-d90ca098-9f73-4646-9f87-c00941a9c6aa" className="rl-cao-boat-back" src={asset('boat-rectangular.png')} alt="直壁平底、船上无人的长方体木船" draggable={false} />
          <img shuku-edit-id="e-c9fbfa09-6375-426b-b09f-578cc7de5db1" className="rl-cao-elephant" data-aboard={elephantAboard} src={asset('elephant.png')} alt={elephantAboard ? '上船称重的大象' : ''} aria-hidden={!elephantAboard} draggable={false} />
          <div shuku-edit-id="e-9d9acba1-87c5-499d-a583-d999a1ff6df5" className="rl-cao-cargo" aria-hidden="true">
            {stonePositions.slice(0, count).map(([x, y], index) => <img shuku-edit-id="e-e4b26ac9-4edb-4b39-973b-ca25e378f4cf" key={index} className="rl-cao-loaded-rock" src={stoneAsset(index)} draggable={false}
              style={{ left: `${x}%`, top: `${y}%`, rotate: `${(index % 5 - 2) * 13}deg`, width: `${6.6+(weights[index]-100)*.035}%`, zIndex: Math.round(y*10) }} alt="" />)}
          </div>
          <img shuku-edit-id="e-8f029d64-a96b-4594-87d8-6ce641551bbb" className="rl-cao-boat-front" src={asset('boat-rectangular.png')} alt="" aria-hidden="true" draggable={false} />
          <svg shuku-edit-id="e-167d8170-7cbe-4a0b-b5ab-0e3a9f754dba" className="rl-cao-hull-ruler" viewBox="0 0 32 120" aria-hidden="true"><path shuku-edit-id="e-7036dad6-3c91-4ab6-a536-01cdcbf99573" d="M6 1V119" />{Array.from({ length: 13 }, (_, i) => <path shuku-edit-id="e-857a1152-7446-4f58-ae6b-44afcbb2fad6" key={i} d={`M6 ${i * 9 + 5}h${i % 3 === 0 ? 22 : 12}`} />)}</svg>
        </div>
        {flying.map((index,i)=><div shuku-edit-id="e-65bd0ed3-8bd0-4437-9986-0efaa0ba0d01" key={index} className="rl-cao-flight" style={{ '--rl-landing-x': `${20 + stonePositions[index][0] * 9.7 - 179}px`, '--rl-landing-y': `${360 + stonePositions[index][1] * 3.5 + sink - 15}px`, animationDelay: `${(index-flightStart.current)*80}ms` } as CSSProperties} aria-hidden="true"><img shuku-edit-id="e-fbd9cae0-2c41-4d4b-bca4-b43104281ecb" src={stoneAsset(index)} alt="" /></div>)}
        <div shuku-edit-id="e-cc0865db-c1be-4a6d-8868-a503cf49a161" className="rl-cao-water-front" aria-hidden="true"><canvas shuku-edit-id="e-8fad5bc6-eb33-4873-aa1d-6297291842c9" ref={waterRef} width={1000} height={900} className="rl-cao-water-texture" /><div shuku-edit-id="e-4ef6c46d-7082-4c28-a66e-e3bfe4c918b3" className="rl-cao-water-rim" /></div>
        {targetRecorded && <div shuku-edit-id="e-616efecf-8453-47c5-9bcc-ac2330677a0a" className="rl-cao-target" style={{ top: targetY, transition: storyPhase !== 'before-elephant' ? 'none' : undefined }} title="大象上船时留下的刻痕"><i shuku-edit-id="e-3116729c-9cb4-4626-aac8-c753819a4212" /><Typography shuku-edit-id="e-3abdf00a-a5d6-49fc-81aa-bf618842b842" variant="bodySmall" as="span" tone="inherit">{`大象水位 · 下沉 ${TARGET_DEPTH_CM.toFixed(1)} 厘米`}</Typography></div>}
        <div shuku-edit-id="e-f0528c23-71fb-4d3d-bd3f-2b1699baa3a9" className="rl-cao-empty-mark" aria-hidden="true" style={{ top: 610 + sink, transition: storyPhase !== 'before-elephant' ? 'none' : undefined }} />
        {phase === 'settling' && <div shuku-edit-id="e-7c816707-270c-4c59-a652-1d85c62d2e9b" key={count} className="rl-cao-ripple" aria-hidden="true"><i shuku-edit-id="e-2d322fc3-8bf7-4ce8-9ca5-4386389496e4" /><i shuku-edit-id="e-91c23152-5117-4dbb-b874-012037bbdcf1" /><i shuku-edit-id="e-a5e7fc45-a478-4fb8-b7bc-c0573cc8b222" /></div>}
        <div shuku-edit-id="e-fc17ed45-63a7-4321-ba24-feb46a29e329" className="rl-cao-depth"><Typography shuku-edit-id="e-31f7e6a3-99ba-4fa8-b932-4739383c961d" variant="body" tone="inherit">{`下沉 ${depth.toFixed(1)} 厘米`}</Typography></div>
        <div shuku-edit-id="e-746816a3-025e-47ea-86f1-5e523ff65f9b" className="rl-cao-stone-control">
          <Button className="rl-cao-stone-button" onClick={storyPhase === 'before-elephant' ? loadElephant : dropStone} disabled={phase !== 'idle' || completed} aria-label={completed ? '石头用完了' : storyPhase === 'before-elephant' ? '点击称重' : storyPhase === 'stones' ? `投放${batchSize}块石头，共${nextBatchMass}千克` : '称重中'}>
            <img shuku-edit-id="e-095d4e06-21d1-4405-92da-bac7ef20ac6a" src={storyPhase === 'stones' ? stoneAsset(completed ? MAX_STONES - 1 : count) : asset('elephant.png')} alt="" draggable={false} />
            {completed && <span shuku-edit-id="e-dacaee28-4a99-4009-9fd9-a29a7fa46720" className="rl-cao-stone-forbid" aria-hidden="true"><Forbid theme="outline" size={142} fill="#ff715e" strokeWidth={3} /></span>}
            {!completed && <Typography shuku-edit-id="e-2a92df72-b926-4d00-9ce5-7da835ba50c8" as="span" variant="h3" tone="inherit">{storyPhase === 'before-elephant' ? '点击称重' : storyPhase === 'unloading-elephant' ? '自动下船…' : storyPhase !== 'stones' ? '称重中…' : phase === 'falling' ? '石头落下…' : phase === 'settling' ? '记录水位…' : `投放 ${batchSize} 块`}</Typography>}
            {!completed && <Typography shuku-edit-id="e-9a05a8af-ab82-4231-8276-c75ba089b319" as="span" variant="body" tone="inherit">{storyPhase === 'stones' ? `本次 ${nextBatchMass} 千克` : targetRecorded ? `已记下 ${TARGET_DEPTH_CM.toFixed(1)} 厘米` : '自动记录水位'}</Typography>}
            {storyPhase === 'stones' && !completed && <Typography shuku-edit-id="e-36fb294a-8a11-4fa2-aaa3-2610881c0193" as="span" variant="body" tone="inherit">剩余 {MAX_STONES - count} 块</Typography>}
          </Button>
        </div>
        {completed && <div shuku-edit-id="e-40d494eb-d511-42c5-bbc3-2c282a7c804f" className="rl-cao-result" role="status"><Typography shuku-edit-id="e-506df0f6-2050-4ed0-aac7-aba8346b792e" variant="h3" tone="inherit">石头用完了</Typography><Typography shuku-edit-id="e-67409f8c-da01-45a4-8f49-b6193555e93c" variant="body" tone="inherit">1500 千克，仍没到刻痕。</Typography><Typography shuku-edit-id="e-b1a3a46d-d407-4135-90c9-f64b35292e21" variant="body" tone="inherit">能估出象重吗？</Typography></div>}
      </div>

      <section shuku-edit-id="e-b818b1e8-0b07-4797-838d-a6bca13eda0a" className="rl-cao-notebook" aria-label="称象实验记录本">
        <div shuku-edit-id="e-866a7a26-f0a9-4414-8c98-ace11e9b0143" className="rl-cao-book-binding" aria-hidden="true"><i shuku-edit-id="e-a8d8bc16-2c81-4648-a80c-70bdcf22cf88" /><i shuku-edit-id="e-f2138cbe-227b-429d-8da0-0fc193c53dcc" /><i shuku-edit-id="e-3cb7fa5d-618c-480e-b121-5661368e39a7" /></div>
        <div shuku-edit-id="e-ebba80b1-e7b8-44c0-98b7-ac22df4cdeaf" className="rl-cao-book-header"><Typography shuku-edit-id="e-6a943ab7-f843-451d-87e6-e759eea9fbcc" variant="h3" tone="accent">投石手记</Typography><Typography shuku-edit-id="e-ffa2b0f6-d47a-41e3-900b-b5d04ea68e95" variant="bodySmall" tone="muted">{records.length} 条记录</Typography></div>
        <Typography shuku-edit-id="e-493960b7-908e-4496-99a4-2b56566add73" variant="bodySmall" tone={targetRecorded ? 'accent' : 'muted'} className="rl-cao-elephant-record">{targetRecorded ? `大象水位：${TARGET_DEPTH_CM.toFixed(1)} 厘米` : '大象水位：待记录'}</Typography>
        <EChartsChart className="rl-cao-chart" option={option} minHeight={0} aria-label={`石重与下沉深度散点图，共${records.length}个点`} />
        <div shuku-edit-id="e-45f56e52-5a6f-4789-8051-8db5214dca41" className="rl-cao-book-footer"><Button onClick={reset}>重新开始</Button></div>
      </section>
    </div>
  </section>;
}

