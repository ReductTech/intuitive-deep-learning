import { convolutionCourse } from './copied-course/course';
import { simulationPages } from './simulation';
import { BoardAsNumbersPage } from './copied-course/pages/BoardAsNumbersPage/BoardAsNumbersPage';
import './copied-course/tailwind.css';

const context = { complete: () => undefined, reset: () => undefined, isComplete: false };
/** The provider lives above page navigation so one game's outcome continues into the next page. */
export function CopiedCoursePreview({ page, reviewed = false }: { page: number; reviewed?: boolean }) {
  const item = convolutionCourse.find(item => item.id === simulationPages[page]?.id);
  if (!item) return null;
  return <div shuku-edit-id="e-199e2cb1-1ad8-45d4-95b9-922e76599920" className="aipe-replay-cg-sim-native" aria-label={`实际课程页面：${item.title}`}>
    <div shuku-edit-id="e-d13e5ab6-a220-46b0-8e84-c93d74171fc3" className="aipe-replay-cg-sim-native-inner course-page-surface aipe-replay-cg-copy-course-shell aipe-replay-cg-copy-tw-root" data-copied-course-page={item.id}>
      {item.id === '613473b0-4ca0-40e8-a7cb-9c22a1c334d9' ? <BoardAsNumbersPage onComplete={context.complete} clarifyOrigin={reviewed}/> : item.component(context)}
    </div>
  </div>;
}
