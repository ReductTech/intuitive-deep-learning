import { useState } from 'react';
import { Select, Typography } from '../../shared/react';
import documents from 'virtual:creator-skill-documents';
import './SkillConstraintsPage.css';

const groups = [
  { title:'内容结构约束', description:'明确页面的知识结构和教学重点', items:['标题 / 要点 / 知识顺序','与前后页面的内容衔接'], color:'#123ecb', background:'#eaf3ff', icon:'document' },
  { title:'交互行为约束', description:'定义需要的交互形式和反馈方式', items:['滑杆 / 按钮 / 动画 / 反馈','交互逻辑与变化规则'], color:'#ed651c', background:'#fff2e5', icon:'cursor' },
  { title:'视觉风格约束', description:'规定整体的视觉语言和布局要求', items:['配色 / 字体 / 布局 / 留白','保持课程整体风格一致'], color:'#6933d9', background:'#f0eaff', icon:'palette' },
  { title:'页面规范约束', description:'统一的版式和交互习惯', items:['页面结构与元素位置','交互样式和动效规范'], color:'#00a584', background:'#e5f7f2', icon:'layout' },
  { title:'其他', description:'补充特殊要求，沉淀创作经验', items:['代码风格 / 资源使用','自进化机制：沉淀修正经验'], color:'#ed397a', background:'#ffedf3', icon:'evolve' },
];
function ConstraintIcon({kind}:{kind:string}) {
  const paths:Record<string,string>={document:'M16 7h19l13 13v37H16ZM35 7v15h13M24 32h16M24 41h16M24 50h10',cursor:'M14 8l37 29-20 1-9 17ZM31 38l10 18',palette:'M32 8C17 8 7 19 7 33s11 24 24 24c7 0 10-4 7-9-4-6 1-10 9-9 8 0 11-5 10-12C55 15 44 8 32 8ZM21 22h.1M34 17h.1M46 25h.1M17 36h.1',layout:'M10 12h44v40H10ZM10 32h44M29 32v20',evolve:'M49 22A21 21 0 0 0 14 17l-5 8M9 12v13h13M15 42a21 21 0 0 0 35 5l5-8M55 52V39H42M25 33l5 5 10-12'};
  return <svg viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d={paths[kind]}/></svg>;
}
export function SkillConstraintsPage(){
  const [selectedPath, setSelectedPath] = useState('SKILL.md');
  const selectedDocument = documents.find(document => document.path === selectedPath) ?? documents[0];
  return <article className="cg-constraints-page cg-creator-typography" aria-labelledby="cg-constraints-title">
  <header><Typography as="h1" id="cg-constraints-title" variant="display" tone="inherit">Creator Skill：以 Markdown 为主的各式约束</Typography><Typography variant="subtitle" tone="inherit">通过结构化的方式描述教学内容、交互和视觉要求，让 Codex 按照统一的规范生成高质量的教学页面。</Typography></header>
  <section className="cg-constraints-editor" aria-label="Creator Skill Markdown 源文件预览" onKeyDown={event => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End'].includes(event.key)) event.stopPropagation();
  }}>
    <div className="cg-constraints-editor-bar">
      <span className="cg-constraints-dot"/><span className="cg-constraints-dot"/><span className="cg-constraints-dot"/>
      <Select label="选择 Markdown 文件" value={selectedDocument.path} onChange={setSelectedPath}
        controlClassName="cg-constraints-file-select"
        options={documents.map(document => ({value:document.path,label:<Typography as="span" variant="bodySmall" tone="inherit">{document.path}</Typography>}))}/>
    </div>
    <div className="cg-constraints-code" key={selectedDocument.path} tabIndex={0} role="region" aria-label={`${selectedDocument.path} 源码`}>
      {selectedDocument.content.split(/\r?\n/).map((line,i)=><div className="cg-constraints-line" key={i}><Typography as="span" variant="bodySmall" tone="inherit" className="cg-constraints-number" aria-hidden="true">{i+1}</Typography><Typography as="code" variant="bodySmall" tone="inherit" className={line.startsWith('#')?'cg-constraints-heading':''}>{line||'\u00a0'}</Typography></div>)}
    </div>
  </section>
  <svg className="cg-constraints-links" viewBox="0 0 118 696" aria-hidden="true"><defs><linearGradient id="cg-constraints-arrow"><stop stopColor="#d6e7ff"/><stop offset="1" stopColor="#4888ff"/></linearGradient></defs><path d="M3 297h27v-18l34 35-34 35v-18H3Z" fill="url(#cg-constraints-arrow)"/><path d="M110 61H91q-16 0-16 16v535q0 16 16 16h19M75 199q0-12 16-12h19M75 339h35M75 477h35" fill="none" stroke="#6092ff" strokeWidth="2"/></svg>
  <div className="cg-constraints-groups">{groups.map(g=><section key={g.title} className="cg-constraints-group" style={{background:g.background,color:g.color}}><div className="cg-constraints-icon"><ConstraintIcon kind={g.icon}/></div><div className="cg-constraints-group-copy"><Typography as="h2" variant="h2" tone="inherit">{g.title}</Typography><Typography variant="body" tone="inherit">{g.description}</Typography></div><div className="cg-constraints-checks">{g.items.map(item=><div key={item}><span className="cg-constraints-check" aria-hidden="true">✓</span><Typography variant="bodySmall" tone="inherit">{item}</Typography></div>)}</div></section>)}</div>
</article>;}

