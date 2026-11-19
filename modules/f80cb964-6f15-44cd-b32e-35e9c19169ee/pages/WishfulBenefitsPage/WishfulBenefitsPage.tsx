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
    <ContentBlock shuku-edit-id="e-e95289b9-7a05-431d-8e85-5c375f053203" title={outline.pages.find(page => page.id === '4ad63653-03eb-4d05-b32d-2841a8b23d04')!.title} headingLevel={1} className="rie-benefits" data-scene-id="4ad63653-03eb-4d05-b32d-2841a8b23d04">
      <img shuku-edit-id="e-c69dce5d-74b9-4b54-97a8-8b8057eec4c9" className="rie-benefits-art" src={moduleAssetUrl("images/wishful-benefits-art-v1.webp")} alt="降低的台阶、进入实践的想法、尝试反馈的循环，以及留给思考的笔记本" />
      <div shuku-edit-id="e-db410886-430f-4bba-aece-faa179abd33e" className="rie-benefits-grid">
        {benefits.map(([title, description]) => (
          <div shuku-edit-id="e-28d05f04-87e4-43b9-991c-90661ab8c98c" key={title} className="rie-benefits-copy">
            <Typography shuku-edit-id="e-1838a2a4-213f-4a36-96a9-b9abeae4a24a" variant="h2" tone="accent">{title}</Typography>
            <Typography shuku-edit-id="e-1ccfac1b-aa6c-4ada-935f-1bc9d8df6ed4" variant="body" tone="muted">{description}</Typography>
          </div>
        ))}
      </div>
      <Typography shuku-edit-id="e-2ed1b04e-bb61-4cc0-ac87-4ab97fc19465" variant="h2" tone="accent" className="rie-benefits-takeaway">让研究者更容易从“我想试试”，走到“做一次尝试”。</Typography>
    </ContentBlock>
  );
}
