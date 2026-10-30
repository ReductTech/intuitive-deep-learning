from pathlib import Path
import json
p=Path('modules/Creator-Guide/pages/SkillConstraintsPage.tsx');s=p.read_text(encoding='utf-8');s=s.replace("const groups = [", "const cardDescriptions = ['教学与交互设计', '按需调用组件与工具', '多维评估与持续改进', '沉淀反馈与创作偏好', '统一版式与视觉规范'];\nconst groups = [").replace('{g.english}</Typography>', '{cardDescriptions[index]}</Typography>');p.write_text(s,encoding='utf-8')
p=Path('modules/Creator-Guide/outlines.json');s=p.read_text(encoding='utf-8');o=json.loads(s);page=next(p for p in o['pages'] if p['id']=='skill-constraints')
updates={
 'goal':'理解五类技能是默认协同的平台基础能力，创作者可通过转盘查看分工与示例，无需学习或编辑底层规则。',
 'summary':'移除Markdown源码面板和纵向五行布局，改为底部三维技能转盘。保留设计、路由、评估、自进化、格式五个技能及原有示例；选中技能前移并高亮，上方同步展示说明和两项作用。',
 'interaction':'点击技能块或左右箭头旋转切换；转盘内支持左右方向键及Home/End。五个示例按钮保留悬停与键盘聚焦展示，支持点击打开、移入浮层继续操作、关闭按钮及Escape关闭。设计与格式保留对比维度切换，其余保留原有过程示例。编辑入口需要进入演示模式体验控件。',
 'snippet':'五类技能是平台默认协同的基础能力。创作者不需要阅读底层Markdown，也不需要逐项配置这些技能。通过转盘可以查看设计、路由、评估、自进化和格式技能的分工；选中一项后，它会移到前方，上方说明同步变化。悬停效果按钮可以查看原有对比与演示。设计关注知识主线和交互，路由按任务加载适用方法，评估发现问题并提出改进，自进化示例说明反馈和偏好如何沉淀，格式规范支撑画布与视觉一致性。路由Token数字仍是模拟示意，不是实测节省；自进化示例是概念流程，不代表自动改写系统规则。创作者把精力放在知识内容和教学设计上，具体成品仍需核验。'
}
for key,value in updates.items():s=s.replace(json.dumps(key,ensure_ascii=False)+': '+json.dumps(page[key],ensure_ascii=False),json.dumps(key,ensure_ascii=False)+': '+json.dumps(value,ensure_ascii=False),1)
p.write_text(s,encoding='utf-8')
