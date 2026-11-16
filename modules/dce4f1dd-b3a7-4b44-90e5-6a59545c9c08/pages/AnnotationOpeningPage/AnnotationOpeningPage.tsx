import { useState } from 'react';
import { Button, Question, Typography } from "@shuku/course-style/react";
import './AnnotationOpeningPage.css';
import outline from '../../outlines.json';
import { photoUrl } from '../../data';

type Label = '苹果' | '梨';
const samples: { id: string; label: Label; file: string; variety: string; description: string }[] = [
  { id: '01', label: '苹果', file: '01-fuji-apple.jpg', variety: '富士苹果', description: '红黄条纹、顶部凹陷的圆形水果，AI 生成' },
  { id: '02', label: '梨', file: '02-bartlett-pear.jpg', variety: '巴特利特梨', description: '黄色带斑点、上窄下宽的水果，AI 生成' },
  { id: '03', label: '苹果', file: '03-granny-smith-apple.jpg', variety: '青苹果', description: '青绿色、顶部凹陷的圆形水果，AI 生成' },
  { id: '04', label: '梨', file: '04-bosc-pear.jpg', variety: '博斯克梨', description: '棕褐色粗糙果皮、细长颈部的水果，AI 生成' },
  { id: '05', label: '苹果', file: '05-golden-delicious-apple.jpg', variety: '金冠苹果', description: '金黄色、顶部凹陷的圆形水果，AI 生成' },
  { id: '06', label: '梨', file: '06-asian-pear.jpg', variety: '亚洲梨', description: '黄褐色、带细小斑点的扁圆形水果，AI 生成' },
];

function FruitPhoto({ sample }: { sample: typeof samples[number] }) {
  return <img shuku-edit-id="e-756a7928-b256-46d7-906b-ad65e9595492" src={photoUrl(sample.file)} alt={sample.description} width={1536} height={1024} decoding="async" />;
}

export function AnnotationOpeningPage() {
  const [intro, setIntro] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [judgment, setJudgment] = useState<boolean | null>(null);
  const [labels, setLabels] = useState<Record<string, Label>>({});
  const [checked, setChecked] = useState(false);
  const [focusId, setFocusId] = useState('01');
  const assigned = Object.keys(labels).length;
  const mistakes = samples.filter(sample => labels[sample.id] !== sample.label);
  const complete = checked && mistakes.length === 0;
  const focused = samples.find(sample => sample.id === focusId)!;

  const choose = (id: string, label: Label) => {
    setLabels(previous => ({ ...previous, [id]: label }));
    setFocusId(id);
    setChecked(false);
  };

  return <article shuku-edit-id="e-b746c873-dbe9-4000-b331-07279d5aad03" className={`daa-opening${intro ? ' daa-opening-intro daa-opening-sack-scene' : ''}`} aria-label={outline.pages.find(page => page.id === '00c19198-cc92-4327-b95f-02a6a778fa35')!.title}>
    <img shuku-edit-id="e-7eddcc38-c919-4f78-932c-5edce16cee81" className="daa-station-background" src={photoUrl(intro ? '14-two-sorters-sacks.jpg' : '13-opening-fruit-station.jpg')} alt="" aria-hidden="true" />
    <header shuku-edit-id="e-9888842a-b8c8-4e55-9f07-c45a07df7214" className="daa-station-header">
      <div shuku-edit-id="e-9dfc304a-3098-4d69-883b-e805ee121921"><Typography shuku-edit-id="e-4fa8a62f-065f-4603-afd5-291f0ef5ec3e" variant="bodySmall" tone="accent">水果分拣站 · {intro ? '今日验收' : '标注工作台'}</Typography>
        <Typography shuku-edit-id="e-d69eae90-d246-466a-96bc-0a86e78f95e0" as="h1" variant="h1" tone="accent">{intro ? '同一批水果，为什么分法不一样？' : '给这批水果写上答案'}</Typography></div>

    </header>
    {intro && <div shuku-edit-id="e-6757dbfd-3af1-4810-8bed-aac36d9fadc6" className="daa-sack-labels" aria-label="左边按苹果和梨分袋；右边按圆形和长形分袋，圆形袋中也有圆梨。">
      {['苹果', '梨', '圆', '长'].map((label, i) => <div shuku-edit-id="e-9914b4b0-8148-4739-a333-edd17ad0f1a2" className={`daa-sack-label daa-sack-label-${i}`} key={label}><Typography shuku-edit-id="e-69bba634-effc-4e36-a7b1-b3be86030cca" variant="h3" tone="accent">{label}</Typography></div>)}
    </div>}
    {intro && <div shuku-edit-id="e-7939584a-84e0-4603-a363-c290906b08f7" className="daa-round-pear-focus" aria-label="重点：圆梨分别位于左边的梨袋与右边的圆袋">
      <svg shuku-edit-id="e-7a91a1e0-ea67-474c-812a-803b61470a6e" viewBox="0 0 1600 900" aria-hidden="true"><g shuku-edit-id="e-9d4bb842-1c33-4fae-824a-41265bcd1641" fill="none" stroke="white" strokeWidth="7"><ellipse shuku-edit-id="e-cb46378d-aff1-4b61-9e28-312ef337ca78" cx="408" cy="547" rx="31" ry="28"/><ellipse shuku-edit-id="e-227cfa61-c8ad-4cbd-a873-23f4ccb66191" cx="610" cy="547" rx="33" ry="30"/></g><g shuku-edit-id="e-d71deaab-f858-4d94-bae0-e5e4f1e33df2" fill="none" stroke="var(--ui-accent)" strokeWidth="3"><ellipse shuku-edit-id="e-73592ed4-6041-4bc0-b3c3-3157a8bc4dda" cx="408" cy="547" rx="31" ry="28"/><ellipse shuku-edit-id="e-eb5c6e6a-9728-4e38-9ce1-500386a0c974" cx="610" cy="547" rx="33" ry="30"/><path shuku-edit-id="e-2d9013d1-c844-4e09-9b5d-0477d07d1812" d="M408 501 V516 M610 501 V514"/></g></svg>
      <div shuku-edit-id="e-c7c329ff-9f3a-4e28-aba4-77e43982afc2" className="daa-round-pear-caption daa-round-pear-caption-left"><Typography shuku-edit-id="e-67386af0-409a-4027-a841-7bd2f1e945e6" variant="bodySmall" tone="accent">圆梨</Typography></div>
      <div shuku-edit-id="e-b293aa0f-4bb4-42a8-91ee-bb595b50648d" className="daa-round-pear-caption daa-round-pear-caption-right"><Typography shuku-edit-id="e-5f7074f3-cc8d-4a32-b613-e9c2e4b5824d" variant="bodySmall" tone="accent">圆梨</Typography></div>
    </div>}
    <div shuku-edit-id="e-5bdbf5a0-6749-4fa5-8af9-07932d8b2395" className="daa-workspace">
      {intro ? <div shuku-edit-id="e-a784aaf8-351c-41da-b590-19503361fd7e" className="daa-scene-space" /> : <div shuku-edit-id="e-090effc5-dd6b-498a-b375-cfa97030c3fd" className="daa-samples" aria-label="六张待标注的水果图片">
        {samples.map(sample => {
          const wrong = !intro && checked && labels[sample.id] !== sample.label;
          return <article shuku-edit-id="e-c19deeb0-1ac7-4b6d-8b7c-5af0fe499994" className={`daa-sample${labels[sample.id] ? ' is-labelled' : ''}${wrong ? ' is-wrong' : ''}${complete ? ' is-verified' : ''}`} key={sample.id} aria-label={`图片 ${sample.id}`}>
            <div shuku-edit-id="e-3394a8ef-306b-4ad8-9fde-f06545306aa9" className="daa-image">
              <Typography shuku-edit-id="e-c68ad275-8e8f-410e-8f31-6105a1617755" as="span" variant="bodySmall" tone="light" className="daa-image-index">{sample.id}</Typography>
              <FruitPhoto sample={sample} />
            </div>
            <div shuku-edit-id="e-819bdf61-0445-4fd2-b056-b3b357edbcae" className="daa-label-options" role="group" aria-label={`图片 ${sample.id} 的类别`}>
              {(['苹果', '梨'] as const).map(label => <Button
                key={label}
                active={labels[sample.id] === label}
                aria-pressed={labels[sample.id] === label}
                aria-label={`将图片 ${sample.id} 标为${label}`}
                onClick={() => choose(sample.id, label)}
              ><Typography shuku-edit-id="e-776d9a21-0735-4cfa-9bee-c69e0e95fc8c" as="span" variant="bodySmall" tone="inherit">{label}</Typography></Button>)}
            </div>
          </article>;
        })}
      </div>}
      {intro ? <aside shuku-edit-id="e-da8c8137-0841-4a24-a256-ef61a9ded949" className="daa-task daa-intro-task">
        <Question className="daa-opening-question" typeLabel="你的判断" title="这两个人，谁分错了？" answer="unknown" instant showFeedback={false} options={[{value:'a',label:'左边分错了'},{value:'b',label:'右边分错了'},{value:'unknown',label:'现在还不能判断'}]} onCheck={result => { setRevealed(true); setJudgment(result.ok); }} />
        {judgment !== null && <Typography shuku-edit-id="e-e4f0791a-7465-42ab-9c35-cbd0f6ac5cc8" variant="bodySmall" tone={judgment ? 'success' : 'danger'} role="status">{judgment ? '✓ 判断正确：先明确任务。' : '✕ 先别判错：还要看任务。'}</Typography>}
        <Button variant="primary" disabled={!revealed} onClick={() => setIntro(false)}><Typography shuku-edit-id="e-55166d33-635d-427b-a23b-cac9b80dafdd" as="span" variant="bodySmall" tone="inherit">现在请你按种类标注</Typography></Button>
      </aside> : <aside shuku-edit-id="e-bbc18635-8a75-4a3f-96e6-5593c44ef859" className="daa-task">
        <div shuku-edit-id="e-294194d5-a80a-44af-83b2-790079a58073" className="daa-task-intro">
          <Typography shuku-edit-id="e-cb708f13-7810-450f-97ad-82af11a49695" variant="bodySmall" tone="warning">你的任务</Typography>
          <Typography shuku-edit-id="e-d6585958-4b1f-4460-8e1d-23f66ad8e5f2" variant="h2" tone="accent">把答案<br shuku-edit-id="e-02a0e0ba-de14-4899-b441-71346bf34aa1" />写进数据</Typography>
        </div>
        <div shuku-edit-id="e-b4b94c65-8c4f-4ba0-9e38-c6271f7f772c" className="daa-task-action">
          <Typography shuku-edit-id="e-8dc05260-5d79-4bee-9aaa-ae40be3496c2" variant="bodySmall" tone={complete ? 'success' : 'muted'} aria-live="polite">
            {complete ? '全部标注完成' : `已标注 ${assigned} / 6 张`}
          </Typography>
          <Button variant="primary" disabled={assigned !== 6} onClick={() => setChecked(true)}>
            <Typography shuku-edit-id="e-198db215-a62b-49c5-8c2a-02b035f35b32" as="span" variant="body" tone="inherit">{complete ? '再次检查' : '检查标注'}</Typography>
          </Button>
          <Button onClick={() => { setLabels({}); setChecked(false); setFocusId('01'); }}>
            <Typography shuku-edit-id="e-71f10334-59c5-4060-be80-924767d09e54" as="span" variant="bodySmall" tone="inherit">重新标注</Typography>
          </Button>
          <Typography shuku-edit-id="e-de74f456-d008-4832-85b9-6654ddf021f2" variant="bodySmall" tone="muted">AI 生成图片 · 可改选</Typography>
        </div>
      </aside>}
    </div>
    <div shuku-edit-id="e-0f207f5c-0124-4f3c-aa63-42aac83482a4" className={`daa-learning-result${complete ? ' is-complete' : ''}`} aria-live="polite">
      {intro ? <>
        <Typography shuku-edit-id="e-157ddb79-24f3-45b7-aac1-c85ae7133c62" variant="h3" tone="accent">{revealed ? '左边按种类，右边按形状：两种分法都可以对。' : '同一批水果，被装进了不同的麻袋。'}</Typography>
        <Typography shuku-edit-id="e-5f4e0f12-52a0-4b49-8368-53ee0c11536e" variant="bodySmall" tone="muted">{revealed ? '左边分苹果和梨，右边分圆形和长形。标签要表达什么，先由任务决定。' : '你觉得谁分错了？先做出判断，再看看他们接到的任务。'}</Typography>
      </> : complete ? <>
        <div shuku-edit-id="e-2e659d8b-718c-40ee-80aa-83a4e0d76497" className="daa-pair">
          <div shuku-edit-id="e-d407a7db-b62b-4156-a778-8862a3654287" className="daa-mini-image"><FruitPhoto sample={focused} /></div>
          <Typography shuku-edit-id="e-d938b13b-c75e-422e-b938-b2d2fa84695e" as="span" variant="body" tone="muted">图片 {focused.id}</Typography>
          <Typography shuku-edit-id="e-bcb7ccb4-9123-4213-b863-e429dfdf6e9e" as="span" variant="h3" tone="light" aria-hidden="true">＋</Typography>
          <Typography shuku-edit-id="e-9af0fb2b-8f57-463c-862e-167c2f734179" as="span" variant="body" tone="accent" className="daa-result-label">{labels[focusId]}</Typography>
          <Typography shuku-edit-id="e-a4c4d785-b077-4ac8-b46c-d4541eb0241f" as="span" variant="h3" tone="light" aria-hidden="true">→</Typography>
          <Typography shuku-edit-id="e-12cab1db-3a4f-4426-855a-0a1555a2cd52" as="span" variant="body" tone="accent">一个训练样本</Typography>
        </div>
        <Typography shuku-edit-id="e-62d2d6dd-8d11-425f-9007-68c0612eed24" variant="bodySmall" tone="success">你刚刚完成了数据标注：为输入指定学习目标。</Typography>
      </> : <>
        <Typography shuku-edit-id="e-a63b62f6-763f-403c-8a49-20a34b53063c" variant="h3" tone={checked ? 'warning' : 'accent'}>
          {checked ? `再看图片 ${mistakes.map(sample => sample.id).join('、')}` : '我们能认出水果，但训练数据还缺少答案。'}
        </Typography>
        <Typography shuku-edit-id="e-01fd2f91-8e49-40f8-99fe-608a9dc1641c" variant="body" tone="muted">
          {checked ? mistakes.some(sample => sample.id === '06') ? '06 是圆形的亚洲梨；颜色和形状都不能单独决定类别。' : '结合果皮、果柄与轮廓判断，修改标签后再检查。' : '点选图片下方的类别，把你的判断变成模型可以学习的标签。'}
        </Typography>
      </>}
    </div>
  </article>;
}
