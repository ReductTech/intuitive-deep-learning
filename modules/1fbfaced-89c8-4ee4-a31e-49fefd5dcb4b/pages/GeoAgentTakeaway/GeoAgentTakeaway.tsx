import {useEffect, useRef, useState} from 'react';
import {Button, Typography} from '@shuku/course-style/react';
import {moduleAssetUrl} from '@shuku/course-runtime/react/assets';
import './GeoAgentTakeaway.css';

export const PAGE_ID='fbbab320-fc95-4b1f-9c74-bc6434754c5d';
const tabs=['看图定位','跟专家学','奖励训练','训练结果'];
const clues=[
  {name:'路牌',x:72,y:25,w:18,h:17,body:'蓝底方向牌提供道路信息，但仅凭颜色和箭头，不能锁定一个城市。',tag:'先识别，再核实'},
  {name:'道路',x:25,y:71,w:54,h:19,body:'车道、道路标线和通行规则可以辅助缩小范围，需要与其他线索一起判断。',tag:'比较道路特征'},
  {name:'植被',x:3,y:8,w:31,h:43,body:'植被与环境能提供气候线索，但类似景观可能出现在多个地区。',tag:'保留多种可能'},
];
const candidates=[{id:'far',name:'较远候选',x:85,y:65,d:240},{id:'near',name:'较近候选',x:160,y:285,d:40}];
const captions=[
  ['输入一张照片，输出地点与判断理由','图中的线索共同支持判断，单个线索通常不足以精确定位。'],
  ['先学专家怎样组织定位推理','用 1 万条专家与资深玩家的推理示范，进行 SFT 冷启动。'],
  ['再用地理任务的奖励，改进模型的回答','2 万张定位图像用于 GRPO：位置接近、地名语义接近、推理与答案一致。'],
  ['按任务本身的结构设计奖励','既奖励地点接近，也检查推理是否支持答案。'],
];

function Pin({x,y,color,active=false,sx=1}:{x:number;y:number;color:string;active?:boolean;sx?:number}) {
  return <g shuku-edit-id="e-5ec0a21b-1ada-4e84-b675-37b7b2fdab56" transform={`translate(${x} ${y})`} className={active?'ga-pin-pop':''}><g shuku-edit-id="e-27862731-fb79-473c-8ad3-d31ca68a29d8" transform={`scale(${sx} 1)`}>
    {active&&<circle shuku-edit-id="e-5eb5d94b-5ced-434b-8186-d6569479d4b3" r="26" fill={color} opacity=".13" className="ga-pulse"/>}
    <path shuku-edit-id="e-fc0bddf0-b63e-4c2b-9faa-0860b7d7bfa6" d="M0 8C-7-3-17-12-17-23a17 17 0 1 1 34 0C17-12 7-3 0 8Z" fill={color} stroke="white" strokeWidth="4"/>
    <circle shuku-edit-id="e-53249839-5292-4640-9a39-a32f1cf5db6e" cy="-23" r="5" fill="white"/>
  </g></g>;
}

function MapView({stage,ready,clue,selected,onChoose,improved,onLocate}:{stage:number;ready:boolean;clue:number|null;selected:string;onChoose:(id:string)=>void;improved:boolean;onLocate:()=>void}) {
  const [zoom,setZoom]=useState(1);
  const [inspected,setInspected]=useState(false);
  const pinScale=[.88,1.11,.914,.619][stage];
  useEffect(()=>{setZoom(1);setInspected(false);},[stage]);
  const showing=true;
  const cand=candidates.find(c=>c.id===selected)!;
  return <div shuku-edit-id="e-dda62fdc-b043-4a85-b8aa-27e17d2d3c78" className="ga-map-wrap">
    <div shuku-edit-id="e-144e0b59-39dc-4ab3-a239-8104969fa320" className="ga-map" data-testid="map"><img shuku-edit-id="e-367e12d2-3b96-48e9-a1cf-918d17bb3e3e" className="ga-map-art" src={moduleAssetUrl("scene-atlas.webp")} alt=""/>
      <svg shuku-edit-id="e-5dbb99ae-1977-45ba-8ed7-29335ba213d1" preserveAspectRatio="none" viewBox="0 0 456 365" aria-label="定位教学示意地图" role="img">
        <g shuku-edit-id="e-ceb92530-1e7a-4970-a15e-fba27ef2448d" transform={`translate(${228*(1-zoom)} ${182*(1-zoom)}) scale(${zoom})`}>
          {stage===1&&<ellipse shuku-edit-id="e-c55e4eda-641a-4262-b041-98280f22cfa6" cx="268" cy="215" rx={clue===null?150:100} ry={clue===null?105:70} fill="#1768ec" opacity=".12" stroke="#1768ec" strokeWidth="3" strokeDasharray="8 7" className="ga-region"/>}{stage===1&&<ellipse shuku-edit-id="e-b8d22b0e-cd84-4759-86e8-c4f1aaa7e1b2" cx="268" cy="215" rx="65" ry="43" fill="#009889" fillOpacity=".1" stroke="#009889" strokeWidth="2" strokeDasharray="6 5"/>}
          {stage===2&&<>
            {candidates.map(c=><line shuku-edit-id="e-e58061e0-b2eb-4c59-9ce0-9c2458a0c01a" key={c.id} x1={c.x} y1={c.y} x2="350" y2="220" stroke={c.id===selected?'#009889':'#9daaba'} strokeWidth={c.id===selected?4:2} strokeDasharray="7 5"/>)}
            <Pin sx={pinScale} x={350} y={220} color="#17314b"/>
          </>}
          {showing&&stage!==2&&<Pin sx={pinScale} x={stage===3&&!improved?130:280} y={stage===3&&!improved?125:220} color="#009889" active/>}
        </g>
      </svg>
      {stage===2? <>
        {candidates.map(c=><button shuku-edit-id="e-5dbf1012-9523-4890-8724-72959e1f9dfb" key={c.id} className={`ga-map-candidate ga-map-candidate-${c.id} ${selected===c.id?'is-selected':''}`} style={{left:`${c.x/456*100}%`,top:`${c.y/365*100}%`}} onClick={()=>{onChoose(c.id);setInspected(true);}} aria-label={c.name} aria-pressed={selected===c.id}>
          <span shuku-edit-id="e-8b35fe89-e878-444a-8507-455d90f6ee46" className="ga-candidate-dot"/><Typography shuku-edit-id="e-9040c2e0-2fa6-4254-b100-a0e71f86f875" as="span" variant="bodySmall">{c.name}{inspected&&selected===c.id?` · ${c.d} km`:null}</Typography>
        </button>)}
        <Typography shuku-edit-id="e-8f154ce7-c7dd-4b21-b98a-080b0d53c42e" as="span" variant="bodySmall" className="ga-truth">真实地点</Typography>
      </>:showing?<button shuku-edit-id="e-9f7ab8ff-c597-4e6e-9f50-021f6698ac42" className="ga-prediction" onClick={onLocate} aria-label="查看预测地点依据"><Typography shuku-edit-id="e-e265f9cc-b7f6-4376-8fea-0e6390728e4a" as="span" variant="bodySmall">{stage===1?'根据线索缩小范围':'预测拍摄地点'}</Typography></button>:<div shuku-edit-id="e-5b8ab96c-9a6c-4888-a7e2-45fa01fe6403" className="ga-map-idle"><span shuku-edit-id="e-539085c7-fc24-4ccd-a3ed-4624729dc4d6" className="ga-target-icon">⌖</span><Typography shuku-edit-id="e-959faa93-c1fe-4de7-9a4c-f435d213b835" variant="body">等待图像分析</Typography></div>}
      {stage!==2&&<div shuku-edit-id="e-2e61b08f-58d7-4754-834c-35cca975d14f" className="ga-map-tools"><Button aria-label="放大地图" disabled={zoom>=1.5} onClick={()=>setZoom(z=>Math.min(1.5,z+.25))}><Typography shuku-edit-id="e-b65429d1-80ba-470e-9bd2-980ca6f69d72" as="span" variant="bodySmall" tone="inherit">＋</Typography></Button><Button aria-label="缩小地图" disabled={zoom<=1} onClick={()=>setZoom(z=>Math.max(1,z-.25))}><Typography shuku-edit-id="e-d5ce5ddd-0db4-457e-9060-27b574211c69" as="span" variant="bodySmall" tone="inherit">−</Typography></Button></div>}
      
    </div>
    <div shuku-edit-id="e-30bd185a-294d-4ca5-819a-6bcc994e1e5d" className="ga-map-caption"><span shuku-edit-id="e-72b30d83-ba8a-418a-bbb4-faa7f6440e88" className="ga-status-dot"/><Typography shuku-edit-id="e-bcb378b0-2c4d-43e4-a3a3-79a999d31fa2" variant="bodySmall">{stage===2?`${cand.name}：示意距离 ${cand.d} km`:stage===1?'多条线索共同缩小候选范围':showing?'点击候选点，查看判断依据':'点击照片，开始定位分析'}</Typography></div>
  </div>;
}

export function GeoAgentTakeaway(){
  const [stage,setStage]=useState(0);
  const [detailOpen,setDetailOpen]=useState(false);
  const [fontReady,setFontReady]=useState(false);
  useEffect(()=>{let alive=true;const face=new FontFace('GeoAgent Sans',`url(${moduleAssetUrl('geoagent-sans.woff2')})`,{weight:'100 900'});document.fonts.add(face);face.load().then(()=>{if(alive)setFontReady(true);}).catch(()=>{if(alive)setFontReady(true);});return()=>{alive=false;};},[]);
  const [phase,setPhase]=useState(0);
  const [run,setRun]=useState(0);
  const [clue,setClue]=useState<number|null>(null);
  const [candidate,setCandidate]=useState('near');
  const [reward,setReward]=useState(0);
  const [alias,setAlias]=useState(true);
  const [consistent,setConsistent]=useState(true);
  const [checked,setChecked]=useState(false);
  const [improved,setImproved]=useState(true);
  const [basis,setBasis]=useState(false);
  const [fullscreen,setFullscreen]=useState(false);
  const surface=useRef<HTMLElement>(null);

  useEffect(()=>{if(!run||stage!==0)return;setPhase(1);const timers=[window.setTimeout(()=>setPhase(2),650),window.setTimeout(()=>setPhase(3),1450),window.setTimeout(()=>setPhase(4),2300)];return()=>timers.forEach(clearTimeout);},[run,stage]);
  useEffect(()=>{const handler=()=>setFullscreen(!!document.fullscreenElement);document.addEventListener('fullscreenchange',handler);return()=>document.removeEventListener('fullscreenchange',handler);},[]);
  function changeStage(n:number){setStage(n);setBasis(false);setClue(null);setChecked(false);if(n===0){setRun(0);setPhase(0);}}
  function reset(){setRun(0);setPhase(0);setClue(null);setCandidate('near');setReward(0);setAlias(true);setConsistent(true);setChecked(false);setImproved(true);setBasis(false);}
  function chooseClue(n:number){setClue(n);if(stage===0)setRun(r=>r+1);}
  async function toggleFull(){try{if(document.fullscreenElement)await document.exitFullscreen();else await (surface.current?.closest('.ga-fit')||surface.current)?.requestFullscreen();}catch{ /* Browser may deny fullscreen; the fitted page remains usable. */ }}
  const cand=candidates.find(c=>c.id===candidate)!;
  const spatial=Math.exp(-cand.d/100);
  const activeClue=clue===null?null:clues[clue];

  return <main shuku-edit-id="e-257bda7f-cb8c-4f6e-9577-cc2c11d96659" ref={surface} className={`ga-page ga-stage-${stage}`} data-page-id={PAGE_ID} data-capture-ready={fontReady}>
    <header shuku-edit-id="e-117714f6-ab8e-4d67-88d5-f43d3cfc9650" className="ga-header">
      <Typography shuku-edit-id="e-0b29b242-f2de-4530-ae49-acc248e88801" as="h1" variant="display" tone="inherit">GeoAgent：给一张照片，推断拍摄地点</Typography>
      <Typography shuku-edit-id="e-15ed3c9d-fda4-45d4-b8f1-3793b57236e6" variant="h3" tone="inherit">这篇论文研究：怎样训练模型，让定位更准、推理更一致</Typography>
    </header>
    <nav shuku-edit-id="e-bc2402aa-2cfc-4281-ae50-ad85a6153d36" className="ga-tabs" role="tablist" aria-label="GeoAgent 四个展示状态">
      {tabs.map((name,n)=><Button key={name} id={`ga-tab-${n}`} role="tab" aria-selected={stage===n} aria-controls="ga-content" active={stage===n} className="ga-tab" onClick={()=>{changeStage(n);setDetailOpen(false);}} onKeyDown={e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const next=(n+(e.key==='ArrowRight'?1:3))%4;changeStage(next);setDetailOpen(false);document.getElementById(`ga-tab-${next}`)?.focus();}}}><Typography shuku-edit-id="e-a15dfbae-5876-428c-ad4b-96262e7c43d3" as="span" variant="h2" tone="inherit">{name}</Typography></Button>)}
    </nav>
    <section shuku-edit-id="e-5c5267c1-35d5-44b2-9589-11794fabccad" id="ga-content" role="tabpanel" aria-labelledby={`ga-tab-${stage}`} className="ga-content">
      <div shuku-edit-id="e-08b9adef-502f-44fa-bc1a-4b6f4e6c470d" className="ga-photo-column">
        <div shuku-edit-id="e-b21b7b8f-617a-47cc-970c-021f26bd7519" data-ppt-viewport="从街景图集中裁切当前照片，叠加可见线索" className={`ga-photo ${phase>0&&phase<4?'ga-is-scanning':''}`}>
          <button shuku-edit-id="e-08f6dd8e-5341-446e-af9e-37ab027444ac" className="ga-photo-main" aria-label="分析街景照片" onClick={()=>{if(stage===0){setBasis(false);setRun(r=>r+1);}else if(stage===1)setClue(c=>c===null?0:(c+1)%3);else if(stage===2){setReward(0);setDetailOpen(true);}else setImproved(v=>!v);}}><img shuku-edit-id="e-914fc8b9-3cc7-404c-9490-113be95e4734" src={moduleAssetUrl("scene-atlas.webp")} alt="用于教学演示的合成街景，包含路牌、道路标线与行道树" draggable="false"/></button>
          {stage===1&&clues.map((c,n)=><button shuku-edit-id="e-372dc63f-20eb-4715-b30c-538f6676b80d" key={c.name} aria-label={`查看${c.name}线索`} className={`ga-hotspot ${clue===n?'is-active':''}`} style={{left:`${c.x}%`,top:`${c.y}%`,width:`${c.w}%`,height:`${c.h}%`}} onClick={()=>chooseClue(n)}><Typography shuku-edit-id="e-1000e61d-4e7e-4830-9573-ae5576613804" as="span" variant="bodySmall" tone="inherit">{c.name}</Typography></button>)}
          {stage===0&&phase>0&&phase<4&&<div shuku-edit-id="e-677b25c9-59ef-4651-8dae-8aff676f6004" className="ga-scan-line"/>}
          {stage===0&&<div shuku-edit-id="e-224334fe-5540-4554-9531-99f9fb2ca8bb" className="ga-photo-callout"><Typography shuku-edit-id="e-003dcace-8b42-4cfb-ad3a-44b4c10c055e" variant="bodySmall" tone="inherit">{phase===0?'点击照片，开始分析':phase===4?'✓ 分析完成，可再次播放':'正在寻找图中线索…'}</Typography></div>}
          {stage===1&&<div shuku-edit-id="e-e6caa7f0-45a7-4e35-b94d-c99872d00fbe" className="ga-photo-callout"><Typography shuku-edit-id="e-9abd4e96-42ff-4d92-ac0a-f1884b90000d" variant="bodySmall" tone="inherit">{activeClue?'观察到的线索':'选择图中的线索'}</Typography></div>}
          <div shuku-edit-id="e-fd52d583-97f0-4a88-82fd-971917097636" className="ga-photo-label"><Typography shuku-edit-id="e-e63a0e7f-7f01-4431-8e3b-ba41cf92bf98" variant="bodySmall" tone="inherit">{stage===2?'同一张训练图像':'街景示意'}</Typography></div>
        </div>
        {stage===1&&<div shuku-edit-id="e-668383e0-dae8-44ee-b8a0-bef77914dcf6" className="ga-clue-buttons" hidden>{clues.map((c,n)=><Button key={c.name} active={clue===n} onClick={()=>setClue(n)}><Typography shuku-edit-id="e-e8b90c29-7289-447d-889c-fefaf0848795" as="span" variant="bodySmall" tone="inherit">{c.name}</Typography></Button>)}</div>}
      </div>
      <div shuku-edit-id="e-8e2109d2-6281-4c6d-ac5d-a0912c449813" className="ga-analysis-column" aria-live="polite">
        {stage===0&&<div shuku-edit-id="e-ddcf0143-d37a-4161-bf90-cf8f9bcf8915" className="ga-analysis-panel">
          <div shuku-edit-id="e-7b310b32-63d1-431f-b153-e5f10afc288c" className={`ga-trace-item ${phase>=1?'is-revealed':''}`}><Typography shuku-edit-id="e-1df8369c-76c9-4a98-bdd2-8b1bc64ea23d" variant="h2" tone="inherit">观察路牌、道路与<br shuku-edit-id="e-74fe1ddf-70d1-4eb7-8351-bb3a0b62475b"/>植被线索…{phase>0&&phase<4?'…':''}</Typography></div>
          <Typography shuku-edit-id="e-14f98224-dd45-4cf1-919a-48c5e7e575a7" as="span" variant="bodySmall" tone="accent" className="ga-flow-arrow" aria-hidden="true">↓</Typography>
          <div shuku-edit-id="e-3538a50f-2f0e-4319-96b1-55c75a2e0151" className={`ga-trace-item ${phase>=2?'is-revealed':''}`}><Typography shuku-edit-id="e-2411f42f-e38d-4cdc-b041-9495b90ffe05" variant="h2" tone="inherit">逐步缩小可能的<br shuku-edit-id="e-8b0350a2-3555-4d43-bba7-82234b1b786a"/>拍摄范围</Typography></div>
          <Typography shuku-edit-id="e-47933b91-7d6f-4d9a-9980-5385febbd39b" as="span" variant="bodySmall" tone="accent" className="ga-flow-arrow" aria-hidden="true">↓</Typography>
          
          {basis&&<div shuku-edit-id="e-75dae64b-bb6c-417a-ad5b-e0541ffe3a32" className="ga-basis"><Typography shuku-edit-id="e-45844594-92c8-4390-8d8f-0376448adf2f" variant="bodySmall">这是预设定位流程，地图标记代表候选输出，不是该合成照片的实测地址。</Typography></div>}
        </div>}
        {stage===1&&<>
          <div shuku-edit-id="e-993ec5ea-0bc3-41fc-8ca3-3fc18d5c6b76" className="ga-expert-steps">
            <div shuku-edit-id="e-3e8d8f61-68ef-49bf-8ae2-103d215376f8" className={clue!==null?'is-revealed':''}><Typography shuku-edit-id="e-124830a5-582b-4da2-95e6-c37f084b91cc" variant="h3" tone="inherit">图中有哪些可用线索？</Typography></div><Typography shuku-edit-id="e-2e6365cb-d379-4ffe-bb9d-33f4f1b477b7" as="span" variant="bodySmall" tone="accent" className="ga-flow-arrow" aria-hidden="true">↓</Typography>
            <div shuku-edit-id="e-a151d695-d357-4bd3-84a0-3c8c94a7cd8a"><Typography shuku-edit-id="e-c5415a27-ca4e-40e8-a787-6b8e5ff1c137" variant="h3" tone="inherit">这些线索支持哪些地区？</Typography></div><Typography shuku-edit-id="e-84fbc985-6a53-4b50-8c8c-4ae948896dab" as="span" variant="bodySmall" tone="accent" className="ga-flow-arrow" aria-hidden="true">↓</Typography>
            <div shuku-edit-id="e-0de1f85a-b705-4986-8594-c7b3e24ea8fb"><Typography shuku-edit-id="e-89dbfdf7-3494-43cb-8753-67dceb5df35f" variant="h3" tone="inherit">综合线索，给出地点判断</Typography></div>
          </div>
          <div shuku-edit-id="e-92f35e4b-7864-4fff-98eb-cb962226f3f9" className="ga-clue-explanation" key={clue??'initial'}><Typography shuku-edit-id="e-5ddcbbfb-2ee2-4d82-8757-64de1609e1c8" variant="bodySmall" tone="inherit">{activeClue?.body??'选择照片中的路牌、道路或植被，查看专家如何使用证据。'}</Typography></div>
        </>}
        {stage===2&&<>
          <Typography shuku-edit-id="e-aadddc24-069f-4f23-9e72-339b2a4895e0" variant="h2" tone="inherit" className="ga-reward-title">这个回答怎样得分？</Typography>
          <div shuku-edit-id="e-be13c85b-9339-427e-b072-c9a7dc97e6c1" className="ga-reward-switches" role="group" aria-label="奖励解释">
            {['位置：离真实坐标更近，奖励更高','地名：Hefei 与 Hefei City 含义接近','推理：只读推理，能否重建最终地点？'].map((description,n)=><Button key={description} active={reward===n} onClick={()=>{setReward(n);setDetailOpen(true);}} className="ga-reward-row"><span shuku-edit-id="e-fc548b29-9081-4c18-8af0-af4ab1958b68" className="ga-reward-bullet" aria-hidden="true"/><Typography shuku-edit-id="e-ee4f0c9f-99b6-4246-9847-a08d1bdc6333" variant="body" tone="inherit">{description}</Typography></Button>)}
          </div>
          <Button variant="explain" className="ga-check-trigger" onClick={()=>{setReward(2);setDetailOpen(true);}}><Typography shuku-edit-id="e-0d74353e-8f6f-4b1b-a440-64f117dfbc85" as="span" variant="bodySmall" tone="inherit">查看推理检查</Typography></Button>
        </>}
        {stage===3&&<>
          <div shuku-edit-id="e-f2dabe51-eb2b-409d-8316-ae02574033c0" className="ga-toggle-pair ga-comparison" role="group" aria-label="训练前后比较"><Button active={!improved} onClick={()=>setImproved(false)}><Typography shuku-edit-id="e-6578fb32-dafe-47f0-a958-5fc6e0b46ec9" as="span" variant="bodySmall" tone="inherit">仅 SFT</Typography></Button><Button active={improved} onClick={()=>setImproved(true)}><Typography shuku-edit-id="e-73b61d46-bb10-44cc-87e9-54c0f3fcc823" as="span" variant="bodySmall" tone="inherit">加入 GRPO</Typography></Button></div>
          <div shuku-edit-id="e-d2c797a5-5cf9-493d-bd62-132393902766" className="ga-result-reasoning"><Typography shuku-edit-id="e-1c9e6ed8-0741-485b-820d-0275ad012deb" variant="h3" tone="inherit">✓ 识别路牌与道路特征</Typography><Typography shuku-edit-id="e-5229e0f0-ddf6-4fc1-807e-7b5c36f53e11" variant="h3" tone="inherit">✓ 结合植被与道路环境</Typography><Typography shuku-edit-id="e-65a9bf5a-f015-4f49-b996-20112731de58" variant="h3" tone="inherit">{improved?'✓ 综合线索，给出位置判断':'✓ 学习专家的推理框架'}</Typography></div>
        </>}
      </div>
      <div shuku-edit-id="e-f53d13a2-5204-41ba-b862-7a6f4f0f663b" className="ga-map-column"><MapView stage={stage} ready={phase===4} clue={clue} selected={candidate} onChoose={id=>{setCandidate(id);setReward(0);}} improved={improved} onLocate={()=>{if(stage===0)setBasis(b=>!b);else if(stage===1)setClue(c=>c===null?0:(c+1)%3);else setImproved(v=>!v);}}/>
        {stage===2&&<div shuku-edit-id="e-ba65c1d9-e383-42b4-ac6e-cd30b25d5d2a" className="ga-map-feedback"><Typography shuku-edit-id="e-7fd18156-d605-4159-8c40-8d52557df143" variant="bodySmall" tone="inherit">{cand.name}：{cand.d} km</Typography><Typography shuku-edit-id="e-6092adf2-0023-4f87-bc40-5a1d75f71f52" variant="bodySmall" tone="inherit">空间奖励 {spatial.toFixed(3)}</Typography></div>}
      </div>
      <div shuku-edit-id="e-d12497c8-50b8-4922-8e78-798a9fd075b2" className="ga-link ga-link-a" aria-hidden="true">➜</div><div shuku-edit-id="e-7d2decbb-a878-4fb3-a267-bf1ca62d1b20" className="ga-link ga-link-b" aria-hidden="true">➜</div>
    </section>
    <section shuku-edit-id="e-1e6abcfa-cd9e-45aa-9662-8150c1ad8174" className="ga-takeaway">
      <Typography shuku-edit-id="e-41c0cabf-abd8-4a74-a1e9-0108775d55b6" variant="h1" tone="inherit">{stage===0?'输入照片，输出地点和判断理由':stage===1?'先模仿 1 万条专家与资深玩家的推理':stage===2?'用 2 万张定位图像做 GRPO，奖励好的回答':'既奖励地点接近，也检查推理是否支持答案'}</Typography>
    </section>
    {stage===1&&<div shuku-edit-id="e-8a9b5212-7cc5-4fad-88a8-4bdf0a7e3d49" className="ga-stage-note"><Typography shuku-edit-id="e-d460ce9a-e8ea-4aa0-bca9-28016bef1688" variant="bodySmall" tone="inherit">SFT 冷启动：学会组织定位推理</Typography></div>}
    {stage===3&&<div shuku-edit-id="e-6d2ebc99-ef17-4513-9441-34940863220d" className="ga-result-key"><Typography shuku-edit-id="e-075cc87b-a913-446b-9db4-1b7adb71c6f3" variant="h3" tone="inherit">关键：按地理任务的特点设计训练奖励</Typography></div>}
    {stage===3&&<section shuku-edit-id="e-cf0381cc-86c3-4029-9aaa-e690e1f23e57" className="ga-result-strip"><Typography shuku-edit-id="e-d2eaf31b-6d20-4613-8456-5b887b4c1c68" variant="body" tone="inherit">GeoSeek-Val，误差 ≤750 km 的样本比例</Typography><div shuku-edit-id="e-249a2e64-624b-43b9-980d-b5f47dd3914b" className={`ga-result-value ${improved?'ga-show-grpo':'ga-show-sft'}`}><Typography shuku-edit-id="e-4e977bb9-7c42-4253-aaa5-7e07f7393f4e" variant="h3" tone="inherit">仅 SFT 47.12%</Typography><Typography shuku-edit-id="e-4b2ba138-50ce-4cbc-a737-84a1a491803b" variant="h3" tone="inherit">GeoAgent 60.37%</Typography></div></section>}
    <footer shuku-edit-id="e-8d268894-46ee-4b27-a66d-adee097e8626" className="ga-footer"><Typography shuku-edit-id="e-1b126936-e0f6-4054-86fd-d55ef6d721e0" variant="bodySmall" tone="muted">来源：arXiv:2602.12617，§3–4、表 3</Typography><Typography shuku-edit-id="e-eb02bbca-08d3-4d80-92f1-777b0313da6d" variant="bodySmall" tone="muted">照片、地图与分析为教学示意</Typography><div shuku-edit-id="e-fda6fbbd-18d1-4630-9de3-b182f58a200d" className="ga-footer-tools"><Button onClick={()=>{reset();setDetailOpen(false);}} aria-label="重置当前演示"><Typography shuku-edit-id="e-8f6b614e-22de-44b7-b1db-3e0298a414a8" as="span" variant="bodySmall" tone="inherit">重置</Typography></Button><Button onClick={toggleFull} aria-label="切换全屏"><Typography shuku-edit-id="e-1ecdc3c6-a7bf-4bed-8db3-29483b6def32" as="span" variant="bodySmall" tone="inherit">{fullscreen?'退出全屏':'全屏'}</Typography></Button></div></footer>
    {detailOpen&&stage===2&&<div shuku-edit-id="e-4afdb1c7-0a3f-4a01-af78-e9ff721ebc4d" className="ga-detail-backdrop" onClick={()=>setDetailOpen(false)}><section shuku-edit-id="e-042d439f-0a57-45c3-ab2a-16f249f0b845" className="ga-detail-dialog" role="dialog" aria-modal="true" aria-label="奖励解释详情" onClick={e=>e.stopPropagation()} onKeyDown={e=>{if(e.key==='Escape')setDetailOpen(false);}}><div shuku-edit-id="e-91ca0a66-3c6e-40cb-afb2-4a03c8a02282" className="ga-dialog-head"><Typography shuku-edit-id="e-8d8ab5f3-21d2-4952-9f13-ba4821823c14" variant="h3">{['位置接近','地名语义接近','推理与答案一致'][reward]}</Typography><Button autoFocus aria-label="关闭奖励解释" onClick={()=>setDetailOpen(false)}><Typography shuku-edit-id="e-6e51772b-010c-4ae3-acdb-e6cdf58f1426" as="span" variant="bodySmall" tone="inherit">关闭</Typography></Button></div>
      {reward===0&&<div shuku-edit-id="e-21bf68e3-8dd8-4036-babd-6abeec3faafe" className="ga-reward-detail"><Typography shuku-edit-id="e-a2b17bef-8d9a-471e-ae14-81fd9793c41e" variant="body">离真实坐标越近，奖励越高。</Typography><div shuku-edit-id="e-36c4dcdb-906f-4257-96da-7cbda32da969" className="ga-distance"><Typography shuku-edit-id="e-cb70a637-0b8d-4db9-b3de-c7b83ca51ff5" variant="h2" tone="success">{cand.d} km</Typography><Typography shuku-edit-id="e-03a4b2ad-4621-45c3-8579-341abfe937ad" variant="bodySmall">示意距离</Typography></div><div shuku-edit-id="e-6bd5a3d2-a143-49b7-8ca7-7dcce5e6e081" className="ga-reward-meter"><i shuku-edit-id="e-b3be6830-ed1c-4ba7-ae56-ef81c33df8b3" style={{width:`${spatial*100}%`}}/></div><Typography shuku-edit-id="e-6c606d77-8b88-496e-b842-97e58d6ac45f" variant="body">示意空间奖励：{spatial.toFixed(3)}</Typography><Typography shuku-edit-id="e-491e2d81-1c07-4839-9f2a-1fd23370d76e" variant="bodySmall" tone="muted">按论文的指数衰减形式计算，演示温度取 100 km。关闭后，可在地图上选择不同候选点。</Typography></div>}
      {reward===1&&<div shuku-edit-id="e-69c6c2c2-ca13-4e50-9ebb-597aca91755a" className="ga-reward-detail"><div shuku-edit-id="e-87fae04d-e860-4efe-8631-4ed846a9727b" className="ga-toggle-pair"><Button active={alias} onClick={()=>setAlias(true)}><Typography shuku-edit-id="e-418de2e2-63c9-4fc4-a02c-d53730ffee07" as="span" variant="bodySmall" tone="inherit">地名别称</Typography></Button><Button active={!alias} onClick={()=>setAlias(false)}><Typography shuku-edit-id="e-f1d0e63f-48ca-49fc-8561-8f197e6e20f9" as="span" variant="bodySmall" tone="inherit">不同地点</Typography></Button></div><div shuku-edit-id="e-e99f4f02-12df-443d-8ca9-5938088726f0" className="ga-alias"><Typography shuku-edit-id="e-552bd6f4-aa3c-43e2-a571-6b3f9fc7f4d0" variant="h3">{alias?'Hefei ≈ Hefei City':'Hefei ≠ Paris'}</Typography></div><Typography shuku-edit-id="e-144c5468-77ec-4a6f-8206-68721bbbf1e5" variant="body">{alias?'写法不同，却指向同一地点，应该得到合理的语义奖励。':'地点含义不同，不能因为都像地名就得到相同奖励。'}</Typography><Typography shuku-edit-id="e-d102e097-16a0-412a-947d-a65ac4efe64f" variant="bodySmall" tone="muted">论文按地址层级比较语义，并约束上下级关系。</Typography></div>}
      {reward===2&&<div shuku-edit-id="e-33ec7b34-3038-469c-913b-41316410b020" className="ga-reward-detail"><div shuku-edit-id="e-1ebd7022-1afc-4f9f-8683-0c4376a44d00" className="ga-toggle-pair"><Button active={consistent} onClick={()=>{setConsistent(true);setChecked(false);}}><Typography shuku-edit-id="e-93fc65db-9184-44bd-b845-f0f88e37f6db" as="span" variant="bodySmall" tone="inherit">一致示例</Typography></Button><Button active={!consistent} onClick={()=>{setConsistent(false);setChecked(false);}}><Typography shuku-edit-id="e-e2d8f879-4114-4389-aa4f-fd1fa7bce370" as="span" variant="bodySmall" tone="inherit">矛盾示例</Typography></Button></div><Typography shuku-edit-id="e-f363e268-1e07-431e-9c2c-a5f2f857b7ac" variant="body">推理：{consistent?'逐层排除后，线索共同指向区域 A。':'前面的分析始终只支持区域 B。'}</Typography><Typography shuku-edit-id="e-07bbcfd4-ce53-40d8-bf45-fc89bfac5427" variant="body">最终答案：区域 A</Typography><Button variant="primary" onClick={()=>setChecked(true)}><Typography shuku-edit-id="e-1777880b-6b70-45cf-bf1d-6f2e451ed57d" as="span" variant="bodySmall" tone="inherit">只读推理，重建地点</Typography></Button>{checked&&<div shuku-edit-id="e-bfe49129-b081-4123-b002-ee75f5418a56" className={`ga-check-result ${consistent?'':'is-inconsistent'}`}><Typography shuku-edit-id="e-6c80f808-91ae-42ce-a4be-1cdfd4c255c6" variant="bodySmall">{consistent?'✓ 重建为 A，与答案一致。':'✕ 重建为 B，与答案 A 矛盾。'}</Typography><Typography shuku-edit-id="e-565f0051-0727-4f82-9766-c245e57294e1" variant="bodySmall">{consistent?'推理一致性得到正向反馈。':'答案看似明确，推理却无法支持它。'}</Typography></div>}</div>}
    </section></div>}
  </main>;
}
