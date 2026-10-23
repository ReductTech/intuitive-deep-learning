import { useRef, useState } from 'react';
import { QuestionModeProvider } from '../../modules/shared/react/learning/QuestionMode';
import { useSceneScale } from '../../modules/shared/react/presentation/canvas';
import type { DeckDefinition } from '../../modules/shared/react/presentation';
import type { CreatorProject } from '../creator/model';
import { TextPage } from './TextPage';
import './RuntimePlayer.css';
export function RuntimePlayer({ project, deck }: { project: CreatorProject; deck?: DeckDefinition }) {
  const [index, setIndex] = useState(0), [completed, setCompleted] = useState<string[]>([]);
  const viewport = useRef<HTMLDivElement>(null), scale = useSceneScale(viewport);
  const page = project.pages[index], scene = deck?.scenes.find(s => s.id === page.nativeId);
  return <main className="shuku-player"><header><strong>{project.title}</strong><span>{page.title}</span></header><div className="shuku-player-viewport" ref={viewport}><div style={{width:1600*scale,height:900*scale}}><div className="shuku-player-slide course-shell ng-ppt-slide-surface" style={{transform:`scale(${scale})`}}>{scene ? <div className="shuku-native course-page-surface ppt-slide-surface"><QuestionModeProvider mode="ppt">{scene.render({complete:()=>setCompleted(v=>[...v,page.id]),reset:()=>setCompleted(v=>v.filter(x=>x!==page.id)),isComplete:completed.includes(page.id)})}</QuestionModeProvider></div> : <TextPage key={page.id} title={project.title} page={page} />}</div></div></div><footer><button disabled={!index} onClick={()=>setIndex(index-1)}>上一页</button><span>{index+1} / {project.pages.length}</span><button disabled={index===project.pages.length-1} onClick={()=>setIndex(index+1)}>下一页</button></footer></main>;
}
