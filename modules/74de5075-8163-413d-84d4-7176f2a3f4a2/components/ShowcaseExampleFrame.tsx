import type { ReactNode } from 'react';
import { Typography } from "@shuku/course-style/react";
import './ShowcaseGomokuPage.css';

export function ShowcaseExampleFrame({ title, children }: { title: string; children: ReactNode }) {
  return <article className="aipe-showcase-page spp-showcase-frame" aria-label={title}>
    <header className="aipe-showcase-header">
      <Typography as="h1" variant="body" tone="inherit">交互式直觉实践示例</Typography>
      <div className="aipe-showcase-development">
        <Typography as="p" variant="bodySmall" tone="inherit" className="aipe-showcase-development-note">当前展示为开发版本，实际内容与效果以正式发布版本为准。</Typography>
        <Typography as="span" variant="bodySmall" tone="inherit" className="aipe-showcase-wip">开发中</Typography>
      </div>
    </header>
    <section className="aipe-showcase-window" aria-label={title}>
      <div className="aipe-showcase-stage-slot" data-ppt-viewport="完整展示按 0.92 等比缩放的 1600×900 示例知识呈现作品">
        <div className="aipe-showcase-course-shell">{children}</div>
      </div>
    </section>
  </article>;
}
