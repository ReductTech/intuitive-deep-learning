import type { ReactNode } from 'react';
import { Typography } from "@shuku/course-style/react";
import './ShowcaseGomokuPage.css';

export function ShowcaseExampleFrame({ title, children }: { title: string; children: ReactNode }) {
  return <article shuku-edit-id="e-1bcf713f-4b5e-4632-91f5-f1e61e930f86" className="aipe-showcase-page spp-showcase-frame" aria-label={title}>
    <header shuku-edit-id="e-40d9d1e7-ddcb-4721-99a7-35aa9b4ab2ac" className="aipe-showcase-header">
      <Typography shuku-edit-id="e-ca1bc646-2c53-4c92-8ac1-daf8c9482beb" as="h1" variant="body" tone="inherit">交互式直觉实践示例</Typography>
      <div shuku-edit-id="e-29af93c1-5229-440a-b55c-7a724ea351f5" className="aipe-showcase-development">
        <Typography shuku-edit-id="e-aedeb488-101f-4d23-bc95-b28d9f72f303" as="p" variant="bodySmall" tone="inherit" className="aipe-showcase-development-note">当前展示为开发版本，实际内容与效果以正式发布版本为准。</Typography>
        <Typography shuku-edit-id="e-0d035b25-7c8d-4859-8132-c5d8063b4a0a" as="span" variant="bodySmall" tone="inherit" className="aipe-showcase-wip">开发中</Typography>
      </div>
    </header>
    <section shuku-edit-id="e-aee3c1f0-a843-4ee6-8c45-ee42a8ad8417" className="aipe-showcase-window" aria-label={title}>
      <div shuku-edit-id="e-8962b057-1bbe-4f30-b453-dced484d054e" className="aipe-showcase-stage-slot" data-ppt-viewport="完整展示按 0.92 等比缩放的 1600×900 示例知识呈现作品">
        <div shuku-edit-id="e-94000e3e-35a8-460a-9b84-202adaecc612" className="aipe-showcase-course-shell">{children}</div>
      </div>
    </section>
  </article>;
}
