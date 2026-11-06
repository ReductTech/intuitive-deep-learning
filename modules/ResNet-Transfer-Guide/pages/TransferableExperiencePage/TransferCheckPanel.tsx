import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button, NoticeStrip, TextInput, Typography, type QuestionCheckResult } from '../../../shared/react';
import { RtgQuestion } from '../../components/RtgQuestion/RtgQuestion';
import { evaluateAiShortAnswer, type AiShortAnswerEvaluation } from '../../services/aiShortAnswer';
import './TransferCheckPanel.css';

export interface TransferCheckPanelProps { hidden?: boolean; attempt?: number; onCheck: (result: QuestionCheckResult) => void; }

export function TransferCheckPanel({ hidden = false, attempt = 0, onCheck }: TransferCheckPanelProps) {
  const [reflection, setReflection] = useState('');
  const [aiResult, setAiResult] = useState<AiShortAnswerEvaluation | null>(null);
  const [aiError, setAiError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const request = useRef(0), busy = useRef(false);
  useEffect(() => () => { request.current += 1; busy.current = false; }, []);

  async function askAi(event: FormEvent) {
    event.preventDefault();
    if (!reflection.trim() || busy.current) return;
    busy.current = true;
    const generation = ++request.current;
    setAiLoading(true); setAiError(''); setAiResult(null);
    try {
      const result = await evaluateAiShortAnswer('resnet.transferable_clue', reflection, { lesson: '预训练视觉经验迁移到可回收物分类' });
      if (generation === request.current) setAiResult(result);
    } catch (error) {
      if (generation === request.current) setAiError(error instanceof Error ? error.message : 'AI 点评暂时不可用，请重试。');
    } finally {
      if (generation === request.current) { busy.current = false; setAiLoading(false); }
    }
  }

  return <div className="rtg-transfer-check" hidden={hidden} aria-label="理解与应用">
    <section className="rtg-transfer-check__question" aria-label="迁移理解检查">
      <RtgQuestion pageId={'22-transferable-experience:attempt-' + attempt} questionId="why-backbone" type="choice" typeLabel="迁移检查" title="为什么通常保留特征提取器，而不是直接保留旧分类答案？" answer="representation" options={[
        { value: 'representation', label: '边缘、纹理和形状等表示可服务于多个视觉任务' },
        { value: 'same-labels', label: '所有视觉任务使用完全相同的类别名称', wrongFeedback: '新任务的类别空间通常不同。' },
        { value: 'no-training', label: '保留骨干后不再需要任何训练', wrongFeedback: '新分类头通常仍需训练，骨干也可能需要微调。' },
      ]} feedback={{ correct: '通用视觉表示可以复用，旧分类答案则往往需要替换。' }} onCheck={onCheck} />
    </section>
    <section className="rtg-transfer-check__reflection" aria-label="AI延伸点评">
      <Typography as="h2" variant="h2" tone="accent">举例说明</Typography>
      <Typography variant="bodySmall" tone="muted">举出一个能迁移到可回收物分类的视觉线索，并说明原因。</Typography>
      {aiResult || aiError ? <div className="rtg-transfer-check__response" aria-live="polite">
        <NoticeStrip tone={aiError ? 'orange' : aiResult?.isCorrect ? 'green' : 'blue'}><Typography variant="bodySmall" tone="inherit">{aiError || `${aiResult?.verdict}：${aiResult?.explanation}`}</Typography></NoticeStrip>
        <Button data-edit-reflection onClick={() => { setAiResult(null); setAiError(''); }}>修改回答</Button>
      </div> : <form onSubmit={askAi}>
        <TextInput className="ui-typography ui-typography--bodySmall" aria-label="可迁移视觉线索及原因" value={reflection} multiline rows={3} disabled={aiLoading} placeholder="例如：瓶口的圆形边缘，因为……" onChange={event => setReflection(event.currentTarget.value)} />
        <Button data-ask-ai type="submit" variant="primary" loading={aiLoading} disabled={!reflection.trim()}>{aiLoading ? '正在点评…' : 'AI 点评'}</Button>
      </form>}
    </section>
  </div>;
}
