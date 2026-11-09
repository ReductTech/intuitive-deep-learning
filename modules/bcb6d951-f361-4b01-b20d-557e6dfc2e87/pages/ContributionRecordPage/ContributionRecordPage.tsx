import { useId } from 'react';
import { GitBranch, Lightbulb, SlidersHorizontal, UserRound } from 'lucide-react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import './ContributionRecordPage.css';

function CoursePreview() {
  const id = useId().replace(/:/g, '');
  return <div className="acw-credit-preview">
    <svg viewBox="0 0 500 320" role="img" aria-label="作为个人作品展示的课件示意">
      <defs>
        <linearGradient id={`${id}-blue`} x1="0" y1="0" x2=".5" y2="1"><stop stopColor="#8ac0ff" /><stop offset="1" stopColor="#1673f6" /></linearGradient>
        <linearGradient id={`${id}-paper`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff" /><stop offset="1" stopColor="#e4eeff" /></linearGradient>
        <filter id={`${id}-shadow`} x="-20%" y="-20%" width="150%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="4" floodColor="#27446e" floodOpacity=".12" /></filter>
      </defs>
      <g filter={`url(#${id}-shadow)`}>
        <rect x="15" y="15" width="470" height="286" rx="18" fill={`url(#${id}-paper)`} stroke="#b5d2ff" strokeWidth="3" />
        <rect x="13" y="8" width="474" height="21" rx="10" fill={`url(#${id}-blue)`} />
        <path d="M24 243H477V283Q477 296 461 296H39Q24 296 24 281Z" fill="#e5efff" />
        <path d="M195 114V148M105 148H285M105 148V184M195 148V184M285 148V184" fill="none" stroke="#76a6ef" strokeWidth="4" />
        <rect x="158" y="70" width="74" height="46" rx="13" fill={`url(#${id}-blue)`} />
        {[68,158,248].map(x=><rect key={x} x={x} y="184" width="74" height="34" rx="12" fill={`url(#${id}-blue)`} />)}
        <path d="M337 74H424M337 98H424M337 122H410" stroke="#a0bfee" strokeWidth="8" strokeLinecap="round" />
        <path d="M433 254L462 304L441 296L431 313L421 306L431 288L410 286Z" fill="#1673f6" stroke="white" strokeWidth="4" strokeLinejoin="round" />
        <path d="M418 244L412 235M437 239L439 227M452 247L461 240" stroke="#6eacff" strokeWidth="5" strokeLinecap="round" />
      </g>
    </svg>
    <Typography variant="h3" align="center" className="acw-credit-preview-label">课件作品</Typography>
  </div>;
}

const contributionTopics = [
  { icon: UserRound, label: '我负责什么' },
  { icon: Lightbulb, label: '我解决了什么' },
  { icon: SlidersHorizontal, label: '我怎样把它改好' },
];

export function ContributionRecordPage() {
  const page = outline.pages.find(item => item.id === 'ce4ed8dd-ce1b-4b0c-a36a-cc9745f46b90')!;
  return <ContentBlock className="acw-credit-page" data-scene-id={page.id} title={page.title} subtitle="把真实做过的事，变成可以展示的项目经历" bodyClassName="acw-credit-body">
    <section className="acw-credit-profile" aria-label="个人课件作品档案示意">
      <header className="acw-credit-profile-header">
        <div className="acw-credit-identity"><div className="acw-credit-avatar"><UserRound size={42} strokeWidth={2} /></div><Typography variant="h3">你的作品档案</Typography></div>
        <div className="acw-credit-history"><GitBranch size={28} /><Typography variant="bodySmall" tone="inherit">Git 版本管理</Typography><Typography variant="body" className="acw-credit-trace">贡献可追溯</Typography></div>
      </header>
      <div className="acw-credit-profile-content">
        <CoursePreview />
        <div className="acw-credit-topics">{contributionTopics.map(({icon: Icon, label})=><div className="acw-credit-topic" key={label}><div className="acw-credit-topic-icon"><Icon size={43} strokeWidth={2} /></div><Typography variant="h3">{label}</Typography></div>)}</div>
      </div>
    </section>
    <Typography variant="subtitle" align="center" className="acw-credit-contexts">保研交流 · 求职面试 · …</Typography>
  </ContentBlock>;
}
