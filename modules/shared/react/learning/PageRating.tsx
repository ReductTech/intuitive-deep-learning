import { useEffect, useRef, useState } from 'react';
import {emitCourseEvent} from "@shuku/course-runtime/react/courseRequests";
import {readCourseState,writeCourseState} from "@shuku/course-runtime/react/courseState";
import { Typography } from '../typography/Typography';

export type PageRatingValue = 1 | 2 | 3 | 4 | 5;

export interface PageRatingProps {
  pageKey: string;
}

/** A compact end-of-page signal. The submitted choice is also emitted as `page_rating`. */
export function PageRating({ pageKey }: PageRatingProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [rating, setRating] = useState<PageRatingValue | null>(null);
  const [preview, setPreview] = useState<PageRatingValue | null>(null);
  const stateKey = `page-rating:${pageKey}`;

  useEffect(() => {
    const restored=readCourseState<{rating:number}>(stateKey)?.rating;
    if(typeof restored==='number'&&Number.isInteger(restored)&&restored>=1&&restored<=5)setRating(restored as PageRatingValue);
  }, [stateKey]);

  const submit = (value: PageRatingValue) => {
    if (rating) return;
    setRating(value);
    writeCourseState(stateKey,{rating:value});
    emitCourseEvent('page_rating', {
      state_key: stateKey,
      state: { rating: value },
      page_key: pageKey,
      rating: value,
    });
  };

  return (
    <section className="edu-page-rating" ref={rootRef} aria-label="当页评价">
      {rating ? (
        <Typography variant="bodySmall" tone="muted">感谢你的评分。</Typography>
      ) : (
        <>
          <Typography variant="bodySmall" tone="muted">这一页的学习体验如何？</Typography>
          <div className="edu-page-rating-stars" role="radiogroup" aria-label="学习体验评分">
            {([1, 2, 3, 4, 5] as const).map((value) => (
              <button
                className={value <= (preview ?? 0) ? 'is-previewed' : undefined}
                type="button"
                role="radio"
                aria-checked="false"
                aria-label={`${value} 星评分`}
                key={value}
                onPointerEnter={() => setPreview(value)}
                onPointerLeave={() => setPreview(null)}
                onFocus={() => setPreview(value)}
                onBlur={() => setPreview(null)}
                onClick={() => submit(value)}
              >
                ★
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
