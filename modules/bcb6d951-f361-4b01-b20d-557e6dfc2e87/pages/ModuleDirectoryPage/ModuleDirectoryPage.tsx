import { useState } from 'react';
import { ChevronDown, FileJson, FileCode2, Folder, Image, MonitorPlay, BookOpen, Layers, SlidersHorizontal } from 'lucide-react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import './ModuleDirectoryPage.css';

const items = [
  { id: 'outline', name: 'outlines.json', purpose: '模块信息、页序、标题与讲稿', icon: FileJson, path: 'modules / Example / outlines.json' },
  { id: 'guide', name: 'ExampleGuide.tsx', purpose: '组织学习阅读', icon: BookOpen, path: 'modules / Example / ExampleGuide.tsx' },
  { id: 'ppt', name: 'ExamplePpt.tsx', purpose: '组织演示播放', icon: MonitorPlay, path: 'modules / Example / ExamplePpt.tsx' },
  { id: 'pages', name: 'pages/', purpose: '按页组织课件内容', icon: Folder, path: 'modules / Example / pages' },
  { id: 'pageFolder', name: 'DemoPage/', purpose: '这一页的组件、样式与记录', icon: Folder, path: 'modules / Example / pages / DemoPage' },
  { id: 'page', name: 'DemoPage.tsx', purpose: '页面结构与交互', icon: FileCode2, path: 'modules / Example / pages / DemoPage / DemoPage.tsx' },
  { id: 'css', name: 'DemoPage.css', purpose: '页面的布局与样式', icon: SlidersHorizontal, path: 'modules / Example / pages / DemoPage / DemoPage.css' },
  { id: 'pageScratch', name: '_scratchpad/', purpose: '本页设计图、截图与检查记录', icon: Folder, path: 'modules / Example / pages / DemoPage / _scratchpad' },
  { id: 'components', name: 'components/', purpose: '模块内复用的组件', icon: Layers, path: 'modules / Example / components' },
  { id: 'assets', name: 'assets/', purpose: '正式图片、视频与数据', icon: Image, path: 'modules / Example / assets' },
  { id: 'scratch', name: '_scratchpad/', purpose: '整份课件的临时记录', icon: Folder, path: 'modules / Example / _scratchpad' },
  { id: 'shared', name: 'shared/', purpose: '跨模块公共组件与播放器', icon: Layers, path: 'modules / shared' },
] as const;
type ItemId = typeof items[number]['id'];
const descriptions: Record<ItemId, string> = {
  outline: '保存模块信息、页面顺序、标题与演讲稿，并声明学习入口和 PPT 入口。',
  guide: '把各页组件组织成学习阅读入口，安排连续阅读或学习流程。',
  ppt: '把各页组件组织成演示场景，接入公共播放器与每页讲稿。',
  pages: '每页一个独立目录，把课件内容按页面组织，便于定位与维护。',
  pageFolder: '集中保存这一页的 TSX 组件、CSS 样式，以及本页的设计与检查记录。',
  page: '定义这一页显示什么，以及点击、拖动等操作怎样改变状态与画面。',
  css: '控制这一页的布局、颜色与间距，与页面组件放在同一个目录中。',
  pageScratch: '存放本页的设计示意图、提示词、实际截图与检查记录。',
  components: '存放当前模块中多页复用的组件，例如共用图表、控制面板或示意图。',
  assets: '存放当前模块正式使用的图片、视频与数据，通过模块资源地址加载。',
  scratch: '存放整份课件的原稿、大纲备份、整体规划与汇总记录。',
  shared: '提供跨模块复用的公共组件、布局、字体与播放器，与各课件模块同级。',
};
const renameRules: Record<ItemId, { fixed: boolean; action: string; consequence: string }> = {
  outline: { fixed: true, action: '必须保留 outlines.json。模块发现和资源工具按这个固定文件名读取配置。', consequence: '改名后，模块将无法被自动发现，资源工具也会失效。' },
  guide: { fixed: false, action: '同步更新 outlines.json 的 entry、同名导出组件，以及相关 import 引用。', consequence: '只改文件名，学习入口可能无法注册或加载。' },
  ppt: { fixed: false, action: '同步更新 outlines.json 的 ppt.entry、同名导出组件，以及相关 import 引用。', consequence: '只改文件名，演示入口可能无法加载。' },
  pages: { fixed: true, action: '必须保留 pages。页面目录规范、样式处理和创作工具都依赖这个位置。', consequence: '改名会破坏页面定位与部分工具的路径匹配。' },
  pageFolder: { fixed: false, action: '同步更新入口及其他文件中的组件路径，并核对本页工具记录的位置。', consequence: '只改目录名，组件导入或页面检查可能失败；页面 ID 保持不变。' },
  page: { fixed: false, action: '同步更新入口及其他文件中的 import；若同时更改导出组件名，也要同步引用。', consequence: '遗漏引用会导致构建或加载失败；页面 ID 保持不变。' },
  css: { fixed: false, action: '同步更新页面组件中的样式 import，保持组件与样式同名的组织约定。', consequence: '遗漏引用会导致样式加载或构建失败。' },
  pageScratch: { fixed: true, action: '必须保留 _scratchpad。页面检查工具和 Git 忽略规则使用这个固定目录名。', consequence: '改名后，归档路径和忽略规则可能不再匹配。' },
  components: { fixed: false, action: '同步更新所有引用此目录内组件的 import 路径。', consequence: '只改目录名，组件导入会失败。' },
  assets: { fixed: true, action: '必须保留 assets。资源解析与上传工具按这个固定目录定位正式素材。', consequence: '改名会使本地资源定位和发布失效。' },
  scratch: { fixed: true, action: '必须保留 _scratchpad。整体归档工具和 Git 忽略规则使用这个固定目录名。', consequence: '改名后，归档路径和忽略规则可能不再匹配。' },
  shared: { fixed: true, action: '必须保留 shared。多个模块的导入路径、资源索引与工程工具都依赖它。', consequence: '改名会影响多个模块，无法作为单个课件的局部修改。' },
};
export function ModuleDirectoryPage() {
  const [selected, setSelected] = useState<ItemId>('ppt');
  const item = items.find(candidate => candidate.id === selected)!;
  const rule = renameRules[selected];
  const row = (id: ItemId, depth = 0) => {
    const entry = items.find(candidate => candidate.id === id)!;
    const Icon = entry.icon;
    return <button shuku-edit-id="e-f05aeec8-ddb2-402b-b60c-e77933adccfe" key={id} type="button" className={`acw-directory-row ${selected === id ? 'is-selected' : ''}`} style={{ paddingLeft: 20 + depth * 24 }} onClick={() => setSelected(id)} aria-pressed={selected === id} data-directory-item={id}><Icon size={24} /><Typography shuku-edit-id="e-9fe62653-2171-4ffe-980b-6d6324d25ddc" as="code" variant="bodySmall">{entry.name}</Typography></button>;
  };
  return <ContentBlock shuku-edit-id="e-af0d6c5f-9c45-4855-b7a0-595350ffe907" className="acw-directory-page" data-scene-id="17ce6165-3c41-4d34-80da-f07dbf3debbd" title="模块目录地图：要改什么，去哪里找" subtitle="看懂文件的职责，也知道改名会影响哪里" bodyClassName="acw-directory-body">
    <div shuku-edit-id="e-6567b530-5592-4d38-9b00-984be5a1c9c7" className="acw-directory-editor">
      <div shuku-edit-id="e-c3559564-961d-47fe-a731-7a6e893ad36d" className="acw-directory-toolbar"><Folder size={24} /><Typography shuku-edit-id="e-d7b37838-97ed-48e1-a9f8-186185c4addb" variant="bodySmall">Example / 模块结构示意</Typography><Typography shuku-edit-id="e-a4aeb0fe-0215-4531-8a25-7e471e4eab42" variant="bodySmall" tone="muted">点击文件，查看说明</Typography></div>
      <div shuku-edit-id="e-529c19ec-e91b-4eb9-8507-4b214e69a560" className="acw-directory-workspace">
        <nav shuku-edit-id="e-77460c39-548e-4c24-a77f-89a8fd54366a" className="acw-directory-sidebar" aria-label="模块大纲">
          <div shuku-edit-id="e-26c34f0f-fcc5-46c4-a19b-a1a6f5761818" className="acw-directory-folder"><ChevronDown size={18} /><Folder size={23} /><Typography shuku-edit-id="e-a826a532-6659-42f2-90d5-3c184ef899dc" as="code" variant="bodySmall">modules/</Typography></div>
          {row('shared', 1)}
          <div shuku-edit-id="e-07df475b-a6e1-45ec-9e07-e78a43efe0bc" className="acw-directory-folder acw-directory-indent"><ChevronDown size={18} /><Folder size={23} /><Typography shuku-edit-id="e-77f9bdcf-a827-406f-b31a-2b7de4c8539d" as="code" variant="bodySmall">Example/</Typography></div>
          {row('outline', 2)}{row('guide', 2)}{row('ppt', 2)}
          {row('pages', 2)}{row('pageFolder', 3)}
          {row('page', 4)}{row('css', 4)}{row('pageScratch', 4)}
          {row('components', 2)}{row('assets', 2)}{row('scratch', 2)}
        </nav>
        <section shuku-edit-id="e-a2418950-82fb-451d-b98e-568550fc3cfb" className="acw-directory-preview" aria-label="文件用途" aria-live="polite">
          <div shuku-edit-id="e-eea9e253-a883-4802-a037-aff69554fd54" className="acw-directory-preview-content" key={selected}>
            <div shuku-edit-id="e-952501bc-01c9-45ed-9410-21ee9c864d00" className="acw-directory-file-heading"><item.icon size={28} /><Typography shuku-edit-id="e-6b6696f1-df8c-427c-aaef-a82d3d73ef8b" as="code" variant="body">{item.name}</Typography><Typography shuku-edit-id="e-b3424462-ea5a-4b0a-9e73-092352cbdb71" variant="bodySmall" className={`acw-directory-rename-badge ${rule.fixed ? 'is-fixed' : ''}`} data-rename-policy={rule.fixed ? 'fixed' : 'renameable'}>{rule.fixed ? '禁止改名' : '可以改名 · 需同步引用'}</Typography></div>
            <Typography shuku-edit-id="e-3e3d871d-9b5d-4619-86c3-f3a7bfe53381" variant="h3" className="acw-directory-purpose">{item.purpose}</Typography>
            <div shuku-edit-id="e-4ee5aa2c-ea4d-4449-a390-452ca9cf4827" className="acw-directory-responsibility"><Typography shuku-edit-id="e-51ffcb5a-bfe9-413c-a7bc-d72cb498e31f" variant="body" tone="accent">负责什么</Typography><Typography shuku-edit-id="e-dbec0ac0-4169-440c-8597-8e60eb2bf458" variant="body" className="acw-directory-description">{descriptions[selected]}</Typography></div>
            <div shuku-edit-id="e-3ee706cb-6abe-44b6-a9df-20ea815c9bcc" className="acw-directory-rename-panel"><Typography shuku-edit-id="e-1fc7480c-cdfe-425a-aefd-f1a3fc5ca724" variant="body" className="acw-directory-rename-label">如果改名</Typography><Typography shuku-edit-id="e-b69a8ae3-ee7e-4651-893d-93d27d411a2e" variant="body">{rule.action}</Typography><Typography shuku-edit-id="e-810f30ec-45d6-4f74-b472-f6bf43035a3f" variant="bodySmall" className="acw-directory-rename-consequence">{rule.consequence}</Typography></div>
          </div>
        </section>
      </div>
      <div shuku-edit-id="e-216abed6-0e25-4f9d-97a8-c5cf6bd5d893" className="acw-directory-status"><Typography shuku-edit-id="e-df965dde-dae1-461d-b12c-9df70406def2" variant="bodySmall" tone="muted">文件名有约定；改名时同步检查声明、引用与工具配置</Typography></div>
    </div>
  </ContentBlock>;
}


