import { useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, Typography, moduleAssetUrl } from '../../../shared/react';
import outline from '../../outlines.json';
import submissions from './neuripsSubmissions.json';
import './ResearchInformationPage.css';

const format = (count: number) => count.toLocaleString('en-US');
const ceiling = 33000;
const readingScene = moduleAssetUrl(outline.moduleIdentity.id, 'research-information/reading-still-life.png');

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
  return <ContentBlock ref={root} className="aipe-neurips-page" headingLevel={1} title={outline.pages[4].title}
    subtitle="NeurIPS 主轨道年度投稿量" bodyClassName="aipe-neurips-body">
    <div className="aipe-neurips-composition" data-active={visible} data-capture-ready={visible && complete}>
      <div className="aipe-neurips-visual">
        <img className="aipe-neurips-reading" src={readingScene} alt="论文、笔记与时钟：阅读和理解需要投入时间"/>
        <div className="aipe-neurips-chart" role="group" onPointerLeave={() => setHovered(null)} aria-label="NeurIPS 2015至2026年投稿量。聚焦或悬停年份查看数量与来源。">
          <Typography as="p" variant="bodySmall" tone="accent" className="aipe-neurips-unit">投稿量（篇）</Typography>
          {selected && <div className="aipe-neurips-detail" aria-live="polite">
            <Typography as="span" variant="bodySmall" tone="accent">{selected.year} · {selected.count === null ? '暂无数据' : `${format(selected.count)} 篇`}</Typography>
            <Typography as="a" variant="bodySmall" tone="muted" href={selected.source} target="_blank" rel="noreferrer" title={selected.note}>数据来源 ↗</Typography>
          </div>}
          <div className="aipe-neurips-plot">
            {[0, 10000, 20000, 30000].map(value => <div key={value} className="aipe-neurips-gridline" style={{bottom: `${value / ceiling * 100}%`}} aria-hidden="true">
              <Typography as="span" variant="bodySmall" tone="accent">{format(value)}</Typography>
            </div>)}
            <div className="aipe-neurips-columns">
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
                  {item.count !== null && <span className={`aipe-neurips-bar${item.year === 2026 ? ' is-latest' : ''}`} style={{height: `${item.count / ceiling * 100}%`}}/>}
                  <Typography as="span" variant="bodySmall" tone="accent" className="aipe-neurips-year">{item.year}</Typography>
                </Button>;
              })}
            </div>
            <div className="aipe-neurips-values" aria-hidden="true">
              {submissions.map((item, index) => item.count !== null && (active === index || (active === null && [2015, 2025, 2026].includes(item.year))) &&
                <Typography key={item.year} as="span" variant="body" tone="accent" className="aipe-neurips-value" data-label-year={item.year}
                  style={{left: `${(index + .5) / submissions.length * 100}%`, bottom: `calc(${item.count / ceiling * 100}% + 14px)`, animationDelay: `${index * 120}ms`}}>{format(item.count)}</Typography>)}
            </div>
          </div>
        </div>
      </div>
      <div className="aipe-neurips-footer">
        <Typography as="p" variant="h2" tone="accent" className="aipe-neurips-takeaway">论文数量远超人类阅读<Typography as="span" variant="h2" tone="inherit" className="aipe-neurips-limit">极限</Typography></Typography>
      </div>
    </div>
  </ContentBlock>;
}
