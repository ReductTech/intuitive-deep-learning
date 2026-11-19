import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import submissions from './neuripsSubmissions.json';
import './ResearchInformationPage.css';

const format = (count: number) => count.toLocaleString('en-US');
const ceiling = 33000;
const readingScene = moduleAssetUrl("research-information/reading-still-life.webp");

export function ResearchInformationPage() {
  const root = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [complete, setComplete] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const active = hovered ?? focused;
  const selected = active === null ? null : submissions[active];
  useEffect(() => {
    let inView = false;
    const update = () => setVisible(inView && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {inView = entry.isIntersecting; update();}, {threshold: .1});
    if (root.current) observer.observe(root.current);
    document.addEventListener('visibilitychange', update);
    return () => {observer.disconnect(); document.removeEventListener('visibilitychange', update);};
  }, []);
  useEffect(() => {
    setComplete(false);
    if (!visible) {setHovered(null); setFocused(null); return;}
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {setComplete(true); return;}
    const timer = window.setTimeout(() => setComplete(true), 2100);
    return () => window.clearTimeout(timer);
  }, [visible]);
  return <ContentBlock shuku-edit-id="e-6e06e522-2ad2-4205-a949-11bc82975cd4" ref={root} className="aipe-neurips-page" headingLevel={1} title={outline.pages.find(page => page.id === 'research-information')!.title}
    subtitle="NeurIPS 主轨道年度投稿量" bodyClassName="aipe-neurips-body">
    <div shuku-edit-id="e-7514bc22-b021-4520-9283-8fee4171e397" className="aipe-neurips-composition" data-active={visible} data-capture-ready={visible && complete}>
      <div shuku-edit-id="e-7c65bf7b-18e9-40f4-aea4-3735d3b6e8b2" className="aipe-neurips-visual">
        <img shuku-edit-id="e-6922b3b9-b1d3-48c4-8f5c-c374c0962035" className="aipe-neurips-reading" src={readingScene} alt="论文、笔记与时钟：阅读和理解需要投入时间"/>
        <div shuku-edit-id="e-44f7a2e0-6aef-4d14-a1e1-4d28433a2a1f" className="aipe-neurips-chart" role="group" onPointerLeave={() => setHovered(null)} aria-label="NeurIPS 2015至2026年投稿量。聚焦或悬停年份查看数量与来源。">
          <Typography shuku-edit-id="e-d314b6ae-e578-44f8-8d3f-a3b0a1dd4c28" as="p" variant="bodySmall" tone="accent" className="aipe-neurips-unit">投稿量（篇）</Typography>
          {selected && <div shuku-edit-id="e-ca3d98bc-4724-42b9-9975-c0a39d606de2" className="aipe-neurips-detail" aria-live="polite">
            <Typography shuku-edit-id="e-d30ed6e2-3099-4f60-b3e5-c5cd7cf1f742" as="span" variant="bodySmall" tone="accent">{selected.year} · {selected.count === null ? '暂无数据' : `${format(selected.count)} 篇`}</Typography>
            <Typography shuku-edit-id="e-e9d7d987-dc97-4695-8631-2dba456bec94" as="a" variant="bodySmall" tone="muted" href={selected.source} target="_blank" rel="noreferrer" title={selected.note}>数据来源 ↗</Typography>
          </div>}
          <div shuku-edit-id="e-31bf62b8-69ea-4dee-b1ba-b03859aa5a63" className="aipe-neurips-plot">
            {[0, 10000, 20000, 30000].map(value => <div shuku-edit-id="e-c199e297-7b4e-4944-b727-34eb94e64ede" key={value} className="aipe-neurips-gridline" style={{bottom: `${value / ceiling * 100}%`}} aria-hidden="true">
              <Typography shuku-edit-id="e-ea929207-258e-465c-a5dc-72380652db3c" as="span" variant="bodySmall" tone="accent">{format(value)}</Typography>
            </div>)}
            <div shuku-edit-id="e-6fadcd05-3d04-4be2-b478-541d06d85b18" className="aipe-neurips-columns">
              {submissions.map((item, index) => {
                return <Button key={item.year} className="aipe-neurips-column" data-year={item.year} data-count={item.count ?? 'unavailable'} data-highlight={active === index}
                  style={{animationDelay: `${index * 120}ms`}}
                  aria-label={`${item.year}年，${item.count === null ? '暂无投稿量数据' : `${format(item.count)}篇投稿`}`}
                  onPointerEnter={() => setHovered(index)}
                  onFocus={() => {setHovered(null); setFocused(index);}} onBlur={() => setFocused(null)}
                  onKeyDown={event => {
                    if (event.key === 'Escape') {event.currentTarget.blur(); setHovered(null); return;}
                    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
                    event.preventDefault(); event.stopPropagation();
                    const next = event.key === 'Home' ? 0 : event.key === 'End' ? submissions.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : submissions.length - 1)) % submissions.length;
                    event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`[data-year="${submissions[next].year}"]`)?.focus();
                  }}>
                  {item.count !== null && <span shuku-edit-id="e-d4b26cc7-e354-412f-90b0-e6e6ba2aa952" className={`aipe-neurips-bar${item.year === 2026 ? ' is-latest' : ''}`} style={{height: `${item.count / ceiling * 100}%`}}/>}
                  <Typography shuku-edit-id="e-d983437f-7899-470d-9c33-b05a07a17850" as="span" variant="bodySmall" tone="accent" className="aipe-neurips-year">{item.year}</Typography>
                </Button>;
              })}
            </div>
            <div shuku-edit-id="e-ce8f0a38-2652-43fd-8514-c0365bff6c8c" className="aipe-neurips-values" aria-hidden="true">
              {submissions.map((item, index) => item.count !== null && (active === index || (active === null && [2015, 2025, 2026].includes(item.year))) &&
                <Typography shuku-edit-id="e-758c34f2-2a33-4577-b505-7fe6b252ef5c" key={item.year} as="span" variant="body" tone="accent" className="aipe-neurips-value" data-label-year={item.year}
                  style={{left: `${(index + .5) / submissions.length * 100}%`, bottom: `calc(${item.count / ceiling * 100}% + 14px)`, animationDelay: `${index * 120}ms`}}>{format(item.count)}</Typography>)}
            </div>
          </div>
        </div>
      </div>
      <div shuku-edit-id="e-71657f21-5e90-4f51-aa2c-c667bc06ebff" className="aipe-neurips-footer">
        <Typography shuku-edit-id="e-068be504-31bc-4604-bab1-532583e54828" as="p" variant="h2" tone="accent" className="aipe-neurips-takeaway">论文数量远超人类阅读<Typography shuku-edit-id="e-814c8d2c-bb83-413b-8208-88519b71af63" as="span" variant="h2" tone="inherit" className="aipe-neurips-limit">极限</Typography></Typography>
      </div>
    </div>
  </ContentBlock>;
}
