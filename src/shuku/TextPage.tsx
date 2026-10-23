import { useState } from 'react';
import { Typography } from '../../modules/shared/react/typography';
import type { CreatorPage } from '../creator/model';
export function TextPage({ title, page }: { title: string; page: CreatorPage }) {
  const [complete, setComplete] = useState(false);
  return <section className="shuku-text-page"><Typography variant="bodySmall" tone="muted">{title}</Typography><Typography variant="h1">{page.title}</Typography><Typography variant="subtitle">{page.goal}</Typography><Typography variant="body">{page.summary}</Typography>{page.note && <Typography variant="body" tone="muted">{page.note}</Typography>}<button onClick={() => setComplete(!complete)} aria-pressed={complete}>{complete ? '✓ 已完成思考' : '我已经理解'}</button></section>;
}
