import { useState } from 'react';
import { Button } from '../../../shared/react/controls/Button';
import { Typography } from '../../../shared/react/typography/Typography';
import { Text, ReferenceVisual } from '../../components/Diagrams';
import { Cover, RefBox, ReferenceCanvas, ReferenceControls, ReferencePaths, ReferenceStory } from '../../components/ReferenceCanvas';
import { useStory } from '../../components/Story';

export function LatentTraining() {
  const [prediction,setPrediction]=useState(.9);
  const [history,setHistory]=useState([1.69]);
  const loss=(prediction+.4)**2;
  const update=()=>{const next=prediction+.35*(-.4-prediction);setPrediction(next);setHistory(h=>[...h,(next+.4)**2]);};
  return <ReferenceCanvas index={7} source="17">
    <RefBox rect={[1480,638,165,57]} className="vgr-white vgr-center"><Typography variant="h3" tone="warning" data-testid="training-loss">{loss.toFixed(4)}</Typography></RefBox>
    <RefBox rect={[1310,688,320,89]} className="vgr-white"><svg className="vgr-loss-plot" viewBox="0 0 340 90" aria-label="教学标量参数的平方误差"><path d="M5 5V80H330" fill="none" stroke="#a5bada"/>{history.map((v,i)=><circle key={i} cx={15+i*32} cy={75-v/1.69*60} r="4" fill="#ff7210"/>)}<polyline points={history.map((v,i)=>`${15+i*32},${75-v/1.69*60}`).join(' ')} fill="none" stroke="#ff7210" strokeWidth="3"/></svg></RefBox>
    <ReferenceControls rect={[45,778,1570,51]}><Button data-testid="train-update" variant="primary" disabled={history.length>=10} onClick={update}>更新一次参数</Button><Text>目标噪声 −0.40；预测 {prediction.toFixed(3)}；更新 {history.length-1} 次</Text><Text muted>标量教学示例 · 更新后预测误差减小</Text></ReferenceControls>
  </ReferenceCanvas>;
}
const samplingSteps=['从随机 latent 噪声出发','主干预测','采样更新','主干预测','采样更新','主干预测','采样更新','主干预测','最后更新','Decoder 解码'];
export function LatentSampling() {
  const story=useStory(samplingSteps,650);
  const finished=story.step===9;
  return <ReferenceCanvas index={8} source="18">
    <RefBox rect={[991,493,193,199]} className="vgr-white vgr-current-latent" data-sampling-step={story.step}><ReferenceVisual name={story.step<2?'latent-noisy':story.step<8?'latent-encoded':'latent-denoised'}/></RefBox>
    <Cover rect={[1439,492,201,190]} visible={finished}/>
    {story.playing && <ReferencePaths><path className="vgr-running-path" d={story.step%2 ? 'M361 601H603' : 'M829 651V704H339V631'} fill="none" stroke="#ff8a23" strokeWidth="6" strokeDasharray="14 12"/></ReferencePaths>}
    <ReferenceControls rect={[43,769,1590,51]}><Text>采样更新 {Math.floor(story.step/2)} / 4</Text><Typography variant="bodySmall" tone="accent">{finished?'采样完成 → 最后解码一次':story.step%2?'网络预测：读取当前 latent、时间与文本':'采样器更新：得到下一个 latent'}</Typography><Text muted>同一组网络参数被反复调用</Text></ReferenceControls>
    <ReferenceStory story={story}/>
  </ReferenceCanvas>;
}
