export function TrainingIcon({kind}:{kind:'settings'|'metrics'|'features'|'play'|'pause'|'pointer'}){
 return <svg className="vfl-tsne-icon" viewBox="0 0 24 24" aria-hidden="true">
  {kind==='settings'?<g fill="none" stroke="currentColor" strokeWidth="2"><path d="m10 3 4 0 .6 2.4 2 .9 2.2-.8 2 3.5-1.7 1.6v2.3l1.7 1.6-2 3.5-2.2-.8-2 .9L14 21h-4l-.6-2.4-2-.9-2.2.8-2-3.5 1.7-1.6v-2.3L3.2 9.5l2-3.5 2.2.8 2-.9Z"/><circle cx="12" cy="12" r="3"/></g>:null}
  {kind==='metrics'?<g fill="currentColor"><rect x="3" y="11" width="4" height="10" rx="2"/><rect x="10" y="3" width="4" height="18" rx="2"/><rect x="17" y="7" width="4" height="14" rx="2"/></g>:null}
  {kind==='features'?<g fill="currentColor">{[[5,18],[12,18],[19,18],[12,11],[19,11],[19,4]].map(([cx,cy])=><circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.5"/>)}</g>:null}
  {kind==='play'?<path fill="currentColor" d="M7 3.5a1 1 0 0 1 1.5-.8l12 8.5a1 1 0 0 1 0 1.6l-12 8.5a1 1 0 0 1-1.5-.8Z"/>:null}
  {kind==='pause'?<g fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></g>:null}
  {kind==='pointer'?<path fill="currentColor" d="M5 2v18l5-5 3 7 3-1-3-7h7Z"/>:null}
 </svg>;
}
