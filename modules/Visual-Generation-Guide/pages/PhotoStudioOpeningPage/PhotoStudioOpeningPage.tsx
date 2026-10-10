import { useState } from 'react';
import { Typography } from '../../../shared/react';
import catOne from '../../assets/photo-studio-opening/cat-photo-01.png';
import catTwo from '../../assets/photo-studio-opening/cat-photo-02.png';
import catThree from '../../assets/photo-studio-opening/cat-photo-03.png';
import './PhotoStudioOpeningPage.css';

const photos = [
  { src: catOne, alt: '戴红围巾的橘猫坐在木窗边，面向镜头。' },
  { src: catTwo, alt: '戴红围巾的橘猫坐在窗边，侧身望着雨中的花园。' },
  { src: catThree, alt: '戴红围巾的橘猫坐在窗台上，夕阳下回头望向镜头。' },
];

function Sparkle() {
  return <svg viewBox="0 0 32 32" width="32" height="32" fill="currentColor" aria-hidden="true">
    <path d="M12 4 15 12 23 15 15 18 12 26 9 18 1 15 9 12ZM26 1 27.5 5.5 32 7 27.5 8.5 26 13 24.5 8.5 20 7 24.5 5.5Z" />
  </svg>;
}

export function PhotoStudioOpeningPage({ onComplete }: { onComplete?: () => void }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const revealPhoto = () => {
    const next = visibleCount === photos.length ? 0 : visibleCount + 1;
    setVisibleCount(next);
    if (next === photos.length) onComplete?.();
  };

  return <section className="vg-photo-studio" aria-label="没有相机的摄影师" data-photo-count={visibleCount}>
    <header className="vg-photo-studio__head">
      <div>
        <Typography as="h1" variant="display" tone="inherit">没有相机的摄影师</Typography>
        <Typography variant="subtitle" tone="inherit">给这位摄影师一句描述，看看它会“拍”出什么。</Typography>
      </div>
      <Typography variant="bodySmall" tone="inherit" className="vg-photo-studio__topic">视觉生成</Typography>
    </header>

    <div className="vg-photo-studio__workbench">
      <aside className="vg-photo-studio__prompt">
        <Typography as="h2" variant="h3" tone="inherit">你的描述</Typography>
        <Typography variant="body" tone="inherit">一只戴着红围巾的橘猫，坐在窗边。</Typography>
        <button className="vg-photo-studio__shoot" type="button" onClick={revealPhoto}>
          <Sparkle />
          <Typography as="span" variant="body" tone="inherit">{visibleCount === 0 ? '拍一张' : visibleCount < photos.length ? '再拍一张' : '重新体验'}</Typography>
        </button>
      </aside>

      <div className="vg-photo-studio__prints" aria-label="同一句描述的三张生成图像示例">
        {photos.map((photo, index) => <figure className="vg-photo-studio__print" key={photo.src} data-visible={index < visibleCount}>
          {index < visibleCount
            ? <img src={photo.src} alt={photo.alt} className="vg-photo-studio__photo" />
            : <div className="vg-photo-studio__blank" aria-label="等待展开的相纸"><Sparkle /></div>}
        </figure>)}
      </div>
    </div>

    <footer className="vg-photo-studio__invitation">
      <Typography variant="subtitle" tone="inherit">从一句描述到一张图像，走进视觉生成。</Typography>
    </footer>
    <span className="vg-photo-studio__announcement" role="status">{visibleCount > 0 ? `已展示${visibleCount}张生成图像。` : ''}</span>
  </section>;
}
