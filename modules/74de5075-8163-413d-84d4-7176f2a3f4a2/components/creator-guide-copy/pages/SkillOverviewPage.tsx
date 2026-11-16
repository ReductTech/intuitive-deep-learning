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
  return <svg shuku-edit-id="e-71e0cbc4-8ebc-4652-a0a9-139d25917b06" viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path shuku-edit-id="e-57e3d0ba-8a4b-420b-9224-6923c3dee5e1" d={paths[kind]} /></svg>;
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
  return <div shuku-edit-id="e-9639bd1c-d4a6-458f-a14a-8647b476cac2" className={className}>{items.map(([icon, title, description]) =>
    <div shuku-edit-id="e-ac63eccd-308b-4d59-9ff6-633662b6db74" className="aipe-replay-cg-overview-feature" key={title}>
      <OverviewIcon kind={icon}/>
      <div shuku-edit-id="e-b09518ef-b455-4297-b788-cb42569665d4"><Typography shuku-edit-id="e-cbc869b1-e5c9-432a-8686-d1539c572043" as="h3" variant="bodySmall" tone="inherit">{title}</Typography><Typography shuku-edit-id="e-a42120a9-01b2-409c-9a51-fc6a82a1fc46" variant="bodySmall" tone="inherit">{description}</Typography></div>
    </div>,
  )}</div>;
}
function ComponentSpecimen() {
  const [theme, setTheme] = useState('blue');
  const [size, setSize] = useState(70);
  const [applied, setApplied] = useState(false);
  return <div shuku-edit-id="e-12ad49df-b1d1-4fd3-846a-d0c2aaa3fb2e" className="aipe-replay-cg-overview-specimen" role="group" aria-label="体验组件与模板" data-theme={theme} onKeyDown={event => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Escape', ' '].includes(event.key)) event.stopPropagation();
  }}>
    <Typography shuku-edit-id="e-c8ee6bb6-67d9-4305-b1b7-54b2d37361a3" variant="bodySmall" tone="inherit">组件与模板</Typography>
    <Select label="选择主题" controlClassName="aipe-replay-cg-overview-theme-select" value={theme} onChange={setTheme} options={[
      { value: 'blue', label: <Typography shuku-edit-id="e-93461160-2556-4d3e-ab77-6a33b39d7743" as="span" variant="bodySmall" tone="inherit">蓝色主题</Typography> },
      { value: 'orange', label: <Typography shuku-edit-id="e-ec00b7f5-3a8f-4848-8ad1-6f46be7958e3" as="span" variant="bodySmall" tone="inherit">橙色主题</Typography> },
    ]}/>
    <RangeControl label="图形大小" aria-label="图形大小" min={30} max={100} step={1} value={size} suffix="%" onChange={event => setSize(Number(event.currentTarget.value))}/>
    <Button variant="primary" className="aipe-replay-cg-overview-demo-button" aria-pressed={applied} onClick={() => setApplied(current => !current)}><Typography shuku-edit-id="e-3bbfabbd-3577-4638-b2e4-4334a44dc66a" as="span" variant="bodySmall" tone="inherit">{applied ? '重置' : '开始'}</Typography></Button>
    <div shuku-edit-id="e-57658966-c2f1-43e7-bbd8-a1ddd0a7cb54" className={'aipe-replay-cg-overview-template' + (applied ? ' is-applied' : '')} role="img" aria-label={`${theme === 'blue' ? '蓝色' : '橙色'}页面预览，图形大小${size}%，${applied ? '已开始演示' : '待开始'}`}><div shuku-edit-id="e-720a7616-ef64-4249-aac4-c3262eec517b" className="aipe-replay-cg-overview-template-image"><svg shuku-edit-id="e-816e4224-342f-41f0-a07a-0d4717036029" viewBox="0 0 100 80" aria-hidden="true" style={{ transform: `scale(${size / 100})` }}><path shuku-edit-id="e-bd35adc6-9b2a-498e-8cca-9b50be6a9e5e" d="m0 80 35-45 19 23 17-36 29 58" fill="currentColor"/></svg></div><div shuku-edit-id="e-2d96ba24-2399-400e-b0b5-6d673dd1ed39" className="aipe-replay-cg-overview-template-lines"><i shuku-edit-id="e-65e31158-8916-41b7-8835-7ace7ed60ed4"/><i shuku-edit-id="e-f4ec4ac6-c813-4200-bd63-07c7ff1c5dbc"/><i shuku-edit-id="e-a574f586-06b7-4371-ad0e-a088847804f5"/><i shuku-edit-id="e-520066dd-dbf5-460b-bdb9-3a6d174fa099"/></div><div shuku-edit-id="e-062fe0bd-2e18-4d80-8306-68b157526156" className="aipe-replay-cg-overview-template-dots"><i shuku-edit-id="e-2b04d300-4012-445a-98c1-0693d16aff75"/><i shuku-edit-id="e-086c7c39-80ac-4dff-9934-894523865890"/><i shuku-edit-id="e-0daa270f-ea77-4534-99da-9e9129348d33"/></div>{applied && <div shuku-edit-id="e-ce85905f-36a8-4c98-a7fa-88565b74d98b" className="aipe-replay-cg-overview-template-scan" aria-hidden="true"/>}</div>
    <Typography shuku-edit-id="e-ea39574c-e491-4184-b59c-cb86ddc32495" variant="bodySmall" tone="inherit" align="center">1600 × 900</Typography>
  </div>;
}
export function SkillOverviewPage() {
  return <article shuku-edit-id="e-6bc6f3a2-6515-4d2f-a286-758bc572cb13" className="aipe-replay-cg-overview-page aipe-replay-cg-creator-typography" aria-labelledby="aipe-replay-cg-overview-title">
    <header shuku-edit-id="e-aba58e36-6cbc-4c81-a63e-419a7b79d3cc"><Typography shuku-edit-id="e-8cfcf65c-685c-4b8d-9017-565d04046454" as="h1" variant="display" tone="inherit" align="center" id="aipe-replay-cg-overview-title">Creator Skill：让创作者更专注于内容编排</Typography></header>
    <section shuku-edit-id="e-d04add85-b0ff-4f1c-9b84-b48ffe73efa5" className="aipe-replay-cg-overview-panel aipe-replay-cg-overview-left" aria-labelledby="aipe-replay-cg-overview-soft">
      <div shuku-edit-id="e-d64d9884-641a-435d-a8c4-5d640b49d968" className="aipe-replay-cg-overview-panel-heading"><Typography shuku-edit-id="e-9e9cfdc5-f483-4069-b3eb-4764ffcadbf5" as="span" variant="h2" tone="inherit" className="aipe-replay-cg-overview-number">1</Typography><div shuku-edit-id="e-db9765e7-1df0-4f66-a65c-1e93bc0e8ef1"><Typography shuku-edit-id="e-7ad11670-f057-4121-b614-97c7ca56f777" as="h2" variant="h2" tone="inherit" id="aipe-replay-cg-overview-soft">创作指导</Typography><Typography shuku-edit-id="e-3adca059-406c-4906-8b7c-e197b1499afa" variant="bodySmall" tone="inherit">描述性的规则与偏好，指导智能体如何设计</Typography></div></div>
      <div shuku-edit-id="e-17128a9a-e81d-4794-aef1-2189600eaf40" className="aipe-replay-cg-overview-left-content">
        <div shuku-edit-id="e-fac85ff4-8e22-486e-9876-c4f73e5877ea" className="aipe-replay-cg-overview-editor"><div shuku-edit-id="e-377af819-b85c-4d2f-b9ac-2dea2a0b96b1" className="aipe-replay-cg-overview-editor-bar"><i shuku-edit-id="e-4fbe5998-6cca-4599-aee5-b9705edcff5b"/><i shuku-edit-id="e-c447e3a6-18fc-4c10-afd3-f29262c7fabd"/><i shuku-edit-id="e-22a5a622-accd-4460-9a74-53fdb9d52632"/><Typography shuku-edit-id="e-60043d15-2e87-4c50-9c5e-79f06e28a652" variant="bodySmall" tone="inherit">设计指引</Typography></div><div shuku-edit-id="e-8ad49206-eba3-4cc4-a383-4cb11633b7a8" className="aipe-replay-cg-overview-code">{guidance.map(([title, ...lines]) => <div shuku-edit-id="e-6e1d80aa-8674-4caa-ba2e-30fe50764459" key={title}><Typography shuku-edit-id="e-3c7ea430-c59a-43dd-8bea-b872e41f3e2e" variant="bodySmall" tone="inherit" className="aipe-replay-cg-overview-code-title">{title}</Typography>{lines.map(line => <Typography shuku-edit-id="e-ae921dca-0675-46ba-9270-3a9b53743a99" variant="bodySmall" tone="inherit" key={line}>{line}</Typography>)}</div>)}<Typography shuku-edit-id="e-38e9cc76-c6b7-4509-a6f3-8ea039c441ca" variant="bodySmall" tone="inherit" className="aipe-replay-cg-overview-ellipsis" aria-label="还有更多设计指引">···</Typography></div></div>
        <FeatureList items={rules} className="aipe-replay-cg-overview-rules"/>
      </div>
    </section>
    <svg shuku-edit-id="e-d03b2d89-b6ae-4629-af99-237753d6d92c" className="aipe-replay-cg-overview-arrows" viewBox="0 0 1600 900" aria-hidden="true"><defs shuku-edit-id="e-e72287fa-651c-4b0f-afed-fbd7e931d9a1"><linearGradient shuku-edit-id="e-91eb29c0-f44d-40cc-947a-7b684da4065f" id="aipe-replay-cg-overview-blue"><stop shuku-edit-id="e-374219ea-5ea0-4e01-8001-19980a8dd248" stopColor="#d8e8ff"/><stop shuku-edit-id="e-01f34cb6-edc8-43bb-a899-5102de18f813" offset="1" stopColor="#367dff"/></linearGradient><linearGradient shuku-edit-id="e-a8066b5a-711f-4260-bc7f-0fbb2b73b1e7" id="aipe-replay-cg-overview-orange"><stop shuku-edit-id="e-8adc979c-6a89-4f22-bb2a-c683eeaad4cb" stopColor="#ffb264"/><stop shuku-edit-id="e-cb4a1114-bf6e-498f-9d24-1f04107ab685" offset="1" stopColor="#ffead0"/></linearGradient></defs><path shuku-edit-id="e-3f66406d-1231-40ee-8f63-847ed5d82928" d="M662 228Q713 226 741 269M724 260l18 11 1-22" fill="none" stroke="url(#aipe-replay-cg-overview-blue)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/><path shuku-edit-id="e-d271dc0b-5dee-41d9-aac7-3882ce63b0ee" d="M941 228Q890 226 862 269M861 250l1 21 18-11" fill="none" stroke="url(#aipe-replay-cg-overview-orange)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/><path shuku-edit-id="e-5b10bd4a-fb11-408d-9949-69fe2b1e7f54" d="M800 710v27m-14-13 14 14 14-14" fill="none" stroke="#84a7ff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/></svg>
    <div shuku-edit-id="e-30c8e3ea-86cc-4195-8287-f2a811d92ab6" className="aipe-replay-cg-overview-agent"><div shuku-edit-id="e-ea792e97-2bd2-41a6-9b65-b587c7c92440" className="aipe-replay-cg-overview-robot" aria-hidden="true"><div shuku-edit-id="e-1b2c0d29-6b2e-42eb-bc02-6ca3812bdb79"><i shuku-edit-id="e-80564ea6-9f04-46bd-8f3c-94b953a8e996"/><i shuku-edit-id="e-01700a7b-793c-4a69-a4e9-e532d40e1db5"/></div></div><Typography shuku-edit-id="e-da65d35d-c2e9-4805-bc83-415cd2eccc58" variant="h3" tone="inherit">智能体</Typography><Typography shuku-edit-id="e-f488e2f8-5c66-44b3-b214-bf11103705ba" variant="bodySmall" tone="inherit">+</Typography><Typography shuku-edit-id="e-84416c2d-448a-457e-8a72-e98ae08e9de3" variant="body" tone="inherit" className="aipe-replay-cg-overview-skill-label">Creator Skill</Typography><div shuku-edit-id="e-ecd9ca45-11fa-4c44-8e2a-2f48e78453ea" className="aipe-replay-cg-overview-agent-checks">{['理解创作需求', '参考设计指引', '调用组件模板', '生成教学页面'].map(t => <div shuku-edit-id="e-5eccf9f4-7941-47ae-b045-dab0cc5d9373" key={t}><span shuku-edit-id="e-36e31495-b601-4f97-8f9a-f25a4ac76366" aria-hidden="true">✓</span><Typography shuku-edit-id="e-48e253cc-2a52-4f1d-9f52-47ced6b407f5" variant="bodySmall" tone="inherit">{t}</Typography></div>)}</div></div>
    <section shuku-edit-id="e-b2d971df-f307-4c95-9497-861f504cdc3a" className="aipe-replay-cg-overview-panel aipe-replay-cg-overview-right" aria-labelledby="aipe-replay-cg-overview-hard">
      <div shuku-edit-id="e-09d9a316-a0a5-482e-92de-4f6fe5fa4efb" className="aipe-replay-cg-overview-panel-heading"><Typography shuku-edit-id="e-f55aa811-6e8c-477a-a807-04cd0e177ee4" as="span" variant="h2" tone="inherit" className="aipe-replay-cg-overview-number">2</Typography><div shuku-edit-id="e-dac3131b-3601-4ec8-971c-64e8d1ceb18d"><Typography shuku-edit-id="e-2801d81b-2565-4675-9d70-c12147eb64d2" as="h2" variant="h2" tone="inherit" id="aipe-replay-cg-overview-hard">实现支持</Typography><Typography shuku-edit-id="e-bd2bc74b-a965-40e9-9247-25a90a7b3291" variant="bodySmall" tone="inherit">由代码实现的组件与模板，落实页面基础</Typography></div></div>
      <div shuku-edit-id="e-3ba94e1a-a2aa-438e-a1aa-fab97f198d0e" className="aipe-replay-cg-overview-right-content"><ComponentSpecimen/><FeatureList items={scaffold} className="aipe-replay-cg-overview-scaffold"/></div>
    </section>
    <div shuku-edit-id="e-5e728baa-08bf-454a-b0be-7145145483cc" className="aipe-replay-cg-overview-benefits">{benefits.map(([icon, title, description]) => <div shuku-edit-id="e-8418acc5-fafa-4fd0-a6ac-10f1b6c70a59" key={title}><span shuku-edit-id="e-81a0a2cb-b457-421a-aa45-968937921f92"><OverviewIcon kind={icon}/></span><div shuku-edit-id="e-51123407-92d7-4abf-ba6e-876048765913"><Typography shuku-edit-id="e-80375c64-8a6b-42a8-9e6d-b6f88f06f2ae" variant="body" tone="inherit">{title}</Typography><Typography shuku-edit-id="e-36ec21f4-65e4-4c9f-a4f6-51dcbb8476d6" variant="bodySmall" tone="inherit">{description}</Typography></div></div>)}</div>
  </article>;
}
