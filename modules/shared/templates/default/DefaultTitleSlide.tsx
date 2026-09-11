import type { ReactNode } from 'react';
import { Typography } from '../../react/typography/Typography';
import { classNames } from '../../react/utils';
import './default-title-slide.css';

export interface DefaultTitleSlideProps {
  title: ReactNode;
  className?: string;
}

/** 固定 1600×900 的默认 PPT 大标题页；转换为 blog 时保留 title 作为章节标题。 */
export function DefaultTitleSlide({ title, className }: DefaultTitleSlideProps) {
  return (
    <section className={classNames('shared-default-title-slide', className)} data-ppt-canvas data-template="default-title">
      <Typography as="h1" variant="display">{title}</Typography>
    </section>
  );
}
