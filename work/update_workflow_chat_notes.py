from pathlib import Path
import json
p=Path('modules/Creator-Guide/outlines.json')
s=p.read_text(encoding='utf-8');start=s.index('      "id": "creation-workflow"');end=s.index('\n    },',start);block=s[start:end];data=json.loads('{'+block+'}')
changes={
'goal':'通过术库中的连续模拟对话，体验需求、大纲、页面制作与核验如何逐步推进。',
'summary':'初始仅显示空白工作区；发送需求后，智能体依次展示工作状态和逐字回复，大纲完成后才显示课程目录。用户消息居右、智能体回复居左，历史对话可以滚动回看。',
'interaction':'点击发送或按Enter推进九轮预设对话，等待工作状态与流式回复完成。大纲生成前不显示目录；后续反馈会调整大纲顺序、移除提前揭示方法的提示、补充跨页说明。完成的工作步骤可折叠查看；支持左侧选页、棋盘落子、悔一步、重新开始以及重播整个演示。',
'snippet':'本页是明确标注的模拟演示，未连接真实智能体。工作状态是预设的简短任务摘要，不是真实模型的内部推理。初始不显示大纲与页面内容；第一轮回复结束后才出现大纲。用户消息靠右，智能体消息靠左，保留整段对话记录。生成过程按整理需求、规划结构和生成结果等状态依次展示，随后逐字输出回复。反馈可以改变上方预览。其他页面仅展示提要，不能表示全课程已制作或核验。棋盘是独立落子示意，不包含AI对手与胜负判定。'}
for k,v in changes.items():block=block.replace(json.dumps(data[k],ensure_ascii=False),json.dumps(v,ensure_ascii=False))
p.write_text(s[:start]+block+s[end:],encoding='utf-8')
