import { sourcePageIds } from '../pageIds';
import type { ReactNode } from 'react';
import { ContentBlock, Typography, MathFormulaBlock, MathFormulaStatic, moduleAssetUrl } from "@shuku/course-style/react";
import outline from '../outlines.json';
import '../styles.css';
export const imageUrl=(name:string)=>moduleAssetUrl(name);
export function Stage({n,subtitle,children,className=''}:{n:number;subtitle?:string;children:ReactNode;className?:string}){return <ContentBlock title={outline.pages.find(page => page.id === sourcePageIds[n])!.title} subtitle={subtitle} headingLevel={1} className={'naipc-stage '+className} headerClassName="naipc-heading" bodyClassName="naipc-body">{children}</ContentBlock>}
export function T({children,small=false,accent=false}:{children:ReactNode;small?:boolean;accent?:boolean}){return <Typography variant={small?'bodySmall':'body'} tone={accent?'accent':'main'}>{children}</Typography>}
export function H({children}:{children:ReactNode}){return <Typography variant="h3" tone="inherit">{children}</Typography>}
export function Formula({latex,label}:{latex:string;label:string}){return <MathFormulaBlock appearance="plain" ariaLabel={label}><MathFormulaStatic latex={latex}/></MathFormulaBlock>}
export function Photo({name,alt,className=''}:{name:string;alt:string;className?:string}){return <img className={'naipc-photo '+className} src={imageUrl(name)} alt={alt}/>}
