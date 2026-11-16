import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import outline from '../outlines.json';
import './StaticDesignPreview.css';

export interface StaticDesignPreviewProps {
  title: string;
  subtitle: string;
  image: string;
  description: string;
}

export function StaticDesignPreview({title, subtitle, image, description}: StaticDesignPreviewProps) {
  return <ContentBlock shuku-edit-id="e-f6528901-ac7a-4679-b0c4-c4f0472856a9" title={title} subtitle={subtitle} headingLevel={1} className="aipe-static-design" bodyClassName="aipe-static-design-body">
    <figure shuku-edit-id="e-60418074-63ad-49b9-b2cb-3cdad0e58d43" className="aipe-static-design-figure">
      <img shuku-edit-id="e-8a1309d0-1623-4430-acd6-e73b091d04a0" src={moduleAssetUrl(image)} alt={description} />
      <Typography shuku-edit-id="e-d60a5232-307c-4667-8f86-bc670f8e0cd4" as="figcaption" variant="bodySmall" tone="muted">静态设计预览 · 图中界面、数据与流程为示意</Typography>
    </figure>
  </ContentBlock>;
}

