const types:Record<string,string>={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',svg:'image/svg+xml',webp:'image/webp',mp4:'video/mp4',webm:'video/webm',woff2:'font/woff2',woff:'font/woff',json:'application/json'};
const table=new Uint32Array(256).map((_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
function crc32(bytes:Uint8Array){let c=0xffffffff;for(const b of bytes)c=table[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}

/** Validate every member's size and CRC before running the unpacked entry in a sandbox. */
export async function prepareOfflineZip(blob:Blob,signal:AbortSignal){
 const data=new Uint8Array(await blob.arrayBuffer()),view=new DataView(data.buffer),decoder=new TextDecoder(),urls:string[]=[],files:Record<string,string>={};
 let html='',canvasScript='',end=-1;
 try{
  for(let i=data.length-22;i>=Math.max(0,data.length-65557);i--)if(view.getUint32(i,true)===0x06054b50){end=i;break;}
  if(end<0)throw Error('ZIP 目录损坏，请重新导出。');
  const count=view.getUint16(end+10,true);let position=view.getUint32(end+16,true),total=0;
  if(count>5000)throw Error('ZIP 文件数量超过限制。');
  for(let i=0;i<count;i++){
   signal.throwIfAborted();
   if(view.getUint32(position,true)!==0x02014b50)throw Error('ZIP 文件目录不完整。');
   const method=view.getUint16(position+10,true),crc=view.getUint32(position+16,true),packed=view.getUint32(position+20,true),size=view.getUint32(position+24,true),nameLength=view.getUint16(position+28,true),extra=view.getUint16(position+30,true),comment=view.getUint16(position+32,true),local=view.getUint32(position+42,true);
   total+=size;if(total>1024*1024*1024)throw Error('ZIP 解压大小超过限制。');
   const name=decoder.decode(data.subarray(position+46,position+46+nameLength));
   if(!name||name.startsWith('/')||name.includes('..')||name.includes('\\')||Object.hasOwn(files,name))throw Error('ZIP 文件路径无效。');
   if(view.getUint32(local,true)!==0x04034b50)throw Error('ZIP 文件头损坏。');
   const start=local+30+view.getUint16(local+26,true)+view.getUint16(local+28,true);
   if(start+packed>data.length)throw Error('ZIP 文件内容不完整。');
   const compressed=new Blob([data.slice(start,start+packed)]);
   const bytes=method===0?new Uint8Array(await compressed.arrayBuffer()):method===8?new Uint8Array(await new Response(compressed.stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer()):null;
   if(!bytes||bytes.length!==size||crc32(bytes)!==crc)throw Error('ZIP 文件校验失败：'+name);
   if(name==='打开课件.html')html=decoder.decode(bytes);
   else if(name==='files/canvas-assets.js')canvasScript=decoder.decode(bytes);
   else if(name.startsWith('files/')){
    // Sandbox origins cannot load blob URLs owned by the parent window. Use
    // temporary data URLs only for verification; the ZIP stores raw files.
    files[name]=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(Error('ZIP 素材读取失败：'+name));reader.readAsDataURL(new Blob([bytes],{type:types[name.split('.').at(-1)||'']||'application/octet-stream'}));});
   }
   position+=46+nameLength+extra+comment;
  }
  if(!html)throw Error('ZIP 中没有找到“打开课件.html”。');
  const script='<script>globalThis.__SHUKU_ZIP_FILES__='+JSON.stringify(files)+';</script>';
  html=html.replace('</head>',script+'</head>').replace('<script src="./files/canvas-assets.js"></script>','<script>'+canvasScript+'</script>');
  return {html:new Blob([html],{type:'text/html;charset=utf-8'}),release:()=>urls.forEach(url=>URL.revokeObjectURL(url))};
 }catch(error){urls.forEach(url=>URL.revokeObjectURL(url));throw error;}
}
