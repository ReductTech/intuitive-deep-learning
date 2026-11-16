import { valueBasedRlAssetUrl } from '../../assetUrls';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
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

  return <div shuku-edit-id="e-05096736-bc1a-440a-93bc-bcab136f4934" ref={rootRef} className="vbrl-reward-example" style={{ '--reward-color': color } as CSSProperties}
    data-case={id} data-variant={variant} data-cursor={cursor} data-playing={playing}
    data-robot={keyOf(robot)} data-score={score} data-danger={dangerEntries} data-arrived={arrived}
    data-final-score={trace.score} data-outcome={trace.outcome} data-steps={trace.actions.length}
    data-movement={run.world.movement} data-penalty={run.world.dangerPenalty} data-updates={run.updates}>
    <TeachingPanel title={titles[id]}>
      <div shuku-edit-id="e-8723af27-5b6a-4030-85d7-2838516b426c" className="vbrl-reward__scene">
        <WarehouseMap coordinates className="vbrl-reward__map" robot={robot}
          markers={{ [keyOf(DANGER)]: '!' }} dangerArt={pitArt} goalArt={arrived ? receivingLoaded : receivingEmpty}
          overlay={<div shuku-edit-id="e-0eec4980-d67f-46b8-a174-7e257d48b61b" className="vbrl-reward__map-overlay" aria-hidden="true">
            <div shuku-edit-id="e-d1bc52cb-8dd3-4e9f-b9a6-ab24f060746f" className="vbrl-reward__policy-grid">{Object.entries(policy).map(([key, actions]) => {
              if (key === keyOf(robot)) return null;
              const [row, col] = key.split(':').map(Number), action = actions[0];
              return <svg shuku-edit-id="e-e6445d77-6577-4f31-a6bb-0c0de7c9cb03" key={key} data-policy-state={key} className={'vbrl-reward__policy-arrow' + (travelled.has(key) ? ' is-travelled' : '')}
                viewBox="0 0 24 24" style={{ gridRow: row + 1, gridColumn: col + 1 }}>
                <path shuku-edit-id="e-7f4bdd69-7a26-418c-b4ba-3f70754fa967" data-policy-action={action} d="M12 19V5M6 11L12 5L18 11" transform={`rotate(${action * 90} 12 12)`} />
              </svg>;
            })}</div>
            <div shuku-edit-id="e-65483f32-b3f0-439e-968f-39d40ddec7f8" className={'vbrl-reward__robot' + (smallRobot ? ' is-small' : '')}
            style={{ '--reward-row': robot.row, '--reward-col': robot.col } as CSSProperties}><img shuku-edit-id="e-19aee79b-9ca3-43c0-a683-7a62c950e5f5" src={robotArt} alt="" /></div></div>} />
        <div shuku-edit-id="e-0ef023ee-0ca3-4b28-bda2-0541645b3f54" className="vbrl-reward__details">
          <div shuku-edit-id="e-620e586f-7118-44cf-901e-a56009d0ce16" className="vbrl-reward__rule">
            <Typography shuku-edit-id="e-09305f95-20a4-4bbd-bff6-fecbe4d39b4d" variant="bodySmall" tone="muted">{id === 'movement' ? '每次成功移动' : '进入危险区，额外扣分'}</Typography>
            <Typography shuku-edit-id="e-b3b4fb22-62cb-4529-a122-4cef1ddf2cfa" variant="h2" tone={variant === 'improved' ? 'success' : 'warning'}>{signed(id === 'movement' ? run.world.movement : run.world.dangerPenalty)}</Typography>
            <Typography shuku-edit-id="e-f386da61-b550-413b-90d0-336e4240e7a7" variant="bodySmall" tone="muted">{id === 'movement' ? '送达 +10 · 危险 −8' : '移动 −1 · 送达 +10'}</Typography>
          </div>
          <div shuku-edit-id="e-ac4892d5-5639-42bb-9389-4450b503b8b4" className="vbrl-reward__score">
            <Typography shuku-edit-id="e-65f18bb6-0c49-42a3-9c60-6c1cae6365c5" variant="bodySmall" tone="muted">累计得分（不折扣）</Typography>
            <Typography shuku-edit-id="e-7523f30d-9594-4958-89f6-19ad4fcf8558" variant="h2" tone={score < 0 ? 'danger' : 'success'}>{signed(score)}</Typography>
          </div>
          <div shuku-edit-id="e-db6f5714-3316-4caf-9e06-3261badb42ce" className="vbrl-reward__live" aria-live="off">
            <Typography shuku-edit-id="e-3b4f6ff2-03be-46b7-9412-28927c9dec87" variant="bodySmall" tone="accent">第 {cursor} / {trace.actions.length} 步</Typography>
            <Typography shuku-edit-id="e-14251b82-20cc-4e9f-9ad8-48bc5ae13dfc" variant="bodySmall" tone={arrived && !dangerEntries ? 'success' : complete || dangerEntries ? 'danger' : 'muted'}>{status}</Typography>
          </div>
        </div>
      </div>
      <div shuku-edit-id="e-5f787240-eda9-4fd8-a1c1-894c32d2b027" className="vbrl-reward__controls">
        <div shuku-edit-id="e-d8d4981a-c3e4-4615-824d-eaf1c80f3a43" className="vbrl-reward__variants" role="group" aria-label="选择奖励设计">
          <Button active={variant === 'problem'} aria-pressed={variant === 'problem'} onClick={() => chooseVariant('problem')}>问题奖励</Button>
          <Button active={variant === 'improved'} aria-pressed={variant === 'improved'} onClick={() => chooseVariant('improved')}>改进奖励</Button>
        </div>
        <div shuku-edit-id="e-4fb45288-3569-4dd7-a081-d8270f3e1ab7" className="vbrl-reward__playback">
          <Button aria-pressed={playing} onClick={() => { if (!playing && complete) { setCursor(0); holdTicks.current = 0; } setPlaying(value => !value); }}>{playing ? '暂停' : '播放'}</Button>
          <Button onClick={() => { setPlaying(false); holdTicks.current = 0; setCursor(previous => previous >= trace.actions.length ? 0 : previous + 1); }}>单步</Button>
          <Button onClick={() => { setCursor(0); holdTicks.current = 0; setPlaying(true); }}>重播</Button>
        </div>
      </div>
      <Typography shuku-edit-id="e-c7b38ee5-366b-4d94-a65c-253f0d4f9a04" variant="bodySmall" tone={variant === 'improved' ? 'success' : 'accent'} className="vbrl-reward__explanation">{descriptions[id][variant].join('\n')}</Typography>
    </TeachingPanel>
  </div>;
}

export function FailureModesPage() {
  return <LessonPage className="vbrl-foundation-page vbrl-reward-page" title="奖励设计：让高分真正对应完成任务"
    subtitle="奖励决定策略的优化方向，应让期望回报与任务目标保持一致。"
    footer={<Typography shuku-edit-id="e-7c315c67-fbdc-4edf-baa5-a3f81d7ae803" variant="bodySmall" tone="accent">同时检查得分、送达与安全。本页危险格可穿越，进入时仅追加扣分。</Typography>}>
    <div shuku-edit-id="e-ca68c50b-dca5-4049-a264-7675de450df5" className="vbrl-reward" onKeyDown={event => {
      if (event.key === ' ' && event.target instanceof HTMLElement && event.target.closest('button')) event.stopPropagation();
    }}><RewardExample id="movement" /><RewardExample id="danger" /></div>
  </LessonPage>;
}
