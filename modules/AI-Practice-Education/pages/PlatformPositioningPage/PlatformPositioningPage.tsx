import { useEffect, useId, useRef, useState } from 'react';
import { ContentBlock, Typography } from '../../../shared/react';
import outline from '../../outlines.json';
import { PlatformCapabilityIcon } from './PlatformCapabilityIcons';
import './PlatformPositioningPage.css';

const capabilities = [
  { id: 'information', title: '科研信息供给', caption: '质量评价　个性推荐' },
  { id: 'content', title: '知识重组与内容生成', caption: '知识组织　渐进理解' },
  { id: 'practice', title: '编程与可视化实践', caption: '核心实现　实验验证' },
  { id: 'evaluation', title: '学习者建模与评价', caption: '多元证据　反馈改进' },
] as const;
const centers = [183.25, 573.75, 964.25, 1354.75];

function ModelFoundation({ active }: { active: number | null }) {
  const id = `aipf-base-${useId().replaceAll(':', '')}`;
  return <div className="aipf-foundation" aria-label="多模态大模型共同支撑四个环节">
    <svg className="aipf-foundation-shape" viewBox="0 0 1538 220" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-front`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#deedff"/><stop offset="1" stopColor="#f4f9ff"/></linearGradient>
        <linearGradient id={`${id}-top`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#eef6ff"/><stop offset="1" stopColor="#e2efff"/></linearGradient>
        {centers.map((_,index)=><linearGradient key={index} id={`${id}-feed-${index}`} x1="0" y1="0" x2="0" y2="1"><stop stopColor={active===index?'#6ba6ee':'#a2cbff'}/><stop offset="1" stopColor="#edf6ff"/></linearGradient>)}
      </defs>
      <path d="M14 125Q64 103 133 102H1405Q1474 103 1524 125L1514 140H24Z" fill={`url(#${id}-top)`} stroke="#d6e8ff" strokeWidth="1"/>
      {centers.map((center,index)=><path key={center} className="aipf-foundation-feed" data-stage={index} data-active={active===index}
        d={`M${center-82} 126C${center-27} 126 ${center-17} 84 ${center-17} 35H${center-30}L${center} 4l30 31H${center+17}C${center+17} 84 ${center+27} 126 ${center+82} 126Z`} fill={`url(#${id}-feed-${index})`}/>)}
      <path d="M14 125H1524V200Q1524 220 1504 220H34Q14 220 14 200Z" fill={`url(#${id}-front)`}/>
    </svg>
    <Typography as="h2" variant="display" tone="accent" className="aipf-model-label">多模态大模型</Typography>
  </div>;
}

export function PlatformPositioningPage() {
  const root = useRef<HTMLElement>(null);
  const stages = useRef<Array<HTMLElement | null>>([]);
  const [hovered, setHovered] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const [visible, setVisible] = useState(true);
  const active = visible ? hovered ?? focused : null;
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let intersecting = true;
    const update = () => setVisible(intersecting && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; update(); });
    observer.observe(element);
    document.addEventListener('visibilitychange', update);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, []);

  return <ContentBlock ref={root} className="aipe-platform-foundation-page" title={outline.pages[3].title} headingLevel={1} bodyClassName="aipf-body">
    <div className="aipf-composition" data-active={active ?? 'none'}>
      <div className="aipf-stages" role="group" aria-label="科研信息供给、知识内容生成、编程实践与学习评价四个环节">
        {capabilities.map((capability,index)=><section key={capability.id} ref={element=>{stages.current[index]=element;}} className="aipf-stage" data-stage={capability.id} data-active={active===index}
          tabIndex={0} aria-label={`${capability.title}，${capability.caption}；聚焦显示模型对本环节的支撑`}
          onPointerEnter={()=>setHovered(index)} onPointerLeave={()=>setHovered(null)} onFocus={()=>setFocused(index)} onBlur={()=>setFocused(null)}
          onKeyDown={event=>{
            if(event.key==='Escape'){event.currentTarget.blur();setHovered(null);return;}
            if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
            event.preventDefault();
            const next=event.key==='Home'?0:event.key==='End'?3:(index+(event.key==='ArrowRight'?1:3))%4;
            stages.current[next]?.focus();
          }}>
          <div className="aipf-icon-disc"><PlatformCapabilityIcon index={index}/></div>
          <Typography as="h2" variant="h2" tone="accent">{capability.title}</Typography>
          <Typography as="p" variant="body" tone="muted">{capability.caption}</Typography>
        </section>)}
      </div>
      <div className="aipf-step-arrows" aria-hidden="true">{[0,1,2].map(index=><svg key={index} className="aipf-step-arrow" viewBox="0 0 74 30" style={{left:341.5+390.5*index}}><path d="M4 15h64m-11-10 11 10-11 10" fill="none" stroke="#8cbaf0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>)}</div>
      <ModelFoundation active={active}/>
    </div>
  </ContentBlock>;
}
