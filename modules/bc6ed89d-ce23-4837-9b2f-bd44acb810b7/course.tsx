import type { SceneDefinition } from "@shuku/course-style/react/presentation";
import { CourseCoverPage } from './pages/CourseCoverPage';
import outline from './outlines.json';
import { PrefillPage } from './pages/PrefillPage';
import { AttentionCyclePage } from './pages/AttentionCyclePage';
import { NumericKvRepeatPage } from './pages/NumericKvRepeatPage';
import { RepeatedWorkPage } from './pages/RepeatedWorkPage';
import { AbstractProcessPage } from './pages/AbstractProcessPage';
import { CacheLoopPage } from './pages/CacheLoopPage';
import { MemoryBoundaryPage } from './pages/MemoryBoundaryPage';
import { AttentionMemoryBridgePage } from './pages/AttentionMemoryBridgePage';
import { AttentionMatrixGrowthPage } from './pages/AttentionMatrixGrowthPage';
import { AttentionIOMovementPage } from './pages/AttentionIOMovementPage';
import { TiledScorePage } from './pages/TiledScorePage';
import { FlashNormalizePage } from './pages/FlashNormalizePage';
import { FlashOutputPage } from './pages/FlashOutputPage';
import { FlashAdvantagesPage } from './pages/FlashAdvantagesPage';
import { MultiHeadIntroPage } from './pages/MultiHeadIntroPage';
import { AttentionSharingPage } from './pages/AttentionSharingPage';
import { LowRankCompressionPage } from './pages/LowRankCompressionPage';
import { LatentKVPage } from './pages/LatentKVPage';
import { MatrixExpansionPage } from './pages/MatrixExpansionPage';
import { RopePlacementPage } from './pages/RopePlacementPage';
import { DecoupledRopePage, RopeIntroductionPage } from './pages/DecoupledRopePage';
import { MLASummaryPage } from './pages/MLASummaryPage';

const registeredScenes: SceneDefinition[] = [
    { id: '2fea66a2-f5ab-439b-bcad-012c73c56b1a', title: outline.title, section: '课程导入', render: () => <CourseCoverPage /> },
    {
      id: '48574d12-82e1-4da5-917e-80e607ab2029',
      title: '四个 token，怎样变成 Q、K、V？',
      section: 'KV Cache',
      render: () => <PrefillPage />,
    },
    {
      id: '4ee713fc-e7f3-46de-bdf0-03455ec56ef1',
      title: 'Q、K、V 怎样完成一次计算？',
      section: 'KV Cache',
      render: () => <AttentionCyclePage />,
    },
    {
      id: '81a69403-cdb8-4b7a-b35e-3e3fe1a0a0ba',
      title: '新增一个 token，旧 K、V 会变吗？',
      section: 'KV Cache',
      render: () => <NumericKvRepeatPage />,
    },
    {
      id: 'cb26b071-ed4f-4e95-ad58-189cca617490',
      title: '只预测下一个字，还需要所有 Q 行吗？',
      section: 'KV Cache',
      render: () => <AbstractProcessPage />,
    },
    {
      id: '608b7cca-443e-4abc-a36f-cabebee7946f',
      title: '只看 Q、K、V：预测下一个字要用哪些行？',
      section: 'KV Cache',
      render: () => <RepeatedWorkPage />,
    },
    { id: '1e3df927-6608-4a24-901d-7ed3a96388f6', title: '把 K、V 存起来，不再重复计算', section: 'KV Cache', render: () => <CacheLoopPage /> },
    { id: '7d413df9-954b-4f33-aedd-26c0dcd1940a', title: 'KV Cache 的显存怎么算？', section: 'KV Cache', render: () => <MemoryBoundaryPage /> },
    { id: '8111e242-3660-435c-aed7-21acb84b2497', title: '上下文变长，显存会怎样？', section: 'KV Cache', render: () => <AttentionMemoryBridgePage /> },
    { id: '0e3b685f-2a6f-4073-8ee8-c1322880fa5b', title: '注意力的临时显存来自这些大矩阵', section: 'FlashAttention', render: () => <AttentionMatrixGrowthPage /> },
    { id: '278e23b2-688c-4261-b33e-ecdb1dc0e0a7', title: '大矩阵算完，还要来回搬', section: 'FlashAttention', render: () => <AttentionIOMovementPage /> },
    { id: 'fd108683-33cd-48af-b924-9ee6bbec805a', title: '把大矩阵切割成小矩阵', section: 'FlashAttention', render: () => <TiledScorePage /> },
    { id: 'f4846592-414f-4e91-983d-9c97a9ed72de', title: '因果遮罩后，逐块形成 P', section: 'FlashAttention', render: () => <FlashNormalizePage /> },
    { id: '95305364-7003-405e-b69e-af8767858a68', title: '权重 P 分块乘 V，得到输出 O', section: 'FlashAttention', render: () => <FlashOutputPage /> },
    { id: '039cda4d-e67c-4424-b28a-50491f0f424f', title: 'FlashAttention 的两个优势', section: 'FlashAttention', render: () => <FlashAdvantagesPage /> },
    { id: '01e9ac2c-3c89-4eb2-a2d3-aae6f49dff2a', title: '接下来优化 KV Cache 占的显存', section: 'MLA', render: () => <AttentionMemoryBridgePage focusKv title="接下来优化 KV Cache 占的显存" /> },
    { id: 'f138dbf6-ce6e-4538-990e-580ef654f17b', title: '真实情况中往往涉及多个注意力头', section: 'MLA', render: () => <MultiHeadIntroPage /> },
    { id: 'afc9a348-1807-49c7-9306-68fd66d66168', title: 'MHA、GQA、MQA 的 K、V 共享方式', section: 'MLA', render: () => <AttentionSharingPage /> },
    { id: 'c0f3ce34-665d-4362-b595-efd99caa95e1', title: '从投影推导 KV 潜在向量', section: 'MLA', render: () => <LowRankCompressionPage /> },
    { id: 'cc731fdc-836e-473e-be4e-2e91cbfd9037', title: '存潜在向量，代替存 K、V', section: 'MLA', render: () => <LatentKVPage /> },
    { id: 'f851f5e0-b69f-4125-9b88-1fdd36f3175e', title: '每轮都计算展开历史 KV 会增加计算开销', section: 'MLA', render: () => <MatrixExpansionPage /> },
    { id: '759cab3c-0c09-4906-b9ad-66aba16ee8cb', title: '补上此前省略的位置编码：RoPE', section: 'MLA', render: () => <RopePlacementPage /> },
    { id: '21c4961c-b0b8-4c63-a0ac-9161e02db926', title: 'RoPE：按 token 位置旋转 Q、K', section: 'MLA', render: () => <RopeIntroductionPage /> },
    { id: 'ed4453b0-558d-4773-9ac9-56139de0773c', title: '内容与位置，分开计算', section: 'MLA', render: () => <DecoupledRopePage /> },
    { id: 'a1c6f5f9-b36d-4944-a5e9-0abd5629c985', title: 'MLA 的三个关键优势', section: 'MLA', render: () => <MLASummaryPage /> },
  ];

const sceneById = new Map(registeredScenes.map(scene => [scene.id, scene]));
/** Metadata determines order; UUID binds each page to its implementation. */
export const courseScenes: SceneDefinition[] = outline.pages.map(page => {
  const scene = sceneById.get(page.id);
  if (!scene) throw new Error('Missing KV Cache page: ' + page.id);
  return { ...scene, title: page.title };
});
