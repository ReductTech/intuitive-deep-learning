import { deck } from './LLMPracticeEducationPpt';
import { useRef } from 'react';
import { useSceneScale } from '../shared/react/presentation/canvas';
import '../shared/react/styles.css';
import '../shared/react/presentation.css';

function GuideSlide({ id, children }: { id: string; children: React.ReactNode }) {
  const frame = useRef<HTMLDivElement>(null);
  const scale = useSceneScale(frame);
  return (
    <div ref={frame} id={id} className="llmpe-guide-frame" data-scene-id={id}>
      <div className="course-page-surface" style={{ transform: `scale(${scale})` }}>{children}</div>
    </div>
  );
}

export function LLMPracticeEducationGuide() {
  return <main className="llmpe-guide">{deck.scenes.map(scene => <GuideSlide key={scene.id} id={scene.id}>
    {scene.render({ complete: () => undefined, reset: () => undefined, isComplete: false })}
  </GuideSlide>)}</main>;
}
