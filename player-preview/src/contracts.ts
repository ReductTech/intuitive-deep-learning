import type {ReactNode} from 'react';

export interface PlayerPage {id:string;title?:string|null;snippet?:unknown}

/** UI contract only. The host owns authentication, APIs, storage and navigation. */
export interface PlayerProps {
 title:string;
 pages:PlayerPage[];
 activeId:string;
 notes?:string;
 slide:ReactNode;
 narration?:ReactNode;
 subtitle?:string;
 error?:string;
 download?:string;
 actions?:ReactNode;
 canEdit:boolean;
 renderThumbnail?:(page:PlayerPage,active:boolean)=>ReactNode;
 onHome:()=>void;
 onEdit:()=>void;
 onSelect:(id:string)=>void;
}
