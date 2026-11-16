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
  return <svg shuku-edit-id="e-6fd3034f-5189-4ba7-b10c-d8c3380ee5b6" className="aipe-dual-evaluation-handwriting" viewBox="0 0 252 185" role="img" aria-label={`${average}分`} data-final-score={average}>
    <g shuku-edit-id="e-7addfa65-2b66-4c29-89f3-35178acaf01e" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path shuku-edit-id="e-849fea28-1497-42f8-8734-df0c9464e132" className="aipe-dual-evaluation-digit" data-digit="first" pathLength="1" d={eightStroke} />
      <path shuku-edit-id="e-6f2af8cf-7375-4271-be68-5d30b661a097" className="aipe-dual-evaluation-digit" data-digit="second" pathLength="1" d={eightStroke} transform="translate(112 0)" />
    </g>
  </svg>;
}

function StepArrow({ className, revealed }: { className: string; revealed: boolean }) {
  return <svg shuku-edit-id="e-77688714-ac3b-4ee1-acde-fafd840e8fda" className={`aipe-dual-evaluation-arrow ${className}`} data-revealed={revealed} viewBox="0 0 70 34" aria-hidden="true">
    <path shuku-edit-id="e-1bbfc2a9-2188-4a38-9b43-7ea56f8fd5c2" d="M3 17H62M49 4L63 17L49 30" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
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

  return <ContentBlock shuku-edit-id="e-c9e17226-288d-4f3f-ab7b-e2004aafa5c0" ref={root} title={outline.pages.find(page => page.id === '571b454b-3650-4ee0-bb95-43d41371c7ac')!.title} headingLevel={1} className="aipe-dual-evaluation-page" bodyClassName="aipe-dual-evaluation-body">
    <div shuku-edit-id="e-0a7a98c9-afee-4c90-9a39-cf6deaef2d4c" className="aipe-dual-evaluation-composition" data-phase={phase} data-active={active} data-reduced-motion={reducedMotion}>
      <div shuku-edit-id="e-96d20181-0a75-468a-8df8-92fb0f161c5e" className="aipe-dual-evaluation-layout">
        <section shuku-edit-id="e-802ddc5b-521e-432f-b7aa-69b5adb6a4cf" className="aipe-dual-evaluation-courseware" aria-labelledby="aipe-dual-evaluation-work-title">
          <Typography shuku-edit-id="e-67ea31cd-341e-4439-893b-a6fe97696d68" as="h2" variant="h2" tone="accent" id="aipe-dual-evaluation-work-title">学生实践成果</Typography>
          <Typography shuku-edit-id="e-54a1d8ec-3bbd-44a5-a766-79a64f2e4b86" as="p" variant="bodySmall" tone="muted" className="aipe-dual-evaluation-evidence">知识呈现作品 + 课后专题实践内容</Typography>
          <figure shuku-edit-id="e-c807dc48-66a5-4f78-912c-2e0da29f7152" className="aipe-dual-evaluation-stack" data-expanded={expanded} aria-label="三张实践成果示例，由叠放展开为扇形">
            {thumbnails.map((thumbnail, index) => <img shuku-edit-id="e-01166364-04b8-44ad-a5f7-187069431cd6" key={thumbnail.path} className={`aipe-dual-evaluation-thumbnail aipe-dual-evaluation-thumbnail--${index}`} src={moduleAssetUrl(thumbnail.path)} width="400" height="225" alt={thumbnail.label} draggable={false} />)}
            <Typography shuku-edit-id="e-89890627-9c5e-4515-9662-608ff5bdc3ee" as="figcaption" variant="bodySmall" tone="muted">知识呈现 · Jittor 复现 · 实验分析</Typography>
          </figure>
        </section>
        <section shuku-edit-id="e-da9fe955-ed22-49b8-a972-176997993176" className="aipe-dual-evaluation-review" aria-labelledby="aipe-dual-evaluation-review-title">
          <Typography shuku-edit-id="e-958fc2ae-cb48-443f-acb7-22bb073b928c" as="h2" variant="h2" tone="accent" id="aipe-dual-evaluation-review-title">多方评分</Typography>
          <div shuku-edit-id="e-798996ca-1db1-4e9f-ac76-2f27afd6e17d" className="aipe-dual-evaluation-reviewers">
            {reviewers.map(({ label, score, Icon }, index) => <div shuku-edit-id="e-ff3b0b02-6f73-4efb-bd09-1524fd5a72b8" key={label} className="aipe-dual-evaluation-reviewer" data-reviewer={index} data-revealed={phase > index} aria-hidden={phase <= index}>
              <Icon aria-hidden="true" strokeWidth={1.65} />
              <Typography shuku-edit-id="e-7b2c216a-df91-43c1-a3d0-a252c0977dd1" as="span" variant="body" tone="accent"><strong shuku-edit-id="e-19246225-d8e1-463e-bc79-e023a0929497">{label}</strong></Typography>
              <Typography shuku-edit-id="e-bc5483e1-b739-464b-9791-0f6a9ac94eea" as="span" variant="display" tone="accent" className="aipe-dual-evaluation-reviewer-score">{score}</Typography>
            </div>)}
          </div>
        </section>
        <section shuku-edit-id="e-edd5212f-c557-4457-9664-6d94c5136021" className="aipe-dual-evaluation-result" aria-labelledby="aipe-dual-evaluation-result-title">
          <Typography shuku-edit-id="e-f31743c3-f1f3-4ba5-b3f9-3d1ac96759e5" as="h2" variant="h2" tone="accent" id="aipe-dual-evaluation-result-title">考核成绩</Typography>
          <div shuku-edit-id="e-e7ed6c39-d701-4097-a0d9-59ab0e037eed" className="aipe-dual-evaluation-result-content" data-revealed={phase === 4} aria-hidden={phase !== 4}>
            {phase === 4 && <div shuku-edit-id="e-f137bd4b-b50c-4790-9c4c-c4d29c5e5486" className="aipe-dual-evaluation-grade"><FinalGrade /><Typography shuku-edit-id="e-d86f486b-23ab-468c-9d69-44de19bdaa02" as="span" variant="h2" tone="accent">分</Typography></div>}
            <div shuku-edit-id="e-ec1b746d-2908-4d08-8367-da8d7b751060" className="aipe-dual-evaluation-result-rule" />
            <Typography shuku-edit-id="e-e67f5dd3-1d48-4fcb-bb4f-d186b552b0ac" as="p" variant="body" tone="muted">平均汇总</Typography>
          </div>
        </section>
      </div>
      <StepArrow className="aipe-dual-evaluation-arrow--submit" revealed={phase > 0} />
      <svg shuku-edit-id="e-e93cffae-3162-4cb8-b592-04b0e5bf68cd" className="aipe-dual-evaluation-merge" data-revealed={phase >= 3} viewBox="0 0 48 370" aria-hidden="true"><path shuku-edit-id="e-41b7c20b-c622-4034-8e58-6c54b9c91f75" pathLength="1" d="M5 4Q29 4 29 29V158Q29 185 44 185Q29 185 29 212V341Q29 366 5 366" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
      <StepArrow className="aipe-dual-evaluation-arrow--result" revealed={phase === 4} />
    </div>
  </ContentBlock>;
}

