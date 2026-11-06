import { ContentBlock, moduleAssetUrl, Typography } from '../../shared/react';
import outline from '../outlines.json';
import './StaticDesignPreview.css';

export interface StaticDesignPreviewProps {
  title: string;
  subtitle: string;
  image: string;
  description: string;
}

export function StaticDesignPreview({title, subtitle, image, description}: StaticDesignPreviewProps) {
  return <ContentBlock title={title} subtitle={subtitle} headingLevel={1} className="aipe-static-design" bodyClassName="aipe-static-design-body">
    <figure className="aipe-static-design-figure">
      <img src={moduleAssetUrl(outline.moduleIdentity.id, image)} alt={description} />
      <Typography as="figcaption" variant="bodySmall" tone="muted">静态设计预览 · 图中界面、数据与流程为示意</Typography>
    </figure>
  </ContentBlock>;
}

