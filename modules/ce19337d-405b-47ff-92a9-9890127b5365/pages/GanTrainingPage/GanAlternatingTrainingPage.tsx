import { GanTrainingLesson } from './GanTrainingLesson';
export function GanAlternatingTrainingPage({ onComplete }: { onComplete?: () => void }) {
  return <GanTrainingLesson mode="cycle" onComplete={onComplete} />;
}
