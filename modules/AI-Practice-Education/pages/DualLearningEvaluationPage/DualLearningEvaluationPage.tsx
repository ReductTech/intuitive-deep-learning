import { useEffect, useRef, useState } from 'react';
import { Bot, UserRound, UsersRound } from 'lucide-react';
import { ContentBlock, Typography, moduleAssetUrl } from '../../../shared/react';
import outline from '../../outlines.json';
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

const eightStroke = 'M83 17C57 8 35 24 38 46C41 64 64 77 86 91C112 107 115 130 100 149C86 166 48 169 33 148C15 122 43 96 68 79C92 64 113 43 101 26C97 20 91 18 83 17';

function FinalGrade() {
  return <svg className="aipe-dual-evaluation-handwriting" viewBox="0 0 252 185" role="img" aria-label={`${average}分`} data-final-score={average}>
    <g fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path className="aipe-dual-evaluation-digit" data-digit="first" pathLength="1" d={eightStroke} />
      <path className="aipe-dual-evaluation-digit" data-digit="second" pathLength="1" d={eightStroke} transform="translate(112 0)" />
    </g>
  </svg>;
}

function StepArrow({ className, revealed }: { className: string; revealed: boolean }) {
  return <svg className={`aipe-dual-evaluation-arrow ${className}`} data-revealed={revealed} viewBox="0 0 70 34" aria-hidden="true">
    <path d="M3 17H62M49 4L63 17L49 30" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}

export function DualLearningEvaluationPage() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [phase, setPhase] = useState(0);
  const [expanded, setExpanded] = useState(false);

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
    if (!active) { setExpanded(false); setPhase(0); return; }
    if (reducedMotion) { setExpanded(true); setPhase(4); return; }
    setExpanded(false);
    setPhase(0);
    const timers = [
      window.setTimeout(() => setExpanded(true), 900),
      ...[2500, 3350, 4200, 4600].map((delay, index) => window.setTimeout(() => setPhase(index + 1), delay)),
    ];
    return () => timers.forEach(timer => window.clearTimeout(timer));
  }, [active, reducedMotion]);

  return <ContentBlock ref={root} title={outline.pages[31].title} headingLevel={1} className="aipe-dual-evaluation-page" bodyClassName="aipe-dual-evaluation-body">
    <div className="aipe-dual-evaluation-composition" data-phase={phase} data-active={active} data-reduced-motion={reducedMotion}>
      <div className="aipe-dual-evaluation-layout">
        <section className="aipe-dual-evaluation-courseware" aria-labelledby="aipe-dual-evaluation-work-title">
          <Typography as="h2" variant="h2" tone="accent" id="aipe-dual-evaluation-work-title">学生实践成果</Typography>
          <Typography as="p" variant="bodySmall" tone="muted" className="aipe-dual-evaluation-evidence">知识呈现作品 + 课后专题实践内容</Typography>
          <figure className="aipe-dual-evaluation-stack" data-expanded={expanded} aria-label="三张实践成果示例，由叠放展开为扇形">
            {thumbnails.map((thumbnail, index) => <img key={thumbnail.file} className={`aipe-dual-evaluation-thumbnail aipe-dual-evaluation-thumbnail--${index}`} src={moduleAssetUrl(outline.moduleIdentity.id, `workflow/course-thumbnails/${thumbnail.file}`)} width="400" height="225" alt={thumbnail.label} draggable={false} />)}
            <Typography as="figcaption" variant="bodySmall" tone="muted">知识呈现 · Jittor 复现 · 实验分析</Typography>
          </figure>
        </section>
        <section className="aipe-dual-evaluation-review" aria-labelledby="aipe-dual-evaluation-review-title">
          <Typography as="h2" variant="h2" tone="accent" id="aipe-dual-evaluation-review-title">多方评分</Typography>
          <div className="aipe-dual-evaluation-reviewers">
            {reviewers.map(({ label, score, Icon }, index) => <div key={label} className="aipe-dual-evaluation-reviewer" data-reviewer={index} data-revealed={phase > index} aria-hidden={phase <= index}>
              <Icon aria-hidden="true" strokeWidth={1.65} />
              <Typography as="span" variant="body" tone="accent"><strong>{label}</strong></Typography>
              <Typography as="span" variant="display" tone="accent" className="aipe-dual-evaluation-reviewer-score">{score}</Typography>
            </div>)}
          </div>
        </section>
        <section className="aipe-dual-evaluation-result" aria-labelledby="aipe-dual-evaluation-result-title">
          <Typography as="h2" variant="h2" tone="accent" id="aipe-dual-evaluation-result-title">考核成绩</Typography>
          <div className="aipe-dual-evaluation-result-content" data-revealed={phase === 4} aria-hidden={phase !== 4}>
            {phase === 4 && <div className="aipe-dual-evaluation-grade"><FinalGrade /><Typography as="span" variant="h2" tone="accent">分</Typography></div>}
            <div className="aipe-dual-evaluation-result-rule" />
            <Typography as="p" variant="body" tone="muted">平均汇总</Typography>
          </div>
        </section>
      </div>
      <StepArrow className="aipe-dual-evaluation-arrow--submit" revealed={phase > 0} />
      <svg className="aipe-dual-evaluation-merge" data-revealed={phase >= 3} viewBox="0 0 48 370" aria-hidden="true"><path pathLength="1" d="M5 4Q29 4 29 29V158Q29 185 44 185Q29 185 29 212V341Q29 366 5 366" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
      <StepArrow className="aipe-dual-evaluation-arrow--result" revealed={phase === 4} />
    </div>
  </ContentBlock>;
}

