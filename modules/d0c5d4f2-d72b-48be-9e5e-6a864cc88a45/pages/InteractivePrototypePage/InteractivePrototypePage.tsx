import { ContentBlock, MathFormulaStatic, RangeControl, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import { PlaybackBar, usePlayback } from '../../Playback';
import { WeightSharingScene } from './WeightSharingScene';
import './WeightSharingScene.css';
import './InteractivePrototypePage.css';

export function InteractivePrototypePage(){
 const p=usePlayback(9,1900);
 return <ContentBlock shuku-edit-id="e-0327fcc1-f515-4d0c-af15-f7a40e4ed6dc" className="rf-page rf-prototype" title={outline.pages.find(page => page.id === '5f43daf3-4758-4a8a-ab78-8deb4d8366c3')!.title}>
  <div shuku-edit-id="e-c32b91c7-22e6-4b51-ae46-e4d614a3e9b4" className="rf-prototype-main"><div shuku-edit-id="e-eadbfdad-cbde-4ee9-b5e6-f6352e8c49dc" className="rf-comparison">{(['independent','shared'] as const).map((kind,i)=><article shuku-edit-id="e-1de4d37f-2ac7-4273-8db6-8de290d18c9a" className={`rf-comparison-panel is-${kind}`} key={kind}>
   <div shuku-edit-id="e-6144ea8c-4898-42bf-9500-6ea4a0b1f270" className="rf-comparison-heading"><Typography shuku-edit-id="e-0f0b49c9-30a7-44b4-b975-d34a673c4a84" variant="h3">{i===0?'每个位置，换一套':'所有位置，用同一套'}</Typography></div>
   <WeightSharingScene key={`${kind}-${p.revision}`} kind={kind} position={p.step} playing={p.playing}/>
   <div shuku-edit-id="e-5a3fb3f4-d877-4ed0-a4f0-7d00965e7892" className="rf-parameter-count"><Typography shuku-edit-id="e-2a2825a6-7bc9-4b1f-9f52-d785475b6aaf" variant="bodySmall" tone="muted">{i===0?'不共享':'共享权重'}</Typography><MathFormulaStatic latex={i===0?String.raw`9\times9=81`:String.raw`1\times9=9`}/></div>
  </article>)}</div>
  </div>
  <div shuku-edit-id="e-a105f780-bd6e-4a34-a42c-6fd6b3da8c9e" className="rf-prototype-controls"><Typography shuku-edit-id="e-f5630b35-41ad-4438-94c1-3e1889b8f1d1" variant="bodySmall" tone="muted">仅计权重，不计偏置</Typography><RangeControl label="窗口位置" aria-label="窗口位置" min={0} max={8} step={1} value={p.step} onChange={e=>p.go(Number(e.target.value))} formatValue={v=>`${Number(v)+1} / 9`}/><PlaybackBar playback={p} label="播放同步扫描"/></div>
 </ContentBlock>;
}
