import { moduleIdentity } from './outlines.json';
import { moduleAssetUrl } from '../shared/react/assets';
/** Current-course media only; URLs are resolved by the host bundler. */
const urls: Record<string,string> = {
  "01_翻译引入/翻译任务.png": moduleAssetUrl(moduleIdentity.id, "01_翻译引入/翻译任务.png"),
  "01_翻译引入/原文输入.png": moduleAssetUrl(moduleIdentity.id, "01_翻译引入/原文输入.png"),
  "01_翻译引入/译文生成.png": moduleAssetUrl(moduleIdentity.id, "01_翻译引入/译文生成.png"),
  "02_分词与嵌入/分词.png": moduleAssetUrl(moduleIdentity.id, "02_分词与嵌入/分词.png"),
  "02_分词与嵌入/词嵌入.png": moduleAssetUrl(moduleIdentity.id, "02_分词与嵌入/词嵌入.png"),
  "03_自注意力/Q_信息需求.png": moduleAssetUrl(moduleIdentity.id, "03_自注意力/Q_信息需求.png"),
  "04_多头注意力/不同关注方式.png": moduleAssetUrl(moduleIdentity.id, "04_多头注意力/不同关注方式.png"),
  "04_多头注意力/八头专家.png": moduleAssetUrl(moduleIdentity.id, "04_多头注意力/八头专家.png"),
  "05_前馈网络/注意力到逐位加工.png": moduleAssetUrl(moduleIdentity.id, "05_前馈网络/注意力到逐位加工.png"),
  "06_残差连接/机器人双任务.png": moduleAssetUrl(moduleIdentity.id, "06_残差连接/机器人双任务.png"),
  "06_残差连接/梯度阶梯与电梯.png": moduleAssetUrl(moduleIdentity.id, "06_残差连接/梯度阶梯与电梯.png"),
  "07_架构拼装/多头注意力.svg": moduleAssetUrl(moduleIdentity.id, "07_架构拼装/多头注意力.svg"),
  "07_架构拼装/前馈网络.svg": moduleAssetUrl(moduleIdentity.id, "07_架构拼装/前馈网络.svg"),
  "07_架构拼装/残差与规范化.svg": moduleAssetUrl(moduleIdentity.id, "07_架构拼装/残差与规范化.svg"),
};
export function transformerAsset(name:string):string { const url=urls[name]; if(!url) throw new Error("Unknown Transformer resource: "+name); return url; }
