from pathlib import Path
import json
p=Path('modules/Creator-Guide/pages/SkillOverviewPage.tsx')
s=p.read_text(encoding='utf-8-sig').replace("import { Typography } from '../../shared/react';", "import { useState } from 'react';\nimport { Button, RangeControl, Select, Typography } from '../../shared/react';")
s=s.replace("  ['code', '工具函数', '数据处理与交互逻辑'],\n  ['folder', '素材资源', '图片、图标与示例数据'],", "  ['folder', '素材与工具', '图像素材与数据处理工具'],")
a=s.index('function ComponentSpecimen() {');b=s.index('export function SkillOverviewPage()',a)
s=s[:a]+'''function ComponentSpecimen() {
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
''' + s[b:]
s=s.replace('id="cg-overview-soft">软约束', 'id="cg-overview-soft">软约束').replace('as="h2" variant="display"', 'as="h2" variant="h2"')
s=s.replace('</div>)}</div></div>\n        <FeatureList', '</div>)}<Typography variant="bodySmall" tone="inherit" className="cg-overview-ellipsis" aria-label="还有更多设计指引">···</Typography></div></div>\n        <FeatureList')
p.write_text(s.strip()+'\n',encoding='utf-8')
p=Path('modules/Creator-Guide/outlines.json');s=p.read_text(encoding='utf-8');o=json.loads(s);page=next(p for p in o['pages'] if p['id']=='skill-overview')
updates={
 'summary':'保留蓝色左栏、居中智能体、橙色右栏和底部四项优势。软约束与硬约束使用低于主标题的二级标题。左侧简短Markdown指引底部以省略号表示还有更多；右侧提供可操作的主题下拉框、图形大小滑杆与开始/重置按钮，并将工程支撑合并为可复用组件、统一视觉基础、页面模板、素材与工具四类。',
 'interaction':'下拉框切换蓝色或橙色主题；滑杆调节预览图形大小；开始按钮播放预览扫描动效，再次点击重置。控件的方向键、空格和Escape操作不会触发播放器翻页。',
 'snippet':page['snippet'].replace('右侧的下拉框、滑杆、按钮与1600×900画布只是组件与模板的静态示意。','右侧可以实际体验主题下拉框、图形大小滑杆和开始/重置按钮，观察控件如何改变页面预览。工程支撑包括可复用组件、统一视觉基础、页面模板、素材与工具。左侧省略号表示这里只摘录了部分Markdown设计指引。')
}
for key,value in updates.items():s=s.replace(json.dumps(key,ensure_ascii=False)+': '+json.dumps(page[key],ensure_ascii=False),json.dumps(key,ensure_ascii=False)+': '+json.dumps(value,ensure_ascii=False),1)
p.write_text(s,encoding='utf-8')
