import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { Typography } from "@shuku/course-style/react";
import { moduleIdentity } from '../../outlines.json';
import './CoverPage.css';

export function CoverPage() {
  return (
    <section shuku-edit-id="e-86e85ee2-349f-4798-9c8b-60c3d3648752" className="rie-cover" aria-labelledby="rie-cover-title" data-scene-id="4deacf4d-782d-4f55-814e-322aa1f38422">
      <img shuku-edit-id="e-0af0797f-6f0c-4ac3-9d12-a8e7bf58f7e4" className="rie-cover-art" src={moduleAssetUrl('images/research-cover-art-v1.jpg')} alt="研究手稿、实验器具与蓝色曲线组成的科研主题插画" />
      <div shuku-edit-id="e-7cddd309-45ad-4097-bfb1-21bcb0929d22" className="rie-cover-copy">
        <h1 shuku-edit-id="e-74bd8209-fba9-479f-b95a-53eb67ae1ea9" id="rie-cover-title" className="rie-cover-title">
          <Typography shuku-edit-id="e-5b155f14-5868-48ff-b4e4-8e05a38ee8e2" as="span" variant="display" tone="inherit" wrap="nowrap">科研智能时代</Typography>
          <Typography shuku-edit-id="e-10b63a9b-9d42-4d15-9f52-f41f1a028a34" as="span" variant="display" tone="inherit" wrap="nowrap">机遇、挑战与探索</Typography>
        </h1>
        <div shuku-edit-id="e-171e77f4-85cd-4311-b148-862ff63076c7" className="rie-cover-accent" aria-hidden="true" />
        <Typography shuku-edit-id="e-21beb18d-05d2-4b04-8ff9-b810c09e5af2" variant="subtitle" tone="muted">从研究想法到阅读与判断</Typography>
      </div>
    </section>
  );
}
