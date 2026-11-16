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
  return <svg shuku-edit-id="e-ba785ac7-0f8b-473f-9360-223267b0e277" viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path shuku-edit-id="e-d3e6674d-1fcc-4a11-a5a2-405226383f9f" d={paths[kind]} /></svg>;
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
  return <div shuku-edit-id="e-d3ed948e-b4d4-4d2e-8677-a221d6d64900" className={className}>{items.map(([icon, title, description]) =>
    <div shuku-edit-id="e-4d200531-8a7c-4590-a1d8-feeedbe2879a" className="cg-overview-feature" key={title}>
      <OverviewIcon kind={icon}/>
      <div shuku-edit-id="e-f0a91d4d-f8f2-4733-a985-a154e70c00c0"><Typography shuku-edit-id="e-291ac78e-5199-4ddd-91ac-82e63df6e186" as="h3" variant="bodySmall" tone="inherit">{title}</Typography><Typography shuku-edit-id="e-33670868-3de2-40c7-bc44-e113afd1ac23" variant="bodySmall" tone="inherit">{description}</Typography></div>
    </div>,
  )}</div>;
}
function ComponentSpecimen() {
  const [theme, setTheme] = useState('blue');
  const [size, setSize] = useState(70);
  const [applied, setApplied] = useState(false);
  return <div shuku-edit-id="e-30ebea34-f58f-4d42-b36b-777e209441ea" className="cg-overview-specimen" role="group" aria-label="体验组件与模板" data-theme={theme} onKeyDown={event => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Escape', ' '].includes(event.key)) event.stopPropagation();
  }}>
    <Typography shuku-edit-id="e-24cbb72d-70f4-41e2-938d-9a6c73ffb75d" variant="bodySmall" tone="inherit">组件与模板</Typography>
    <Select label="选择主题" controlClassName="cg-overview-theme-select" value={theme} onChange={setTheme} options={[
      { value: 'blue', label: <Typography shuku-edit-id="e-3b0d2053-2029-4b07-8c44-eb181e89c7dc" as="span" variant="bodySmall" tone="inherit">蓝色主题</Typography> },
      { value: 'orange', label: <Typography shuku-edit-id="e-1197b19e-c734-4716-84d1-ab8589925bb8" as="span" variant="bodySmall" tone="inherit">橙色主题</Typography> },
    ]}/>
    <RangeControl label="图形大小" aria-label="图形大小" min={30} max={100} step={1} value={size} suffix="%" onChange={event => setSize(Number(event.currentTarget.value))}/>
    <Button variant="primary" className="cg-overview-demo-button" aria-pressed={applied} onClick={() => setApplied(current => !current)}><Typography shuku-edit-id="e-c2661d1b-c180-422c-9a04-3e7515e6b6a6" as="span" variant="bodySmall" tone="inherit">{applied ? '重置' : '开始'}</Typography></Button>
    <div shuku-edit-id="e-2b234a31-9326-423c-a4b6-81df91cb33c0" className={'cg-overview-template' + (applied ? ' is-applied' : '')} role="img" aria-label={`${theme === 'blue' ? '蓝色' : '橙色'}页面预览，图形大小${size}%，${applied ? '已开始演示' : '待开始'}`}><div shuku-edit-id="e-36204b52-3f81-42a8-a910-1c8c1349f181" className="cg-overview-template-image"><svg shuku-edit-id="e-1631814f-ff3a-4ba1-83c0-2b38de0159c9" viewBox="0 0 100 80" aria-hidden="true" style={{ transform: `scale(${size / 100})` }}><path shuku-edit-id="e-6e431da3-81ff-4bb9-8f7b-3e40034c0838" d="m0 80 35-45 19 23 17-36 29 58" fill="currentColor"/></svg></div><div shuku-edit-id="e-d0fa104b-6071-4037-ab62-9edc3d6f5540" className="cg-overview-template-lines"><i shuku-edit-id="e-054598a8-83ff-4795-9fb9-382542e272b6"/><i shuku-edit-id="e-c45c0247-6dab-4334-be57-6c765773f0f5"/><i shuku-edit-id="e-4d92cf99-325f-4f0b-8982-93963c56c548"/><i shuku-edit-id="e-80ecfed2-3b75-4371-8b97-305d52fa5a28"/></div><div shuku-edit-id="e-8513bce0-99d8-4bad-b25a-6a0b1cbfc955" className="cg-overview-template-dots"><i shuku-edit-id="e-dbe62639-cc21-4a2e-96c3-824004586faa"/><i shuku-edit-id="e-a968aa66-6160-431d-a065-4d1513a88e99"/><i shuku-edit-id="e-2a261406-f42d-4026-86f3-0fd7278b5466"/></div>{applied && <div shuku-edit-id="e-5a29f2a7-f2b8-48e2-a8f7-08a135725fbb" className="cg-overview-template-scan" aria-hidden="true"/>}</div>
    <Typography shuku-edit-id="e-83163b6f-a918-498a-9902-9689ed57d30f" variant="bodySmall" tone="inherit" align="center">1600 × 900</Typography>
  </div>;
}
export function SkillOverviewPage() {
  return <article shuku-edit-id="e-337b91f3-0c07-4042-b8f7-a80751f57516" className="cg-overview-page cg-creator-typography" aria-labelledby="cg-overview-title">
    <header shuku-edit-id="e-49cc82e4-c0f7-4a47-8200-047c5a4cd8a5"><Typography shuku-edit-id="e-affbc57e-f89f-4778-88c4-dc2b91c8f972" as="h1" variant="display" tone="inherit" align="center" id="cg-overview-title">Creator Skill：让创作者更专注于内容编排</Typography></header>
    <section shuku-edit-id="e-ce0bbcd7-49eb-449d-8997-472ad438ed62" className="cg-overview-panel cg-overview-left" aria-labelledby="cg-overview-soft">
      <div shuku-edit-id="e-aae3ebee-33cd-4e4f-b623-300e0815f8e9" className="cg-overview-panel-heading"><Typography shuku-edit-id="e-8101beb2-e780-42be-9deb-c402bbfad298" as="span" variant="h2" tone="inherit" className="cg-overview-number">1</Typography><div shuku-edit-id="e-817a45c0-da37-4a06-a827-56c3f5aa61f0"><Typography shuku-edit-id="e-d54054af-e6db-48cd-a3cd-e70dc6540ec8" as="h2" variant="h2" tone="inherit" id="cg-overview-soft">创作指导</Typography><Typography shuku-edit-id="e-3fe3517e-e387-4e86-a9aa-7623fc487633" variant="bodySmall" tone="inherit">描述性的规则与偏好，指导智能体如何设计</Typography></div></div>
      <div shuku-edit-id="e-4092c207-ac1a-4abb-a89f-02065b29ff1c" className="cg-overview-left-content">
        <div shuku-edit-id="e-a3d27cc4-d95d-411e-8739-6affbc2f9e2c" className="cg-overview-editor"><div shuku-edit-id="e-9bdcdeb2-e990-4ddd-aa21-24c2d6383b5d" className="cg-overview-editor-bar"><i shuku-edit-id="e-d2ad00d3-d861-4f9f-85ce-54cf4fa24ddd"/><i shuku-edit-id="e-37414f39-8425-4bec-ace4-bb55c1146d3f"/><i shuku-edit-id="e-f7a6da74-f654-4ab4-a0ee-60d39078f415"/><Typography shuku-edit-id="e-023a4154-ddc8-41a4-97d8-6980c185cacf" variant="bodySmall" tone="inherit">设计指引</Typography></div><div shuku-edit-id="e-d3f90801-fa88-4295-83ba-63d111503bd3" className="cg-overview-code">{guidance.map(([title, ...lines]) => <div shuku-edit-id="e-e4ad1d0d-90df-49c6-a89f-fa718599d2c3" key={title}><Typography shuku-edit-id="e-2b6d3feb-c21f-4d36-a5a3-f084c22cd4b0" variant="bodySmall" tone="inherit" className="cg-overview-code-title">{title}</Typography>{lines.map(line => <Typography shuku-edit-id="e-937fab1d-a6d6-4c73-bd32-6f64a6c90a35" variant="bodySmall" tone="inherit" key={line}>{line}</Typography>)}</div>)}<Typography shuku-edit-id="e-a3914d27-ee5d-4d1c-b7fd-c424c83d5816" variant="bodySmall" tone="inherit" className="cg-overview-ellipsis" aria-label="还有更多设计指引">···</Typography></div></div>
        <FeatureList items={rules} className="cg-overview-rules"/>
      </div>
    </section>
    <svg shuku-edit-id="e-c3f2a5d3-0e37-4768-965f-a4e53c47e52e" className="cg-overview-arrows" viewBox="0 0 1600 900" aria-hidden="true"><defs shuku-edit-id="e-e109aad4-4b11-4fff-bbdd-bb394e47b1c3"><linearGradient shuku-edit-id="e-0e673f3b-03c0-44ef-81f4-701ca413805e" id="cg-overview-blue"><stop shuku-edit-id="e-fd598964-ec67-442d-9aa7-b90e1498fb41" stopColor="#d8e8ff"/><stop shuku-edit-id="e-748671af-0f46-408b-91ff-86e80b32eeaf" offset="1" stopColor="#367dff"/></linearGradient><linearGradient shuku-edit-id="e-46ec15a0-2eae-4735-a229-e356882a6a3f" id="cg-overview-orange"><stop shuku-edit-id="e-ec33cb28-055a-43b5-beb3-b6f2408e505a" stopColor="#ffb264"/><stop shuku-edit-id="e-7f28fc12-d84f-45e9-9437-f667b72d274f" offset="1" stopColor="#ffead0"/></linearGradient></defs><path shuku-edit-id="e-59ab724c-c5e3-4592-8805-bdaccb9ad533" d="M662 228Q713 226 741 269M724 260l18 11 1-22" fill="none" stroke="url(#cg-overview-blue)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/><path shuku-edit-id="e-ef4e22b9-fcbe-45c4-bd24-049608f402ef" d="M941 228Q890 226 862 269M861 250l1 21 18-11" fill="none" stroke="url(#cg-overview-orange)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/><path shuku-edit-id="e-76720f69-a9eb-485f-98c8-2f68d1ca8a3b" d="M800 710v27m-14-13 14 14 14-14" fill="none" stroke="#84a7ff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/></svg>
    <div shuku-edit-id="e-d7e216ac-1127-4d59-a8a2-7204c254a3a9" className="cg-overview-agent"><div shuku-edit-id="e-ff9a6df8-e24e-45c2-8560-3fcd36adc751" className="cg-overview-robot" aria-hidden="true"><div shuku-edit-id="e-76c979e8-5599-477f-9f9a-1dfb51753794"><i shuku-edit-id="e-c81cef6d-2871-4999-a99d-0a09a156fde3"/><i shuku-edit-id="e-351593c3-5fc7-409d-b086-a4bc1e256a56"/></div></div><Typography shuku-edit-id="e-aa1941e0-5c19-4700-b761-9126c993715f" variant="h3" tone="inherit">智能体</Typography><Typography shuku-edit-id="e-1c5c76cd-1abe-42e0-8dec-887ce853b8c2" variant="bodySmall" tone="inherit">+</Typography><Typography shuku-edit-id="e-1d7166d3-5095-4b04-a394-8f6b5085d937" variant="body" tone="inherit" className="cg-overview-skill-label">Creator Skill</Typography><div shuku-edit-id="e-fc010e37-1b41-4964-9eb7-f304522fadfb" className="cg-overview-agent-checks">{['理解创作需求', '参考设计指引', '调用组件模板', '生成教学页面'].map(t => <div shuku-edit-id="e-d4d3f35d-701f-44d8-9725-0a6ac15fc433" key={t}><span shuku-edit-id="e-f88e8b2f-4c9a-4dc2-9d7b-1b69ef93d433" aria-hidden="true">✓</span><Typography shuku-edit-id="e-c01094cc-115d-467c-8dc4-e5050050e2e6" variant="bodySmall" tone="inherit">{t}</Typography></div>)}</div></div>
    <section shuku-edit-id="e-428ecbe6-aab4-43a6-84bf-ae00cf214d6c" className="cg-overview-panel cg-overview-right" aria-labelledby="cg-overview-hard">
      <div shuku-edit-id="e-6e94fa57-d29f-4b79-86cf-f89cec80275e" className="cg-overview-panel-heading"><Typography shuku-edit-id="e-af24c77e-63eb-462b-a68b-1b8f6a4b41c6" as="span" variant="h2" tone="inherit" className="cg-overview-number">2</Typography><div shuku-edit-id="e-e8721c8e-3f40-4dab-9962-c63c6c701097"><Typography shuku-edit-id="e-b0051513-4580-4910-8a6e-aec72eae7a0e" as="h2" variant="h2" tone="inherit" id="cg-overview-hard">实现支持</Typography><Typography shuku-edit-id="e-caa5b13d-de14-4264-9981-5bba9d0ea651" variant="bodySmall" tone="inherit">由代码实现的组件与模板，落实页面基础</Typography></div></div>
      <div shuku-edit-id="e-86baa938-7088-4521-a2a8-825214c5e6e8" className="cg-overview-right-content"><ComponentSpecimen/><FeatureList items={scaffold} className="cg-overview-scaffold"/></div>
    </section>
    <div shuku-edit-id="e-b10293c7-783b-4e0f-8361-14fbfd81027d" className="cg-overview-benefits">{benefits.map(([icon, title, description]) => <div shuku-edit-id="e-13e84911-af4c-4e18-9c3e-c42c3371d6a9" key={title}><span shuku-edit-id="e-52a53054-e228-4c2f-9e5a-9040cbcd7927"><OverviewIcon kind={icon}/></span><div shuku-edit-id="e-9d34dfb6-5178-4dcb-8d09-b019bef82191"><Typography shuku-edit-id="e-e9866d75-7734-490a-9b47-d7200bfbdca6" variant="body" tone="inherit">{title}</Typography><Typography shuku-edit-id="e-1bb9dbdc-a1e8-4680-9715-b7c0562a8652" variant="bodySmall" tone="inherit">{description}</Typography></div></div>)}</div>
  </article>;
}
