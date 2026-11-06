import { useId } from 'react';
import { ContentBlock, Typography } from '../../../shared/react';
import outline from '../../outlines.json';
import './EngineeringCollaborationPage.css';

function WorkScene({ stage }: { stage: 'problem' | 'collaborate' | 'experience' }) {
  const id = useId().replace(/:/g, '');
  const blue = `url(#${id}-blue)`;
  const paper = `url(#${id}-paper)`;
  const orange = `url(#${id}-orange)`;
  const together = stage === 'collaborate';
  const problem = stage === 'problem';
  const screenX = together ? 108 : 48;
  const screenY = together ? 65 : 80;
  return <div className="acw-engineering-illustration">
    <svg viewBox="0 0 400 310" role="img" aria-label={{ problem: '课件制作中出现问题', collaborate: '人与AI一起动手修复同一份课件', experience: '课件完成验证，积累工程经验' }[stage]}>
      <defs>
        <linearGradient id={`${id}-blue`} x1="0" y1="0" x2="0.5" y2="1"><stop stopColor="#8cc4ff" /><stop offset="1" stopColor="#1673f6" /></linearGradient>
        <linearGradient id={`${id}-paper`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff" /><stop offset="1" stopColor="#e4eeff" /></linearGradient>
        <linearGradient id={`${id}-orange`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffd182" /><stop offset="1" stopColor="#f07e47" /></linearGradient>
        <filter id={`${id}-shadow`} x="-25%" y="-25%" width="160%" height="170%"><feDropShadow dx="0" dy="7" stdDeviation="4" floodColor="#27446e" floodOpacity=".14" /></filter>
      </defs>
      <g filter={`url(#${id}-shadow)`}>
        <g transform={`translate(${screenX} ${screenY})`}>
          <path d="M106 171L77 206M130 171L159 206" stroke="#5e83b3" strokeWidth="10" strokeLinecap="round" />
          <rect x="5" y="4" width="230" height="170" rx="9" fill={paper} stroke="#78acf3" strokeWidth="7" />
          <rect x="-3" y="-3" width="247" height="15" rx="7" fill={blue} />
          <rect x="-3" y="163" width="247" height="15" rx="7" fill={blue} />
          <path d="M160 43H209M160 64H209M160 85H197" stroke="#a2bfeb" strokeWidth="7" strokeLinecap="round" />
          <path d="M39 117L88 76L137 117" fill="none" stroke="#458be9" strokeWidth="5" strokeDasharray={problem ? '6 6' : undefined} />
          {[[39,117],[88,76],[137,117]].map(([cx,cy])=><circle key={cx} cx={cx} cy={cy} r="12" fill={blue} stroke="#e8f2ff" strokeWidth="2" />)}
        </g>
        {problem && <g transform="translate(270 217)"><circle r="35" fill={orange} stroke="#fff4df" strokeWidth="5" /><path d="M0 -18V5" stroke="white" strokeWidth="7" strokeLinecap="round" /><circle cy="18" r="4" fill="white" /></g>}
        {together && <>
          <path d="M37 16H114Q137 16 137 39V73Q137 95 114 95H91L72 110V95H37Q15 95 15 73V39Q15 16 37 16Z" fill={paper} stroke="#c5dcff" strokeWidth="2" />
          <circle cx="92" cy="173" r="29" fill={blue} />
          <path d="M40 285V261Q43 213 92 213Q141 213 145 261V285Z" fill={blue} />
          <path d="M120 258L171 207" stroke="#eef5ff" strokeWidth="31" strokeLinecap="round" /><path d="M120 258L171 207" stroke="#4997fa" strokeWidth="22" strokeLinecap="round" />
          <path d="M160 211C144 189 158 163 180 165L169 180L179 193L193 192L205 177C215 205 188 225 169 214" fill={blue} stroke="#f5f9ff" strokeWidth="4" strokeLinejoin="round" />
        </>}
        {stage === 'experience' && <>
          <circle cx="270" cy="225" r="34" fill={blue} stroke="#f4f8ff" strokeWidth="5" /><path d="M253 224L265 237L289 211" fill="none" stroke="white" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M320 275L353 207" stroke="#ebf4ff" strokeWidth="25" strokeLinecap="round" /><path d="M320 275L353 207" stroke="#438ff1" strokeWidth="17" strokeLinecap="round" />
          <path d="M343 212C326 193 334 169 355 165L349 183L360 193L373 187L377 168C395 190 377 218 355 217" fill={blue} stroke="#e2eeff" strokeWidth="3" strokeLinejoin="round" />
        </>}
      </g>
    </svg>
    {together && <Typography variant="h3" tone="accent" className="acw-engineering-ai">AI</Typography>}
  </div>;
}

function ProgressArrow() {
  return <svg className="acw-engineering-arrow" viewBox="0 0 100 50" aria-hidden="true"><path d="M7 34Q44 8 77 24" fill="none" stroke="#a9ceff" strokeWidth="10" strokeLinecap="round" /><path d="M65 7L94 29L63 41Z" fill="#4896fb" /></svg>;
}

export function EngineeringCollaborationPage() {
  return <ContentBlock className="acw-engineering-page" data-scene-id="learn-through-engineering-challenges" title={outline.pages[2].title} subtitle="在真实挑战中，积累动手解决问题的经验" bodyClassName="acw-engineering-body">
    <div className="acw-engineering-sequence">
      <div className="acw-engineering-stage"><WorkScene stage="problem" /><Typography variant="h3" align="center">遇到问题</Typography></div>
      <ProgressArrow />
      <div className="acw-engineering-stage"><WorkScene stage="collaborate" /><Typography variant="h3" align="center">和 AI 一起动手解决</Typography></div>
      <ProgressArrow />
      <div className="acw-engineering-stage"><WorkScene stage="experience" /><Typography variant="h3" align="center">积累工程经验</Typography></div>
    </div>
    <Typography variant="subtitle" align="center" className="acw-engineering-takeaway">把一个个问题解决掉，就是在练自己的工程能力。</Typography>
  </ContentBlock>;
}
