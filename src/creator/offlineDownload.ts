/** Run the exported document before offering it as a classroom backup. */
export async function verifyOfflineDownload(blob:Blob,pageIds:string[],signal:AbortSignal):Promise<void>{
 const frame=document.createElement('iframe'),url=URL.createObjectURL(blob);
 frame.setAttribute('sandbox','allow-scripts');frame.title='离线文件启动检查';
 frame.style.cssText='position:fixed;left:-10000px;top:0;width:1600px;height:900px;visibility:hidden';
 try{
  await new Promise<void>((resolve,reject)=>{
   let timer:ReturnType<typeof setTimeout>,index=0;
   const checkNext=()=>frame.contentWindow?.postMessage({type:"shuku-offline-check-page",page:pageIds[index]},"*");
   const cleanup=()=>{clearTimeout(timer);window.removeEventListener('message',receive);signal.removeEventListener('abort',abort);};
   const abort=()=>{cleanup();reject(new DOMException('已取消','AbortError'));};
   const receive=(event:MessageEvent)=>{
    if(event.source!==frame.contentWindow)return;
    if(event.data?.type==='shuku-offline-error'){cleanup();reject(new Error('离线文件启动检查失败：'+String(event.data.message)));}
    if(event.data?.type==='shuku-offline-ready'){
     if(JSON.stringify(event.data.pages)!==JSON.stringify(pageIds)){cleanup();reject(new Error('导出大纲与当前页面不一致，请刷新课程后重试。'));}else checkNext();
    }
    if(event.data?.type==='shuku-offline-page-checked'&&event.data.page===pageIds[index]){
     index++;if(index<pageIds.length)checkNext();else{cleanup();resolve();}
    }
   };
   window.addEventListener('message',receive);signal.addEventListener('abort',abort,{once:true});
   timer=setTimeout(()=>{cleanup();reject(new Error('离线文件启动检查超时，请重新导出。'));},120000);
   if(signal.aborted){abort();return;}
   frame.src=url;document.body.append(frame);
  });
 }finally{frame.remove();URL.revokeObjectURL(url);}
}
