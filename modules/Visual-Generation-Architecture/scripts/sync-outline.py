"""Import the approved local Markdown outline without changing stable module identity."""
from pathlib import Path
import json
import re
import shutil

module = Path(__file__).resolve().parents[1]
root = module.parents[1]
source = root.parent / '\u89c6\u89c9\u751f\u6210\u7f51\u7edc\u7ed3\u6784\u5927\u7eb2.md'
text = source.read_text(encoding='utf-8')
metadata = json.loads((module / 'outlines.json').read_text(encoding='utf-8'))
rows = re.findall(r'^\| P(\d+) \| ([a-z-]+) \|', text, re.M)
blocks = re.split(r'^## P\d+\uff5c', text, flags=re.M)[1:]

def field(block, name):
    match = re.search(r'\*\*' + name + r'\*\*\uff1a(.*?)(?=\n\n\*\*|\Z)', block, re.S)
    return match.group(1).strip() if match else ''

pages = []
for (number, page_id), block in zip(rows, blocks):
    number = int(number)
    pages.append({
        'id': page_id,
        'title': block.splitlines()[0].strip(),
        'goal': field(block, '\u6559\u5b66\u76ee\u6807'),
        'summary': field(block, '\u5185\u5bb9\u4e0e\u8bc1\u636e'),
        'snippet': field(block, '\u8bb2\u8ff0\u8981\u70b9') or field(block, '\u7406\u89e3\u68c0\u67e5\u4e0e\u8bb2\u8ff0\u8981\u70b9'),
        'next': field(block, '\u524d\u540e\u8854\u63a5') or field(block, '\u7406\u89e3\u68c0\u67e5\u4e0e\u8854\u63a5'),
        'section': 'U-Net' if number <= 5 else 'Latent Diffusion' if number <= 9 else 'DiT' if number <= 13 else '\u77e5\u8bc6\u5730\u56fe',
        'implementationStatus': 'implemented',
    })
assert len(pages) == 14
interactions = [
    '进入页面后自动呈现噪声到图像的过程，完成后停留；可放大一次预测的输入输出。',
    '沿 U-Net 逐块走读，点击网络块定位阶段；切断与重接 Skip，追踪消失的信息路径。',
    '拖动时间步，同步观察噪声状态、四维正弦余弦编码和多个网络块收到的条件。',
    '点击或拖动移动 Query，方向键逐格定位；文本关联权重随位置插值变化，支持猫脸、书页与背景快捷定位。',
    '进入页面后自动接通视觉、时间与文本路径；可断开和重接条件，诊断缺失的信息。',
    '切换分辨率与总采样步数 N，复算重复位置数；拖动已完成步数 k，像素与 latent 参考纹理按 k / N 联动展示去噪示意。改变 N 时保留 k 并限制在合法范围；示意不代表真实模型中间张量。',
    '沿参考图 13 的完整横向链切换两条路线：原图→Encoder→latent→Decoder→重建；随机噪声→扩散采样→生成 latent→同一 Decoder→新图。切换后自动呈现并停留，生成起点与模块真实替换。',
    '在参考图 17 的完整训练链上更新一维噪声预测参数，观察可复算的平方误差下降与损失轨迹。',
    '进入页面后自动演示四次预测与更新，最后解码并停留在结果；后台不推进。',
    '在参考图 22 的原始位置选择、拖动 patch 并送入投影；明确使用 32×32 局部尺寸示例，patch 为 2 或 4 时分别得到 256 或 64 个 tokens。',
    '在 U-Net 与 DiT 主干之间切换；逐步展开 patch、Transformer 交互及空间重排。',
    '拖动时间，计算示例 gamma、beta 与四维 AdaLN 输出；对照仅归一化与条件调制。',
    '切换 Cross/Joint Attention，查看 4×3 与 7×7 关系矩阵，点击 Query 行定位允许的信息交互。',
    '点击像素/latent 与 U-Net/Transformer 的四种组合，查看各组合的状态表示、预测主干与解码分工；以架构对照收尾，不设置判断题。',
]
for page, interaction in zip(pages, interactions):
    page['interaction'] = interaction
    page['snippet'] = '沿“生成一只正在学习的小猫”的委托展开。本页操作：' + interaction + '\n\n' + page['snippet']
opening = next((page for page in metadata['pages'] if page['id'] == 'architecture-opening'), None)
if opening:
    pages.insert(0, opening)

metadata.update({
    'title': '\u89c6\u89c9\u751f\u6210\u7f51\u7edc\u7ed3\u6784',
    'description': '\u4ece U-Net\u3001Latent Diffusion \u5230 DiT\uff1a\u62c6\u5f00\u4e00\u6b21\u9884\u6d4b\uff0c\u770b\u61c2\u73b0\u4ee3\u751f\u6210\u7f51\u7edc\u3002',
    'badge': '\u7f51\u7edc\u7ed3\u6784', 'moduleType': 'teaching', 'difficulty': 'intermediate', 'audience': 'undergraduate',
    'entry': 'ArchitectureGuide.tsx', 'ppt': {'entry': 'ArchitecturePpt.tsx', 'path': '/scenedeck/', 'player': False},
    'pages': pages,
})
(module / 'outlines.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
assets = module / 'assets/references'
assets.mkdir(parents=True, exist_ok=True)
reference_dir = next(root.parent.glob('*/01.png')).parent
for reference in reference_dir.glob('*.png'):
    shutil.copy2(reference, assets / reference.name)
print(metadata['moduleIdentity']['id'])
