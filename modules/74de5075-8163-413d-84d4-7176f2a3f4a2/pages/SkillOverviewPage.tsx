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
  return <svg shuku-edit-id="e-217117e0-3c8f-489b-90f1-3494f0753ac2" viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path shuku-edit-id="e-06a2ea5c-579a-492a-8cd7-bb93140ad839" d={paths[kind]} /></svg>;
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
  return <div shuku-edit-id="e-86c2b715-57c2-4031-afc4-79c9e9c9232f" className={className}>{items.map(([icon, title, description]) =>
    <div shuku-edit-id="e-30e4b957-5bf7-4e3e-9ba6-6dc9c7760d76" className="cg-overview-feature" key={title}>
      <OverviewIcon kind={icon}/>
      <div shuku-edit-id="e-c4578560-578c-44a5-97df-ef220f7eb505"><Typography shuku-edit-id="e-ffaba622-31e6-4d37-b966-36ed0f8c6fdd" as="h3" variant="bodySmall" tone="inherit">{title}</Typography><Typography shuku-edit-id="e-9c65e702-5a7e-4b1e-bf92-d2fd92e36b18" variant="bodySmall" tone="inherit">{description}</Typography></div>
    </div>,
  )}</div>;
}
function ComponentSpecimen() {
  const [theme, setTheme] = useState('blue');
  const [size, setSize] = useState(70);
  const [applied, setApplied] = useState(false);
  return <div shuku-edit-id="e-50b6f9d4-ea89-484b-9764-44e89a0f947b" className="cg-overview-specimen" role="group" aria-label="体验组件与模板" data-theme={theme} onKeyDown={event => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Escape', ' '].includes(event.key)) event.stopPropagation();
  }}>
    <Typography shuku-edit-id="e-69edce60-c14f-4da6-97c2-cea68dc04aba" variant="bodySmall" tone="inherit">组件与模板</Typography>
    <Select label="选择主题" controlClassName="cg-overview-theme-select" value={theme} onChange={setTheme} options={[
      { value: 'blue', label: <Typography shuku-edit-id="e-17ef9c57-92c1-46dd-b36a-7037d983a34b" as="span" variant="bodySmall" tone="inherit">蓝色主题</Typography> },
      { value: 'orange', label: <Typography shuku-edit-id="e-330d62c7-bdbf-4c91-98fa-3ffa0e220fdd" as="span" variant="bodySmall" tone="inherit">橙色主题</Typography> },
    ]}/>
    <RangeControl label="图形大小" aria-label="图形大小" min={30} max={100} step={1} value={size} suffix="%" onChange={event => setSize(Number(event.currentTarget.value))}/>
    <Button variant="primary" className="cg-overview-demo-button" aria-pressed={applied} onClick={() => setApplied(current => !current)}><Typography shuku-edit-id="e-5c87ae40-a0b1-4efc-be29-cb08ea9b3adf" as="span" variant="bodySmall" tone="inherit">{applied ? '重置' : '开始'}</Typography></Button>
    <div shuku-edit-id="e-103a332b-6373-4ee0-b4cf-c90df67cc67e" className={'cg-overview-template' + (applied ? ' is-applied' : '')} role="img" aria-label={`${theme === 'blue' ? '蓝色' : '橙色'}页面预览，图形大小${size}%，${applied ? '已开始演示' : '待开始'}`}><div shuku-edit-id="e-1b41878f-e573-4e46-afc9-41a16a8781f7" className="cg-overview-template-image"><svg shuku-edit-id="e-3fe10f2a-4218-47e3-a992-3f627869a34b" viewBox="0 0 100 80" aria-hidden="true" style={{ transform: `scale(${size / 100})` }}><path shuku-edit-id="e-be7a408c-a957-42cf-827e-75f49462c1eb" d="m0 80 35-45 19 23 17-36 29 58" fill="currentColor"/></svg></div><div shuku-edit-id="e-c5359319-35da-4d09-ad0c-28ce2bf2a90e" className="cg-overview-template-lines"><i shuku-edit-id="e-8bb422a6-d8bb-453f-a29c-d52a2a07ca09"/><i shuku-edit-id="e-48fa9562-12ee-4a4c-acb8-ef414dc8c7f5"/><i shuku-edit-id="e-3899cc29-8df9-4b2e-8326-89407943f9b5"/><i shuku-edit-id="e-54279413-cb9f-4f9c-b248-7385be229142"/></div><div shuku-edit-id="e-74844278-693e-47ae-bde1-5aa15b91bf05" className="cg-overview-template-dots"><i shuku-edit-id="e-8897fcf9-b4e1-419a-9995-f439c127c7ba"/><i shuku-edit-id="e-1440d8d7-a148-4ad9-a572-9c2af9627125"/><i shuku-edit-id="e-a25f1262-6b4c-445e-960e-9964a7c1ecbd"/></div>{applied && <div shuku-edit-id="e-716ebf9a-bc49-4d8b-8c8a-f39ab65ceefb" className="cg-overview-template-scan" aria-hidden="true"/>}</div>
    <Typography shuku-edit-id="e-65efbf7e-015a-4e82-b39d-ac40ba17e67c" variant="bodySmall" tone="inherit" align="center">1600 × 900</Typography>
  </div>;
}
export function SkillOverviewPage() {
  return <article shuku-edit-id="e-b6c18ef2-0c4c-4bc1-8c30-ab57c03e0ce6" className="cg-overview-page cg-creator-typography" aria-labelledby="cg-overview-title">
    <header shuku-edit-id="e-4bfb1203-f2b4-4a27-9c77-2f6d9f27e0f2"><Typography shuku-edit-id="e-27d00750-19cf-4a0b-8c6d-15141c00518f" as="h1" variant="display" tone="inherit" id="cg-overview-title">Creator Skill：让创作者更专注于内容编排</Typography><Typography shuku-edit-id="e-555fc41d-a45f-4685-ac11-bc63da21338d" variant="bodySmall" tone="inherit">创作指导提供设计方法与表达建议，实现支持提供组件、模板与工具，帮助智能体落实教学想法。</Typography></header>
    <section shuku-edit-id="e-8faa5750-1a88-48d7-95ec-f8daf628af07" className="cg-overview-panel cg-overview-left" aria-labelledby="cg-overview-soft">
      <div shuku-edit-id="e-750cf121-c97b-461f-8042-91fc66708a75" className="cg-overview-panel-heading"><Typography shuku-edit-id="e-c2f5a742-61c3-4c07-9068-efb7a52649b6" as="span" variant="h2" tone="inherit" className="cg-overview-number">1</Typography><div shuku-edit-id="e-484d84bb-b2fb-4ff6-aad2-c161b2f96b94"><Typography shuku-edit-id="e-0accc356-6c00-4342-af70-4dbf774bac51" as="h2" variant="h2" tone="inherit" id="cg-overview-soft">创作指导</Typography><Typography shuku-edit-id="e-133452c0-38f1-48a4-8166-3cd39c0756b0" variant="bodySmall" tone="inherit">描述性的规则与偏好，指导智能体如何设计</Typography></div></div>
      <div shuku-edit-id="e-865b1596-aab5-4624-8c19-b7454c6091a5" className="cg-overview-left-content">
        <div shuku-edit-id="e-0ae4abb0-39a9-444f-b0cb-38eada8a00dc" className="cg-overview-editor"><div shuku-edit-id="e-56fa5b25-8dfa-42dc-8045-5314872f1cfa" className="cg-overview-editor-bar"><i shuku-edit-id="e-000a0575-c67e-4eca-bbfc-a948fcedf53c"/><i shuku-edit-id="e-3636ab78-9199-42cc-bc74-6a719317a080"/><i shuku-edit-id="e-63789c52-31a9-474d-9072-bcd297225b85"/><Typography shuku-edit-id="e-42696b26-885f-409c-bd3b-d1321fa5d037" variant="bodySmall" tone="inherit">设计指引</Typography></div><div shuku-edit-id="e-ba43647d-981b-43de-bead-fbb7dd5cd163" className="cg-overview-code">{guidance.map(([title, ...lines]) => <div shuku-edit-id="e-34a0edd3-cfaa-404b-85f7-100386321559" key={title}><Typography shuku-edit-id="e-471f5d20-42ea-4664-84da-2a92dc999a03" variant="bodySmall" tone="inherit" className="cg-overview-code-title">{title}</Typography>{lines.map(line => <Typography shuku-edit-id="e-d564007a-1be4-4e9a-8df0-81da9f3d510c" variant="bodySmall" tone="inherit" key={line}>{line}</Typography>)}</div>)}<Typography shuku-edit-id="e-ecbac0c1-9e0a-4cc1-b145-4e0445497f61" variant="bodySmall" tone="inherit" className="cg-overview-ellipsis" aria-label="还有更多设计指引">···</Typography></div></div>
        <FeatureList items={rules} className="cg-overview-rules"/>
      </div>
    </section>
    <svg shuku-edit-id="e-8f1ff350-4740-4f5c-b539-9624b552b92f" className="cg-overview-arrows" viewBox="0 0 1600 900" aria-hidden="true"><defs shuku-edit-id="e-f01811dd-b8b6-44b6-a7e2-d2a65e4852d4"><linearGradient shuku-edit-id="e-4236e3d4-380e-4b86-9ef7-2c7e16998355" id="cg-overview-blue"><stop shuku-edit-id="e-dc0c1096-9d34-45c1-85cd-f85b9411722b" stopColor="#d8e8ff"/><stop shuku-edit-id="e-7bfdd45c-4a69-49b6-99e0-b88a3da5da2a" offset="1" stopColor="#367dff"/></linearGradient><linearGradient shuku-edit-id="e-e5ff6d6f-ef83-4627-a3d1-5e95b1a62b82" id="cg-overview-orange"><stop shuku-edit-id="e-a03185b2-acad-44a8-8b04-cf8835623895" stopColor="#ffb264"/><stop shuku-edit-id="e-1873531b-a8ed-4f48-b464-c43c00e91ef4" offset="1" stopColor="#ffead0"/></linearGradient></defs><path shuku-edit-id="e-3326d8e5-12b1-4294-a1b2-cfa69709d744" d="M662 228Q713 226 741 269M724 260l18 11 1-22" fill="none" stroke="url(#cg-overview-blue)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/><path shuku-edit-id="e-b4d352ba-3f1a-4c3b-9026-595f49e9dc7d" d="M941 228Q890 226 862 269M861 250l1 21 18-11" fill="none" stroke="url(#cg-overview-orange)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/><path shuku-edit-id="e-c8199111-1333-428e-a285-e2ca483d5dd1" d="M800 710v27m-14-13 14 14 14-14" fill="none" stroke="#84a7ff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/></svg>
    <div shuku-edit-id="e-a8b927f1-f501-4644-9f90-5a76603184fd" className="cg-overview-agent"><div shuku-edit-id="e-7e89f646-b960-460c-84c2-d791329eb1f8" className="cg-overview-robot" aria-hidden="true"><div shuku-edit-id="e-38cd1d2e-2926-4167-b961-42c3225f0f73"><i shuku-edit-id="e-82f185a8-426a-4cf0-bed0-019ac648141c"/><i shuku-edit-id="e-fb3b1af2-a389-4cfc-9b47-194d6aa2e5a2"/></div></div><Typography shuku-edit-id="e-8b8d3e3d-252d-40da-8e59-79204ccb0085" variant="h3" tone="inherit">智能体</Typography><Typography shuku-edit-id="e-048d9877-76e4-4ba2-9c47-e27bd193a951" variant="bodySmall" tone="inherit">+</Typography><Typography shuku-edit-id="e-b1178a6f-d065-4b8b-a5a4-215d7bcf6d55" variant="body" tone="inherit" className="cg-overview-skill-label">Creator Skill</Typography><div shuku-edit-id="e-7f2327b4-da7c-4c7c-863b-60ff629fc31e" className="cg-overview-agent-checks">{['理解创作需求', '参考设计指引', '调用组件模板', '生成教学页面'].map(t => <div shuku-edit-id="e-666080ba-0119-4519-825b-8f5222cbf7ad" key={t}><span shuku-edit-id="e-88bdd5e1-ac42-4364-943a-e5c47c3200a9" aria-hidden="true">✓</span><Typography shuku-edit-id="e-5de89ff3-10c3-481e-8fcc-9bdff4755bf6" variant="bodySmall" tone="inherit">{t}</Typography></div>)}</div></div>
    <section shuku-edit-id="e-e445d826-5421-4e30-9c51-77c80703ba8c" className="cg-overview-panel cg-overview-right" aria-labelledby="cg-overview-hard">
      <div shuku-edit-id="e-e3e91bb2-8c20-4dbd-b5f4-2b47837233fa" className="cg-overview-panel-heading"><Typography shuku-edit-id="e-499988b8-1e1b-425d-bc0b-b2240fa456c3" as="span" variant="h2" tone="inherit" className="cg-overview-number">2</Typography><div shuku-edit-id="e-7a7a3615-d93a-4200-abfb-80c562521def"><Typography shuku-edit-id="e-dc6d70f0-fe33-4723-ba6e-00e74cdeb112" as="h2" variant="h2" tone="inherit" id="cg-overview-hard">实现支持</Typography><Typography shuku-edit-id="e-da9bc57b-0fb3-4c5b-999d-dcfc9082d488" variant="bodySmall" tone="inherit">由代码实现的组件与模板，落实页面基础</Typography></div></div>
      <div shuku-edit-id="e-c23f60f7-8c4c-420e-a7da-49ac3c200534" className="cg-overview-right-content"><ComponentSpecimen/><FeatureList items={scaffold} className="cg-overview-scaffold"/></div>
    </section>
    <div shuku-edit-id="e-f1617fca-50a0-46ad-be5c-4957c83361c7" className="cg-overview-benefits">{benefits.map(([icon, title, description]) => <div shuku-edit-id="e-a1e0e4a4-b7f2-4228-a117-f6c636720d97" key={title}><span shuku-edit-id="e-84d13c35-4d7a-4cc3-92ac-970a3b51d687"><OverviewIcon kind={icon}/></span><div shuku-edit-id="e-3d98fa0a-2c45-41d2-b7ec-6450afb40a99"><Typography shuku-edit-id="e-8472d4ea-df06-4184-bd2b-ab2b307ef97d" variant="body" tone="inherit">{title}</Typography><Typography shuku-edit-id="e-4dab343b-b3d4-4a56-a93c-ee2e8c877d2b" variant="bodySmall" tone="inherit">{description}</Typography></div></div>)}</div>
  </article>;
}
