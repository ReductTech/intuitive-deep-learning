import { useId, useState, type HTMLAttributes } from 'react';
import { classNames } from '../utils';

export interface RelatedVideo {
  title: string;
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
  const activeVideo = activeIndex === null ? undefined : videos[activeIndex];

  if (videos.length === 0) return null;

  return (
    <section className={classNames('dl-related-section', className)} {...props}>
      {showHeader && <h3>{title}</h3>}
      {showHeader && description && <p>{description}</p>}
      <div className="dl-video-strip" aria-label={ariaLabel}>
        {videos.map((video, index) => (
          <article className={classNames('dl-video-card', activeIndex === index && 'is-active')} key={`${video.title}-${index}`}>
            {video.embed ? (
              <div className="dl-video-embed" dangerouslySetInnerHTML={{ __html: prepareEmbed(video.embed) }} />
            ) : (
              <div className="dl-video-placeholder">暂无视频嵌入</div>
            )}
            {video.embed && (
              <button
                className="dl-video-trigger"
                type="button"
                aria-controls={viewerId}
                aria-expanded={activeIndex === index}
                aria-label={`在页面中播放：${video.title}`}
                onClick={() => setActiveIndex(index)}
              >
                <span className="dl-video-play" aria-hidden="true">▶</span>
              </button>
            )}
            <strong>{video.title}</strong>
          </article>
        ))}
      </div>
      <div className="dl-video-viewer" id={viewerId} hidden={!activeVideo}>
        <div className="dl-video-viewer-head">
          <strong>{activeVideo?.title}</strong>
          <button className="dl-video-viewer-close" type="button" aria-label="关闭放大播放" onClick={() => setActiveIndex(null)}>
            ×
          </button>
        </div>
        <div className="dl-video-viewer-media">
          {activeVideo?.embed && <div className="dl-video-embed" dangerouslySetInnerHTML={{ __html: prepareEmbed(activeVideo.embed) }} />}
        </div>
      </div>
    </section>
  );
}
