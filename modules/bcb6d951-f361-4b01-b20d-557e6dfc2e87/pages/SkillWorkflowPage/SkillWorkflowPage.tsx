import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight, FileText, Folder, Image, Wrench } from 'lucide-react';
import { ContentBlock, Typography } from '../../../shared/react';

import './SkillWorkflowPage.css';

const entries = [
  { id: 'skill', name: 'SKILL.md', icon: FileText, title: 'Skill 的入口：告诉 AI 怎样开展任务', path: 'creator-skill / SKILL.md', description: '把反复使用的创作方法写成说明，让 AI 知道何时使用、先做什么、遵守哪些规则，以及怎样检查结果。', example: '本项目：理解内容与大纲 → 生成设计图 → 确认后实现 → 检查真实页面与交互。' },
  { id: 'references', name: 'references/', icon: BookOpen, title: '详细规范：需要时再读取', path: 'creator-skill / references', description: '存放按任务查阅的详细说明。SKILL.md 指向相关资料，AI 在设计、实现或检查时读取对应部分。', example: '本项目：design/design.md 讲页面设计；engineering/implementation.md 讲工程实现；eval/checks.md 讲基础检查。' },
  { id: 'assets', name: 'assets/', icon: Image, title: '参考素材：把要求变成看得见的例子', path: 'creator-skill / assets', description: '存放工作流程需要的参考图片、模板等配套素材，帮助 AI 理解要达到的效果。', example: '本项目：visual_samples/ 保存成对的视觉正例与反例，设计前需要实际查看并比较。' },
  { id: 'scripts', name: 'scripts/', icon: Wrench, title: '配套工具：把重复操作交给脚本', path: 'creator-skill / scripts', description: '存放可以执行的工具，完成截图、模块检查等重复操作。AI 按任务选择工具，并读取真实结果。', example: '本项目：通过 tools.py 调用 capture.slides 截取真实页面，调用 check.module 检查模块结构。' },
];

const childEntries = [
  { id: "workflow", name: "workflow/", parent: "references", title: "创作流程：决定先做什么、何时确认", description: "区分从零创作与参考改编，规定大纲、设计确认、页面实现和验收的推进顺序。续作时也从当前阶段接着做。", example: "from-scratch.md、reference-adaptation.md、common.md。", path: "creator-skill / references / workflow", icon: Folder },
  { id: "design", name: "design/", parent: "references", title: "内容与设计：决定讲什么、怎样讲清楚", description: "规定大纲与讲稿的组织方法、页面构图、视觉样例的使用，以及题目和交互的设计方法。", example: "course-outline.md 管大纲；design.md 管页面设计；spoken-narration.md 管口播；quiz.md 管习题。", path: "creator-skill / references / design", icon: Folder },
  { id: "engineering", name: "engineering/", parent: "references", title: "工程规范：把设计接入真实项目", description: "说明 React 页面如何组织、公共组件怎样复用、模块资源怎样加载，以及创作工具脚本怎样编写。", example: "implementation.md、module-assets.md、scripts.md。", path: "creator-skill / references / engineering", icon: Folder },
  { id: "eval", name: "eval/", parent: "references", title: "检查与评价：确认作品是否达到要求", description: "规定真实页面的渲染、边界和交互检查。用户明确要求评分时，再读取评分标准。", example: "checks.md 用于基础检查；rubric-evaluation.md 用于明确要求的评分。", path: "creator-skill / references / eval", icon: Folder },
  { id: "computing", name: "computing/", parent: "references", title: "计算能力：需要模型或 GPU 时查阅", description: "说明课件需要调用大模型、使用 GPU 或开展较重计算时应怎样接入。普通静态页面无需读取这部分。", example: "llm.md 说明大模型调用；gpu.md 说明 GPU 与较重计算。", path: "creator-skill / references / computing", icon: Folder },
  { id: "visual_samples", name: "visual_samples/", parent: "assets", title: "视觉样例：比较具体设计的好与不好", description: "按同一主题配对保存正例与反例。设计前实际打开两张图，提取值得借鉴的方法，并明确要避开的问题。", example: "pos_human_design.jpg 与 neg_human_design.jpg；pos_param_share.jpg 与 neg_param_share.jpg。", path: "creator-skill / assets / visual_samples", icon: Folder },
  { id: "tools", name: "tools.py", parent: "scripts", title: "工具入口：统一发现和调用脚本", description: "从仓库根目录运行这个入口，查找工具、查看帮助，再调用对应功能。具体工具的参数以帮助为准。", example: "python creator-skill/scripts/tools.py list；也可用 describe capture.slides 查看工具说明。", path: "creator-skill / scripts / tools.py", icon: FileText },
  { id: "module", name: "module/", parent: "scripts", title: "模块管理：建立大纲与管理身份", description: "提供模块初始化、UUID 身份生成和检查等工具。初始化工具不会替你生成整套页面。", example: "module.init 创建缺失的初始大纲；module.identity 管理模块身份。", path: "creator-skill / scripts / module", icon: Folder },
  { id: "checks", name: "checks/", parent: "scripts", title: "检查工具：发现结构、资源与页面问题", description: "检查模块元数据、页 ID、大纲字段、资源引用和页面边界；也提供环境诊断和课程一致性检查。", example: "check.module、check.outlines、check.asset-imports、check.course、environment.doctor。", path: "creator-skill / scripts / checks", icon: Folder },
  { id: "media", name: "media/", parent: "scripts", title: "媒体工具：截图、缩略图与素材处理", description: "提供真实页面截图、正式缩略图、PPTX 提取和素材处理工具。涉及上传时，按当前任务的发布授权执行。", example: "capture.slides、capture.thumbnails、extract.pptx、media.remove-green、assets.upload。", path: "creator-skill / scripts / media", icon: Folder },
  { id: "analysis", name: "analysis/", parent: "scripts", title: "分析工具：查看整套课件的分布", description: "汇总页数、源码近似字数和缩略图视觉统计，帮助整体审视课件。统计结果不能替代真实页面检查。", example: "analyze.pages 可生成页面统计报告。", path: "creator-skill / scripts / analysis", icon: Folder },
  { id: "templates", name: "templates/", parent: "scripts", title: "脚本模板：扩展工具时从这里开始", description: "提供 Python 与 Node 工具模板，供维护者新增创作工具时复用，保持命令和输出约定一致。", example: "python_tool.py、node_tool.mjs；制作普通课件时通常不需要修改。", path: "creator-skill / scripts / templates", icon: Folder },
  { id: "tests", name: "tests/", parent: "scripts", title: "工具测试：修改工具后验证功能", description: "保存创作工具的回归测试，验证初始化、截图、边界检查等行为。它检查的是工具，不代表课件已经通过验收。", example: "test_capture_runtime.py、test_outline_init.py、ppt_bounds.test.mjs。", path: "creator-skill / scripts / tests", icon: Folder },
];

export function SkillWorkflowPage() {
  const [selected, setSelected] = useState<string>('skill');
  const [expanded, setExpanded] = useState<string | null>('references');
  const entry = [...entries, ...childEntries].find(item => item.id === selected)!;
  const Icon = entry.icon;
  const row = (item: typeof entries[number], nested = false) => {
    const hasChildren = childEntries.some(child => child.parent === item.id);
    const Arrow = expanded === item.id ? ChevronDown : ChevronRight;
    return <button key={item.id} type="button" className={`acw-skill-browser-row ${selected === item.id ? 'is-selected' : ''}`} style={{ paddingLeft: nested ? 77 : 25 }} aria-pressed={selected === item.id} aria-expanded={hasChildren ? expanded === item.id : undefined} data-skill-item={item.id} onClick={() => { setSelected(item.id); if (hasChildren) setExpanded(expanded === item.id ? null : item.id); }}>
      {hasChildren ? <Arrow size={16} /> : <span className="acw-skill-tree-spacer" />}<item.icon size={23} /><Typography as="code" variant="bodySmall">{item.name}</Typography>
    </button>;
  };
  return <ContentBlock className="acw-skill-browser-page acw-skill-page" data-scene-id="6589da25-0890-4bc3-8359-dfccecbe8f9e" title="Skill：把创作方法变成可复用的工作流程" subtitle="左侧选择文件，右侧了解它怎样帮助 AI 工作" bodyClassName="acw-skill-browser-body">
    <div className="acw-skill-browser-editor">
      <div className="acw-skill-browser-toolbar"><Folder size={24} /><Typography variant="bodySmall">creator-skill / 创作方法与配套资源</Typography><Typography variant="bodySmall" tone="muted">点击左侧条目，查看用途</Typography></div>
      <div className="acw-skill-browser-workspace">
        <nav className="acw-skill-browser-sidebar" aria-label="Skill 结构">
          <Typography variant="bodySmall" tone="muted" className="acw-skill-browser-sidebar-label">Skill 目录</Typography>
          <div className="acw-skill-browser-folder"><ChevronDown size={18} /><Folder size={23} /><Typography as="code" variant="bodySmall">creator-skill/</Typography></div>
          {entries.map(item => <div key={item.id}>{row(item)}{expanded === item.id && childEntries.filter(child => child.parent === item.id).map(child => row(child, true))}</div>)}
        </nav>
        <section className="acw-skill-browser-preview" aria-label="Skill 文件用途" aria-live="polite">
          <div className="acw-skill-browser-preview-tab"><Icon size={23} /><Typography as="code" variant="bodySmall">{entry.name}</Typography><Typography variant="bodySmall" tone="muted">文件用途</Typography></div>
          <div className="acw-skill-browser-preview-content" key={selected}>
            <div className="acw-skill-browser-preview-heading"><Typography variant="h3">{entry.title}</Typography><Typography variant="bodySmall" tone="muted">{entry.path}</Typography></div>
            <Typography variant="subtitle" className="acw-skill-browser-description">{entry.description}</Typography>
            <Typography variant="bodySmall" tone="muted" className="acw-skill-example">{entry.example}</Typography>
            {selected === 'skill' && <div className="acw-skill-instruction"><Typography variant="bodySmall" tone="accent">开工时可以这样说</Typography><Typography variant="bodySmall">请先阅读 creator-skill/SKILL.md，按项目规范帮我制作课件。</Typography></div>}
          </div>
        </section>
      </div>
      <div className="acw-skill-browser-status"><Typography variant="bodySmall" tone="muted">以本项目为例 · 配套目录按需组织 · Skill 不能替代你的判断</Typography><Typography variant="bodySmall" tone="accent">交互式结构示意</Typography></div>
    </div>
  </ContentBlock>;
}

