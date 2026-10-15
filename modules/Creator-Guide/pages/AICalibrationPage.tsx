import { ContentBlock, Typography } from '../../shared/react';
import { WormholeScene } from '../components/WormholeScene';
import { matterModel, travelComparison } from '../components/wormholeMatter';
import './WormholePages.css';
import '../components/WormholeLab.css';
import './AICalibrationPage.css';

const model = matterModel(1, -.5);
const comparison = travelComparison(1, -.5);
function Clock({ onboard }: { onboard: boolean }) {
  return <div className="cg-calibration-clock"><svg viewBox="0 0 140 140" role="img" aria-label={onboard ? '船上时钟示意，无数值预测' : '外部时钟示意，无数值预测'}><circle cx="70" cy="70" r="60" fill="white" stroke="#aec3da" strokeWidth="3"/>{Array.from({length:12},(_,i)=><path key={i} d="M70 18v8" transform={'rotate('+i*30+' 70 70)'} stroke="#597394" strokeWidth="2"/>)}<path d={onboard ? 'M70 70L99 47M70 70L85 100' : 'M70 70V35M70 70L100 85'} fill="none" stroke="#2c4a72" strokeWidth="5" strokeLinecap="round"/><circle cx="70" cy="70" r="5" fill="#2c4a72"/></svg><Typography variant="bodySmall" tone="accent">{onboard ? '船上' : '外部'}</Typography></div>;
}

function WarningIcon() {
  return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M13 5a3.5 3.5 0 0 1 6 0l12 21a3 3 0 0 1-3 4H4a3 3 0 0 1-3-4Z" fill="currentColor"/><path d="M16 11v9" stroke="white" strokeWidth="3" strokeLinecap="round"/><circle cx="16" cy="25" r="1.7" fill="white"/></svg>;
}
const reasons = [
  {title:'训练资料有问题',detail:'错误、缺漏与矛盾',path:'M6 9c0-6 28-6 28 0s-28 6-28 0Zm0 0v22c0 6 28 6 28 0V9M6 20c0 6 28 6 28 0'},
  {title:'知识运用不可靠',detail:'会复述，不保证会迁移',path:'M9 4h22v32H9ZM15 12h10M15 20h10M15 28h6'},
  {title:'推理仍会失误',detail:'前提、关系或步骤出错',path:'M17 11 9 28M23 11l8 17M13 31h14M25 7a5 5 0 1 0-10 0 5 5 0 0 0 10 0ZM14 32a5 5 0 1 0-10 0 5 5 0 0 0 10 0ZM36 32a5 5 0 1 0-10 0 5 5 0 0 0 10 0Z'},
];
export function AICalibrationPage() {
  const shortcut = comparison.wormholeTime!;
  return <ContentBlock className="cg-wormhole-page cg-calibration-page cg-creator-typography" headingLevel={1} title="百年前的知识，今天的 AI 仍可能讲错" subtitle="即使是顶尖模型，掌握知识也不保证每次都正确运用。" bodyClassName="cg-calibration-body">
    <div className="cg-calibration-timeline" aria-label="理论发表时间与今天的模型风险">{[
      ['1905','狭义相对论'],['1915','广义相对论'],['1988','可穿越虫洞模型'],['今天','顶尖 AI 仍可能出错'],
    ].map(([year,label],i)=><div key={year} className="cg-calibration-milestone"><span className={i===3?'cg-calibration-node is-warning':'cg-calibration-node'}>{i===3&&<WarningIcon/>}</span><Typography variant="h3" tone="accent">{year}</Typography><Typography variant="bodySmall" tone="muted">{label}</Typography></div>)}</div>
    <div className="cg-calibration-content">
      <section className="cg-calibration-example">
        <div className="cg-calibration-scene-row"><div className="cg-calibration-visual"><WormholeScene throat={model.throat} ratio={model.ratio} valid={model.valid} paths={comparison.paths} interactive={false} animate={false}/></div><div className="cg-calibration-question"><Typography variant="h2" tone="accent">这是谁的时间？</Typography><div className="cg-calibration-clocks"><Clock onboard/><Clock onboard={false}/></div></div></div>
        <div className="cg-calibration-time-warning"><WarningIcon/><Typography variant="bodySmall" tone="inherit">以下时间可能有误，需核验模型与计时口径</Typography></div>
        <div className="cg-calibration-times">{[
          ['原有路径',comparison.originalTime],['虫洞路径',shortcut],['节省时间',comparison.originalTime-shortcut],
        ].map(([label,time])=><div key={String(label)} className="cg-calibration-time-card"><div className="cg-calibration-time-heading"><Typography variant="bodySmall" tone="inherit">{label}</Typography><Typography variant="bodySmall" tone="inherit" className="cg-calibration-risk-label">可能有误</Typography></div><Typography variant="h3" tone="inherit">{Number(time).toFixed(1)} 秒</Typography></div>)}</div>
      </section>
      <aside className="cg-calibration-reasons"><Typography as="h2" variant="h2" tone="accent">为什么仍会出错？</Typography>{reasons.map(reason=><div className="cg-calibration-reason" key={reason.title}><span className="cg-calibration-reason-icon"><svg viewBox="0 0 40 40" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d={reason.path}/></svg></span><div><Typography as="h3" variant="h3" tone="accent">{reason.title}</Typography><Typography variant="bodySmall" tone="muted">{reason.detail}</Typography></div></div>)}</aside>
    </div>
  </ContentBlock>;
}

