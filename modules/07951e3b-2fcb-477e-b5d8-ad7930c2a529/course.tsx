import type { SceneDefinition } from "@shuku/course-style/react/presentation";
import { InputBridgePage } from './pages/InputBridgePage';
import { LongRangePage } from './pages/LongRangePage';
import { Page } from './components/LessonVisuals';
import { vitLessons } from './pages/VitPages';
import { clipLessons } from './pages/ClipPages';
import { vlmLessons } from './pages/VlmPages';

const definitions = [
  ['6667ad69-dc30-493d-b86f-43568472a013','只看这一小块，CNN 和 ViT 怎么找上下文？',vitLessons.context],
  ['aabfaa7c-ec78-4a2e-94f3-bece57cb6c96','哪把伞属于哪位女孩？',vitLessons.relations],
  ['653fbaea-7f34-431b-8de8-c2ed21014eb5','为什么切块？块越小会怎样？',vitLessons['patch-size']],
  ['3c488c93-fd79-452d-89ba-a1801e690521','二维图片怎样变成 Patch 序列？',vitLessons.patchify],
  ['d9114d77-698f-4a7b-a2e9-db7a53be140d','每个 Patch 怎样变成 D 维 Token？',vitLessons.embedding],
  ['3c6356f6-9e21-452d-bb50-7be674c98a76','为什么 Patch Token 还要加位置向量？',vitLessons.position],
  ['4a892c61-93fd-4eca-b7b3-3b6f16999ee6','Attention 怎样把其他 Token 的信息汇入？',vitLessons['attention-cls']],
  ['0ad1cbe8-6a0c-4450-b50b-15f367e9eb77','从像素到分类结果，ViT 走了什么？',vitLessons['vit-pipeline']],
  ['914e3ddf-c0c1-425b-9592-b815969c5322','图里是龙猫，类别表里没有怎么办？',clipLessons['fixed-classes']],
  ['1af45311-c041-40a1-8b04-c5370412e40a','不再预测固定类别，改为学习图文关系',clipLessons['dual-encoder']],
  ['128e1b0f-b6f2-47e0-9b4c-656a6a1b9786','一次训练怎样提高正确图文对的相似度？',clipLessons['contrastive-loss']],
  ['3ba4ea81-4d93-485d-9957-136264c0e05c','生成与匹配：两种不同的训练目标',clipLessons['batch-negatives']],
  ['325ea54f-6f5d-4092-9a3d-5f5ebe728027','从配对 Caption 到开放文本匹配',clipLessons['dynamic-classifier']],
  ['16d0b996-e161-4b38-9897-3def318174a4','Zero-shot：用刚才的候选向量完成匹配',clipLessons['zero-shot']],
  ['fa1afb64-edbe-41dd-bc7b-1f29be9ba2f5','换一句 Prompt，就是换一个文本向量',clipLessons['prompt-ensemble']],
  ['15671eac-f162-4d7b-8559-30e8cc12df53','CLIP 比较候选，开放回答还需要什么？',vlmLessons['clip-to-vlm']],
  ['d8e4ceaf-d433-4c74-b349-a4554bcf45d6','视觉特征怎样接进语言模型？',vlmLessons['vlm-dataflow']],
  ['8b389d8c-f325-4925-8eed-69b0f865eb82','VLM 把视觉输入用于多种语言任务',vlmLessons['vlm-tasks']],
  ['c385d011-a7c0-4ac9-b878-4d5c87940c49','第一步：保留 ViT 的多个视觉 Token',vlmLessons['visual-features']],
  ['2bb8cbeb-9236-41ae-80c6-f51890144ee9','第二步：映射到 LLM 的输入维度',vlmLessons.connector],
  ['e098deb5-5d12-4d2e-a94f-2997168fd20f','视觉信息还有哪些接入方式？',vlmLessons['connector-comparison']],
  ['934dba48-a821-4eca-90f7-94b6151d1284','第三步：视觉 Token 拼进同一段上下文',vlmLessons.context],
  ['eeb2c5f3-d519-401f-b94b-bda300d1294b','训练分两步：对齐与视觉指令微调',vlmLessons.training],
  ['9a278d0a-a9ee-466d-82ac-6f4c91a67cee','接入视觉信息后，回答就一定对吗？',vlmLessons['visual-evidence']],
  ['f41b3fe4-a92f-419b-a7bf-c5c5ea2e5707','同一张图，表示、匹配与回答有什么区别？',vlmLessons.recap],
] as const;

// Guide and SceneDeck render the same 27 implemented scenes.
export const visionLanguageCourse: SceneDefinition[] = [{
  id: 'e4bead0a-ce99-400e-9400-a169e79c8ac5', title: '图片是 H×W×C，Transformer 要的是 Token 序列', section: 'ViT · 输入接口',
  render: (context) => <InputBridgePage context={context} />,
}, {
  id: 'eaaa73a9-547b-476f-a9fa-aa698dd520d5', title: '女孩和龙猫相隔很远，信息要走几步？', section: 'ViT · 远距离联系',
  render: (context) => <LongRangePage context={context} />,
}, ...definitions.map(([id,title,definition], index) => ({
  id, title, section: index < 8 ? 'ViT' : index < 15 ? 'CLIP' : 'VLM',
  render: (context: import("@shuku/course-style/react/presentation").LessonContext) => { const Body = definition.Body; return <Page number={index + 3} title={title} mission={'mission' in definition ? definition.mission : undefined} takeaway={definition.takeaway} note={'note' in definition ? definition.note : undefined} resettable={'resettable' in definition && definition.resettable === true} context={context}><Body /></Page>; },
}))];



