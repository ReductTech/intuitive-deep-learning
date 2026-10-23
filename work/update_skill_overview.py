from pathlib import Path
import json
root = Path(r'C:\Users\Ocean\Documents\GitHub\intuitive-deep-learning')
p = root/'modules/Creator-Guide/pages/SkillOverviewPage.tsx'
s = p.read_text(encoding='utf-8')
a = s.index('const markdown =')
s = s[:a] + '''const guidance = [
  ['# 内容与表达', '先呈现问题，再解释原理', '让交互服务于理解'],
  ['# 视觉与偏好', '突出重点，保留留白', '配色与文字密度可调整'],
];
const rules: [IconKind, string, string][] = [
  ['file', '内容结构', '知识顺序与讲解节奏'],
  ['cursor', '交互行为', '探索方式与反馈建议'],
  ['palette', '视觉风格', '配色、留白与信息层级'],
  ['layout', '表达偏好', '文字密度与呈现方式'],
];
const scaffold: [IconKind, string, string][] = [
  ['cube', '可复用组件', '按钮、滑杆、图表与交互'],
  ['palette', '统一视觉基础', '字体、配色与间距'],
  ['layout', '页面模板', '预设结构，快速复用'],
  ['code', '工具函数', '数据处理与交互逻辑'],
  ['folder', '素材资源', '图片、图标与示例数据'],
];
const benefits: [IconKind, string, string][] = [
  ['code', '无需前端基础', '自然语言描述需求'],
  ['layers', '形式灵活多样', '图表、动画与交互'],
  ['palette', '风格相对稳定', '统一的视觉基础'],
  ['bolt', '专注内容编排', '把精力留给教学设计'],
];
function FeatureList({ items, className }: { items: [IconKind, string, string][]; className: string }) {
  return <div className={className}>{items.map(([icon, title, description]) =>
    <div className="cg-overview-feature" key={title}>
      <OverviewIcon kind={icon}/>
      <div><Typography as="h3" variant="body" tone="inherit">{title}</Typography><Typography variant="bodySmall" tone="inherit">{description}</Typography></div>
    </div>,
  )}</div>;
}
function ComponentSpecimen() {
  return <div className="cg-overview-specimen" role="img" aria-label="组件与模板示意：下拉选择、滑杆、按钮和固定画布。这些是静态示意，不是操作控件。">
    <Typography variant="body" tone="inherit">组件与模板</Typography>
    <div className="cg-overview-specimen-select"><Typography variant="bodySmall" tone="inherit">选择参数</Typography><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m4 7 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2"/></svg></div>
    <svg className="cg-overview-specimen-range" viewBox="0 0 240 32" aria-hidden="true"><path d="M12 16h216" stroke="#d5dfed" strokeWidth="10" strokeLinecap="round"/><path d="M12 16h94" stroke="#519aff" strokeWidth="10" strokeLinecap="round"/><circle cx="106" cy="16" r="11" fill="#247dff" stroke="white" strokeWidth="3"/></svg>
    <div className="cg-overview-specimen-button"><Typography variant="bodySmall" tone="inherit">开始</Typography></div>
    <div className="cg-overview-template" aria-hidden="true"><div className="cg-overview-template-image"><svg viewBox="0 0 100 80"><path d="m0 80 35-45 19 23 17-36 29 58" fill="#77adff"/></svg></div><div className="cg-overview-template-lines"><i/><i/><i/><i/></div><div className="cg-overview-template-dots"><i/><i/><i/></div></div>
    <Typography variant="bodySmall" tone="inherit" align="center">1600 × 900</Typography>
  </div>;
}
export function SkillOverviewPage() {
  return <article className="cg-overview-page cg-creator-typography" aria-labelledby="cg-overview-title">
    <header><Typography as="h1" variant="display" tone="inherit" id="cg-overview-title">Creator Skill：让创作者更专注于内容编排</Typography><Typography variant="bodySmall" tone="inherit">软约束指导内容与表达，硬约束提供组件与模板，让智能体更稳定地实现教学想法。</Typography></header>
    <section className="cg-overview-panel cg-overview-left" aria-labelledby="cg-overview-soft">
      <div className="cg-overview-panel-heading"><Typography as="span" variant="h2" tone="inherit" className="cg-overview-number">1</Typography><div><Typography as="h2" variant="display" tone="inherit" id="cg-overview-soft">软约束</Typography><Typography variant="bodySmall" tone="inherit">描述性的规则与偏好，指导智能体如何设计</Typography></div></div>
      <div className="cg-overview-left-content">
        <div className="cg-overview-editor"><div className="cg-overview-editor-bar"><i/><i/><i/><Typography variant="bodySmall" tone="inherit">设计指引</Typography></div><div className="cg-overview-code">{guidance.map(([title, ...lines]) => <div key={title}><Typography variant="bodySmall" tone="inherit" className="cg-overview-code-title">{title}</Typography>{lines.map(line => <Typography variant="bodySmall" tone="inherit" key={line}>{line}</Typography>)}</div>)}</div></div>
        <FeatureList items={rules} className="cg-overview-rules"/>
      </div>
      <Typography className="cg-overview-panel-caption" variant="bodySmall" tone="inherit" align="center">告诉智能体：怎样做更合适</Typography>
    </section>
    <svg className="cg-overview-arrows" viewBox="0 0 1600 900" aria-hidden="true"><defs><linearGradient id="cg-overview-blue"><stop stopColor="#d8e8ff"/><stop offset="1" stopColor="#367dff"/></linearGradient><linearGradient id="cg-overview-orange"><stop stopColor="#ffb264"/><stop offset="1" stopColor="#ffead0"/></linearGradient></defs><path d="M662 228Q713 226 741 269M724 260l18 11 1-22" fill="none" stroke="url(#cg-overview-blue)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/><path d="M941 228Q890 226 862 269M861 250l1 21 18-11" fill="none" stroke="url(#cg-overview-orange)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/><path d="M800 660v40m-14-13 14 14 14-14" fill="none" stroke="#84a7ff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/></svg>
    <div className="cg-overview-agent"><div className="cg-overview-robot" aria-hidden="true"><div><i/><i/></div></div><Typography variant="h3" tone="inherit">智能体</Typography><Typography variant="body" tone="inherit">+</Typography><Typography variant="body" tone="inherit" className="cg-overview-skill-label">Creator Skill</Typography><div className="cg-overview-agent-checks">{['理解创作需求', '参考设计指引', '调用组件与模板', '生成教学页面'].map(t => <div key={t}><span aria-hidden="true">✓</span><Typography variant="bodySmall" tone="inherit">{t}</Typography></div>)}</div></div>
    <section className="cg-overview-panel cg-overview-right" aria-labelledby="cg-overview-hard">
      <div className="cg-overview-panel-heading"><Typography as="span" variant="h2" tone="inherit" className="cg-overview-number">2</Typography><div><Typography as="h2" variant="display" tone="inherit" id="cg-overview-hard">硬约束</Typography><Typography variant="bodySmall" tone="inherit">由代码实现的组件与模板，落实页面基础</Typography></div></div>
      <div className="cg-overview-right-content"><ComponentSpecimen/><FeatureList items={scaffold} className="cg-overview-scaffold"/></div>
      <Typography className="cg-overview-panel-caption" variant="bodySmall" tone="inherit" align="center">提供智能体：可直接调用的制作基础</Typography>
    </section>
    <div className="cg-overview-benefits">{benefits.map(([icon, title, description]) => <div key={title}><span><OverviewIcon kind={icon}/></span><div><Typography variant="body" tone="inherit">{title}</Typography><Typography variant="bodySmall" tone="inherit">{description}</Typography></div></div>)}</div>
  </article>;
}
'''
p.write_text(s, encoding='utf-8')
p = root/'modules/Creator-Guide/outlines.json'
s = p.read_text(encoding='utf-8')
o = json.loads(s)
page = next(p for p in o['pages'] if p['id'] == 'skill-overview')
updates = {
 'title': 'Creator Skill：让创作者更专注于内容编排',
 'goal': '区分描述性规则与偏好的软约束，以及组件、模板和工具落实的硬约束，理解二者如何协同支持课件制作。',
 'summary': '保留蓝色左栏、居中智能体、橙色右栏和底部四项优势。左侧放大软约束，展示简短设计指引与内容结构、交互行为、视觉风格、表达偏好；右侧放大硬约束，以组件和固定画布示意替换目录树，保留五类工程支撑。',
 'interaction': '无；右侧下拉框、滑杆、按钮与画布仅作静态组件示意，不是本页操作入口。',
 'snippet': 'Creator Skill由两类支撑协同工作。左边是软约束：用描述性的规则与偏好，指导内容组织、交互设计和视觉表达，例如先呈现问题、让交互服务于理解。这些指引告诉智能体怎样做更合适。右边是硬约束：把组件行为、视觉基础和页面结构落实在代码、模板与工具中，让智能体可以直接调用制作基础。这里的硬约束指工程实现层面的支撑，不代表所有页面质量都能自动保证。右侧的下拉框、滑杆、按钮与1600×900画布只是组件与模板的静态示意。两类支撑结合智能体，帮助没有前端基础的创作者制作形式灵活、风格相对稳定的课件，把精力留给内容编排与教学设计。',
}
for key, value in updates.items():
 if key in page:
  s = s.replace(json.dumps(key, ensure_ascii=False)+': '+json.dumps(page[key], ensure_ascii=False), json.dumps(key, ensure_ascii=False)+': '+json.dumps(value, ensure_ascii=False), 1)
 else:
  needle = '"id": "skill-overview",'
  s = s.replace(needle, needle+'\n      '+json.dumps(key, ensure_ascii=False)+': '+json.dumps(value, ensure_ascii=False), 1)
p.write_text(s, encoding='utf-8')
