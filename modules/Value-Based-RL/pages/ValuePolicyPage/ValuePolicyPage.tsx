import { valueBasedRlAssetUrl } from '../../assetUrls';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Button, Typography } from '../../../shared/react';
import { LessonPage, Formula } from '../../components/LessonPrimitives';
import { TeachingPanel } from '../../components/TeachingPanel';
import { WarehouseMap } from '../../components/WarehouseMap';
import { START, ACTIONS, keyOf, seededRandom } from '../../model';
import { TRAP, warehouseStep } from '../QLearningLoopPage/qLearningSimulation';
import snapshot from '../QTablePage/qTableSnapshot.json';
import { createPolicySimulation, policyProbabilities, roundedPercentages, samplePolicyAction, trainPolicy } from './policySimulation';
import './ValuePolicyPage.css';

const robotArt = valueBasedRlAssetUrl('cover-v2/robot.png');
const receivingEmpty = valueBasedRlAssetUrl('cover-v2/receiving-station-empty.png');
const pitArt = valueBasedRlAssetUrl('cover-v2/maintenance-pit.png');

const q = snapshot.q['5:1'], best = q.indexOf(Math.max(...q));
type Choice = { method: 'value' | 'policy'; action: number; next: typeof START };
const coordinate = (p: typeof START) => `(${p.row + 1},${p.col + 1})`;
function Direction({ action }: { action: number }) {
  return <svg className="vbrl-policy__direction" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M9 21V10H3L12 1L21 10H15V21Z" transform={`rotate(${action * 90} 12 12)`} />
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
    footer={<Typography variant="bodySmall" tone="accent">可以。策略方法直接学习动作分布；Actor-Critic 进一步结合策略与价值评估。</Typography>}>
    <div className="vbrl-policy" data-episodes={policy.episodes} data-logits={policy.logits.join(',')}
      data-probabilities={probabilities.join(',')} data-mean-return={policy.lastBatch?.meanReturn} data-draws={draws}
      data-method={choice?.method} data-action={choice?.action} data-robot={keyOf(robot)} data-q-values={q.join(',')}
      onKeyDown={event => { if (event.key === ' ' && event.target instanceof HTMLElement && event.target.closest('button')) event.stopPropagation(); }}>
      <TeachingPanel title="同一个起点，两种选法" className="vbrl-policy__warehouse">
        <WarehouseMap coordinates className="vbrl-policy__map" robot={robot} selected={START}
          markers={{ [keyOf(TRAP)]: '!' }} dangerArt={pitArt} goalArt={receivingEmpty}
          trails={choice ? [{ points: [START, choice.next], color: choice.method === 'value' ? 'var(--ui-accent)' : 'var(--ui-success)' }] : []}
          overlay={<div className="vbrl-policy__map-overlay" aria-hidden="true"><div className="vbrl-policy__robot"
            style={{ '--policy-row': robot.row, '--policy-col': robot.col } as CSSProperties}><img src={robotArt} alt="" /></div></div>} />
        <Typography variant="bodySmall" tone={choice?.method === 'policy' ? 'success' : 'accent'} align="center" role="status">{feedback}</Typography>
        <div className="vbrl-policy__local-example"><Typography variant="bodySmall" tone="muted" align="center">每次都从（6,2）试走。<br />只学习第一步，后续策略固定。</Typography></div>
      </TeachingPanel>
      <div className="vbrl-policy__methods">
        <TeachingPanel title="已学的方法：先估计 Q 值，再选择" className="vbrl-policy__value">
          <div className="vbrl-policy__flow"><Formula latex={String.raw`s\to Q(s,\cdot)\to\arg\max_a Q(s,a)`} />
            <Typography variant="bodySmall" tone="muted">输出：长期评分</Typography></div>
          <div className="vbrl-policy__outputs" aria-label="真实 Q 表中的四个动作价值">
            {q.map((value, action) => <div key={action} data-action={action} className={'vbrl-policy__output' + (action === best ? ' is-best' : '')}>
              <div className="vbrl-policy__action"><Direction action={action} /><Typography variant="bodySmall" tone="accent">{ACTIONS[action]}</Typography></div>
              <Typography variant="bodySmall" tone={value < 0 ? 'danger' : 'success'}>{value.toFixed(2)}</Typography>
            </div>)}
          </div>
          <div className="vbrl-policy__value-control"><Typography variant="bodySmall" tone="muted">先比较四个估值，再取最大值。</Typography>
            <Button variant="primary" onClick={() => walk('value')}>比较 Q 并走一步</Button></div>
        </TeachingPanel>
        <TeachingPanel title="另一条路线：直接学习策略" className="vbrl-policy__direct">
          <div className="vbrl-policy__flow"><Formula latex={String.raw`s\to\pi_\theta(\cdot\mid s)\to a\sim\pi_\theta`} />
            <Typography variant="bodySmall" tone="success">输出：动作概率</Typography></div>
          <div className="vbrl-policy__outputs" aria-label="策略直接输出的四个动作概率">
            {probabilities.map((probability, action) => <div key={action} data-action={action} data-probability={probability}
              className={'vbrl-policy__output vbrl-policy__probability' + (choice?.method === 'policy' && choice.action === action ? ' is-selected' : '')}>
              <div className="vbrl-policy__probability-label"><div className="vbrl-policy__action"><Direction action={action} /><Typography variant="bodySmall" tone="accent">{ACTIONS[action]}</Typography></div>
                <Typography variant="bodySmall" tone="success">{percentages[action]}%</Typography></div>
              <div className="vbrl-policy__probability-track"><i style={{ width: `${probability * 100}%` }} /></div>
            </div>)}
          </div>
          <div className="vbrl-policy__learning-flow" aria-label="策略的学习依据">
            {['交互经历', '累计回报', '调整策略参数', '新的动作概率'].map((text, index) => <div key={text}><Typography variant="bodySmall" tone={index === 3 ? 'success' : 'accent'}>{text}</Typography>
              {index < 3 && <span aria-hidden="true">→</span>}</div>)}
          </div>
          <div className="vbrl-policy__controls"><Button variant="primary" onClick={() => walk('policy')}>按策略走一步</Button>
            <Button onClick={() => learn(1)}>学习 32 回合</Button><Button onClick={() => learn(10)}>学习 320 回合</Button><Button onClick={reset}>重置</Button></div>
          <Typography variant="bodySmall" tone="muted" className="vbrl-policy__stats" role="status">{policy.lastBatch
            ? `已学习 ${policy.episodes} 回合 · 最近 ${policy.lastBatch.episodes} 回合平均回报 ${policy.lastBatch.meanReturn.toFixed(2)}`
            : '初始四向各 25%；用送货回报更新概率，不读取 Q 表。'}</Typography>
        </TeachingPanel>
      </div>
    </div>
  </LessonPage>;
}
