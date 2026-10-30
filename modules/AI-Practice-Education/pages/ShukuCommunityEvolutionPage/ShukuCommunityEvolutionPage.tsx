import { ContentBlock, Typography, moduleAssetUrl } from '../../../shared/react';
import outline from '../../outlines.json';
import './ShukuCommunityEvolutionPage.css';

const stages = [
  { id: 'feedback', title: '使用与反馈', description: '发现问题，提出新需求', image: 'feedback.png' },
  { id: 'cocreate', title: '师生共创', description: '补充案例，改进讲解', image: 'cocreate.png' },
  { id: 'review', title: '审核改进', description: '核验内容，共同完善', image: 'review.png' },
  { id: 'publish', title: '发布新版', description: '更新课程，供大家使用', image: 'publish.png' },
] as const;
const asset = (name: string) => moduleAssetUrl(outline.moduleIdentity.id, `images/shuku-community/${name}`);

export function ShukuCommunityEvolutionPage() {
  return <ContentBlock title="Shùku：让课程在共创中持续更新"
    subtitle="汇集学习反馈与教学经验，共同打磨更好的学习材料"
    headingLevel={1} className="aipe-shuku-page" bodyClassName="aipe-shuku-body">
    <div className="aipe-shuku-cycle" role="group" aria-label="使用与反馈、师生共创、审核改进、发布新版，再次进入教学使用">
      <div className="aipe-shuku-panel aipe-shuku-panel-feedback" aria-hidden="true"/>
      <div className="aipe-shuku-panel aipe-shuku-panel-cocreate" aria-hidden="true"/>
      <div className="aipe-shuku-panel aipe-shuku-panel-review" aria-hidden="true"/>
      <div className="aipe-shuku-panel aipe-shuku-panel-publish" aria-hidden="true"/>
      <div className="aipe-shuku-center-space" aria-hidden="true"/>
      <svg className="aipe-shuku-arrows" viewBox="0 0 1540 600" preserveAspectRatio="none" aria-hidden="true">
        <defs><marker id="aipe-shuku-cycle-arrow" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M0 0 L5 3 L0 6" fill="none" stroke="#fa8a41" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></marker></defs>
        <path d="M662 75 Q770 12 868 66" />
        <path d="M1082 246 Q1165 300 1100 360" />
        <path d="M878 514 Q770 580 666 528" />
        <path d="M443 365 Q370 305 433 246" />
      </svg>
      <ol className="aipe-shuku-stages">
        {stages.map(stage => <li key={stage.id} className={`aipe-shuku-stage aipe-shuku-stage-${stage.id}`}>
          <img src={asset(stage.image)} alt="" aria-hidden="true" draggable={false}/>
          <div className="aipe-shuku-stage-copy">
            <Typography as="h2" variant="h3" tone="accent">{stage.title}</Typography>
            <Typography as="p" variant="bodySmall" tone="muted">{stage.description}</Typography>
          </div>
        </li>)}
      </ol>
      <div className="aipe-shuku-course">
        <Typography as="p" variant="bodySmall" tone="accent" className="aipe-shuku-course-label">共同维护的课程</Typography>
        <div className="aipe-shuku-browser" aria-label="可交互课程内容示意">
          <div className="aipe-shuku-browser-chrome" aria-hidden="true"><i/><i/><i/></div>
          <svg viewBox="0 0 440 210" role="img" aria-label="互动学习材料：概念关系、讲解与交互滑杆">
            <g stroke="#bccfe8" strokeWidth="7"><path d="M75 154L133 57L193 154Z" fill="none"/></g>
            <g stroke="#fff" strokeWidth="5"><circle cx="133" cy="57" r="29" fill="#ff934c"/><circle cx="75" cy="154" r="29" fill="#559aef"/><circle cx="193" cy="154" r="29" fill="#5bb8c3"/></g>
            <g stroke="#bdcee5" strokeWidth="12" strokeLinecap="round"><path d="M258 58H399M258 87H373M258 116H399"/></g>
            <path d="M258 165H399" stroke="#d1e4fa" strokeWidth="10" strokeLinecap="round"/>
            <path d="M258 165H330" stroke="#61a9f3" strokeWidth="10" strokeLinecap="round"/>
            <circle cx="330" cy="165" r="12" fill="#4d9bec" stroke="#fff" strokeWidth="3"/>
          </svg>
        </div>
      </div>
    </div>
    <div className="aipe-shuku-conclusion">
      <Typography as="p" variant="h3" tone="accent">一个人完成一门课程，<span>一群人让它持续生长。</span></Typography>
    </div>
  </ContentBlock>;
}
