import { useState, useRef } from 'react';
import { Button, ContentBlock, Typography } from '../../../shared/react';
import { DishIcon, type DishId } from './DishIcon';
import './RNNMarkovPage.css';

export interface RNNMarkovPageProps {
  onComplete: () => void;
}

interface CaseFlow {
  id: 'A' | 'B';
  title: string;
  badge: string;
  yesterday: DishId;
  today: DishId;
  actualTarget: DishId;
}

const caseData: Record<'A' | 'B', CaseFlow> = {
  A: {
    id: 'A',
    title: '情形 A：前两天不一样',
    badge: '情形 A',
    yesterday: 'pie',
    today: 'steak',
    actualTarget: 'steak',
  },
  B: {
    id: 'B',
    title: '情形 B：前两天完全一样',
    badge: '情形 B',
    yesterday: 'steak',
    today: 'steak',
    actualTarget: 'burger',
  },
};

export function RNNMarkovPage({ onComplete }: RNNMarkovPageProps) {
  const [currentCase, setCurrentCase] = useState<'A' | 'B'>('A');

  // 情形 A 题目选择
  const [ansMarkovA, setAnsMarkovA] = useState<DishId | null>(null);
  const [ansMemoryA, setAnsMemoryA] = useState<DishId | null>(null);

  // 情形 B 题目选择
  const [ansMarkovB, setAnsMarkovB] = useState<DishId | null>(null);
  const [ansMemoryB, setAnsMemoryB] = useState<DishId | null>(null);

  const completedRef = useRef(false);

  const activeCase = caseData[currentCase];

  const isCaseADone = ansMarkovA === 'burger' && ansMemoryA === 'steak';
  const isCaseBDone = ansMarkovB === 'burger' && ansMemoryB === 'burger';
  const isCurrentRevealed = currentCase === 'A' ? isCaseADone : isCaseBDone;

  const currentMarkovAns = currentCase === 'A' ? ansMarkovA : ansMarkovB;
  const currentMemoryAns = currentCase === 'A' ? ansMemoryA : ansMemoryB;

  const handleGoToCaseB = () => {
    setCurrentCase('B');
  };

  const handleFinishAll = () => {
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  };

  // 纯菜品大卡片选项
  const renderPureDishChoices = (
    selected: DishId | null,
    onSelect: (dish: DishId) => void,
    correctDish: DishId,
  ) => {
    const dishes: DishId[] = ['steak', 'burger', 'pie'];
    return (
      <div className="nrnn-markov-linear__choices-row">
        {dishes.map((dish) => {
          const isSelected = selected === dish;
          const isCorrect = isSelected && dish === correctDish;
          const isWrong = isSelected && dish !== correctDish;

          return (
            <button
              key={dish}
              type="button"
              className={`nrnn-markov-linear__choice-btn${isSelected ? ' is-selected' : ''}${isCorrect ? ' is-correct' : ''}${isWrong ? ' is-wrong' : ''}`}
              onClick={() => onSelect(dish)}
            >
              <div className="nrnn-markov-linear__choice-dish">
                <DishIcon dish={dish} />
              </div>
              <span className="nrnn-markov-linear__select-glow" />
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <ContentBlock
      headingLevel={1}
      className="nrnn-markov-linear"
      title="马尔可夫链的局限：它只记得上一步"
      subtitle="新规则：前两天一样 ➔ 明天换下一道；前两天不同 ➔ 明天再做一次今天这道菜。"
    >
      <div className="nrnn-markov-linear__layout">
        {/* 左侧：时序历史推演卡片（高度严格与右侧底部对齐） */}
        <section className="nrnn-markov-linear__track-panel" aria-label="时序历史推演">
          <div className="nrnn-markov-linear__panel-header">
            <Typography as="span" variant="body" tone="accent" className="nrnn-markov-linear__case-pill">
              {activeCase.badge}
            </Typography>
          </div>

          <div className="nrnn-markov-linear__prev-rule-hint">
            <Typography as="span" variant="h3" tone="main" className="nrnn-markov-linear__hint-tag">
              上一页规律
            </Typography>
            <div className="nrnn-markov-linear__hint-chain">
              <span className="nrnn-markov-linear__hint-dish"><DishIcon dish="pie" /></span>
              <Typography as="span" variant="body" tone="light" className="nrnn-markov-linear__hint-arrow">➔</Typography>
              <span className="nrnn-markov-linear__hint-dish is-active"><DishIcon dish="steak" /></span>
              <Typography as="span" variant="body" tone="accent" className="nrnn-markov-linear__hint-arrow is-next">➔</Typography>
              <span className="nrnn-markov-linear__hint-dish"><DishIcon dish="burger" /></span>
            </div>
          </div>

          <div className="nrnn-markov-linear__track-line">
            {/* 1. 昨天节点 */}
            <div className="nrnn-markov-linear__node">
              <div className="nrnn-markov-linear__node-circle">
                <DishIcon dish={activeCase.yesterday} />
              </div>
              <Typography as="span" variant="bodySmall" tone="muted" className="nrnn-markov-linear__node-tag">
                昨天
              </Typography>
            </div>

            {/* 动态缓动流体虚线 */}
            <div className="nrnn-markov-linear__connector">
              <span className="nrnn-markov-linear__flowing-dash" />
            </div>

            {/* 2. 今天节点 */}
            <div className="nrnn-markov-linear__node is-today">
              <div className="nrnn-markov-linear__node-circle is-today-circle">
                <DishIcon dish={activeCase.today} />
              </div>
              <Typography as="span" variant="bodySmall" tone="accent" className="nrnn-markov-linear__node-tag is-accent">
                今天 (牛排)
              </Typography>
            </div>

            {/* 动态缓动流体虚线 */}
            <div className="nrnn-markov-linear__connector">
              <span className="nrnn-markov-linear__flowing-dash" />
            </div>

            {/* 3. 明天目标节点 */}
            <div className="nrnn-markov-linear__node is-tomorrow">
              <div className={`nrnn-markov-linear__target-pod${isCurrentRevealed ? ' is-revealed' : ''}`}>
                {!isCurrentRevealed && (
                  <div className="nrnn-markov-linear__spinning-ring" aria-hidden="true" />
                )}
                <div className="nrnn-markov-linear__pod-content">
                  {isCurrentRevealed ? (
                    <DishIcon dish={activeCase.actualTarget} />
                  ) : (
                    <Typography as="span" variant="display" tone="inherit" className="nrnn-markov-linear__target-qm">
                      ？
                    </Typography>
                  )}
                </div>
              </div>
              <div className="nrnn-markov-linear__target-label">
                <Typography as="strong" variant="body" tone="accent">明天应做什么？</Typography>
              </div>
            </div>
          </div>

          {isCaseBDone && (
            <Typography as="p" variant="bodySmall" tone="muted" className="nrnn-markov-linear__insight">
              两处情形的「今天」都是牛排，明天却完全不同——单步状态给不出两个答案。
            </Typography>
          )}
        </section>

        {/* 右侧：模型答题对比卡片（防挤压预留高度、锁定大标题字号） */}
        <section className="nrnn-markov-linear__quiz-panel" aria-label="模型答题对比">
          <div className="nrnn-markov-linear__quiz-head">
            <Typography as="h3" variant="h3" tone="accent">{activeCase.title}</Typography>
            <Typography as="span" variant="bodySmall" tone="muted">
              {currentCase === 'A' ? '步骤 1/2 · 分析情形 A' : '步骤 2/2 · 对比情形 B'}
            </Typography>
          </div>

          <div className="nrnn-markov-linear__quiz-body">
            {/* 题 1 */}
            <div className="nrnn-markov-linear__q-item">
              <div className="nrnn-markov-linear__q-header-line">
                <div className="nrnn-markov-linear__q-title">
                  <Typography as="span" variant="body" tone="inherit" className="nrnn-markov-linear__q-badge">1</Typography>
                  <Typography as="h3" variant="h3" tone="main" className="nrnn-markov-linear__q-title-text">
                    一阶马尔可夫会给出什么预测？
                  </Typography>
                </div>
              </div>

              {renderPureDishChoices(
                currentMarkovAns,
                (d) => (currentCase === 'A' ? setAnsMarkovA(d) : setAnsMarkovB(d)),
                'burger',
              )}

              {/* 预留反馈高度槽位：答题前占位，答题后平滑显示，绝不挤动题二 */}
              <div className="nrnn-markov-linear__feedback-slot">
                {currentMarkovAns && (
                  <div className={`nrnn-markov-linear__feedback${currentMarkovAns === 'burger' ? ' is-correct' : ' is-wrong'}`}>
                    <Typography as="span" variant="body" tone="inherit" className="nrnn-markov-linear__feedback-text">
                      {currentMarkovAns === 'burger'
                        ? '✓ 答对！它只知今天吃牛排，按上一页推导的固定顺序必定预测汉堡。'
                        : '✕ 它只有单步状态，无法察觉昨天有什么不同。'}
                    </Typography>
                  </div>
                )}
              </div>
            </div>

            {/* 题 2 */}
            <div className="nrnn-markov-linear__q-item">
              <div className="nrnn-markov-linear__q-header-line">
                <div className="nrnn-markov-linear__q-title">
                  <Typography as="span" variant="body" tone="inherit" className="nrnn-markov-linear__q-badge">2</Typography>
                  <Typography as="h3" variant="h3" tone="main" className="nrnn-markov-linear__q-title-text">
                    具备长记忆的模型会预测什么？
                  </Typography>
                </div>
                <Typography as="span" variant="bodySmall" tone="muted" className="nrnn-markov-linear__q-subnote">（能记住前两天历史）</Typography>
              </div>

              {renderPureDishChoices(
                currentMemoryAns,
                (d) => (currentCase === 'A' ? setAnsMemoryA(d) : setAnsMemoryB(d)),
                activeCase.actualTarget,
              )}

              {/* 预留反馈高度槽位 */}
              <div className="nrnn-markov-linear__feedback-slot">
                {currentMemoryAns && (
                  <div className={`nrnn-markov-linear__feedback${currentMemoryAns === activeCase.actualTarget ? ' is-correct' : ' is-wrong'}`}>
                    <Typography as="span" variant="body" tone="inherit" className="nrnn-markov-linear__feedback-text">
                      {currentMemoryAns === activeCase.actualTarget
                        ? '✓ 答对！长记忆能综合前两天的关联，成功做出差异化决策！'
                        : '✕ 请对照副标题的新规则再核对一次。'}
                    </Typography>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 阶段推进操作区 */}
          <div className="nrnn-markov-linear__action-area">
            {currentCase === 'A' ? (
              <Button
                className="nrnn-markov-linear__next-btn"
                disabled={!isCaseADone}
                onClick={handleGoToCaseB}
              >
                <Typography as="span" variant="body" tone="inherit">
                  {isCaseADone ? '情形 A 答对！进入情形 B ➔' : '请先完成情形 A 的两道题'}
                </Typography>
              </Button>
            ) : (
              <Button
                className="nrnn-markov-linear__next-btn is-complete"
                disabled={!isCaseBDone}
                onClick={handleFinishAll}
              >
                <Typography as="span" variant="body" tone="inherit">
                  {isCaseBDone ? '完成本页 ➔' : '请先完成情形 B 的两道题'}
                </Typography>
              </Button>
            )}
          </div>
        </section>
      </div>
    </ContentBlock>
  );
}
