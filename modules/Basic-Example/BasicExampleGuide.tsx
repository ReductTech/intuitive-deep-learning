import { useRef } from 'react';
import { useSceneScale } from '../shared/react/presentation/canvas';
import '../shared/react/styles.css';
import '../shared/react/presentation.css';
import { CreatorSkillIntro } from './pages/CreatorSkillIntro';
import outline from './outlines.json';

export function BasicExampleGuide() {
  const frame = useRef<HTMLDivElement>(null);
  const scale = useSceneScale(frame);
  return (
    <main className="be-guide">
      <div ref={frame} id={outline.pages[0].id} className="be-guide-frame">
        <div className="course-page-surface" style={{ transform: `scale(${scale})` }}>
          <CreatorSkillIntro />
        </div>
      </div>
    </main>
  );
}
