import { moduleIdentity } from './outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
/** Current-course media only; URLs are resolved by the host bundler. */
const urls: Record<string,string> = {
  "01_翻译引入/翻译任务.webp": moduleAssetUrl("01_翻译引入/翻译任务.webp"),
  "01_翻译引入/原文输入.webp": moduleAssetUrl("01_翻译引入/原文输入.webp"),
  "01_翻译引入/译文生成.webp": moduleAssetUrl("01_翻译引入/译文生成.webp"),
  "02_分词与嵌入/分词.webp": moduleAssetUrl("02_分词与嵌入/分词.webp"),
  "02_分词与嵌入/词嵌入.webp": moduleAssetUrl("02_分词与嵌入/词嵌入.webp"),
  "03_自注意力/Q_信息需求.webp": moduleAssetUrl("03_自注意力/Q_信息需求.webp"),
  "04_多头注意力/不同关注方式.webp": moduleAssetUrl("04_多头注意力/不同关注方式.webp"),
  "04_多头注意力/八头专家.webp": moduleAssetUrl("04_多头注意力/八头专家.webp"),
  "05_前馈网络/注意力到逐位加工.webp": moduleAssetUrl("05_前馈网络/注意力到逐位加工.webp"),
  "06_残差连接/机器人双任务.webp": moduleAssetUrl("06_残差连接/机器人双任务.webp"),
  "06_残差连接/梯度阶梯与电梯.webp": moduleAssetUrl("06_残差连接/梯度阶梯与电梯.webp"),
  "07_架构拼装/多头注意力.svg": moduleAssetUrl("07_架构拼装/多头注意力.svg"),
  "07_架构拼装/前馈网络.svg": moduleAssetUrl("07_架构拼装/前馈网络.svg"),
  "07_架构拼装/残差与规范化.svg": moduleAssetUrl("07_架构拼装/残差与规范化.svg"),
};
export function transformerAsset(name:string):string { const url=urls[name]; if(!url) throw new Error("Unknown Transformer resource: "+name); return url; }
