import {requestCourse} from '@shuku/course-runtime/react/courseRequests';
import {currentCourseId} from '@shuku/course-runtime/react/courseState';

export interface CourseTestEvent {
  event_id: string;
  run_id: string;
  module_id: string;
  page_id: string;
  event_name: string;
  occurred_at: string;
  properties: Record<string, unknown>;
}

export function bridgeStatus() {
  const embedded = window.parent !== window;
  return {report: embedded, embedded};
}

export function makeEvent(runId: string, pageId: string, eventName: string, properties: Record<string, unknown>): CourseTestEvent {
  return {event_id: crypto.randomUUID(), run_id: runId, module_id: currentCourseId(),
    page_id: pageId, event_name: eventName, occurred_at: new Date().toISOString(), properties};
}

/** Resolve only when the platform has acknowledged the event. */
export function reportEvent(event: CourseTestEvent): Promise<unknown> {
  return requestCourse({action:'event', payload:{event:event.event_name,
    detail:{...event.properties,event_id:event.event_id,run_id:event.run_id,page_id:event.page_id,occurred_at:event.occurred_at}}});
}
