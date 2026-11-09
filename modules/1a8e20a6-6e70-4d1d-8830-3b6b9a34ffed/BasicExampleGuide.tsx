import { useRef } from 'react';
import { useSceneScale } from "@shuku/course-style/react/presentation/canvas";
import "@shuku/course-style/react/styles.css";
import "@shuku/course-style/react/presentation.css";
import { CreatorSkillIntro } from './pages/CreatorSkillIntro/CreatorSkillIntro';
import outline from './outlines.json';

export function BasicExampleGuide() {
  const frame = useRef<HTMLDivElement>(null);
  const scale = useSceneScale(frame);
  return (
    <main className="be-guide">
      <div ref={frame} id={outline.pages.find(page => page.id === 'f44e1a4d-1b51-4732-89ac-338e08d2ef97')!.id} className="be-guide-frame">
        <div className="course-page-surface" style={{ transform: `scale(${scale})` }}>
          <CreatorSkillIntro />
        </div>
      </div>
    </main>
  );
}
