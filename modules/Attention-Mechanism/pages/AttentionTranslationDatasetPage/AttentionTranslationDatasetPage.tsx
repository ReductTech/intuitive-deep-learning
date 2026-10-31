import { Typography } from '../../../shared/react';
import { AttentionActivity, LessonCheck, useActivityState, type ActivityProps } from '../../components/AttentionActivity';
import { TRANSLATION_TRAINING_SET, TRANSLATION_VALIDATION_SET } from '../../model/attentionTranslationExperiment';
import './AttentionTranslationDatasetPage.css';

const training = TRANSLATION_TRAINING_SET.find(example => example.label === 'Go to the store .')!;
const validation = TRANSLATION_VALIDATION_SET[3];
const translated = (tokens: readonly string[]) => tokens.filter(token => !token.startsWith('<')).join('');

export function AttentionTranslationDatasetPage(props: ActivityProps) {
  const [first, setFirst] = useActivityState('C23-training-check', false);
  const [second, setSecond] = useActivityState('C23-validation-check', false);
  return <AttentionActivity {...props} number={23} title="翻译实验：训练集与验证集"
    eyebrow="去商店任务用于训练 · 在家消息用于验证" done={first && second} footerHeight={230}
    className="attn-dataset-page"
    footer={!first
      ? <LessonCheck key="update" id="C23-update" title="验证句会更新模型参数吗？"
          options={[{ value: 'no', label: '不会，只检查输出' },
            { value: 'yes', label: '会，也用于训练', wrongFeedback: '只用训练句更新参数。' }]}
          answer="no" correct="验证只做前向计算。" done={first} onDone={() => setFirst(true)} />
      : <LessonCheck key="purpose" id="C23-purpose" title="哪个样本只用于检查？"
          options={[{ value: 'V4', label: '验证 V4' },
            { value: 'B1', label: '训练 B12', wrongFeedback: 'B12 的目标词会参与参数更新。' }]}
          answer="V4" correct="训练学参数；验证查未见组合。" done={second} onDone={() => setSecond(true)} />}>
    <div className="attn-dataset-main">
      <section className="attn-dataset-lane is-training" aria-label="训练样本如何影响模型">
        <Typography variant="h3" tone="accent">训练 · {TRANSLATION_TRAINING_SET.length} 句</Typography>
        <div className="attn-dataset-message">
          <Typography variant="bodySmall" tone="muted">B12 · 去商店任务</Typography>
          <Typography variant="h3">{training.label}</Typography>
          <Typography variant="body" tone="accent">{translated(training.targetTokens)}</Typography>
        </div>
        <div className="attn-dataset-flow" aria-hidden="true"><span className="attn-dataset-flow-line"/><span className="attn-dataset-flow-arrow"/></div>
        <Typography variant="body" tone="accent">目标译文参与学习 → 参数改变</Typography>
      </section>
      <div className="attn-dataset-model" aria-label="两组句子使用同一个翻译模型">
        <svg viewBox="0 0 160 160" role="img" aria-label="同一个翻译模型，训练侧可以更新，验证侧只检查">
          <circle cx="80" cy="80" r="68" fill="var(--ui-accent-soft)" stroke="var(--ui-accent)" strokeWidth="4"/>
          <circle cx="51" cy="55" r="11" fill="var(--ui-accent)"/>
          <circle cx="108" cy="47" r="11" fill="var(--ui-accent)"/>
          <circle cx="66" cy="107" r="11" fill="var(--ui-accent)"/>
          <circle cx="113" cy="110" r="11" fill="var(--ui-accent)"/>
          <path d="M59 58L99 48M55 64L64 96M101 57L75 99M77 108L102 109" stroke="var(--ui-accent)" strokeWidth="5"/>
        </svg>
        <Typography variant="h3" align="center">同一模型</Typography>
      </div>
      <section className="attn-dataset-lane is-validation" aria-label="验证样本如何检查模型">
        <Typography variant="h3" tone="success">验证 · {TRANSLATION_VALIDATION_SET.length} 句</Typography>
        <div className="attn-dataset-message">
          <Typography variant="bodySmall" tone="muted">V4 · 在家</Typography>
          <Typography variant="h3">{validation.label}</Typography>
          <Typography variant="body" tone="success">{translated(validation.targetTokens)}</Typography>
        </div>
        <div className="attn-dataset-flow" aria-hidden="true"><span className="attn-dataset-flow-line"/><span className="attn-dataset-flow-arrow"/></div>
        <Typography variant="body" tone="success">只比较译文 → 参数不变</Typography>
      </section>
    </div>
  </AttentionActivity>;
}
