import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { ContentBlock, Typography } from "@shuku/course-style/react";
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
    <ContentBlock shuku-edit-id="e-51f26ac8-decf-44be-b978-52e6fe98b3f1" title={outline.pages.find(page => page.id === 'spp-research-wishful-benefits')!.title} headingLevel={1} className="rie-benefits" data-scene-id="spp-research-wishful-benefits">
      <img shuku-edit-id="e-665522ab-322f-4637-911e-3ef4aaa201b6" className="rie-benefits-art" src={moduleAssetUrl('images/research-background/wishful-benefits-art-v1.jpg')} alt="降低的台阶、进入实践的想法、尝试反馈的循环，以及留给思考的笔记本" />
      <div shuku-edit-id="e-1ecb03f3-f35c-4ed6-bc9a-d57b9a223404" className="rie-benefits-grid">
        {benefits.map(([title, description]) => (
          <div shuku-edit-id="e-cfa3981d-3860-48d5-b68a-77e270dd6f41" key={title} className="rie-benefits-copy">
            <Typography shuku-edit-id="e-a55ca44d-a436-4193-9541-32a35b6e5535" variant="h2" tone="accent">{title}</Typography>
            <Typography shuku-edit-id="e-55d5a3ce-001f-4b4f-9a80-d1fed215b2ac" variant="body" tone="muted">{description}</Typography>
          </div>
        ))}
      </div>
      <Typography shuku-edit-id="e-caad511b-dfb0-4c6d-a396-a3512ce889f6" variant="h2" tone="accent" className="rie-benefits-takeaway">让研究者更容易从“我想试试”，走到“做一次尝试”。</Typography>
    </ContentBlock>
  );
}
