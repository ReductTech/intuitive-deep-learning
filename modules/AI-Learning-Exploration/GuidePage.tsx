import { useRef, type ReactNode } from 'react';
import { useSceneScale } from '../shared/react/presentation/canvas';
import { deck } from './LearningExplorationPpt';

function ReadingSlide({ children, id }: { children: ReactNode; id: string }) {
  const frame = useRef<HTMLDivElement>(null);
  const scale = useSceneScale(frame);
  return <section id={id} ref={frame} style={{ width: '100%', minWidth: 0, height: 900 * scale, position: 'relative' }}>
    <div className="course-page-surface" style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>{children}</div>
  </section>;
}

export function GuidePage() {
  return <main>{deck.scenes.map(scene => <ReadingSlide key={scene.id} id={scene.id}>
    {scene.render({ complete: () => undefined, reset: () => undefined, isComplete: false })}
  </ReadingSlide>)}</main>;
}
