import { GomokuLessonProvider } from '../ShowcaseGomokuContext';
import { GomokuPlayPage } from '../pages/GomokuPlayPage/GomokuPlayPage';
import { WindowScanPage } from '../pages/WindowScanPage/WindowScanPage';
import './ShowcaseGomokuPage.css';

const complete = () => {};
export function ShowcaseGomokuPage({page}:{page:'play'|'scan'}){
 return <GomokuLessonProvider><div className="aipe-showcase-course-shell">{page==='play'?<GomokuPlayPage onComplete={complete}/>:<WindowScanPage onComplete={complete}/>}</div></GomokuLessonProvider>;
}
