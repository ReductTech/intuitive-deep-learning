import { convolutionCourse } from './copied-course/course';
import { simulationPages } from './simulation';
import { BoardAsNumbersPage } from './copied-course/pages/BoardAsNumbersPage/BoardAsNumbersPage';
import './copied-course/tailwind.css';

const context = { complete: () => undefined, reset: () => undefined, isComplete: false };
/** The provider lives above page navigation so one game's outcome continues into the next page. */
export function CopiedCoursePreview({ page, reviewed = false }: { page: number; reviewed?: boolean }) {
  const item = convolutionCourse.find(item => item.id === simulationPages[page]?.id);
  if (!item) return null;
  return <div className="cg-sim-native" aria-label={`实际课程页面：${item.title}`}>
    <div className="cg-sim-native-inner course-page-surface cg-copy-course-shell cg-copy-tw-root" data-copied-course-page={item.id}>
      {item.id === '8c1957ca-507e-46b7-90ea-19967ee71ef8' ? <BoardAsNumbersPage onComplete={context.complete} clarifyOrigin={reviewed}/> : item.component(context)}
    </div>
  </div>;
}
