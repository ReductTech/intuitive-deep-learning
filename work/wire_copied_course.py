from pathlib import Path
p=Path('modules/Creator-Guide/components/workflow/WorkflowSimulationPreview.tsx');s=p.read_text(encoding='utf-8');s=s.replace("import { AssemblyGomoku } from '../assembly/AssemblyGomoku';", "import { CopiedCoursePreview } from './CopiedCoursePreview';")
a=s.index('  if ((browsing || !isOutline)');b=s.index("  if (view === 'outline-basic'",a)
s=s[:a]+'''  if ((browsing || !isOutline) && !firstPageDemo) {
    if (view === 'page' || view === 'review') return <CopiedCoursePreview page={page}/>;
    const item = simulationPages[page];
    return <figure className="cg-sim-design cg-sim-course-thumbnail"><img src={asset(`course-thumbnails/${item.id}.png`)} alt={`课程参考缩略图：${item.title}`}/></figure>;
  }
'''+s[b:]
a=s.index("  if ((view === 'page'");b=s.index('\n  const item =',a)
s=s[:a]+"  if ((view === 'page' || view === 'review') && page === 0) return <CopiedCoursePreview page={page}/>;"+s[b:]
p.write_text(s,encoding='utf-8')
p=Path('modules/Creator-Guide/pages/CreationWorkflowPage.tsx');s=p.read_text(encoding='utf-8');s=s.replace("import './CreationWorkflowPage.css';", "import { GomokuLessonProvider } from '../components/workflow/copied-course/LessonContext';\nimport './CreationWorkflowPage.css';");s=s.replace('return <article className=', 'return <GomokuLessonProvider key={runId}><article className=');s=s.replace("closest('button,input,textarea,svg,summary')", "closest('button,input,textarea,svg,canvas,summary,.cg-sim-native')");s=s.replace('  </article>;', '  </article></GomokuLessonProvider>;');p.write_text(s,encoding='utf-8')
p=Path('modules/Creator-Guide/components/NativeStudyPreview.tsx');s=p.read_text(encoding='utf-8');s=s.replace('../../Convolution-Kernel-Intro/GuidePage','./workflow/copied-course/GuidePage').replace('../../Convolution-Kernel-Intro/LessonContext','./workflow/copied-course/LessonContext').replace('course-shell cktw-root','cg-copy-course-shell cg-copy-tw-root');p.write_text(s,encoding='utf-8')
