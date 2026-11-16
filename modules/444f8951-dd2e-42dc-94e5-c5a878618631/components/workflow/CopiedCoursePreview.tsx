import { convolutionCourse } from './copied-course/course';
import { simulationPages } from './simulation';
import { BoardAsNumbersPage } from './copied-course/pages/BoardAsNumbersPage/BoardAsNumbersPage';
import './copied-course/tailwind.css';

const context = { complete: () => undefined, reset: () => undefined, isComplete: false };
/** The provider lives above page navigation so one game's outcome continues into the next page. */
export function CopiedCoursePreview({ page, reviewed = false }: { page: number; reviewed?: boolean }) {
  const item = convolutionCourse.find(item => item.id === simulationPages[page]?.id);
  if (!item) return null;
  return <div shuku-edit-id="e-a47f4e23-b684-4798-82da-0104d68c738a" className="cg-sim-native" aria-label={`实际课程页面：${item.title}`}>
    <div shuku-edit-id="e-5dbc09f9-c829-49c0-97f3-730267997bcf" className="cg-sim-native-inner course-page-surface cg-copy-course-shell cg-copy-tw-root" data-copied-course-page={item.id}>
      {item.id === '8c1957ca-507e-46b7-90ea-19967ee71ef8' ? <BoardAsNumbersPage onComplete={context.complete} clarifyOrigin={reviewed}/> : item.component(context)}
    </div>
  </div>;
}
