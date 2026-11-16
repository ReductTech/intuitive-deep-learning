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
  return <ContentBlock shuku-edit-id="e-c0e21aca-dd5c-45a2-abd6-029b453f1d1a" title={title} subtitle={subtitle} headingLevel={1} className="aipe-static-design" bodyClassName="aipe-static-design-body">
    <figure shuku-edit-id="e-7b1e4b49-dc0b-4383-8a06-dd37cc6c2a9b" className="aipe-static-design-figure">
      <img shuku-edit-id="e-bcfb1533-0b9b-4f38-8e1f-29aaf259817c" src={moduleAssetUrl(image)} alt={description} />
      <Typography shuku-edit-id="e-463e6358-d9fd-4229-9f77-ba871808d9be" as="figcaption" variant="bodySmall" tone="muted">静态设计预览 · 图中界面、数据与流程为示意</Typography>
    </figure>
  </ContentBlock>;
}

