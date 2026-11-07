import { MissionIntroPageFrame } from '../../pages/MissionIntroPage/MissionIntroPage';
import { TokenizerPageFrame } from '../../pages/TokenizerPage/TokenizerPage';
import './ContextIntuition.css';
interface CompleteProps {
    onComplete: () => void;
}
export function IntegratedMissionCard({ onComplete }: CompleteProps) {
    return <MissionIntroPageFrame onComplete={onComplete}/>;
}
export function IntegratedTokenizerCard({ onComplete }: CompleteProps) {
    return <TokenizerPageFrame onComplete={onComplete}/>;
}
