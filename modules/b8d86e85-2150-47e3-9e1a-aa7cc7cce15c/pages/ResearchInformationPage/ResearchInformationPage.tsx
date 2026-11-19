import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
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
  return <ContentBlock shuku-edit-id="e-6002d344-c47a-41fd-8759-caa7cfa92952" ref={root} className="aipe-neurips-page" headingLevel={1} title={outline.pages.find(page => page.id === '09effd37-4057-4b45-9441-2490a231bd96')!.title}
    subtitle="NeurIPS 主轨道年度投稿量" bodyClassName="aipe-neurips-body">
    <div shuku-edit-id="e-99bee48c-26e3-4dca-9546-9bc1a2987175" className="aipe-neurips-composition" data-active={visible} data-capture-ready={visible && complete}>
      <div shuku-edit-id="e-572bb05b-9677-425d-8a76-83e30c084beb" className="aipe-neurips-visual">
        <img shuku-edit-id="e-1cd856fd-5bb0-4d21-ba04-1dad49818037" className="aipe-neurips-reading" src={readingScene} alt="论文、笔记与时钟：阅读和理解需要投入时间"/>
        <div shuku-edit-id="e-aae7d389-04e3-498d-8d9c-346f269eaf62" className="aipe-neurips-chart" role="group" onPointerLeave={() => setHovered(null)} aria-label="NeurIPS 2015至2026年投稿量。聚焦或悬停年份查看数量与来源。">
          <Typography shuku-edit-id="e-54e4193e-c22c-447d-b275-09fc61943f27" as="p" variant="bodySmall" tone="accent" className="aipe-neurips-unit">投稿量（篇）</Typography>
          {selected && <div shuku-edit-id="e-91924f70-8496-407c-802d-a323645589e7" className="aipe-neurips-detail" aria-live="polite">
            <Typography shuku-edit-id="e-071c1313-ba4d-4372-85c1-b3c82837c483" as="span" variant="bodySmall" tone="accent">{selected.year} · {selected.count === null ? '暂无数据' : `${format(selected.count)} 篇`}</Typography>
            <Typography shuku-edit-id="e-43b703d3-8e62-4367-871e-ba79c7ce137f" as="a" variant="bodySmall" tone="muted" href={selected.source} target="_blank" rel="noreferrer" title={selected.note}>数据来源 ↗</Typography>
          </div>}
          <div shuku-edit-id="e-b4bc6ae7-d9bf-480c-94f1-cb81cd4e04a6" className="aipe-neurips-plot">
            {[0, 10000, 20000, 30000].map(value => <div shuku-edit-id="e-60838903-7e3c-4f57-85fe-3fdfa7c8c0a3" key={value} className="aipe-neurips-gridline" style={{bottom: `${value / ceiling * 100}%`}} aria-hidden="true">
              <Typography shuku-edit-id="e-4e218dd0-5457-403f-b2d1-a08e8621070e" as="span" variant="bodySmall" tone="accent">{format(value)}</Typography>
            </div>)}
            <div shuku-edit-id="e-f7d0a89e-4499-46ab-adc8-69cffcd9534c" className="aipe-neurips-columns">
              {submissions.map((item, index) => {
                return <Button key={item.year} className="aipe-neurips-column" data-year={item.year} data-count={item.count ?? 'unavailable'} data-highlight={active === index}
                  style={{animationDelay: `${index * 120}ms`}}
                  aria-label={`${item.year}年，${item.count === null ? '暂无投稿量数据' : `${format(item.count)}篇投稿`}`}
                  onPointerEnter={() => setHovered(index)}
                  onFocus={() => {setHovered(null); setFocused(index);}} onBlur={() => setFocused(null)}
                  onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
                    if (event.key === 'Escape') {event.currentTarget.blur(); setHovered(null); return;}
                    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
                    event.preventDefault(); event.stopPropagation();
                    const next = event.key === 'Home' ? 0 : event.key === 'End' ? submissions.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : submissions.length - 1)) % submissions.length;
                    event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`[data-year="${submissions[next].year}"]`)?.focus();
                  }}>
                  {item.count !== null && <span shuku-edit-id="e-039e23ac-3ee3-439b-ad00-5f7f534d2c03" className={`aipe-neurips-bar${item.year === 2026 ? ' is-latest' : ''}`} style={{height: `${item.count / ceiling * 100}%`}}/>}
                  <Typography shuku-edit-id="e-4ad8f0ed-04f7-4bc5-ba45-46c6d52d2f74" as="span" variant="bodySmall" tone="accent" className="aipe-neurips-year">{item.year}</Typography>
                </Button>;
              })}
            </div>
            <div shuku-edit-id="e-4a0944e7-bae5-4f46-9544-84b97393073b" className="aipe-neurips-values" aria-hidden="true">
              {submissions.map((item, index) => item.count !== null && (active === index || (active === null && [2015, 2025, 2026].includes(item.year))) &&
                <Typography shuku-edit-id="e-99eea5da-7db8-4396-afad-f80577b1ca61" key={item.year} as="span" variant="body" tone="accent" className="aipe-neurips-value" data-label-year={item.year}
                  style={{left: `${(index + .5) / submissions.length * 100}%`, bottom: `calc(${item.count / ceiling * 100}% + 14px)`, animationDelay: `${index * 120}ms`}}>{format(item.count)}</Typography>)}
            </div>
          </div>
        </div>
      </div>
      <div shuku-edit-id="e-e312a06b-b0b3-4842-92f9-25b3623798ec" className="aipe-neurips-footer">
        <Typography shuku-edit-id="e-f8147f0f-cba1-423c-8990-b2663a6d0e74" as="p" variant="h2" tone="accent" className="aipe-neurips-takeaway">论文数量远超人类阅读<Typography shuku-edit-id="e-d257425a-bd6a-4f4d-b56a-85ef519a42ea" as="span" variant="h2" tone="inherit" className="aipe-neurips-limit">极限</Typography></Typography>
      </div>
    </div>
  </ContentBlock>;
}
