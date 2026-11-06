import { useRef } from 'react';
import { useSceneScale } from '../shared/react/presentation/canvas';
import '../shared/react/styles.css';
import '../shared/react/presentation.css';
import { EverydayChoice } from './pages/everyday-choice-cover/EverydayChoice';

export function BinaryTreeGuide() {
  const frame = useRef<HTMLDivElement>(null);
  const scale = useSceneScale(frame);
  return <main className="bt-guide"><div ref={frame} className="bt-guide-frame">
    <div className="course-page-surface" data-scene-id="everyday-choice" style={{ transform: `scale(${scale})` }}><EverydayChoice /></div>
  </div></main>;
}
