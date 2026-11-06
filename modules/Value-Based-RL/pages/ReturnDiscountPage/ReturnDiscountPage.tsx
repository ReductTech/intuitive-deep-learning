import { valueBasedRlAssetUrl } from '../../assetUrls';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Button, RangeControl, Typography } from '../../../shared/react';
import { LessonPage, Formula } from '../../components/LessonPrimitives';
import { TeachingPanel } from '../../components/TeachingPanel';
import { WarehouseMap } from '../../components/WarehouseMap';
import { ACTIONS, keyOf, type Position } from '../../model';
import { TRAP } from '../QLearningLoopPage/qLearningSimulation';
import { RETURN_EXPERIENCES, experienceReturn, rewardContribution } from './returnLesson';
import './ReturnDiscountPage.css';

const robotArt = valueBasedRlAssetUrl('cover-v2/robot.png');
const emptyStationArt = valueBasedRlAssetUrl('cover-v2/receiving-station-empty.png');
const loadedStationArt = valueBasedRlAssetUrl('cover-v2/receiving-station-loaded.png');
const pitArt = valueBasedRlAssetUrl('cover-v2/maintenance-pit.png');

const coordinate = (position: Position) => '(' + (position.row + 1) + ', ' + (position.col + 1) + ')';
const signed = (value: number, digits = 0) => (value > 0 ? '+' : '') + value.toFixed(digits).replace('-', '−');
const grid = (position: Position): CSSProperties => ({ gridRow: position.row + 1, gridColumn: position.col + 1 });

export function ReturnDiscountPage() {
  const [gamma, setGamma] = useState(1), [routeIndex, setRouteIndex] = useState(0);
  const [cursor, setCursor] = useState(0), [playing, setPlaying] = useState(false);
  const [moving, setMoving] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const experience = RETURN_EXPERIENCES[routeIndex], index = Math.max(0, cursor - 1);
  const step = experience.steps[index], position = experience.positions[cursor];
  const contribution = rewardContribution(step.reward, index, gamma);
  const factor = index === 0 ? '1' : gamma.toFixed(2) + '^{' + index + '}';
  const movement = ['行减 1，列不变', '列加 1，行不变', '行加 1，列不变', '列减 1，行不变'][step.action];
  const finished = cursor === experience.steps.length;
  function inspect(next: number) { setPlaying(false); setMoving(false); setCursor(next); }
  function walk() { setPlaying(false); setMoving(true); setCursor(value => value + 1); }
  function chooseRoute(next: number) { setPlaying(false); setMoving(false); setRouteIndex(next); setCursor(0); }
  function play() { if (finished) { setMoving(false); setCursor(0); } setPlaying(value => !value); }
  useEffect(() => {
    if (!playing) return;
    if (finished) { setPlaying(false); return; }
    const timer = window.setTimeout(() => { setMoving(true); setCursor(value => value + 1); }, 800);
    return () => window.clearTimeout(timer);
  }, [playing, cursor, finished]);
  useEffect(() => {
    const pause = () => setPlaying(false), hidden = () => { if (document.hidden) pause(); };
    const observer = new IntersectionObserver(entries => { if (!entries[0].isIntersecting) pause(); });
    if (rootRef.current) observer.observe(rootRef.current);
    document.addEventListener('visibilitychange', hidden);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', hidden); };
  }, []);

  return <LessonPage className="vbrl-foundation-page vbrl-return-page" title="回报与折扣：这趟送货能得到多少分？"
    subtitle="回报把之后的多个奖励累计起来，折扣因子决定远期奖励的权重。"
    footer="奖励 r：某一步收到的反馈；回报 G：从当前时刻往后，多个奖励累计得到的分数。">
    <div className="vbrl-return-layout" ref={rootRef} data-route={experience.id} data-cursor={cursor} data-gamma={gamma} data-playing={playing}>
      <TeachingPanel title="送货经历：点选奖励回看一步" className="vbrl-return-map-panel">
        <div className="vbrl-return__scene">
          <WarehouseMap coordinates className="vbrl-return__map" robot={position} selected={step.from}
            markers={{ [keyOf(TRAP)]: '!' }} goalArt={finished ? loadedStationArt : emptyStationArt} dangerArt={pitArt}
            trails={[
              { points: experience.positions, color: '#b5cee9', dashed: true },
              { points: experience.positions.slice(0, cursor + 1), color: '#2c8df5' },
            ]}
            overlay={<div className="vbrl-return__map-overlay">
              {cursor > 0 && <div className="vbrl-return__destination" style={grid(step.next)} />}
              <div className={'vbrl-return__robot' + (moving ? ' is-moving' : '') + (finished ? ' is-delivered' : '')}
                style={{ '--return-row': position.row, '--return-col': position.col } as CSSProperties}><img src={robotArt} alt="沿记录路线移动的机器人" /></div>
            </div>} />
          <div className="vbrl-return__step-detail" aria-live="polite">
            <div className="vbrl-return__action-detail">
              <div className="vbrl-return__action-heading">
                <Typography as="span" variant="bodySmall" tone="accent" className="vbrl-return__step-badge">{cursor ? '第 ' + cursor + ' 步' : '待出发'}</Typography>
                <div className="vbrl-return__action-name"><svg viewBox="0 0 40 40" aria-hidden="true">
                  <path d="M20 34V6M10 16L20 6L30 16" transform={'rotate(' + step.action * 90 + ' 20 20)'} /></svg>
                  <Typography as="span" variant="bodySmall" tone="accent">{ACTIONS[step.action]}</Typography></div>
              </div>
              <Typography variant="bodySmall" tone="muted">{movement}</Typography>
            </div>
            <div className="vbrl-return__positions">
              <Typography variant="bodySmall" tone="muted">位置（行，列）</Typography>
              <div className="vbrl-return__position-pair">
                <div><Typography variant="bodySmall" tone="muted">移动前</Typography>
                  <Typography variant="bodySmall" tone="accent">{coordinate(step.from)}</Typography></div>
                <div><Typography variant="bodySmall" tone="muted">移动后</Typography>
                  <Typography variant="bodySmall" tone="accent">{coordinate(step.next)}</Typography></div>
              </div>
            </div>
            <div className={'vbrl-return__reward-detail' + (step.reward > 0 ? ' is-positive' : '')}>
              <Typography variant="bodySmall" tone="muted">{cursor ? '单步奖励' : '下一步奖励'}</Typography>
              <Typography variant="h2" tone={step.reward > 0 ? 'success' : 'danger'}>{signed(step.reward)}</Typography>
            </div>
            <div className="vbrl-return__transport">
              <Button disabled={finished} onClick={walk}>走一步</Button>
              <Button variant="primary" onClick={play}>{playing ? '暂停' : finished ? '重播' : '播放'}</Button>
              <Button onClick={() => inspect(0)}>回到起点</Button>
            </div>
          </div>
        </div>
        <div className="vbrl-return__timeline" role="group" aria-label="这趟经历的每步奖励，点击回看">
          <div className="vbrl-return__timeline-row" style={{ '--return-steps': experience.steps.length } as CSSProperties}>
            <Typography variant="bodySmall" tone="muted">步数</Typography>
            {experience.steps.map((_, i) => <Typography key={i} variant="bodySmall" tone={i === cursor - 1 ? 'accent' : 'muted'} align="center">{i + 1}</Typography>)}
          </div>
          <div className="vbrl-return__timeline-row" style={{ '--return-steps': experience.steps.length } as CSSProperties}>
            <Typography variant="bodySmall" tone="accent">奖励</Typography>
            {experience.steps.map((entry, i) => <Button key={i} className="vbrl-return__reward-cell" active={i === cursor - 1}
              aria-pressed={i === cursor - 1} aria-label={'回看第' + (i + 1) + '步，奖励' + signed(entry.reward)}
              data-reward-step={i + 1} onClick={() => inspect(i + 1)}>
              <Typography as="span" variant="bodySmall" tone={entry.reward > 0 ? 'success' : 'accent'}>{signed(entry.reward)}</Typography>
            </Button>)}
          </div>
        </div>
      </TeachingPanel>
      <div className="vbrl-return__explanation">
        <TeachingPanel title="回报：把之后的奖励累计起来" className="vbrl-return__definition">
          <Formula latex={'G_t=r_{t+1}+\\gamma r_{t+2}+\\gamma^2r_{t+3}+\\cdots'} />
          <div className="vbrl-return__contribution" data-contribution={contribution}>
            <Typography variant="bodySmall" tone="accent">第 {index + 1} 步 · {index === 0 ? '不折扣' : '折扣 ' + index + ' 次'}</Typography>
            <Formula latex={(step.reward < 0 ? '(' + step.reward + ')' : String(step.reward)) + '\\times ' + factor + '=' + contribution.toFixed(2)} />
          </div>
        </TeachingPanel>
        <TeachingPanel title="折扣：远期奖励占多大权重？" className="vbrl-return__discount">
          <RangeControl label="折扣因子 γ" min={0} max={1} step={.05} digits={2} value={gamma}
            onChange={event => setGamma(Number(event.target.value))} />
          <div className="vbrl-return__comparison" role="group" aria-label="选择一条真实送货经历">
            {RETURN_EXPERIENCES.map((route, i) => <Button key={route.id} className={'vbrl-return__route-card' + (i ? ' is-detour' : '')}
              active={i === routeIndex} aria-pressed={i === routeIndex} aria-label={'查看' + route.label + '，' + route.steps.length + '步'}
              data-return-route={route.id} data-return={experienceReturn(route, gamma)} onClick={() => chooseRoute(i)}>
              <Typography as="span" variant="bodySmall" tone={i ? 'warning' : 'accent'}>{route.steps.length} 步{route.label}</Typography>
              <span className="vbrl-return__route-value"><Typography as="span" variant="bodySmall" tone="muted">回报</Typography>
                <Typography as="span" variant="h2" tone={i ? 'warning' : 'accent'}>{signed(experienceReturn(route, gamma), 2)}</Typography></span>
              <Typography as="span" variant="bodySmall" tone="muted">送达奖励权重 {(gamma ** (route.steps.length - 1)).toFixed(2)}</Typography>
            </Button>)}
          </div>
          <Typography variant="bodySmall" tone="accent" className="vbrl-return__insight">{gamma === 0
            ? '只看第一步：两条路线都是 −1，无法分出高低。' : gamma === 1
              ? 'γ = 1：所有奖励直接相加；绕行多收到两次 −1。'
              : '同样送达，越晚收到的 +10 权重越小。'}</Typography>
        </TeachingPanel>
      </div>
    </div>
  </LessonPage>;
}
