import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, Typography } from '../../../shared/react';
import { DishIcon, type DishId } from './DishIcon';
import { WeatherIcon, type WeatherId } from './WeatherIcon';
import './RNNWeatherRulePage.css';

export interface RNNWeatherRulePageProps {
  onComplete: () => void;
}

interface Day {
  weather: WeatherId;
  /** 这一天最终做的那道菜。 */
  dish: DishId;
}

/** 第一天的天气和菜作为起点给出，之后每天只给天气，由学生按“上一天天气 → 下一天菜品”推出菜。 */
const days: Day[] = [
  { weather: 'sun', dish: 'pie' },
  { weather: 'sun', dish: 'pie' },
  { weather: 'rain', dish: 'pie' },
  { weather: 'sun', dish: 'steak' },
  { weather: 'rain', dish: 'steak' },
];

const options: DishId[] = ['steak', 'burger', 'pie'];
const dishNames: Record<DishId, string> = { pie: '苹果派', steak: '牛排', burger: '汉堡' };
const weatherNames: Record<WeatherId, string> = { sun: '晴天', rain: '雨天' };

/** 做菜顺序：苹果派 → 牛排 → 汉堡 → 苹果派……“换下一道”就是沿着这个圈往下走。 */
const dishCycle: DishId[] = ['pie', 'steak', 'burger'];

/** 竞速：20 秒里尽量多排几天。 */
const RACE_SECONDS = 20;
/** 一次生成足够多的天气，20 秒内不可能用完。 */
const RACE_DAY_POOL = 400;
/** 传送带在“当前这天”左右各露出几天。 */
const RACE_WINDOW_BEFORE = 4;
const RACE_WINDOW_AFTER = 5;

interface RaceDay {
  weather: WeatherId;
  /** 这一天的正确答案。 */
  dish: DishId;
}

function nextDish(dish: DishId): DishId {
  return dishCycle[(dishCycle.indexOf(dish) + 1) % dishCycle.length];
}

/** 随机撒一串天气，再按“上一天天气决定下一天菜品”推出一整条做菜安排。 */
function buildRaceDays(count: number): RaceDay[] {
  if (count <= 0) return [];

  const list: RaceDay[] = [];
  const randomWeather = () => (Math.random() < 0.5 ? 'sun' : 'rain') as WeatherId;
  let previousWeather = randomWeather();
  let dish: DishId = dishCycle[0];
  // 第一天是已知起点；从第二天开始，才需要根据前一天的天气作答。
  list.push({ weather: previousWeather, dish });

  for (let index = 1; index < count; index += 1) {
    const weather = randomWeather();
    dish = previousWeather === 'sun' ? dish : nextDish(dish);
    list.push({ weather, dish });
    previousWeather = weather;
  }
  return list;
}

/** 答对天数 → 超过多少玩家。 */
const beatTiers: Array<{ min: number; percent: number; title: string }> = [
  { min: 20, percent: 99, title: '手速天花板' },
  { min: 17, percent: 98, title: '厨房大师' },
  { min: 14, percent: 95, title: '连击高手' },
  { min: 11, percent: 88, title: '熟练厨子' },
  { min: 8, percent: 75, title: '渐入佳境' },
  { min: 5, percent: 55, title: '找到规律' },
  { min: 0, percent: 25, title: '刚热完身' },
];

function beatTier(score: number) {
  return beatTiers.find((tier) => score >= tier.min) ?? beatTiers[beatTiers.length - 1];
}

/** 20 秒倒计时：只重渲染自己，避免拖慢传送带。 */
function RaceCountdown({ seconds, onEnd, active }: { seconds: number; onEnd: () => void; active: boolean }) {
  const [remaining, setRemaining] = useState(seconds);
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  useEffect(() => {
    if (!active) {
      setRemaining(seconds);
      return undefined;
    }

    const startedAt = performance.now();
    let frame = window.requestAnimationFrame(function tick() {
      const left = Math.max(0, seconds - (performance.now() - startedAt) / 1000);
      setRemaining(left);
      if (left <= 0) {
        onEndRef.current();
        return;
      }
      frame = window.requestAnimationFrame(tick);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [active, seconds]);

  const ratio = Math.max(0, Math.min(1, remaining / seconds));
  const urgent = remaining <= 5;

  return (
    <div className={`nrnn-weather-rule__clock${urgent ? ' is-urgent' : ''}`}>
      <div className="nrnn-weather-rule__clock-line">
        <Typography as="span" variant="bodySmall" tone="muted">剩余</Typography>
        <Typography as="span" variant="h1" tone="inherit" className="nrnn-weather-rule__clock-value">
          {remaining.toFixed(1)}
        </Typography>
        <Typography as="span" variant="bodySmall" tone="muted">秒</Typography>
      </div>
      <div className="nrnn-weather-rule__clock-bar" aria-hidden="true">
        <span style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}

/** 起跑前的 3 · 2 · 1，避免手还没放好就被计时。 */
function RaceReady({ onDone }: { onDone: () => void }) {
  const [count, setCount] = useState(3);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        if (count <= 0) onDoneRef.current();
        else setCount((value) => value - 1);
      },
      count <= 0 ? 420 : 620,
    );
    return () => window.clearTimeout(timer);
  }, [count]);

  return (
    <div className="nrnn-weather-rule__ready">
      <Typography as="p" variant="display" tone="inherit" align="center" className="nrnn-weather-rule__ready-count">
        {count > 0 ? count : '开始！'}
      </Typography>
      <Typography as="p" variant="body" tone="muted" align="center">
        看前一天的天气：晴天照做上一天，雨天换下一道
      </Typography>
    </div>
  );
}

function Dish({ dish }: { dish: DishId }) {
  return <DishIcon dish={dish} label={dishNames[dish]} />;
}

export function RNNWeatherRulePage({ onComplete }: RNNWeatherRulePageProps) {
  /** 已经填到第几天：0 表示只有起点是已知的。 */
  const [filled, setFilled] = useState(0);
  const [wrong, setWrong] = useState<DishId | null>(null);
  const completedRef = useRef(false);

  /** practice = 热身推演，ready = 3·2·1，race = 20 秒计时，result = 结算弹窗。 */
  const [phase, setPhase] = useState<'practice' | 'ready' | 'race' | 'result'>('practice');
  const [runId, setRunId] = useState(0);
  const [raceDays, setRaceDays] = useState<RaceDay[]>(() => buildRaceDays(RACE_DAY_POOL));
  /** 第一天是已知起点，竞速从第二天开始作答。 */
  const [raceIndex, setRaceIndex] = useState(1);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [wrongDish, setWrongDish] = useState<DishId | null>(null);
  const [missTick, setMissTick] = useState(0);

  const solved = filled >= days.length - 1;
  const current = solved ? null : days[filled + 1];
  const racing = phase !== 'practice';

  const choose = (dish: DishId) => {
    if (!current) return;
    if (dish !== current.dish) {
      setWrong(dish);
      return;
    }
    setWrong(null);
    const next = filled + 1;
    setFilled(next);
    if (next >= days.length - 1 && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  };

  /** 开一局竞速：换一串新天气，分数、倒计时、传送带全部回到起点。 */
  const startRace = useCallback(() => {
    setRaceDays(buildRaceDays(RACE_DAY_POOL));
    setRaceIndex(1);
    setScore(0);
    setMisses(0);
    setWrongDish(null);
    setRunId((value) => value + 1);
    setPhase('ready');
  }, []);

  const beginRun = useCallback(() => setPhase('race'), []);
  const finishRun = useCallback(() => setPhase('result'), []);
  const backToPractice = useCallback(() => setPhase('practice'), []);

  const answer = useCallback((dish: DishId) => {
    if (phase !== 'race') return;
    const day = raceDays[raceIndex];
    if (!day) return;
    if (dish === day.dish) {
      setScore((value) => value + 1);
      setRaceIndex((value) => value + 1);
      setWrongDish(null);
      return;
    }
    setMisses((value) => value + 1);
    setWrongDish(dish);
    setMissTick((value) => value + 1);
  }, [phase, raceDays, raceIndex]);

  const answerRef = useRef(answer);
  useEffect(() => {
    answerRef.current = answer;
  }, [answer]);

  /** 点错的红框只亮一下，让下一次失误也能重新亮。 */
  useEffect(() => {
    if (!wrongDish) return undefined;
    const timer = window.setTimeout(() => setWrongDish(null), 330);
    return () => window.clearTimeout(timer);
  }, [wrongDish, missTick]);

  /** 键盘 1 / 2 / 3 对应苹果派、牛排、汉堡。 */
  useEffect(() => {
    if (phase !== 'race') return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      const slot = ['1', '2', '3'].indexOf(event.key);
      if (slot < 0) return;
      event.preventDefault();
      answerRef.current(dishCycle[slot]);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase]);

  const rulesRow = (
    <div className="nrnn-weather-rule__rules">
      <div className="nrnn-weather-rule__rule">
        <WeatherIcon weather="sun" className="nrnn-weather-rule__glyph" />
        <Typography as="strong" variant="h3" tone="main">前一天晴天：还做上一天那道菜</Typography>
      </div>
      <div className="nrnn-weather-rule__rule is-rain">
        <WeatherIcon weather="rain" className="nrnn-weather-rule__glyph" />
        <Typography as="strong" variant="h3" tone="main">前一天雨天：换下一道</Typography>
        <span className="nrnn-weather-rule__cycle">
          <Dish dish="pie" />
          <Typography as="span" variant="body" tone="light" className="nrnn-weather-rule__arrow">➔</Typography>
          <Dish dish="steak" />
          <Typography as="span" variant="body" tone="light" className="nrnn-weather-rule__arrow">➔</Typography>
          <Dish dish="burger" />
        </span>
      </div>
    </div>
  );

  const windowFrom = Math.max(0, raceIndex - RACE_WINDOW_BEFORE);
  const windowTo = Math.min(raceDays.length, raceIndex + RACE_WINDOW_AFTER + 1);
  const activeDay = raceDays[raceIndex];
  const tier = beatTier(score);

  /** 传送带上的一张卡：左边是已经排好的天，中间是正在答的天，右边是还没到的天。 */
  const renderCard = (index: number) => {
    const day = raceDays[index] ?? null;
    if (!day) return null;
    const step = index - raceIndex;
    const revealed = index < raceIndex;
    const stateClass = step === 0 ? ' is-active' : step < 0 ? ' is-past' : ' is-future';
    const farClass = Math.abs(step) >= 3 ? ' is-far' : '';
    const missClass = step === 0 && wrongDish ? ' is-miss' : '';

    return (
      <div
        key={`day-${index}`}
        className={`nrnn-weather-rule__card${stateClass}${farClass}${missClass}`}
        style={{ transform: `translate(calc(-50% + var(--nrnn-race-step) * ${step}), -50%) scale(var(--nrnn-race-scale, 1))` }}
      >
        <Typography as="span" variant="bodySmall" tone="light" className="nrnn-weather-rule__card-day">
          {`第 ${index + 1} 天`}
        </Typography>
        <div className="nrnn-weather-rule__card-weather">
          <WeatherIcon weather={day.weather} label={weatherNames[day.weather]} className="nrnn-weather-rule__weather is-race" />
        </div>
        <div className="nrnn-weather-rule__dish">
          {revealed
            ? <Dish dish={day.dish} />
            : <Typography as="span" variant="h2" tone="light" className="nrnn-weather-rule__blank">？</Typography>}
        </div>
      </div>
    );
  };

  return (
    <ContentBlock
      headingLevel={1}
      className="nrnn-weather-rule"
      title="新规则：加入天气"
      subtitle={racing
        ? `20 秒里尽量多排几天：看前一天的天气，晴天照做上一天那道菜，雨天换下一道。`
        : '看前一天的天气，决定明天这道菜要不要换。'}
      bodyClassName={racing ? 'is-race' : undefined}
    >
      {!racing && (
        <>
          {rulesRow}

          <section className="nrnn-weather-rule__board" aria-label="五天的天气与菜">
            {days.map((day, index) => {
              const revealed = index <= filled;
              const isCurrent = index === filled + 1;
              return (
                <div className={`nrnn-weather-rule__day${revealed ? ' is-done' : ''}${isCurrent ? ' is-current' : ''}`} key={index}>
                  <Typography as="span" variant="bodySmall" tone="light">
                    {`第 ${index + 1} 天`}
                  </Typography>
                  <WeatherIcon weather={day.weather} label={day.weather === 'sun' ? '晴天' : '雨天'} className="nrnn-weather-rule__weather" />
                  <div className="nrnn-weather-rule__dish">
                    {revealed
                      ? <Dish dish={day.dish} />
                      : <Typography as="span" variant="h3" tone="light" className="nrnn-weather-rule__blank">？</Typography>}
                  </div>
                </div>
              );
            })}
          </section>

          <div className="nrnn-weather-rule__ask">
            <Typography as="strong" variant="h3" tone="accent">
              {solved ? '五天都排完了' : `第 ${filled + 2} 天做什么？`}
            </Typography>
            {!solved && (
              <div className="nrnn-weather-rule__options">
                {options.map((dish) => (
                  <button
                    key={dish}
                    type="button"
                    className={`nrnn-weather-rule__option${wrong === dish ? ' is-wrong' : ''}`}
                    aria-label={dishNames[dish]}
                    onClick={() => choose(dish)}
                  >
                    <DishIcon dish={dish} />
                  </button>
                ))}
              </div>
            )}
            {solved && (
              <Button variant="primary" onClick={startRace}>开始游戏 竞速20秒</Button>
            )}
          </div>

          <div className={`nrnn-weather-rule__feedback${wrong ? ' is-wrong' : ''}${solved ? ' is-done' : ''}`}>
            {solved ? (
              <Typography as="p" variant="body" tone="inherit">
                要说出明天做什么，得记住昨天是什么天气——只看今天这道菜，不够。
              </Typography>
            ) : wrong ? (
              <span className="nrnn-weather-rule__feedback-row">
                <Typography as="span" variant="body" tone="inherit">前一天是</Typography>
                <WeatherIcon weather={days[filled].weather} className="nrnn-weather-rule__glyph is-small" />
                <Typography as="span" variant="body" tone="inherit">
                  {days[filled].weather === 'sun'
                    ? `所以应该还做上一天那道菜`
                    : `所以要换下一道`}
                </Typography>
                <span className="nrnn-weather-rule__answer"><Dish dish={current!.dish} /></span>
              </span>
            ) : (
              <Typography as="p" variant="body" tone="inherit">点一个菜，把它填到这一天的格子里。</Typography>
            )}
          </div>
        </>
      )}

      {racing && (
        <>
          {rulesRow}

          <section className="nrnn-weather-rule__hud" aria-label="竞速状态">
            <RaceCountdown key={runId} seconds={RACE_SECONDS} onEnd={finishRun} active={phase === 'race'} />
            <div className="nrnn-weather-rule__hud-stats">
              <div className="nrnn-weather-rule__stat">
                <Typography as="span" variant="bodySmall" tone="muted">答对</Typography>
                <Typography as="strong" variant="h3" tone="accent">{score}</Typography>
                <Typography as="span" variant="bodySmall" tone="muted">天</Typography>
              </div>
              <div className={`nrnn-weather-rule__stat${misses > 0 ? ' is-miss' : ''}`}>
                <Typography as="span" variant="bodySmall" tone="muted">失误</Typography>
                <Typography as="strong" variant="h3" tone="inherit">{misses}</Typography>
                <Typography as="span" variant="bodySmall" tone="muted">次</Typography>
              </div>
              <Button onClick={startRace}>重开</Button>
            </div>
          </section>

          <section className="nrnn-weather-rule__track" aria-label="天气与做菜的传送带">
            <div className="nrnn-weather-rule__rail">
              {raceDays.slice(windowFrom, windowTo).map((_day, offset) => renderCard(windowFrom + offset))}
            </div>
            {phase === 'ready' && <RaceReady onDone={beginRun} />}
          </section>

          <section className={`nrnn-weather-rule__answers${phase === 'race' ? '' : ' is-locked'}`} aria-label="选择这一天的菜">
            <Typography as="strong" variant="h3" tone="accent">
              {activeDay ? `第 ${raceIndex + 1} 天做什么？` : '排完了'}
            </Typography>
            <div className="nrnn-weather-rule__options is-race">
              {dishCycle.map((dish) => (
                <button
                  key={dish}
                  type="button"
                  className={`nrnn-weather-rule__option is-race${wrongDish === dish ? ' is-wrong' : ''}`}
                  aria-label={dishNames[dish]}
                  disabled={phase !== 'race'}
                  onClick={() => answer(dish)}
                >
                  <DishIcon dish={dish} />
                  <Typography as="span" variant="bodySmall" tone="inherit" className="nrnn-weather-rule__option-name">
                    {dishNames[dish]}
                  </Typography>
                </button>
              ))}
            </div>
            <Typography as="span" variant="bodySmall" tone="muted" align="end">
              也可以按键盘 1 / 2 / 3
            </Typography>
          </section>
        </>
      )}

      {phase === 'result' && (
        <div className="nrnn-weather-rule__result" role="dialog" aria-modal="true" aria-label="20 秒竞速结果">
          <div className="nrnn-weather-rule__result-card">
            <Typography as="span" variant="bodySmall" tone="muted" className="nrnn-weather-rule__result-eyebrow">
              20 秒竞速 · 结束
            </Typography>
            <Typography as="p" variant="h1" tone="accent" align="center">
              {`答对 ${score} 天`}
            </Typography>
            <Typography as="p" variant="h2" tone="main" align="center">
              {`超过了 ${tier.percent}% 的玩家`}
            </Typography>
            <div className="nrnn-weather-rule__result-bar" aria-hidden="true">
              <span style={{ width: `${tier.percent}%` }} />
            </div>
            <Typography as="p" variant="body" tone="muted" align="center">
              {`${tier.title} · 失误 ${misses} 次 · 平均每秒 ${(score / RACE_SECONDS).toFixed(1)} 天`}
            </Typography>
            <div className="nrnn-weather-rule__result-actions">
              <Button variant="primary" onClick={startRace}>再来一局</Button>
              <Button onClick={backToPractice}>回到练习</Button>
            </div>
          </div>
        </div>
      )}
    </ContentBlock>
  );
}
