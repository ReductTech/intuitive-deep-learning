import { Fragment, useRef, useState } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import { DishIcon, type DishId } from './DishIcon';
import { WeatherIcon, type WeatherId } from './WeatherIcon';
import './RNNUnfoldingPage.css';

export interface RNNUnfoldingPageProps { onComplete: () => void; }

const dishNames: Record<DishId, string> = { pie: '苹果派', steak: '牛排', burger: '汉堡' };
const dishOptions: DishId[] = ['pie', 'steak', 'burger'];

/** 每天的天气是给定的输入，一开始就摆好：晴、晴、雨、晴、雨。 */
const weathers: WeatherId[] = ['sun', 'sun', 'rain', 'sun', 'rain'];
/** 隐状态：H₁ 是给定的起点（上一天做的苹果派），之后每个 H 接住上一个时刻的输出。 */
const states: DishId[] = ['pie', 'pie', 'pie', 'steak', 'steak'];
/** 每个时刻的输出：晴天照做上一天那道菜，雨天换下一道（苹果派 → 牛排 → 汉堡）。 */
const outputs: DishId[] = ['pie', 'pie', 'steak', 'steak', 'burger'];
/** 起点隐状态一开始就给出，其余都要学生推。 */
const initialStatesRevealed = [true, false, false, false, false];

interface QuizStep {
  type: 'output' | 'state';
  colIndex: number;
  expected: DishId;
  questionText: string;
  rationale: string;
}

/** 9 步交替推导：先定输出，再把输出送进下一个隐状态。 */
const quizFlow: QuizStep[] = [
  {
    type: 'output',
    colIndex: 0,
    expected: 'pie',
    questionText: 't₁ 的输入是上一天是晴天，隐状态里带着上一天做的苹果派。这一刻输出什么？',
    rationale: '晴天照做上一天那道菜，所以还是苹果派。',
  },
  {
    type: 'state',
    colIndex: 1,
    expected: 'pie',
    questionText: 't₂ 的隐状态是什么？',
    rationale: '上一个时刻的输出，直接成为下一个时刻的隐状态。',
  },
  {
    type: 'output',
    colIndex: 1,
    expected: 'pie',
    questionText: 't₂ 的输入还是晴天，这一刻输出什么？',
    rationale: '晴天照做上一天那道菜，仍然是苹果派。',
  },
  {
    type: 'state',
    colIndex: 2,
    expected: 'pie',
    questionText: 't₃ 的隐状态是什么？',
    rationale: '输出顺着时间往下传，t₃ 的隐状态接到的还是苹果派。',
  },
  {
    type: 'output',
    colIndex: 2,
    expected: 'steak',
    questionText: 't₃ 的输入变成雨天，这一刻输出什么？',
    rationale: '雨天要换下一道：苹果派 → 牛排。',
  },
  {
    type: 'state',
    colIndex: 3,
    expected: 'steak',
    questionText: 't₄ 的隐状态是什么？',
    rationale: '输出继续往下传，牛排在 t₄ 成了隐状态。',
  },
  {
    type: 'output',
    colIndex: 3,
    expected: 'steak',
    questionText: 't₄ 的输入是晴天，这一刻输出什么？',
    rationale: '晴天照做上一天那道菜，还是牛排。',
  },
  {
    type: 'state',
    colIndex: 4,
    expected: 'steak',
    questionText: 't₅ 的隐状态是什么？',
    rationale: '隐状态一路接住上一步的输出，t₅ 接到的是牛排。',
  },
  {
    type: 'output',
    colIndex: 4,
    expected: 'burger',
    questionText: 't₅ 的输入是雨天，最后输出什么？',
    rationale: '雨天再换下一道：牛排 → 汉堡。',
  },
];

export function RNNUnfoldingPage({ onComplete }: RNNUnfoldingPageProps) {
  const [stepIdx, setStepIdx] = useState(0);
  const [outputsRevealed, setOutputsRevealed] = useState<boolean[]>(outputs.map(() => false));
  const [statesRevealed, setStatesRevealed] = useState<boolean[]>(initialStatesRevealed);
  const [wrongChoice, setWrongChoice] = useState<DishId | null>(null);
  const completedRef = useRef(false);

  // 答完 9 步即为完成，完成后自动切换到折叠对照视图
  const isAllDone = stepIdx >= quizFlow.length;
  const currentQuiz = quizFlow[Math.min(stepIdx, quizFlow.length - 1)];

  const handleSelect = (choice: DishId) => {
    if (isAllDone) return;

    if (choice !== currentQuiz.expected) {
      setWrongChoice(choice);
      return;
    }

    setWrongChoice(null);
    if (currentQuiz.type === 'output') {
      setOutputsRevealed((list) => list.map((done, index) => (index === currentQuiz.colIndex ? true : done)));
    } else {
      setStatesRevealed((list) => list.map((done, index) => (index === currentQuiz.colIndex ? true : done)));
    }

    const nextStep = stepIdx + 1;
    setStepIdx(nextStep);
    if (nextStep === quizFlow.length && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  };

  return (
    <ContentBlock shuku-edit-id="e-f4af078e-098a-45ce-abc2-40a595ab06ed"
      headingLevel={1}
      className="nrnn-unfolding"
      title="RNN 是怎么循环的？"
      subtitle="每天的天气是给定的输入，要决定的只有一件事：今天做什么菜。"
    >
      <div shuku-edit-id="e-5e7723ce-b11d-46a5-a9e8-307051bada6e" className="nrnn-unfolding__layout">
        <section shuku-edit-id="e-89da4f3a-992e-4bbc-bfd7-3d1baaf19bec" className={`nrnn-unfolding__diagram ${isAllDone ? 'is-simplified-mode' : ''}`} aria-label="RNN 的时间展开图与折叠图">
          <div shuku-edit-id="e-f92d5538-3edf-4d54-86af-527289dbb424" className="nrnn-unfolding__diagram-caption">
            <Typography shuku-edit-id="e-f5a05984-aa0c-4d87-b6d3-61314ceb752d" as="span" variant="bodySmall" tone="warning">
              {isAllDone ? '展开图 ➔ 经典单单元折叠对比' : '二维时间展开视图'}
            </Typography>
            <Typography shuku-edit-id="e-3c5b02f3-ea2c-412e-b6a0-4c4c6b2383f3" as="span" variant="bodySmall" tone="muted">
              {isAllDone ? '本质上每一时刻都在调用同一个单元' : '每一列都复用同一个核心网络'}
            </Typography>
          </div>

          <div shuku-edit-id="e-e8d0b466-4767-47c4-bb29-fc7dfca01dcb" className="nrnn-unfolding__stage-wrapper">
            <div shuku-edit-id="e-24dd4761-948d-47ee-a0a6-e5583e5fe6e2" className="nrnn-unfolding__diagram-stage">
              {/* 上一个时刻的输出 ➔ 下一个时刻的隐状态 */}
              <svg shuku-edit-id="e-2cfa75ec-0e9a-4c8e-a40d-496d0ca5ec7a" className="nrnn-unfolding__svg-overlay" viewBox="0 0 600 340" preserveAspectRatio="none" aria-hidden="true">
                <defs shuku-edit-id="e-c46e0f40-bdd2-4365-a663-4565caafcad5">
                  <marker shuku-edit-id="e-181cff9b-0a68-4f0c-af00-e8e6816a607f" id="loop-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path shuku-edit-id="e-7bb4e3b9-28e9-4276-a64e-5f38d0259c16" d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f59e0b" />
                  </marker>
                </defs>
                {[0, 1, 2, 3].map((col) => {
                  const fromX = 100 + col * 110;
                  const toX = 100 + (col + 1) * 110;
                  const isCurveActive = statesRevealed[col + 1];

                  return (
                    <path shuku-edit-id="e-36692342-b23f-4dbe-b5ad-0b6a8b53fef7"
                      key={`curve-${col}`}
                      d={`M ${fromX} 96 Q ${(fromX + toX) / 2} 132, ${toX} 118`}
                      className={`nrnn-unfolding__loop-curve ${isCurveActive ? 'is-active' : ''}`}
                      markerEnd={isCurveActive ? 'url(#loop-arrow)' : undefined}
                    />
                  );
                })}
              </svg>

              <div shuku-edit-id="e-a3559909-e0a0-41f5-b2d7-0ed252aabc16" className="nrnn-unfolding__timeline">
                <Typography shuku-edit-id="e-a2ee89f7-6004-439a-acb9-a0e573ad1a32" as="span" variant="bodySmall" tone="muted" className="nrnn-unfolding__row-label" style={{ gridRow: 1 }}>输出</Typography>
                <Typography shuku-edit-id="e-7fca694f-17bf-4eea-a99d-8a156b47424f" as="span" variant="bodySmall" tone="muted" className="nrnn-unfolding__row-label" style={{ gridRow: 3 }}>隐状态</Typography>
                <Typography shuku-edit-id="e-94fc0c6a-829e-4bdb-b1dd-698d5be3fe3c" as="span" variant="bodySmall" tone="muted" className="nrnn-unfolding__row-label" style={{ gridRow: 5 }}>输入</Typography>

                {[0, 1, 2, 3, 4].map((col) => {
                  const isTargetCol = !isAllDone && currentQuiz.colIndex === col;
                  const isTargetOutput = isTargetCol && currentQuiz.type === 'output';
                  const isTargetState = isTargetCol && currentQuiz.type === 'state';
                  const outputRevealed = outputsRevealed[col];
                  const stateRevealed = statesRevealed[col];

                  return (
                    <Fragment key={`col-${col}`}>
                      {/* 输出 */}
                      <div shuku-edit-id="e-27ec6ec3-f260-4089-9a27-816ee681b9ee"
                        className={`nrnn-unfolding__slot${outputRevealed ? ' is-revealed' : ''}${isTargetOutput ? ' is-pulsing' : ''}`}
                        style={{ gridColumn: col + 2, gridRow: 1 }}
                        aria-label={`t${col + 1} 输出${outputRevealed ? `：${dishNames[outputs[col]]}` : '：待推导'}`}
                      >
                        {outputRevealed ? <DishIcon dish={outputs[col]} /> : <Typography shuku-edit-id="e-b66181b5-5d23-4e3c-9f15-a73575eef9d6" as="span" variant="h3" tone="muted">？</Typography>}
                      </div>
                      <div shuku-edit-id="e-6992e0d0-9ffe-41d3-aae7-b145b0ee2c5a" className="nrnn-unfolding__link" style={{ gridColumn: col + 2, gridRow: 2 }} aria-hidden="true" />

                      {/* 隐状态 */}
                      <div shuku-edit-id="e-59b91875-451e-46ef-a805-5c2aba65bd82"
                        className={`nrnn-unfolding__slot nrnn-unfolding__slot--state${stateRevealed ? ' is-revealed' : ''}${isTargetState ? ' is-pulsing' : ''}`}
                        style={{ gridColumn: col + 2, gridRow: 3 }}
                        aria-label={stateRevealed
                          ? `t${col + 1} 隐状态：${col === 0 ? `起点，${dishNames[states[0]]}` : dishNames[states[col]]}`
                          : `t${col + 1} 隐状态：待推导`}
                      >
                        {stateRevealed
                          ? <DishIcon dish={states[col]} />
                          : <Typography shuku-edit-id="e-ad128419-6a10-4e71-8045-97a6de666c8d" as="span" variant="h3" tone="muted">？</Typography>}
                      </div>
                      <div shuku-edit-id="e-37618018-e657-496c-873c-498ad56438df" className="nrnn-unfolding__link" style={{ gridColumn: col + 2, gridRow: 4 }} aria-hidden="true" />

                      {/* 输入：天气一开始就给定 */}
                      <div shuku-edit-id="e-eea592d6-f8a2-459e-9c00-58442795ad9b"
                        className="nrnn-unfolding__slot nrnn-unfolding__slot--input is-revealed"
                        style={{ gridColumn: col + 2, gridRow: 5 }}
                        aria-label={`t${col + 1} 输入：${weathers[col] === 'sun' ? '晴天' : '雨天'}`}
                      >
                        <WeatherIcon weather={weathers[col]} />
                      </div>

                      <Typography shuku-edit-id="e-b68ae10e-0399-46a8-bc9e-62e476ffc0ab" as="span" variant="bodySmall" tone="muted" className="nrnn-unfolding__time" style={{ gridColumn: col + 2, gridRow: 6 }}>
                        {`t${col + 1}`}
                      </Typography>
                    </Fragment>
                  );
                })}
              </div>
            </div>

            {isAllDone && (
              <div shuku-edit-id="e-f7d953d5-c17b-49d6-9633-e07b9bfcd7d5" className="nrnn-unfolding__simplify-indicator">
                <Typography shuku-edit-id="e-d685124f-2521-42e8-a2e3-72a60151376e" as="span" variant="bodySmall" tone="warning" className="nrnn-unfolding__simplify-label">
                  再简化 ➔
                </Typography>
              </div>
            )}
          </div>

          {!isAllDone && (
            <div shuku-edit-id="e-bcc2284f-c6eb-4900-879a-d05507daa91d" className="nrnn-unfolding__diagram-footer">
              <div shuku-edit-id="e-8afd9ca8-fcb9-4ed4-bd3f-5f87f986b80f" className="nrnn-unfolding__rule">
                <WeatherIcon weather="sun" className="nrnn-unfolding__rule-glyph" />
                <Typography shuku-edit-id="e-574a1330-1051-46f7-89fb-b7a6111a7d8e" as="span" variant="bodySmall" tone="muted">还做上一天那道菜</Typography>
                <span shuku-edit-id="e-04126e80-963c-4f33-b0d7-7aa92d311791" className="nrnn-unfolding__rule-divider" aria-hidden="true" />
                <WeatherIcon weather="rain" className="nrnn-unfolding__rule-glyph" />
                <Typography shuku-edit-id="e-185d3a7c-37f2-4b1c-9688-c324dbff33ff" as="span" variant="bodySmall" tone="muted">换下一道</Typography>
                <span shuku-edit-id="e-f811ef46-6499-4eda-bb7d-aed01cd5decb" className="nrnn-unfolding__rule-cycle">
                  <DishIcon dish="pie" />
                  <Typography shuku-edit-id="e-e71d62e1-5038-469c-8d96-1261ba9b1648" as="span" variant="bodySmall" tone="light">➔</Typography>
                  <DishIcon dish="steak" />
                  <Typography shuku-edit-id="e-5482fcc4-8bc7-4886-b25f-60c04ccafc6a" as="span" variant="bodySmall" tone="light">➔</Typography>
                  <DishIcon dish="burger" />
                </span>
              </div>
            </div>
          )}
        </section>

        <aside shuku-edit-id="e-08cfe47b-1fd3-4aae-937a-aa018ccead36" className={`nrnn-unfolding__explain${isAllDone ? ' is-done' : ''}`} aria-label="交互推导与解析">
          <div shuku-edit-id="e-582b2fd9-9268-4c77-9139-3cbd7cdb5ebd" className="nrnn-unfolding__explain-head">
            <Typography shuku-edit-id="e-d3b09d44-a25e-4dd1-a893-d2e4994bb6de" as="span" variant="bodySmall" tone="warning">
              {isAllDone ? '推导完成' : `第 ${stepIdx + 1} / ${quizFlow.length} 步 · ${currentQuiz.type === 'output' ? '决定输出' : '传递隐状态'}`}
            </Typography>
            <Typography shuku-edit-id="e-8a7310e1-4d23-4112-9fa8-fd44f883e66a" as="h2" variant="h3" tone="accent">
              {isAllDone
                ? '循环是怎么形成的'
                : (currentQuiz.type === 'output'
                  ? `t${currentQuiz.colIndex + 1} 输出什么？`
                  : `t${currentQuiz.colIndex + 1} 的隐状态是什么？`)}
            </Typography>
          </div>

          {!isAllDone ? (
            <div shuku-edit-id="e-09b33d0d-a86c-43be-8753-54e85f7a2019" className="nrnn-unfolding__quiz-box">
              <Typography shuku-edit-id="e-2aec7183-fbf9-4914-8ebe-9bc9a8207799" variant="body" tone="main" className="nrnn-unfolding__quiz-desc">
                {currentQuiz.questionText}
              </Typography>

              <div shuku-edit-id="e-87bf145d-98ef-4740-bb0a-2fabaefc9aa6" className="nrnn-unfolding__options-grid">
                {dishOptions.map((dish) => (
                  <button shuku-edit-id="e-a08b6566-39e6-4110-81b5-649112f1287b"
                    key={dish}
                    type="button"
                    className={`nrnn-unfolding__quiz-btn${wrongChoice === dish ? ' is-wrong' : ''}`}
                    aria-label={dishNames[dish]}
                    onClick={() => handleSelect(dish)}
                  >
                    <DishIcon dish={dish} />
                    <Typography shuku-edit-id="e-d7dcbe91-d6d2-4105-9e0d-b420ae149dd0" as="span" variant="bodySmall" tone="inherit" className="nrnn-unfolding__quiz-name">
                      {dishNames[dish]}
                    </Typography>
                  </button>
                ))}
              </div>

              {wrongChoice && (
                <div shuku-edit-id="e-1348d0c2-9885-420a-af34-63e8ed3a4769" className="nrnn-unfolding__feedback is-error">
                  <Typography shuku-edit-id="e-935b5df0-c9a7-4a84-97d9-26ee2b705598" as="span" variant="bodySmall" tone="inherit">
                    {currentQuiz.type === 'output'
                      ? '再对一次规则：晴天照做上一天那道菜，雨天换下一道。'
                      : '隐状态接住的，就是上一个时刻的输出。'}
                  </Typography>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* 折叠后的经典单单元：同一组参数被反复调用 */}
              <div shuku-edit-id="e-46ca82e5-eb83-4310-9dc2-0994d475c998" className="nrnn-unfolding__classic-unit">
                <svg shuku-edit-id="e-85180ae4-aeca-444d-a755-ec47a4646264" className="nrnn-unfolding__classic-canvas" viewBox="0 0 260 300">
                  <defs shuku-edit-id="e-258be658-1bee-4f64-862f-8592cc9d8271">
                    <marker shuku-edit-id="e-885059ca-786b-458a-a932-33d9f54b318c"
                      id="classic-loop-arrow"
                      viewBox="0 0 10 10"
                      refX="5"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path shuku-edit-id="e-95eafb26-b9ab-4b5b-bf12-3b1e1e847c5a" d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2563eb" />
                    </marker>
                    <linearGradient shuku-edit-id="e-51dfe666-d790-40b8-bbd7-aaa9407bcbfe" id="classic-h-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop shuku-edit-id="e-f0fdf7dd-46d1-4183-a692-03a0acc0e929" offset="0%" stopColor="#f7fbfc" />
                      <stop shuku-edit-id="e-b2f98750-510f-4b61-a6a5-706fd7a9df52" offset="100%" stopColor="#dce9ed" />
                    </linearGradient>
                  </defs>

                  <line shuku-edit-id="e-fd17cd02-2da1-4c73-b1e7-291a1723efe7" x1="60" y1="246" x2="60" y2="146" stroke="#a9bbc4" strokeWidth="2" />
                  <line shuku-edit-id="e-9fdc8e2b-ceef-4ba6-b810-431c0ea0e64b" x1="60" y1="146" x2="60" y2="46" stroke="#a9bbc4" strokeWidth="2" />

                  <path shuku-edit-id="e-3dd4e79a-c94f-4307-bf0b-6fa8689e9b16" d="M 86 135 C 120 105, 155 105, 175 124" fill="none" stroke="#2563eb" strokeWidth="2.2" markerEnd="url(#classic-loop-arrow)" />
                  <path shuku-edit-id="e-ea9f62f2-d5d7-4a87-8cd7-93bf63237472" d="M 175 168 C 155 190, 120 190, 86 157" fill="none" stroke="#2563eb" strokeWidth="2.2" markerEnd="url(#classic-loop-arrow)" />

                  <rect shuku-edit-id="e-72ed5408-4fb7-4d36-80a0-8e542df190c2"
                    x="145"
                    y="124"
                    width="60"
                    height="44"
                    rx="6"
                    fill="#ffffff"
                    stroke="#1e293b"
                    strokeWidth="2"
                    filter="drop-shadow(0 4px 8px rgba(0,0,0,0.06))"
                  />
                  <text shuku-edit-id="e-451b7cbe-8acb-46d9-8a2a-d86556d9106b" x="175" y="152" textAnchor="middle" fill="#0f172a" fontSize="20" fontWeight="bold" fontFamily="Inter, system-ui, sans-serif">W</text>

                  <g shuku-edit-id="e-67553f30-799f-4be8-af5c-03790cce4210" transform="translate(60, 46)">
                    <circle shuku-edit-id="e-a4b5ffc8-ec25-4010-93b1-06bc68fafc4a" r="26" fill="#f0fdf4" stroke="#22c55e" strokeWidth="2" />
                    <text shuku-edit-id="e-af0eed93-8e24-4c94-9e9b-c637c1b046ac" y="7" textAnchor="middle" fill="#15803d" fontSize="20" fontWeight="bold">O</text>
                  </g>
                  <g shuku-edit-id="e-691aee91-74d6-4864-ba4f-52f50903d1c1" transform="translate(60, 146)">
                    <circle shuku-edit-id="e-f9051761-0d31-4198-94fb-22f6b79c66e5" r="30" fill="url(#classic-h-grad)" stroke="#486c80" strokeWidth="2" filter="drop-shadow(0 6px 12px rgba(67,105,124,0.18))" />
                    <text shuku-edit-id="e-4dcea091-b694-4a95-a262-092feaf8db1d" y="7" textAnchor="middle" fill="#486c80" fontSize="22" fontWeight="bold">H</text>
                  </g>
                  <g shuku-edit-id="e-85c2e2e1-56c1-46e4-8f5c-8d213fbaed3d" transform="translate(60, 246)">
                    <circle shuku-edit-id="e-933841de-25f6-4455-9567-d347c3aaf294" r="26" fill="#fff7ed" stroke="#fb923c" strokeWidth="2" />
                    <text shuku-edit-id="e-edd79a21-0be6-475d-aa4a-572a72e0ee42" y="7" textAnchor="middle" fill="#c2410c" fontSize="20" fontWeight="bold">X</text>
                  </g>
                </svg>
              </div>

              <div shuku-edit-id="e-ec121be4-2980-49e0-a0ae-5f65f1df6fb2" className="nrnn-unfolding__summary-card">
                <Typography shuku-edit-id="e-39153014-9b2c-4c65-b5bb-33071778ebb8" variant="body" tone="success" className="nrnn-unfolding__summary-title">
                  循环就这样形成
                </Typography>
                <Typography shuku-edit-id="e-d7ef3a91-4a7c-44e0-ba32-88a7c000943a" variant="bodySmall" tone="main" className="nrnn-unfolding__summary-text">
                  上一个时刻的输出，被送进下一个时刻隐状态——这就是循环神经网络「循环」的由来。
                </Typography>
              </div>
            </>
          )}

          {!isAllDone && (
            <>
              <div shuku-edit-id="e-7314c6ff-85cc-4d78-a6ee-93d1e51db9cd" className="nrnn-unfolding__rationale-card">
                <Typography shuku-edit-id="e-fc373ef2-e4ae-45f8-a801-23033d317e76" as="span" variant="bodySmall" tone="muted">这一步为什么</Typography>
                <Typography shuku-edit-id="e-3274b283-3aa0-464c-a250-80a5dd8d3ea0" variant="bodySmall" tone="main">{currentQuiz.rationale}</Typography>
              </div>

              <div shuku-edit-id="e-caa6b76c-36a8-4341-b0a6-c4030df3c225" className="nrnn-unfolding__footer-tip">
                <Typography shuku-edit-id="e-fd291af1-53d8-4357-956c-e453bb07cfca" variant="bodySmall" tone="muted">
                  💡 上一个的输出 ➔ 下一个的隐状态。
                </Typography>
              </div>
            </>
          )}
        </aside>
      </div>
    </ContentBlock>
  );
}
