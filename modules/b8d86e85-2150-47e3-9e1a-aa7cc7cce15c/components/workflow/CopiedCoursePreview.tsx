import { convolutionCourse } from './copied-course/course';
import { simulationPages } from './simulation';
import { BoardAsNumbersPage } from './copied-course/pages/BoardAsNumbersPage/BoardAsNumbersPage';
import './copied-course/tailwind.css';

const context = { complete: () => undefined, reset: () => undefined, isComplete: false };
/** The provider lives above page navigation so one game's outcome continues into the next page. */
export function CopiedCoursePreview({ page, reviewed = false }: { page: number; reviewed?: boolean }) {
  const item = convolutionCourse.find(item => item.id === simulationPages[page]?.id);
  if (!item) return null;
  return <div shuku-edit-id="e-07d0341e-f3ec-408b-b747-e31a7f866053" className="cg-sim-native" aria-label={`实际课程页面：${item.title}`}>
    <div shuku-edit-id="e-940ad5d3-21ad-48e1-b480-81b3e4b8fead" className="cg-sim-native-inner course-page-surface cg-copy-course-shell cg-copy-tw-root" data-copied-course-page={item.id}>
      {item.id === '16bb7ee8-f569-4e96-9fe9-cf482eeaf5a3' ? <BoardAsNumbersPage onComplete={context.complete} clarifyOrigin={reviewed}/> : item.component(context)}
    </div>
  </div>;
}
