import { LegacyStageHost } from '../components/FaceLegacyRuntime';
import { useFaceStageCompletion } from './useFaceStageCompletion';

export interface FixedKernelFaceBlockProps {
  onComplete: () => void;
}

export function FixedKernelFaceBlock({ onComplete }: FixedKernelFaceBlockProps) {
  useFaceStageCompletion('face-recog:fixed-complete', onComplete);
  return <LegacyStageHost className="face-react-legacy-host face-react-legacy-host--fixed" stage="fixed" />;
}
