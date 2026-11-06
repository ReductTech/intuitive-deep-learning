import React, {type ComponentType} from 'react';
import {createRoot} from 'react-dom/client';
import {SceneDeck} from '../modules/shared/react/presentation';
import {guide, presentation, metadata, guideExport} from 'virtual:idl-course';
import '../modules/shared/vendor/mathlive/mathlive-fonts.css';
import '../modules/shared/react/styles.css';
import './styles.css';

const params=new URLSearchParams(location.search);
if(params.has('page')&&!params.has('slide'))params.set('slide',params.get('page')!);
history.replaceState(null,'',location.pathname+'?'+params);
const deck=presentation?.deck;
const getNotes=presentation?Reflect.get(presentation,'getPptNotes'):undefined;
const Guide=guide?.[guideExport] as ComponentType|undefined;
const mode=params.get('mode')|| (Guide?'guide':'ppt');
function App(){
 if(mode==='ppt'&&deck)return <SceneDeck catalog={[deck]} moduleId={metadata.id} assetId={metadata.asset_id} progressKey={'idl:'+metadata.id} getNotes={getNotes}/>;
 if(Guide)return <Guide/>;
 if(deck)return <SceneDeck catalog={[deck]} moduleId={metadata.id} assetId={metadata.asset_id} progressKey={'idl:'+metadata.id} getNotes={getNotes}/>;
 return <p role="alert">这门课程还没有可播放内容。</p>;
}
document.title=metadata.title;
// Old in-course presentation links now stay in this fixed artifact, without an app router.
document.addEventListener('click',event=>{
 if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
 const link=event.target instanceof Element?event.target.closest<HTMLAnchorElement>('a[href]'):null;
 if(!link||link.target||link.hasAttribute('download'))return;
 const url=new URL(link.href,location.href);
 if(url.origin!==location.origin||!['/scenedeck/','/web_ppt/','/web_ppt/slide.html'].includes(url.pathname))return;
 if(url.searchParams.has('deck')&&url.searchParams.get('deck')!==metadata.id)return;
 event.preventDefault();url.pathname=location.pathname;url.searchParams.set('mode','ppt');location.assign(url.href);
});
createRoot(document.getElementById('root')!).render(<App/>);
