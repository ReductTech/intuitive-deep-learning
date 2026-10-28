import { Typography, moduleAssetUrl } from '../../../shared/react';
import { moduleIdentity } from '../../outlines.json';
import './CoverPage.css';

export function CoverPage() {
  return (
    <section className="rie-cover" aria-labelledby="rie-cover-title" data-scene-id="cover">
      <img className="rie-cover-art" src={moduleAssetUrl(moduleIdentity.id, 'images/research-cover-art-v1.png')} alt="研究手稿、实验器具与蓝色曲线组成的科研主题插画" />
      <div className="rie-cover-copy">
        <h1 id="rie-cover-title" className="rie-cover-title">
          <Typography as="span" variant="display" tone="inherit" wrap="nowrap">科研智能时代</Typography>
          <Typography as="span" variant="display" tone="inherit" wrap="nowrap">机遇、挑战与探索</Typography>
        </h1>
        <div className="rie-cover-accent" aria-hidden="true" />
        <Typography variant="subtitle" tone="muted">从研究想法到阅读与判断</Typography>
      </div>
    </section>
  );
}
