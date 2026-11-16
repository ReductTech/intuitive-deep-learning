import { convolutionCourse } from './copied-course/course';
import { simulationPages } from './simulation';
import { BoardAsNumbersPage } from './copied-course/pages/BoardAsNumbersPage/BoardAsNumbersPage';
import './copied-course/tailwind.css';

const context = { complete: () => undefined, reset: () => undefined, isComplete: false };
/** The provider lives above page navigation so one game's outcome continues into the next page. */
export function CopiedCoursePreview({ page, reviewed = false }: { page: number; reviewed?: boolean }) {
  const item = convolutionCourse.find(item => item.id === simulationPages[page]?.id);
  if (!item) return null;
  return <div shuku-edit-id="e-40d2265e-6120-4562-8f28-708b74d444c3" className="cg-sim-native" aria-label={`实际课程页面：${item.title}`}>
    <div shuku-edit-id="e-878bb9b2-c9a0-4a5a-8b50-665dd070941c" className="cg-sim-native-inner course-page-surface cg-copy-course-shell cg-copy-tw-root" data-copied-course-page={item.id}>
      {item.id === '99574d03-8e96-49df-89f6-a3144c21f3f3' ? <BoardAsNumbersPage onComplete={context.complete} clarifyOrigin={reviewed}/> : item.component(context)}
    </div>
  </div>;
}
