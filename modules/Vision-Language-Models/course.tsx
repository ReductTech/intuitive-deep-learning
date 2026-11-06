import type { SceneDefinition } from '../shared/react/presentation';
import { InputBridgePage } from './pages/InputBridgePage';
import { LongRangePage } from './pages/LongRangePage';
import { Page } from './components/LessonVisuals';
import { vitLessons } from './pages/VitPages';
import { clipLessons } from './pages/ClipPages';
import { vlmLessons } from './pages/VlmPages';

const definitions = [
  ['context','只看这一小块，CNN 和 ViT 怎么找上下文？',vitLessons.context],
  ['relations','哪把伞属于哪位女孩？',vitLessons.relations],
  ['patch-size','为什么切块？块越小会怎样？',vitLessons['patch-size']],
  ['patchify','二维图片怎样变成 Patch 序列？',vitLessons.patchify],
  ['embedding','每个 Patch 怎样变成 D 维 Token？',vitLessons.embedding],
  ['position','为什么 Patch Token 还要加位置向量？',vitLessons.position],
  ['attention-cls','Attention 怎样把其他 Token 的信息汇入？',vitLessons['attention-cls']],
  ['vit-pipeline','从像素到分类结果，ViT 走了什么？',vitLessons['vit-pipeline']],
  ['fixed-classes','图里是龙猫，类别表里没有怎么办？',clipLessons['fixed-classes']],
  ['dual-encoder','不再预测固定类别，改为学习图文关系',clipLessons['dual-encoder']],
  ['contrastive-loss','一次训练怎样提高正确图文对的相似度？',clipLessons['contrastive-loss']],
  ['batch-negatives','生成与匹配：两种不同的训练目标',clipLessons['batch-negatives']],
  ['dynamic-classifier','从配对 Caption 到开放文本匹配',clipLessons['dynamic-classifier']],
  ['zero-shot','Zero-shot：用刚才的候选向量完成匹配',clipLessons['zero-shot']],
  ['prompt-ensemble','换一句 Prompt，就是换一个文本向量',clipLessons['prompt-ensemble']],
  ['clip-to-vlm','CLIP 比较候选，开放回答还需要什么？',vlmLessons['clip-to-vlm']],
  ['vlm-dataflow','视觉特征怎样接进语言模型？',vlmLessons['vlm-dataflow']],
  ['vlm-tasks','VLM 把视觉输入用于多种语言任务',vlmLessons['vlm-tasks']],
  ['visual-features','第一步：保留 ViT 的多个视觉 Token',vlmLessons['visual-features']],
  ['connector','第二步：映射到 LLM 的输入维度',vlmLessons.connector],
  ['connector-comparison','视觉信息还有哪些接入方式？',vlmLessons['connector-comparison']],
  ['multimodal-context','第三步：视觉 Token 拼进同一段上下文',vlmLessons.context],
  ['training','训练分两步：对齐与视觉指令微调',vlmLessons.training],
  ['visual-evidence','接入视觉信息后，回答就一定对吗？',vlmLessons['visual-evidence']],
  ['recap','同一张图，表示、匹配与回答有什么区别？',vlmLessons.recap],
] as const;

// Guide and SceneDeck render the same 27 implemented scenes.
export const visionLanguageCourse: SceneDefinition[] = [{
  id: 'input-bridge', title: '图片是 H×W×C，Transformer 要的是 Token 序列', section: 'ViT · 输入接口',
  render: (context) => <InputBridgePage context={context} />,
}, {
  id: 'long-range', title: '女孩和龙猫相隔很远，信息要走几步？', section: 'ViT · 远距离联系',
  render: (context) => <LongRangePage context={context} />,
}, ...definitions.map(([id,title,definition], index) => ({
  id, title, section: index < 8 ? 'ViT' : index < 15 ? 'CLIP' : 'VLM',
  render: (context: import('../shared/react/presentation').LessonContext) => { const Body = definition.Body; return <Page number={index + 3} title={title} mission={'mission' in definition ? definition.mission : undefined} takeaway={definition.takeaway} note={'note' in definition ? definition.note : undefined} resettable={'resettable' in definition && definition.resettable === true} context={context}><Body /></Page>; },
}))];



