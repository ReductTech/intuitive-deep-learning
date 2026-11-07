import { useEffect, useRef, type RefObject } from 'react';
import './RecordingDemo.css';

export interface DemoPoint {x:number;y:number}
export interface RecordingDemo {
  wait(ms:number):Promise<void>;
  until(predicate:()=>boolean,timeout?:number):Promise<void>;
  point(element:Element,x?:number,y?:number):DemoPoint;
  fromClient(x:number,y:number):DemoPoint;
  moveTo(point:DemoPoint,ms?:number):Promise<void>;
  move(element:Element,ms?:number):Promise<void>;
  click(element:HTMLElement,ms?:number):Promise<void>;
  drag(element:HTMLElement,to:DemoPoint,ms:number):Promise<void>;
  animate(ms:number,update:(progress:number)=>void):Promise<void>;
}

/** Visible-page playback, using the actual lesson handlers and native editor state. */
export function useRecordingDemo(rootRef:RefObject<HTMLElement|null>,program:(demo:RecordingDemo)=>Promise<void>,options:{enabled?:boolean;ready?:()=>boolean}={}) {
  const latest=useRef({program,ready:options.ready});latest.current={program,ready:options.ready};
  const enabled=options.enabled??true;
  useEffect(()=>{
    const root=rootRef.current;if(!root||!enabled)return;
    const abort=new AbortController();let visible=false,generation=0;
    root.dataset.demoPhase='preparing';root.dataset.captureReady='false';
    const pointer=document.createElement('div');pointer.className='rf-recording-pointer';pointer.setAttribute('aria-hidden','true');
    pointer.innerHTML='<i></i><svg viewBox="0 0 32 38" fill="none"><path d="M4 3L26 19L16 21L11 32L4 3Z" fill="white" stroke="#173554" stroke-width="2.2" stroke-linejoin="round"/></svg>';
    root.append(pointer);let position:DemoPoint={x:1150,y:650};
    const interrupted=()=>new DOMException('演示已停止','AbortError');
    const animate=(ms:number,update:(t:number)=>void)=>new Promise<void>((resolve,reject)=>{
      let elapsed=0,previous=performance.now(),seen=generation;
      function tick(now:number){
        if(abort.signal.aborted){reject(interrupted());return;}
        if(seen!==generation){previous=now;seen=generation;}
        if(visible&&!document.hidden)elapsed+=now-previous;
        previous=now;const t=ms?Math.min(1,elapsed/ms):1;update(t);
        if(t>=1)resolve();else requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
    const fromClient=(x:number,y:number)=>{const r=root.getBoundingClientRect();return{x:(x-r.left)*root.clientWidth/r.width,y:(y-r.top)*root.clientHeight/r.height};};
    const point=(element:Element,x=.5,y=.5)=>{
      const r=element.getBoundingClientRect();let px=r.x+r.width*x,py=r.y+r.height*y,doc=element.ownerDocument;
      while(doc!==root.ownerDocument){
        const frame=doc.defaultView?.frameElement as HTMLIFrameElement|null;if(!frame)break;
        const box=frame.getBoundingClientRect();px=box.x+px*box.width/frame.clientWidth;py=box.y+py*box.height/frame.clientHeight;doc=frame.ownerDocument;
      }
      return fromClient(px,py);
    };
    const draw=(p:DemoPoint)=>{position=p;pointer.style.transform=`translate(${p.x-4}px,${p.y-3}px)`;pointer.style.opacity='1';};
    const moveTo=async(to:DemoPoint,ms=450)=>{const from=position;await animate(ms,t=>{const p=t*t*(3-2*t);draw({x:from.x+(to.x-from.x)*p,y:from.y+(to.y-from.y)*p});});};
    const demo:RecordingDemo={
      animate,fromClient,point,moveTo,wait:ms=>animate(ms,()=>{}),
      until:async(predicate,timeout=30000)=>{let time=0;while(!predicate()){if(time>=timeout)throw new Error('等待演示界面就绪超时');await animate(50,()=>{});time+=50;}},
      move:async(element,ms)=>moveTo(point(element),ms),
      click:async(element,ms)=>{await moveTo(point(element),ms);pointer.classList.add('is-pressed');element.click();await animate(220,()=>{});pointer.classList.remove('is-pressed');},
      drag:async(element,to,ms)=>{
        await moveTo(point(element),400);pointer.classList.add('is-pressed');
        const send=(type:string,p:DemoPoint,buttons:number)=>{const r=root.getBoundingClientRect();element.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:41,pointerType:'mouse',button:0,buttons,clientX:r.x+p.x*r.width/root.clientWidth,clientY:r.y+p.y*r.height/root.clientHeight}));};
        const from=position;send('pointerdown',from,1);
        await animate(ms,t=>{const p=t*t*(3-2*t),next={x:from.x+(to.x-from.x)*p,y:from.y+(to.y-from.y)*p};draw(next);send('pointermove',next,1);});
        send('pointerup',to,0);pointer.classList.remove('is-pressed');
      },
    };
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;generation++;});observer.observe(root);
    const visibility=()=>{generation++;};document.addEventListener('visibilitychange',visibility);
    const stop=(event:Event)=>{if(!event.isTrusted)return;abort.abort();pointer.style.opacity='0';root.dataset.demoPhase='paused';};
    const surfaces:EventTarget[]=[root,...Array.from(root.querySelectorAll('iframe')).flatMap(frame=>frame.contentDocument?[frame.contentDocument]:[])];
    surfaces.forEach(surface=>{surface.addEventListener('pointerdown',stop,true);surface.addEventListener('keydown',stop,true);surface.addEventListener('wheel',stop,{capture:true,passive:true});});
    void(async()=>{
      try{
        await demo.until(()=>visible&&!document.hidden&&(latest.current.ready?.()??true));
        root.dataset.captureReady='true';
        if(matchMedia('(prefers-reduced-motion: reduce)').matches){root.dataset.demoPhase='static';return;}
        root.dataset.demoPhase='playing';await latest.current.program(demo);
        pointer.style.opacity='0';root.dataset.demoPhase='finished';
      }catch(error){if(!abort.signal.aborted){root.dataset.demoPhase='error';root.dataset.demoError=String(error);}}
    })();
    return()=>{abort.abort();observer.disconnect();document.removeEventListener('visibilitychange',visibility);surfaces.forEach(surface=>{surface.removeEventListener('pointerdown',stop,true);surface.removeEventListener('keydown',stop,true);surface.removeEventListener('wheel',stop,true);});pointer.remove();};
  },[rootRef,enabled]);
}
