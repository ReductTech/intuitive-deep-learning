from pathlib import Path
import json
p=Path('modules/Creator-Guide/outlines.json');s=p.read_text(encoding='utf-8');a=s.index('      "id": "progressive-disclosure"');b=s.index('\n    },',a);block=s[a:b];d=json.loads('{'+block+'}')
updates={
'goal':'通过同一单通道卷积实验台的两种呈现方式，理解如何把次要设置收起，让学习者先聚焦当前问题。',
'summary':'左侧同时展示卷积核、步长、补零、输入图案和响应显示；右侧先聚焦边缘检测，仅显示卷积核与移动窗口，其他选项默认收在更多设置中。',
'interaction':'选择竖直边缘、水平边缘或均值平滑核；移动窗口或点击输出位置联动查看输入局部和响应。步长1/2、补零0/1改变输出尺寸；输入图案可切换竖直分界、水平分界与转角；响应可保留正负或只看强度。右侧点击更多设置展开或收起其余四项，设置在收起后保留。',
'snippet':'两侧使用相同的实际固定权重互相关计算，即深度学习卷积层常用的运算形式，不是模拟训练。输入为7×7二值灰度图案，核固定为3×3；竖直核为三行[-1,0,1]，水平核为[-1,-1,-1;0,0,0;1,1,1]，均值核各权重为1/9。输出边长为floor((7+2P-3)/S)+1。补零按0处理；颜色用固定范围显示正负响应，切换只看强度后显示绝对值。两侧具备相同五项设置并独立操作，右侧默认只展示卷积核，其他四项收在更多设置中，收起不会清空。输出格子可点击定位输入窗口。这里不引入通道数或卷积核数量，让设置始终围绕单通道边缘检测场景。核心是安排功能出现的时机，先帮助学习者回答当前问题。'}
for k,v in updates.items():block=block.replace(json.dumps(d[k],ensure_ascii=False),json.dumps(v,ensure_ascii=False))
p.write_text(s[:a]+block+s[b:],encoding='utf-8')
p=Path('modules/Creator-Guide/pages/ProgressiveDisclosurePage.tsx');s=p.read_text(encoding='utf-8').replace('<i/><Typography as="span" variant="bodySmall" tone="muted">{settings.response', '<i style={settings.response === \'absolute\' ? {background:\'#edf2f8\'} : undefined}/><Typography as="span" variant="bodySmall" tone="muted">{settings.response');p.write_text(s,encoding='utf-8')
