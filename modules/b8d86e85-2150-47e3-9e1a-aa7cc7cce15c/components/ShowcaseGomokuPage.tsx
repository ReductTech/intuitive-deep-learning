import { GomokuLessonProvider } from '../ShowcaseGomokuContext';
import { GomokuPlayPage } from '../pages/GomokuPlayPage/GomokuPlayPage';
import { WindowScanPage } from '../pages/WindowScanPage/WindowScanPage';
import { Typography } from "@shuku/course-style/react";
import './ShowcaseGomokuPage.css';

const complete = () => {};
export function ShowcaseGomokuPage({page}:{page:'play'|'scan'}){
 const playing = page === 'play';
 return <article shuku-edit-id="e-0d8d00d7-e6a2-4a65-b706-9fea628d010c" className="aipe-showcase-page" aria-labelledby="aipe-showcase-title" data-example-stage={page}>
   <header shuku-edit-id="e-8c5c78fe-d697-4f5c-ba83-1ac229db4763" className="aipe-showcase-header">
       <div shuku-edit-id="e-7170f20b-86ec-48d7-b180-1128cc162394" className="aipe-showcase-heading">
         <Typography shuku-edit-id="e-99621e86-68e6-4795-9db8-98a27f950ea3" as="span" variant="bodySmall" tone="inherit" className="aipe-showcase-badge">交互直觉实践示例</Typography>
         <Typography shuku-edit-id="e-25a51888-47ca-4f0f-a8e4-1d0325d8e443" as="h1" id="aipe-showcase-title" variant="h3" tone="inherit">从五子棋，走进卷积</Typography>
       </div>
       <Typography shuku-edit-id="e-b5f2ff93-9593-40e7-9262-97b8abc99411" as="p" variant="bodySmall" tone="inherit" className="aipe-showcase-caption">先体验对弈，再观察局部匹配与计算过程</Typography>
       <ol shuku-edit-id="e-852f01ef-2371-4648-8abd-82ac75149032" className="aipe-showcase-steps" aria-label="示例知识呈现作品的两个连续环节">
         <li shuku-edit-id="e-6b91d693-80ea-49bd-ac2a-94f8ba7f00bf" className={playing ? 'is-current' : ''} aria-current={playing ? 'step' : undefined}><Typography shuku-edit-id="e-2cf8fcfb-c0c4-464e-a61c-74a76fbdd5fe" as="span" variant="bodySmall" tone="inherit">01 体验对弈</Typography></li>
         <li shuku-edit-id="e-b86d1048-c2c4-4806-b65f-e83f16044856" className={!playing ? 'is-current' : ''} aria-current={!playing ? 'step' : undefined}><Typography shuku-edit-id="e-9eff31b3-b503-45f2-b054-185142523edf" as="span" variant="bodySmall" tone="inherit">02 局部匹配</Typography></li>
       </ol>
   </header>
   <section shuku-edit-id="e-85853572-99a4-499c-b569-a06f7321734a" className="aipe-showcase-window" aria-label={playing ? '示例知识呈现作品第一步：体验五子棋对弈' : '示例知识呈现作品第二步：观察棋形的局部匹配'}>
       <div shuku-edit-id="e-e9ce62b7-7ba5-4a4f-a3fa-97b024935b07" className="aipe-showcase-stage-slot" data-ppt-viewport="完整展示按 0.84 等比缩放的 1600×900 示例知识呈现作品">
         <GomokuLessonProvider><div shuku-edit-id="e-d44b60dd-b56b-4812-81bc-d59d1e787740" className="aipe-showcase-course-shell">{playing?<GomokuPlayPage onComplete={complete}/>:<WindowScanPage onComplete={complete}/>}</div></GomokuLessonProvider>
       </div>
   </section>
 </article>;
}
