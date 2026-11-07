import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { PlotlyChart, MathFormulaBlock, MathFormulaStatic, type PlotlyGraph } from '../../../shared/react';
type Axis = { _offset: number; l2p:(v:number)=>number; p2l:(v:number)=>number; range:number[] };
type Host = HTMLDivElement & { data?:unknown[]; _fullLayout?:{xaxis:Axis;yaxis:Axis} };
export function AbsoluteErrorPlot({error,onChange}:{error:number;onChange:(value:number)=>void}) {
 const hostRef=useRef<Host|null>(null), errorRef=useRef(error), changeRef=useRef(onChange);
 errorRef.current=error;changeRef.current=onChange;
 const [position,setPosition]=useState({x:0,y:0,ready:false});
 const update=useCallback(()=>{const h=hostRef.current,a=h?._fullLayout;if(a)setPosition({x:a.xaxis._offset+a.xaxis.l2p(errorRef.current),y:a.yaxis._offset+a.yaxis.l2p(Math.abs(errorRef.current)),ready:errorRef.current>=a.xaxis.range[0]&&errorRef.current<=a.xaxis.range[1]&&Math.abs(errorRef.current)>=a.yaxis.range[0]&&Math.abs(errorRef.current)<=a.yaxis.range[1]});},[]);
 const data=useMemo(()=>[
  {type:'scatter',mode:'lines',x:[-40,0,40],y:[40,0,40],line:{color:'#ed7047',width:5},hovertemplate:'残差 e = %{x:.2f} cm<br>绝对误差 = %{y:.2f} cm<extra></extra>'},
  {type:'scatter',mode:'markers',x:[-3],y:[3],marker:{size:20,color:'#427ee0',line:{color:'#fff',width:2}},hoverinfo:'skip'},
  {type:'scatter',mode:'lines',x:[-3,-3,null,0,-3],y:[0,3,null,3,3],line:{color:'#91a9c5',width:1.5,dash:'dot'},hoverinfo:'skip'},
 ],[]);
 const layout=useMemo(()=>({paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'rgba(0,0,0,0)',margin:{l:58,r:28,t:34,b:62},font:{family:'Segoe UI, sans-serif',color:'#27446e'},dragmode:'pan',hovermode:'closest',showlegend:false,
  xaxis:{range:[-6.5,6.5],dtick:3,title:{text:'残差 e（厘米）',font:{size:25}},tickfont:{size:23},showgrid:false,zeroline:false,showline:true,linecolor:'#526582',linewidth:2},
  yaxis:{range:[-.2,7],dtick:3,title:{text:'绝对误差（厘米）',font:{size:24}},tickfont:{size:23},showgrid:false,zeroline:false,showline:true,linecolor:'#526582',linewidth:2},uirevision:'mae-coordinate-view'}),[]);
 const ready=useCallback((graph:PlotlyGraph,host:HTMLDivElement)=>{hostRef.current=host as Host;update();graph.on?.('plotly_relayout',()=>{const a=hostRef.current?._fullLayout;if(a){const [lo,hi]=a.xaxis.range,pad=hi-lo;const xs=[lo-pad,0,hi+pad].sort((x,y)=>x-y);void window.Plotly?.restyle?.(host,{x:[xs],y:[xs.map(Math.abs)]},[0]);}update();});},[update]);
 useEffect(()=>{const h=hostRef.current;if(!h?.data?.length)return;void window.Plotly?.restyle?.(h,{x:[[error]],y:[[Math.abs(error)]],'marker.color':error<0?'#427ee0':'#ed7047'},[1]);void window.Plotly?.restyle?.(h,{x:[[error,error,null,0,error]],y:[[0,Math.abs(error),null,Math.abs(error),Math.abs(error)]]},[2]);update();},[error,update]);
 const move=(event:PointerEvent<HTMLButtonElement>)=>{if(!event.currentTarget.hasPointerCapture(event.pointerId))return;const h=hostRef.current,a=h?._fullLayout;if(!h||!a)return;const r=h.getBoundingClientRect();const local=(event.clientX-r.left)*h.clientWidth/r.width-a.xaxis._offset;changeRef.current(Math.round(a.xaxis.p2l(local)*10)/10);};
 return <div className="rl-mae-coordinate"><PlotlyChart className="rl-mae-chart" data={data} layout={layout} minHeight={0} onGraphReady={ready} aria-label="绝对值函数坐标图，可拖动平移、滚轮缩放，蓝色点可拖动调整残差"/>{position.ready&&<><button className="rl-mae-point" aria-label="拖动残差点" style={{left:position.x,top:position.y,background:error<0?'#427ee0':'#ed7047'}} onPointerDown={e=>{e.stopPropagation();e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={move} onPointerUp={e=>e.currentTarget.releasePointerCapture(e.pointerId)} onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();onChange(Math.round((error+(e.key==='ArrowLeft'?-.1:.1))*10)/10);}}}/><div className="rl-mae-point-value" style={{left:Math.max(2,Math.min((hostRef.current?.clientWidth??700)-165,position.x+(error>2?-165:24))),top:Math.max(3,position.y-63)}}><MathFormulaBlock appearance="plain"><MathFormulaStatic latex={`e=${error.toFixed(1)}`} /></MathFormulaBlock><MathFormulaBlock appearance="plain"><MathFormulaStatic latex={`|e|=${Math.abs(error).toFixed(1)}`} /></MathFormulaBlock></div></>}</div>;
}

