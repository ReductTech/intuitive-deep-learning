import { ContentBlock, Typography } from "@shuku/course-style/react";
import './OutlinePlaceholder.css';
export interface OutlinePlaceholderProps { title: string; lead: string; points: readonly (readonly [string,string])[]; references?: readonly (readonly [string,string])[]; }
export function OutlinePlaceholder({title,lead,points,references=[]}: OutlinePlaceholderProps) {
 return <ContentBlock shuku-edit-id="e-bfbb8d0f-2fa8-474b-9e5f-b8f9f6375f79" className="aipe-placeholder" title={title} headingLevel={1} subtitle="内容占位 · 待细化" bodyClassName="aipe-placeholder-body">
  <Typography shuku-edit-id="e-1e838970-a42f-41df-9ed2-07fe0cbaf6df" as="p" variant="h2" tone="accent" className="aipe-placeholder-lead">{lead}</Typography>
  <div shuku-edit-id="e-13c93ac6-8c2d-4317-9b5e-a87aaffc0524" className="aipe-placeholder-points">{points.map(([heading,description],index)=><section shuku-edit-id="e-94603848-6799-44f5-b504-97f2dc72effa" key={heading} className="aipe-placeholder-row"><Typography shuku-edit-id="e-4a7368f7-1e1d-4c15-9c40-099de6edd7ec" as="span" variant="h2" tone="muted" className="aipe-placeholder-number">{String(index+1).padStart(2,'0')}</Typography><div shuku-edit-id="e-fc474b37-99a6-4409-9b2a-fc90f4282cd6"><Typography shuku-edit-id="e-74627362-2cb8-4ed6-82f0-8128cd3d0bbd" as="h2" variant="h2" tone="accent">{heading}</Typography><Typography shuku-edit-id="e-0e3e9bc7-e4f7-4723-9767-8b56c0876353" as="p" variant="body" tone="muted">{description}</Typography></div></section>)}</div>
  {references.length>0&&<div shuku-edit-id="e-5f487a54-f9cb-480b-b43a-8a87879fb904" className="aipe-placeholder-references">{references.map(([label,url])=><Typography shuku-edit-id="e-5f444a33-9832-4816-9d18-acafb3600fde" as="a" key={url} variant="bodySmall" tone="muted" href={url} target="_blank" rel="noreferrer">{label}</Typography>)}</div>}
 </ContentBlock>;
}
