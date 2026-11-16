import { ContentBlock, Typography } from "@shuku/course-style/react";
import './OutlinePlaceholder.css';
export interface OutlinePlaceholderProps { title: string; lead: string; points: readonly (readonly [string,string])[]; references?: readonly (readonly [string,string])[]; }
export function OutlinePlaceholder({title,lead,points,references=[]}: OutlinePlaceholderProps) {
 return <ContentBlock shuku-edit-id="e-a6aa30ff-0a70-4941-a95e-9894a587bfd9" className="aipe-placeholder" title={title} headingLevel={1} subtitle="内容占位 · 待细化" bodyClassName="aipe-placeholder-body">
  <Typography shuku-edit-id="e-604dab49-5a1a-44b7-85b5-40052ada83e2" as="p" variant="h2" tone="accent" className="aipe-placeholder-lead">{lead}</Typography>
  <div shuku-edit-id="e-845a9825-4694-4af5-a515-3d31240b1951" className="aipe-placeholder-points">{points.map(([heading,description],index)=><section shuku-edit-id="e-5e69d07f-d6f8-4b7c-9eae-a26b1c03640f" key={heading} className="aipe-placeholder-row"><Typography shuku-edit-id="e-b16ec8ca-6613-468b-a36d-da434117d319" as="span" variant="h2" tone="muted" className="aipe-placeholder-number">{String(index+1).padStart(2,'0')}</Typography><div shuku-edit-id="e-c592b3ae-f70c-49b5-ad55-4a9d9b9f727f"><Typography shuku-edit-id="e-99558ed9-d322-4999-8c20-452583d0c021" as="h2" variant="h2" tone="accent">{heading}</Typography><Typography shuku-edit-id="e-082cfe7a-f43c-4e77-b279-b7c2fe9fd684" as="p" variant="body" tone="muted">{description}</Typography></div></section>)}</div>
  {references.length>0&&<div shuku-edit-id="e-4406a8ea-8610-40ba-b706-9e9142cab187" className="aipe-placeholder-references">{references.map(([label,url])=><Typography shuku-edit-id="e-fce4e3d1-9338-444a-8d86-b377ad22d191" as="a" key={url} variant="bodySmall" tone="muted" href={url} target="_blank" rel="noreferrer">{label}</Typography>)}</div>}
 </ContentBlock>;
}
