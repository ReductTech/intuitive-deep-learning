from pathlib import Path
p=Path('modules/Creator-Guide/outlines.json');s=p.read_text(encoding='utf-8').replace('点击发送或按Enter推进七轮预设对话。','点击发送或按Enter推进八轮预设对话。').replace('核验反馈会修改第二页的实际说明。支持重播与减少动态效果。','核验反馈会修改第二页的实际说明。智能体随后建议从头到尾完整检查，用户回复没有问题了之后才显示课件制作完成。支持重播与减少动态效果。');p.write_text(s,encoding='utf-8')
