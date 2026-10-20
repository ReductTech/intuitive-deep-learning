import { valueBasedRlAssetUrl } from '../../assetUrls';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Button, Typography } from '../../../shared/react';
import { LessonPage } from '../../components/LessonPrimitives';
import { TeachingPanel } from '../../components/TeachingPanel';
import { WarehouseMap } from '../../components/WarehouseMap';
import { GOAL, START, keyOf } from '../../model';
import { DANGER } from './failureSimulation';
import examples from './rewardExamples.json';
import './FailureModesPage.css';

const robotArt = valueBasedRlAssetUrl('cover-v2/robot.png');
const receivingEmpty = valueBasedRlAssetUrl('cover-v2/receiving-station-empty.png');
const receivingLoaded = valueBasedRlAssetUrl('cover-v2/receiving-station-loaded.png');
const pitArt = valueBasedRlAssetUrl('cover-v2/maintenance-pit.png');

type CaseId = 'movement' | 'danger';
type Variant = 'problem' | 'improved';
const signed = (value: number) => (value > 0 ? '+' : value < 0 ? '−' : '') + Math.abs(value).toFixed(Number.isInteger(value) ? 0 : 1);
const titles: Record<CaseId, string> = { movement: '① 移动也加分', danger: '② 危险惩罚过轻' };
const descriptions: Record<CaseId, Record<Variant, string[]>> = {
  movement: {
    problem: ['移动也能持续得分，机器人学到绕圈。', '80 步得 160 分，却没有送达。'],
    improved: ['移动改为 −1 后，尽快送达更有利。', '学到的策略用 10 步安全送达。'],
  },
  danger: {
    problem: ['少走 4 步省下 4 分，危险却只多扣 0.5 分。', '策略选择 6 步抄近路，送达却经过危险区。'],
    improved: ['危险额外惩罚改为 −8 后，绕行更有利。', '策略改走 10 步，避开危险区送达。'],
  },
};

function RewardExample({ id }: { id: CaseId }) {
  const [variant, setVariant] = useState<Variant>('problem'), [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [visible, setVisible] = useState(false), [foreground, setForeground] = useState(!document.hidden);
  const rootRef = useRef<HTMLDivElement>(null), holdTicks = useRef(0);
  const run = examples.runs[variant === 'improved' ? 'aligned' : id], trace = run.trace;
  const robot = trace.positions[cursor] ?? START, complete = cursor === trace.actions.length;
  const arrived = complete && trace.delivered, smallRobot = keyOf(robot) === keyOf(GOAL) || keyOf(robot) === keyOf(DANGER);
  const score = trace.rewards.slice(0, cursor).reduce((sum, value) => sum + value, 0);
  const dangerEntries = trace.positions.slice(1, cursor + 1).filter(p => keyOf(p) === keyOf(DANGER)).length;
  const color = variant === 'improved' ? 'var(--ui-success)' : id === 'movement' ? 'var(--ui-accent-alt)' : 'var(--ui-danger)';
  const policy = useMemo(() => {
    const visited = new Set(trace.positions.slice(0, -1).map(keyOf));
    return Object.fromEntries(Object.entries(run.policy).filter(([key]) => visited.has(key)));
  }, [run]);
  const travelled = new Set(trace.positions.slice(0, cursor).map(keyOf));
  const chooseVariant = (next: Variant) => {
    setVariant(next); setCursor(0); holdTicks.current = 0;
    setPlaying(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  };
  useEffect(() => {
    const observer = new IntersectionObserver(entries => setVisible(entries[0].isIntersecting), { threshold: .15 });
    if (rootRef.current) observer.observe(rootRef.current);
    const visibility = () => setForeground(!document.hidden);
    document.addEventListener('visibilitychange', visibility);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  useEffect(() => {
    if (!playing || !visible || !foreground) return;
    const timer = window.setInterval(() => setCursor(previous => {
      if (previous < trace.actions.length) { holdTicks.current = 0; return previous + 1; }
      if (++holdTicks.current < 6) return previous;
      holdTicks.current = 0; return 0;
    }), 300);
    return () => window.clearInterval(timer);
  }, [playing, visible, foreground, trace]);
  const status = arrived ? dangerEntries ? '已送达 · 经过危险区' : '已送达 · 避开危险区'
    : complete ? '80 步后，仍未送达'
      : dangerEntries ? '已进入危险区 ' + dangerEntries + ' 次'
        : id === 'movement' && variant === 'problem' ? '持续移动，持续得分' : '正在执行送货策略';

  return <div ref={rootRef} className="vbrl-reward-example" style={{ '--reward-color': color } as CSSProperties}
    data-case={id} data-variant={variant} data-cursor={cursor} data-playing={playing}
    data-robot={keyOf(robot)} data-score={score} data-danger={dangerEntries} data-arrived={arrived}
    data-final-score={trace.score} data-outcome={trace.outcome} data-steps={trace.actions.length}
    data-movement={run.world.movement} data-penalty={run.world.dangerPenalty} data-updates={run.updates}>
    <TeachingPanel title={titles[id]}>
      <div className="vbrl-reward__scene">
        <WarehouseMap coordinates className="vbrl-reward__map" robot={robot}
          markers={{ [keyOf(DANGER)]: '!' }} dangerArt={pitArt} goalArt={arrived ? receivingLoaded : receivingEmpty}
          overlay={<div className="vbrl-reward__map-overlay" aria-hidden="true">
            <div className="vbrl-reward__policy-grid">{Object.entries(policy).map(([key, actions]) => {
              if (key === keyOf(robot)) return null;
              const [row, col] = key.split(':').map(Number), action = actions[0];
              return <svg key={key} data-policy-state={key} className={'vbrl-reward__policy-arrow' + (travelled.has(key) ? ' is-travelled' : '')}
                viewBox="0 0 24 24" style={{ gridRow: row + 1, gridColumn: col + 1 }}>
                <path data-policy-action={action} d="M12 19V5M6 11L12 5L18 11" transform={`rotate(${action * 90} 12 12)`} />
              </svg>;
            })}</div>
            <div className={'vbrl-reward__robot' + (smallRobot ? ' is-small' : '')}
            style={{ '--reward-row': robot.row, '--reward-col': robot.col } as CSSProperties}><img src={robotArt} alt="" /></div></div>} />
        <div className="vbrl-reward__details">
          <div className="vbrl-reward__rule">
            <Typography variant="bodySmall" tone="muted">{id === 'movement' ? '每次成功移动' : '进入危险区，额外扣分'}</Typography>
            <Typography variant="h2" tone={variant === 'improved' ? 'success' : 'warning'}>{signed(id === 'movement' ? run.world.movement : run.world.dangerPenalty)}</Typography>
            <Typography variant="bodySmall" tone="muted">{id === 'movement' ? '送达 +10 · 危险 −8' : '移动 −1 · 送达 +10'}</Typography>
          </div>
          <div className="vbrl-reward__score">
            <Typography variant="bodySmall" tone="muted">累计得分（不折扣）</Typography>
            <Typography variant="h2" tone={score < 0 ? 'danger' : 'success'}>{signed(score)}</Typography>
          </div>
          <div className="vbrl-reward__live" aria-live="off">
            <Typography variant="bodySmall" tone="accent">第 {cursor} / {trace.actions.length} 步</Typography>
            <Typography variant="bodySmall" tone={arrived && !dangerEntries ? 'success' : complete || dangerEntries ? 'danger' : 'muted'}>{status}</Typography>
          </div>
        </div>
      </div>
      <div className="vbrl-reward__controls">
        <div className="vbrl-reward__variants" role="group" aria-label="选择奖励设计">
          <Button active={variant === 'problem'} aria-pressed={variant === 'problem'} onClick={() => chooseVariant('problem')}>问题奖励</Button>
          <Button active={variant === 'improved'} aria-pressed={variant === 'improved'} onClick={() => chooseVariant('improved')}>改进奖励</Button>
        </div>
        <div className="vbrl-reward__playback">
          <Button aria-pressed={playing} onClick={() => { if (!playing && complete) { setCursor(0); holdTicks.current = 0; } setPlaying(value => !value); }}>{playing ? '暂停' : '播放'}</Button>
          <Button onClick={() => { setPlaying(false); holdTicks.current = 0; setCursor(previous => previous >= trace.actions.length ? 0 : previous + 1); }}>单步</Button>
          <Button onClick={() => { setCursor(0); holdTicks.current = 0; setPlaying(true); }}>重播</Button>
        </div>
      </div>
      <Typography variant="bodySmall" tone={variant === 'improved' ? 'success' : 'accent'} className="vbrl-reward__explanation">{descriptions[id][variant].join('\n')}</Typography>
    </TeachingPanel>
  </div>;
}

export function FailureModesPage() {
  return <LessonPage className="vbrl-foundation-page vbrl-reward-page" title="奖励设计：让高分真正对应完成任务"
    subtitle="奖励决定策略的优化方向，应让期望回报与任务目标保持一致。"
    footer={<Typography variant="bodySmall" tone="accent">同时检查得分、送达与安全。本页危险格可穿越，进入时仅追加扣分。</Typography>}>
    <div className="vbrl-reward" onKeyDown={event => {
      if (event.key === ' ' && event.target instanceof HTMLElement && event.target.closest('button')) event.stopPropagation();
    }}><RewardExample id="movement" /><RewardExample id="danger" /></div>
  </LessonPage>;
}
