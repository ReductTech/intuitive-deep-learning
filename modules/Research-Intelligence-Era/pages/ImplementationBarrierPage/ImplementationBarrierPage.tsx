import { useEffect, useId, useState } from 'react';
import { ContentBlock, Typography, moduleAssetUrl } from '../../../shared/react';
import outline from '../../outlines.json';
import './ImplementationBarrierPage.css';

const supports = [
  { id: 'method', title: '方法' },
  { id: 'skill', title: '能力' },
  { id: 'effort', title: '时间' },
] as const;

export function ImplementationBarrierPage() {
  const [removed, setRemoved] = useState<number | null>(null);
  const gradient = useId().replaceAll(':', '');
  const collapsed = removed !== null;
  useEffect(() => {
    if (removed === null) return;
    // Allow the collapse to finish and remain visible briefly, then restore automatically.
    const timer = window.setTimeout(() => setRemoved(null), 2800);
    return () => window.clearTimeout(timer);
  }, [removed]);
  return (
    <ContentBlock title={outline.pages[1].title} subtitle="从想到，到做到，中间还有一段路" headingLevel={1} className="rie-barrier" data-scene-id="implementation-barrier">
      <img className="rie-bridge-islands" src={moduleAssetUrl(outline.moduleIdentity.id, 'images/idea-bridge-islands-v1.png')} alt="两端分离的平台，左侧是代表想法的灯泡，右侧是代表成果的文稿" />
      <div className="rie-bridge-scene" data-ppt-viewport="桥块坠落动画视窗，坠落后离开桥面" data-bridge-state={collapsed ? 'collapsed' : 'intact'}>
        <Typography variant="h2" tone="accent" className="rie-bridge-start">有一个想法</Typography>
        <Typography variant="h2" tone="accent" className="rie-bridge-end">把它做出来</Typography>
        {supports.map((support, index) => (
          <button key={support.id} type="button" className={`rie-bridge-piece rie-bridge-piece--${index}${collapsed ? removed === index ? ' is-removed' : ' is-falling' : ''}`} onClick={() => setRemoved(index)} disabled={collapsed} aria-label={`移除${support.title}`} data-support={support.id}>
            <svg className="rie-bridge-stone" viewBox="0 0 260 154" aria-hidden="true">
              <defs>
                <linearGradient id={`${gradient}-top-${index}`} x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stopColor="#f4f7fc" /><stop offset="1" stopColor="#c3d5ea" /></linearGradient>
                <linearGradient id={`${gradient}-side-${index}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a5bfdc" /><stop offset="1" stopColor="#7e9fc6" /></linearGradient>
              </defs>
              <path d="M5 117 Q130 86 255 117 L255 149 Q130 118 5 149Z" fill={`url(#${gradient}-side-${index})`} stroke="#9eb5d0" />
              <path d="M5 24 Q130 -5 255 24 L255 117 Q130 86 5 117Z" fill={`url(#${gradient}-top-${index})`} stroke="#bccfe5" strokeWidth="2" />
              <path d="M16 29 Q130 4 244 29" fill="none" stroke="#fff" strokeWidth="3" opacity=".8" />
              <path d="M22 56l14 9 8-5m172 25-11 7 4 12M73 28l8 10-5 8m100 56 8-8 10 4" fill="none" stroke="#a8bfd9" opacity=".35" />
            </svg>
            <span className="rie-bridge-piece-copy">
              <Typography as="span" variant="h2" tone="accent">{support.title}</Typography>
            </span>
          </button>
        ))}
      </div>
      <div className="rie-bridge-message">
        <Typography variant="display" tone="accent">很多想法，停在了实现的路上。</Typography>
        <Typography variant="subtitle" tone="muted">AI 正在降低其中一部分门槛</Typography>
      </div>
    </ContentBlock>
  );
}
