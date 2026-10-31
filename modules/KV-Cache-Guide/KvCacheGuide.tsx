import { useEffect, useRef, useState } from 'react';
import { ModuleShell } from '../shared/react';
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
import './KvCacheGuide.css';

export function KvCacheGuide() {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const update = () => setScale(Math.min(1, frame.clientWidth / 1600));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  return <ModuleShell
    title="KV Cache：从重复计算到显存边界"
    subtitle="沿用「我爱学习」的矩阵，完成一次计算，再看下一轮的重复。"
    badge="Blog / Guide"
    shellClassName="kvc-guide-shell"
  >
    <div ref={frameRef} className="kvc-guide-frame" style={{ height: 900 * scale * 24 }}>
      <div className="kvc-guide-surface" style={{ transform: `scale(${scale})` }}><PrefillPage /><AttentionCyclePage /><NumericKvRepeatPage /><AbstractProcessPage /><RepeatedWorkPage /><CacheLoopPage /><MemoryBoundaryPage /><AttentionMemoryBridgePage /><AttentionMatrixGrowthPage /><AttentionIOMovementPage /><TiledScorePage /><FlashNormalizePage /><FlashOutputPage /><FlashAdvantagesPage /><AttentionMemoryBridgePage focusKv title="接下来优化 KV Cache 占的显存" /><MultiHeadIntroPage /><AttentionSharingPage /><LowRankCompressionPage /><LatentKVPage /><MatrixExpansionPage /><RopePlacementPage /><RopeIntroductionPage /><DecoupledRopePage /><MLASummaryPage /></div>
    </div>
  </ModuleShell>;
}
