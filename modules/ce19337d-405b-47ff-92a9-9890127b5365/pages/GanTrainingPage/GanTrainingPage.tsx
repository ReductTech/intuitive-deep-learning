import { GanTrainingLesson } from './GanTrainingLesson';
export function GanTrainingPage({ onComplete }: { onComplete?: () => void }) {
  return <GanTrainingLesson mode="d" onComplete={onComplete} />;
}
