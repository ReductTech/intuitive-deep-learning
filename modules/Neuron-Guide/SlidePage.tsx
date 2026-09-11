import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { neuronCourse } from './course';
import { NeuronLessonProvider } from './model/NeuronLessonContext';
import './pages/SlidePage.css';

const PPT_WIDTH = 1600;
const PPT_HEIGHT = 900;

interface NeuronPptSlideDefinition {
  id: string;
  title: string;
  section: string;
  render: (complete: () => void) => ReactNode;
}

export const neuronPptSlides: NeuronPptSlideDefinition[] = neuronCourse
  .filter((item) => item.showInPpt !== false)
  .map((item) => ({ id: item.id, title: item.title, section: item.section, render: (complete: () => void) => item.component({ complete, reset: () => undefined, isComplete: false }) }));

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

function PptContentFit({ children }: { children: ReactNode }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const surface = surfaceRef.current;
    if (!viewport || !surface) return;

    const update = () => {
      const naturalWidth = Math.max(surface.scrollWidth, 1);
      const naturalHeight = Math.max(surface.scrollHeight, 1);
      setScale(Math.min(1, viewport.clientWidth / naturalWidth, viewport.clientHeight / naturalHeight));
    };

    update();
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(viewport);
    resizeObserver.observe(surface);
    const mutationObserver = new MutationObserver(update);
    mutationObserver.observe(surface, { childList: true, subtree: true, attributes: true });
    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [children]);

  return (
    <div className="ng-ppt-slide-viewport" ref={viewportRef}>
      <div
        className="ng-ppt-slide-surface"
        ref={surfaceRef}
        style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}

export function SlidePage() {
  const slideId = new URLSearchParams(window.location.search).get('slide') ?? neuronPptSlides[0].id;
  const slideIndex = Math.max(0, neuronPptSlides.findIndex((slide) => slide.id === slideId));
  const slide = neuronPptSlides[slideIndex];
  const canvasScale = useCanvasScale();
  const complete = useCallback(() => undefined, []);

  useEffect(() => {
    document.body.classList.add('ng-ppt-body');
    document.title = `${slideIndex + 1}. ${slide.title}`;
    return () => document.body.classList.remove('ng-ppt-body');
  }, [slide.title, slideIndex]);

  return (
    <div className="ng-ppt-root" data-ppt-react-slide>
      <main
        className="ng-ppt-canvas ng-guide-shell"
        data-ppt-canvas
        style={{ transform: `translate(-50%, -50%) scale(${canvasScale})` }}
      >
        <PptContentFit>
          <NeuronLessonProvider>{slide.render(complete)}</NeuronLessonProvider>
        </PptContentFit>
      </main>
    </div>
  );
}




