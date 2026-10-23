import { useState } from 'react';
import { Button, RangeControl, Select, Typography } from '../../shared/react';
import './SkillOverviewPage.css';

type IconKind = 'file' | 'cursor' | 'palette' | 'layout' | 'cube' | 'code' | 'folder' | 'layers' | 'bolt';
function OverviewIcon({ kind }: { kind: IconKind }) {
  const paths: Record<IconKind, string> = {
    file: 'M14 6h21l13 13v39H14ZM35 6v15h13M23 32h15M23 42h15M23 51h9',
    cursor: 'M13 7l39 29-20 3-10 18ZM32 39l11 18',
    palette: 'M32 7C17 7 7 19 7 33s11 24 25 24c8 0 10-5 7-9-5-7 1-10 9-9 8 0 11-5 9-13C54 14 44 7 32 7ZM21 22h.1M35 17h.1M46 25h.1M17 36h.1',
    layout: 'M10 10h44v44H10ZM10 28h44M29 28v26',
    cube: 'M32 6 9 18v28l23 13 23-13V18ZM9 18l23 13 23-13M32 31v28',
    code: 'M21 18 8 32l13 14M43 18l13 14-13 14M37 10 27 54',
    folder: 'M7 17h21l6 7h23v31H7ZM7 24v-13h20l6 6h21v7',
    layers: 'M32 7 6 21l26 14 26-14ZM8 33l24 13 24-13M8 45l24 13 24-13',
    bolt: 'M37 5 10 36h21l-4 23 27-33H33Z',
  };
  return <svg viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d={paths[kind]} /></svg>;
}
const guidance = [
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
  ['folder', '素材与工具', '图像素材与数据处理工具'],
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
      <div><Typography as="h3" variant="bodySmall" tone="inherit">{title}</Typography><Typography variant="bodySmall" tone="inherit">{description}</Typography></div>
    </div>,
  )}</div>;
}
function ComponentSpecimen() {
  const [theme, setTheme] = useState('blue');
  const [size, setSize] = useState(70);
  const [applied, setApplied] = useState(false);
  return <div className="cg-overview-specimen" role="group" aria-label="体验组件与模板" data-theme={theme} onKeyDown={event => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Escape', ' '].includes(event.key)) event.stopPropagation();
  }}>
    <Typography variant="bodySmall" tone="inherit">组件与模板</Typography>
    <Select label="选择主题" controlClassName="cg-overview-theme-select" value={theme} onChange={setTheme} options={[
      { value: 'blue', label: <Typography as="span" variant="bodySmall" tone="inherit">蓝色主题</Typography> },
      { value: 'orange', label: <Typography as="span" variant="bodySmall" tone="inherit">橙色主题</Typography> },
    ]}/>
    <RangeControl label="图形大小" aria-label="图形大小" min={30} max={100} step={1} value={size} suffix="%" onChange={event => setSize(Number(event.currentTarget.value))}/>
    <Button variant="primary" className="cg-overview-demo-button" aria-pressed={applied} onClick={() => setApplied(current => !current)}><Typography as="span" variant="bodySmall" tone="inherit">{applied ? '重置' : '开始'}</Typography></Button>
    <div className={'cg-overview-template' + (applied ? ' is-applied' : '')} role="img" aria-label={`${theme === 'blue' ? '蓝色' : '橙色'}页面预览，图形大小${size}%，${applied ? '已开始演示' : '待开始'}`}><div className="cg-overview-template-image"><svg viewBox="0 0 100 80" aria-hidden="true" style={{ transform: `scale(${size / 100})` }}><path d="m0 80 35-45 19 23 17-36 29 58" fill="currentColor"/></svg></div><div className="cg-overview-template-lines"><i/><i/><i/><i/></div><div className="cg-overview-template-dots"><i/><i/><i/></div>{applied && <div className="cg-overview-template-scan" aria-hidden="true"/>}</div>
    <Typography variant="bodySmall" tone="inherit" align="center">1600 × 900</Typography>
  </div>;
}
export function SkillOverviewPage() {
  return <article className="cg-overview-page cg-creator-typography" aria-labelledby="cg-overview-title">
    <header><Typography as="h1" variant="display" tone="inherit" id="cg-overview-title">Creator Skill：让创作者更专注于内容编排</Typography><Typography variant="bodySmall" tone="inherit">软约束指导内容与表达，硬约束提供组件与模板，让智能体更稳定地实现教学想法。</Typography></header>
    <section className="cg-overview-panel cg-overview-left" aria-labelledby="cg-overview-soft">
      <div className="cg-overview-panel-heading"><Typography as="span" variant="h2" tone="inherit" className="cg-overview-number">1</Typography><div><Typography as="h2" variant="h2" tone="inherit" id="cg-overview-soft">软约束</Typography><Typography variant="bodySmall" tone="inherit">描述性的规则与偏好，指导智能体如何设计</Typography></div></div>
      <div className="cg-overview-left-content">
        <div className="cg-overview-editor"><div className="cg-overview-editor-bar"><i/><i/><i/><Typography variant="bodySmall" tone="inherit">设计指引</Typography></div><div className="cg-overview-code">{guidance.map(([title, ...lines]) => <div key={title}><Typography variant="bodySmall" tone="inherit" className="cg-overview-code-title">{title}</Typography>{lines.map(line => <Typography variant="bodySmall" tone="inherit" key={line}>{line}</Typography>)}</div>)}<Typography variant="bodySmall" tone="inherit" className="cg-overview-ellipsis" aria-label="还有更多设计指引">···</Typography></div></div>
        <FeatureList items={rules} className="cg-overview-rules"/>
      </div>
    </section>
    <svg className="cg-overview-arrows" viewBox="0 0 1600 900" aria-hidden="true"><defs><linearGradient id="cg-overview-blue"><stop stopColor="#d8e8ff"/><stop offset="1" stopColor="#367dff"/></linearGradient><linearGradient id="cg-overview-orange"><stop stopColor="#ffb264"/><stop offset="1" stopColor="#ffead0"/></linearGradient></defs><path d="M662 228Q713 226 741 269M724 260l18 11 1-22" fill="none" stroke="url(#cg-overview-blue)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/><path d="M941 228Q890 226 862 269M861 250l1 21 18-11" fill="none" stroke="url(#cg-overview-orange)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/><path d="M800 710v27m-14-13 14 14 14-14" fill="none" stroke="#84a7ff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/></svg>
    <div className="cg-overview-agent"><div className="cg-overview-robot" aria-hidden="true"><div><i/><i/></div></div><Typography variant="h3" tone="inherit">智能体</Typography><Typography variant="bodySmall" tone="inherit">+</Typography><Typography variant="body" tone="inherit" className="cg-overview-skill-label">Creator Skill</Typography><div className="cg-overview-agent-checks">{['理解创作需求', '参考设计指引', '调用组件模板', '生成教学页面'].map(t => <div key={t}><span aria-hidden="true">✓</span><Typography variant="bodySmall" tone="inherit">{t}</Typography></div>)}</div></div>
    <section className="cg-overview-panel cg-overview-right" aria-labelledby="cg-overview-hard">
      <div className="cg-overview-panel-heading"><Typography as="span" variant="h2" tone="inherit" className="cg-overview-number">2</Typography><div><Typography as="h2" variant="h2" tone="inherit" id="cg-overview-hard">硬约束</Typography><Typography variant="bodySmall" tone="inherit">由代码实现的组件与模板，落实页面基础</Typography></div></div>
      <div className="cg-overview-right-content"><ComponentSpecimen/><FeatureList items={scaffold} className="cg-overview-scaffold"/></div>
    </section>
    <div className="cg-overview-benefits">{benefits.map(([icon, title, description]) => <div key={title}><span><OverviewIcon kind={icon}/></span><div><Typography variant="body" tone="inherit">{title}</Typography><Typography variant="bodySmall" tone="inherit">{description}</Typography></div></div>)}</div>
  </article>;
}
