import {useEffect,useState} from 'react';
import {GeoAgentTakeaway} from './pages/GeoAgentTakeaway/GeoAgentTakeaway';

export function GuidePage(){
  const [scale,setScale]=useState(()=>Math.min(innerWidth/1600,innerHeight/900));
  useEffect(()=>{const fit=()=>setScale(Math.min(innerWidth/1600,innerHeight/900));window.addEventListener('resize',fit);return()=>window.removeEventListener('resize',fit);},[]);
  return <div shuku-edit-id="e-b4da227a-1583-424f-b539-c586e3a0ce0c" className="ga-fit"><div shuku-edit-id="e-d38288b8-ade6-468c-a7c4-d4deb9f3e450" className="ga-fit-inner" style={{width:1600*scale,height:900*scale}}><div shuku-edit-id="e-0b43dfb6-7564-4a58-9f8e-e3012c870d37" style={{transform:`scale(${scale})`,transformOrigin:'top left',width:1600,height:900}}><GeoAgentTakeaway/></div></div></div>;
}
