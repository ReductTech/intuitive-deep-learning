import { useEffect, useRef, useState, type FormEvent } from 'react';
import { PageRating } from '../learning/PageRating';
import { LessonDevelopers } from '../learning/LessonDevelopers';
import { Typography } from '../typography/Typography';
import { emitTelemetry } from '../telemetry';
import './CourseEndingPage.css';

export interface CourseEndingResource {
  title: string;
  description: string;
  duration?: string;
  thumbnail?: string;
  embedUrl?: string;
  href?: string;
}

export interface CourseEndingPageProps {
  title: string;
  summary: string;
  topics: readonly string[];
  resources?: readonly CourseEndingResource[];
  developerIds?: readonly string[];
  backHref?: string;
  backLabel?: string;
  pageKey: string;
  resourceHeading?: string;
}

export function CourseEndingPage({
  title,
  summary,
  topics,
  resources = [],
  developerIds = ['ssocean'],
  backHref = '/',
  backLabel = '返回课程目录',
  pageKey,
  resourceHeading = '延伸资源',
}: CourseEndingPageProps) {
  const [activeResource, setActiveResource] = useState<CourseEndingResource | null>(null);
  const [resourcePage, setResourcePage] = useState(0);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const videoDialogRef = useRef<HTMLDialogElement>(null);
  const feedbackDialogRef = useRef<HTMLDialogElement>(null);
  const pageCount = Math.max(1, Math.ceil(resources.length / 4));
  const visibleResources = resources.slice(resourcePage * 4, resourcePage * 4 + 4);

  useEffect(() => {
    const dialog = videoDialogRef.current;
    if (activeResource?.embedUrl && dialog && !dialog.open) dialog.showModal();
    if ((!activeResource?.embedUrl || !activeResource) && dialog?.open) dialog.close();
  }, [activeResource]);

  useEffect(() => {
    const dialog = feedbackDialogRef.current;
    if (feedbackOpen && dialog && !dialog.open) dialog.showModal();
    if (!feedbackOpen && dialog?.open) dialog.close();
  }, [feedbackOpen]);

  function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const message = String(formData.get('feedback') ?? '').trim();
    if (!message) return;
    emitTelemetry('course_ending_feedback', feedbackDialogRef.current, {
      page_key: pageKey,
      feedback: message,
    });
    setFeedbackSent(true);
    setFeedbackOpen(false);
  }

  return (
    <main className="edu-course-ending" aria-labelledby="course-ending-title">
      <section className="edu-course-ending-hero">
        <div className="edu-course-ending-hero-art" aria-hidden="true"><i /><i /><i /><i /><span /></div>
        <nav className="edu-course-ending-nav" aria-label="课程导航">
          <a href={backHref}><span aria-hidden="true">←</span>{backLabel}</a>
        </nav>
        <div className="edu-course-ending-intro">
          <Typography as="h1" variant="display" id="course-ending-title">{title}</Typography>
          <Typography as="p" variant="body" tone="muted"><strong>课程总结：</strong>{summary}</Typography>
          <ul className="edu-course-ending-topics" aria-label="本节知识点">
            {topics.map((topic) => <li key={topic}>{topic}</li>)}
          </ul>
        </div>
      </section>

      {resources.length > 0 && <section className="edu-course-ending-resources" aria-labelledby="course-ending-resources-title">
        <header><h2 id="course-ending-resources-title">{resourceHeading}</h2>{pageCount > 1 && <div className="edu-course-ending-carousel" aria-label="资源分页">
          <button type="button" aria-label="上一组资源" disabled={resourcePage === 0} onClick={() => setResourcePage((page) => Math.max(0, page - 1))}>‹</button>
          <span>{resourcePage + 1} / {pageCount}</span>
          <button type="button" aria-label="下一组资源" disabled={resourcePage >= pageCount - 1} onClick={() => setResourcePage((page) => Math.min(pageCount - 1, page + 1))}>›</button>
        </div>}</header>
        <div className="edu-course-ending-resource-grid" data-count={visibleResources.length}>
          {visibleResources.map((resource, index) => {
            const cardContent = <>
              <span className={`edu-course-ending-thumb edu-course-ending-thumb--${(resourcePage * 4 + index) % 4}`}>
                {resource.thumbnail && <img src={resource.thumbnail} alt="" loading="lazy" />}
                {resource.duration && <time>{resource.duration}</time>}
                {resource.embedUrl && <span className="edu-course-ending-play" aria-hidden="true">▶</span>}
              </span>
              <span className="edu-course-ending-resource-copy"><strong>{resource.title}</strong><span>{resource.description}</span></span>
            </>;
            return resource.embedUrl
              ? <button className="edu-course-ending-resource" type="button" key={resource.title} onClick={() => setActiveResource(resource)}>{cardContent}</button>
              : resource.href
                ? <a className="edu-course-ending-resource" href={resource.href} key={resource.title} target="_blank" rel="noreferrer">{cardContent}</a>
                : <article className="edu-course-ending-resource" key={resource.title}>{cardContent}</article>;
          })}
        </div>
      </section>}

      <footer className="edu-course-ending-meta">
        <div className="edu-course-ending-developers"><LessonDevelopers githubIds={developerIds} /></div>
        <div className="edu-course-ending-rating"><PageRating pageKey={pageKey} /></div>
        <button className="edu-course-ending-feedback" type="button" onClick={() => { setFeedbackSent(false); setFeedbackOpen(true); }}>
          <span aria-hidden="true">✎</span>{feedbackSent ? '反馈已记录' : '反馈意见'}
        </button>
      </footer>

      <dialog className="edu-course-ending-dialog" ref={videoDialogRef} aria-label={activeResource?.title ?? '视频播放'} onClose={() => setActiveResource(null)} onClick={(event) => { if (event.target === videoDialogRef.current) videoDialogRef.current?.close(); }}>
        <header><strong>{activeResource?.title}</strong><button type="button" aria-label="关闭视频" onClick={() => videoDialogRef.current?.close()}>×</button></header>
        <div className="edu-course-ending-video"><iframe key={activeResource?.embedUrl} src={activeResource?.embedUrl} title={activeResource?.title ?? '延伸视频'} allow="autoplay; fullscreen; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div>
      </dialog>

      <dialog className="edu-course-ending-feedback-dialog" ref={feedbackDialogRef} aria-labelledby="course-ending-feedback-title" onClose={() => setFeedbackOpen(false)}>
        <form onSubmit={submitFeedback}>
          <header><Typography as="h2" variant="h2" id="course-ending-feedback-title">课程反馈</Typography><button type="button" aria-label="关闭反馈" onClick={() => feedbackDialogRef.current?.close()}>×</button></header>
          <label htmlFor="course-ending-feedback-text">你希望我们改进什么？</label>
          <textarea id="course-ending-feedback-text" name="feedback" rows={4} maxLength={1000} required />
          <button type="submit">提交反馈</button>
        </form>
      </dialog>
    </main>
  );
}
