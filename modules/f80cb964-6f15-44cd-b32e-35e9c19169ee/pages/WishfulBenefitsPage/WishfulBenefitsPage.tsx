import { ContentBlock, Typography, moduleAssetUrl } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import './WishfulBenefitsPage.css';

const benefits = [
  ['降低实现门槛', '不熟悉工具，也能开始尝试'],
  ['更多想法进入实践', '让原本搁置的想法，有机会做出来'],
  ['加快尝试与反馈', '更快试一试，再调整方向'],
  ['腾出精力思考问题', '把更多精力留给问题、理解与判断'],
];

export function WishfulBenefitsPage() {
  return (
    <ContentBlock title={outline.pages.find(page => page.id === '4ad63653-03eb-4d05-b32d-2841a8b23d04')!.title} headingLevel={1} className="rie-benefits" data-scene-id="4ad63653-03eb-4d05-b32d-2841a8b23d04">
      <img className="rie-benefits-art" src={moduleAssetUrl('images/wishful-benefits-art-v1.jpg')} alt="降低的台阶、进入实践的想法、尝试反馈的循环，以及留给思考的笔记本" />
      <div className="rie-benefits-grid">
        {benefits.map(([title, description]) => (
          <div key={title} className="rie-benefits-copy">
            <Typography variant="h2" tone="accent">{title}</Typography>
            <Typography variant="body" tone="muted">{description}</Typography>
          </div>
        ))}
      </div>
      <Typography variant="h2" tone="accent" className="rie-benefits-takeaway">让研究者更容易从“我想试试”，走到“做一次尝试”。</Typography>
    </ContentBlock>
  );
}
