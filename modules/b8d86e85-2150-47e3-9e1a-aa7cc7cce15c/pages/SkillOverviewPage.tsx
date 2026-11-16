import { useState } from 'react';
import { Button, RangeControl, Select, Typography } from "@shuku/course-style/react";
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
  return <svg shuku-edit-id="e-ef48cf4b-abf9-4942-8e5c-290b10fd95e0" viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path shuku-edit-id="e-e9cdc68a-423a-4985-ae6a-221ef530503f" d={paths[kind]} /></svg>;
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
  return <div shuku-edit-id="e-bd1df2b1-14d2-4b34-8b0f-b04bf883224c" className={className}>{items.map(([icon, title, description]) =>
    <div shuku-edit-id="e-86a9d237-03e6-4953-a107-16c65c7dc576" className="cg-overview-feature" key={title}>
      <OverviewIcon kind={icon}/>
      <div shuku-edit-id="e-0f94fb0e-50e7-4b4b-a854-a53d2e07366e"><Typography shuku-edit-id="e-177cf36a-021b-4a72-96a3-d9c6f6ed3ab0" as="h3" variant="bodySmall" tone="inherit">{title}</Typography><Typography shuku-edit-id="e-1e71ff6e-c9f3-40b8-9c40-40bd679e21dd" variant="bodySmall" tone="inherit">{description}</Typography></div>
    </div>,
  )}</div>;
}
function ComponentSpecimen() {
  const [theme, setTheme] = useState('blue');
  const [size, setSize] = useState(70);
  const [applied, setApplied] = useState(false);
  return <div shuku-edit-id="e-9d46edee-bf48-4fc3-bb64-e6ebf55ee62f" className="cg-overview-specimen" role="group" aria-label="体验组件与模板" data-theme={theme} onKeyDown={event => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Escape', ' '].includes(event.key)) event.stopPropagation();
  }}>
    <Typography shuku-edit-id="e-fba99ccb-58ab-485f-85e6-ddbc1ca4bbe8" variant="bodySmall" tone="inherit">组件与模板</Typography>
    <Select label="选择主题" controlClassName="cg-overview-theme-select" value={theme} onChange={setTheme} options={[
      { value: 'blue', label: <Typography shuku-edit-id="e-0056194f-0082-48c3-8f57-587679901ae7" as="span" variant="bodySmall" tone="inherit">蓝色主题</Typography> },
      { value: 'orange', label: <Typography shuku-edit-id="e-a7514210-7e3b-41a8-abf0-8caeaa39d6b9" as="span" variant="bodySmall" tone="inherit">橙色主题</Typography> },
    ]}/>
    <RangeControl label="图形大小" aria-label="图形大小" min={30} max={100} step={1} value={size} suffix="%" onChange={event => setSize(Number(event.currentTarget.value))}/>
    <Button variant="primary" className="cg-overview-demo-button" aria-pressed={applied} onClick={() => setApplied(current => !current)}><Typography shuku-edit-id="e-aada0439-3e88-46ed-ad51-a25482b6a447" as="span" variant="bodySmall" tone="inherit">{applied ? '重置' : '开始'}</Typography></Button>
    <div shuku-edit-id="e-5c70c509-1502-424f-b450-6735e0fc0011" className={'cg-overview-template' + (applied ? ' is-applied' : '')} role="img" aria-label={`${theme === 'blue' ? '蓝色' : '橙色'}页面预览，图形大小${size}%，${applied ? '已开始演示' : '待开始'}`}><div shuku-edit-id="e-83608054-fc98-4911-9233-614eff9bdd0d" className="cg-overview-template-image"><svg shuku-edit-id="e-0dc3fe2e-74bd-49c0-8423-79dafd1f7ade" viewBox="0 0 100 80" aria-hidden="true" style={{ transform: `scale(${size / 100})` }}><path shuku-edit-id="e-c39d52ca-439d-4167-87a3-61b5c056c76d" d="m0 80 35-45 19 23 17-36 29 58" fill="currentColor"/></svg></div><div shuku-edit-id="e-e6aff745-3454-4035-a397-6e5dbb56a856" className="cg-overview-template-lines"><i shuku-edit-id="e-99d8216e-37d8-4f12-86e2-26884e3a88bb"/><i shuku-edit-id="e-0da656bd-69f1-4bed-bb97-2af7aac80206"/><i shuku-edit-id="e-2d475022-4ff8-4e40-a597-8b24d7ededf9"/><i shuku-edit-id="e-71734e1c-1c23-4ea6-8e9c-72fc4a10862a"/></div><div shuku-edit-id="e-e4e2a35c-41cc-4d7e-88dc-bbc68663079e" className="cg-overview-template-dots"><i shuku-edit-id="e-e9a6a15e-ab8b-4a1b-b2a5-c63655fba54b"/><i shuku-edit-id="e-d6bf8a29-e711-4eb3-945e-68c6fd340566"/><i shuku-edit-id="e-5dc4407e-7bd6-4153-a8c6-493f376cc328"/></div>{applied && <div shuku-edit-id="e-026a9f9e-1700-4fe9-9b8a-315ff4343b23" className="cg-overview-template-scan" aria-hidden="true"/>}</div>
    <Typography shuku-edit-id="e-2fdc60a8-a7e3-4eaa-9339-69c16fd88e6c" variant="bodySmall" tone="inherit" align="center">1600 × 900</Typography>
  </div>;
}
export function SkillOverviewPage() {
  return <article shuku-edit-id="e-687cbbf9-321d-4c52-8e4f-77dabb473410" className="cg-overview-page cg-creator-typography" aria-labelledby="cg-overview-title">
    <header shuku-edit-id="e-dafa38af-0c43-4004-95df-42421158dc2e"><Typography shuku-edit-id="e-2adc111f-7caa-45d8-a0ea-2b28e60bed94" as="h1" variant="display" tone="inherit" id="cg-overview-title">Creator Skill：让创作者更专注于内容编排</Typography><Typography shuku-edit-id="e-a4197a1b-8ce0-44fe-88d0-2c125f74a13d" variant="bodySmall" tone="inherit">创作指导提供设计方法与表达建议，实现支持提供组件、模板与工具，帮助智能体落实教学想法。</Typography></header>
    <section shuku-edit-id="e-0b9e9113-ed46-459b-9c4f-fe6e7207603e" className="cg-overview-panel cg-overview-left" aria-labelledby="cg-overview-soft">
      <div shuku-edit-id="e-5430ff61-8e38-4c8e-be5b-4efd3a133a4f" className="cg-overview-panel-heading"><Typography shuku-edit-id="e-42d6a5fa-c00f-41b9-b7a4-ae78a62422ea" as="span" variant="h2" tone="inherit" className="cg-overview-number">1</Typography><div shuku-edit-id="e-b92d24ed-099b-4e4c-abd7-8183951dd02c"><Typography shuku-edit-id="e-595a20c8-ebc7-4e76-956e-0f03b391d532" as="h2" variant="h2" tone="inherit" id="cg-overview-soft">创作指导</Typography><Typography shuku-edit-id="e-6e5e6317-4a4a-43cc-82da-db1fefe09690" variant="bodySmall" tone="inherit">描述性的规则与偏好，指导智能体如何设计</Typography></div></div>
      <div shuku-edit-id="e-4f84bf27-88df-4ff9-9391-dddb021afa6e" className="cg-overview-left-content">
        <div shuku-edit-id="e-0995d1c1-5624-42f0-a01d-6bd8f0b0f23c" className="cg-overview-editor"><div shuku-edit-id="e-911067d8-529e-4fb2-9518-5b992f357f28" className="cg-overview-editor-bar"><i shuku-edit-id="e-5ed128fe-a6d4-4891-940c-59c38df9cb86"/><i shuku-edit-id="e-ec1fb221-1d60-4639-ba86-91d77e3bae9a"/><i shuku-edit-id="e-e43c8aa3-f267-4651-a165-f291ac80ced9"/><Typography shuku-edit-id="e-28d25820-92c2-4780-adeb-f3c2dd121404" variant="bodySmall" tone="inherit">设计指引</Typography></div><div shuku-edit-id="e-407c7f35-c751-42bc-b6b2-7561c80e410f" className="cg-overview-code">{guidance.map(([title, ...lines]) => <div shuku-edit-id="e-0e595c99-c498-4e05-9b98-757e606219df" key={title}><Typography shuku-edit-id="e-89de4e14-e797-4236-8658-ad7a4b9d72ec" variant="bodySmall" tone="inherit" className="cg-overview-code-title">{title}</Typography>{lines.map(line => <Typography shuku-edit-id="e-f0dc71e7-197c-45fa-8da1-829a639ebfb4" variant="bodySmall" tone="inherit" key={line}>{line}</Typography>)}</div>)}<Typography shuku-edit-id="e-463fb0b6-bf5d-4ff8-9212-de8048dc8b25" variant="bodySmall" tone="inherit" className="cg-overview-ellipsis" aria-label="还有更多设计指引">···</Typography></div></div>
        <FeatureList items={rules} className="cg-overview-rules"/>
      </div>
    </section>
    <svg shuku-edit-id="e-155e6e22-e769-4208-8157-ff3ab8358dc5" className="cg-overview-arrows" viewBox="0 0 1600 900" aria-hidden="true"><defs shuku-edit-id="e-cce96d2a-6ed9-4db4-996e-1f348f386e3e"><linearGradient shuku-edit-id="e-bcce6054-673f-4a0d-8a78-c431eaccd29e" id="cg-overview-blue"><stop shuku-edit-id="e-05c6a18b-5fb4-47ff-b5b3-d4956c7b5ea7" stopColor="#d8e8ff"/><stop shuku-edit-id="e-b04e130f-4c3b-48a6-84da-d9808dd55ad6" offset="1" stopColor="#367dff"/></linearGradient><linearGradient shuku-edit-id="e-49aaf0d9-a2a0-40ac-b2ea-9f8f04c9840d" id="cg-overview-orange"><stop shuku-edit-id="e-4f08d1ac-c43c-4ed7-be6e-68205907e7f3" stopColor="#ffb264"/><stop shuku-edit-id="e-19523cce-0eda-4b31-b23a-46c0b188ec75" offset="1" stopColor="#ffead0"/></linearGradient></defs><path shuku-edit-id="e-806a76f3-ee00-4c15-9284-96ea48dabb45" d="M662 228Q713 226 741 269M724 260l18 11 1-22" fill="none" stroke="url(#cg-overview-blue)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/><path shuku-edit-id="e-40d90112-17c5-46e2-8dd0-549fa79c49a6" d="M941 228Q890 226 862 269M861 250l1 21 18-11" fill="none" stroke="url(#cg-overview-orange)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/><path shuku-edit-id="e-5b9fa6a5-824a-4ace-822c-1e3da4f79c7d" d="M800 710v27m-14-13 14 14 14-14" fill="none" stroke="#84a7ff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/></svg>
    <div shuku-edit-id="e-ad9e49a2-68f7-4288-875d-8c4e40b7d7d2" className="cg-overview-agent"><div shuku-edit-id="e-8d39af23-a090-4575-869a-6d3a09679a57" className="cg-overview-robot" aria-hidden="true"><div shuku-edit-id="e-a091add5-f362-422e-ab30-ee538e51e65a"><i shuku-edit-id="e-8c361a60-2686-4b6d-ad83-ff16bac3596d"/><i shuku-edit-id="e-1587da6c-bce7-408c-8f9f-cf1cd42ce37d"/></div></div><Typography shuku-edit-id="e-86bf4ef8-4a54-49c8-a233-d030a55e5fab" variant="h3" tone="inherit">智能体</Typography><Typography shuku-edit-id="e-44c4324e-e11a-4469-8346-0f7d5fafa4d6" variant="bodySmall" tone="inherit">+</Typography><Typography shuku-edit-id="e-c1a94ad3-1c0e-47e5-9787-e79a5598e1d4" variant="body" tone="inherit" className="cg-overview-skill-label">Creator Skill</Typography><div shuku-edit-id="e-caf1bb29-0cd8-4d44-95dc-f27889504a73" className="cg-overview-agent-checks">{['理解创作需求', '参考设计指引', '调用组件模板', '生成教学页面'].map(t => <div shuku-edit-id="e-c1a96243-f038-40b7-80aa-31db3f41a7bb" key={t}><span shuku-edit-id="e-264922bc-96e2-4ecf-be74-b182b3f5ac6a" aria-hidden="true">✓</span><Typography shuku-edit-id="e-2ab056a0-23a0-49b3-9f03-30678499c8ef" variant="bodySmall" tone="inherit">{t}</Typography></div>)}</div></div>
    <section shuku-edit-id="e-0f85dd22-be9e-46c1-9e51-79ca4dd3468b" className="cg-overview-panel cg-overview-right" aria-labelledby="cg-overview-hard">
      <div shuku-edit-id="e-ba16d040-f76a-4f52-8de6-284fd72e49e2" className="cg-overview-panel-heading"><Typography shuku-edit-id="e-9d706b04-9905-43f4-8a96-332f80660f05" as="span" variant="h2" tone="inherit" className="cg-overview-number">2</Typography><div shuku-edit-id="e-ae320db1-ed6b-4312-a5f7-e0a555c56091"><Typography shuku-edit-id="e-39bc3a6f-df5d-47ca-b807-8fc6bd75a886" as="h2" variant="h2" tone="inherit" id="cg-overview-hard">实现支持</Typography><Typography shuku-edit-id="e-5a3c8b4f-e4c0-4812-bdb7-45bac1a623f1" variant="bodySmall" tone="inherit">由代码实现的组件与模板，落实页面基础</Typography></div></div>
      <div shuku-edit-id="e-2784e78b-e301-41ac-979d-6a4fdf5eff53" className="cg-overview-right-content"><ComponentSpecimen/><FeatureList items={scaffold} className="cg-overview-scaffold"/></div>
    </section>
    <div shuku-edit-id="e-f1c3cf2f-8714-4c0a-b91e-626bdaa2925e" className="cg-overview-benefits">{benefits.map(([icon, title, description]) => <div shuku-edit-id="e-4fc88b26-8c33-43f3-85c6-075f96bcdfe7" key={title}><span shuku-edit-id="e-b506a109-cd7f-4dad-a73d-c128655a43a1"><OverviewIcon kind={icon}/></span><div shuku-edit-id="e-1f5eb239-8fe2-4909-a1a1-0e9b47ae8ceb"><Typography shuku-edit-id="e-67170bd2-602e-4e24-827c-b34fed1132c7" variant="body" tone="inherit">{title}</Typography><Typography shuku-edit-id="e-13ab4a96-e3e2-411e-af16-73891ed02b82" variant="bodySmall" tone="inherit">{description}</Typography></div></div>)}</div>
  </article>;
}
