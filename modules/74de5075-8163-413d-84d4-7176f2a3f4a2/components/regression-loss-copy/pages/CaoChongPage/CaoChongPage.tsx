import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { saveRecordedData } from '../../regressionData';
import { Forbid } from '@icon-park/react';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Button, EChartsChart, Typography } from "@shuku/course-style/react";
import { depthForMass, MAX_STONES, createStoneWeights, resetElephantMeasurement, stonePositions, TARGET_DEPTH_CM, type Observation } from './experiment';
import './CaoChongPage.css';

const assetId = '74de5075-8163-413d-84d4-7176f2a3f4a2';
const asset = (name: string) => moduleAssetUrl(`regression-loss-copy/cao-chong/${name}`);
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

  return <section shuku-edit-id="e-c9425fac-673b-4875-b3b4-c7439de0ff7d" className="spp-regression-cao-page" aria-labelledby="spp-regression-cao-title">
    <div shuku-edit-id="e-53410503-172f-480d-a699-890f1bdc6e64" className="spp-regression-cao-world" style={{ '--spp-regression-landscape': `url("${asset('river-video-poster.jpg')}")`, '--spp-regression-sink': `${sink}px` } as CSSProperties} data-phase={phase} data-count={count}>
      <video shuku-edit-id="e-9c01d324-79a4-446a-b127-959de26c7ae7" ref={videoRef} className="spp-regression-cao-scenery" src={asset('river-motion.mp4')} poster={asset('river-video-poster.jpg')} autoPlay loop muted playsInline preload="auto" aria-hidden="true" />
      <div shuku-edit-id="e-cc0d4539-da00-4a57-ad4a-685450adf8a8" className="spp-regression-cao-atmosphere" aria-hidden="true" />
      <header shuku-edit-id="e-3f624a4e-57d8-4cf2-8e5e-862e2efd38a7" className="spp-regression-cao-hero">
        <Typography shuku-edit-id="e-b7552b96-6e15-4f7c-9afe-d087060ba0c9" as="h1" variant="display" tone="inherit" className="spp-regression-cao-title" id="spp-regression-cao-title">曹冲称象</Typography>
        <Typography shuku-edit-id="e-c1c2b43c-91c7-46b3-916f-44d81e3cd1b4" as="p" variant="bodySmall" tone="inherit" className="spp-regression-cao-subtitle">曹操想知道大象有多重，曹冲便让大象上船，在船身刻下水位。再换上石头，装到同一水位时，石头的总重就是象重。</Typography>
      </header>
      <div shuku-edit-id="e-95e09cae-a6f2-41f5-9e05-2c0574f2f28d" className="spp-regression-cao-scene" aria-label="称象实验：船随石重下沉，水面保持固定">
        <div shuku-edit-id="e-7b686e7a-09f7-4103-855e-eba45ab95bd6" className="spp-regression-cao-water-back" aria-hidden="true" />
        <div shuku-edit-id="e-5eaaef8f-017e-47c9-9ec8-a2146410d3bb" className="spp-regression-cao-reflection" aria-hidden="true" />
        <div shuku-edit-id="e-0f751a9f-613b-428d-b6a1-c15c0d36439a" className="spp-regression-cao-boat-motion" data-testid="boat" style={{ transform: `translateY(${sink}px)`, transition: storyPhase !== 'before-elephant' ? 'none' : undefined }}>
          <img shuku-edit-id="e-028e8ba6-655b-4ab8-b404-aa3a8afbed1a" className="spp-regression-cao-boat-back" src={asset('boat-rectangular.png')} alt="直壁平底、船上无人的长方体木船" draggable={false} />
          <img shuku-edit-id="e-c83749a0-ba0e-4207-be5a-2ca63a3cba61" className="spp-regression-cao-elephant" data-aboard={elephantAboard} src={asset('elephant.png')} alt={elephantAboard ? '上船称重的大象' : ''} aria-hidden={!elephantAboard} draggable={false} />
          <div shuku-edit-id="e-1d5bcd85-85df-4ec1-9463-65cc79ac8a35" className="spp-regression-cao-cargo" aria-hidden="true">
            {stonePositions.slice(0, count).map(([x, y], index) => <img shuku-edit-id="e-466348f7-03d5-4ebb-b872-1fa56942e7b9" key={index} className="spp-regression-cao-loaded-rock" src={stoneAsset(index)} draggable={false}
              style={{ left: `${x}%`, top: `${y}%`, rotate: `${(index % 5 - 2) * 13}deg`, width: `${6.6+(weights[index]-100)*.035}%`, zIndex: Math.round(y*10) }} alt="" />)}
          </div>
          <img shuku-edit-id="e-5724c45d-53cd-4397-995a-bc1d88bf1d48" className="spp-regression-cao-boat-front" src={asset('boat-rectangular.png')} alt="" aria-hidden="true" draggable={false} />
          <svg shuku-edit-id="e-aae79060-38f9-4973-971f-b96cf53ca0a9" className="spp-regression-cao-hull-ruler" viewBox="0 0 32 120" aria-hidden="true"><path shuku-edit-id="e-89ad3c6f-9043-46e2-aef9-527fafabbc36" d="M6 1V119" />{Array.from({ length: 13 }, (_, i) => <path shuku-edit-id="e-c0830da8-c4a1-4f69-bb4d-bf263b209a37" key={i} d={`M6 ${i * 9 + 5}h${i % 3 === 0 ? 22 : 12}`} />)}</svg>
        </div>
        {flying.map((index,i)=><div shuku-edit-id="e-34c91cef-3606-4301-83d0-1bbfcbdf5ff1" key={index} className="spp-regression-cao-flight" style={{ '--spp-regression-landing-x': `${20 + stonePositions[index][0] * 9.7 - 179}px`, '--spp-regression-landing-y': `${360 + stonePositions[index][1] * 3.5 + sink - 15}px`, animationDelay: `${(index-flightStart.current)*80}ms` } as CSSProperties} aria-hidden="true"><img shuku-edit-id="e-c6b33335-ded3-4e58-afec-69280a352d64" src={stoneAsset(index)} alt="" /></div>)}
        <div shuku-edit-id="e-236d991b-d88f-4b79-8358-37ad6afba13f" className="spp-regression-cao-water-front" aria-hidden="true"><canvas shuku-edit-id="e-1b5b53a6-1350-4bb3-853e-38f6998cc3d2" ref={waterRef} width={1000} height={900} className="spp-regression-cao-water-texture" /><div shuku-edit-id="e-86731863-5f35-471f-abdc-bf86511a26a0" className="spp-regression-cao-water-rim" /></div>
        {targetRecorded && <div shuku-edit-id="e-71444964-5bc2-48a0-8f9a-f0707d33b5bf" className="spp-regression-cao-target" style={{ top: targetY, transition: storyPhase !== 'before-elephant' ? 'none' : undefined }} title="大象上船时留下的刻痕"><i shuku-edit-id="e-7d4e9cce-374e-4190-b943-f3e8354fad44" /><Typography shuku-edit-id="e-b03933a9-f7ac-4e7d-a782-502760d75461" variant="bodySmall" as="span" tone="inherit">{`大象水位 · 下沉 ${TARGET_DEPTH_CM.toFixed(1)} 厘米`}</Typography></div>}
        <div shuku-edit-id="e-aca20957-f901-433e-a79d-ed92a6368ae6" className="spp-regression-cao-empty-mark" aria-hidden="true" style={{ top: 610 + sink, transition: storyPhase !== 'before-elephant' ? 'none' : undefined }} />
        {phase === 'settling' && <div shuku-edit-id="e-e518d73b-dd70-4c72-9689-ecbb5e89bd13" key={count} className="spp-regression-cao-ripple" aria-hidden="true"><i shuku-edit-id="e-83703a13-f48a-4476-b891-b84f051e5a13" /><i shuku-edit-id="e-1d2ad267-dc03-4de7-b554-9c969819db0f" /><i shuku-edit-id="e-1417926d-e1ee-40d5-b361-34b1f3d6ef67" /></div>}
        <div shuku-edit-id="e-8086de9b-2406-4cb5-a112-6e2d28867c3e" className="spp-regression-cao-depth"><Typography shuku-edit-id="e-a792f209-41ac-489c-b59a-6ad41b0211a8" variant="body" tone="inherit">{`下沉 ${depth.toFixed(1)} 厘米`}</Typography></div>
        <div shuku-edit-id="e-1158da1c-06b2-4aec-8ed1-121b0f287da2" className="spp-regression-cao-stone-control">
          <Button className="spp-regression-cao-stone-button" onClick={storyPhase === 'before-elephant' ? loadElephant : dropStone} disabled={phase !== 'idle' || completed} aria-label={completed ? '石头用完了' : storyPhase === 'before-elephant' ? '点击称重' : storyPhase === 'stones' ? `投放${batchSize}块石头，共${nextBatchMass}千克` : '称重中'}>
            <img shuku-edit-id="e-b04c4a2f-0aa0-4527-bf32-f800ff16cc8c" src={storyPhase === 'stones' ? stoneAsset(completed ? MAX_STONES - 1 : count) : asset('elephant.png')} alt="" draggable={false} />
            {completed && <span shuku-edit-id="e-c2e46d6a-baea-4159-b807-727fd55e0e33" className="spp-regression-cao-stone-forbid" aria-hidden="true"><Forbid theme="outline" size={142} fill="#ff715e" strokeWidth={3} /></span>}
            {!completed && <Typography shuku-edit-id="e-c82687df-dd33-46bb-8f3a-a0369849f75c" as="span" variant="h3" tone="inherit">{storyPhase === 'before-elephant' ? '点击称重' : storyPhase === 'unloading-elephant' ? '自动下船…' : storyPhase !== 'stones' ? '称重中…' : phase === 'falling' ? '石头落下…' : phase === 'settling' ? '记录水位…' : `投放 ${batchSize} 块`}</Typography>}
            {!completed && <Typography shuku-edit-id="e-538c3785-b310-41a6-981c-66b68d1bd646" as="span" variant="body" tone="inherit">{storyPhase === 'stones' ? `本次 ${nextBatchMass} 千克` : targetRecorded ? `已记下 ${TARGET_DEPTH_CM.toFixed(1)} 厘米` : '自动记录水位'}</Typography>}
            {storyPhase === 'stones' && !completed && <Typography shuku-edit-id="e-7d5b1dd9-d284-457b-ad64-b44df5bad50b" as="span" variant="body" tone="inherit">剩余 {MAX_STONES - count} 块</Typography>}
          </Button>
        </div>
        {completed && <div shuku-edit-id="e-90a8b367-cffe-41df-b6aa-4f083aa08a1e" className="spp-regression-cao-result" role="status"><Typography shuku-edit-id="e-285b2e0f-8a23-4238-a9a6-9e7bda981ea8" variant="h3" tone="inherit">石头用完了</Typography><Typography shuku-edit-id="e-a96fa11f-cee1-45bb-82d1-8d8dbc3b2448" variant="body" tone="inherit">1500 千克，仍没到刻痕。</Typography><Typography shuku-edit-id="e-08d0807d-e077-4b12-91cb-92c1bd6b8205" variant="body" tone="inherit">能估出象重吗？</Typography></div>}
      </div>

      <section shuku-edit-id="e-ebc764eb-9378-4024-b3a7-6fbe1abf6fc3" className="spp-regression-cao-notebook" aria-label="称象实验记录本">
        <div shuku-edit-id="e-d80da7d1-6310-48cc-8686-fdc2ddf935d9" className="spp-regression-cao-book-binding" aria-hidden="true"><i shuku-edit-id="e-771117d6-7b27-4da1-82a7-5c31182d1958" /><i shuku-edit-id="e-99fa01f0-4421-425c-8be8-f585b97f936a" /><i shuku-edit-id="e-297f9d55-e0e0-40c1-857c-1f2cdb45fd54" /></div>
        <div shuku-edit-id="e-bde42de1-5b67-4752-935e-5fb59444b823" className="spp-regression-cao-book-header"><Typography shuku-edit-id="e-7e6464bb-6926-43c8-8655-cd92fd4aac84" variant="h3" tone="accent">投石手记</Typography><Typography shuku-edit-id="e-4f5e329a-d137-47c2-ac0f-9cff47024618" variant="bodySmall" tone="muted">{records.length} 条记录</Typography></div>
        <Typography shuku-edit-id="e-677b487b-0cb6-4cff-b45d-9c1339167661" variant="bodySmall" tone={targetRecorded ? 'accent' : 'muted'} className="spp-regression-cao-elephant-record">{targetRecorded ? `大象水位：${TARGET_DEPTH_CM.toFixed(1)} 厘米` : '大象水位：待记录'}</Typography>
        <EChartsChart className="spp-regression-cao-chart" option={option} minHeight={0} aria-label={`石重与下沉深度散点图，共${records.length}个点`} />
        <div shuku-edit-id="e-e69201e2-9fb8-4b12-ad9a-0806769d8ab3" className="spp-regression-cao-book-footer"><Button onClick={reset}>重新开始</Button></div>
      </section>
    </div>
  </section>;
}

