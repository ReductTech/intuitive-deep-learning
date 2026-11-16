import { Typography } from "@shuku/course-style/react";
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
    <div shuku-edit-id="e-05a0973c-d419-4ca4-a068-09458afa3cde" className="attn-dataset-main">
      <section shuku-edit-id="e-26bcd7ce-f3ce-4868-8891-9aa544e736d3" className="attn-dataset-lane is-training" aria-label="训练样本如何影响模型">
        <Typography shuku-edit-id="e-2bb3418d-83a2-469a-97d8-0baa2756468f" variant="h3" tone="accent">训练 · {TRANSLATION_TRAINING_SET.length} 句</Typography>
        <div shuku-edit-id="e-9b73aed9-973c-4456-a119-6880d4289de4" className="attn-dataset-message">
          <Typography shuku-edit-id="e-fa4cad53-c403-45e7-be11-329887ec6073" variant="bodySmall" tone="muted">B12 · 去商店任务</Typography>
          <Typography shuku-edit-id="e-d5a47a28-0074-4262-b22e-d038df570a73" variant="h3">{training.label}</Typography>
          <Typography shuku-edit-id="e-44399956-7be7-4859-9e32-9f2d6bac89ce" variant="body" tone="accent">{translated(training.targetTokens)}</Typography>
        </div>
        <div shuku-edit-id="e-543a2513-ce84-46bf-bcdc-548e0e0b7a05" className="attn-dataset-flow" aria-hidden="true"><span shuku-edit-id="e-0cb9b02b-9f98-47a1-9226-c4c7b877f33f" className="attn-dataset-flow-line"/><span shuku-edit-id="e-093b9b94-005e-4d9b-ac40-2ef9f72953fd" className="attn-dataset-flow-arrow"/></div>
        <Typography shuku-edit-id="e-11c4a1b6-7455-4868-a8ef-7bc12a0ac323" variant="body" tone="accent">目标译文参与学习 → 参数改变</Typography>
      </section>
      <div shuku-edit-id="e-5010836a-01a6-482d-bea0-0430bc45e5bd" className="attn-dataset-model" aria-label="两组句子使用同一个翻译模型">
        <svg shuku-edit-id="e-129992d5-f1b4-40dd-928a-126df1e4a5c9" viewBox="0 0 160 160" role="img" aria-label="同一个翻译模型，训练侧可以更新，验证侧只检查">
          <circle shuku-edit-id="e-9ace323a-1bd7-461b-93ae-65a9a384943c" cx="80" cy="80" r="68" fill="var(--ui-accent-soft)" stroke="var(--ui-accent)" strokeWidth="4"/>
          <circle shuku-edit-id="e-a9b1a153-4e0b-45d8-9122-1fda48f9739c" cx="51" cy="55" r="11" fill="var(--ui-accent)"/>
          <circle shuku-edit-id="e-10917936-7d97-4486-9c99-c9085f28127b" cx="108" cy="47" r="11" fill="var(--ui-accent)"/>
          <circle shuku-edit-id="e-3c992cb6-43c8-4160-8e1b-1d56ac2285f2" cx="66" cy="107" r="11" fill="var(--ui-accent)"/>
          <circle shuku-edit-id="e-dd43548b-a18a-417e-bb73-22d6b641c31b" cx="113" cy="110" r="11" fill="var(--ui-accent)"/>
          <path shuku-edit-id="e-ce0c51df-e4b1-43a8-b9c2-f93a6031b5e8" d="M59 58L99 48M55 64L64 96M101 57L75 99M77 108L102 109" stroke="var(--ui-accent)" strokeWidth="5"/>
        </svg>
        <Typography shuku-edit-id="e-0671fbee-9f85-459f-a335-a20449dbee9d" variant="h3" align="center">同一模型</Typography>
      </div>
      <section shuku-edit-id="e-608946b8-670f-4e74-9e26-f066711d418d" className="attn-dataset-lane is-validation" aria-label="验证样本如何检查模型">
        <Typography shuku-edit-id="e-c530457e-511a-439b-b32e-ad84b2d9a31f" variant="h3" tone="success">验证 · {TRANSLATION_VALIDATION_SET.length} 句</Typography>
        <div shuku-edit-id="e-149734bb-7dcd-437f-ba6e-c37b4730077b" className="attn-dataset-message">
          <Typography shuku-edit-id="e-0ed23f54-9e3e-42bc-af6c-2eaa8b9999a4" variant="bodySmall" tone="muted">V4 · 在家</Typography>
          <Typography shuku-edit-id="e-b54be52d-6ce4-4cf3-b169-373f62196e64" variant="h3">{validation.label}</Typography>
          <Typography shuku-edit-id="e-53ef94e0-60c0-4437-b5ca-91fc218b2437" variant="body" tone="success">{translated(validation.targetTokens)}</Typography>
        </div>
        <div shuku-edit-id="e-d5a8a704-3d70-420d-873f-65a416f9827e" className="attn-dataset-flow" aria-hidden="true"><span shuku-edit-id="e-f8e6e16e-f462-4664-b82e-9b34dff5a7a9" className="attn-dataset-flow-line"/><span shuku-edit-id="e-75827447-2661-46a9-b479-fa3e9a3d793a" className="attn-dataset-flow-arrow"/></div>
        <Typography shuku-edit-id="e-a7f0e86e-7813-45ed-bb2f-6c1f0ee70568" variant="body" tone="success">只比较译文 → 参数不变</Typography>
      </section>
    </div>
  </AttentionActivity>;
}
