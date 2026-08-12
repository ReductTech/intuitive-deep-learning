import type { SequenceFrame } from '../model/sequenceMath';

function formatPercent(value: number) {
  return Number.isFinite(Number(value)) ? `${(Number(value) * 100).toFixed(1)}%` : '-';
}

export function SequenceFrameTrack({
  frames,
  ideaSubmitted,
  scanning,
}: {
  frames: readonly SequenceFrame[];
  ideaSubmitted: boolean;
  scanning: boolean;
}) {
  return (
    <div className="lenet-frame-track" aria-live="polite" aria-label="滑动窗口识别帧">
      {!frames.length && (
        <div className="lenet-frame is-empty">
          {ideaSubmitted ? '等待扫描' : '提交想法后显示滑窗帧'}
        </div>
      )}
      {frames.map((frame, index) => {
        const symbol = frame.ctcSymbol || (frame.reject ? '_' : frame.digit);
        const classes = [
          'lenet-frame',
          frame.reject && 'is-blank',
          !frame.reject && !frame.keep && 'is-candidate',
          frame.ctcBlank && 'is-ctc-blank',
          frame.keep && 'is-kept',
          scanning && index === frames.length - 1 && 'is-entering',
        ].filter(Boolean).join(' ');
        return (
          <div
            className={classes}
            key={`${frame.left}-${index}`}
            title={`x=${frame.left}，CTC 符号 ${symbol}，置信度 ${formatPercent(frame.confidence)}`}
          >
            {`x=${frame.left}`}
            <strong>{symbol}</strong>
            <small>{formatPercent(frame.confidence)}</small>
          </div>
        );
      })}
    </div>
  );
}
