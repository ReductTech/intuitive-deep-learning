from pathlib import Path
import json,shutil
p=Path('modules/Creator-Guide/outlines.json');s=p.read_text(encoding='utf-8');start=s.index('      "id": "creation-workflow"');end=s.index('\n    },',start);block=s[start:end];data=json.loads('{'+block+'}')
changes={
'goal':'通过连续模拟对话，体验从常规大纲到教学重构、设计图迭代、页面制作和人工核验的过程。',
'summary':'先生成常规定义导向大纲；用户提出五子棋切入后，切换为卷积核模块完整24页大纲。先展示第一页设计初稿，再根据反馈切换精修设计，确认后才呈现实际五子棋页面。',
'interaction':'点击发送或按Enter推进七轮预设对话。工作状态后逐字回复并更新画布；完整大纲可滚动查看与选页。设计图阶段不出现可交互棋盘；确认制作后可以真实落子、等待本地AI回应、切换难度、悔棋、重开和查看示例棋局。最后抽查第二页内容提要并补充跨页提示。支持重播与减少动态效果。',
'snippet':'本页是标注的模拟演示，工作状态为简短预设任务摘要。初始不显示大纲。第一版从定义和公式切入；用户建议五子棋引入后，显示从Convolution-Kernel-Intro复制到本模块的完整24页大纲快照，无原模块运行时依赖。设计初稿由imagegen实际生成，修改版采用用户提供的参考设计，图片均存于Creator-Guide资源目录。每次重播只展示已备好的图，不会现场调用图像或语言模型。用户确认设计后才装载本模块独立的AssemblyGomoku实作；与原课程无共享数据和存储。仅第一页具有完整交互，其他页面是内容提要，不能视为全课程已制作或核验。'}
for k,v in changes.items():block=block.replace(json.dumps(data[k],ensure_ascii=False),json.dumps(v,ensure_ascii=False))
p.write_text(s[:start]+block+s[end:],encoding='utf-8')
p=Path('modules/Creator-Guide/pages/CreationWorkflowPage.css');s=p.read_text(encoding='utf-8-sig');s='\n'.join(line for line in s.splitlines() if not any(tag in line for tag in ['.cg-sim-lesson ','.cg-sim-board','.cg-sim-early-hint','.cg-sim-content-lines']))+'\n';p.write_text(s,encoding='utf-8')
out=Path('C:/Users/Ocean/Documents/Codex/2026-10-23/c-users-ocean-documents-github-intuitive-4/outputs');out.mkdir(exist_ok=True)
shutil.copyfile('assets/444f8951-dd2e-42dc-94e5-c5a878618631/workflow/gomoku-design-draft.png',out/'gomoku-design-draft.png')
(out/'gomoku-design-notes.md').write_text('第一页设计初稿\n\n工具：内置 imagegen。修改版使用用户提供的设计参考图。\n\n初稿文件：gomoku-design-draft.png\n\n项目内资源：assets/444f8951-dd2e-42dc-94e5-c5a878618631/workflow/gomoku-design-draft.png\n\n生成提示词：\n\nCreate a 16:9 Chinese educational slide UI design mockup, an EARLY FIRST DRAFT before artistic refinement. This will be shown inside a simulated AI design workflow before a later beautiful bamboo garden version. Plain white background with faint blue tint, navy title at top left exactly 从五子棋开始认识卷积核. Under title a small subtitle exactly 先来下一局五子棋. A large flat beige 15 by 15 empty Go/Gomoku board centered, simple thin brown grid, NO stones. A utilitarian rectangular right sidebar, heading 对局面板, black stone circle and text 轮到你, small three difficulty chips 简单 中等 困难, simple buttons 悔一步 重新开始 示例棋局. Design competent but deliberately generic and basic, too much empty space, modest visual hierarchy, ordinary flat rectangles, no beautiful garden background, no bamboo, no decorative photos, no perspective. Faithful UI prototype rather than illustration, crisp readable Chinese labels. This is one full slide without outer editor chrome. No draft watermark.\n',encoding='utf-8')
