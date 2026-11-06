import type { ReactNode } from 'react';
import { Button } from '../controls/Button';
import { Typography } from '../typography/Typography';
import { RelatedVideos, type RelatedVideo } from './RelatedVideos';
import { PageRating } from './PageRating';
import { LessonDevelopers } from './LessonDevelopers';

export interface LessonFooterLink {
  href: string;
  label: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
}

export interface LessonFooterProps {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  topics?: readonly string[];
  videos?: RelatedVideo[];
  videosLabel?: ReactNode;
  back?: LessonFooterLink;
  next?: LessonFooterLink;
  developerIds?: readonly string[];
}

/**
 * A module-ending composition: completion context, the next action, and optional
 * related resources.  It deliberately keeps the resource rail secondary so a
 * lesson does not end as a second catalogue page.
 */
export function LessonFooter({
  title,
  description,
  eyebrow = '本节完成',
  topics = [],
  videos = [],
  videosLabel = '延伸观看',
  back,
  next,
  developerIds = ['ssocean'],
}: LessonFooterProps) {
  return (
    <footer className="edu-lesson-footer">
      {back && <nav className="edu-lesson-footer-top" aria-label="课程导航"><Button href={back.href}>{back.label}</Button></nav>}
      <div className="edu-lesson-footer-hero">
        <div className="edu-lesson-footer-copy">
          <Typography as="span" variant="bodySmall" tone="accent" className="edu-kicker">{eyebrow}</Typography>
          <Typography as="h1" variant="display">{title}</Typography>
          {description && <Typography variant="body" tone="muted">{description}</Typography>}
          {topics.length > 0 && <ul className="edu-lesson-footer-topics" aria-label="本节主题">{topics.map((topic) => <li key={topic}>{topic}</li>)}</ul>}
        </div>
        {next && <article className="edu-lesson-footer-next"><Typography as="span" variant="bodySmall" tone="accent">下一节</Typography>{next.title && <Typography as="h2" variant="h2" tone="accent">{next.title}</Typography>}{next.description && <Typography variant="bodySmall" tone="muted">{next.description}</Typography>}<Button href={next.href} variant="primary">{next.label}</Button></article>}
      </div>
      {videos.length > 0 && (
        <div className="edu-lesson-footer-resources">
          <Typography as="h2" variant="h2" tone="accent">{videosLabel}</Typography>
          <RelatedVideos videos={videos} showHeader={false} ariaLabel="延伸观看资源" />
        </div>
      )}
      <div className="edu-lesson-footer-meta">
        <LessonDevelopers githubIds={developerIds} />
        <PageRating />
      </div>
    </footer>
  );
}
