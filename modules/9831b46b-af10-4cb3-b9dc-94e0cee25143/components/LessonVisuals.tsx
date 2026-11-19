import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import type { ReactNode, CSSProperties } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import '../policy.css';

// Render mathematical notation in prose through the same LaTeX renderer as display equations.
const inlineNotation:Record<string,string>={
 'ĝw':String.raw`\widehat g_w`,
 'ã':String.raw`\widetilde a`,'LC':String.raw`L_C`,'LA':String.raw`L_A`,
 'πθ(aₜ|sₜ)':String.raw`\pi_\theta(a_t\mid s_t)`,'πθ(a|s)':String.raw`\pi_\theta(a\mid s)`,
 'Pπθ(τ)':String.raw`P_{\pi_\theta}(\tau)`,'Pπθ':String.raw`P_{\pi_\theta}`,
 'Pθ(τ)':String.raw`P_\theta(\tau)`,'J(θ)':String.raw`J(\theta)`,'θold / θnew':String.raw`\theta_{\mathrm{old}}/\theta_{\mathrm{new}}`,
 '∇θlogπ':String.raw`\nabla_\theta\log\pi_\theta`,'∇θJ':String.raw`\nabla_\theta J`,'∇θL':String.raw`\nabla_\theta L`,
 'πθ':String.raw`\pi_\theta`,'Pθ':String.raw`P_\theta`,'∇θ':String.raw`\nabla_\theta`,
 'Gₜ₊₁':String.raw`G_{t+1}`,'Gₜ':String.raw`G_t`,'G₀':String.raw`G_0`,'G₁':String.raw`G_1`,'G₆':String.raw`G_6`,
 'sₜ₊₁':String.raw`s_{t+1}`,'sₜ':String.raw`s_t`,'aₜ':String.raw`a_t`,'rₜ':String.raw`r_t`,'pₜ':String.raw`p_t`,'Lₜ':String.raw`L_t`,
 'W₁':String.raw`W_1`,'W₂':String.raw`W_2`,'R̄':String.raw`\bar R`,'θ′':String.raw`\theta'`,'w′':String.raw`w'`,
 'Στ':String.raw`\sum_\tau`,'Σ':String.raw`\sum`,'∏':String.raw`\prod`,'ĝ':String.raw`\widehat g`,'τ':String.raw`\tau`,'θ':String.raw`\theta`,'γ':String.raw`\gamma`,'α':String.raw`\alpha`,'β':String.raw`\beta`,'gL':String.raw`g_L`
};
for(let i=0;i<10;i++)inlineNotation[`G${'₀₁₂₃₄₅₆₇₈₉'[i]}`]=`G_${i}`;
inlineNotation['W₁[1,14]']=String.raw`W_1[1,14]`;
inlineNotation['W₂[右,1]']=String.raw`W_2[\text{右},1]`;
inlineNotation['W₂[上,1]']=String.raw`W_2[\text{上},1]`;
inlineNotation['γ = 1']=String.raw`\gamma=1`;
inlineNotation['γ=1']=String.raw`\gamma=1`;
inlineNotation['T = 6']=String.raw`T=6`;
inlineNotation['∂L/∂w']=String.raw`\frac{\partial L}{\partial w}`;
inlineNotation['b(sₜ)']=String.raw`b(s_t)`;
inlineNotation['L₁']=String.raw`L_1`;
inlineNotation['R(τ)']=String.raw`R(\tau)`;
inlineNotation['e = 1, 2, …']=String.raw`e=1,2,\ldots`;
inlineNotation['π']=String.raw`\pi`;
inlineNotation['Qₜπ']=String.raw`Q_t^\pi`;
inlineNotation['Q₁π']=String.raw`Q_1^\pi`;
inlineNotation['θold']=String.raw`\theta_{\mathrm{old}}`;
inlineNotation['θnew']=String.raw`\theta_{\mathrm{new}}`;
const latinNotation:Record<string,string>={s:'s',a:'a',t:'t',x:'x',h:'h',z:'z',G:'G',Q:'Q',V:'V',R:'R',J:'J',L:'L',E:String.raw`\mathbb E`,T:'T',P:'P',C:'C',w:'w',q:'q',y:'y',log:String.raw`\log`};
const notationPattern=new RegExp(Object.keys(inlineNotation).sort((a,b)=>b.length-a.length).map(v=>v.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+'|\\b(?:'+Object.keys(latinNotation).join('|')+')\\b','g');
export function mathText(value:ReactNode):ReactNode{
 if(Array.isArray(value))return value.map((v,i)=><span shuku-edit-id="e-d04da9f3-c575-4790-b5f0-29bee21029d1" key={i}>{mathText(v)}</span>);
 if(typeof value!=='string')return value;
 let cursor=0;const parts:ReactNode[]=[];
 for(const match of value.matchAll(notationPattern)){
  const index=match.index!;if(index>cursor)parts.push(value.slice(cursor,index));
  parts.push(<MathFormulaStatic key={index} className="pg-inline-math" latex={String.raw`\textstyle `+(inlineNotation[match[0]]??latinNotation[match[0]])} aria-label={match[0]}/>);cursor=index+match[0].length;
 }
 if(cursor<value.length)parts.push(value.slice(cursor));return parts.length?parts:value;
}

export function Page({title,subtitle,children,takeaway,scene=false}:{title:string;subtitle:string;children:ReactNode;takeaway?:ReactNode;scene?:boolean}){return <ContentBlock shuku-edit-id="e-e1f7d92d-4bc6-4a23-a7b6-d02c7506251a" title={mathText(title)} subtitle={mathText(subtitle)} headingLevel={1} className={`pg-page${scene ? ' pg-forest-page' : ''}`} style={scene ? {'--pg-scene-background':`url(${moduleAssetUrl("forest-clearing.webp")})`} as CSSProperties : undefined}><div shuku-edit-id="e-7ad5ac2e-b345-4e8e-b5d1-c4777cde4912" className="pg-main">{children}</div>{takeaway&&<div shuku-edit-id="e-d0a9c878-7f00-4a76-b506-91c581742f97" className="pg-takeaway"><Typography shuku-edit-id="e-7593dc70-35fc-4505-88cf-c14557b624c0" variant="body" tone="accent">{mathText(takeaway)}</Typography></div>}</ContentBlock>}
export function T({children,small=false,tone='main'}:{children:ReactNode;small?:boolean;tone?:'main'|'muted'|'accent'|'warning'|'success'|'danger'}){return <Typography shuku-edit-id="e-5886f851-81d3-4af3-8249-c8441f059bb3" variant={small?'bodySmall':'body'} tone={tone}>{mathText(children)}</Typography>}
export function H({children}:{children:ReactNode}){return <Typography shuku-edit-id="e-4587290e-b5b3-4f80-b732-06c2caf3cdca" variant="h3" tone="accent">{mathText(children)}</Typography>}
export function F({latex}:{latex:string}){return <MathFormulaBlock appearance="plain" onPointerDownCapture={event=>event.preventDefault()} onClickCapture={event=>event.stopPropagation()}><MathFormulaStatic latex={latex}/></MathFormulaBlock>}
export function Controls({children}:{children:ReactNode}){return <div shuku-edit-id="e-55f9d05f-cb39-438a-819d-13ba44c61052" className="pg-controls">{children}</div>}

export function InlineMath({latex}:{latex:string}){return <MathFormulaStatic className="pg-inline-math" latex={String.raw`\textstyle `+latex}/>;}
