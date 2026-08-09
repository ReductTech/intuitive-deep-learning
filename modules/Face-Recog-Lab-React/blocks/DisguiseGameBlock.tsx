import { LegacyStageHost } from '../components/FaceLegacyRuntime';
import { useFaceStageCompletion } from './useFaceStageCompletion';

export interface DisguiseGameBlockProps {
  onComplete: () => void;
}

export function DisguiseGameBlock({ onComplete }: DisguiseGameBlockProps) {
  useFaceStageCompletion('face-recog:act3-complete', onComplete);
  return <LegacyStageHost className="face-react-legacy-host face-react-legacy-host--game" stage="game" />;
}
