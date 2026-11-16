// @refresh reset
import { useState } from 'react';
import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
import { ParameterRange } from '../../components/ParameterRange/ParameterRange';
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
import './FreezeFineTunePage.css';

export const FINE_TUNE_MODES = [
  { name: '冻结骨干', from: 5, who: '只训练新分类头', benefit: '复用已有表示，训练开销较小', cost: '骨干无法针对新任务调整' },
  { name: '部分微调', from: 4, who: 'Stage 4 ＋ 新分类头', benefit: '调整后段表示，同时保留前层经验', cost: '需要选择解冻范围' },
  { name: '全部微调', from: 0, who: 'Stem、Stage 1—4 ＋ 新分类头', benefit: '更多层可以适应新任务', cost: '开销更大，小数据时更需防过拟合' },
] as const;
export interface FreezeFineTunePageProps { onComplete?: () => void; }
export function FreezeFineTunePage({ onComplete }: FreezeFineTunePageProps) {
  const [mode, setMode] = useState(0), [seen, setSeen] = useState<number[]>([0]);
  const complete = seen.length === 3;
  useCompleteOnce(complete, onComplete);
  function choose(index: number) {
    if (!Number.isInteger(index) || index < 0 || index > 2) return;
    setMode(index); setSeen(previous => previous.includes(index) ? previous : [...previous, index]);
  }
  return <ContentBlock shuku-edit-id="e-37f6fade-6b49-4dea-b074-5a334a67ced1" headingLevel={1} className="rtg-freeze" title="哪些参数正在学习？" subtitle="冻结骨干 · 部分微调 · 全部微调"
    data-mode={mode} data-seen={seen.join(',')} data-complete={complete}
    onKeyDown={event => { if ((event.key === 'Enter' || event.key === ' ') && (event.target as Element).closest('button')) {
      event.stopPropagation(); if (event.repeat) event.preventDefault();
    } }}>
    <div shuku-edit-id="e-a110432d-c4ff-442b-8ec9-eac0f26a8af8" className="rtg-freeze__toolbar"><nav shuku-edit-id="e-75ff1a73-0c24-4a3c-8010-5f649d7a2377" aria-label="比较三种参数更新范围">{FINE_TUNE_MODES.map((item, index) =>
      <Button key={item.name} data-mode-choice={index} variant={mode === index ? 'primary' : 'default'} aria-pressed={mode === index} onClick={() => choose(index)}>{item.name}</Button>)}</nav>
      </div>
    <section shuku-edit-id="e-bbbf5609-4cc4-442c-a6ed-13f99d51028d" className="rtg-freeze__lab" aria-label="每组层的冻结或可训练状态">
      <ParameterRange trainableFrom={FINE_TUNE_MODES[mode].from} />
      <div shuku-edit-id="e-fb3f0b7b-0caa-46a0-91b1-538cb67524d2" className="rtg-freeze__who" role="status" aria-live="polite"><Typography shuku-edit-id="e-20d0f453-5db1-4b7d-b31b-fe26e4519b73" variant="h3" tone="accent" align="center">{'谁在学：' + FINE_TUNE_MODES[mode].who}</Typography></div>
      <div shuku-edit-id="e-2409c1f0-f48d-4b3e-b64f-dfbd3b3aad84" className="rtg-freeze__tradeoff" role="status" aria-live="polite">
        <Typography shuku-edit-id="e-91da45a4-1f69-443f-8584-1b978f21911d" variant="body" tone="accent" align="center" data-benefit>{'能获得什么：' + FINE_TUNE_MODES[mode].benefit}</Typography>
        <Typography shuku-edit-id="e-3fb90b77-d32f-40e2-b39d-89dd372a79e1" variant="body" tone="warning" align="center" data-cost>{'主要代价：' + FINE_TUNE_MODES[mode].cost}</Typography>
      </div>
    </section>
    <footer shuku-edit-id="e-984c814a-41ee-4617-84f4-b7aae6fd47dc" className="rtg-freeze__footer"><Typography shuku-edit-id="e-b3403a75-2810-4825-b56b-8ceccbe478f2" variant="bodySmall" tone="muted">冻结层仍参与前向计算，只是不更新参数。</Typography>
      <Button data-reset onClick={() => { setMode(0); setSeen([0]); }}>重新比较</Button></footer>
  </ContentBlock>;
}
