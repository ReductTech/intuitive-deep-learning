import { ContentBlock, moduleAssetUrl, Typography } from '../../../shared/react';
import './FaceFeatureComplexityPage.css';

const ASSET_ID = '80396753-7fc8-4f55-9188-bddbdb828169';
const PHOTOS = [509, 504, 508, 514] as const;

export function FaceFeatureComplexityPage() {
  return <ContentBlock
    className="vfl-face-complexity-page"
    headingLevel={1}
    title="人脸外观变化与特征设计"
    subtitle="同一身份的人脸图像可能因表情、姿态及光照不同而呈现显著差异。"
  >
    <div className="vfl-face-complexity-main">
      <section className="vfl-face-complexity-gallery" aria-label="同一人在不同条件下的四张真实人脸照片">
        <div className="vfl-face-complexity-gallery-head">
          <Typography as="h2" variant="h3" tone="accent">同一人，不同外观</Typography>
          <Typography as="span" variant="body" tone="muted">LFW 真实样本</Typography>
        </div>
        <div className="vfl-face-complexity-photo-row">
          {PHOTOS.map((index, position) => <div className="vfl-face-complexity-photo" key={index}>
            <img src={moduleAssetUrl(ASSET_ID, `faces/lfw-serena-${index}.png`)} alt={`同一身份的人脸样本 ${position + 1}`} />
          </div>)}
        </div>
        <div className="vfl-face-complexity-same"><Typography as="p" variant="body" tone="accent">四张照片属于同一人</Typography></div>
      </section>

      <aside className="vfl-face-complexity-factors" aria-label="人脸外观变化的来源">
        <Typography as="h2" variant="h3" tone="accent">外观变化因素</Typography>
        <div className="vfl-face-complexity-factor-list">
          <Typography as="p" variant="body" tone="accent">表情</Typography>
          <Typography as="p" variant="body" tone="accent">姿态</Typography>
          <Typography as="p" variant="body" tone="accent">光照</Typography>
          <Typography as="p" variant="body" tone="accent">裁切与画质</Typography>
        </div>
        <Typography as="p" variant="body" tone="muted" className="vfl-face-complexity-factor-note">成像条件变化不改变身份。</Typography>
      </aside>
    </div>

    <div className="vfl-face-complexity-takeaway">
      <Typography as="strong" variant="h3" tone="warning">特征设计的难点</Typography>
      <Typography as="p" variant="body" tone="accent">特征既要区分不同身份，也要减弱同一身份的外观变化；少量人工规则难以同时满足两项要求。</Typography>
    </div>
  </ContentBlock>;
}
