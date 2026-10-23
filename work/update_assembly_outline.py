from pathlib import Path
import json
p=Path('modules/Creator-Guide/components/assembly/AssemblyGomoku.tsx');s=p.read_text(encoding='utf-8');s=s.replace('    <ContentBlock className="cg-built-gomoku"', '    <ContentBlock data-move-count={game.history.length} data-turn={game.turn} className="cg-built-gomoku"');s=s.replace('  const demoRef = useRef(false);\n','').replace('    demoRef.current = false;\n','').replace('    demoRef.current = true;\n','');p.write_text(s,encoding='utf-8')
p=Path('modules/Creator-Guide/outlines.json');s=p.read_text(encoding='utf-8');o=json.loads(s);page=next(p for p in o['pages'] if p['id']=='ui-kit');updates={
 'goal':'通过基础组件动态组装成完整五子棋课件的过程，理解通用能力与课程专属内容如何配合。',
 'summary':'同一页包含组件展示、动态组装和独立五子棋成品三个状态。初始保留原工程脚手架界面；点击按钮后文字配色、页面结构和选择控件移动到成品位置，再加入背景、棋盘与本地对弈逻辑。最终可以真实下棋，支持返回重播。不新增页面。',
 'interaction':'基础控件仍可操作；点击组装一个教学页面播放约3.7秒动画，可跳过。完成后独立五子棋支持落子与AI应手、三种难度、简单档提示、悔棋、重新开始、示例棋局和棋盘键盘操作。返回组件可重播；减少动态效果时使用短暂淡入。普通编辑入口需进入演示模式体验。',
 'next':'引出同一份交互课件的展示、自学与讲稿等形态。',
 'snippet':'这一页先展示已有的颜色、控件、页面结构和计算服务。点击组装按钮，部分基础能力移向新页面：文字与配色组织标题，页面结构承载棋盘，选择控件用于难度设置。新的背景素材、棋盘绘制与对弈逻辑随后加入，形成完整五子棋课件。这里不是所有元素都直接复用，而是通用能力与课程专属内容共同构成作品。动画是预设的组合演示，不会现场生成代码；最终页面是真实可操作的独立副本。页面实现、棋局引擎与背景视频均归Creator-Guide管理，不导入原卷积课程的专属实现或资源，也不写入其棋局存储。AI应手采用本地棋局算法，本页不调用后端模型或大模型服务。组装前后始终处于同一个ui-kit场景，返回按钮可以重新观看。'
}
for key,value in updates.items():s=s.replace(json.dumps(key,ensure_ascii=False)+': '+json.dumps(page[key],ensure_ascii=False),json.dumps(key,ensure_ascii=False)+': '+json.dumps(value,ensure_ascii=False),1)
p.write_text(s,encoding='utf-8')
