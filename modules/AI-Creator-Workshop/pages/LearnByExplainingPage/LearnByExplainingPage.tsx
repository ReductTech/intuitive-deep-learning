import { useId } from 'react';
import { ContentBlock, Typography } from '../../../shared/react';
import outline from '../../outlines.json';
import './LearnByExplainingPage.css';

function CourseIllustration({ kind }: { kind: 'concept' | 'teach' | 'gap' | 'revise' }) {
  const id = useId().replace(/:/g, '');
  const blue = `url(#${id}-blue)`;
  const paper = `url(#${id}-paper)`;
  const orange = `url(#${id}-orange)`;
  const isBook = kind === 'concept';
  const isGap = kind === 'gap';
  const isRevision = kind === 'revise';
  return <svg className="acw-learning-art" viewBox="0 0 300 220" role="img" aria-label={{ concept: '从书本中选出一个知识点', teach: '把知识做成课件，讲给学习者听', gap: '放大检查课件中讲不清的知识联系', revise: '查阅资料，补全理解后修改课件' }[kind]}>
    <defs>
      <linearGradient id={`${id}-blue`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#88beff" /><stop offset="1" stopColor="#1673f6" /></linearGradient>
      <linearGradient id={`${id}-paper`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff" /><stop offset="1" stopColor="#e2ecff" /></linearGradient>
      <linearGradient id={`${id}-orange`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffce75" /><stop offset="1" stopColor="#f07e47" /></linearGradient>
      <filter id={`${id}-shadow`} x="-30%" y="-30%" width="170%" height="180%"><feDropShadow dx="0" dy="8" stdDeviation="5" floodColor="#27446e" floodOpacity=".16" /></filter>
    </defs>
    <g filter={`url(#${id}-shadow)`}>
      {isBook ? <>
        <path d="M27 56Q87 29 149 52Q209 29 272 54L277 184Q213 165 150 189Q87 167 22 187Z" fill={blue} stroke="#3a85ee" strokeWidth="3" />
        <path d="M32 43Q92 21 149 46Q212 22 267 41L269 172Q208 153 150 177Q91 154 30 174Z" fill={paper} stroke="#d0dff4" strokeWidth="2" />
        <path d="M149 47V176" stroke="#c4d6ef" strokeWidth="3" />
        {[68,95,122,149].map(y => <path key={y} d={`M50 ${y}Q91 ${y-10} 128 ${y+1}`} fill="none" stroke="#bfcee3" strokeWidth="6" strokeLinecap="round" />)}
        <rect x="166" y="56" width="86" height="84" rx="12" fill="#fff1cd" stroke="#ffcc76" strokeWidth="3" />
        <path d="M209 79L188 116M209 79L232 116" stroke="#2d7ee9" strokeWidth="5" />
        {[[209,79],[188,116],[232,116]].map(([cx,cy])=><circle key={cx} cx={cx} cy={cy} r="10" fill={blue} stroke="white" strokeWidth="2" />)}
      </> : <>
        <path d="M139 171L111 207M159 171L187 207" stroke="#557cae" strokeWidth="10" strokeLinecap="round" />
        <rect x="35" y="30" width="228" height="148" rx="12" fill={blue} stroke="#5d9eee" strokeWidth="3" />
        <rect x="45" y="41" width="208" height="124" rx="5" fill={paper} />
        <rect x="27" y="25" width="244" height="15" rx="7" fill={blue} />
        <rect x="27" y="165" width="244" height="15" rx="7" fill={blue} />
        <path d="M63 59H124M175 77H228M175 99H228M175 121H218" stroke="#a0bfee" strokeWidth="7" strokeLinecap="round" />
        <path d="M113 84L83 135" stroke="#4089ea" strokeWidth="5" />
        <path d="M113 84L144 135" stroke={isGap ? '#f07e47' : '#4089ea'} strokeWidth="5" strokeDasharray={isGap ? '5 7' : undefined} />
        {[[113,84],[83,135]].map(([cx,cy]) => <circle key={cx} cx={cx} cy={cy} r="12" fill={blue} stroke="#599cec" strokeWidth="2" />)}
        <circle cx="144" cy="135" r="12" fill={isGap ? '#fff7e9' : blue} stroke={isGap ? '#f07e47' : '#599cec'} strokeWidth="3" strokeDasharray={isGap ? '5 4' : undefined} />
        {kind === 'teach' && <>
          <path d="M207 9H268Q285 9 285 27V45Q285 62 267 62H244L228 76V62H207Q191 62 191 45V27Q191 9 207 9Z" fill={paper} stroke="#d0dff4" strokeWidth="2" />
          {[215,239,263].map(cx => <circle key={cx} cx={cx} cy="36" r="5" fill="#4389ed" />)}
          {[210,264].map(cx => <g key={cx}><circle cx={cx} cy="161" r="17" fill={blue} /><path d={`M${cx-25} 213V200Q${cx-24} 179 ${cx} 179Q${cx+24} 179 ${cx+25} 200V213Z`} fill={blue} /></g>)}
        </>}
        {isGap && <>
          <path d="M219 151L266 199" stroke="#f29b43" strokeWidth="22" strokeLinecap="round" />
          <circle cx="188" cy="113" r="61" fill="#ffffff65" stroke={orange} strokeWidth="15" />
          <path d="M195 86C195 67 224 69 224 85C224 98 209 98 209 110" fill="none" stroke="#ee8c35" strokeWidth="7" strokeLinecap="round" /><circle cx="209" cy="124" r="4" fill="#ee8c35" />
        </>}
        {isRevision && <>
          <path d="M8 157Q46 140 79 155Q113 142 149 153L147 210Q112 200 79 214Q44 200 7 211Z" fill={paper} stroke="#8db6ed" strokeWidth="3" />
          <path d="M79 157V211M22 170L62 176M22 184L62 190M95 170L132 165M95 184L132 179" stroke="#bfcee3" strokeWidth="4" />
          <path d="M60 194L99 132L114 142L75 204Z" fill={blue} stroke="#4a8de5" strokeWidth="2" /><path d="M60 194L57 211L75 204Z" fill="#f3c688" />
        </>}
      </>}
    </g>
  </svg>;
}

export function LearnByExplainingPage() {
  return <ContentBlock className="acw-learning-page" data-scene-id="learn-by-explaining" title={outline.pages[1].title} subtitle="费曼学习法 · Feynman Technique" bodyClassName="acw-learning-body">
    <svg className="acw-learning-arrows" viewBox="0 0 1538 680" aria-hidden="true">
      <defs><linearGradient id="acw-learning-arrow-blue"><stop stopColor="#d7e8ff" /><stop offset="1" stopColor="#4094ff" /></linearGradient><marker id="acw-learning-arrowhead" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0 0L5 2.5L0 5Z" fill="#4094ff" /></marker></defs>
      <g fill="none" stroke="url(#acw-learning-arrow-blue)" strokeWidth="12" strokeLinecap="round" markerEnd="url(#acw-learning-arrowhead)">
        <path d="M640 105Q755 52 865 105" /><path d="M1100 245Q1142 323 1100 397" /><path d="M857 565Q750 610 648 565" /><path d="M445 403Q403 323 445 245" />
      </g>
    </svg>
    <div className="acw-learning-stage acw-learning-one"><Typography variant="h2" className="acw-learning-label"><span>1</span> 选一个知识点</Typography><CourseIllustration kind="concept" /></div>
    <div className="acw-learning-stage acw-learning-two"><CourseIllustration kind="teach" /><Typography variant="h2" className="acw-learning-label"><span>2</span><span>做成课件<br />讲给别人听</span></Typography></div>
    <div className="acw-learning-center"><Typography variant="display" align="center">给别人讲一遍<br />让自己理解更深</Typography></div>
    <div className="acw-learning-stage acw-learning-three"><CourseIllustration kind="gap" /><Typography variant="h2" className="acw-learning-label"><span>3</span><span>发现讲不清<br />的地方</span></Typography></div>
    <div className="acw-learning-stage acw-learning-four"><Typography variant="h2" className="acw-learning-label"><span>4</span><span>补全理解<br />修改课件</span></Typography><CourseIllustration kind="revise" /></div>
    <Typography variant="subtitle" tone="muted" align="center" className="acw-learning-takeaway">你在帮助别人学习，也在重新学懂自己的知识。</Typography>
  </ContentBlock>;
}
