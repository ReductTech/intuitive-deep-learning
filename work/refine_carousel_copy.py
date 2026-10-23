from pathlib import Path
import json
p=Path('modules/Creator-Guide/pages/SkillConstraintsPage.tsx');s=p.read_text(encoding='utf-8')
changes={
 "['知识主线 / 教学节奏','操作探索 / 即时反馈']":"['梳理知识主线，让概念按理解顺序展开','设计有意义的操作，让反馈帮助理解']",
 "['识别任务 / 选择能力','按需加载 / 节约 Token']":"['识别当前任务，选用合适的方法与工具','按需加载相关说明，减少无关信息干扰']",
 "['教学理念 / 交互 / 视觉','质量判断 / 改进建议']":"['检查内容、交互与画面，发现影响理解的问题','提出具体改进建议，支持后续修改与复查']",
 "['记录反馈 / 提炼规则','更新技能 / 下次复用']":"['记录明确反馈，沉淀可复用的创作偏好','在后续创作中按需采用，减少重复说明']",
 "['1600×900 / 统一版式','字体 / 配色 / 组件规范']":"['遵循固定画布，检查页面是否完整呈现','统一字体与配色，让多页课件保持一致']",
}
for a,b in changes.items():
 assert a in s,a
 s=s.replace(a,b)
s='\n'.join(line for line in s.splitlines() if 'className="cg-constraints-count"' not in line)+'\n'
s=s.replace('点击技能或左右切换 · 悬停按钮查看示例','点击技能切换 · 悬停按钮查看效果')
p.write_text(s,encoding='utf-8')
p=Path('modules/Creator-Guide/pages/SkillConstraintsPage.css');s=p.read_text(encoding='utf-8')
s=s.replace('left:310px;top:185px;width:980px;', 'left:550px;top:180px;width:760px;').replace('grid-template-columns:108px minmax(0,1fr) 100px;gap:22px;', 'grid-template-columns:108px minmax(0,1fr);gap:14px 22px;')
s='\n'.join(line for line in s.splitlines() if not line.startswith('.cg-constraints-count{'))+'\n'
s=s.replace('grid-column:1 / -1;display:flex;justify-content:center;gap:50px;color:#405b80;', 'grid-column:1 / -1;display:flex;flex-direction:column;align-items:flex-start;gap:6px;padding-left:30px;color:#405b80;')
s=s.replace('left:799px;top:362px;height:58px;', 'left:799px;top:389px;height:25px;')
p.write_text(s,encoding='utf-8')
p=Path('modules/Creator-Guide/outlines.json');s=p.read_text(encoding='utf-8');o=json.loads(s);page=next(p for p in o['pages'] if p['id']=='skill-constraints')
updates={
 'summary':page['summary']+'当前技能说明居中排列，去掉序号，以两条上下排列的具体作用说明替换斜线分隔的关键词。',
 'snippet':page['snippet'].replace('上方说明同步变化。','上方说明同步变化，以两条具体作用说明每项技能怎样帮助创作，不设置步骤序号。')
}
for key,value in updates.items():s=s.replace(json.dumps(key,ensure_ascii=False)+': '+json.dumps(page[key],ensure_ascii=False),json.dumps(key,ensure_ascii=False)+': '+json.dumps(value,ensure_ascii=False),1)
p.write_text(s,encoding='utf-8')
