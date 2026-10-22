import type {ReactNode} from 'react';
import {T} from './Stage';
export function DataTable({headers,rows,highlight=-1}:{headers:string[];rows:ReactNode[][];highlight?:number}){return <table className="naipc-table"><thead><tr>{headers.map(h=><th key={h}><T small>{h}</T></th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={i} className={i===highlight?'is-best':''}>{row.map((v,j)=><td key={j}><T small>{v}</T></td>)}</tr>)}</tbody></table>}
