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
    early:'了解已有研究，帮助判断想法从哪里出发。',
    growth:'论文持续增加，逐篇阅读越来越难。',
    ai:'先筛选相关研究，把时间留给关键方法与证据。',
    limit:'从大量论文中，找到值得理解和实践的内容。',
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

  return <ContentBlock shuku-edit-id="e-925d4c28-14b3-41e0-9289-63ccf94e4c37" data-scene-id="3a66a203-9cea-41c6-ab20-b71d57733afe" className="rie-iclr-page" headingLevel={1} title={outline.pages.find(page => page.id === '3a66a203-9cea-41c6-ab20-b71d57733afe')!.title}
    bodyClassName="rie-iclr-body">
    <div shuku-edit-id="e-19b3a0cf-2dd7-4168-b052-a669bf681600" className="rie-iclr-stage" ref={stageRef} data-year={selected.year} data-playing={playing} data-capture-ready={ready && !playing}>
      <PaperReliefScene year={selected.year} previousYear={previousYear} count={selected.count} onReadyChange={onReadyChange}/>
      <div shuku-edit-id="e-e8b9c334-4e28-49a5-8be9-b15ddad27cb4" className="rie-iclr-count" aria-live={playing?'off':'polite'} aria-atomic="true">
        <Typography shuku-edit-id="e-a6b55869-576e-46d5-8f22-7ae3a58d0b70" as="p" variant="bodySmall" tone="accent">ICLR 当年投稿量</Typography>
        <div shuku-edit-id="e-56a61ccb-9858-4bd7-b533-64fc0dd2e00b" className="rie-iclr-count-line">
          <Typography shuku-edit-id="e-2ac8c74d-4649-42ea-ad6d-ca657eb3de25" as="span" variant="h1" tone="inherit">{formatSubmissionCount(selected)}</Typography>
          <Typography shuku-edit-id="e-37c9481a-cb83-4ce7-8b0e-36f7701b00d7" as="span" variant="h3" tone="accent">篇</Typography>
        </div>
      </div>
    </div>
    <div shuku-edit-id="e-e58a1f78-3cd6-47e1-a947-3fd4cdea12cf" className="rie-iclr-caption" data-caption-phase={captionPhase}
      aria-live={playing?'off':'polite'} aria-atomic="true">
      <Typography shuku-edit-id="e-2ddafcc6-6bbb-4266-af6b-ae5caa9f8214" as="p" variant="bodySmall" tone="accent">{caption}</Typography>
    </div>
    <div shuku-edit-id="e-8458e3c7-3693-4527-b8ac-e8601fa068bc" className="rie-iclr-timeline" onKeyDown={event=>event.stopPropagation()}>
      <div shuku-edit-id="e-47104053-90f5-4ad5-8ea2-9531676d5b2b" className="rie-iclr-track">
        <RangeControl label="年份" aria-label="年份" min={0} max={lastIndex} step={1} value={index}
          controlClassName="rie-iclr-range-control" className="rie-iclr-range"
          onChange={event=>selectYear(Number(event.currentTarget.value))} onPointerDown={()=>setPlaying(false)}
          formatValue={value=>`${iclrSubmissions[Number(value)].year} 年，${formatSubmissionCount(iclrSubmissions[Number(value)])} 篇投稿`}/>
        <div shuku-edit-id="e-e73a6cfe-2e1a-40b0-be5e-6ce2faac93aa" className="rie-iclr-track-line" aria-hidden="true"/>
        <div shuku-edit-id="e-b881650b-405f-4979-b2a4-b343b90dd495" className="rie-iclr-ticks">
          {iclrSubmissions.map((item,tickIndex)=><Button key={item.year}
            className={`rie-iclr-tick${tickIndex===index?' is-selected':''}`} style={{left:`${tickIndex/lastIndex*100}%`}}
            onClick={()=>selectYear(tickIndex)} aria-pressed={tickIndex===index}
            aria-label={`查看 ${item.year} 年，${formatSubmissionCount(item)} 篇投稿`}>
            <i shuku-edit-id="e-8e4d679d-50af-4d69-a075-e698d85564eb" className="rie-iclr-dot" aria-hidden="true"/>
            <Typography shuku-edit-id="e-48188145-70cc-4b8a-b6d2-191b101fde9c" as="span" variant="bodySmall" tone="inherit">{item.year}</Typography>
          </Button>)}
        </div>
      </div>
    </div>
  </ContentBlock>;
}
