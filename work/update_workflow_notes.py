from pathlib import Path
import json
p=Path('modules/Creator-Guide/pages/CreationWorkflowPage.tsx')
s=p.read_text(encoding='utf-8').replace('simulationPages, simulationStages','simulationOutline, simulationStages')
s=s.replace('simulationPages.map((item,i)', 'simulationOutline(stage === 0 ? session.turn : 2).map((item,i)')
s=s.replace("page === i ? 'page' : undefined", "page === item.index ? 'page' : undefined").replace('active={page === i} onClick={() => setPage(i)}','active={page === item.index} onClick={() => setPage(item.index)}')
s=s.replace('<TextInput aria-label="预设教学要求"','<Typography as="div" variant="bodySmall" tone="inherit"><TextInput aria-label="预设教学要求"').replace("send();} }}/><Button variant=\"primary\"", "send();} }}/></Typography><Button variant=\"primary\"")
p.write_text(s,encoding='utf-8')
p=Path('modules/Creator-Guide/outlines.json')
s=p.read_text(encoding='utf-8')
start=s.index('      "id": "creation-workflow"')
end=s.index('\n    },',start)
block=s[start:end]
changes={
'goal':'通过SceneDeck界面中的预设对话，体验设计大纲、逐页制作和人工核验中的反馈与调整。',
'summary':'保留SceneDeck工具栏与左侧课程导航，中央预览，下方紧凑的智能体对话框。以五子棋到卷积核的六页课程模拟创作流程。',
'interaction':'点击发送或按Enter推进预设对话；反馈后同步调整大纲顺序、移除提前揭示方法的提示、补充跨页衔接。点击左侧切换页面，三个阶段可独立体验和重播。第一页棋盘支持点击、方向键加回车落子、悔一步与重新开始。',
'snippet':'本页是本地预设对话模拟，未接入真实智能体，也不生成或保存课程文件。简化界面不使用设计图或图片素材。大纲反馈会将窗口观察移到局部计算之前；逐页制作反馈会移除第一页提前揭示局部窗口的提示；人工核验示例会给第二页补充数字与上一页棋盘位置的对应说明。其余页面只展示内容提要，不表示整套课件已制作或核验。棋盘是独立的落子示意，不包含AI对手与胜负判定。'}
data=json.loads('{'+block+'}')
for key,value in changes.items():
    block=block.replace(json.dumps(data[key],ensure_ascii=False),json.dumps(value,ensure_ascii=False))
s=s[:start]+block+s[end:]
p.write_text(s,encoding='utf-8')
