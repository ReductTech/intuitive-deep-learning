import { useEffect, useId, useRef, useState } from 'react';
import { Bot, RotateCcw, UserRound, UsersRound } from 'lucide-react';
import { Button, ContentBlock, Typography, moduleAssetUrl } from '../../../shared/react';
import outline from '../../outlines.json';
import { handwrittenEightOutline, handwrittenEightStroke } from './handwrittenGrade';
import './DualLearningEvaluationPage.css';

const reviewers = [
  { label: '教师评分', score: 90, Icon: UserRound },
  { label: '学生互评', score: 86, Icon: UsersRound },
  { label: '智能体评分', score: 88, Icon: Bot },
] as const;
const average = reviewers.reduce((sum, reviewer) => sum + reviewer.score, 0) / reviewers.length;
const thumbnails = [
  { file: 'weight-sharing.jpg', label: '权重共享：同一套权重反复使用' },
  { file: 'window-scan.jpg', label: '棋形的局部匹配' },
  { file: 'kernel-basics.jpg', label: '卷积核：输入图像、卷积核与输出特征图' },
] as const;

function HandwrittenGrade() {
  const maskId = `aipe-grade-${useId().replaceAll(':', '')}`;
  return <svg className="aipe-assessment-handwriting" viewBox="0 0 280 185" role="img" aria-label={`${average}分`} data-final-score={average} data-typeface="Bradley Hand ITC">
    <defs>{['first', 'second'].map(digit => <mask key={digit} id={`${maskId}-${digit}`} maskUnits="userSpaceOnUse" x="-50" y="-50" width="250" height="300">
      <path className="aipe-assessment-digit" data-digit={digit} pathLength="1" d={handwrittenEightStroke} fill="none" stroke="white" strokeWidth="80" strokeLinecap="round" strokeLinejoin="round" />
    </mask>)}</defs>
    <g fill="currentColor" aria-hidden="true">
      <path d={handwrittenEightOutline} mask={`url(#${maskId}-first)`} />
      <g transform="translate(140 0) rotate(-2 75 90)"><path d={handwrittenEightOutline} mask={`url(#${maskId}-second)`} /></g>
    </g>
  </svg>;
}

function StepArrow({ className, revealed }: { className: string; revealed: boolean }) {
  return <svg className={`aipe-assessment-arrow ${className}`} data-revealed={revealed} viewBox="0 0 70 34" aria-hidden="true">
    <path d="M3 17H62M49 4L63 17L49 30" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}

export function DualLearningEvaluationPage() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [phase, setPhase] = useState(0);
  const [replay, setReplay] = useState(0);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReducedMotion(media.matches);
    let intersecting = false;
    const updateVisibility = () => setActive(intersecting && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      intersecting = entry.isIntersecting && entry.intersectionRatio >= 0.1;
      updateVisibility();
    }, { threshold: [0, 0.1] });
    updateMotion();
    observer.observe(element);
    media.addEventListener('change', updateMotion);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => {
      observer.disconnect();
      media.removeEventListener('change', updateMotion);
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (!active) { setPhase(0); return; }
    if (reducedMotion) { setPhase(4); return; }
    setPhase(0);
    const timers = [450, 1300, 2150, 3200].map((delay, index) => window.setTimeout(() => setPhase(index + 1), delay));
    return () => timers.forEach(timer => window.clearTimeout(timer));
  }, [active, reducedMotion, replay]);

  return <ContentBlock ref={root} title={outline.pages[31].title} headingLevel={1} className="aipe-assessment-page" bodyClassName="aipe-assessment-body">
    <div className="aipe-assessment-composition" data-phase={phase} data-active={active} data-reduced-motion={reducedMotion}>
      <div className="aipe-assessment-layout">
        <section className="aipe-assessment-courseware" aria-labelledby="aipe-assessment-work-title">
          <Typography as="h2" variant="h2" tone="accent" id="aipe-assessment-work-title">学生课件</Typography>
          <figure className="aipe-assessment-stack" aria-label="同一份交互课件的三张页面缩略图">
            {thumbnails.map((thumbnail, index) => <img key={thumbnail.file} className={`aipe-assessment-thumbnail aipe-assessment-thumbnail--${index}`} src={moduleAssetUrl(outline.moduleIdentity.id, `workflow/course-thumbnails/${thumbnail.file}`)} width="400" height="225" alt={thumbnail.label} draggable={false} />)}
            <Typography as="figcaption" variant="body" tone="muted">同一份交互课件</Typography>
          </figure>
        </section>
        <section className="aipe-assessment-review" aria-labelledby="aipe-assessment-review-title">
          <Typography as="h2" variant="h2" tone="accent" id="aipe-assessment-review-title">多方评分</Typography>
          <div className="aipe-assessment-reviewers">
            {reviewers.map(({ label, score, Icon }, index) => <div key={label} className="aipe-assessment-reviewer" data-reviewer={index} data-revealed={phase > index} aria-hidden={phase <= index}>
              <Icon aria-hidden="true" strokeWidth={1.65} />
              <Typography as="span" variant="body" tone="accent"><strong>{label}</strong></Typography>
              <Typography as="span" variant="display" tone="accent" className="aipe-assessment-reviewer-score">{score}</Typography>
            </div>)}
          </div>
        </section>
        <section className="aipe-assessment-result" aria-labelledby="aipe-assessment-result-title">
          <Typography as="h2" variant="h2" tone="accent" id="aipe-assessment-result-title">考核成绩</Typography>
          <div className="aipe-assessment-result-content" data-revealed={phase === 4} aria-hidden={phase !== 4} key={replay}>
            {phase === 4 && <div className="aipe-assessment-grade"><HandwrittenGrade /><Typography as="span" variant="h2" tone="accent">分</Typography></div>}
            <div className="aipe-assessment-result-rule" />
            <Typography as="p" variant="body" tone="muted">平均汇总</Typography>
          </div>
        </section>
      </div>
      <StepArrow className="aipe-assessment-arrow--submit" revealed={phase > 0} />
      <svg className="aipe-assessment-merge" data-revealed={phase >= 3} viewBox="0 0 48 370" aria-hidden="true"><path pathLength="1" d="M5 4Q29 4 29 29V158Q29 185 44 185Q29 185 29 212V341Q29 366 5 366" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
      <StepArrow className="aipe-assessment-arrow--result" revealed={phase === 4} />
      <div className="aipe-assessment-footer">
        <Typography as="span" variant="bodySmall" tone="muted">评分示意</Typography>
        <Button className="aipe-assessment-replay" aria-label="重播评分动画" title="重播评分动画" onClick={() => setReplay(value => value + 1)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') event.stopPropagation(); }}><RotateCcw size={24} aria-hidden="true" /></Button>
      </div>
    </div>
  </ContentBlock>;
}

