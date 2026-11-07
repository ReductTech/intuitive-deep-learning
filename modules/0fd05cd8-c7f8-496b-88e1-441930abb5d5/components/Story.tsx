import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Typography } from '../../shared/react/typography/Typography';
import './Story.css';

export function useStory(steps: readonly string[], dwell = 850) {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [step, setStep] = useState(() => reduced ? steps.length - 1 : 0);
  const [revealedThrough, setRevealedThrough] = useState(() => reduced ? steps.length - 1 : 0);
  const [automatic, setAutomatic] = useState(true);
  const anchor = useRef<HTMLDivElement>(null);
  const [foreground, setForeground] = useState(!document.hidden);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onPreference = () => setReduced(preference.matches);
    preference.addEventListener('change', onPreference);
    const onVisibility = () => setForeground(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .1 });
    if (anchor.current) observer.observe(anchor.current);
    return () => { preference.removeEventListener('change', onPreference); document.removeEventListener('visibilitychange', onVisibility); observer.disconnect(); };
  }, []);
  useEffect(() => {
    if (reduced) setStep(steps.length - 1);
  }, [reduced, steps.length]);
  useEffect(() => { setRevealedThrough(previous => Math.max(previous, step)); }, [step]);
  const playing = automatic && foreground && visible && !reduced && step < steps.length - 1;
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => setStep(s => Math.min(s + 1, steps.length - 1)), step === 0 ? 450 : dwell);
    return () => window.clearTimeout(timer);
  }, [step, playing, steps.length, dwell]);
  const go = (value: number) => { setAutomatic(false); setStep(Math.max(0, Math.min(steps.length - 1, value))); };
  return { step, revealedThrough, playing, go, anchor,
    reset: () => { setStep(reduced ? steps.length - 1 : 0); setAutomatic(true); },
    caption: steps[step], total: steps.length,
  };
}
export type StoryState = ReturnType<typeof useStory>;

export function StoryCaption({ story, notes }: { story: StoryState; notes: readonly { at: number; text: string }[] }) {
  return <div className="vga-story-caption" ref={story.anchor} data-story-step={story.step} data-story-total={story.total} data-story-playing={story.playing} data-story-complete={story.step === story.total - 1} role="list" aria-label="本页要点" aria-live="off">
    {notes.map(note => <div key={note.text} role="listitem" className={'vga-persistent-note' + (story.revealedThrough >= note.at ? ' is-revealed' : '')} aria-hidden={story.revealedThrough < note.at}><Typography variant="bodySmall" tone="accent">{note.text}</Typography></div>)}
  </div>;
}

export function Mission({ children, chapter }: { children: ReactNode; chapter?: string }) {
  return <div className="vga-mission"><Typography as="span" variant="bodySmall" tone="warning">{chapter ?? '本次委托'}</Typography><Typography as="span" variant="bodySmall">{children}</Typography></div>;
}

export function Reveal({ show, children, ghost = false }: { show: boolean; children: ReactNode; ghost?: boolean }) {
  return <div className={`vga-reveal ${show ? 'is-visible' : ghost ? 'is-ghost' : 'is-waiting'}`} aria-hidden={!show}>{children}</div>;
}

export function Readout({ label, value, warm = false }: { label: string; value: ReactNode; warm?: boolean }) {
  return <div className={'vga-readout' + (warm ? ' is-warm' : '')}><Typography variant="bodySmall" tone="muted">{label}</Typography><Typography variant="h3" tone={warm ? 'warning' : 'accent'}>{value}</Typography></div>;
}

export function Signal({ d, warm = false, active = false, animate = false }: { d: string; warm?: boolean; active?: boolean; animate?: boolean }) {
  return <g className={active ? 'vga-signal is-active' : 'vga-signal'}><path d={d} fill="none" stroke={warm ? 'var(--ui-accent-alt)' : 'var(--ui-accent)'} strokeWidth="3" opacity={active ? 1 : .16} />{active && animate && <path className="vga-signal-packet" d={d} fill="none" stroke={warm ? 'var(--ui-accent-alt)' : 'var(--ui-accent)'} strokeWidth="7" strokeLinecap="round" />}</g>;
}
