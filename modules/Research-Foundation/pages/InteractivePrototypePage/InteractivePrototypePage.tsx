import { ContentBlock, MathFormulaStatic, RangeControl, Typography } from '../../../shared/react';
import outline from '../../outlines.json';
import { PlaybackBar, usePlayback } from '../../Playback';
import { WeightSharingScene } from './WeightSharingScene';
import './WeightSharingScene.css';
import './InteractivePrototypePage.css';

export function InteractivePrototypePage(){
 const p=usePlayback(9,1900);
 return <ContentBlock className="rf-page rf-prototype" title={outline.pages[2].title}>
  <div className="rf-prototype-main"><div className="rf-comparison">{(['independent','shared'] as const).map((kind,i)=><article className={`rf-comparison-panel is-${kind}`} key={kind}>
   <div className="rf-comparison-heading"><Typography variant="h3">{i===0?'每个位置，换一套':'所有位置，用同一套'}</Typography></div>
   <WeightSharingScene key={`${kind}-${p.revision}`} kind={kind} position={p.step} playing={p.playing}/>
   <div className="rf-parameter-count"><Typography variant="bodySmall" tone="muted">{i===0?'不共享':'共享权重'}</Typography><MathFormulaStatic latex={i===0?String.raw`9\times9=81`:String.raw`1\times9=9`}/></div>
  </article>)}</div>
  </div>
  <div className="rf-prototype-controls"><Typography variant="bodySmall" tone="muted">仅计权重，不计偏置</Typography><RangeControl label="窗口位置" aria-label="窗口位置" min={0} max={8} step={1} value={p.step} onChange={e=>p.go(Number(e.target.value))} formatValue={v=>`${Number(v)+1} / 9`}/><PlaybackBar playback={p} label="播放同步扫描"/></div>
 </ContentBlock>;
}
