import { valueBasedRlAssetUrl } from '../../assetUrls';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Button, RangeControl, Typography } from "@shuku/course-style/react";
import { LessonPage, Formula } from '../../components/LessonPrimitives';
import { TeachingPanel } from '../../components/TeachingPanel';
import { WarehouseMap } from '../../components/WarehouseMap';
import { ACTIONS, keyOf, type Position } from '../../model';
import { TRAP } from '../QLearningLoopPage/qLearningSimulation';
import { RETURN_EXPERIENCES, experienceReturn, rewardContribution } from './returnLesson';
import './ReturnDiscountPage.css';

const robotArt = valueBasedRlAssetUrl("cover-v2/robot.webp");
const emptyStationArt = valueBasedRlAssetUrl("cover-v2/receiving-station-empty.webp");
const loadedStationArt = valueBasedRlAssetUrl("cover-v2/receiving-station-loaded.webp");
const pitArt = valueBasedRlAssetUrl("cover-v2/maintenance-pit.webp");

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
    <div shuku-edit-id="e-b0d57248-5e38-4e80-8d15-5052b274620e" className="vbrl-return-layout" ref={rootRef} data-route={experience.id} data-cursor={cursor} data-gamma={gamma} data-playing={playing}>
      <TeachingPanel title="送货经历：点选奖励回看一步" className="vbrl-return-map-panel">
        <div shuku-edit-id="e-9688a538-be85-4896-a33b-9e511fe79ee9" className="vbrl-return__scene">
          <WarehouseMap coordinates className="vbrl-return__map" robot={position} selected={step.from}
            markers={{ [keyOf(TRAP)]: '!' }} goalArt={finished ? loadedStationArt : emptyStationArt} dangerArt={pitArt}
            trails={[
              { points: experience.positions, color: '#b5cee9', dashed: true },
              { points: experience.positions.slice(0, cursor + 1), color: '#2c8df5' },
            ]}
            overlay={<div shuku-edit-id="e-f894def8-bac9-4b74-9c06-f8095a8982eb" className="vbrl-return__map-overlay">
              {cursor > 0 && <div shuku-edit-id="e-e041afff-176b-42ef-99ba-c36db3aa1e54" className="vbrl-return__destination" style={grid(step.next)} />}
              <div shuku-edit-id="e-f22a54f2-4ce5-4bdf-a4d5-cba2ea4f9794" className={'vbrl-return__robot' + (moving ? ' is-moving' : '') + (finished ? ' is-delivered' : '')}
                style={{ '--return-row': position.row, '--return-col': position.col } as CSSProperties}><img shuku-edit-id="e-47118855-a2d3-4add-a4c5-2e14a5b38292" src={robotArt} alt="沿记录路线移动的机器人" /></div>
            </div>} />
          <div shuku-edit-id="e-2190f736-2e3f-4419-8b09-eca9a5df693f" className="vbrl-return__step-detail" aria-live="polite">
            <div shuku-edit-id="e-cb28152a-cb82-4094-8925-a78a1e4c2d95" className="vbrl-return__action-detail">
              <div shuku-edit-id="e-169306b0-258b-476d-b33d-a0459e2905a0" className="vbrl-return__action-heading">
                <Typography shuku-edit-id="e-a188927a-7153-4cd1-aee8-a97013f44e99" as="span" variant="bodySmall" tone="accent" className="vbrl-return__step-badge">{cursor ? '第 ' + cursor + ' 步' : '待出发'}</Typography>
                <div shuku-edit-id="e-ae23fc0f-1b1b-4765-aaaf-c932070192a2" className="vbrl-return__action-name"><svg shuku-edit-id="e-4fe25cc8-e521-4c89-aa8a-e88fefc678d8" viewBox="0 0 40 40" aria-hidden="true">
                  <path shuku-edit-id="e-3598b13f-0ccf-4a4f-a2e5-acc48ab4f27e" d="M20 34V6M10 16L20 6L30 16" transform={'rotate(' + step.action * 90 + ' 20 20)'} /></svg>
                  <Typography shuku-edit-id="e-e13f5823-ef0c-48fb-89ff-5548696866a4" as="span" variant="bodySmall" tone="accent">{ACTIONS[step.action]}</Typography></div>
              </div>
              <Typography shuku-edit-id="e-f8899e23-a43a-4861-a551-02854b5ff584" variant="bodySmall" tone="muted">{movement}</Typography>
            </div>
            <div shuku-edit-id="e-0f2c539a-d9af-4692-bb37-11276f3fa183" className="vbrl-return__positions">
              <Typography shuku-edit-id="e-7df2e60d-4c76-4f4d-9d3f-5c412d188930" variant="bodySmall" tone="muted">位置（行，列）</Typography>
              <div shuku-edit-id="e-20550182-3a9c-42a6-9a4d-905548ab057e" className="vbrl-return__position-pair">
                <div shuku-edit-id="e-bdb2448e-ce8d-4c63-a792-072ee6f86168"><Typography shuku-edit-id="e-e4f33e2a-f64e-4558-8f54-3230a0202328" variant="bodySmall" tone="muted">移动前</Typography>
                  <Typography shuku-edit-id="e-b82fdc3b-3523-4695-9caa-610a5fff96dd" variant="bodySmall" tone="accent">{coordinate(step.from)}</Typography></div>
                <div shuku-edit-id="e-854f1ceb-ca9b-498a-99e1-d33761651f11"><Typography shuku-edit-id="e-de943cf1-5789-4dd2-9964-bb8e2c1ad215" variant="bodySmall" tone="muted">移动后</Typography>
                  <Typography shuku-edit-id="e-00816232-09ad-4d55-bd03-a57ca951d5cc" variant="bodySmall" tone="accent">{coordinate(step.next)}</Typography></div>
              </div>
            </div>
            <div shuku-edit-id="e-51262ccd-0588-49c8-88eb-2215cb1557fe" className={'vbrl-return__reward-detail' + (step.reward > 0 ? ' is-positive' : '')}>
              <Typography shuku-edit-id="e-579bfa12-4c0d-4bb1-9257-8f26392a7f44" variant="bodySmall" tone="muted">{cursor ? '单步奖励' : '下一步奖励'}</Typography>
              <Typography shuku-edit-id="e-55f189da-2c3b-4e45-93e6-51e12cd115db" variant="h2" tone={step.reward > 0 ? 'success' : 'danger'}>{signed(step.reward)}</Typography>
            </div>
            <div shuku-edit-id="e-71d365da-1c98-4565-961b-5bae511ca1ac" className="vbrl-return__transport">
              <Button disabled={finished} onClick={walk}>走一步</Button>
              <Button variant="primary" onClick={play}>{playing ? '暂停' : finished ? '重播' : '播放'}</Button>
              <Button onClick={() => inspect(0)}>回到起点</Button>
            </div>
          </div>
        </div>
        <div shuku-edit-id="e-2320a656-375d-4709-9fd5-7422899d1db4" className="vbrl-return__timeline" role="group" aria-label="这趟经历的每步奖励，点击回看">
          <div shuku-edit-id="e-1c10de56-da73-4371-a9ac-f6399f9bcc0b" className="vbrl-return__timeline-row" style={{ '--return-steps': experience.steps.length } as CSSProperties}>
            <Typography shuku-edit-id="e-81a6f996-5efd-46f1-917e-25fec0ffd2b3" variant="bodySmall" tone="muted">步数</Typography>
            {experience.steps.map((_, i) => <Typography shuku-edit-id="e-80f21115-14a5-41e3-b0cc-e96098f10175" key={i} variant="bodySmall" tone={i === cursor - 1 ? 'accent' : 'muted'} align="center">{i + 1}</Typography>)}
          </div>
          <div shuku-edit-id="e-74900e24-2d5a-4005-9820-08223f1705ef" className="vbrl-return__timeline-row" style={{ '--return-steps': experience.steps.length } as CSSProperties}>
            <Typography shuku-edit-id="e-3439fdc1-88ad-480a-b772-d5287d0ce871" variant="bodySmall" tone="accent">奖励</Typography>
            {experience.steps.map((entry, i) => <Button key={i} className="vbrl-return__reward-cell" active={i === cursor - 1}
              aria-pressed={i === cursor - 1} aria-label={'回看第' + (i + 1) + '步，奖励' + signed(entry.reward)}
              data-reward-step={i + 1} onClick={() => inspect(i + 1)}>
              <Typography shuku-edit-id="e-a1d5a08b-6f6e-4a3e-b36f-29a4e43ac399" as="span" variant="bodySmall" tone={entry.reward > 0 ? 'success' : 'accent'}>{signed(entry.reward)}</Typography>
            </Button>)}
          </div>
        </div>
      </TeachingPanel>
      <div shuku-edit-id="e-2928273b-7578-4c67-b242-a02933edda7e" className="vbrl-return__explanation">
        <TeachingPanel title="回报：把之后的奖励累计起来" className="vbrl-return__definition">
          <Formula latex={'G_t=r_{t+1}+\\gamma r_{t+2}+\\gamma^2r_{t+3}+\\cdots'} />
          <div shuku-edit-id="e-a6eaf02c-83fd-4b2c-b337-aee8a13cd6c5" className="vbrl-return__contribution" data-contribution={contribution}>
            <Typography shuku-edit-id="e-867ad732-76b5-4979-8fcc-8f84f0d531d1" variant="bodySmall" tone="accent">第 {index + 1} 步 · {index === 0 ? '不折扣' : '折扣 ' + index + ' 次'}</Typography>
            <Formula latex={(step.reward < 0 ? '(' + step.reward + ')' : String(step.reward)) + '\\times ' + factor + '=' + contribution.toFixed(2)} />
          </div>
        </TeachingPanel>
        <TeachingPanel title="折扣：远期奖励占多大权重？" className="vbrl-return__discount">
          <RangeControl label="折扣因子 γ" min={0} max={1} step={.05} digits={2} value={gamma}
            onChange={event => setGamma(Number(event.target.value))} />
          <div shuku-edit-id="e-b6da7545-1186-4545-ae09-0e37e446e140" className="vbrl-return__comparison" role="group" aria-label="选择一条真实送货经历">
            {RETURN_EXPERIENCES.map((route, i) => <Button key={route.id} className={'vbrl-return__route-card' + (i ? ' is-detour' : '')}
              active={i === routeIndex} aria-pressed={i === routeIndex} aria-label={'查看' + route.label + '，' + route.steps.length + '步'}
              data-return-route={route.id} data-return={experienceReturn(route, gamma)} onClick={() => chooseRoute(i)}>
              <Typography shuku-edit-id="e-e3202cee-7c1a-43f0-9d95-4815b371aa00" as="span" variant="bodySmall" tone={i ? 'warning' : 'accent'}>{route.steps.length} 步{route.label}</Typography>
              <span shuku-edit-id="e-cb05aaca-5ff0-4334-809f-37c0f4f57629" className="vbrl-return__route-value"><Typography shuku-edit-id="e-e4329d5c-a1e4-44bf-ae32-2955c13c8e6e" as="span" variant="bodySmall" tone="muted">回报</Typography>
                <Typography shuku-edit-id="e-2e247f64-c594-48bd-803b-c4890e5395d3" as="span" variant="h2" tone={i ? 'warning' : 'accent'}>{signed(experienceReturn(route, gamma), 2)}</Typography></span>
              <Typography shuku-edit-id="e-fc88d7a0-9a22-4f5f-a0c5-dc71e491f952" as="span" variant="bodySmall" tone="muted">送达奖励权重 {(gamma ** (route.steps.length - 1)).toFixed(2)}</Typography>
            </Button>)}
          </div>
          <Typography shuku-edit-id="e-af35f4a1-5303-4736-aa5e-6ff556217030" variant="bodySmall" tone="accent" className="vbrl-return__insight">{gamma === 0
            ? '只看第一步：两条路线都是 −1，无法分出高低。' : gamma === 1
              ? 'γ = 1：所有奖励直接相加；绕行多收到两次 −1。'
              : '同样送达，越晚收到的 +10 权重越小。'}</Typography>
        </TeachingPanel>
      </div>
    </div>
  </LessonPage>;
}
