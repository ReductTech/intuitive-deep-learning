import version_1Asset0 from '../assets/images/weight-sharing/version-1.jpg';
import version_2Asset1 from '../assets/images/weight-sharing/version-2.jpg';
import version_3Asset2 from '../assets/images/weight-sharing/version-3.jpg';
import version_4Asset3 from '../assets/images/weight-sharing/version-4.jpg';
import version_5Asset4 from '../assets/images/weight-sharing/version-5.jpg';
import weight_sharingAsset5 from '../assets/videos/weight-sharing.mp4';
import demoPoster from '../assets/images/weight-sharing/demo-poster.jpg';
const generatedImages = [version_1Asset0, version_2Asset1, version_3Asset2, version_4Asset3, version_5Asset4];
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import './PresentationComparisonPage.css';

const slots = [
  { x: 334, y: 0, width: 260, height: 147, angle: 5, z: 1 },
  { x: 202, y: 70, width: 286, height: 161, angle: 4, z: 2 },
  { x: 20, y: 122, width: 610, height: 344, angle: 0, z: 5 },
  { x: 180, y: 310, width: 286, height: 161, angle: -4, z: 3 },
  { x: 333, y: 345, width: 240, height: 136, angle: -5, z: 2 },
];
const stackStyle = (index: number): CSSProperties => ({ left: slots[index].x, top: slots[index].y, width: slots[index].width, height: slots[index].height, transform: `rotate(${slots[index].angle}deg)`, zIndex: slots[index].z });

export function PresentationComparisonPage() {
  const root = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(3);
  const [visible, setVisible] = useState(false);
  const [foreground, setForeground] = useState(!document.hidden);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [stackHovered, setStackHovered] = useState(false);
  const [stackFocused, setStackFocused] = useState(false);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReducedMotion(preference.matches);
    const updateForeground = () => setForeground(!document.hidden);
    updatePreference();
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .15 });
    observer.observe(node);
    preference.addEventListener('change', updatePreference);
    document.addEventListener('visibilitychange', updateForeground);
    return () => { observer.disconnect(); preference.removeEventListener('change', updatePreference); document.removeEventListener('visibilitychange', updateForeground); };
  }, []);

  useEffect(() => {
    const media = video.current;
    if (!media) return;
    if (visible && foreground && !reducedMotion) void media.play().catch(() => {});
    else media.pause();
    return () => media.pause();
  }, [visible, foreground, reducedMotion]);

  useEffect(() => {
    if (!visible || !foreground || reducedMotion || stackHovered || stackFocused) return;
    const timer = window.setInterval(() => setActive(value => value % 5 + 1), 3200);
    return () => window.clearInterval(timer);
  }, [visible, foreground, reducedMotion, stackHovered, stackFocused]);

  return <ContentBlock ref={root} className="cg-case-page cg-creator-typography"
    title="既然允许 AI 参与制作，怎样看出学生的理解？"
    subtitle="看学生怎样提出设计要求、解释视觉含义，并核验结果。"
    headingLevel={1} bodyClassName="cg-case-body">
    <Typography as="h2" variant="h3" tone="accent" className="cg-case-heading cg-case-heading-left">只给主题的生成结果</Typography>
    <Typography as="h2" variant="h3" tone="accent" className="cg-case-heading cg-case-heading-right">融入学生的理解</Typography>
    <section className="cg-case-stack" aria-label="五张图示依次切换，悬停暂停，可点击查看" data-active-version={active}
      onPointerEnter={() => setStackHovered(true)} onPointerLeave={() => setStackHovered(false)}
      onFocusCapture={() => setStackFocused(true)}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setStackFocused(false); }}>
      {[1,2,3,4,5].map(version => <button type="button" className="cg-case-stack-card" key={version}
        style={stackStyle((version - active + 7) % 5)} aria-label={`查看生成方案 ${version}`} aria-pressed={active === version}
        onFocus={() => setActive(version)} onClick={() => setActive(version)}>
        <img src={generatedImages[version - 1]} alt={`权重共享图示方案 ${version}`} draggable={false}/>
      </button>)}
    </section>
    <section className="cg-case-result" aria-label="加入具体设计要求后的知识呈现作品效果">
      <video ref={video} src={weight_sharingAsset5} poster={demoPoster}
        muted loop playsInline preload="auto" disablePictureInPicture disableRemotePlayback
        aria-label="权重共享知识呈现作品：窗口同步滑动，对比不同位置使用的权重"/>
    </section>
    <div className="cg-case-prompts">
      <section className="cg-case-prompt" aria-label="只给主题的设计要求">
        <Typography variant="bodySmall" tone="muted">设计要求（Prompt）</Typography>
        <Typography variant="bodySmall" tone="accent">给我做一页 PPT，讲讲卷积里的权重共享。</Typography>
      </section>
      <section className="cg-case-prompt cg-case-prompt-specific" aria-label="融入教学设计的具体要求">
        <Typography variant="bodySmall" tone="muted">设计要求（Prompt）</Typography>
        <Typography variant="bodySmall" tone="accent"><span className="cg-case-emphasis">左右对比</span>，窗口<span className="cg-case-emphasis">同步滑动</span>；左边每到新位置<span className="cg-case-emphasis-warm">换颜色</span>，右边<span className="cg-case-emphasis-warm">保持不变</span>，表示复用同一套权重。</Typography>
      </section>
    </div>
  </ContentBlock>;
}
