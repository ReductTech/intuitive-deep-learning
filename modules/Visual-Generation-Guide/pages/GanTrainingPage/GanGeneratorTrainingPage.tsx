import { GanTrainingLesson } from './GanTrainingLesson';
export function GanGeneratorTrainingPage({ onComplete }: { onComplete?: () => void }) {
  return <GanTrainingLesson mode="g" onComplete={onComplete} />;
}
