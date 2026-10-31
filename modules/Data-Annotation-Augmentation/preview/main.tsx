import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GuidePage } from '../GuidePage';
import { DataAnnotationPpt } from '../DataAnnotationPpt';
import { LessonCanvas } from '../components/LessonCanvas';
import { course } from '../course';

const params = new URLSearchParams(window.location.search);
const page = course.find(page => page.id === params.get('slide')) ?? course[0];
const view = params.get('view');
const Component = page.Component;
createRoot(document.getElementById('root')!).render(<StrictMode>
  {view === 'ppt' ? <DataAnnotationPpt /> : view === 'page' ? <main className="daa-preview"><LessonCanvas fitHeight><Component /></LessonCanvas></main> : <GuidePage />}
</StrictMode>);
