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
  return <svg shuku-edit-id="e-79b32c0a-44c1-4bde-8ca2-f0087e3e1939" viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path shuku-edit-id="e-d6d9ebae-c397-4cbb-b70f-affeb20b46c8" d={paths[kind]} /></svg>;
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
  return <div shuku-edit-id="e-019f58c9-26e7-4f72-a364-f80b88de0b52" className={className}>{items.map(([icon, title, description]) =>
    <div shuku-edit-id="e-dfaa85be-055a-41ce-b16f-3967fec066f9" className="aipe-replay-cg-overview-feature" key={title}>
      <OverviewIcon kind={icon}/>
      <div shuku-edit-id="e-02208206-6d52-4402-8125-0f18f35eff12"><Typography shuku-edit-id="e-aaadb1ed-8e52-43d1-b8af-305bac95abfb" as="h3" variant="bodySmall" tone="inherit">{title}</Typography><Typography shuku-edit-id="e-0ccfbbe3-dd5d-4634-b457-03ee280f34e7" variant="bodySmall" tone="inherit">{description}</Typography></div>
    </div>,
  )}</div>;
}
function ComponentSpecimen() {
  const [theme, setTheme] = useState('blue');
  const [size, setSize] = useState(70);
  const [applied, setApplied] = useState(false);
  return <div shuku-edit-id="e-fd85c816-c0b4-4b97-94c8-1cd847bccd6b" className="aipe-replay-cg-overview-specimen" role="group" aria-label="体验组件与模板" data-theme={theme} onKeyDown={event => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Escape', ' '].includes(event.key)) event.stopPropagation();
  }}>
    <Typography shuku-edit-id="e-29b07ef6-3cca-4504-ac3e-6e8b4e3876ed" variant="bodySmall" tone="inherit">组件与模板</Typography>
    <Select label="选择主题" controlClassName="aipe-replay-cg-overview-theme-select" value={theme} onChange={setTheme} options={[
      { value: 'blue', label: <Typography shuku-edit-id="e-2cc1433e-fccb-4b3b-9da1-61c37fcb0680" as="span" variant="bodySmall" tone="inherit">蓝色主题</Typography> },
      { value: 'orange', label: <Typography shuku-edit-id="e-6e396b65-e601-45df-b238-744c17c38861" as="span" variant="bodySmall" tone="inherit">橙色主题</Typography> },
    ]}/>
    <RangeControl label="图形大小" aria-label="图形大小" min={30} max={100} step={1} value={size} suffix="%" onChange={event => setSize(Number(event.currentTarget.value))}/>
    <Button variant="primary" className="aipe-replay-cg-overview-demo-button" aria-pressed={applied} onClick={() => setApplied(current => !current)}><Typography shuku-edit-id="e-a451a129-6e08-4085-9673-03a936395aa9" as="span" variant="bodySmall" tone="inherit">{applied ? '重置' : '开始'}</Typography></Button>
    <div shuku-edit-id="e-5dfe31e8-0db8-43f8-82ea-40084af97870" className={'aipe-replay-cg-overview-template' + (applied ? ' is-applied' : '')} role="img" aria-label={`${theme === 'blue' ? '蓝色' : '橙色'}页面预览，图形大小${size}%，${applied ? '已开始演示' : '待开始'}`}><div shuku-edit-id="e-ccdc685d-98e5-4c69-b166-2417a49541ed" className="aipe-replay-cg-overview-template-image"><svg shuku-edit-id="e-9ddaac6b-1c90-43f4-95b6-190158bcfa1c" viewBox="0 0 100 80" aria-hidden="true" style={{ transform: `scale(${size / 100})` }}><path shuku-edit-id="e-7a7996df-2c5c-4f85-b97a-8fc3867b4c60" d="m0 80 35-45 19 23 17-36 29 58" fill="currentColor"/></svg></div><div shuku-edit-id="e-19c65c80-ce41-4d70-860e-3d6327bf1ba3" className="aipe-replay-cg-overview-template-lines"><i shuku-edit-id="e-964d2ab0-d4f0-4ddd-94bb-611d13831591"/><i shuku-edit-id="e-af47fec5-dc71-47ee-a1b6-f48458c3eec1"/><i shuku-edit-id="e-569bbb67-5b57-4c09-a653-77617911fe66"/><i shuku-edit-id="e-b35a099a-7cb3-4d6a-9f2b-14b11df920bf"/></div><div shuku-edit-id="e-7cf1fd0c-327b-49b1-aef5-2bd489814bf1" className="aipe-replay-cg-overview-template-dots"><i shuku-edit-id="e-2eb6f6fc-68df-4866-9055-cd5cce807b01"/><i shuku-edit-id="e-54f657e0-a099-49af-979e-13039f69ab34"/><i shuku-edit-id="e-c23cb360-ed58-412a-86bc-df77af45354d"/></div>{applied && <div shuku-edit-id="e-c385ec52-f835-4364-bbac-6525b1b6b554" className="aipe-replay-cg-overview-template-scan" aria-hidden="true"/>}</div>
    <Typography shuku-edit-id="e-6ac22bd9-c4a1-4dde-9677-1cce5e8b3631" variant="bodySmall" tone="inherit" align="center">1600 × 900</Typography>
  </div>;
}
export function SkillOverviewPage() {
  return <article shuku-edit-id="e-e63d6c56-e616-4458-8c8c-83af85069721" className="aipe-replay-cg-overview-page aipe-replay-cg-creator-typography" aria-labelledby="aipe-replay-cg-overview-title">
    <header shuku-edit-id="e-767d1e71-4d90-4a05-b829-c2d65d2f7588"><Typography shuku-edit-id="e-ec462955-04f9-4e87-abeb-4cd74b273b2f" as="h1" variant="display" tone="inherit" align="center" id="aipe-replay-cg-overview-title">Creator Skill：让创作者更专注于内容编排</Typography></header>
    <section shuku-edit-id="e-8c3f9889-518e-4abf-aeda-3258c25a89be" className="aipe-replay-cg-overview-panel aipe-replay-cg-overview-left" aria-labelledby="aipe-replay-cg-overview-soft">
      <div shuku-edit-id="e-8258fa95-3831-4af0-845d-56481e3adf60" className="aipe-replay-cg-overview-panel-heading"><Typography shuku-edit-id="e-1523c149-c806-4519-9007-80dad7a8b6e8" as="span" variant="h2" tone="inherit" className="aipe-replay-cg-overview-number">1</Typography><div shuku-edit-id="e-e7418a48-b728-453b-9947-e9c1f875f930"><Typography shuku-edit-id="e-7e169af0-9c1f-40ad-b17e-81ee4fd7547e" as="h2" variant="h2" tone="inherit" id="aipe-replay-cg-overview-soft">创作指导</Typography><Typography shuku-edit-id="e-1d1b3ade-ffb3-45e9-a86c-0db2e5b04f83" variant="bodySmall" tone="inherit">描述性的规则与偏好，指导智能体如何设计</Typography></div></div>
      <div shuku-edit-id="e-fe0dedc7-d9d5-417a-b75a-ca1c2a25d911" className="aipe-replay-cg-overview-left-content">
        <div shuku-edit-id="e-23fdc67d-901a-4004-96ad-d77e364bf6b7" className="aipe-replay-cg-overview-editor"><div shuku-edit-id="e-f459c0b1-79fc-4e49-b2ba-ce5cd5552c20" className="aipe-replay-cg-overview-editor-bar"><i shuku-edit-id="e-a2073d33-71b5-43b3-b87f-79443159546d"/><i shuku-edit-id="e-2af7db5d-ef5b-4616-9093-68c07e60cad4"/><i shuku-edit-id="e-d0b73fb9-f762-4a8a-b064-a73c1a66c347"/><Typography shuku-edit-id="e-52ca3a3d-7f9a-433e-981f-0ab8dae4cb04" variant="bodySmall" tone="inherit">设计指引</Typography></div><div shuku-edit-id="e-d9171cb8-674a-498b-8985-2e22db726c5b" className="aipe-replay-cg-overview-code">{guidance.map(([title, ...lines]) => <div shuku-edit-id="e-65cc5ca4-3611-481a-b9f6-525f1104eaaa" key={title}><Typography shuku-edit-id="e-daa7f1f9-ae54-440d-af96-f0f39039b95a" variant="bodySmall" tone="inherit" className="aipe-replay-cg-overview-code-title">{title}</Typography>{lines.map(line => <Typography shuku-edit-id="e-2e3cb73b-1599-42d3-9169-d7b83cb6aeb8" variant="bodySmall" tone="inherit" key={line}>{line}</Typography>)}</div>)}<Typography shuku-edit-id="e-3149cf2a-db7a-494e-9cee-7f32280dbdac" variant="bodySmall" tone="inherit" className="aipe-replay-cg-overview-ellipsis" aria-label="还有更多设计指引">···</Typography></div></div>
        <FeatureList items={rules} className="aipe-replay-cg-overview-rules"/>
      </div>
    </section>
    <svg shuku-edit-id="e-6a643983-d7c2-4db6-be8c-4269951fc5fb" className="aipe-replay-cg-overview-arrows" viewBox="0 0 1600 900" aria-hidden="true"><defs shuku-edit-id="e-1b8148f5-fc6f-46c6-b190-3802cf0f60bb"><linearGradient shuku-edit-id="e-2bc41046-f480-4851-945e-40f82d30b4b0" id="aipe-replay-cg-overview-blue"><stop shuku-edit-id="e-81815eff-2bbc-4982-8761-08dcc903bd28" stopColor="#d8e8ff"/><stop shuku-edit-id="e-0bcf83cd-75bd-4a04-b4d1-108b8de67dd2" offset="1" stopColor="#367dff"/></linearGradient><linearGradient shuku-edit-id="e-fabf268a-cbd4-41c8-8e98-491d32018804" id="aipe-replay-cg-overview-orange"><stop shuku-edit-id="e-5379847c-3028-44e4-a8d3-d4f15939ef7e" stopColor="#ffb264"/><stop shuku-edit-id="e-0a8531b7-37bf-4d1b-82fa-0861433ee02f" offset="1" stopColor="#ffead0"/></linearGradient></defs><path shuku-edit-id="e-99998129-49a4-40ea-9f03-f980786b9306" d="M662 228Q713 226 741 269M724 260l18 11 1-22" fill="none" stroke="url(#aipe-replay-cg-overview-blue)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/><path shuku-edit-id="e-c9d9d041-14d3-4676-b7d5-bfdaf3b39953" d="M941 228Q890 226 862 269M861 250l1 21 18-11" fill="none" stroke="url(#aipe-replay-cg-overview-orange)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/><path shuku-edit-id="e-599debbd-105e-4519-b0ea-8d0e30abaa56" d="M800 710v27m-14-13 14 14 14-14" fill="none" stroke="#84a7ff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/></svg>
    <div shuku-edit-id="e-98596bea-3b5e-4abf-8754-dd70fb7b1e30" className="aipe-replay-cg-overview-agent"><div shuku-edit-id="e-ee93dee5-1980-4a8b-a376-0808f0295e1b" className="aipe-replay-cg-overview-robot" aria-hidden="true"><div shuku-edit-id="e-8c25bdda-a060-4995-aa58-53828afddb60"><i shuku-edit-id="e-adc18981-79e3-4c01-a304-d4352acf6876"/><i shuku-edit-id="e-581b75e1-dbc5-485b-99ad-9aa153d98009"/></div></div><Typography shuku-edit-id="e-6b1be752-e8c0-4272-9377-cb6d7df8152d" variant="h3" tone="inherit">智能体</Typography><Typography shuku-edit-id="e-aa369d5a-a282-480b-bd84-8a01b022b745" variant="bodySmall" tone="inherit">+</Typography><Typography shuku-edit-id="e-1194a088-5030-428f-95d2-d461c34ccc6f" variant="body" tone="inherit" className="aipe-replay-cg-overview-skill-label">Creator Skill</Typography><div shuku-edit-id="e-bcd1f6cc-8785-43e6-b4ec-8ad25c4e4bb5" className="aipe-replay-cg-overview-agent-checks">{['理解创作需求', '参考设计指引', '调用组件模板', '生成教学页面'].map(t => <div shuku-edit-id="e-2d5defb9-5118-4bad-9ca0-a07e86746fa2" key={t}><span shuku-edit-id="e-6d2ba01b-f6e1-4f73-bb33-2d0a7978fa7e" aria-hidden="true">✓</span><Typography shuku-edit-id="e-de16582f-ec59-4d7d-b293-8a888dfa2ada" variant="bodySmall" tone="inherit">{t}</Typography></div>)}</div></div>
    <section shuku-edit-id="e-0b21945b-d335-484f-8be2-9c077e32bebd" className="aipe-replay-cg-overview-panel aipe-replay-cg-overview-right" aria-labelledby="aipe-replay-cg-overview-hard">
      <div shuku-edit-id="e-a09f1cbc-69d6-49b1-b12e-0e339e88de85" className="aipe-replay-cg-overview-panel-heading"><Typography shuku-edit-id="e-8e6db748-8263-4113-ae8a-267ddd13fba0" as="span" variant="h2" tone="inherit" className="aipe-replay-cg-overview-number">2</Typography><div shuku-edit-id="e-fb11eab7-2d01-4da4-bd99-8ae10af0d579"><Typography shuku-edit-id="e-5e9c68e5-ba9e-4080-8cf3-dec265c06e36" as="h2" variant="h2" tone="inherit" id="aipe-replay-cg-overview-hard">实现支持</Typography><Typography shuku-edit-id="e-6b3d6a1f-177c-4265-add4-912501495277" variant="bodySmall" tone="inherit">由代码实现的组件与模板，落实页面基础</Typography></div></div>
      <div shuku-edit-id="e-555a41b0-213d-4ff9-b24a-c567a80c73d2" className="aipe-replay-cg-overview-right-content"><ComponentSpecimen/><FeatureList items={scaffold} className="aipe-replay-cg-overview-scaffold"/></div>
    </section>
    <div shuku-edit-id="e-b132a30b-6afe-4f0e-9b6e-2f96058d7def" className="aipe-replay-cg-overview-benefits">{benefits.map(([icon, title, description]) => <div shuku-edit-id="e-471cb5d8-f830-43e3-a36f-2132a798c8bd" key={title}><span shuku-edit-id="e-482c6fc7-9753-4f25-b6c4-f0bbea0d40a2"><OverviewIcon kind={icon}/></span><div shuku-edit-id="e-5d287505-bb23-477a-b5c6-f447b8194ab7"><Typography shuku-edit-id="e-7490503e-b70b-4894-aa53-4b4ffff86bb1" variant="body" tone="inherit">{title}</Typography><Typography shuku-edit-id="e-6088fba7-8dad-44de-935f-3346125144b0" variant="bodySmall" tone="inherit">{description}</Typography></div></div>)}</div>
  </article>;
}
