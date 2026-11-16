import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useId, useState } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
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
    <ContentBlock shuku-edit-id="e-122e75ad-7e14-4788-b32e-96f3467253f1" title={outline.pages.find(page => page.id === 'e0595adb-7c6e-466b-ab08-4129d9a2b04c')!.title} subtitle="从想到，到做到，中间还有一段路" headingLevel={1} className="rie-barrier" data-scene-id="e0595adb-7c6e-466b-ab08-4129d9a2b04c">
      <img shuku-edit-id="e-7457498c-f62e-4e36-a0e2-10de3c83c687" className="rie-bridge-islands" src={moduleAssetUrl('images/idea-bridge-islands-v1.jpg')} alt="两端分离的平台，左侧是代表想法的灯泡，右侧是代表成果的文稿" />
      <div shuku-edit-id="e-f155434a-bbe9-46ce-b302-e206c7881f66" className="rie-bridge-scene" data-ppt-viewport="桥块坠落动画视窗，坠落后离开桥面" data-bridge-state={collapsed ? 'collapsed' : 'intact'}>
        <Typography shuku-edit-id="e-fded136b-3bed-42c1-bcd2-f19b5f8b597b" variant="h2" tone="accent" className="rie-bridge-start">有一个想法</Typography>
        <Typography shuku-edit-id="e-df2efd6b-0eec-4f6f-ae58-4bc1cce41363" variant="h2" tone="accent" className="rie-bridge-end">把它做出来</Typography>
        {supports.map((support, index) => (
          <button shuku-edit-id="e-0baee2a7-b054-4beb-ae15-a5b64602a276" key={support.id} type="button" className={`rie-bridge-piece rie-bridge-piece--${index}${collapsed ? removed === index ? ' is-removed' : ' is-falling' : ''}`} onClick={() => setRemoved(index)} disabled={collapsed} aria-label={`移除${support.title}`} data-support={support.id}>
            <svg shuku-edit-id="e-541cb451-7f85-418d-be83-fab56e80540f" className="rie-bridge-stone" viewBox="0 0 260 154" aria-hidden="true">
              <defs shuku-edit-id="e-9ebb9376-d528-4d96-97e8-09c1efbe6479">
                <linearGradient shuku-edit-id="e-58a1c6cc-d8d6-4b3e-aed2-ea4319dfa907" id={`${gradient}-top-${index}`} x1="0" y1="0" x2="0.3" y2="1"><stop shuku-edit-id="e-0dfe9617-a650-405b-983a-6b93cb6c5a70" offset="0" stopColor="#f4f7fc" /><stop shuku-edit-id="e-f9044070-26ef-49c6-aed5-ecd519db77a6" offset="1" stopColor="#c3d5ea" /></linearGradient>
                <linearGradient shuku-edit-id="e-f411f97e-ec8c-492f-bc6e-91ad8b4e4a30" id={`${gradient}-side-${index}`} x1="0" y1="0" x2="0" y2="1"><stop shuku-edit-id="e-06ed5106-7f8b-4720-bd69-d13b1e19f211" offset="0" stopColor="#a5bfdc" /><stop shuku-edit-id="e-ea11406f-0671-411c-a783-51ef6e6023a3" offset="1" stopColor="#7e9fc6" /></linearGradient>
              </defs>
              <path shuku-edit-id="e-54cbdd1d-151b-4a78-9423-96797eaa2c31" d="M5 117 Q130 86 255 117 L255 149 Q130 118 5 149Z" fill={`url(#${gradient}-side-${index})`} stroke="#9eb5d0" />
              <path shuku-edit-id="e-429d8a5e-547a-46c0-b76d-3e9bdbe7b694" d="M5 24 Q130 -5 255 24 L255 117 Q130 86 5 117Z" fill={`url(#${gradient}-top-${index})`} stroke="#bccfe5" strokeWidth="2" />
              <path shuku-edit-id="e-b629ec21-dd19-4451-900f-4dd3c3772011" d="M16 29 Q130 4 244 29" fill="none" stroke="#fff" strokeWidth="3" opacity=".8" />
              <path shuku-edit-id="e-351ea8e6-63cd-434a-b502-ea26c2f7de39" d="M22 56l14 9 8-5m172 25-11 7 4 12M73 28l8 10-5 8m100 56 8-8 10 4" fill="none" stroke="#a8bfd9" opacity=".35" />
            </svg>
            <span shuku-edit-id="e-bfb7318c-d5c7-4141-8146-3dae4db9dbf3" className="rie-bridge-piece-copy">
              <Typography shuku-edit-id="e-75c30768-dc59-41a8-9a97-c384d963e01f" as="span" variant="h2" tone="accent">{support.title}</Typography>
            </span>
          </button>
        ))}
      </div>
      <div shuku-edit-id="e-fa046d55-dc9b-42ac-9622-ee7e04704a9e" className="rie-bridge-message">
        <Typography shuku-edit-id="e-7ea46afa-e4f4-4451-b763-84ec7fa37252" variant="display" tone="accent">很多想法，停在了实现的路上。</Typography>
        <Typography shuku-edit-id="e-6873f4fa-ed80-46c9-93c4-096564edae8d" variant="subtitle" tone="muted">AI 正在降低其中一部分门槛</Typography>
      </div>
    </ContentBlock>
  );
}
