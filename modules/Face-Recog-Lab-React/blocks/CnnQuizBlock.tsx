import { LegacyStageHost } from '../components/FaceLegacyRuntime';
import { useFaceStageCompletion } from './useFaceStageCompletion';

export interface CnnQuizBlockProps {
  onComplete: () => void;
}

export function CnnQuizBlock({ onComplete }: CnnQuizBlockProps) {
  useFaceStageCompletion('face-recog:understanding-complete', onComplete);
  return <LegacyStageHost className="face-react-legacy-host face-react-legacy-host--quiz" stage="quiz" />;
}
