import { ContentBlock, Typography } from '../../shared/react';
import './OutlinePlaceholder.css';
export interface OutlinePlaceholderProps { title: string; lead: string; points: readonly (readonly [string,string])[]; references?: readonly (readonly [string,string])[]; }
export function OutlinePlaceholder({title,lead,points,references=[]}: OutlinePlaceholderProps) {
 return <ContentBlock className="aipe-placeholder" title={title} headingLevel={1} subtitle="内容占位 · 待细化" bodyClassName="aipe-placeholder-body">
  <Typography as="p" variant="h2" tone="accent" className="aipe-placeholder-lead">{lead}</Typography>
  <div className="aipe-placeholder-points">{points.map(([heading,description],index)=><section key={heading} className="aipe-placeholder-row"><Typography as="span" variant="h2" tone="muted" className="aipe-placeholder-number">{String(index+1).padStart(2,'0')}</Typography><div><Typography as="h2" variant="h2" tone="accent">{heading}</Typography><Typography as="p" variant="body" tone="muted">{description}</Typography></div></section>)}</div>
  {references.length>0&&<div className="aipe-placeholder-references">{references.map(([label,url])=><Typography as="a" key={url} variant="bodySmall" tone="muted" href={url} target="_blank" rel="noreferrer">{label}</Typography>)}</div>}
 </ContentBlock>;
}
