import { useRef } from 'react';
import { useSceneScale } from "@shuku/course-style/react/presentation/canvas";
import "@shuku/course-style/react/styles.css";
import "@shuku/course-style/react/presentation.css";
import { EverydayChoice } from './pages/everyday-choice-cover/EverydayChoice';

export function BinaryTreeGuide() {
  const frame = useRef<HTMLDivElement>(null);
  const scale = useSceneScale(frame);
  return <main shuku-edit-id="e-7981e44b-4e82-46fc-b57d-e68032233919" className="bt-guide"><div shuku-edit-id="e-24213478-61f3-4bff-b93d-fa8e1a9b3edb" ref={frame} className="bt-guide-frame">
    <div shuku-edit-id="e-9c056e94-1951-4821-a7b1-50e9e529647d" className="course-page-surface" data-scene-id="1e01d924-d7b9-42cc-9d40-6934cbd6e905" style={{ transform: `scale(${scale})` }}><EverydayChoice /></div>
  </div></main>;
}
