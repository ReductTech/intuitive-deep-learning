import { moduleAssetUrl, Typography } from '../../../shared/react';
import { moduleIdentity } from '../../outlines.json';
import './OpeningPage.css';

export function OpeningPage() {
  return (
    <section className="llmpe-opening" aria-label="大模型驱动的实践能力培养体系与平台">
      <header className="llmpe-opening-copy">
        <Typography as="h1" variant="display" tone="accent" className="llmpe-opening-title">
          <span className="llmpe-opening-title-line">大模型驱动的</span>
          <span className="llmpe-opening-title-line"><span className="llmpe-opening-emphasis">实践能力</span>培养体系与平台</span>
        </Typography>
        <Typography variant="subtitle" tone="muted" className="llmpe-opening-subtitle">
          让 AI 把时间还给理解、实践与创新
        </Typography>
      </header>
      <img
        className="llmpe-opening-illustration"
        src={moduleAssetUrl(moduleIdentity.id, 'images/opening-illustration-v1.png')}
        alt="论文资料、知识图示与编程实验面板"
        draggable={false}
      />
    </section>
  );
}
