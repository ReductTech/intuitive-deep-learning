import { GomokuLessonProvider } from '../../../38cd1c79-d8b7-462a-b208-a567c5cd89c4/LessonContext';
import { WindowScanPage } from '../../../38cd1c79-d8b7-462a-b208-a567c5cd89c4/pages/WindowScanPage/WindowScanPage';
import '../../components/InteractionShowcase.css';

export function GameInteractionShowcasePage(){
 return <section shuku-edit-id="e-b8c55049-7276-4f27-bd94-08b2eb7b4fd3" className="rf-page rf-interaction-showcase rf-game-showcase" aria-label="真实交互作品：拖动棋盘窗口，观察局部匹配"><GomokuLessonProvider><WindowScanPage onComplete={()=>{}}/></GomokuLessonProvider></section>;
}
