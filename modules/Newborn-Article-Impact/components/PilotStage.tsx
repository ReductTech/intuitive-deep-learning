import type {ReactNode} from 'react';
import {Typography,MathFormulaBlock,MathFormulaStatic} from '../../shared/react';
import {RefinedStage} from './RefinedStage';
import './PilotStage.css';
export function PilotStage({title,subtitle,children,className=''}:{title:string;subtitle?:string;children:ReactNode;className?:string}){return <RefinedStage title={title} subtitle={subtitle} className={'naipv2-stage '+className}>{children}</RefinedStage>}
export function PT({children,small=false,muted=false}:{children:ReactNode;small?:boolean;muted?:boolean}){return <Typography variant={small?'bodySmall':'body'} tone={muted?'muted':'main'}>{children}</Typography>}
export function PH({children}:{children:ReactNode}){return <Typography variant="h3" tone="accent">{children}</Typography>}
export function Panel({children,className=''}:{children:ReactNode;className?:string}){return <section className={'naipv2-panel '+className}>{children}</section>}
export function Eq({latex,label}:{latex:string;label:string}){return <MathFormulaBlock appearance="plain" ariaLabel={label}><MathFormulaStatic latex={latex}/></MathFormulaBlock>}
export function Table({headers,rows,highlight=-1,widths}:{headers:string[];rows:ReactNode[][];highlight?:number;widths?:string[]}){return <table className="naipv2-table">{widths&&<colgroup>{widths.map((w,i)=><col key={i} style={{width:w}}/>)}</colgroup>}<thead><tr>{headers.map(h=><th key={h}><PT small>{h}</PT></th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={i} className={i===highlight?'is-highlight':''}>{row.map((v,j)=><td key={j} title={headers[j]+': '+(typeof v==='string'||typeof v==='number'?v:'')}>{typeof v==='string'||typeof v==='number'?<PT small>{v}</PT>:v}</td>)}</tr>)}</tbody></table>}
