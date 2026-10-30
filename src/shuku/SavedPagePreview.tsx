import {useRef} from 'react';
import {useSceneScale} from '../../modules/shared/react/presentation/canvas';
import {usePlayer} from './usePlayer';
/** Render the saved component in isolation, with the original workspace around it. */
export function SavedPagePreview({revision,page}:{revision:string;page:string}){
 const player=usePlayer(revision);
 return player.url?<iframe title="课程页面预览" src={player.url+'?shukuPage='+encodeURIComponent(page)} loading="lazy" sandbox="allow-scripts" style={{width:'100%',height:'100%',border:0,display:'block'}}/>:<div className="cw-empty-slide"><p role={player.error?'alert':'status'}>{player.error||'正在准备页面预览…'}</p>{player.error&&player.canRetry&&<button disabled={player.retrying} onClick={()=>void player.retry()}>{player.retrying?'正在重试…':'重新准备课程页面'}</button>}</div>;
}

/** Use the saved slide itself as the thumbnail; never substitute a local module. */
export function SavedPageThumbnail({revision,page}:{revision:string;page:string}){
 const ref=useRef<HTMLDivElement>(null),scale=useSceneScale(ref);
 return <div ref={ref} className="cw-saved-thumbnail" aria-hidden="true"><span style={{transform:`scale(${scale})`}}><SavedPagePreview revision={revision} page={page}/></span></div>;
}
