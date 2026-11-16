import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Typography } from "@shuku/course-style/react/typography/Typography";
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
  return <div shuku-edit-id="e-6c80158f-d6d6-423b-a310-67c544acb2a3" className="vga-story-caption" ref={story.anchor} data-story-step={story.step} data-story-total={story.total} data-story-playing={story.playing} data-story-complete={story.step === story.total - 1} role="list" aria-label="本页要点" aria-live="off">
    {notes.map(note => <div shuku-edit-id="e-5c346ba6-9125-469b-81fc-cec18df5075d" key={note.text} role="listitem" className={'vga-persistent-note' + (story.revealedThrough >= note.at ? ' is-revealed' : '')} aria-hidden={story.revealedThrough < note.at}><Typography variant="bodySmall" tone="accent">{note.text}</Typography></div>)}
  </div>;
}

export function Mission({ children, chapter }: { children: ReactNode; chapter?: string }) {
  return <div shuku-edit-id="e-fc7ba674-9ec1-4d61-bc09-fc5f22fb7b5e" className="vga-mission"><Typography as="span" variant="bodySmall" tone="warning">{chapter ?? '本次委托'}</Typography><Typography as="span" variant="bodySmall">{children}</Typography></div>;
}

export function Reveal({ show, children, ghost = false }: { show: boolean; children: ReactNode; ghost?: boolean }) {
  return <div shuku-edit-id="e-e22d6a1a-a6dc-4a2c-b8d8-61864ca13864" className={`vga-reveal ${show ? 'is-visible' : ghost ? 'is-ghost' : 'is-waiting'}`} aria-hidden={!show}>{children}</div>;
}

export function Readout({ label, value, warm = false }: { label: string; value: ReactNode; warm?: boolean }) {
  return <div shuku-edit-id="e-57faea84-d2b9-4438-94ca-6a3faa067683" className={'vga-readout' + (warm ? ' is-warm' : '')}><Typography variant="bodySmall" tone="muted">{label}</Typography><Typography variant="h3" tone={warm ? 'warning' : 'accent'}>{value}</Typography></div>;
}

export function Signal({ d, warm = false, active = false, animate = false }: { d: string; warm?: boolean; active?: boolean; animate?: boolean }) {
  return <g shuku-edit-id="e-ea00bbd9-545a-4467-8cd9-16bacd0990f6" className={active ? 'vga-signal is-active' : 'vga-signal'}><path shuku-edit-id="e-a84c41fa-5f14-4a9c-82c3-6244f80a7b7b" d={d} fill="none" stroke={warm ? 'var(--ui-accent-alt)' : 'var(--ui-accent)'} strokeWidth="3" opacity={active ? 1 : .16} />{active && animate && <path shuku-edit-id="e-9224579f-918c-4c6d-8f10-d4b54fe63610" className="vga-signal-packet" d={d} fill="none" stroke={warm ? 'var(--ui-accent-alt)' : 'var(--ui-accent)'} strokeWidth="7" strokeLinecap="round" />}</g>;
}
