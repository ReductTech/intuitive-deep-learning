import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, RangeControl, Typography } from '../../../shared/react';
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

  return <ContentBlock data-scene-id="publication-growth" className="rie-iclr-page" headingLevel={1} title={outline.pages[5].title}
    subtitle="单个学术会议的年度投稿量，已从数十篇增至数万篇" bodyClassName="rie-iclr-body">
    <div className="rie-iclr-stage" ref={stageRef} data-year={selected.year} data-playing={playing} data-capture-ready={ready && !playing}>
      <PaperReliefScene year={selected.year} previousYear={previousYear} count={selected.count} onReadyChange={onReadyChange}/>
      <div className="rie-iclr-count" aria-live={playing?'off':'polite'} aria-atomic="true">
        <Typography as="p" variant="bodySmall" tone="accent">当年投稿量</Typography>
        <div className="rie-iclr-count-line">
          <Typography as="span" variant="h1" tone="inherit">{formatSubmissionCount(selected)}</Typography>
          <Typography as="span" variant="h3" tone="accent">篇</Typography>
        </div>
      </div>
    </div>
    <div className="rie-iclr-caption" data-caption-phase={captionPhase}
      aria-live={playing?'off':'polite'} aria-atomic="true">
      <Typography as="p" variant="bodySmall" tone="accent">{caption}</Typography>
    </div>
    <div className="rie-iclr-timeline" onKeyDown={event=>event.stopPropagation()}>
      <div className="rie-iclr-track">
        <RangeControl label="年份" aria-label="年份" min={0} max={lastIndex} step={1} value={index}
          controlClassName="rie-iclr-range-control" className="rie-iclr-range"
          onChange={event=>selectYear(Number(event.currentTarget.value))} onPointerDown={()=>setPlaying(false)}
          formatValue={value=>`${iclrSubmissions[Number(value)].year} 年，${formatSubmissionCount(iclrSubmissions[Number(value)])} 篇投稿`}/>
        <div className="rie-iclr-track-line" aria-hidden="true"/>
        <div className="rie-iclr-ticks">
          {iclrSubmissions.map((item,tickIndex)=><Button key={item.year}
            className={`rie-iclr-tick${tickIndex===index?' is-selected':''}`} style={{left:`${tickIndex/lastIndex*100}%`}}
            onClick={()=>selectYear(tickIndex)} aria-pressed={tickIndex===index}
            aria-label={`查看 ${item.year} 年，${formatSubmissionCount(item)} 篇投稿`}>
            <i className="rie-iclr-dot" aria-hidden="true"/>
            <Typography as="span" variant="bodySmall" tone="inherit">{item.year}</Typography>
          </Button>)}
        </div>
      </div>
    </div>
  </ContentBlock>;
}
