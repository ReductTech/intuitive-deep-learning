import { creatorGuideAssetUrl } from '../creatorGuideAssets';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import outline from '../outlines.json';
import './PresentationComparisonPage.css';

const asset = (path: string) => creatorGuideAssetUrl(outline.moduleIdentity.id, path);
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

  return <ContentBlock shuku-edit-id="e-a444dc92-4776-49f4-a0fc-4835a01cc938" ref={root} className="aipe-replay-cg-case-page aipe-replay-cg-creator-typography"
    title="既然允许 AI 参与制作，怎样看出学生的理解？"
    subtitle="看学生怎样提出设计要求、解释视觉含义，并核验结果。"
    headingLevel={1} bodyClassName="aipe-replay-cg-case-body">
    <Typography shuku-edit-id="e-65684209-c78f-4bac-9710-e6ace8ebcf49" as="h2" variant="h3" tone="accent" className="aipe-replay-cg-case-heading aipe-replay-cg-case-heading-left">只给主题的生成结果</Typography>
    <Typography shuku-edit-id="e-b3b44de7-739d-4ca0-bdfa-8d195d4e51bc" as="h2" variant="h3" tone="accent" className="aipe-replay-cg-case-heading aipe-replay-cg-case-heading-right">融入学生的理解</Typography>
    <section shuku-edit-id="e-cadf92ce-bbe4-4600-9aff-ed8f15a54502" className="aipe-replay-cg-case-stack" aria-label="五张图示依次切换，悬停暂停，可点击查看" data-active-version={active}
      onPointerEnter={() => setStackHovered(true)} onPointerLeave={() => setStackHovered(false)}
      onFocusCapture={() => setStackFocused(true)}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setStackFocused(false); }}>
      {[1,2,3,4,5].map(version => <button shuku-edit-id="e-d9328cf9-e759-4323-a1cc-61312ef4c46b" type="button" className="aipe-replay-cg-case-stack-card" key={version}
        style={stackStyle((version - active + 7) % 5)} aria-label={`查看生成方案 ${version}`} aria-pressed={active === version}
        onFocus={() => setActive(version)} onClick={() => setActive(version)}>
        <img shuku-edit-id="e-9482db99-b18a-400e-911b-315592d5c364" src={asset(`images/weight-sharing/version-${version}.jpg`)} alt={`权重共享图示方案 ${version}`} draggable={false}/>
      </button>)}
    </section>
    <section shuku-edit-id="e-cbb4ec3f-ed2c-494b-a7a3-cadf83a240da" className="aipe-replay-cg-case-result" aria-label="加入具体设计要求后的知识呈现作品效果">
      <video shuku-edit-id="e-bcd9c4f3-4630-40c0-975b-9ec79075baff" ref={video} src={asset('videos/weight-sharing.mp4')}
        muted loop playsInline preload="auto" disablePictureInPicture disableRemotePlayback
        aria-label="权重共享知识呈现作品：窗口同步滑动，对比不同位置使用的权重"/>
    </section>
    <div shuku-edit-id="e-c202a09c-8f8a-4d4b-9155-01f0a233c8a2" className="aipe-replay-cg-case-prompts">
      <section shuku-edit-id="e-1b33705e-9b11-4c64-affc-f99e80cbdf57" className="aipe-replay-cg-case-prompt" aria-label="只给主题的设计要求">
        <Typography shuku-edit-id="e-94385ccf-f49a-496b-ace6-003477164ae3" variant="bodySmall" tone="muted">设计要求（Prompt）</Typography>
        <Typography shuku-edit-id="e-bfccad6b-2387-40bf-b895-922e2b7e61bc" variant="bodySmall" tone="accent">给我做一页 PPT，讲讲卷积里的权重共享。</Typography>
      </section>
      <section shuku-edit-id="e-3725f972-5c68-47ba-a8ee-6065e9711328" className="aipe-replay-cg-case-prompt aipe-replay-cg-case-prompt-specific" aria-label="融入教学设计的具体要求">
        <Typography shuku-edit-id="e-99bde91b-20af-44b1-aca2-97866f6c3aff" variant="bodySmall" tone="muted">设计要求（Prompt）</Typography>
        <Typography shuku-edit-id="e-b6d33982-aecb-47d8-823a-30afb533ac17" variant="bodySmall" tone="accent"><span shuku-edit-id="e-9fa9b9f2-c207-4860-b0d2-2365f30e03ad" className="aipe-replay-cg-case-emphasis">左右对比</span>，窗口<span shuku-edit-id="e-51000896-c763-4905-ae89-549f31495c7d" className="aipe-replay-cg-case-emphasis">同步滑动</span>；左边每到新位置<span shuku-edit-id="e-9f857dc3-48e8-4f5c-95f5-fa1578a3fadf" className="aipe-replay-cg-case-emphasis-warm">换颜色</span>，右边<span shuku-edit-id="e-de41a4d5-4ca0-4923-a80a-6576ddd0203a" className="aipe-replay-cg-case-emphasis-warm">保持不变</span>，表示复用同一套权重。</Typography>
      </section>
    </div>
  </ContentBlock>;
}
