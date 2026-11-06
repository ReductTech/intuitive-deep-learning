import { moduleIdentity } from './outlines.json';
import { SceneDeck, type DeckDefinition } from '../shared/react/presentation';
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

export const deck: DeckDefinition = {
  id: 'kv-cache-guide',
  title: 'KV Cache：从重复计算到显存边界',
  subtitle: '从四个 token 的一次计算，看见重复工作的代价',
  scenes: [
    {
      id: 'prefill',
      title: '四个 token，怎样变成 Q、K、V？',
      section: 'KV Cache',
      render: () => <PrefillPage />,
    },
    {
      id: 'attention-cycle',
      title: 'Q、K、V 怎样完成一次计算？',
      section: 'KV Cache',
      render: () => <AttentionCyclePage />,
    },
    {
      id: 'numeric-kv-repeat',
      title: '新增一个 token，旧 K、V 会变吗？',
      section: 'KV Cache',
      render: () => <NumericKvRepeatPage />,
    },
    {
      id: 'abstract-process',
      title: '只预测下一个字，还需要所有 Q 行吗？',
      section: 'KV Cache',
      render: () => <AbstractProcessPage />,
    },
    {
      id: 'repeated-work',
      title: '只看 Q、K、V：预测下一个字要用哪些行？',
      section: 'KV Cache',
      render: () => <RepeatedWorkPage />,
    },
    { id: 'cache-loop', title: '把 K、V 存起来，不再重复计算', section: 'KV Cache', render: () => <CacheLoopPage /> },
    { id: 'memory-boundary', title: 'KV Cache 的显存怎么算？', section: 'KV Cache', render: () => <MemoryBoundaryPage /> },
    { id: 'attention-memory-bridge', title: '上下文变长，显存会怎样？', section: 'KV Cache', render: () => <AttentionMemoryBridgePage /> },
    { id: 'attention-matrix-growth', title: '注意力的临时显存来自这些大矩阵', section: 'FlashAttention', render: () => <AttentionMatrixGrowthPage /> },
    { id: 'attention-io-movement', title: '大矩阵算完，还要来回搬', section: 'FlashAttention', render: () => <AttentionIOMovementPage /> },
    { id: 'tiled-score', title: '把大矩阵切割成小矩阵', section: 'FlashAttention', render: () => <TiledScorePage /> },
    { id: 'flash-normalize', title: '因果遮罩后，逐块形成 P', section: 'FlashAttention', render: () => <FlashNormalizePage /> },
    { id: 'flash-output', title: '权重 P 分块乘 V，得到输出 O', section: 'FlashAttention', render: () => <FlashOutputPage /> },
    { id: 'flash-advantages', title: 'FlashAttention 的两个优势', section: 'FlashAttention', render: () => <FlashAdvantagesPage /> },
    { id: 'kv-cache-optimization', title: '接下来优化 KV Cache 占的显存', section: 'MLA', render: () => <AttentionMemoryBridgePage focusKv title="接下来优化 KV Cache 占的显存" /> },
    { id: 'multi-head-intro', title: '真实情况中往往涉及多个注意力头', section: 'MLA', render: () => <MultiHeadIntroPage /> },
    { id: 'attention-sharing', title: 'MHA、GQA、MQA 的 K、V 共享方式', section: 'MLA', render: () => <AttentionSharingPage /> },
    { id: 'low-rank-compression', title: '从投影推导 KV 潜在向量', section: 'MLA', render: () => <LowRankCompressionPage /> },
    { id: 'latent-kv', title: '存潜在向量，代替存 K、V', section: 'MLA', render: () => <LatentKVPage /> },
    { id: 'matrix-absorption', title: '每轮都计算展开历史 KV 会增加计算开销', section: 'MLA', render: () => <MatrixExpansionPage /> },
    { id: 'rope-placement', title: '补上此前省略的位置编码：RoPE', section: 'MLA', render: () => <RopePlacementPage /> },
    { id: 'rope-introduction', title: 'RoPE：按 token 位置旋转 Q、K', section: 'MLA', render: () => <RopeIntroductionPage /> },
    { id: 'decoupled-rope', title: '内容与位置，分开计算', section: 'MLA', render: () => <DecoupledRopePage /> },
    { id: 'attention-comparison', title: 'MLA 的三个关键优势', section: 'MLA', render: () => <MLASummaryPage /> },
  ],
};

export function KvCachePpt() {
  return <SceneDeck catalog={[deck]} moduleId="kv-cache-guide" assetId={moduleIdentity.id} progressKey="lesson-flow:kv-cache-guide" />;
}
