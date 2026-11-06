import { GomokuLessonProvider } from '../ShowcaseGomokuContext';
import { GomokuPlayPage } from '../pages/GomokuPlayPage/GomokuPlayPage';
import { WindowScanPage } from '../pages/WindowScanPage/WindowScanPage';
import { KernelDesignPage } from '../pages/KernelDesignPage/KernelDesignPage';
import { ShowcaseExampleFrame } from './ShowcaseExampleFrame';

const complete = () => {};
export function ShowcaseGomokuPage({page}:{page:'play'|'scan'|'design'}){
 const playing = page === 'play';
 return <ShowcaseExampleFrame title={playing?'体验五子棋对弈':page==='design'?'根据棋形调整模板':'观察棋形的局部匹配'}>
   <GomokuLessonProvider>{playing?<GomokuPlayPage onComplete={complete}/>:page==='design'?<KernelDesignPage onComplete={complete}/>:<WindowScanPage onComplete={complete}/>}</GomokuLessonProvider>
 </ShowcaseExampleFrame>;
}
