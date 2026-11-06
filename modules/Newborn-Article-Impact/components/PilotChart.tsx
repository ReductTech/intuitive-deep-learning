import {useLayoutEffect,useRef,useState,useMemo} from 'react';
import {Typography,EChartsChart,type EChartsOption} from '../../shared/react';
import './PilotChart.css';
export function PilotChart({option,label,light=true}:{option:EChartsOption;label:string;light?:boolean}){
 const probe=useRef<HTMLParagraphElement>(null);
 const [font,setFont]=useState({fontFamily:'sans-serif',fontSize:23.04,fontWeight:500});
 useLayoutEffect(()=>{if(!probe.current)return;const s=getComputedStyle(probe.current);setFont({fontFamily:s.fontFamily,fontSize:parseFloat(s.fontSize),fontWeight:Number(s.fontWeight)})},[]);
 const styled=useMemo(()=>{
  const ink=light?'#68778f':'#bac6d7',grid=light?'#d7deea':'#3b4a60';
  const axes=(value:unknown)=>Array.isArray(value)?value.map(v=>axis(v)):axis(value);
  const axis=(v:unknown)=>{const a=(v??{}) as Record<string,unknown>;return {...a,axisLabel:{color:ink,...font,...(a.axisLabel as object??{})},nameTextStyle:{color:ink,...font},axisLine:{lineStyle:{color:'#718099'}},splitLine:{lineStyle:{color:grid}}}};
  return {...option,textStyle:{color:light?'#21324a':'#f0f4fa',...font},xAxis:axes(option.xAxis),yAxis:axes(option.yAxis),legend:{...(option.legend as object??{}),textStyle:{color:ink,...font}},tooltip:{...(option.tooltip as object??{}),textStyle:font}};
 },[font,option,light]);
 return <div className="naipv2-chart" role="img" aria-label={label}><Typography ref={probe} variant="bodySmall" className="naipv2-chart-probe" aria-hidden="true">0</Typography><EChartsChart option={styled} minHeight={0} style={{width:'100%',height:'100%'}}/></div>;
}
