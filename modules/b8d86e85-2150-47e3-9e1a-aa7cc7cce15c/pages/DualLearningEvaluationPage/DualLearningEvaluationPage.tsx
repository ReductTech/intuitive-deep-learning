import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useRef, useState } from 'react';
import { Bot, UserRound, UsersRound } from 'lucide-react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import './DualLearningEvaluationPage.css';

const reviewers = [
  { label: '教师评分', score: 90, Icon: UserRound },
  { label: '学生互评', score: 86, Icon: UsersRound },
  { label: '智能体评分', score: 88, Icon: Bot },
] as const;
const average = reviewers.reduce((sum, reviewer) => sum + reviewer.score, 0) / reviewers.length;
const thumbnails = [
  { path: "workflow/course-thumbnails/weight-sharing.webp", label: '权重共享：同一套权重反复使用' },
  { path: "workflow/course-thumbnails/window-scan.webp", label: '棋形的局部匹配' },
  { path: "workflow/course-thumbnails/kernel-basics.webp", label: '卷积核：输入图像、卷积核与输出特征图' },
] as const;

const eightStroke = 'M83 17C57 8 35 24 38 46C41 64 64 77 86 91C112 107 115 130 100 149C86 166 48 169 33 148C15 122 43 96 68 79C92 64 113 43 101 26C97 20 91 18 83 17';

function FinalGrade() {
  return <svg shuku-edit-id="e-307a5767-bbe0-4dd0-aca5-319eed06d04f" className="aipe-dual-evaluation-handwriting" viewBox="0 0 252 185" role="img" aria-label={`${average}分`} data-final-score={average}>
    <g shuku-edit-id="e-45a0e92d-b4e2-4a75-9f84-3c53fc7a9a4e" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path shuku-edit-id="e-981afa28-54d4-4a3a-98ac-25ef5e6b41a6" className="aipe-dual-evaluation-digit" data-digit="first" pathLength="1" d={eightStroke} />
      <path shuku-edit-id="e-39542709-d58d-477d-8b49-f65df684601c" className="aipe-dual-evaluation-digit" data-digit="second" pathLength="1" d={eightStroke} transform="translate(112 0)" />
    </g>
  </svg>;
}

function StepArrow({ className, revealed }: { className: string; revealed: boolean }) {
  return <svg shuku-edit-id="e-e2cd8298-a96a-4fc1-b785-f3aea5b52723" className={`aipe-dual-evaluation-arrow ${className}`} data-revealed={revealed} viewBox="0 0 70 34" aria-hidden="true">
    <path shuku-edit-id="e-bb51f57f-69c1-4712-9f3d-44f4e734c3d2" d="M3 17H62M49 4L63 17L49 30" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
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

  return <ContentBlock shuku-edit-id="e-ef8b66aa-67f6-4e3d-8eca-ad561ded06f1" ref={root} title={outline.pages.find(page => page.id === '6999d97a-3ec8-4c01-9d0a-bfc9a342e27b')!.title} headingLevel={1} className="aipe-dual-evaluation-page" bodyClassName="aipe-dual-evaluation-body">
    <div shuku-edit-id="e-723e0808-4d34-4dec-8c1d-5537614a4442" className="aipe-dual-evaluation-composition" data-phase={phase} data-active={active} data-reduced-motion={reducedMotion}>
      <div shuku-edit-id="e-85b38676-bf66-4145-ba70-ffb078f51875" className="aipe-dual-evaluation-layout">
        <section shuku-edit-id="e-00c38f26-086f-4404-bf44-d8a2d96d4b64" className="aipe-dual-evaluation-courseware" aria-labelledby="aipe-dual-evaluation-work-title">
          <Typography shuku-edit-id="e-f689f073-7e25-4f06-a4c1-63db7150e5e0" as="h2" variant="h2" tone="accent" id="aipe-dual-evaluation-work-title">学生实践成果</Typography>
          <Typography shuku-edit-id="e-59461296-4c18-4888-b9a6-ab03d8d14a59" as="p" variant="bodySmall" tone="muted" className="aipe-dual-evaluation-evidence">知识呈现作品 + 课后专题实践内容</Typography>
          <figure shuku-edit-id="e-5755f069-ff5f-4c42-8a58-a58c311e11d8" className="aipe-dual-evaluation-stack" data-expanded={expanded} aria-label="三张实践成果示例，由叠放展开为扇形">
            {thumbnails.map((thumbnail, index) => <img shuku-edit-id="e-a1906306-43ab-496c-827b-2e87d5c44b4a" key={thumbnail.path} className={`aipe-dual-evaluation-thumbnail aipe-dual-evaluation-thumbnail--${index}`} src={moduleAssetUrl(thumbnail.path)} width="400" height="225" alt={thumbnail.label} draggable={false} />)}
            <Typography shuku-edit-id="e-36c46f7d-e965-499a-bec0-c274670fff82" as="figcaption" variant="bodySmall" tone="muted">知识呈现 · Jittor 复现 · 实验分析</Typography>
          </figure>
        </section>
        <section shuku-edit-id="e-d0a8bf49-7089-4727-9fe5-37075b2eb629" className="aipe-dual-evaluation-review" aria-labelledby="aipe-dual-evaluation-review-title">
          <Typography shuku-edit-id="e-798742cc-f02b-48d8-8bc5-a214e5531dc4" as="h2" variant="h2" tone="accent" id="aipe-dual-evaluation-review-title">多方评分</Typography>
          <div shuku-edit-id="e-561b31a4-ab7b-4e08-b4db-fb37f6a37ebc" className="aipe-dual-evaluation-reviewers">
            {reviewers.map(({ label, score, Icon }, index) => <div shuku-edit-id="e-e4df4920-fe4f-474c-bc33-d11a3f9ea532" key={label} className="aipe-dual-evaluation-reviewer" data-reviewer={index} data-revealed={phase > index} aria-hidden={phase <= index}>
              <Icon aria-hidden="true" strokeWidth={1.65} />
              <Typography shuku-edit-id="e-229cb808-2166-43c9-83c3-5f8cca27af4b" as="span" variant="body" tone="accent"><strong shuku-edit-id="e-535d5117-0c62-4dad-a094-493fbec02a60">{label}</strong></Typography>
              <Typography shuku-edit-id="e-dbcc32db-d99a-4970-a5ad-d1fc82e61b55" as="span" variant="display" tone="accent" className="aipe-dual-evaluation-reviewer-score">{score}</Typography>
            </div>)}
          </div>
        </section>
        <section shuku-edit-id="e-4fcb55fe-eb90-44ca-933d-cef044892958" className="aipe-dual-evaluation-result" aria-labelledby="aipe-dual-evaluation-result-title">
          <Typography shuku-edit-id="e-c9b51d94-57fa-4ce3-b079-ef7f13f75953" as="h2" variant="h2" tone="accent" id="aipe-dual-evaluation-result-title">考核成绩</Typography>
          <div shuku-edit-id="e-578b5147-ccda-4e53-bb00-e1c69b128505" className="aipe-dual-evaluation-result-content" data-revealed={phase === 4} aria-hidden={phase !== 4}>
            {phase === 4 && <div shuku-edit-id="e-a8e99205-6822-428d-b794-285ee6c1545c" className="aipe-dual-evaluation-grade"><FinalGrade /><Typography shuku-edit-id="e-2de5d572-af3b-42c8-a820-71a18ee5bdd0" as="span" variant="h2" tone="accent">分</Typography></div>}
            <div shuku-edit-id="e-3ec564c2-28d7-4f79-ba48-9e4754b66bc9" className="aipe-dual-evaluation-result-rule" />
            <Typography shuku-edit-id="e-25ef6ce0-49d7-4def-b07d-9c4c0c85be7b" as="p" variant="body" tone="muted">平均汇总</Typography>
          </div>
        </section>
      </div>
      <StepArrow className="aipe-dual-evaluation-arrow--submit" revealed={phase > 0} />
      <svg shuku-edit-id="e-7aaabc67-8064-420d-9e33-33ace14d35d0" className="aipe-dual-evaluation-merge" data-revealed={phase >= 3} viewBox="0 0 48 370" aria-hidden="true"><path shuku-edit-id="e-3f8e0789-bf53-4c9c-acbf-7c0d21cd7cdf" pathLength="1" d="M5 4Q29 4 29 29V158Q29 185 44 185Q29 185 29 212V341Q29 366 5 366" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
      <StepArrow className="aipe-dual-evaluation-arrow--result" revealed={phase === 4} />
    </div>
  </ContentBlock>;
}

