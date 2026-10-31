import { RealHeadTrainingPage } from './RealHeadTrainingPage';
export interface BuildTrainingPlanPageProps { onComplete?: () => void; }
export function BuildTrainingPlanPage({ onComplete }: BuildTrainingPlanPageProps) {
  return <RealHeadTrainingPage onComplete={onComplete} />;
}
