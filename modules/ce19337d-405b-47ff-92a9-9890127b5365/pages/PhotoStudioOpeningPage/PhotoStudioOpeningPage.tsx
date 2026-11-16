import moduleAssetOutline from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { useState } from 'react';
import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
import './PhotoStudioOpeningPage.css';

const catOne = moduleAssetUrl('images/photo-studio-opening/cat-photo-01.jpg');
const catTwo = moduleAssetUrl('images/photo-studio-opening/cat-photo-02.jpg');
const catThree = moduleAssetUrl('images/photo-studio-opening/cat-photo-03.jpg');

const photos = [
  { src: catOne, alt: '戴红围巾的橘猫坐在木窗边，面向镜头。' },
  { src: catTwo, alt: '戴红围巾的橘猫坐在窗边，侧身望着雨中的花园。' },
  { src: catThree, alt: '戴红围巾的橘猫坐在窗台上，夕阳下回头望向镜头。' },
];

function Sparkle() {
  return <svg shuku-edit-id="e-811f495b-f1bf-48fa-a07d-c6faa2d0f301" viewBox="0 0 32 32" width="32" height="32" fill="currentColor" aria-hidden="true">
    <path shuku-edit-id="e-84344c51-7f0e-4e16-8d1d-e907e41d9cff" d="M12 4 15 12 23 15 15 18 12 26 9 18 1 15 9 12ZM26 1 27.5 5.5 32 7 27.5 8.5 26 13 24.5 8.5 20 7 24.5 5.5Z" />
  </svg>;
}

export function PhotoStudioOpeningPage({ onComplete }: { onComplete?: () => void }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const revealPhoto = () => {
    const next = visibleCount === photos.length ? 0 : visibleCount + 1;
    setVisibleCount(next);
    if (next === photos.length) onComplete?.();
  };

  return <ContentBlock shuku-edit-id="e-42e5ef1f-9cc7-4d72-a4bb-60e121e4da95" headingLevel={1} className="vg-shared-page vg-photo-studio" bodyClassName="vg-photo-studio__body"
    title="没有相机的摄影师" subtitle="给这位摄影师一句描述，看看它会“拍”出什么。" data-photo-count={visibleCount}>
    <div shuku-edit-id="e-5bf1107b-388b-4c50-8e11-b02f7aae4c56" className="vg-photo-studio__workbench">
      <aside shuku-edit-id="e-3c42aabc-8b16-407e-9f96-4f43ba174f8b" className="vg-photo-studio__prompt">
        <Typography shuku-edit-id="e-b3068bb8-4966-43db-b03e-556ca7b1f58b" as="h2" variant="h3" tone="inherit">你的描述</Typography>
        <Typography shuku-edit-id="e-c2627c20-4f6b-4b39-90a7-79541e073650" variant="body" tone="inherit">一只戴着红围巾的橘猫，坐在窗边。</Typography>
        <Button variant="primary" className="vg-photo-studio__shoot" onClick={revealPhoto}>
          <Sparkle />
          <Typography shuku-edit-id="e-12ed3b88-8f26-4f32-8179-5949e608c2a3" as="span" variant="body" tone="inherit">{visibleCount === 0 ? '拍一张' : visibleCount < photos.length ? '再拍一张' : '重新体验'}</Typography>
        </Button>
      </aside>

      <div shuku-edit-id="e-015c5d76-5a6e-4e3b-94ad-38d66ef93ffc" className="vg-photo-studio__prints" aria-label="同一句描述的三张生成图像示例">
        {photos.map((photo, index) => <figure shuku-edit-id="e-1e6a8465-1ca5-4230-b71b-51a773a55b6d" className="vg-photo-studio__print" key={photo.src} data-visible={index < visibleCount}>
          {index < visibleCount
            ? <img shuku-edit-id="e-53353d19-4ce3-4236-b4f8-6b6d798e6e19" src={photo.src} alt={photo.alt} className="vg-photo-studio__photo" />
            : <div shuku-edit-id="e-20a7a3b8-95e7-45da-bbac-f195e6427817" className="vg-photo-studio__blank" aria-label="等待展开的相纸"><Sparkle /></div>}
        </figure>)}
      </div>
    </div>

    <footer shuku-edit-id="e-770a51de-28fd-4d7b-8a79-d0c33db12709" className="vg-photo-studio__invitation">
      <Typography shuku-edit-id="e-aca81d7f-d940-465b-a219-264cdda3df31" variant="subtitle" tone="inherit">从一句描述到一张图像，走进视觉生成。</Typography>
    </footer>
    <span shuku-edit-id="e-091b50d5-bb8d-4619-ab95-62bec6c0c4b6" className="vg-photo-studio__announcement" role="status">{visibleCount > 0 ? `已展示${visibleCount}张生成图像。` : ''}</span>
  </ContentBlock>;
}
