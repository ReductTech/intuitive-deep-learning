import { useId } from 'react';
import { ContentBlock, Typography } from '../../../shared/react';
import outline from '../../outlines.json';
import './CreatorJudgmentPage.css';

function JudgmentArtwork({ kind }: { kind: 'target' | 'palette' | 'course' }) {
  const id = useId().replace(/:/g, '');
  const blue = `url(#${id}-blue)`;
  const paper = `url(#${id}-paper)`;
  const orange = `url(#${id}-orange)`;
  return <svg viewBox="0 0 400 300" className="acw-judgment-art" role="img" aria-label={{ target: '产品思维：让学习者看懂什么', palette: '审美判断：让知识怎样呈现更清楚', course: '两种判断共同塑造课件作品' }[kind]}>
    <defs>
      <linearGradient id={`${id}-blue`} x1="0" y1="0" x2=".6" y2="1"><stop stopColor="#91c4ff" /><stop offset="1" stopColor="#1673f6" /></linearGradient>
      <linearGradient id={`${id}-paper`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff" /><stop offset="1" stopColor="#dfebff" /></linearGradient>
      <linearGradient id={`${id}-orange`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffdb88" /><stop offset="1" stopColor="#f28b47" /></linearGradient>
      <filter id={`${id}-shadow`} x="-25%" y="-25%" width="160%" height="175%"><feDropShadow dx="0" dy="6" stdDeviation="4" floodColor="#27446e" floodOpacity=".15" /></filter>
    </defs>
    <g filter={`url(#${id}-shadow)`}>
      {kind === 'target' && <>
        <circle cx="180" cy="163" r="105" fill={blue} /><circle cx="180" cy="163" r="82" fill={paper} /><circle cx="180" cy="163" r="60" fill={blue} /><circle cx="180" cy="163" r="38" fill={paper} /><circle cx="180" cy="163" r="15" fill={blue} />
        <path d="M181 162L290 53" stroke="#fff" strokeWidth="25" strokeLinecap="round" /><path d="M181 162L290 53" stroke="#448ff4" strokeWidth="14" strokeLinecap="round" />
        <path d="M265 74L261 40L290 12L294 47L329 51L300 80Z" fill={blue} stroke="#eff7ff" strokeWidth="4" strokeLinejoin="round" />
      </>}
      {kind === 'palette' && <>
        <path d="M222 40C151 14 71 43 41 104C5 176 59 253 139 258C164 260 184 250 178 227C169 197 187 182 217 188C242 194 273 187 286 166C320 113 277 60 222 40Z" fill="#fff9eb" stroke="#ffdfa8" strokeWidth="4" />
        {[[94,107],[150,75],[210,89],[70,166]].map(([cx,cy])=><circle key={cx} cx={cx} cy={cy} r="19" fill={orange} />)}
        <circle cx="131" cy="213" r="17" fill="#fff" stroke="#ffe5bc" strokeWidth="3" />
        <path d="M202 248L278 116" stroke="#fff" strokeWidth="24" strokeLinecap="round" /><path d="M202 248L278 116" stroke="#448df0" strokeWidth="15" strokeLinecap="round" />
        <path d="M260 129C254 93 290 86 309 63C314 97 311 121 284 138Z" fill={orange} stroke="#fff7e8" strokeWidth="4" />
      </>}
      {kind === 'course' && <>
        <path d="M180 236L150 277M208 236L239 277" stroke="#5d82b0" strokeWidth="11" strokeLinecap="round" />
        <rect x="28" y="28" width="344" height="216" rx="12" fill={paper} stroke="#80b1f5" strokeWidth="7" />
        <rect x="17" y="20" width="366" height="19" rx="9" fill={blue} />
        <rect x="17" y="233" width="366" height="19" rx="9" fill={blue} />
        <path d="M272 87H333M272 109H333M272 131H322" stroke="#a1bfee" strokeWidth="8" strokeLinecap="round" />
        <path d="M155 119V145M86 145H226M86 145V171M155 145V171M226 145V171" stroke="#6a9be6" strokeWidth="4" fill="none" />
        <rect x="125" y="83" width="60" height="38" rx="11" fill={blue} />
        {[57,126,197].map(x=><rect key={x} x={x} y="171" width="58" height="27" rx="9" fill={blue} />)}
      </>}
    </g>
  </svg>;
}

export function CreatorJudgmentPage() {
  return <ContentBlock className="acw-judgment-page" data-scene-id="develop-creator-judgment" title={outline.pages[3].title} subtitle="当实现越来越容易，判断与取舍更值得练习" bodyClassName="acw-judgment-body">
    <div className="acw-judgment-lens acw-judgment-lens-product" aria-hidden="true" />
    <div className="acw-judgment-lens acw-judgment-lens-taste" aria-hidden="true" />
    <div className="acw-judgment-product">
      <JudgmentArtwork kind="target" />
      <Typography variant="h3" align="center">产品思维</Typography>
      <Typography variant="subtitle" tone="muted" align="center">让学习者看懂什么</Typography>
    </div>
    <div className="acw-judgment-work">
      <Typography variant="h3" className="acw-judgment-work-label">好的作品</Typography>
      <JudgmentArtwork kind="course" />
      <Typography variant="h3" align="center">在制作课件中练习</Typography>
    </div>
    <div className="acw-judgment-taste">
      <JudgmentArtwork kind="palette" />
      <Typography variant="h3" align="center">审美判断</Typography>
      <Typography variant="subtitle" tone="muted" align="center">让知识怎样呈现更清楚</Typography>
    </div>
    <Typography variant="subtitle" tone="muted" align="center" className="acw-judgment-takeaway">在真实创作中，练习常规课程较少涉及的产品思维与审美判断。</Typography>
  </ContentBlock>;
}
