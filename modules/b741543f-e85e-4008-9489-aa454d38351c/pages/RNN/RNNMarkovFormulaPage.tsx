import { Fragment, useRef, useState, type ReactNode } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import { DishIcon, type DishId } from './DishIcon';
import { InlineAnswer } from './InlineAnswer';
import './RNNMarkovFormulaPage.css';

export interface RNNMarkovFormulaPageProps {
  onComplete: () => void;
}

interface FillStep {
  key: string;
  typeLabel: string;
  accept: number[];
  stem: ReactNode;
  hint: ReactNode;
  correctFeedback: ReactNode;
  wrongFeedback: ReactNode;
}

const dishes: DishId[] = ['pie', 'steak', 'burger'];
const dishNames: Record<DishId, string> = { pie: '苹果派', steak: '牛排', burger: '汉堡' };

const transitions = [
  [0, 100, 0],
  [0, 0, 100],
  [100, 0, 0],
];

function MarkovFormulaView() {
  return (
    <div shuku-edit-id="e-8321c892-4fb4-4125-b876-9bcd5d02ac6b" className="nrnn-markov-formula__math-line" aria-label="一阶马尔可夫模型公式">
      <span shuku-edit-id="e-18cf001f-e1dd-4774-b2c8-a62e9061753e" className="nrnn-markov-formula__math-item">P(x₁, …, x<sub shuku-edit-id="e-f6e45d00-df89-40bd-aa9c-086597cd4771">T</sub>)</span>
      <span shuku-edit-id="e-979a6df4-728d-472b-a825-0640f96ebeff" className="nrnn-markov-formula__math-approx">≈</span>
      <span shuku-edit-id="e-9ecc1022-3af8-4375-a4d8-cb695d582beb" className="nrnn-markov-formula__math-prod">
        <span shuku-edit-id="e-ee93f596-c159-4a65-ad7a-d0bfa3a26676" className="nrnn-markov-formula__prod-sup">T</span>
        <span shuku-edit-id="e-47827626-19bc-4b27-8431-a32e155b255d" className="nrnn-markov-formula__prod-sym">∏</span>
        <span shuku-edit-id="e-ca3d1d9c-0824-48ce-9568-b3eb4005fc5b" className="nrnn-markov-formula__prod-sub">t=1</span>
      </span>
      <span shuku-edit-id="e-1796375e-7427-4361-aaa5-17182ddae6ae" className="nrnn-markov-formula__math-item">P(x<sub shuku-edit-id="e-5b89cec8-cca7-458c-9b50-428832e507a6">t</sub> | x<sub shuku-edit-id="e-ec80bf1f-84a2-4305-a37a-6f1f13b2b5ab">t−1</sub>)</span>
    </div>
  );
}

function Dish({ dish, size = 'medium' }: { dish: DishId; size?: 'medium' | 'large' }) {
  return (
    <span shuku-edit-id="e-6376241d-b5fd-40c9-858b-19a66920489b" className={`nrnn-markov-formula__dish-wrapper is-${size}`}>
      <DishIcon dish={dish} label={dishNames[dish]} />
    </span>
  );
}

export function RNNMarkovFormulaPage({ onComplete }: RNNMarkovFormulaPageProps) {
  const [stage, setStage] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const completedRef = useRef(false);

  const isAllDone = stage >= 3;

  const finish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  };

  const steps: FillStep[] = [
    {
      key: 'certain',
      typeLabel: '填空 1/3 · 条件转移',
      accept: [1],
      stem: <>P(明天 <Dish dish="burger" size="large" /> | 今天 <Dish dish="steak" size="large" />) =</>,
      hint: <>找到右侧「今天 <Dish dish="steak" />」这一行，看它指向「明天 <Dish dish="burger" />」那一格的概率。</>,
      correctFeedback: <>回答正确！今天做 <Dish dish="steak" />，明天做 <Dish dish="burger" /> 的转移概率是 100%，即概率值为 1。</>,
      wrongFeedback: <>先找到「今天 <Dish dish="steak" />」这一行，对应明天的转移列。概率填 1 或 100% 均可。</>,
    },
    {
      key: 'impossible',
      typeLabel: '填空 2/3 · 条件转移',
      accept: [0],
      stem: <>P(明天 <Dish dish="pie" size="large" /> | 今天 <Dish dish="steak" size="large" />) =</>,
      hint: <>还是看「今天 <Dish dish="steak" />」这一行，看指向「明天 <Dish dish="pie" />」那一格。</>,
      correctFeedback: '回答正确！不存在这种序列。今天做牛排后绝不可能直接回到苹果派，转移概率为 0。',
      wrongFeedback: <>看「今天 <Dish dish="steak" />」这一行指向「明天 <Dish dish="pie" />」的那一格。</>,
    },
    {
      key: 'product',
      typeLabel: '填空 3/3 · 连乘全链概率',
      accept: [1],
      stem: (
        <span shuku-edit-id="e-9208f2d7-e12c-46e0-8e55-21dd02fabc4a" className="nrnn-markov-formula__chain-stem">
          <span shuku-edit-id="e-eee58ff4-6804-406c-8e71-e241897e6d47">P(</span>
          <Dish dish="pie" size="large" />
          <span shuku-edit-id="e-535432df-2e87-4042-97d8-f8bc37801e60" className="nrnn-markov-formula__stem-arrow">➔</span>
          <Dish dish="steak" size="large" />
          <span shuku-edit-id="e-b72cb97c-91ba-48d1-8e26-ee91b13ce716" className="nrnn-markov-formula__stem-arrow">➔</span>
          <Dish dish="burger" size="large" />
          <span shuku-edit-id="e-0e22925b-837b-4e5a-99d1-4f27118509b6">) =</span>
        </span>
      ),
      hint: '用上方公式连乘：将这三步转移概率相乘。',
      correctFeedback: '回答正确！整条链的联合概率 P = 1 × 1 × 1 = 1。',
      wrongFeedback: '把每一步的转移概率连乘起来再试一次。',
    },
  ];

  const step = steps[Math.min(stage, steps.length - 1)];

  const handleCorrect = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      const nextStage = stage + 1;
      setStage(nextStage);
      setIsTransitioning(false);
      if (nextStage >= 3) {
        finish();
      }
    }, 1200);
  };

  return (
    <ContentBlock shuku-edit-id="e-60675981-1297-4430-8470-a5eb2dbd862d"
      headingLevel={1}
      className="nrnn-markov-formula"
      title="马尔可夫链：它是什么，怎么算？"
      subtitle="未来的状态只取决于当前有限时刻（短期记忆性）。"
    >
      <div shuku-edit-id="e-ecd5b6ca-0502-4fe1-a15f-f52e910fec75" className="nrnn-markov-formula__stage">
        {/* 左侧：公式与背景故事 */}
        <section shuku-edit-id="e-095b7aee-5360-4d47-b781-fecdf01048cc" className="nrnn-markov-formula__formula-panel" aria-label="一阶马尔可夫模型">
          <Typography shuku-edit-id="e-7585f72c-1679-40b8-8bef-09451d5ff6b5" as="span" variant="bodySmall" tone="warning">一阶马尔可夫近似公式</Typography>
          
          <div shuku-edit-id="e-90944160-e1d9-40ca-8129-03b1ef995c6e" className="nrnn-markov-formula__formula">
            <MarkovFormulaView />
          </div>

          <div shuku-edit-id="e-96a3e4d3-a34c-48d1-bdc3-9f00d7b17a2d" className="nrnn-markov-formula__story">
            <Typography shuku-edit-id="e-2810f1c4-f6d8-4ee5-938d-d440a195d1e4" as="p" variant="body" tone="main">
              🧑‍🍳舍友很爱做饭，会做这三道菜：
              <span shuku-edit-id="e-44994f3e-5a5f-4a14-a6f5-4e7382c09727" className="nrnn-markov-formula__dishes-preview">
                <Dish dish="pie" size="large" />
                <Dish dish="steak" size="large" />
                <Dish dish="burger" size="large" />
              </span>
            </Typography>
            <Typography shuku-edit-id="e-e7045087-6219-4cea-9810-a0fd9562a396" as="p" variant="body" tone="accent">
              观察右侧的转移概率表，探索并预测他明天想做哪道菜吧！
            </Typography>
          </div>
        </section>

        {/* 右侧：纯大图展示的转移概率表 */}
        <section shuku-edit-id="e-efbf0998-5848-442b-b845-7cb18783a3da" className="nrnn-markov-formula__example" aria-label="三道菜的转移概率表">
          <div shuku-edit-id="e-7b8d7dd7-8036-41c8-bb4f-09f7bb4c8298" className="nrnn-markov-formula__table" role="table" aria-label="转移概率表">
            <span shuku-edit-id="e-6c47d334-d61d-48e1-9f25-76a920db89c7" className="nrnn-markov-formula__cell is-corner" aria-hidden="true">
              <Typography shuku-edit-id="e-f68f3eda-67d6-46cf-a96f-99b17eedeaf8" as="span" variant="bodySmall" tone="light">今天 ↓<br shuku-edit-id="e-8ed59a5b-82dc-415b-a5ed-e4576d6f54b1" />明天 →</Typography>
            </span>
            {dishes.map((dish) => (
              <span shuku-edit-id="e-59a02664-d7d1-4947-87de-757cb0075269" className="nrnn-markov-formula__cell is-head is-col-head" key={`head-${dish}`}>
                <Dish dish={dish} size="large" />
              </span>
            ))}
            {dishes.map((dish, row) => (
              <Fragment key={`row-${dish}`}>
                <span shuku-edit-id="e-cb0f0c98-3008-4e63-9aaf-ae58959ebe35" className="nrnn-markov-formula__cell is-head is-row-head">
                  <Dish dish={dish} size="large" />
                </span>
                {transitions[row].map((value, column) => (
                  <Typography shuku-edit-id="e-ad0f4dc8-6c9e-4e83-84b2-bf200b953f5d"
                    as="span"
                    variant="bodySmall"
                    tone="inherit"
                    key={`${dish}-${dishes[column]}`}
                    className={`nrnn-markov-formula__cell${value === 100 ? ' is-certain' : ' is-zero'}`}
                  >
                    {value === 100 ? '100%' : '0'}
                  </Typography>
                ))}
              </Fragment>
            ))}
          </div>
          <Typography shuku-edit-id="e-2a44a897-d07c-4b19-9cc4-9172d13e66bd" as="p" variant="bodySmall" tone="muted" className="nrnn-markov-formula__caption">
            表格记录了从今天的一道菜转移到明天某道菜的概率分布。
          </Typography>
        </section>
      </div>

      {/* 底部交互区：未完成时为答题框，答完后原地平滑替换为统一风格的探索发现卡片 */}
      <div shuku-edit-id="e-36380146-840c-4fa0-84eb-d98acf7888c4" className="nrnn-markov-formula__slot">
        {!isAllDone ? (
          <div shuku-edit-id="e-c9ba851f-8f97-48f4-be41-35e3de4b038e" className={`nrnn-markov-formula__quiz-wrapper${isTransitioning ? ' is-transitioning' : ''}`}>
            <InlineAnswer
              key={step.key}
              typeLabel={step.typeLabel}
              accept={step.accept}
              placeholder="填入数值，如 1 或 0"
              stem={step.stem}
              hint={step.hint}
              correctFeedback={step.correctFeedback}
              wrongFeedback={step.wrongFeedback}
              onCorrect={handleCorrect}
            />
          </div>
        ) : (
          <section shuku-edit-id="e-2dd500d2-c221-4134-b0db-c2caa1e73d95" className="nrnn-markov-formula__summary-card" aria-label="探索发现总结">
            <div shuku-edit-id="e-8066bf08-8863-4654-9f3d-50ce451b924b" className="nrnn-markov-formula__summary-head">
              <Typography shuku-edit-id="e-19806915-84f9-4cf9-9705-fbc1f86894d3" as="span" variant="bodySmall" tone="warning">探索发现</Typography>
              <Typography shuku-edit-id="e-5da0e1b7-a51d-41d7-9823-9c739763cb71" as="h3" variant="h3" tone="accent">恭喜！你完整推导出了确定性马尔可夫链</Typography>
            </div>
            
            <div shuku-edit-id="e-067f25cb-4cdc-4d07-b05d-63c6a77ffa3f" className="nrnn-markov-formula__summary-body">
              <div shuku-edit-id="e-1a6f2746-546b-48ab-8030-43c74298aa68" className="nrnn-markov-formula__chain-route">
                <Dish dish="pie" size="large" />
                <span shuku-edit-id="e-5eeae050-255c-4c56-a8e1-b2b70e3a6a1b" className="nrnn-markov-formula__route-arrow">➔ 100%</span>
                <Dish dish="steak" size="large" />
                <span shuku-edit-id="e-47614d87-ccb0-41b2-b061-81ca5b7c81ac" className="nrnn-markov-formula__route-arrow">➔ 100%</span>
                <Dish dish="burger" size="large" />
                <span shuku-edit-id="e-d4c44093-c782-4131-89d7-ee89f63e0fea" className="nrnn-markov-formula__route-arrow">➔ 100%</span>
                <Dish dish="pie" size="large" />
                <span shuku-edit-id="e-85742c14-cf17-4857-b7b9-c5419e7b0d06" className="nrnn-markov-formula__route-tag">（循环闭环）</span>
              </div>
              <Typography shuku-edit-id="e-7eb1aca2-488d-4cfa-9b4a-defd15cb0fea" variant="body" tone="muted" className="nrnn-markov-formula__summary-desc">
                根据每一步连乘计算：P = 1 × 1 × 1 = 1。这证明了整条链<strong shuku-edit-id="e-aa98acfd-0115-4794-b62c-57bcccf78c29">必然且唯一地按照这个固定顺序出现</strong>，完全由马尔可夫转移矩阵决定！
              </Typography>
            </div>
          </section>
        )}
      </div>
    </ContentBlock>
  );
}