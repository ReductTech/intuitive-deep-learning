import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, RangeControl, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import { formatSubmissionCount, iclrSubmissions } from './iclrSubmissions';
import { PaperReliefScene } from './PaperReliefScene';
import './PublicationGrowthPage.css';

const lastIndex = iclrSubmissions.length - 1;
// Leave time for the final pile transition, keeping the whole reveal under 6s.
const playbackDuration = 5200;

export function PublicationGrowthPage() {
  const [index,setIndex] = useState(0);
  const [playing,setPlaying] = useState(false);
  const [visible,setVisible] = useState(false);
  const [ready,setReady] = useState(false);
  const [previousYear,setPreviousYear] = useState<number|null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);
  const selected = iclrSubmissions[index];
  const captionPhase = selected.year < 2017 ? 'early' : selected.year < 2022 ? 'growth' : selected.year < 2026 ? 'ai' : 'limit';
  const caption = {
    early:'早期投稿规模较小，研究者尚可逐篇研读。',
    growth:'投稿规模持续扩大，文献阅读负担逐步加重。',
    ai:'AI 研究快速发展，论文投稿量加速增长。',
    limit:'论文数量已远超个人的阅读与理解极限。',
  }[captionPhase];
  const onReadyChange = useCallback((value:boolean) => setReady(value),[]);

  useEffect(() => {
    if (!playing || !ready || !visible) return;
    const started = performance.now();
    const startIndex = indexRef.current;
    let frame = 0;
    const advance = (now:number) => {
      // A frame timestamp can precede this effect's performance.now() reading.
      const next = Math.min(lastIndex,startIndex + Math.floor(Math.max(0,now-started)/playbackDuration*lastIndex));
      if (next !== indexRef.current) {
        setPreviousYear(iclrSubmissions[indexRef.current].year);
        indexRef.current = next;
        setIndex(next);
      }
      if (next === lastIndex) setPlaying(false);
      else frame = requestAnimationFrame(advance);
    };
    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  },[playing,ready,visible]);

  useEffect(() => {
    let inView = false;
    const updateVisibility = () => setVisible(inView && !document.hidden);
    document.addEventListener('visibilitychange',updateVisibility);
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      updateVisibility();
    },{threshold:.25});
    if(stageRef.current)observer.observe(stageRef.current);
    return () => {document.removeEventListener('visibilitychange',updateVisibility);observer.disconnect();};
  },[]);

  useEffect(() => {
    if (!visible) {setPlaying(false);return;}
    indexRef.current = 0;
    setIndex(0);
    setPreviousYear(null);
    setPlaying(true);
  },[visible]);

  function selectYear(next:number) {
    setPlaying(false);
    const bounded=Math.max(0,Math.min(lastIndex,next));
    if(bounded!==index){setPreviousYear(selected.year);indexRef.current=bounded;setIndex(bounded);}
  }

  return <ContentBlock shuku-edit-id="e-b4ca225d-637a-481f-8590-f5f430378bf7" data-scene-id="de5f1df7-6945-48e4-b174-2a4b43e63f5f" className="rie-iclr-page" headingLevel={1} title={outline.pages.find(page => page.id === 'de5f1df7-6945-48e4-b174-2a4b43e63f5f')!.title}
    subtitle="单个学术会议的年度投稿量，已从数十篇增至数万篇" bodyClassName="rie-iclr-body">
    <div shuku-edit-id="e-ab7f5b41-c19b-4323-87a5-1de07ddc6aea" className="rie-iclr-stage" ref={stageRef} data-year={selected.year} data-playing={playing} data-capture-ready={ready && !playing}>
      <PaperReliefScene year={selected.year} previousYear={previousYear} count={selected.count} onReadyChange={onReadyChange}/>
      <div shuku-edit-id="e-72456750-0e3b-4201-9865-1a331660b71f" className="rie-iclr-count" aria-live={playing?'off':'polite'} aria-atomic="true">
        <Typography shuku-edit-id="e-7906d2fd-651e-4213-ad5c-4439e6352953" as="p" variant="bodySmall" tone="accent">当年投稿量</Typography>
        <div shuku-edit-id="e-971e85cd-1590-496a-9f4d-d51b830e8cac" className="rie-iclr-count-line">
          <Typography shuku-edit-id="e-5eec60ed-278b-4951-a18e-f5bbe7fe218a" as="span" variant="h1" tone="inherit">{formatSubmissionCount(selected)}</Typography>
          <Typography shuku-edit-id="e-3f518f65-41b1-445f-8e60-812126c09d2b" as="span" variant="h3" tone="accent">篇</Typography>
        </div>
      </div>
    </div>
    <div shuku-edit-id="e-1626d502-72ac-496e-a154-13928d5357e9" className="rie-iclr-caption" data-caption-phase={captionPhase}
      aria-live={playing?'off':'polite'} aria-atomic="true">
      <Typography shuku-edit-id="e-f916c0b1-2a9d-4b16-982e-b2ab845a4169" as="p" variant="bodySmall" tone="accent">{caption}</Typography>
    </div>
    <div shuku-edit-id="e-9d908286-a11d-4021-8911-52bd597d0ac0" className="rie-iclr-timeline" onKeyDown={event=>event.stopPropagation()}>
      <div shuku-edit-id="e-e80e2a02-3923-4628-8971-0a7d883e372f" className="rie-iclr-track">
        <RangeControl label="年份" aria-label="年份" min={0} max={lastIndex} step={1} value={index}
          controlClassName="rie-iclr-range-control" className="rie-iclr-range"
          onChange={event=>selectYear(Number(event.currentTarget.value))} onPointerDown={()=>setPlaying(false)}
          formatValue={value=>`${iclrSubmissions[Number(value)].year} 年，${formatSubmissionCount(iclrSubmissions[Number(value)])} 篇投稿`}/>
        <div shuku-edit-id="e-15f51ad6-5af7-4147-bd58-ce7453032d18" className="rie-iclr-track-line" aria-hidden="true"/>
        <div shuku-edit-id="e-f1ee3dde-a7d9-4bbe-ac49-6f7338a97b68" className="rie-iclr-ticks">
          {iclrSubmissions.map((item,tickIndex)=><Button key={item.year}
            className={`rie-iclr-tick${tickIndex===index?' is-selected':''}`} style={{left:`${tickIndex/lastIndex*100}%`}}
            onClick={()=>selectYear(tickIndex)} aria-pressed={tickIndex===index}
            aria-label={`查看 ${item.year} 年，${formatSubmissionCount(item)} 篇投稿`}>
            <i shuku-edit-id="e-00624517-9f31-4150-9173-b7c1062dee9d" className="rie-iclr-dot" aria-hidden="true"/>
            <Typography shuku-edit-id="e-63e3ffdd-d5f7-438b-993f-646e74964ba9" as="span" variant="bodySmall" tone="inherit">{item.year}</Typography>
          </Button>)}
        </div>
      </div>
    </div>
  </ContentBlock>;
}
