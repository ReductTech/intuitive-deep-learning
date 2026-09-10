import { useEffect, useLayoutEffect, useState } from 'react';
import { Typography } from '../shared/react';
import { linearRegressionLessonUnits } from './lessonUnits';
import './linear-regression-lesson.css';

const PPT_WIDTH = 1600;
const PPT_HEIGHT = 900;

function useCanvasScale() {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const update = () => setScale(Math.min(window.innerWidth / PPT_WIDTH, window.innerHeight / PPT_HEIGHT));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return scale;
}

export function LinearRegressionLessonPptSlidePage() {
  const requestedId = new URLSearchParams(window.location.search).get('slide') ?? linearRegressionLessonUnits[0].id;
  const slideIndex = Math.max(0, linearRegressionLessonUnits.findIndex((unit) => unit.id === requestedId));
  const unit = linearRegressionLessonUnits[slideIndex];
  const canvasScale = useCanvasScale();

  useEffect(() => {
    document.body.classList.add('grl-ppt-body');
    document.title = `${slideIndex + 1}. ${unit.title}`;
    return () => document.body.classList.remove('grl-ppt-body');
  }, [slideIndex, unit.title]);

  return (
    <div className="grl-ppt-root" data-ppt-react-slide>
      <main
        className="grl-ppt-canvas grl-shell"
        data-ppt-canvas
        style={{ transform: `translate(-50%, -50%) scale(${canvasScale})` }}
      >
        <header className="grl-ppt-header" aria-label="课件位置">
          <Typography as="span" variant="bodySmall" tone="accent">{unit.section}</Typography>
          <Typography as="span" variant="bodySmall" tone="muted">{String(slideIndex + 1).padStart(2, '0')} / {String(linearRegressionLessonUnits.length).padStart(2, '0')}</Typography>
        </header>
        <div className="ng-ppt-slide-surface grl-ppt-slide-surface">
          {unit.render('ppt')}
        </div>
      </main>
    </div>
  );
}
