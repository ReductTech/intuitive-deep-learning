import { useEffect, useRef, useState } from 'react';
import type { NarrationSegment } from './document';

export function NarrationPlayer({ segments, onTargetChange }: {
  segments: NarrationSegment[];
  onTargetChange: (targetId?: string) => void;
}) {
  const [activeId, setActiveId] = useState<string>();
  const timersRef = useRef<number[]>([]);

  const stop = () => {
    timersRef.current.forEach(window.clearTimeout);
    timersRef.current = [];
    window.speechSynthesis?.cancel();
    setActiveId(undefined);
    onTargetChange(undefined);
  };

  const play = (segment: NarrationSegment) => {
    stop();
    setActiveId(segment.id);
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(segment.text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.92;
      utterance.onend = stop;
      window.speechSynthesis.speak(utterance);
    }
    timersRef.current = segment.cues.flatMap((cue) => {
      const start = window.setTimeout(() => onTargetChange(cue.targetId), cue.at * 1000);
      const end = window.setTimeout(() => onTargetChange(undefined), (cue.at + cue.duration) * 1000);
      return [start, end];
    });
    timersRef.current.push(window.setTimeout(stop, segment.duration * 1000));
  };

  useEffect(() => stop, []);

  if (!segments.length) return null;
  return <aside className="pe-narration" aria-label="智能讲解">
    <div className="pe-narration__head">
      <span>智能讲解</span>
      {activeId && <button type="button" onClick={stop}>停止</button>}
    </div>
    {segments.map((segment, index) => <button
      className={activeId === segment.id ? 'is-playing' : ''}
      key={segment.id}
      type="button"
      onClick={() => play(segment)}
    >
      <b>{String(index + 1).padStart(2, '0')}</b>
      <span>{segment.text}</span>
    </button>)}
  </aside>;
}

