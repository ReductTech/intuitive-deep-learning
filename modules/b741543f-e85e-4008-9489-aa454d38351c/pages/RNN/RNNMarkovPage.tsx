import { useState, useRef } from 'react';
import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
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
      <div shuku-edit-id="e-b3cb27a6-a3b8-450f-b7f6-7bbf56917b27" className="nrnn-markov-linear__choices-row">
        {dishes.map((dish) => {
          const isSelected = selected === dish;
          const isCorrect = isSelected && dish === correctDish;
          const isWrong = isSelected && dish !== correctDish;

          return (
            <button shuku-edit-id="e-aa9c6b68-3049-4b66-8401-99b973a754b5"
              key={dish}
              type="button"
              className={`nrnn-markov-linear__choice-btn${isSelected ? ' is-selected' : ''}${isCorrect ? ' is-correct' : ''}${isWrong ? ' is-wrong' : ''}`}
              onClick={() => onSelect(dish)}
            >
              <div shuku-edit-id="e-16f74094-afb6-40c2-be73-b70b817e76b9" className="nrnn-markov-linear__choice-dish">
                <DishIcon dish={dish} />
              </div>
              <span shuku-edit-id="e-3abb8326-aad3-4ea5-82ba-2eccf1ac6cc2" className="nrnn-markov-linear__select-glow" />
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <ContentBlock shuku-edit-id="e-d5254f38-9710-4396-917c-d720d55ab759"
      headingLevel={1}
      className="nrnn-markov-linear"
      title="马尔可夫链的局限：它只记得上一步"
      subtitle="新规则：前两天一样 ➔ 明天换下一道；前两天不同 ➔ 明天再做一次今天这道菜。"
    >
      <div shuku-edit-id="e-aa9e8aeb-c552-4425-844e-57df367b73c0" className="nrnn-markov-linear__layout">
        {/* 左侧：时序历史推演卡片（高度严格与右侧底部对齐） */}
        <section shuku-edit-id="e-44747bb6-3662-4b73-b8dc-cdf299c52822" className="nrnn-markov-linear__track-panel" aria-label="时序历史推演">
          <div shuku-edit-id="e-a1333955-ef88-434b-a22d-eec04735e906" className="nrnn-markov-linear__panel-header">
            <Typography shuku-edit-id="e-0259253d-ecf1-4882-bb16-0cf9138289df" as="span" variant="body" tone="accent" className="nrnn-markov-linear__case-pill">
              {activeCase.badge}
            </Typography>
          </div>

          <div shuku-edit-id="e-3b7879cc-b8a1-414c-b86a-8ebd9d75d201" className="nrnn-markov-linear__prev-rule-hint">
            <Typography shuku-edit-id="e-88b31315-bc9b-4c97-95f4-cac74bc3e0f2" as="span" variant="h3" tone="main" className="nrnn-markov-linear__hint-tag">
              上一页规律
            </Typography>
            <div shuku-edit-id="e-67169eb9-6b64-4681-89c2-fd3e8f9fee3a" className="nrnn-markov-linear__hint-chain">
              <span shuku-edit-id="e-04ade991-2168-46d0-b743-66bb03a62bba" className="nrnn-markov-linear__hint-dish"><DishIcon dish="pie" /></span>
              <Typography shuku-edit-id="e-88ce0689-0883-4997-8004-142289910773" as="span" variant="body" tone="light" className="nrnn-markov-linear__hint-arrow">➔</Typography>
              <span shuku-edit-id="e-7df6be06-0d04-46e7-872a-1953566ca5af" className="nrnn-markov-linear__hint-dish is-active"><DishIcon dish="steak" /></span>
              <Typography shuku-edit-id="e-972d78eb-189c-4352-a827-5e0011b2f207" as="span" variant="body" tone="accent" className="nrnn-markov-linear__hint-arrow is-next">➔</Typography>
              <span shuku-edit-id="e-9111055b-b996-4f33-b3e0-3d251a77efa0" className="nrnn-markov-linear__hint-dish"><DishIcon dish="burger" /></span>
            </div>
          </div>

          <div shuku-edit-id="e-207ef4ec-7fd6-4ed0-bd99-c6764f8a8673" className="nrnn-markov-linear__track-line">
            {/* 1. 昨天节点 */}
            <div shuku-edit-id="e-a586d62f-88e7-4dc6-acf7-3da9e50c0d7d" className="nrnn-markov-linear__node">
              <div shuku-edit-id="e-e185082b-8e3f-4b6d-8e2c-0486f582560c" className="nrnn-markov-linear__node-circle">
                <DishIcon dish={activeCase.yesterday} />
              </div>
              <Typography shuku-edit-id="e-b7acbc95-f3f7-48cf-a1a6-419691f4fcc9" as="span" variant="bodySmall" tone="muted" className="nrnn-markov-linear__node-tag">
                昨天
              </Typography>
            </div>

            {/* 动态缓动流体虚线 */}
            <div shuku-edit-id="e-a1a88c73-2812-4395-a8d2-ceecbcf137ba" className="nrnn-markov-linear__connector">
              <span shuku-edit-id="e-0403a5d0-0dc2-4e52-94f1-a6cd9efa4cfa" className="nrnn-markov-linear__flowing-dash" />
            </div>

            {/* 2. 今天节点 */}
            <div shuku-edit-id="e-34c8b70c-8953-4340-8ce1-d9e453b54404" className="nrnn-markov-linear__node is-today">
              <div shuku-edit-id="e-f02f1c76-bc20-461d-b154-d50c4a57537c" className="nrnn-markov-linear__node-circle is-today-circle">
                <DishIcon dish={activeCase.today} />
              </div>
              <Typography shuku-edit-id="e-fc10b118-38be-407c-9db8-08ed70d13f58" as="span" variant="bodySmall" tone="accent" className="nrnn-markov-linear__node-tag is-accent">
                今天 (牛排)
              </Typography>
            </div>

            {/* 动态缓动流体虚线 */}
            <div shuku-edit-id="e-e9dffe4a-eecb-4096-a164-73e9765ba031" className="nrnn-markov-linear__connector">
              <span shuku-edit-id="e-b7adeae0-6fff-489b-8e8e-ae87e4ca0ac5" className="nrnn-markov-linear__flowing-dash" />
            </div>

            {/* 3. 明天目标节点 */}
            <div shuku-edit-id="e-9f8408ce-cfab-491d-9742-c8976e556562" className="nrnn-markov-linear__node is-tomorrow">
              <div shuku-edit-id="e-2c280f0a-9b29-4d0c-a684-b3d23c5e9b37" className={`nrnn-markov-linear__target-pod${isCurrentRevealed ? ' is-revealed' : ''}`}>
                {!isCurrentRevealed && (
                  <div shuku-edit-id="e-66901a3b-60bf-454c-9648-c99d2f2cd7d6" className="nrnn-markov-linear__spinning-ring" aria-hidden="true" />
                )}
                <div shuku-edit-id="e-8be35737-bf2b-4d33-8785-f800da014812" className="nrnn-markov-linear__pod-content">
                  {isCurrentRevealed ? (
                    <DishIcon dish={activeCase.actualTarget} />
                  ) : (
                    <Typography shuku-edit-id="e-46d47bc5-ae60-49ec-a3bf-cf4191377b49" as="span" variant="display" tone="inherit" className="nrnn-markov-linear__target-qm">
                      ？
                    </Typography>
                  )}
                </div>
              </div>
              <div shuku-edit-id="e-1b24139e-fff9-4f35-83f1-e9e5801c9db5" className="nrnn-markov-linear__target-label">
                <Typography shuku-edit-id="e-8558844c-2f37-4500-a8b2-0eea83e5d176" as="strong" variant="body" tone="accent">明天应做什么？</Typography>
              </div>
            </div>
          </div>

          {isCaseBDone && (
            <Typography shuku-edit-id="e-bc8f6546-6a1c-4487-a4be-ef1a84b0fc66" as="p" variant="bodySmall" tone="muted" className="nrnn-markov-linear__insight">
              两处情形的「今天」都是牛排，明天却完全不同——单步状态给不出两个答案。
            </Typography>
          )}
        </section>

        {/* 右侧：模型答题对比卡片（防挤压预留高度、锁定大标题字号） */}
        <section shuku-edit-id="e-f2e0cb06-d12b-43df-a622-0d257acb9daa" className="nrnn-markov-linear__quiz-panel" aria-label="模型答题对比">
          <div shuku-edit-id="e-0cbe2280-ed36-4e85-9873-5627996dbccc" className="nrnn-markov-linear__quiz-head">
            <Typography shuku-edit-id="e-c5bc340b-9ecd-4926-94da-866a973014f6" as="h3" variant="h3" tone="accent">{activeCase.title}</Typography>
            <Typography shuku-edit-id="e-ed32cf10-2ae7-445a-a92f-4592b3bf2234" as="span" variant="bodySmall" tone="muted">
              {currentCase === 'A' ? '步骤 1/2 · 分析情形 A' : '步骤 2/2 · 对比情形 B'}
            </Typography>
          </div>

          <div shuku-edit-id="e-92d6b4dd-68e6-468b-adac-9c6ef9a707b6" className="nrnn-markov-linear__quiz-body">
            {/* 题 1 */}
            <div shuku-edit-id="e-dda71897-7717-4120-8a15-6a12ade25d47" className="nrnn-markov-linear__q-item">
              <div shuku-edit-id="e-2610e7f0-0634-4a27-a352-894c72784af3" className="nrnn-markov-linear__q-header-line">
                <div shuku-edit-id="e-d0f87e12-7d85-4b53-85b8-bbced2f0ce98" className="nrnn-markov-linear__q-title">
                  <Typography shuku-edit-id="e-b8a93adb-feaf-4dc0-a8ca-91b475ab0a3a" as="span" variant="body" tone="inherit" className="nrnn-markov-linear__q-badge">1</Typography>
                  <Typography shuku-edit-id="e-2b095f91-df68-4144-8a57-6ccf4296b87a" as="h3" variant="h3" tone="main" className="nrnn-markov-linear__q-title-text">
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
              <div shuku-edit-id="e-eef5465e-4429-429e-b10f-e41fb0f16db2" className="nrnn-markov-linear__feedback-slot">
                {currentMarkovAns && (
                  <div shuku-edit-id="e-526a8071-1bbf-4459-a65e-880f3c99a624" className={`nrnn-markov-linear__feedback${currentMarkovAns === 'burger' ? ' is-correct' : ' is-wrong'}`}>
                    <Typography shuku-edit-id="e-92fcaf18-2cb0-4c31-b044-a76167ff178e" as="span" variant="body" tone="inherit" className="nrnn-markov-linear__feedback-text">
                      {currentMarkovAns === 'burger'
                        ? '✓ 答对！它只知今天吃牛排，按上一页推导的固定顺序必定预测汉堡。'
                        : '✕ 它只有单步状态，无法察觉昨天有什么不同。'}
                    </Typography>
                  </div>
                )}
              </div>
            </div>

            {/* 题 2 */}
            <div shuku-edit-id="e-bb94aa13-47c3-4305-ac78-3f79d0c3e8e6" className="nrnn-markov-linear__q-item">
              <div shuku-edit-id="e-932e13f6-08a2-4710-9a1f-0ef2f55864ad" className="nrnn-markov-linear__q-header-line">
                <div shuku-edit-id="e-6b1070b2-1971-4801-990f-7d4c6bd883f7" className="nrnn-markov-linear__q-title">
                  <Typography shuku-edit-id="e-af83abaa-1ed8-4bf1-b6bc-0508455c33fd" as="span" variant="body" tone="inherit" className="nrnn-markov-linear__q-badge">2</Typography>
                  <Typography shuku-edit-id="e-c2458747-27ae-40ee-a734-dde2345648c7" as="h3" variant="h3" tone="main" className="nrnn-markov-linear__q-title-text">
                    具备长记忆的模型会预测什么？
                  </Typography>
                </div>
                <Typography shuku-edit-id="e-c08eb327-d948-447e-bcca-defe299c01c4" as="span" variant="bodySmall" tone="muted" className="nrnn-markov-linear__q-subnote">（能记住前两天历史）</Typography>
              </div>

              {renderPureDishChoices(
                currentMemoryAns,
                (d) => (currentCase === 'A' ? setAnsMemoryA(d) : setAnsMemoryB(d)),
                activeCase.actualTarget,
              )}

              {/* 预留反馈高度槽位 */}
              <div shuku-edit-id="e-adb69b9f-9eb5-4552-a136-77a80fb48d8e" className="nrnn-markov-linear__feedback-slot">
                {currentMemoryAns && (
                  <div shuku-edit-id="e-a79d8430-a01c-47af-ae39-403e69c26e50" className={`nrnn-markov-linear__feedback${currentMemoryAns === activeCase.actualTarget ? ' is-correct' : ' is-wrong'}`}>
                    <Typography shuku-edit-id="e-ce54f1b5-0cfc-470d-aa12-2a066140ff9a" as="span" variant="body" tone="inherit" className="nrnn-markov-linear__feedback-text">
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
          <div shuku-edit-id="e-8dc52b71-237e-4041-b1fb-a3ffa3084c0a" className="nrnn-markov-linear__action-area">
            {currentCase === 'A' ? (
              <Button
                className="nrnn-markov-linear__next-btn"
                disabled={!isCaseADone}
                onClick={handleGoToCaseB}
              >
                <Typography shuku-edit-id="e-b8491046-0e0e-4c40-a585-4d20acba74aa" as="span" variant="body" tone="inherit">
                  {isCaseADone ? '情形 A 答对！进入情形 B ➔' : '请先完成情形 A 的两道题'}
                </Typography>
              </Button>
            ) : (
              <Button
                className="nrnn-markov-linear__next-btn is-complete"
                disabled={!isCaseBDone}
                onClick={handleFinishAll}
              >
                <Typography shuku-edit-id="e-91740df3-680c-4e6f-bc94-56e16b4273e0" as="span" variant="body" tone="inherit">
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
