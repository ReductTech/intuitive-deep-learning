import { useState } from 'react';
import { Button } from '../../../shared/react/controls/Button';
import { RangeControl } from '../../../shared/react/controls/RangeControl';
import { Typography } from '../../../shared/react/typography/Typography';
import { Text, ReferenceVisual } from '../../components/Diagrams';
import { Cover, RefBox, ReferenceCanvas, ReferenceControls, ReferencePaths, ReferenceStory, type Rect } from '../../components/ReferenceCanvas';
import { useStory } from '../../components/Story';

export function PredictionCall() {
  const story = useStory(['随机噪声', '第一次预测与更新', '再次预测与更新', '得到生成图像', '每一步复用同一个网络'], 850);
  const [inspect, setInspect] = useState(false);
  return <ReferenceCanvas index={0} source={inspect ? '02' : '01'}>
    {!inspect && <>
      <Cover rect={[463,181,325,350]} visible={story.step>=1} />
      <Cover rect={[884,181,325,350]} visible={story.step>=2} />
      <Cover rect={[1302,181,325,350]} visible={story.step>=3} />
      <RefBox rect={[402,618,866,165]} className={story.playing ? 'vgr-network-pulse' : ''}>
        <Button className="vgr-hotspot" data-testid="prediction-answer" aria-label="观察一次网络调用" onClick={()=>setInspect(true)} />
      </RefBox>
      <RefBox rect={[1290,735,330,52]}><Text muted>点击网络，放大一次调用</Text></RefBox>
    </>}
    {inspect && <ReferenceControls rect={[1090,747,500,55]}><Button onClick={()=>setInspect(false)}>返回完整生成过程</Button></ReferenceControls>}
    <ReferenceStory story={story} />
  </ReferenceCanvas>;
}

const featureBoxes: Rect[] = [[343,197,188,217],[493,399,135,146],[617,557,100,103],[785,678,104,105],[960,557,100,105],[1041,401,133,142],[1142,195,191,220]];
export function UNetBackbone() {
  const story = useStory(['输入带噪状态','Down：细尺度','Down：更大范围','Mid：整体信息','Up：空间恢复','Up：局部细节','输出噪声预测']);
  const [skip,setSkip]=useState(true);
  return <ReferenceCanvas index={1} source="03">
    {featureBoxes.map((rect,i)=><RefBox key={i} rect={rect} className={story.step===i && story.playing ? 'vgr-feature-focus' : ''}><Button className="vgr-hotspot" aria-label={`观察${['Down 64','Down 32','Down 16','Mid 8','Up 16','Up 32','Up 64'][i]}特征`} onClick={()=>story.go(i)} /></RefBox>)}
    {!skip && <ReferencePaths><path d="M535 298H1135M632 471H1036M719 602H958" stroke="white" strokeWidth="14"/><path d="M535 298H1135M632 471H1036M719 602H958" stroke="#cbd2de" strokeWidth="3" strokeDasharray="10 10"/></ReferencePaths>}
    <ReferenceControls rect={[55,747,620,63]}><Button data-testid="skip-toggle" active={!skip} onClick={()=>{setSkip(!skip);story.go(6);}}>{skip?'切断 Skip，比较通路':'重新接通 Skip'}</Button><Text muted>{skip?'点击特征图走读':'直接传回的路径已断开'}</Text></ReferenceControls>
    <RefBox rect={[1400,755,1,1]} data-skip={skip} />
    <ReferenceStory story={story}/>
  </ReferenceCanvas>;
}

export function UNetTime() {
  const [time,setTime]=useState(500);
  const vector=[Math.sin(time/120),Math.cos(time/120),Math.sin(time/400),Math.cos(time/400)];
  return <ReferenceCanvas index={2} source="05">
    <RefBox rect={[153,187,270,263]} className="vgr-image-stack"><ReferenceVisual name="time-low"/><ReferenceVisual name="time-high" style={{opacity:time/1000}}/></RefBox>
    <RefBox rect={[145,457,290,48]} className="vgr-white vgr-center"><Typography variant="body" tone="accent">当前带噪状态</Typography></RefBox>
    <RefBox rect={[65,615,242,86]} className="vgr-white vgr-center"><Typography variant="h3" tone="warning">t = {time}</Typography></RefBox>
    <RefBox rect={[1268,638,295,44]} className="vgr-image-stack"><ReferenceVisual name="time-vector" style={{filter:`brightness(${.75+time/1600})`}}/></RefBox>
    <ReferenceControls rect={[50,768,1500,65]}><RangeControl label="时间步 t" min={0} max={1000} step={10} value={time} onChange={e=>setTime(Number(e.target.value))}/><Text muted>四维编码示意：{vector.map(v=>v.toFixed(2)).join('，')}</Text></ReferenceControls>
  </ReferenceCanvas>;
}

export function ConditionedUNet() {
  const story=useStory(['视觉状态','接入时间','接入文本','三路输入汇合']);
  const [cut,setCut]=useState<string|null>(null);
  const time=story.step>=1 && cut!=='time', text=story.step>=2 && cut!=='text';
  return <ReferenceCanvas index={4} source="10">
    <Cover rect={[48,182,1300,123]} visible={time}/>
    <Cover rect={[32,563,1200,249]} visible={text}/>
    <ReferenceControls rect={[1115,682,515,112]} className="vgr-wrap-controls">{[['time','时间'],['text','文本']].map(([id,label])=><Button key={id} active={cut===id} onClick={()=>{story.go(3);setCut(cut===id?null:id);}}>{cut===id?'重新接通':'切断'+label}</Button>)}<Text muted>{cut ? `缺少${cut==='time'?'噪声阶段':'生成内容'}`:'视觉、时间、文本各有输入路径'}</Text></ReferenceControls>
    <div className="vgr-state-observer" data-time-connected={time} data-text-connected={text}/>
    <ReferenceStory story={story}/>
  </ReferenceCanvas>;
}
