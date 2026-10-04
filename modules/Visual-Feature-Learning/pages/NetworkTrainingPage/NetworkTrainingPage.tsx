import {useState} from 'react';
import {Button,ContentBlock,MathFormulaBlock,MathFormulaStatic,RangeControl,Select,Typography} from '../../../shared/react';
import {preset,shapes,type Layer} from '../../services/digitNetworkTraining';
import {NetworkScene} from './NetworkScene';
import './NetworkTrainingPage.css';
const channels=[8,12,16,24,32,48,64];
export function NetworkTrainingPage(){
 const [layers,setLayers]=useState(preset),[selected,setSelected]=useState(-1),[kind,setKind]=useState('conv'),[channelIndex,setChannelIndex]=useState(2),[pool,setPool]=useState('max'),[running,setRunning]=useState(false),[editing,setEditing]=useState(false),[notice,setNotice]=useState('');
 const entries=shapes(layers),final=entries.at(-1)?.shape??{h:28,w:28,c:1};
 function change(next:Layer[]){setNotice('');setLayers(next);}
 function select(i:number){setEditing(true);setSelected(i);setKind(layers[i].kind);setPool(layers[i].pool_type);setChannelIndex(Math.max(0,channels.indexOf(layers[i].out_channels)));}
 function add(after=selected){if(layers.length>=8){setNotice('最多 8 个模块');return;}const layer:Layer={id:crypto.randomUUID(),kind:kind as Layer['kind'],out_channels:channels[channelIndex],kernel_size:kind==='pool'?2:3,stride:kind==='pool'?2:1,padding:kind==='pool'?0:1,pool_type:pool as 'max'|'avg'};const index=after<0?layers.length:after+1,next=[...layers];next.splice(index,0,layer);if(shapes(next).some(e=>e.shape.h<1||e.shape.w<1)){setNotice('这里再加池化，空间尺寸会小于 1');return;}change(next);setEditing(true);setSelected(index);setNotice(`已插入第 ${index+1} 层`);}

 function apply(){if(selected<0)return;change(layers.map((l,i)=>i===selected?{...l,kind:kind as Layer['kind'],out_channels:channels[channelIndex],pool_type:pool as 'max'|'avg',kernel_size:kind==='pool'?2:3,stride:kind==='pool'?2:1,padding:kind==='pool'?0:1}:l));}

 // Local animation only. The service APIs and backend remain available for real training.
 function simulate(){setRunning(value=>!value);}
 const invalid=final.h<1||final.w<1||!layers.some(l=>l.kind==='conv');
 return <ContentBlock className="vfl-train-page" headingLevel={1} title="组装数字识别网络" subtitle="模拟训练：观察前向计算、梯度回传与权重更新。"><div className={`vfl-train-body ${editing&&selected>=0?'is-editing':''}`}>
 <div className="vfl-train-toolbar"><Select label="模块" value={kind} options={[{value:'conv',label:<Typography as="span" variant="bodySmall">卷积 + ReLU</Typography>},{value:'pool',label:<Typography as="span" variant="bodySmall">池化</Typography>}]} onChange={setKind} disabled={running}/>{kind==='conv'?<RangeControl label="输出通道" min={0} max={6} step={1} value={channelIndex} formatValue={v=>String(channels[Number(v)])} onChange={e=>setChannelIndex(Number(e.currentTarget.value))} disabled={running}/>:<Select label="池化方式" value={pool} options={[{value:'max',label:<Typography as="span" variant="bodySmall">最大池化</Typography>},{value:'avg',label:<Typography as="span" variant="bodySmall">平均池化</Typography>}]} onChange={setPool} disabled={running}/>}<div className="vfl-train-editor-actions"><Button onClick={()=>add()} disabled={running||layers.length>=8}>添加</Button><Button onClick={apply} disabled={running||selected<0}>应用到选中层</Button><Button onClick={()=>{change(layers.filter((_,i)=>i!==selected));setSelected(-1);setEditing(false);}} disabled={running||selected<0}>删除</Button></div><Button variant="primary" onClick={simulate} disabled={invalid}>{running?'停止模拟':'模拟训练'}</Button></div>
 <NetworkScene layers={layers} selected={selected} running={running} onInsert={i=>add(i)} canInsert={!running&&layers.length<8} onSelect={i=>{if(!running)select(i);}} onReorder={(from,to)=>{if(running)return;const next=[...layers];const item=next.splice(from,1)[0];next.splice(to,0,item);change(next);setSelected(to);setEditing(true);setKind(item.kind);setPool(item.pool_type);setChannelIndex(Math.max(0,channels.indexOf(item.out_channels)));}}/>
 {editing&&selected>=0&&<div className="vfl-train-editor-info"><Typography variant="bodySmall" tone={invalid?'warning':'accent'}>{invalid?'空间尺寸过小，或缺少卷积层':`第 ${selected+1} 层 · ${layers[selected].kind==='conv'?'卷积 + ReLU':'池化'}`}</Typography><MathFormulaBlock><MathFormulaStatic latex={`${entries[selected].input.h}\\times${entries[selected].input.w}\\times${entries[selected].input.c}\\;\\longrightarrow\\;${entries[selected].shape.h}\\times${entries[selected].shape.w}\\times${entries[selected].shape.c}`}/></MathFormulaBlock><Button onClick={()=>{change(preset());setSelected(-1);setEditing(false);}} disabled={running}>重置结构</Button><Button onClick={()=>{setEditing(false);setSelected(-1);}}>取消选择</Button></div>}
 <Typography className="vfl-train-takeaway" variant="bodySmall" tone="muted">{notice||(running?'模拟动画循环播放 · 不进行真实训练':'点击模块调整结构 · 模拟训练仅演示计算过程')}</Typography>
 </div></ContentBlock>;
}
