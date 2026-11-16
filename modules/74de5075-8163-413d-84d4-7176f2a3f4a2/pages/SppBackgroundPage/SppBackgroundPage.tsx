import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';

import { moduleIdentity } from '../../outlines.json';
import './SppBackgroundPage.css';

const slides = {
  'ai-acceleration': 'AI 正在加速科研与工程',
  'conference-growth': '前沿成果的供给，正在快速增长',
  'math-results': '当数学成果开始批量出现',
  'github-growth': '工程产出的增长，也在冲击基础设施',
} as const;

export function SppBackgroundPage({ slide }: { slide: keyof typeof slides }) {
  return <section shuku-edit-id="e-59aee438-a025-465f-b117-c3cff39684ab" className="spp-background-page" aria-label={slides[slide]}>
    <img shuku-edit-id="e-1bee47e1-9f7f-4604-8147-b1cd1c606518" src={moduleAssetUrl(`images/spp/background/${slide}.jpg`)} alt={slides[slide]} draggable={false}/>
  </section>;
}
