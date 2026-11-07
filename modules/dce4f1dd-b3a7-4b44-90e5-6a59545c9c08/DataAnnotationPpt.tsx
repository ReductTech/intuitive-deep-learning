import { SceneDeck, type DeckDefinition } from '../shared/react/presentation';
import { course } from './course';
import { assetId } from './data';
import outline from './outlines.json';
import './preview/preview.css';
export const deck: DeckDefinition = {
  id: outline.id, title: outline.title, subtitle: '明确任务 → 可靠标注 → 有效增广 → 独立数据 → 训练策略 → 验证迁移',
  scenes: course.map(({id,title,section,Component})=>({id,title,section,render:()=> <div className="daa-ppt-page"><Component /></div>})),
};
export const getPptNotes = (id: string) => [{text: course.find(page=>page.id===id)?.snippet ?? '', selectors: []}];
export function DataAnnotationPpt() {
  return <SceneDeck catalog={[deck]} moduleId={outline.id} assetId={assetId} progressKey="lesson-flow:data-annotation-augmentation-v8" getNotes={getPptNotes} />;
}
