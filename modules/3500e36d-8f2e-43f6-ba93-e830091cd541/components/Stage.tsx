import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { sourcePageIds } from '../pageIds';
import type { ReactNode } from 'react';
import { ContentBlock, Typography, MathFormulaBlock, MathFormulaStatic } from "@shuku/course-style/react";
import outline from '../outlines.json';
import '../styles.css';
export const imageUrl=(name:string)=>moduleAssetUrl(name);
export function Stage({n,subtitle,children,className=''}:{n:number;subtitle?:string;children:ReactNode;className?:string}){return <ContentBlock shuku-edit-id="e-428ab15e-39b9-46a7-b212-67e3de64ad0a" title={outline.pages.find(page => page.id === sourcePageIds[n])!.title} subtitle={subtitle} headingLevel={1} className={'naipc-stage '+className} headerClassName="naipc-heading" bodyClassName="naipc-body">{children}</ContentBlock>}
export function T({children,small=false,accent=false}:{children:ReactNode;small?:boolean;accent?:boolean}){return <Typography shuku-edit-id="e-d26f7a74-4047-4206-a692-e3b90be3e3f2" variant={small?'bodySmall':'body'} tone={accent?'accent':'main'}>{children}</Typography>}
export function H({children}:{children:ReactNode}){return <Typography shuku-edit-id="e-254f8379-a107-4e40-9d73-8114ffc7834b" variant="h3" tone="inherit">{children}</Typography>}
export function Formula({latex,label}:{latex:string;label:string}){return <MathFormulaBlock appearance="plain" ariaLabel={label}><MathFormulaStatic latex={latex}/></MathFormulaBlock>}
export function Photo({name,alt,className=''}:{name:string;alt:string;className?:string}){return <img shuku-edit-id="e-9b219c6d-9261-4df7-bd84-93fc78af0570" className={'naipc-photo '+className} src={imageUrl(name)} alt={alt}/>}
