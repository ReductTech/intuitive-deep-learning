from pathlib import Path
import json
p=Path('modules/Creator-Guide/outlines.json');s=p.read_text(encoding='utf-8');start=s.index('      "id": "creation-workflow"');end=s.index('\n    },',start);block=s[start:end];data=json.loads('{'+block+'}')
changes={
'interaction':'点击发送或按Enter推进七轮预设对话。工作状态后逐字回复并更新画布；完整大纲可滚动查看与选页。设计确认前展示设计图与课程参考缩略图；进入制作阶段后，左侧24页目录切换为真实课程页面。支持本地AI对弈、悔棋、重开、数字与棋盘联动、模板编辑、步长及三维场景等原生交互。核验反馈会修改第二页的实际说明。支持重播与减少动态效果。',
'snippet':'本页是标注的模拟创作演示，工作状态和回复为预设脚本。智能体主动安排大纲、整套设计预览、确认后制作与核验。第一版大纲由定义切入，用户提出五子棋引入后显示完整24页大纲；第一页设计初稿由imagegen实际生成，修改版来自用户提供的设计参考。设计确认前仍展示图片，制作后实际渲染完整24页课程副本。课程代码、引擎、上下文和约60MB资源均复制在Creator-Guide内，只依赖Shared和项目公共库，不引用原卷积核模块或其资源目录。副本样式采用独立前缀，棋局和模板仅在本次预览的内存上下文中共享，重播清空，不读写原课程存储。自学预览也使用这份副本。第二页核验反馈会更新实际说明，不能把脚本流程结束视为全课程已人工核验。'}
for k,v in changes.items():block=block.replace(json.dumps(data[k],ensure_ascii=False),json.dumps(v,ensure_ascii=False))
p.write_text(s[:start]+block+s[end:],encoding='utf-8')
p=Path('modules/Creator-Guide/components/workflow/simulation.ts');s=p.read_text(encoding='utf-8').replace('先对照第二页：','先查看第二页的实际页面：');p.write_text(s,encoding='utf-8')
