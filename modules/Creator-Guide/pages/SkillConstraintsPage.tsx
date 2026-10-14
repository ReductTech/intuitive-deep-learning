import { Typography } from '../../shared/react';
import './SkillConstraintsPage.css';

const lines = [
  '# 页面标题', '梯度下降的直观理解', '',
  '## 教学目标', ' -  理解梯度下降的基本思想', ' -  通过交互观察参数更新过程', '',
  '## 核心内容', ' -  梯度的含义', ' -  参数如何沿着梯度方向更新', ' -  损失函数逐步降低的过程', '',
  '## 交互设计', ' -  滑杆：学习率', ' -  按钮：开始 / 暂停 / 重置', ' -  实时显示：当前参数、损失值', '',
  '## 视觉风格', ' -  配色：遵循课程主题色', ' -  字体：清晰易读，保持统一风格', ' -  布局：左图右文，对齐规范', '',
  '## 其他', ' -  保持简洁，避免过多文字', ' -  交互过程要直观、流畅', ' -  记录修正经验，完善创作规则',
];
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
export function SkillConstraintsPage(){return <article className="cg-constraints-page cg-creator-typography" aria-labelledby="cg-constraints-title">
  <header><Typography as="h1" id="cg-constraints-title" variant="display" tone="inherit">Creators Skill：以 Markdown 为主的各式约束</Typography><Typography variant="subtitle" tone="inherit">通过结构化的方式描述教学内容、交互和视觉要求，让 Codex 按照统一的规范生成高质量的教学页面。</Typography></header>
  <section className="cg-constraints-editor" aria-label="Markdown 教学设计示例"><div className="cg-constraints-editor-bar"><span className="cg-constraints-dot"/><span className="cg-constraints-dot"/><span className="cg-constraints-dot"/><Typography variant="bodySmall" tone="inherit">page.md</Typography></div><div className="cg-constraints-code">{lines.map((line,i)=><div className="cg-constraints-line" key={i}><Typography as="span" variant="bodySmall" tone="inherit" className="cg-constraints-number">{i+1}</Typography><Typography as="span" variant="bodySmall" tone="inherit" className={line.startsWith('#')?'cg-constraints-heading':''}>{line||'\u00a0'}</Typography></div>)}</div></section>
  <svg className="cg-constraints-links" viewBox="0 0 118 696" aria-hidden="true"><defs><linearGradient id="cg-constraints-arrow"><stop stopColor="#d6e7ff"/><stop offset="1" stopColor="#4888ff"/></linearGradient></defs><path d="M3 297h27v-18l34 35-34 35v-18H3Z" fill="url(#cg-constraints-arrow)"/><path d="M110 61H91q-16 0-16 16v535q0 16 16 16h19M75 199q0-12 16-12h19M75 339h35M75 477h35" fill="none" stroke="#6092ff" strokeWidth="2"/></svg>
  <div className="cg-constraints-groups">{groups.map(g=><section key={g.title} className="cg-constraints-group" style={{background:g.background,color:g.color}}><div className="cg-constraints-icon"><ConstraintIcon kind={g.icon}/></div><div className="cg-constraints-group-copy"><Typography as="h2" variant="h2" tone="inherit">{g.title}</Typography><Typography variant="body" tone="inherit">{g.description}</Typography></div><div className="cg-constraints-checks">{g.items.map(item=><div key={item}><span className="cg-constraints-check" aria-hidden="true">✓</span><Typography variant="bodySmall" tone="inherit">{item}</Typography></div>)}</div></section>)}</div>
</article>;}

