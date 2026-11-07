import { Fragment, useRef, useState } from 'react';
import { ContentBlock, Typography } from '../../../shared/react';
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
    <ContentBlock
      headingLevel={1}
      className="nrnn-unfolding"
      title="RNN 是怎么循环的？"
      subtitle="每天的天气是给定的输入，要决定的只有一件事：今天做什么菜。"
    >
      <div className="nrnn-unfolding__layout">
        <section className={`nrnn-unfolding__diagram ${isAllDone ? 'is-simplified-mode' : ''}`} aria-label="RNN 的时间展开图与折叠图">
          <div className="nrnn-unfolding__diagram-caption">
            <Typography as="span" variant="bodySmall" tone="warning">
              {isAllDone ? '展开图 ➔ 经典单单元折叠对比' : '二维时间展开视图'}
            </Typography>
            <Typography as="span" variant="bodySmall" tone="muted">
              {isAllDone ? '本质上每一时刻都在调用同一个单元' : '每一列都复用同一个核心网络'}
            </Typography>
          </div>

          <div className="nrnn-unfolding__stage-wrapper">
            <div className="nrnn-unfolding__diagram-stage">
              {/* 上一个时刻的输出 ➔ 下一个时刻的隐状态 */}
              <svg className="nrnn-unfolding__svg-overlay" viewBox="0 0 600 340" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <marker id="loop-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f59e0b" />
                  </marker>
                </defs>
                {[0, 1, 2, 3].map((col) => {
                  const fromX = 100 + col * 110;
                  const toX = 100 + (col + 1) * 110;
                  const isCurveActive = statesRevealed[col + 1];

                  return (
                    <path
                      key={`curve-${col}`}
                      d={`M ${fromX} 96 Q ${(fromX + toX) / 2} 132, ${toX} 118`}
                      className={`nrnn-unfolding__loop-curve ${isCurveActive ? 'is-active' : ''}`}
                      markerEnd={isCurveActive ? 'url(#loop-arrow)' : undefined}
                    />
                  );
                })}
              </svg>

              <div className="nrnn-unfolding__timeline">
                <Typography as="span" variant="bodySmall" tone="muted" className="nrnn-unfolding__row-label" style={{ gridRow: 1 }}>输出</Typography>
                <Typography as="span" variant="bodySmall" tone="muted" className="nrnn-unfolding__row-label" style={{ gridRow: 3 }}>隐状态</Typography>
                <Typography as="span" variant="bodySmall" tone="muted" className="nrnn-unfolding__row-label" style={{ gridRow: 5 }}>输入</Typography>

                {[0, 1, 2, 3, 4].map((col) => {
                  const isTargetCol = !isAllDone && currentQuiz.colIndex === col;
                  const isTargetOutput = isTargetCol && currentQuiz.type === 'output';
                  const isTargetState = isTargetCol && currentQuiz.type === 'state';
                  const outputRevealed = outputsRevealed[col];
                  const stateRevealed = statesRevealed[col];

                  return (
                    <Fragment key={`col-${col}`}>
                      {/* 输出 */}
                      <div
                        className={`nrnn-unfolding__slot${outputRevealed ? ' is-revealed' : ''}${isTargetOutput ? ' is-pulsing' : ''}`}
                        style={{ gridColumn: col + 2, gridRow: 1 }}
                        aria-label={`t${col + 1} 输出${outputRevealed ? `：${dishNames[outputs[col]]}` : '：待推导'}`}
                      >
                        {outputRevealed ? <DishIcon dish={outputs[col]} /> : <Typography as="span" variant="h3" tone="muted">？</Typography>}
                      </div>
                      <div className="nrnn-unfolding__link" style={{ gridColumn: col + 2, gridRow: 2 }} aria-hidden="true" />

                      {/* 隐状态 */}
                      <div
                        className={`nrnn-unfolding__slot nrnn-unfolding__slot--state${stateRevealed ? ' is-revealed' : ''}${isTargetState ? ' is-pulsing' : ''}`}
                        style={{ gridColumn: col + 2, gridRow: 3 }}
                        aria-label={stateRevealed
                          ? `t${col + 1} 隐状态：${col === 0 ? `起点，${dishNames[states[0]]}` : dishNames[states[col]]}`
                          : `t${col + 1} 隐状态：待推导`}
                      >
                        {stateRevealed
                          ? <DishIcon dish={states[col]} />
                          : <Typography as="span" variant="h3" tone="muted">？</Typography>}
                      </div>
                      <div className="nrnn-unfolding__link" style={{ gridColumn: col + 2, gridRow: 4 }} aria-hidden="true" />

                      {/* 输入：天气一开始就给定 */}
                      <div
                        className="nrnn-unfolding__slot nrnn-unfolding__slot--input is-revealed"
                        style={{ gridColumn: col + 2, gridRow: 5 }}
                        aria-label={`t${col + 1} 输入：${weathers[col] === 'sun' ? '晴天' : '雨天'}`}
                      >
                        <WeatherIcon weather={weathers[col]} />
                      </div>

                      <Typography as="span" variant="bodySmall" tone="muted" className="nrnn-unfolding__time" style={{ gridColumn: col + 2, gridRow: 6 }}>
                        {`t${col + 1}`}
                      </Typography>
                    </Fragment>
                  );
                })}
              </div>
            </div>

            {isAllDone && (
              <div className="nrnn-unfolding__simplify-indicator">
                <Typography as="span" variant="bodySmall" tone="warning" className="nrnn-unfolding__simplify-label">
                  再简化 ➔
                </Typography>
              </div>
            )}
          </div>

          {!isAllDone && (
            <div className="nrnn-unfolding__diagram-footer">
              <div className="nrnn-unfolding__rule">
                <WeatherIcon weather="sun" className="nrnn-unfolding__rule-glyph" />
                <Typography as="span" variant="bodySmall" tone="muted">还做上一天那道菜</Typography>
                <span className="nrnn-unfolding__rule-divider" aria-hidden="true" />
                <WeatherIcon weather="rain" className="nrnn-unfolding__rule-glyph" />
                <Typography as="span" variant="bodySmall" tone="muted">换下一道</Typography>
                <span className="nrnn-unfolding__rule-cycle">
                  <DishIcon dish="pie" />
                  <Typography as="span" variant="bodySmall" tone="light">➔</Typography>
                  <DishIcon dish="steak" />
                  <Typography as="span" variant="bodySmall" tone="light">➔</Typography>
                  <DishIcon dish="burger" />
                </span>
              </div>
            </div>
          )}
        </section>

        <aside className={`nrnn-unfolding__explain${isAllDone ? ' is-done' : ''}`} aria-label="交互推导与解析">
          <div className="nrnn-unfolding__explain-head">
            <Typography as="span" variant="bodySmall" tone="warning">
              {isAllDone ? '推导完成' : `第 ${stepIdx + 1} / ${quizFlow.length} 步 · ${currentQuiz.type === 'output' ? '决定输出' : '传递隐状态'}`}
            </Typography>
            <Typography as="h2" variant="h3" tone="accent">
              {isAllDone
                ? '循环是怎么形成的'
                : (currentQuiz.type === 'output'
                  ? `t${currentQuiz.colIndex + 1} 输出什么？`
                  : `t${currentQuiz.colIndex + 1} 的隐状态是什么？`)}
            </Typography>
          </div>

          {!isAllDone ? (
            <div className="nrnn-unfolding__quiz-box">
              <Typography variant="body" tone="main" className="nrnn-unfolding__quiz-desc">
                {currentQuiz.questionText}
              </Typography>

              <div className="nrnn-unfolding__options-grid">
                {dishOptions.map((dish) => (
                  <button
                    key={dish}
                    type="button"
                    className={`nrnn-unfolding__quiz-btn${wrongChoice === dish ? ' is-wrong' : ''}`}
                    aria-label={dishNames[dish]}
                    onClick={() => handleSelect(dish)}
                  >
                    <DishIcon dish={dish} />
                    <Typography as="span" variant="bodySmall" tone="inherit" className="nrnn-unfolding__quiz-name">
                      {dishNames[dish]}
                    </Typography>
                  </button>
                ))}
              </div>

              {wrongChoice && (
                <div className="nrnn-unfolding__feedback is-error">
                  <Typography as="span" variant="bodySmall" tone="inherit">
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
              <div className="nrnn-unfolding__classic-unit">
                <svg className="nrnn-unfolding__classic-canvas" viewBox="0 0 260 300">
                  <defs>
                    <marker
                      id="classic-loop-arrow"
                      viewBox="0 0 10 10"
                      refX="5"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2563eb" />
                    </marker>
                    <linearGradient id="classic-h-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f7fbfc" />
                      <stop offset="100%" stopColor="#dce9ed" />
                    </linearGradient>
                  </defs>

                  <line x1="60" y1="246" x2="60" y2="146" stroke="#a9bbc4" strokeWidth="2" />
                  <line x1="60" y1="146" x2="60" y2="46" stroke="#a9bbc4" strokeWidth="2" />

                  <path d="M 86 135 C 120 105, 155 105, 175 124" fill="none" stroke="#2563eb" strokeWidth="2.2" markerEnd="url(#classic-loop-arrow)" />
                  <path d="M 175 168 C 155 190, 120 190, 86 157" fill="none" stroke="#2563eb" strokeWidth="2.2" markerEnd="url(#classic-loop-arrow)" />

                  <rect
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
                  <text x="175" y="152" textAnchor="middle" fill="#0f172a" fontSize="20" fontWeight="bold" fontFamily="Inter, system-ui, sans-serif">W</text>

                  <g transform="translate(60, 46)">
                    <circle r="26" fill="#f0fdf4" stroke="#22c55e" strokeWidth="2" />
                    <text y="7" textAnchor="middle" fill="#15803d" fontSize="20" fontWeight="bold">O</text>
                  </g>
                  <g transform="translate(60, 146)">
                    <circle r="30" fill="url(#classic-h-grad)" stroke="#486c80" strokeWidth="2" filter="drop-shadow(0 6px 12px rgba(67,105,124,0.18))" />
                    <text y="7" textAnchor="middle" fill="#486c80" fontSize="22" fontWeight="bold">H</text>
                  </g>
                  <g transform="translate(60, 246)">
                    <circle r="26" fill="#fff7ed" stroke="#fb923c" strokeWidth="2" />
                    <text y="7" textAnchor="middle" fill="#c2410c" fontSize="20" fontWeight="bold">X</text>
                  </g>
                </svg>
              </div>

              <div className="nrnn-unfolding__summary-card">
                <Typography variant="body" tone="success" className="nrnn-unfolding__summary-title">
                  循环就这样形成
                </Typography>
                <Typography variant="bodySmall" tone="main" className="nrnn-unfolding__summary-text">
                  上一个时刻的输出，被送进下一个时刻隐状态——这就是循环神经网络「循环」的由来。
                </Typography>
              </div>
            </>
          )}

          {!isAllDone && (
            <>
              <div className="nrnn-unfolding__rationale-card">
                <Typography as="span" variant="bodySmall" tone="muted">这一步为什么</Typography>
                <Typography variant="bodySmall" tone="main">{currentQuiz.rationale}</Typography>
              </div>

              <div className="nrnn-unfolding__footer-tip">
                <Typography variant="bodySmall" tone="muted">
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
