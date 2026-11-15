import {useEffect,useState} from 'react';
import {GeoAgentTakeaway} from './pages/GeoAgentTakeaway/GeoAgentTakeaway';

export function GuidePage(){
  const [scale,setScale]=useState(()=>Math.min(innerWidth/1600,innerHeight/900));
  useEffect(()=>{const fit=()=>setScale(Math.min(innerWidth/1600,innerHeight/900));window.addEventListener('resize',fit);return()=>window.removeEventListener('resize',fit);},[]);
  return <div className="ga-fit"><div className="ga-fit-inner" style={{width:1600*scale,height:900*scale}}><div style={{transform:`scale(${scale})`,transformOrigin:'top left',width:1600,height:900}}><GeoAgentTakeaway/></div></div></div>;
}
