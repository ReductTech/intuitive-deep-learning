import { valueBasedRlAssetUrl } from '../../assetUrls';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Button, Typography } from '../../../shared/react';
import { LessonPage, Formula } from '../../components/LessonPrimitives';
import { TeachingPanel } from '../../components/TeachingPanel';
import { WarehouseMap } from '../../components/WarehouseMap';
import { ACTIONS, GOAL, keyOf, type Position } from '../../model';
import { TRAP } from '../QLearningLoopPage/qLearningSimulation';
import { TRANSITION_CASES, advanceTransitionLesson, chooseTransitionAction, chooseTransitionPolicy, createTransitionLesson, transitionActionProbabilities, type TransitionCase } from './transitionLesson';
import './TransitionLoopPage.css';

const robotArt = valueBasedRlAssetUrl('cover-v2/robot.png');
const emptyStationArt = valueBasedRlAssetUrl('cover-v2/receiving-station-empty.png');
const loadedStationArt = valueBasedRlAssetUrl('cover-v2/receiving-station-loaded.png');
const pitArt = valueBasedRlAssetUrl('cover-v2/maintenance-pit.png');

const coordinate = (position: Position) => '(' + (position.row + 1) + ', ' + (position.col + 1) + ')';
const signed = (value: number) => (value > 0 ? '+' : '') + value;
function DirectionArrow({ action, className = '' }: { action: number; className?: string }) {
  return <svg className={'vbrl-loop__direction-art ' + className} viewBox="0 0 64 64" aria-hidden="true">
    <path d="M26 59H38V28H51L32 7L13 28H26Z" transform={'rotate(' + action * 90 + ' 32 32)'} />
  </svg>;
}
function StageHeading({ number, title }: { number: number; title: string }) {
  return <header className="vbrl-loop__stage-heading">
    <Typography as="span" variant="bodySmall" tone="inherit" className="vbrl-loop__step-number">{number}</Typography>
    <Typography variant="bodySmall" tone="inherit">{title}</Typography>
  </header>;
}
export function TransitionLoopPage() {
  const [state, setState] = useState(createTransitionLesson), [playing, setPlaying] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { result, phase } = state, terminal = !!result?.done;
  const randomPolicy = state.policy === 'random', actionKnown = !randomPolicy || phase > 0;
  const probabilities = transitionActionProbabilities(state);
  const outcomeTone = result?.trapped ? 'danger' : result?.done ? 'success' : 'accent';
  const same = result && keyOf(result.next) === keyOf(state.from);
  const smallRobot = phase === 1 || same;
  const terminalRobot = [keyOf(GOAL), keyOf(TRAP)].includes(keyOf(state.position));
  const stageClass = (index: number) => 'vbrl-loop__stage' + (phase === index ? ' is-active' : phase > index ? ' is-complete' : ' is-pending');
  const delivered = !!result?.done && !result.trapped;
  const advanceLabel = phase === 0 ? randomPolicy ? '抽取动作' : '确认动作' : phase === 1 ? '执行动作' : phase === 2 ? '判断是否继续' : terminal ? '重新出发' : '继续下一步';
  const grid = (position: Position): CSSProperties => ({ gridRow: position.row + 1, gridColumn: position.col + 1 });
  function selectCase(caseId: TransitionCase) { setPlaying(false); setState(createTransitionLesson(caseId)); }
  function advance() { setPlaying(false); setState(advanceTransitionLesson); }
  useEffect(() => {
    if (!playing) return;
    if (phase === 3) { setPlaying(false); return; }
    const timer = window.setTimeout(() => setState(advanceTransitionLesson), 1100);
    return () => window.clearTimeout(timer);
  }, [playing, phase]);
  useEffect(() => {
    const pause = () => setPlaying(false), hidden = () => { if (document.hidden) pause(); };
    const observer = new IntersectionObserver(entries => { if (!entries[0].isIntersecting) pause(); });
    if (rootRef.current) observer.observe(rootRef.current); document.addEventListener('visibilitychange', hidden);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', hidden); };
  }, []);

  const explanation = phase === 0 ? randomPolicy ? '四向随机：每个方向各有 25% 概率，抽取后才确定本次动作。'
      : '策略决定怎样选动作。本例总选指定方向，也可切换为四向随机。'
    : phase === 1 ? (randomPolicy ? '随机策略抽出' : '指定方向策略选出') + ACTIONS[state.action] + '；执行后才收到环境反馈。'
    : phase === 2 ? result!.trapped ? '进入维修坑：奖励 −10，终止信号为 1，本回合结束。'
      : result!.done ? '送达也会终止：奖励 +10，终止信号为 1。'
      : result!.hit ? '碰撞只扣分：奖励 −3，终止信号为 0，仍可继续选动作。'
      : '普通移动：奖励 −1，终止信号为 0，下一步继续。'
    : terminal ? '终止信号为 1：停止本回合，重新出发后开始新回合。'
      : '终止信号为 0：把下一状态作为下一次策略的输入。';

  return <LessonPage className="vbrl-foundation-page vbrl-loop-page" title="强化学习循环：奖励、终止与策略"
    subtitle="策略决定怎样选动作，环境返回奖励、下一状态与终止信号，交互据此继续或结束。"
    footer={<div className="vbrl-loop__footer"><Typography variant="bodySmall" tone="accent">策略：给定状态，决定动作或动作概率。</Typography>
      <Typography variant="bodySmall" tone="accent">只看一步奖励，能判断这趟送货的表现吗？</Typography></div>}>
    <div className="vbrl-loop" ref={rootRef} data-case={state.caseId} data-phase={phase} data-playing={playing}
      data-position={keyOf(state.position)} data-from={keyOf(state.from)} data-action={state.action} data-interactions={state.interactions}
      data-reward={result?.reward} data-done={result?.done} data-hit={result?.hit} data-trapped={result?.trapped} data-episode={state.episode} data-policy={state.policy}
      onKeyDown={event => { if (event.key === ' ' && event.target instanceof HTMLElement && event.target.closest('button')) event.stopPropagation(); }}>
      <div className="vbrl-loop__toolbar">
        <div className="vbrl-loop__cases" role="group" aria-label="选择一种一步经历">
          <Typography variant="bodySmall" tone="muted">观察一种经历</Typography>
          {TRANSITION_CASES.map(scenario => <Button key={scenario.id} active={state.caseId === scenario.id} aria-pressed={state.caseId === scenario.id}
            aria-label={'观察' + scenario.label} onClick={() => selectCase(scenario.id)}>{scenario.label}</Button>)}
        </div>
        <div className="vbrl-loop__policies" role="group" aria-label="选择动作策略">
          <Typography variant="bodySmall" tone="muted">策略</Typography>
          <Button active={!randomPolicy} aria-pressed={!randomPolicy} disabled={phase !== 0} onClick={() => setState(previous => chooseTransitionPolicy(previous, 'direction'))}>指定方向</Button>
          <Button active={randomPolicy} aria-pressed={randomPolicy} disabled={phase !== 0} onClick={() => setState(previous => chooseTransitionPolicy(previous, 'random'))}>四向随机</Button>
        </div>
        <div className="vbrl-loop__transport">
          <Button variant="primary" aria-label="推进一步" onClick={advance}>{advanceLabel}</Button>
          <Button disabled={phase === 3} onClick={() => setPlaying(value => !value)}>{playing ? '暂停' : '播放本步'}</Button>
          <Button onClick={() => { setPlaying(false); setState(createTransitionLesson(state.caseId, state.policy)); }}>重置</Button>
        </div>
      </div>
      <div className="vbrl-loop__layout">
        <TeachingPanel title="选一个动作，观察实际结果" className="vbrl-loop__warehouse">
          <div className="vbrl-loop__map-layout">
          <WarehouseMap className="vbrl-loop__map" coordinates selected={state.from} robot={state.position} markers={{ [keyOf(TRAP)]: '!' }}
            goalArt={delivered ? loadedStationArt : emptyStationArt} dangerArt={pitArt}
            overlay={<div className="vbrl-loop__map-overlay">
              {result && <div className={'vbrl-loop__destination' + (same ? ' is-same' : '') + (result.trapped ? ' is-trap' : '')} style={grid(result.next)} />}
              {phase >= 1 && <svg className="vbrl-loop__action-arrow" style={grid(state.from)} viewBox="0 0 100 100" aria-hidden="true">
                <path d="M50 89V66M42 74L50 66L58 74" transform={'rotate(' + state.action * 90 + ' 50 78)'} />
              </svg>}
              <div key={state.caseId + '-' + state.episode} className={'vbrl-loop__robot' + (smallRobot ? ' is-action' : '') + (terminalRobot ? ' is-terminal' : '')}
                style={{ '--loop-row': state.position.row, '--loop-col': state.position.col } as CSSProperties}><img src={robotArt} alt="执行所选动作的机器人" /></div>
            </div>} />
          <div className="vbrl-loop__directions" role="group" aria-label="选择本次动作">
            {ACTIONS.map((label, action) => <Button key={label} aria-label={'选择' + label} active={actionKnown && state.action === action} aria-pressed={actionKnown && state.action === action}
              disabled={phase !== 0 || randomPolicy} onClick={() => setState(previous => chooseTransitionAction(previous, action))}>
              <span className="vbrl-loop__direction-content" aria-hidden="true"><DirectionArrow action={action} />
                <Typography as="span" variant="bodySmall" tone="accent">{label}</Typography></span>
            </Button>)}
          </div>
          </div>
          <div className="vbrl-loop__map-caption">
            <Typography variant="bodySmall" tone="accent">{result ? '起点 ' + coordinate(state.from) : '当前位置 ' + coordinate(state.from)}</Typography>
            {result && <><DirectionArrow action={1} /><Typography variant="bodySmall" tone={result.trapped ? 'danger' : 'success'}>{'新位置 ' + coordinate(result.next)}</Typography></>}
          </div>
        </TeachingPanel>
        <TeachingPanel title="依据什么选动作？动作后返回什么？" className="vbrl-loop__sequence">
          <div className="vbrl-loop__diagram">
            <div className="vbrl-loop__flow">
              <section className={stageClass(0)} data-stage="0" aria-label="策略根据状态选择动作">
                <StageHeading number={1} title="策略" />
                <div className="vbrl-loop__policy-content">
                  <div className="vbrl-loop__policy-state"><Formula latex={String.raw`s_t`} /><Typography variant="bodySmall" tone="accent">{coordinate(state.from)}</Typography></div>
                  <Formula latex={String.raw`\pi(a\mid s_t)`} />
                  <div className="vbrl-loop__probabilities" aria-label="四个方向的动作概率">
                    {probabilities.map((probability, action) => <div key={action} data-probability-action={action} data-probability={probability}>
                      <DirectionArrow action={action} /><Typography variant="bodySmall" tone={probability ? 'accent' : 'muted'}>{Math.round(probability * 100)}%</Typography>
                    </div>)}
                  </div>
                </div>
              </section>
              <DirectionArrow action={1} className={'vbrl-loop__link' + (phase >= 1 ? ' is-reached' : '')} />
              <section className={stageClass(1)} data-stage="1" aria-label="选择动作">
                <StageHeading number={2} title="选择动作" />
                <div className="vbrl-loop__action-content"><Formula latex={String.raw`a_t`} />
                  {actionKnown ? <DirectionArrow action={state.action} /> : <Typography variant="h2" tone="muted">？</Typography>}
                  <Typography variant="bodySmall" tone={phase >= 1 ? 'warning' : 'accent'}>{actionKnown ? ACTIONS[state.action] : '等待抽取'}</Typography></div>
              </section>
              <DirectionArrow action={1} className={'vbrl-loop__link' + (phase >= 2 ? ' is-reached' : '')} />
              <section className={stageClass(2) + ' vbrl-loop__feedback'} data-stage="2" aria-label="环境反馈">
                <StageHeading number={3} title="环境反馈" />
                <div className="vbrl-loop__feedback-content"><div className="vbrl-loop__feedback-values">
                  <div className="vbrl-loop__reward"><div className="vbrl-loop__feedback-label"><Typography variant="bodySmall" tone="accent">奖励</Typography><Formula latex={String.raw`r_{t+1}`} /></div>
                    <div className="vbrl-loop__reward-value"><Typography variant="h2" tone={result ? result.reward > 0 ? 'success' : 'danger' : 'muted'}>{result ? signed(result.reward) : '—'}</Typography></div></div>
                  <div className="vbrl-loop__next"><div className="vbrl-loop__feedback-label"><Typography variant="bodySmall" tone="accent">下一状态</Typography><Formula latex={String.raw`s_{t+1}`} /></div>
                    <div className={'vbrl-loop__next-value' + (!result ? ' is-unknown' : '')} key={result ? state.interactions : 'pending'}>
                      <img src={robotArt} alt="" /><Typography variant="bodySmall" tone={result ? result.trapped ? 'danger' : 'success' : 'muted'}>{result ? coordinate(result.next) : '待返回'}</Typography></div></div>
                </div><div className={'vbrl-loop__terminal-feedback' + (terminal ? ' is-terminal' : '')}>
                  <Typography variant="bodySmall" tone="accent">终止</Typography>
                  <Formula latex={'d_{t+1}=' + (result ? Number(terminal) : '?')} />
                  <Typography variant="bodySmall" tone={result ? terminal ? outcomeTone : 'accent' : 'muted'}>{result ? terminal ? '回合结束' : '可以继续' : '待返回'}</Typography>
                </div></div>
              </section>
            </div>
            <div className={'vbrl-loop__return' + (phase === 3 ? ' is-active' : '') + (terminal ? ' is-terminal' : '')} data-stage="3">
              <svg viewBox="0 0 1000 120" preserveAspectRatio="none" aria-hidden="true">
                <path className="vbrl-loop__return-track" d={terminal ? 'M875 0V45Q875 72 848 72H500' : 'M875 0V45Q875 72 848 72H148Q120 72 120 45V8'} />
                {!terminal && <path className="vbrl-loop__return-tip" d="M107 23L120 8L133 23Z" />}
              </svg>
              <div className="vbrl-loop__return-label"><Typography as="span" variant="bodySmall" tone="inherit" className="vbrl-loop__step-number">4</Typography>
                <Typography variant="bodySmall" tone={phase === 3 ? terminal ? outcomeTone : 'accent' : 'muted'}>{!result ? '依据终止信号，决定是否继续' : terminal ? '已终止：重新开始新回合' : '未终止：下一状态交给策略'}</Typography></div>
            </div>
          </div>
          <div className={'vbrl-loop__explanation' + (result ? result.trapped ? ' is-danger' : result.done ? ' is-success' : ' has-feedback' : '')} aria-live="polite">
            <Typography variant="bodySmall" tone={outcomeTone}>{explanation}</Typography>
          </div>
        </TeachingPanel>
      </div>
    </div>
  </LessonPage>;
}
