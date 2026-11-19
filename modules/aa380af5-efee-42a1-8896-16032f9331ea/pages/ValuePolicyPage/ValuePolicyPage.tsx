import { valueBasedRlAssetUrl } from '../../assetUrls';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
import { LessonPage, Formula } from '../../components/LessonPrimitives';
import { TeachingPanel } from '../../components/TeachingPanel';
import { WarehouseMap } from '../../components/WarehouseMap';
import { START, ACTIONS, keyOf, seededRandom } from '../../model';
import { TRAP, warehouseStep } from '../QLearningLoopPage/qLearningSimulation';
import snapshot from '../QTablePage/qTableSnapshot.json';
import { createPolicySimulation, policyProbabilities, roundedPercentages, samplePolicyAction, trainPolicy } from './policySimulation';
import './ValuePolicyPage.css';

const robotArt = valueBasedRlAssetUrl("cover-v2/robot.webp");
const receivingEmpty = valueBasedRlAssetUrl("cover-v2/receiving-station-empty.webp");
const pitArt = valueBasedRlAssetUrl("cover-v2/maintenance-pit.webp");

const q = snapshot.q['5:1'], best = q.indexOf(Math.max(...q));
type Choice = { method: 'value' | 'policy'; action: number; next: typeof START };
const coordinate = (p: typeof START) => `(${p.row + 1},${p.col + 1})`;
function Direction({ action }: { action: number }) {
  return <svg shuku-edit-id="e-9249878b-0f8d-4b64-8069-a4f9fb9fa44b" className="vbrl-policy__direction" viewBox="0 0 24 24" aria-hidden="true">
    <path shuku-edit-id="e-d37c3b4b-6bb9-427d-bcc2-cae5a493d8d5" d="M9 21V10H3L12 1L21 10H15V21Z" transform={`rotate(${action * 90} 12 12)`} />
  </svg>;
}

export function ValuePolicyPage() {
  const [policy, setPolicy] = useState(createPolicySimulation), [choice, setChoice] = useState<Choice | null>(null);
  const [robot, setRobot] = useState(START), [draws, setDraws] = useState(0);
  const moveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const probabilities = policyProbabilities(policy.logits), percentages = roundedPercentages(probabilities);
  const clearMove = () => { if (moveTimer.current) clearTimeout(moveTimer.current); moveTimer.current = null; };
  useEffect(() => () => clearMove(), []);
  const walk = (method: Choice['method']) => {
    clearMove();
    const action = method === 'value' ? best : samplePolicyAction(probabilities, seededRandom(117 + draws * 199)());
    if (method === 'policy') setDraws(count => count + 1);
    const result = warehouseStep(START, action);
    setRobot(START); setChoice({ method, action, next: result.next });
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setRobot(result.next);
    else moveTimer.current = setTimeout(() => setRobot(result.next), 120);
  };
  const learn = (batches: number) => {
    clearMove(); setChoice(null); setRobot(START); setPolicy(previous => trainPolicy(previous, batches));
  };
  const reset = () => { clearMove(); setChoice(null); setRobot(START); setDraws(0); setPolicy(createPolicySimulation()); };
  const feedback = choice ? `${choice.method === 'value' ? '比较 Q 值' : '按策略抽样'} · ${ACTIONS[choice.action]} → ${coordinate(choice.next)}` : '按任一选法，在同一起点试走。';

  return <LessonPage className="vbrl-foundation-page vbrl-policy-page" title="不比较Q值，能直接学会选动作吗？"
    subtitle="策略方法直接学习动作选择规则，并用实际经历的回报改进策略。"
    footer={<Typography shuku-edit-id="e-610a9c44-c39a-407a-be2d-4ebb60cf81ba" variant="bodySmall" tone="accent">可以。策略方法直接学习动作分布；Actor-Critic 进一步结合策略与价值评估。</Typography>}>
    <div shuku-edit-id="e-be9426dc-ba01-4da5-b507-f24c36674409" className="vbrl-policy" data-episodes={policy.episodes} data-logits={policy.logits.join(',')}
      data-probabilities={probabilities.join(',')} data-mean-return={policy.lastBatch?.meanReturn} data-draws={draws}
      data-method={choice?.method} data-action={choice?.action} data-robot={keyOf(robot)} data-q-values={q.join(',')}
      onKeyDown={event => { if (event.key === ' ' && event.target instanceof HTMLElement && event.target.closest('button')) event.stopPropagation(); }}>
      <TeachingPanel title="同一个起点，两种选法" className="vbrl-policy__warehouse">
        <WarehouseMap coordinates className="vbrl-policy__map" robot={robot} selected={START}
          markers={{ [keyOf(TRAP)]: '!' }} dangerArt={pitArt} goalArt={receivingEmpty}
          trails={choice ? [{ points: [START, choice.next], color: choice.method === 'value' ? 'var(--ui-accent)' : 'var(--ui-success)' }] : []}
          overlay={<div shuku-edit-id="e-44f3740c-5807-4df7-a7a2-b115317a293a" className="vbrl-policy__map-overlay" aria-hidden="true"><div shuku-edit-id="e-ee750f48-4ffa-4815-9e64-a704869097e4" className="vbrl-policy__robot"
            style={{ '--policy-row': robot.row, '--policy-col': robot.col } as CSSProperties}><img shuku-edit-id="e-a32b700e-c114-4d20-b800-e6a7ec1dd573" src={robotArt} alt="" /></div></div>} />
        <Typography shuku-edit-id="e-db0bf61b-9c45-4405-ae80-3e499e8ce075" variant="bodySmall" tone={choice?.method === 'policy' ? 'success' : 'accent'} align="center" role="status">{feedback}</Typography>
        <div shuku-edit-id="e-a263713d-da0b-45d9-bc58-523fa16879e1" className="vbrl-policy__local-example"><Typography shuku-edit-id="e-6650486e-3dd8-49ac-8863-a3ccdc44b46e" variant="bodySmall" tone="muted" align="center">每次都从（6,2）试走。<br shuku-edit-id="e-4779e759-155e-4121-916d-9eb7c249bdf7" />只学习第一步，后续策略固定。</Typography></div>
      </TeachingPanel>
      <div shuku-edit-id="e-15061613-ef58-4dd0-9008-b014eb89e8af" className="vbrl-policy__methods">
        <TeachingPanel title="已学的方法：先估计 Q 值，再选择" className="vbrl-policy__value">
          <div shuku-edit-id="e-b8795bde-483f-4a6e-8c06-9152de15c7c3" className="vbrl-policy__flow"><Formula latex={String.raw`s\to Q(s,\cdot)\to\arg\max_a Q(s,a)`} />
            <Typography shuku-edit-id="e-728dd116-867c-4f23-a243-6dd71d3945e0" variant="bodySmall" tone="muted">输出：长期评分</Typography></div>
          <div shuku-edit-id="e-aa8d7479-7938-4415-8752-341e660a5470" className="vbrl-policy__outputs" aria-label="真实 Q 表中的四个动作价值">
            {q.map((value, action) => <div shuku-edit-id="e-b11457a7-b12d-4430-9408-6e749dadaa97" key={action} data-action={action} className={'vbrl-policy__output' + (action === best ? ' is-best' : '')}>
              <div shuku-edit-id="e-bd1ece1e-f177-4b45-b40c-c35a155cb648" className="vbrl-policy__action"><Direction action={action} /><Typography shuku-edit-id="e-87950e64-cbef-4633-a208-0fcff411249c" variant="bodySmall" tone="accent">{ACTIONS[action]}</Typography></div>
              <Typography shuku-edit-id="e-50fd14bf-cd2d-41a7-97c3-ad4652acacff" variant="bodySmall" tone={value < 0 ? 'danger' : 'success'}>{value.toFixed(2)}</Typography>
            </div>)}
          </div>
          <div shuku-edit-id="e-dd2db295-3af8-4747-8bfa-b6f746a85aac" className="vbrl-policy__value-control"><Typography shuku-edit-id="e-cb93178b-2406-40fd-80f1-9fb675f27344" variant="bodySmall" tone="muted">先比较四个估值，再取最大值。</Typography>
            <Button variant="primary" onClick={() => walk('value')}>比较 Q 并走一步</Button></div>
        </TeachingPanel>
        <TeachingPanel title="另一条路线：直接学习策略" className="vbrl-policy__direct">
          <div shuku-edit-id="e-7a3d3aa8-edfc-48fe-a03a-caa65cf90cfe" className="vbrl-policy__flow"><Formula latex={String.raw`s\to\pi_\theta(\cdot\mid s)\to a\sim\pi_\theta`} />
            <Typography shuku-edit-id="e-000d72b4-80aa-4d30-aa6f-a58aafbdd773" variant="bodySmall" tone="success">输出：动作概率</Typography></div>
          <div shuku-edit-id="e-f9f3d02f-242f-487f-a8ef-dc9427218ab1" className="vbrl-policy__outputs" aria-label="策略直接输出的四个动作概率">
            {probabilities.map((probability, action) => <div shuku-edit-id="e-98c8060c-0bd8-4639-804b-4e90bdecc896" key={action} data-action={action} data-probability={probability}
              className={'vbrl-policy__output vbrl-policy__probability' + (choice?.method === 'policy' && choice.action === action ? ' is-selected' : '')}>
              <div shuku-edit-id="e-fae76ee1-04d3-4d39-8ada-928b585f9f93" className="vbrl-policy__probability-label"><div shuku-edit-id="e-a24f2508-047a-4037-877e-a65abaf4bba7" className="vbrl-policy__action"><Direction action={action} /><Typography shuku-edit-id="e-4c9592f8-8e83-4298-ab98-43bed74dd703" variant="bodySmall" tone="accent">{ACTIONS[action]}</Typography></div>
                <Typography shuku-edit-id="e-2dc9ab8a-f9a1-4813-ae7d-109d567609aa" variant="bodySmall" tone="success">{percentages[action]}%</Typography></div>
              <div shuku-edit-id="e-ef852a28-a13a-423c-8363-751906c575bd" className="vbrl-policy__probability-track"><i shuku-edit-id="e-826f7c8c-31f8-4936-aeaf-58a37e21d591" style={{ width: `${probability * 100}%` }} /></div>
            </div>)}
          </div>
          <div shuku-edit-id="e-47cdebc6-e000-40bb-8a29-a9a75e308292" className="vbrl-policy__learning-flow" aria-label="策略的学习依据">
            {['交互经历', '累计回报', '调整策略参数', '新的动作概率'].map((text, index) => <div shuku-edit-id="e-b42d840b-ca0f-4ab5-a071-57d794c7146b" key={text}><Typography shuku-edit-id="e-183326a0-2031-4383-b953-80fbf628f430" variant="bodySmall" tone={index === 3 ? 'success' : 'accent'}>{text}</Typography>
              {index < 3 && <span shuku-edit-id="e-722fb9e9-3851-415d-a7bd-54bd31afd68f" aria-hidden="true">→</span>}</div>)}
          </div>
          <div shuku-edit-id="e-42c1e68f-bdb6-4bdd-b69f-f4296e028f6a" className="vbrl-policy__controls"><Button variant="primary" onClick={() => walk('policy')}>按策略走一步</Button>
            <Button onClick={() => learn(1)}>学习 32 回合</Button><Button onClick={() => learn(10)}>学习 320 回合</Button><Button onClick={reset}>重置</Button></div>
          <Typography shuku-edit-id="e-339ae8ef-dd75-4b78-aac1-5c2d62a2f14b" variant="bodySmall" tone="muted" className="vbrl-policy__stats" role="status">{policy.lastBatch
            ? `已学习 ${policy.episodes} 回合 · 最近 ${policy.lastBatch.episodes} 回合平均回报 ${policy.lastBatch.meanReturn.toFixed(2)}`
            : '初始四向各 25%；用送货回报更新概率，不读取 Q 表。'}</Typography>
        </TeachingPanel>
      </div>
    </div>
  </LessonPage>;
}
