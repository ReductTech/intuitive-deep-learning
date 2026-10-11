import { useEffect, useId, useRef, useState, type HTMLAttributes, type WheelEvent } from 'react';
import { Typography } from '../typography/Typography';
import { classNames } from '../utils';

const VIDEOS_PER_PAGE = 4;

export interface RelatedVideo {
  title: string;
  description?: string;
  duration?: string;
  thumbnail?: string;
  embed?: string;
}

export interface RelatedVideosProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  videos: RelatedVideo[];
  title?: string;
  description?: string;
  showHeader?: boolean;
  ariaLabel?: string;
}

function prepareEmbed(embed: string): string {
  if (!/<iframe\b/i.test(embed)) return embed;
  return embed.replace(/<iframe\b([^>]*)>/i, (match, attributes: string) => {
    if (/\bsandbox\s*=/i.test(attributes)) return match;
    return `<iframe${attributes} sandbox="allow-scripts allow-same-origin allow-forms allow-presentation" allow="autoplay; fullscreen; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin">`;
  });
}

export function RelatedVideos({
  videos,
  title = '相关推荐',
  description,
  showHeader = true,
  ariaLabel = '相关推荐横向列表',
  className,
  ...props
}: RelatedVideosProps) {
  const viewerId = useId();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const ignoreVideoTriggerUntil = useRef(0);
  const ignoreWheelUntil = useRef(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const activeVideo = activeIndex === null ? undefined : videos[activeIndex];
  const pageCount = Math.ceil(videos.length / VIDEOS_PER_PAGE);
  const pageStart = page * VIDEOS_PER_PAGE;
  const visibleVideos = videos.slice(pageStart, pageStart + VIDEOS_PER_PAGE);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (activeVideo && !dialog.open) dialog.showModal();
    if (!activeVideo && dialog.open) dialog.close();
  }, [activeVideo]);

  const changePage = (nextPage: number) => {
    const safePage = Math.max(0, Math.min(nextPage, pageCount - 1));
    if (safePage === page) return;
    ignoreVideoTriggerUntil.current = Date.now() + 180;
    setActiveIndex(null);
    setPage(safePage);
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (pageCount < 2 || Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
    event.preventDefault();
    if (Date.now() < ignoreWheelUntil.current) return;
    ignoreWheelUntil.current = Date.now() + 420;
    changePage(page + (event.deltaY > 0 ? 1 : -1));
  };

  if (videos.length === 0) return null;

  return (
    <section className={classNames('dl-related-section', className)} {...props}>
      {showHeader && <Typography as="h3" variant="h2" tone="accent">{title}</Typography>}
      {showHeader && description && <Typography variant="bodySmall" tone="muted">{description}</Typography>}
      {pageCount > 1 && (
        <nav className="dl-video-pagination" aria-label="视频资源分页">
          <Typography as="span" variant="bodySmall" tone="muted" className="dl-video-page-label">全部视频 · {videos.length}</Typography>
          <span className="dl-video-page-tabs" role="tablist" aria-label="视频资源页组">
            {Array.from({ length: pageCount }, (_, index) => <button className={classNames(index === page && 'is-current')} type="button" role="tab" aria-label={`切换到第 ${index + 1} 组`} aria-selected={index === page} key={index} onClick={() => changePage(index)}><span aria-hidden="true" /></button>)}
          </span>
        </nav>
      )}
      <div className="dl-video-strip" aria-label={ariaLabel} onWheel={handleWheel}>
        {visibleVideos.map((video, offset) => {
          const index = pageStart + offset;
          return <article className={classNames('dl-video-card', activeIndex === index && 'is-active')} key={`${video.title}-${index}`}>
            <div className="dl-video-card-media">{video.thumbnail ? <img src={video.thumbnail} alt="" loading="lazy" /> : <span aria-hidden="true">▶</span>}{video.duration && <time>{video.duration}</time>}{video.embed && <button className="dl-video-trigger" type="button" aria-controls={viewerId} aria-expanded={activeIndex === index} aria-label={`播放：${video.title}`} onClick={() => { if (Date.now() >= ignoreVideoTriggerUntil.current) setActiveIndex(index); }}><span className="dl-video-play" aria-hidden="true">▶</span></button>}</div>
            <div className="dl-video-card-copy"><Typography as="strong" variant="body" tone="accent">{video.title}</Typography>{video.description && <Typography variant="bodySmall" tone="muted">{video.description}</Typography>}{video.duration && <Typography as="span" variant="bodySmall" tone="muted">◷ {video.duration}</Typography>}</div>
          </article>;
        })}
      </div>
      <dialog className="dl-video-viewer" id={viewerId} ref={dialogRef} onClose={() => setActiveIndex(null)} onClick={(event) => { if (event.target === dialogRef.current) dialogRef.current?.close(); }}>
        <div className="dl-video-viewer-head"><Typography as="strong" variant="body" tone="accent">{activeVideo?.title}</Typography><button className="dl-video-viewer-close" type="button" aria-label="关闭视频" onClick={() => dialogRef.current?.close()}>×</button></div>
        <div className="dl-video-viewer-media">{activeVideo?.embed && <div className="dl-video-embed" dangerouslySetInnerHTML={{ __html: prepareEmbed(activeVideo.embed) }} />}</div>
      </dialog>
    </section>
  );
}
