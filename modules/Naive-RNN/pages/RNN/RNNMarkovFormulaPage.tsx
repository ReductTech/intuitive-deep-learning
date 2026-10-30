import { Fragment, useRef, useState, type ReactNode } from 'react';
import { ContentBlock, Typography } from '../../../shared/react';
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
    <div className="nrnn-markov-formula__math-line" aria-label="一阶马尔可夫模型公式">
      <span className="nrnn-markov-formula__math-item">P(x₁, …, x<sub>T</sub>)</span>
      <span className="nrnn-markov-formula__math-approx">≈</span>
      <span className="nrnn-markov-formula__math-prod">
        <span className="nrnn-markov-formula__prod-sup">T</span>
        <span className="nrnn-markov-formula__prod-sym">∏</span>
        <span className="nrnn-markov-formula__prod-sub">t=1</span>
      </span>
      <span className="nrnn-markov-formula__math-item">P(x<sub>t</sub> | x<sub>t−1</sub>)</span>
    </div>
  );
}

function Dish({ dish, size = 'medium' }: { dish: DishId; size?: 'medium' | 'large' }) {
  return (
    <span className={`nrnn-markov-formula__dish-wrapper is-${size}`}>
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
        <span className="nrnn-markov-formula__chain-stem">
          <span>P(</span>
          <Dish dish="pie" size="large" />
          <span className="nrnn-markov-formula__stem-arrow">➔</span>
          <Dish dish="steak" size="large" />
          <span className="nrnn-markov-formula__stem-arrow">➔</span>
          <Dish dish="burger" size="large" />
          <span>) =</span>
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
    <ContentBlock
      headingLevel={1}
      className="nrnn-markov-formula"
      title="马尔可夫链：它是什么，怎么算？"
      subtitle="未来的状态只取决于当前有限时刻（短期记忆性）。"
    >
      <div className="nrnn-markov-formula__stage">
        {/* 左侧：公式与背景故事 */}
        <section className="nrnn-markov-formula__formula-panel" aria-label="一阶马尔可夫模型">
          <Typography as="span" variant="bodySmall" tone="warning">一阶马尔可夫近似公式</Typography>
          
          <div className="nrnn-markov-formula__formula">
            <MarkovFormulaView />
          </div>

          <div className="nrnn-markov-formula__story">
            <Typography as="p" variant="body" tone="main">
              🧑‍🍳舍友很爱做饭，会做这三道菜：
              <span className="nrnn-markov-formula__dishes-preview">
                <Dish dish="pie" size="large" />
                <Dish dish="steak" size="large" />
                <Dish dish="burger" size="large" />
              </span>
            </Typography>
            <Typography as="p" variant="body" tone="accent">
              观察右侧的转移概率表，探索并预测他明天想做哪道菜吧！
            </Typography>
          </div>
        </section>

        {/* 右侧：纯大图展示的转移概率表 */}
        <section className="nrnn-markov-formula__example" aria-label="三道菜的转移概率表">
          <div className="nrnn-markov-formula__table" role="table" aria-label="转移概率表">
            <span className="nrnn-markov-formula__cell is-corner" aria-hidden="true">
              <Typography as="span" variant="bodySmall" tone="light">今天 ↓<br />明天 →</Typography>
            </span>
            {dishes.map((dish) => (
              <span className="nrnn-markov-formula__cell is-head is-col-head" key={`head-${dish}`}>
                <Dish dish={dish} size="large" />
              </span>
            ))}
            {dishes.map((dish, row) => (
              <Fragment key={`row-${dish}`}>
                <span className="nrnn-markov-formula__cell is-head is-row-head">
                  <Dish dish={dish} size="large" />
                </span>
                {transitions[row].map((value, column) => (
                  <Typography
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
          <Typography as="p" variant="bodySmall" tone="muted" className="nrnn-markov-formula__caption">
            表格记录了从今天的一道菜转移到明天某道菜的概率分布。
          </Typography>
        </section>
      </div>

      {/* 底部交互区：未完成时为答题框，答完后原地平滑替换为统一风格的探索发现卡片 */}
      <div className="nrnn-markov-formula__slot">
        {!isAllDone ? (
          <div className={`nrnn-markov-formula__quiz-wrapper${isTransitioning ? ' is-transitioning' : ''}`}>
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
          <section className="nrnn-markov-formula__summary-card" aria-label="探索发现总结">
            <div className="nrnn-markov-formula__summary-head">
              <Typography as="span" variant="bodySmall" tone="warning">探索发现</Typography>
              <Typography as="h3" variant="h3" tone="accent">恭喜！你完整推导出了确定性马尔可夫链</Typography>
            </div>
            
            <div className="nrnn-markov-formula__summary-body">
              <div className="nrnn-markov-formula__chain-route">
                <Dish dish="pie" size="large" />
                <span className="nrnn-markov-formula__route-arrow">➔ 100%</span>
                <Dish dish="steak" size="large" />
                <span className="nrnn-markov-formula__route-arrow">➔ 100%</span>
                <Dish dish="burger" size="large" />
                <span className="nrnn-markov-formula__route-arrow">➔ 100%</span>
                <Dish dish="pie" size="large" />
                <span className="nrnn-markov-formula__route-tag">（循环闭环）</span>
              </div>
              <Typography variant="body" tone="muted" className="nrnn-markov-formula__summary-desc">
                根据每一步连乘计算：P = 1 × 1 × 1 = 1。这证明了整条链<strong>必然且唯一地按照这个固定顺序出现</strong>，完全由马尔可夫转移矩阵决定！
              </Typography>
            </div>
          </section>
        )}
      </div>
    </ContentBlock>
  );
}