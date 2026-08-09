import { LegacyStageHost } from '../components/FaceLegacyRuntime';
import { useFaceStageCompletion } from './useFaceStageCompletion';

export interface LearnableCnnBlockProps {
  onComplete: () => void;
}

export function LearnableCnnBlock({ onComplete }: LearnableCnnBlockProps) {
  useFaceStageCompletion('face-recog:cnn-trained', onComplete);
  return <LegacyStageHost className="face-react-legacy-host face-react-legacy-host--cnn" stage="cnn" />;
}
