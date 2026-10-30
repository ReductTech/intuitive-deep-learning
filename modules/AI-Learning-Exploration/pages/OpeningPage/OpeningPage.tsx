import outline from '../../outlines.json';
import { Typography } from '../../../shared/react';
import './OpeningPage.css';

const perspectives = [
  { id: 'knowledge', title: '知识获取', detail: '解释与检索' },
  { id: 'practice', title: '学习实践', detail: '理解与应用' },
  { id: 'research', title: '科研探索', detail: '问题与验证' },
];

export function OpeningPage() {
  return <article className="ale-opening" aria-labelledby="ale-opening-title">
    <div className="ale-opening-eyebrow">
      <Typography variant="body" tone="inherit">从教师与研究者的观察出发</Typography>
      <div className="ale-opening-rule" />
    </div>
    <header className="ale-opening-heading">
      <Typography id="ale-opening-title" as="h1" variant="display" tone="inherit" wrap="nowrap">
        <span className="ale-opening-title-line">人工智能时代的</span>
        <span className="ale-opening-title-line ale-opening-title-accent">求学与探索</span>
      </Typography>
    </header>
    <div className="ale-opening-question">
      <Typography variant="h2" as="p" tone="inherit">当知识更易获得，<br />我们如何学习、判断与探索？</Typography>
    </div>
    <figure className="ale-opening-diagram" aria-label="知识获取、学习实践与科研探索三个观察面，围绕大学教育如何回应这一问题展开。连线表示联系，不表示因果或时间顺序。">
      <svg viewBox="0 0 710 660" fill="none" aria-hidden="true">
        <path d="M355 100 L95 545 H615 Z" className="ale-opening-connection" />
        <path d="M355 100 V375 M95 545 L355 375 L615 545" className="ale-opening-spoke" />
      </svg>
      {perspectives.map(item => <div key={item.id} className={`ale-opening-node ale-opening-node-${item.id}`}>
        <Typography variant="h3" as="p" tone="inherit">{item.title}</Typography>
        <Typography variant="bodySmall" tone="inherit">{item.detail}</Typography>
      </div>)}
      <div className="ale-opening-center">
        <Typography variant="h3" as="p" tone="inherit">大学教育</Typography>
        <Typography variant="body" tone="inherit">如何回应</Typography>
      </div>
    </figure>
    <footer className="ale-opening-footer">
      <Typography variant="bodySmall" tone="inherit">人工智能带来的求学问题</Typography>
      <Typography variant="bodySmall" tone="inherit" aria-label={`第1页，大纲共${outline.pages.length + outline.plannedPages.length}页`}>01 / {outline.pages.length + outline.plannedPages.length}</Typography>
    </footer>
  </article>;
}
