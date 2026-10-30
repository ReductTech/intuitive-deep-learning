import { GomokuLessonProvider } from '../ShowcaseGomokuContext';
import { GomokuPlayPage } from '../pages/GomokuPlayPage/GomokuPlayPage';
import { WindowScanPage } from '../pages/WindowScanPage/WindowScanPage';
import { Typography } from '../../shared/react';
import './ShowcaseGomokuPage.css';

const complete = () => {};
export function ShowcaseGomokuPage({page}:{page:'play'|'scan'}){
 const playing = page === 'play';
 return <article className="aipe-showcase-page" aria-labelledby="aipe-showcase-title" data-example-stage={page}>
   <header className="aipe-showcase-header">
       <div className="aipe-showcase-heading">
         <Typography as="span" variant="bodySmall" tone="inherit" className="aipe-showcase-badge">交互直觉实践示例</Typography>
         <Typography as="h1" id="aipe-showcase-title" variant="h3" tone="inherit">从五子棋，走进卷积</Typography>
       </div>
       <Typography as="p" variant="bodySmall" tone="inherit" className="aipe-showcase-caption">先体验对弈，再观察局部匹配与计算过程</Typography>
       <ol className="aipe-showcase-steps" aria-label="示例知识呈现作品的两个连续环节">
         <li className={playing ? 'is-current' : ''} aria-current={playing ? 'step' : undefined}><Typography as="span" variant="bodySmall" tone="inherit">01 体验对弈</Typography></li>
         <li className={!playing ? 'is-current' : ''} aria-current={!playing ? 'step' : undefined}><Typography as="span" variant="bodySmall" tone="inherit">02 局部匹配</Typography></li>
       </ol>
   </header>
   <section className="aipe-showcase-window" aria-label={playing ? '示例知识呈现作品第一步：体验五子棋对弈' : '示例知识呈现作品第二步：观察棋形的局部匹配'}>
       <div className="aipe-showcase-stage-slot" data-ppt-viewport="完整展示按 0.84 等比缩放的 1600×900 示例知识呈现作品">
         <GomokuLessonProvider><div className="aipe-showcase-course-shell">{playing?<GomokuPlayPage onComplete={complete}/>:<WindowScanPage onComplete={complete}/>}</div></GomokuLessonProvider>
       </div>
   </section>
 </article>;
}
