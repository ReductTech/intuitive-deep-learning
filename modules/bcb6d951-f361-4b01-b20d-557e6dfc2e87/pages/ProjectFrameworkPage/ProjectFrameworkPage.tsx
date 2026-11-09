import { Atom, Code2, Pencil, Zap, ArrowRight, FileCode2, Braces } from 'lucide-react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import './ProjectFrameworkPage.css';

function LessonPreview({ index, source = false }: { index: number; source?: boolean }) {
  return <div className={`acw-framework-lesson${source ? ' acw-framework-lesson-source' : ''}`}>
    {source && <div className="acw-framework-pencil" aria-hidden="true"><Pencil /></div>}
    <Typography variant="body">课件 {index}</Typography>
    <div className="acw-framework-lines" aria-hidden="true"><i /><i /><i /></div>
    <Typography as="div" variant="bodySmall" align="center" className="acw-framework-demo-button">下一步</Typography>
    {source && <Typography as="code" variant="bodySmall" className="acw-framework-html">{'<button>'}</Typography>}
  </div>;
}

function SourceFile({ compact = false }: { compact?: boolean }) {
  return <div className={`acw-framework-file${compact ? ' acw-framework-file-compact' : ''}`}>
    <Typography variant="bodySmall" className="acw-framework-file-tab">{compact ? 'TSX' : 'NextButton.tsx'}</Typography>
    <Typography as="code" variant="bodySmall" tone="accent">{compact ? '<Page />' : '<button>…</button>'}</Typography>
    <div className="acw-framework-lines" aria-hidden="true"><i /><i /><i /></div>
  </div>;
}

function BrowserPreview() {
  return <div className="acw-framework-browser" aria-hidden="true">
    <div className="acw-framework-browser-bar"><i /><i /><i /></div>
    <div className="acw-framework-browser-content"><div className="acw-framework-video">▶</div><div className="acw-framework-lines"><i /><i /><i /></div></div>
    <Typography as="div" variant="bodySmall" align="center" className="acw-framework-demo-button">下一步</Typography>
  </div>;
}

export function ProjectFrameworkPage() {
  const page = outline.pages.find(item => item.id === 'a001b726-fc23-4cdb-8c36-925a86656ab2')!;
  return <ContentBlock className="acw-framework-page" data-scene-id={page.id} title={page.title}
    subtitle="以组件复用组织内容，以状态驱动交互，打通 TSX 到浏览器的呈现流程"
    bodyClassName="acw-framework-body">
    <div className="acw-framework-comparison">
      <section className="acw-framework-panel acw-framework-manual">
        <div className="acw-framework-panel-heading"><div className="acw-framework-icon" aria-hidden="true"><Code2 /></div><div><Typography variant="h3">直接写 HTML + JavaScript</Typography><Typography variant="body" tone="muted">能做交互，复杂后需要自己维护</Typography></div></div>
        <div className="acw-framework-manual-lessons">{[1,2,3].map(index => <LessonPreview key={index} index={index} source />)}</div>
        <Typography variant="body" align="center" className="acw-framework-caption">重复界面要组织，状态与画面要同步</Typography>
      </section>
      <ArrowRight className="acw-framework-compare-arrow" aria-hidden="true" />
      <section className="acw-framework-panel acw-framework-react">
        <div className="acw-framework-panel-heading"><div className="acw-framework-icon" aria-hidden="true"><Atom /></div><div><Typography variant="h3">用 React 组织组件</Typography><Typography variant="body" tone="muted">写一次组件，多处组合使用</Typography></div></div>
        <div className="acw-framework-reuse">
          <SourceFile />
          <div className="acw-framework-reuse-targets"><div className="acw-framework-branches" aria-hidden="true"><i /><i /><i /></div><div className="acw-framework-reused-lessons">{[1,2,3].map(index => <div className="acw-framework-reuse-instance" key={index}><LessonPreview index={index} /></div>)}</div></div>
        </div>
        <Typography variant="body" align="center" className="acw-framework-caption">描述当前状态下，界面应该是什么样</Typography>
      </section>
    </div>
    <div className="acw-framework-pipeline" aria-label="从 TSX 源码到浏览器画面的过程">
      <div className="acw-framework-pipeline-source"><SourceFile compact /><div><Typography variant="body">TSX 源码</Typography><Typography variant="bodySmall" tone="muted">TypeScript<br />+ JSX</Typography></div></div>
      <ArrowRight className="acw-framework-arrow" aria-hidden="true" />
      <div className="acw-framework-build"><Zap aria-hidden="true" /><Typography variant="body">Vite 转换 / 构建</Typography></div>
      <ArrowRight className="acw-framework-arrow" aria-hidden="true" />
      <div className="acw-framework-output"><div className="acw-framework-assets" aria-hidden="true"><FileCode2 /><Braces /></div><Typography variant="body">JavaScript<br />+ CSS</Typography></div>
      <div className="acw-framework-runtime"><Typography variant="bodySmall" align="center">React DOM<br />创建与更新 DOM</Typography><ArrowRight aria-hidden="true" /></div>
      <div className="acw-framework-result"><BrowserPreview /><Typography variant="body">浏览器画面</Typography></div>
    </div>
    <Typography variant="bodySmall" tone="muted" align="center" className="acw-framework-entry">浏览器加载 HTML 入口，再执行 JavaScript、应用 CSS</Typography>
  </ContentBlock>;
}
