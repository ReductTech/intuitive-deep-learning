import { valueBasedRlAssetUrl } from '../../assetUrls';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
import { LessonPage, Formula } from '../../components/LessonPrimitives';
import { TeachingPanel } from '../../components/TeachingPanel';
import { WarehouseMap } from '../../components/WarehouseMap';
import { ACTIONS, GOAL, keyOf, type Position } from '../../model';
import { TRAP } from '../QLearningLoopPage/qLearningSimulation';
import { TRANSITION_CASES, advanceTransitionLesson, chooseTransitionAction, chooseTransitionPolicy, createTransitionLesson, transitionActionProbabilities, type TransitionCase } from './transitionLesson';
import './TransitionLoopPage.css';

const robotArt = valueBasedRlAssetUrl("cover-v2/robot.webp");
const emptyStationArt = valueBasedRlAssetUrl("cover-v2/receiving-station-empty.webp");
const loadedStationArt = valueBasedRlAssetUrl("cover-v2/receiving-station-loaded.webp");
const pitArt = valueBasedRlAssetUrl("cover-v2/maintenance-pit.webp");

const coordinate = (position: Position) => '(' + (position.row + 1) + ', ' + (position.col + 1) + ')';
const signed = (value: number) => (value > 0 ? '+' : '') + value;
function DirectionArrow({ action, className = '' }: { action: number; className?: string }) {
  return <svg shuku-edit-id="e-e444903f-cd3d-4f10-85ff-7fdb1788f95a" className={'vbrl-loop__direction-art ' + className} viewBox="0 0 64 64" aria-hidden="true">
    <path shuku-edit-id="e-ceb61989-cea7-4e1c-be83-9a221767e9e5" d="M26 59H38V28H51L32 7L13 28H26Z" transform={'rotate(' + action * 90 + ' 32 32)'} />
  </svg>;
}
function StageHeading({ number, title }: { number: number; title: string }) {
  return <header shuku-edit-id="e-7afc57c8-0e9a-41b0-8f26-1424561f8f45" className="vbrl-loop__stage-heading">
    <Typography shuku-edit-id="e-4de0d175-72f3-4a72-8f9d-87d91f0688a0" as="span" variant="bodySmall" tone="inherit" className="vbrl-loop__step-number">{number}</Typography>
    <Typography shuku-edit-id="e-4447a3d8-ca3c-4c3b-a9a2-fb5a348428c4" variant="bodySmall" tone="inherit">{title}</Typography>
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
    footer={<div shuku-edit-id="e-c6b78e51-36f6-4769-b835-0d26da4f7c8b" className="vbrl-loop__footer"><Typography shuku-edit-id="e-890a3e07-2125-4e98-b7de-23abd9904ad8" variant="bodySmall" tone="accent">策略：给定状态，决定动作或动作概率。</Typography>
      <Typography shuku-edit-id="e-d7c59efe-e2bc-41da-928e-971b188f8b24" variant="bodySmall" tone="accent">只看一步奖励，能判断这趟送货的表现吗？</Typography></div>}>
    <div shuku-edit-id="e-de5bb592-f3bb-47f6-b077-2f1e5d786821" className="vbrl-loop" ref={rootRef} data-case={state.caseId} data-phase={phase} data-playing={playing}
      data-position={keyOf(state.position)} data-from={keyOf(state.from)} data-action={state.action} data-interactions={state.interactions}
      data-reward={result?.reward} data-done={result?.done} data-hit={result?.hit} data-trapped={result?.trapped} data-episode={state.episode} data-policy={state.policy}
      onKeyDown={event => { if (event.key === ' ' && event.target instanceof HTMLElement && event.target.closest('button')) event.stopPropagation(); }}>
      <div shuku-edit-id="e-626d5191-c1c6-4fe2-9b0a-efd1a188fceb" className="vbrl-loop__toolbar">
        <div shuku-edit-id="e-3e9725dd-0c4e-4f5b-8195-0910086bd737" className="vbrl-loop__cases" role="group" aria-label="选择一种一步经历">
          <Typography shuku-edit-id="e-d882dfc8-aaea-4f52-8372-3d25d3599eff" variant="bodySmall" tone="muted">观察一种经历</Typography>
          {TRANSITION_CASES.map(scenario => <Button key={scenario.id} active={state.caseId === scenario.id} aria-pressed={state.caseId === scenario.id}
            aria-label={'观察' + scenario.label} onClick={() => selectCase(scenario.id)}>{scenario.label}</Button>)}
        </div>
        <div shuku-edit-id="e-a36e7c5e-51e0-46b2-bbf8-ad74701837c8" className="vbrl-loop__policies" role="group" aria-label="选择动作策略">
          <Typography shuku-edit-id="e-62deb41d-5f1f-4ed2-8f3d-348425923b21" variant="bodySmall" tone="muted">策略</Typography>
          <Button active={!randomPolicy} aria-pressed={!randomPolicy} disabled={phase !== 0} onClick={() => setState(previous => chooseTransitionPolicy(previous, 'direction'))}>指定方向</Button>
          <Button active={randomPolicy} aria-pressed={randomPolicy} disabled={phase !== 0} onClick={() => setState(previous => chooseTransitionPolicy(previous, 'random'))}>四向随机</Button>
        </div>
        <div shuku-edit-id="e-bc7a79bb-0f47-491e-b64f-df2bea2c3477" className="vbrl-loop__transport">
          <Button variant="primary" aria-label="推进一步" onClick={advance}>{advanceLabel}</Button>
          <Button disabled={phase === 3} onClick={() => setPlaying(value => !value)}>{playing ? '暂停' : '播放本步'}</Button>
          <Button onClick={() => { setPlaying(false); setState(createTransitionLesson(state.caseId, state.policy)); }}>重置</Button>
        </div>
      </div>
      <div shuku-edit-id="e-c3b70b63-8b75-499a-851a-3686e393f021" className="vbrl-loop__layout">
        <TeachingPanel title="选一个动作，观察实际结果" className="vbrl-loop__warehouse">
          <div shuku-edit-id="e-a7eb645d-c5f7-4ff3-a589-41f0a9c09494" className="vbrl-loop__map-layout">
          <WarehouseMap className="vbrl-loop__map" coordinates selected={state.from} robot={state.position} markers={{ [keyOf(TRAP)]: '!' }}
            goalArt={delivered ? loadedStationArt : emptyStationArt} dangerArt={pitArt}
            overlay={<div shuku-edit-id="e-b7bb662b-99ce-481e-9c1a-de5a30500f88" className="vbrl-loop__map-overlay">
              {result && <div shuku-edit-id="e-bfaf3ce6-7d86-49d2-a9a4-d842e3ef2dc5" className={'vbrl-loop__destination' + (same ? ' is-same' : '') + (result.trapped ? ' is-trap' : '')} style={grid(result.next)} />}
              {phase >= 1 && <svg shuku-edit-id="e-d50489ab-1fa4-45ee-8396-fe96980cc380" className="vbrl-loop__action-arrow" style={grid(state.from)} viewBox="0 0 100 100" aria-hidden="true">
                <path shuku-edit-id="e-c3c4851d-18be-49f3-8b7a-eb5651a7d138" d="M50 89V66M42 74L50 66L58 74" transform={'rotate(' + state.action * 90 + ' 50 78)'} />
              </svg>}
              <div shuku-edit-id="e-15c620e7-4be7-4264-942c-edb6d634983e" key={state.caseId + '-' + state.episode} className={'vbrl-loop__robot' + (smallRobot ? ' is-action' : '') + (terminalRobot ? ' is-terminal' : '')}
                style={{ '--loop-row': state.position.row, '--loop-col': state.position.col } as CSSProperties}><img shuku-edit-id="e-bb17dad0-bc8b-4ef3-a006-1dc9b1f9a771" src={robotArt} alt="执行所选动作的机器人" /></div>
            </div>} />
          <div shuku-edit-id="e-d9c01563-9227-487b-89f0-5076c0fa5846" className="vbrl-loop__directions" role="group" aria-label="选择本次动作">
            {ACTIONS.map((label, action) => <Button key={label} aria-label={'选择' + label} active={actionKnown && state.action === action} aria-pressed={actionKnown && state.action === action}
              disabled={phase !== 0 || randomPolicy} onClick={() => setState(previous => chooseTransitionAction(previous, action))}>
              <span shuku-edit-id="e-af8ca479-8613-4f6d-bf54-4524eb136c34" className="vbrl-loop__direction-content" aria-hidden="true"><DirectionArrow action={action} />
                <Typography shuku-edit-id="e-e7b1f1bf-bf50-494c-921c-df50f367d1cc" as="span" variant="bodySmall" tone="accent">{label}</Typography></span>
            </Button>)}
          </div>
          </div>
          <div shuku-edit-id="e-27900f7f-c464-405a-8e0b-d743cd2a5b3d" className="vbrl-loop__map-caption">
            <Typography shuku-edit-id="e-e6c62cee-8158-4cf9-874b-08003561dfa5" variant="bodySmall" tone="accent">{result ? '起点 ' + coordinate(state.from) : '当前位置 ' + coordinate(state.from)}</Typography>
            {result && <><DirectionArrow action={1} /><Typography shuku-edit-id="e-f9f73085-a3bb-4dcf-ae14-884a5febdd44" variant="bodySmall" tone={result.trapped ? 'danger' : 'success'}>{'新位置 ' + coordinate(result.next)}</Typography></>}
          </div>
        </TeachingPanel>
        <TeachingPanel title="依据什么选动作？动作后返回什么？" className="vbrl-loop__sequence">
          <div shuku-edit-id="e-873d9876-43c9-4051-a264-24f2016ce5fd" className="vbrl-loop__diagram">
            <div shuku-edit-id="e-82519aa7-15ca-4635-81da-a9150d71de38" className="vbrl-loop__flow">
              <section shuku-edit-id="e-d4e2709e-842b-4e59-a519-b38fc2bd3f74" className={stageClass(0)} data-stage="0" aria-label="策略根据状态选择动作">
                <StageHeading number={1} title="策略" />
                <div shuku-edit-id="e-a5aa85c0-4637-43ea-909f-84559801d478" className="vbrl-loop__policy-content">
                  <div shuku-edit-id="e-b8cf78cf-6821-41cb-8937-f2dada7089b6" className="vbrl-loop__policy-state"><Formula latex={String.raw`s_t`} /><Typography shuku-edit-id="e-ad3a6466-0261-4e74-9aa2-b3930175d69d" variant="bodySmall" tone="accent">{coordinate(state.from)}</Typography></div>
                  <Formula latex={String.raw`\pi(a\mid s_t)`} />
                  <div shuku-edit-id="e-e3b07a21-28a6-477b-93de-de0668c6e56d" className="vbrl-loop__probabilities" aria-label="四个方向的动作概率">
                    {probabilities.map((probability, action) => <div shuku-edit-id="e-101b0bcd-2e42-48dd-ba7a-14799169a4de" key={action} data-probability-action={action} data-probability={probability}>
                      <DirectionArrow action={action} /><Typography shuku-edit-id="e-fc65f8ef-ddc8-4472-8948-d7bf5526ea76" variant="bodySmall" tone={probability ? 'accent' : 'muted'}>{Math.round(probability * 100)}%</Typography>
                    </div>)}
                  </div>
                </div>
              </section>
              <DirectionArrow action={1} className={'vbrl-loop__link' + (phase >= 1 ? ' is-reached' : '')} />
              <section shuku-edit-id="e-fba94c43-d696-4234-a70c-dbf7eb63508b" className={stageClass(1)} data-stage="1" aria-label="选择动作">
                <StageHeading number={2} title="选择动作" />
                <div shuku-edit-id="e-a7832257-93fa-4efe-86c9-0d564c50aa2b" className="vbrl-loop__action-content"><Formula latex={String.raw`a_t`} />
                  {actionKnown ? <DirectionArrow action={state.action} /> : <Typography shuku-edit-id="e-9fbec838-76ee-4948-a1bf-a52cf7444a4b" variant="h2" tone="muted">？</Typography>}
                  <Typography shuku-edit-id="e-bcb67163-6274-4ed6-a449-51751fc434e5" variant="bodySmall" tone={phase >= 1 ? 'warning' : 'accent'}>{actionKnown ? ACTIONS[state.action] : '等待抽取'}</Typography></div>
              </section>
              <DirectionArrow action={1} className={'vbrl-loop__link' + (phase >= 2 ? ' is-reached' : '')} />
              <section shuku-edit-id="e-1c57ce2d-080c-4d1a-9a80-36cf775cf57f" className={stageClass(2) + ' vbrl-loop__feedback'} data-stage="2" aria-label="环境反馈">
                <StageHeading number={3} title="环境反馈" />
                <div shuku-edit-id="e-0fefbc24-c0d4-418e-8706-89329d311678" className="vbrl-loop__feedback-content"><div shuku-edit-id="e-91b69877-db04-4215-b5e9-5da714bd1366" className="vbrl-loop__feedback-values">
                  <div shuku-edit-id="e-6afb65b4-7ac7-4a7f-8cd1-afd696107917" className="vbrl-loop__reward"><div shuku-edit-id="e-3b719578-f71b-416c-95ec-2d1d3c46ce0d" className="vbrl-loop__feedback-label"><Typography shuku-edit-id="e-2afe2629-d02b-4fd4-902e-327ec2b92e41" variant="bodySmall" tone="accent">奖励</Typography><Formula latex={String.raw`r_{t+1}`} /></div>
                    <div shuku-edit-id="e-a3da8f13-a0a8-4fa9-a137-da4c910b18af" className="vbrl-loop__reward-value"><Typography shuku-edit-id="e-ab673a9e-9f57-4eaf-85ae-96ea548c33f2" variant="h2" tone={result ? result.reward > 0 ? 'success' : 'danger' : 'muted'}>{result ? signed(result.reward) : '—'}</Typography></div></div>
                  <div shuku-edit-id="e-47a8bbf3-b1d1-4e77-9dd0-6f0650e54021" className="vbrl-loop__next"><div shuku-edit-id="e-1413ebc3-df3c-4878-815a-8bdae8c3aff5" className="vbrl-loop__feedback-label"><Typography shuku-edit-id="e-8c46bbe8-3267-4b42-8686-7c5afd5dec3c" variant="bodySmall" tone="accent">下一状态</Typography><Formula latex={String.raw`s_{t+1}`} /></div>
                    <div shuku-edit-id="e-94065096-6ab7-49b7-9fba-14af26a6b6ee" className={'vbrl-loop__next-value' + (!result ? ' is-unknown' : '')} key={result ? state.interactions : 'pending'}>
                      <img shuku-edit-id="e-df438ee8-6354-4828-956d-4ed15c850ab0" src={robotArt} alt="" /><Typography shuku-edit-id="e-1462788f-b753-4c17-b3b9-8de14899315a" variant="bodySmall" tone={result ? result.trapped ? 'danger' : 'success' : 'muted'}>{result ? coordinate(result.next) : '待返回'}</Typography></div></div>
                </div><div shuku-edit-id="e-fe310d01-c1c2-4fd2-800e-b87ff480ef30" className={'vbrl-loop__terminal-feedback' + (terminal ? ' is-terminal' : '')}>
                  <Typography shuku-edit-id="e-c2f35745-98a2-4bb2-a0c6-f836cbcd5a79" variant="bodySmall" tone="accent">终止</Typography>
                  <Formula latex={'d_{t+1}=' + (result ? Number(terminal) : '?')} />
                  <Typography shuku-edit-id="e-259e993a-2c7d-4539-9da4-efd77c23fa3d" variant="bodySmall" tone={result ? terminal ? outcomeTone : 'accent' : 'muted'}>{result ? terminal ? '回合结束' : '可以继续' : '待返回'}</Typography>
                </div></div>
              </section>
            </div>
            <div shuku-edit-id="e-07250675-73c8-4600-b7d2-344085c6356b" className={'vbrl-loop__return' + (phase === 3 ? ' is-active' : '') + (terminal ? ' is-terminal' : '')} data-stage="3">
              <svg shuku-edit-id="e-cc92a306-33cb-4154-84cd-93f8c7beb519" viewBox="0 0 1000 120" preserveAspectRatio="none" aria-hidden="true">
                <path shuku-edit-id="e-5c58e7d1-cd5d-48ac-853f-5f668f9abbd4" className="vbrl-loop__return-track" d={terminal ? 'M875 0V45Q875 72 848 72H500' : 'M875 0V45Q875 72 848 72H148Q120 72 120 45V8'} />
                {!terminal && <path shuku-edit-id="e-3e17f6b7-73a5-47c4-8919-fbc86e29a1e8" className="vbrl-loop__return-tip" d="M107 23L120 8L133 23Z" />}
              </svg>
              <div shuku-edit-id="e-4eb43712-8a23-4e9b-957b-2a0d98e39d06" className="vbrl-loop__return-label"><Typography shuku-edit-id="e-69247cb5-9fae-473f-81e6-fb278b0308da" as="span" variant="bodySmall" tone="inherit" className="vbrl-loop__step-number">4</Typography>
                <Typography shuku-edit-id="e-adc97aa2-315e-4a90-8219-d380af15c188" variant="bodySmall" tone={phase === 3 ? terminal ? outcomeTone : 'accent' : 'muted'}>{!result ? '依据终止信号，决定是否继续' : terminal ? '已终止：重新开始新回合' : '未终止：下一状态交给策略'}</Typography></div>
            </div>
          </div>
          <div shuku-edit-id="e-7852b897-001a-4025-ada9-0bd35d41cd32" className={'vbrl-loop__explanation' + (result ? result.trapped ? ' is-danger' : result.done ? ' is-success' : ' has-feedback' : '')} aria-live="polite">
            <Typography shuku-edit-id="e-0b8cd0b4-d7cd-404f-aef8-d356f482555b" variant="bodySmall" tone={outcomeTone}>{explanation}</Typography>
          </div>
        </TeachingPanel>
      </div>
    </div>
  </LessonPage>;
}
