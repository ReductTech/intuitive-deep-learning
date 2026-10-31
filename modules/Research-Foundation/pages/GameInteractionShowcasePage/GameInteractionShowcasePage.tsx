import { GomokuLessonProvider } from '../../../Convolution-Kernel-Intro/LessonContext';
import { WindowScanPage } from '../../../Convolution-Kernel-Intro/pages/WindowScanPage/WindowScanPage';
import '../../components/InteractionShowcase.css';

export function GameInteractionShowcasePage(){
 return <section className="rf-page rf-interaction-showcase rf-game-showcase" aria-label="真实交互作品：拖动棋盘窗口，观察局部匹配"><GomokuLessonProvider><WindowScanPage onComplete={()=>{}}/></GomokuLessonProvider></section>;
}
