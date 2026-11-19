import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import './FaceFeatureComplexityPage.css';

const ASSET_ID = '80396753-7fc8-4f55-9188-bddbdb828169';
const PHOTOS = [509, 504, 508, 514] as const;

export function FaceFeatureComplexityPage() {
  return <ContentBlock shuku-edit-id="e-07c0cff9-abc8-451c-98f0-4625c09c345f"
    className="vfl-face-complexity-page"
    headingLevel={1}
    title="人脸外观变化与特征设计"
    subtitle="同一身份的人脸图像可能因表情、姿态及光照不同而呈现显著差异。"
  >
    <div shuku-edit-id="e-8d2e2a25-ebec-4a46-95eb-51348688a83f" className="vfl-face-complexity-main">
      <section shuku-edit-id="e-91c58f46-03cc-4e5d-bb92-898f6e992b91" className="vfl-face-complexity-gallery" aria-label="同一人在不同条件下的四张真实人脸照片">
        <div shuku-edit-id="e-a62288b3-d8d0-4de3-9d46-ae88ac62d6c7" className="vfl-face-complexity-gallery-head">
          <Typography shuku-edit-id="e-ebc128fa-007f-45c3-8431-a877ee39ca3c" as="h2" variant="h3" tone="accent">同一人，不同外观</Typography>
          <Typography shuku-edit-id="e-8b12f7de-e4e6-4aed-9e4e-30aafb203b9d" as="span" variant="body" tone="muted">LFW 真实样本</Typography>
        </div>
        <div shuku-edit-id="e-a717b7ff-80d2-4cb1-a83e-c5b8f16b7f9c" className="vfl-face-complexity-photo-row">
          {PHOTOS.map((index, position) => <div shuku-edit-id="e-4a4087a2-09b2-415e-aeb7-813e23fef06f" className="vfl-face-complexity-photo" key={index}>
            <img shuku-edit-id="e-a1110c04-34cb-4402-9388-f8cf062e948b" src={moduleAssetUrl(`faces/lfw-serena-${index}.webp`)} alt={`同一身份的人脸样本 ${position + 1}`} />
          </div>)}
        </div>
        <div shuku-edit-id="e-42624392-cf06-4141-ab3a-259197917148" className="vfl-face-complexity-same"><Typography shuku-edit-id="e-9d399827-3d01-4199-89c5-9e22cec2056a" as="p" variant="body" tone="accent">四张照片属于同一人</Typography></div>
      </section>

      <aside shuku-edit-id="e-d974e3c4-648e-46ca-ae7f-8596d3c5554e" className="vfl-face-complexity-factors" aria-label="人脸外观变化的来源">
        <Typography shuku-edit-id="e-d5a972f5-60f3-44df-9841-b5b4cf98b07c" as="h2" variant="h3" tone="accent">外观变化因素</Typography>
        <div shuku-edit-id="e-871f22b3-978a-45e2-bddf-66238b1f301a" className="vfl-face-complexity-factor-list">
          <Typography shuku-edit-id="e-d76e833c-28a6-462a-b269-04884f1e0109" as="p" variant="body" tone="accent">表情</Typography>
          <Typography shuku-edit-id="e-0d9147d9-c3b3-499e-8edc-5628c2b5aaa8" as="p" variant="body" tone="accent">姿态</Typography>
          <Typography shuku-edit-id="e-a9955273-226d-45b0-a12d-e508188e9dd4" as="p" variant="body" tone="accent">光照</Typography>
          <Typography shuku-edit-id="e-52c53c9c-5b95-43cc-860c-79e8b2cba286" as="p" variant="body" tone="accent">裁切与画质</Typography>
        </div>
        <Typography shuku-edit-id="e-f81afe0e-5cc8-4b05-a6bf-a98b0d1fbc61" as="p" variant="body" tone="muted" className="vfl-face-complexity-factor-note">成像条件变化不改变身份。</Typography>
      </aside>
    </div>

    <div shuku-edit-id="e-3add1927-93b3-4d02-8099-0af934d70147" className="vfl-face-complexity-takeaway">
      <Typography shuku-edit-id="e-3f0a5f88-fe09-4425-b8d7-1ec5524f425d" as="strong" variant="h3" tone="warning">特征设计的难点</Typography>
      <Typography shuku-edit-id="e-5f7dce6b-3add-4540-90be-ef355ff81a5b" as="p" variant="body" tone="accent">特征既要区分不同身份，也要减弱同一身份的外观变化；少量人工规则难以同时满足两项要求。</Typography>
    </div>
  </ContentBlock>;
}
