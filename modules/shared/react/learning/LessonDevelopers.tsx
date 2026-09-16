import { Typography } from '../typography/Typography';
import { githubAvatarUrl, githubProfileUrl } from './developers';

export function LessonDevelopers({ githubIds }: { githubIds: readonly string[] }) {
  const developers = [...new Set(githubIds.map((id) => id.trim()).filter(Boolean))];
  if (developers.length === 0) return null;

  return (
    <div className="edu-lesson-developers">
      <button className="edu-lesson-developers-trigger" type="button" aria-label="查看本节开发者">
        <span className="edu-lesson-developers-avatars" aria-hidden="true">
          {developers.slice(0, 3).map((githubId) => (
            <img key={githubId} src={githubAvatarUrl(githubId)} alt="" />
          ))}
        </span>
        <Typography as="span" variant="bodySmall" tone="muted">本节开发者</Typography>
      </button>
      <div className="edu-lesson-developers-popover" role="tooltip">
        <Typography as="span" variant="bodySmall" tone="muted">开发与维护</Typography>
        <div className="edu-lesson-developers-list">
          {developers.map((githubId) => (
            <a
              className="edu-lesson-developer"
              href={githubProfileUrl(githubId)}
              key={githubId}
              target="_blank"
              rel="noreferrer"
            >
              <img src={githubAvatarUrl(githubId)} alt={`@${githubId} 的 GitHub 头像`} />
              <span>
                <Typography as="strong" variant="body" tone="main">@{githubId}</Typography>
                <Typography as="span" variant="bodySmall" tone="muted">查看 GitHub 主页 ↗</Typography>
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
