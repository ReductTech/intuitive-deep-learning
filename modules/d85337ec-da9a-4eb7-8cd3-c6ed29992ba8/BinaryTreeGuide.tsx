import { useRef } from 'react';
import { useSceneScale } from "@shuku/course-style/react/presentation/canvas";
import "@shuku/course-style/react/styles.css";
import "@shuku/course-style/react/presentation.css";
import { EverydayChoice } from './pages/everyday-choice-cover/EverydayChoice';

export function BinaryTreeGuide() {
  const frame = useRef<HTMLDivElement>(null);
  const scale = useSceneScale(frame);
  return <main className="bt-guide"><div ref={frame} className="bt-guide-frame">
    <div className="course-page-surface" data-scene-id="1e01d924-d7b9-42cc-9d40-6934cbd6e905" style={{ transform: `scale(${scale})` }}><EverydayChoice /></div>
  </div></main>;
}
