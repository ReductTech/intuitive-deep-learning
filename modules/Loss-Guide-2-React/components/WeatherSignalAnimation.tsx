import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { Button } from '../../shared/react';
import {
  formatAnimatedNumber,
  formatSigmoidValue,
  weatherSignalFrame,
  type WeatherSignalFrame,
} from '../model/lossGuideMath';

export interface WeatherSignalAnimationProps {
  running: boolean;
  onToggle: () => void;
  revealed?: boolean;
  onFrame?: (frame: WeatherSignalFrame) => void;
  className?: string;
}

type SignalDirection = 'steady' | 'increasing' | 'decreasing';

interface RenderedFrame {
  value: WeatherSignalFrame;
  direction: SignalDirection;
}

type SignalStyle = CSSProperties & {
  '--signal-strength': string;
  '--demo-scale': string;
};

function classNames(
  ...values: Array<string | false | null | undefined>
): string {
  return values.filter(Boolean).join(' ');
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => (
    typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  ));

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!media) return undefined;
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return reduced;
}

const INITIAL_FRAME: RenderedFrame = {
  value: weatherSignalFrame(0),
  direction: 'steady',
};

/**
 * Private React adaptation of the legacy 15-second weather-signal animation.
 *
 * `running` is controlled by the parent. Changing it from false to true starts
 * a fresh cycle, matching the legacy pause/continue behavior. Reduced-motion
 * users receive the deterministic first frame instead of a continuous RAF.
 */
export function WeatherSignalAnimation({
  running,
  onToggle,
  revealed = false,
  onFrame,
  className,
}: WeatherSignalAnimationProps) {
  const [rendered, setRendered] = useState<RenderedFrame>(INITIAL_FRAME);
  const onFrameRef = useRef(onFrame);
  const previousRawRef = useRef<number | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  onFrameRef.current = onFrame;

  useEffect(() => {
    if (!running) return undefined;

    let active = true;
    let frameId = 0;
    let startedAt: number | null = null;
    previousRawRef.current = null;

    const first = weatherSignalFrame(0);
    setRendered({ value: first, direction: 'steady' });
    onFrameRef.current?.(first);

    if (reducedMotion) return undefined;

    const animate = (timestamp: number) => {
      if (!active) return;
      if (startedAt === null) startedAt = timestamp;
      const next = weatherSignalFrame(timestamp - startedAt);
      const previousRaw = previousRawRef.current;
      const direction: SignalDirection = previousRaw === null
        ? 'steady'
        : next.raw > previousRaw
          ? 'increasing'
          : next.raw < previousRaw
            ? 'decreasing'
            : 'steady';
      previousRawRef.current = next.raw;
      setRendered({ value: next, direction });
      onFrameRef.current?.(next);
      frameId = window.requestAnimationFrame(animate);
    };

    frameId = window.requestAnimationFrame(animate);
    return () => {
      active = false;
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [reducedMotion, running]);

  const { value, direction } = rendered;
  const signalStyle: SignalStyle = {
    '--signal-strength': value.signalStrength.toFixed(3),
    '--demo-scale': value.scale.toFixed(3),
  };

  return (
    <section
      className={classNames('lg2-weather-animation', className)}
      aria-label="天气信号转换动画"
    >
      <div className="lg2-animation-toolbar">
        <span>天气信号实时变化</span>
        <Button
          className="lg2-animation-toggle"
          type="button"
          onClick={onToggle}
          aria-label={running ? '暂停动画' : '继续动画'}
          title={running ? '暂停动画' : '继续动画'}
        >
          {running ? 'Ⅱ' : '▶'}
        </Button>
      </div>

      <div className="lg2-live-viewport">
        <div className="lg2-live-pipeline">
          <div
            className="lg2-weather-network"
            role="img"
            aria-label={`湿度 ${value.humidity}%，气压 ${value.pressure}，汇入一个神经元`}
            style={{
              opacity: 0.92 + value.signalStrength * 0.08,
            }}
          >
            <div className="lg2-weather-inputs">
              <div className="lg2-weather-input">
                <span>湿度</span>
                <strong>{value.humidity}%</strong>
              </div>
              <span className="lg2-weather-ellipsis" aria-hidden="true">⋮</span>
              <div className="lg2-weather-input">
                <span>气压</span>
                <strong>{value.pressure}</strong>
              </div>
            </div>

            <svg
              className="lg2-weather-connections"
              viewBox="0 0 180 150"
              aria-hidden="true"
              preserveAspectRatio="none"
            >
              <line x1="4" y1="28" x2="174" y2="75" />
              <line x1="4" y1="122" x2="174" y2="75" />
            </svg>

            <div className="lg2-weather-sum">
              <strong>Σ</strong>
              <span>汇总天气信号</span>
            </div>
          </div>

          <span className="lg2-flow-arrow" aria-hidden="true">→</span>

          <div
            className={classNames(
              'lg2-raw-output',
              direction === 'increasing' && 'is-increasing',
              direction === 'decreasing' && 'is-decreasing',
            )}
            style={signalStyle}
          >
            <span>模型原始分数</span>
            <strong>{formatAnimatedNumber(value.raw)}</strong>
            <small>任意实数（logit）</small>
          </div>

          <span className="lg2-flow-arrow" aria-hidden="true">→</span>

          <div
            className={classNames(
              'lg2-mystery-module',
              revealed && 'is-revealed',
            )}
            style={{
              '--signal-strength': value.signalStrength.toFixed(3),
            } as CSSProperties}
          >
            <div className="lg2-mystery-formula">
              <span>概率转换</span>
              <strong>Sigmoid σ(z)</strong>
            </div>
            <div className="lg2-mystery-curtain" aria-hidden={revealed}>
              <span>未知变换</span>
              <strong>?</strong>
            </div>
          </div>

          <span className="lg2-flow-arrow" aria-hidden="true">→</span>

          <div className="lg2-bounded-output">
            <span>下雨概率</span>
            <strong>{formatSigmoidValue(value.probability)}</strong>
            <small>范围 0～1</small>
          </div>
        </div>
      </div>

      <div className="lg2-animation-observations" aria-live="off">
        <div>
          <span>湿度</span>
          <strong>{value.humidity}%</strong>
        </div>
        <div>
          <span>气压</span>
          <strong>{value.pressure}</strong>
        </div>
        <div>
          <span>Sigmoid 输出</span>
          <strong>{formatSigmoidValue(value.probability)}</strong>
        </div>
      </div>
    </section>
  );
}
