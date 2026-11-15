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
  return <g transform={`translate(${x} ${y})`} className={active?'ga-pin-pop':''}><g transform={`scale(${sx} 1)`}>
    {active&&<circle r="26" fill={color} opacity=".13" className="ga-pulse"/>}
    <path d="M0 8C-7-3-17-12-17-23a17 17 0 1 1 34 0C17-12 7-3 0 8Z" fill={color} stroke="white" strokeWidth="4"/>
    <circle cy="-23" r="5" fill="white"/>
  </g></g>;
}

function MapView({stage,ready,clue,selected,onChoose,improved,onLocate}:{stage:number;ready:boolean;clue:number|null;selected:string;onChoose:(id:string)=>void;improved:boolean;onLocate:()=>void}) {
  const [zoom,setZoom]=useState(1);
  const [inspected,setInspected]=useState(false);
  const pinScale=[.88,1.11,.914,.619][stage];
  useEffect(()=>{setZoom(1);setInspected(false);},[stage]);
  const showing=true;
  const cand=candidates.find(c=>c.id===selected)!;
  return <div className="ga-map-wrap">
    <div className="ga-map" data-testid="map"><img className="ga-map-art" src={moduleAssetUrl("scene-atlas.webp")} alt=""/>
      <svg preserveAspectRatio="none" viewBox="0 0 456 365" aria-label="定位教学示意地图" role="img">
        <g transform={`translate(${228*(1-zoom)} ${182*(1-zoom)}) scale(${zoom})`}>
          {stage===1&&<ellipse cx="268" cy="215" rx={clue===null?150:100} ry={clue===null?105:70} fill="#1768ec" opacity=".12" stroke="#1768ec" strokeWidth="3" strokeDasharray="8 7" className="ga-region"/>}{stage===1&&<ellipse cx="268" cy="215" rx="65" ry="43" fill="#009889" fillOpacity=".1" stroke="#009889" strokeWidth="2" strokeDasharray="6 5"/>}
          {stage===2&&<>
            {candidates.map(c=><line key={c.id} x1={c.x} y1={c.y} x2="350" y2="220" stroke={c.id===selected?'#009889':'#9daaba'} strokeWidth={c.id===selected?4:2} strokeDasharray="7 5"/>)}
            <Pin sx={pinScale} x={350} y={220} color="#17314b"/>
          </>}
          {showing&&stage!==2&&<Pin sx={pinScale} x={stage===3&&!improved?130:280} y={stage===3&&!improved?125:220} color="#009889" active/>}
        </g>
      </svg>
      {stage===2? <>
        {candidates.map(c=><button key={c.id} className={`ga-map-candidate ga-map-candidate-${c.id} ${selected===c.id?'is-selected':''}`} style={{left:`${c.x/456*100}%`,top:`${c.y/365*100}%`}} onClick={()=>{onChoose(c.id);setInspected(true);}} aria-label={c.name} aria-pressed={selected===c.id}>
          <span className="ga-candidate-dot"/><Typography as="span" variant="bodySmall">{c.name}{inspected&&selected===c.id?` · ${c.d} km`:null}</Typography>
        </button>)}
        <Typography as="span" variant="bodySmall" className="ga-truth">真实地点</Typography>
      </>:showing?<button className="ga-prediction" onClick={onLocate} aria-label="查看预测地点依据"><Typography as="span" variant="bodySmall">{stage===1?'根据线索缩小范围':'预测拍摄地点'}</Typography></button>:<div className="ga-map-idle"><span className="ga-target-icon">⌖</span><Typography variant="body">等待图像分析</Typography></div>}
      {stage!==2&&<div className="ga-map-tools"><Button aria-label="放大地图" disabled={zoom>=1.5} onClick={()=>setZoom(z=>Math.min(1.5,z+.25))}><Typography as="span" variant="bodySmall" tone="inherit">＋</Typography></Button><Button aria-label="缩小地图" disabled={zoom<=1} onClick={()=>setZoom(z=>Math.max(1,z-.25))}><Typography as="span" variant="bodySmall" tone="inherit">−</Typography></Button></div>}
      
    </div>
    <div className="ga-map-caption"><span className="ga-status-dot"/><Typography variant="bodySmall">{stage===2?`${cand.name}：示意距离 ${cand.d} km`:stage===1?'多条线索共同缩小候选范围':showing?'点击候选点，查看判断依据':'点击照片，开始定位分析'}</Typography></div>
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

  return <main ref={surface} className={`ga-page ga-stage-${stage}`} data-page-id={PAGE_ID} data-capture-ready={fontReady}>
    <header className="ga-header">
      <Typography as="h1" variant="display" tone="inherit">GeoAgent：给一张照片，推断拍摄地点</Typography>
      <Typography variant="h3" tone="inherit">这篇论文研究：怎样训练模型，让定位更准、推理更一致</Typography>
    </header>
    <nav className="ga-tabs" role="tablist" aria-label="GeoAgent 四个展示状态">
      {tabs.map((name,n)=><Button key={name} id={`ga-tab-${n}`} role="tab" aria-selected={stage===n} aria-controls="ga-content" active={stage===n} className="ga-tab" onClick={()=>{changeStage(n);setDetailOpen(false);}} onKeyDown={e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const next=(n+(e.key==='ArrowRight'?1:3))%4;changeStage(next);setDetailOpen(false);document.getElementById(`ga-tab-${next}`)?.focus();}}}><Typography as="span" variant="h2" tone="inherit">{name}</Typography></Button>)}
    </nav>
    <section id="ga-content" role="tabpanel" aria-labelledby={`ga-tab-${stage}`} className="ga-content">
      <div className="ga-photo-column">
        <div className={`ga-photo ${phase>0&&phase<4?'ga-is-scanning':''}`}>
          <button className="ga-photo-main" aria-label="分析街景照片" onClick={()=>{if(stage===0){setBasis(false);setRun(r=>r+1);}else if(stage===1)setClue(c=>c===null?0:(c+1)%3);else if(stage===2){setReward(0);setDetailOpen(true);}else setImproved(v=>!v);}}><img src={moduleAssetUrl("scene-atlas.webp")} alt="用于教学演示的合成街景，包含路牌、道路标线与行道树" draggable="false"/></button>
          {stage===1&&clues.map((c,n)=><button key={c.name} aria-label={`查看${c.name}线索`} className={`ga-hotspot ${clue===n?'is-active':''}`} style={{left:`${c.x}%`,top:`${c.y}%`,width:`${c.w}%`,height:`${c.h}%`}} onClick={()=>chooseClue(n)}><Typography as="span" variant="bodySmall" tone="inherit">{c.name}</Typography></button>)}
          {stage===0&&phase>0&&phase<4&&<div className="ga-scan-line"/>}
          {stage===0&&<div className="ga-photo-callout"><Typography variant="bodySmall" tone="inherit">{phase===0?'点击照片，开始分析':phase===4?'✓ 分析完成，可再次播放':'正在寻找图中线索…'}</Typography></div>}
          {stage===1&&<div className="ga-photo-callout"><Typography variant="bodySmall" tone="inherit">{activeClue?'观察到的线索':'选择图中的线索'}</Typography></div>}
          <div className="ga-photo-label"><Typography variant="bodySmall" tone="inherit">{stage===2?'同一张训练图像':'街景示意'}</Typography></div>
        </div>
        {stage===1&&<div className="ga-clue-buttons" hidden>{clues.map((c,n)=><Button key={c.name} active={clue===n} onClick={()=>setClue(n)}><Typography as="span" variant="bodySmall" tone="inherit">{c.name}</Typography></Button>)}</div>}
      </div>
      <div className="ga-analysis-column" aria-live="polite">
        {stage===0&&<div className="ga-analysis-panel">
          <div className={`ga-trace-item ${phase>=1?'is-revealed':''}`}><Typography variant="h2" tone="inherit">观察路牌、道路与<br/>植被线索…{phase>0&&phase<4?'…':''}</Typography></div>
          <Typography as="span" variant="bodySmall" tone="accent" className="ga-flow-arrow" aria-hidden="true">↓</Typography>
          <div className={`ga-trace-item ${phase>=2?'is-revealed':''}`}><Typography variant="h2" tone="inherit">逐步缩小可能的<br/>拍摄范围</Typography></div>
          <Typography as="span" variant="bodySmall" tone="accent" className="ga-flow-arrow" aria-hidden="true">↓</Typography>
          
          {basis&&<div className="ga-basis"><Typography variant="bodySmall">这是预设定位流程，地图标记代表候选输出，不是该合成照片的实测地址。</Typography></div>}
        </div>}
        {stage===1&&<>
          <div className="ga-expert-steps">
            <div className={clue!==null?'is-revealed':''}><Typography variant="h3" tone="inherit">图中有哪些可用线索？</Typography></div><Typography as="span" variant="bodySmall" tone="accent" className="ga-flow-arrow" aria-hidden="true">↓</Typography>
            <div><Typography variant="h3" tone="inherit">这些线索支持哪些地区？</Typography></div><Typography as="span" variant="bodySmall" tone="accent" className="ga-flow-arrow" aria-hidden="true">↓</Typography>
            <div><Typography variant="h3" tone="inherit">综合线索，给出地点判断</Typography></div>
          </div>
          <div className="ga-clue-explanation" key={clue??'initial'}><Typography variant="bodySmall" tone="inherit">{activeClue?.body??'选择照片中的路牌、道路或植被，查看专家如何使用证据。'}</Typography></div>
        </>}
        {stage===2&&<>
          <Typography variant="h2" tone="inherit" className="ga-reward-title">这个回答怎样得分？</Typography>
          <div className="ga-reward-switches" role="group" aria-label="奖励解释">
            {['位置：离真实坐标更近，奖励更高','地名：Hefei 与 Hefei City 含义接近','推理：只读推理，能否重建最终地点？'].map((description,n)=><Button key={description} active={reward===n} onClick={()=>{setReward(n);setDetailOpen(true);}} className="ga-reward-row"><span className="ga-reward-bullet" aria-hidden="true"/><Typography variant="body" tone="inherit">{description}</Typography></Button>)}
          </div>
          <Button variant="explain" className="ga-check-trigger" onClick={()=>{setReward(2);setDetailOpen(true);}}><Typography as="span" variant="bodySmall" tone="inherit">查看推理检查</Typography></Button>
        </>}
        {stage===3&&<>
          <div className="ga-toggle-pair ga-comparison" role="group" aria-label="训练前后比较"><Button active={!improved} onClick={()=>setImproved(false)}><Typography as="span" variant="bodySmall" tone="inherit">仅 SFT</Typography></Button><Button active={improved} onClick={()=>setImproved(true)}><Typography as="span" variant="bodySmall" tone="inherit">加入 GRPO</Typography></Button></div>
          <div className="ga-result-reasoning"><Typography variant="h3" tone="inherit">✓ 识别路牌与道路特征</Typography><Typography variant="h3" tone="inherit">✓ 结合植被与道路环境</Typography><Typography variant="h3" tone="inherit">{improved?'✓ 综合线索，给出位置判断':'✓ 学习专家的推理框架'}</Typography></div>
        </>}
      </div>
      <div className="ga-map-column"><MapView stage={stage} ready={phase===4} clue={clue} selected={candidate} onChoose={id=>{setCandidate(id);setReward(0);}} improved={improved} onLocate={()=>{if(stage===0)setBasis(b=>!b);else if(stage===1)setClue(c=>c===null?0:(c+1)%3);else setImproved(v=>!v);}}/>
        {stage===2&&<div className="ga-map-feedback"><Typography variant="bodySmall" tone="inherit">{cand.name}：{cand.d} km</Typography><Typography variant="bodySmall" tone="inherit">空间奖励 {spatial.toFixed(3)}</Typography></div>}
      </div>
      <div className="ga-link ga-link-a" aria-hidden="true">➜</div><div className="ga-link ga-link-b" aria-hidden="true">➜</div>
    </section>
    <section className="ga-takeaway">
      <Typography variant="h1" tone="inherit">{stage===0?'输入照片，输出地点和判断理由':stage===1?'先模仿 1 万条专家与资深玩家的推理':stage===2?'用 2 万张定位图像做 GRPO，奖励好的回答':'既奖励地点接近，也检查推理是否支持答案'}</Typography>
    </section>
    {stage===1&&<div className="ga-stage-note"><Typography variant="bodySmall" tone="inherit">SFT 冷启动：学会组织定位推理</Typography></div>}
    {stage===3&&<div className="ga-result-key"><Typography variant="h3" tone="inherit">关键：按地理任务的特点设计训练奖励</Typography></div>}
    {stage===3&&<section className="ga-result-strip"><Typography variant="body" tone="inherit">GeoSeek-Val，误差 ≤750 km 的样本比例</Typography><div className={`ga-result-value ${improved?'ga-show-grpo':'ga-show-sft'}`}><Typography variant="h3" tone="inherit">仅 SFT 47.12%</Typography><Typography variant="h3" tone="inherit">GeoAgent 60.37%</Typography></div></section>}
    <footer className="ga-footer"><Typography variant="bodySmall" tone="muted">来源：arXiv:2602.12617，§3–4、表 3</Typography><Typography variant="bodySmall" tone="muted">照片、地图与分析为教学示意</Typography><div className="ga-footer-tools"><Button onClick={()=>{reset();setDetailOpen(false);}} aria-label="重置当前演示"><Typography as="span" variant="bodySmall" tone="inherit">重置</Typography></Button><Button onClick={toggleFull} aria-label="切换全屏"><Typography as="span" variant="bodySmall" tone="inherit">{fullscreen?'退出全屏':'全屏'}</Typography></Button></div></footer>
    {detailOpen&&stage===2&&<div className="ga-detail-backdrop" onClick={()=>setDetailOpen(false)}><section className="ga-detail-dialog" role="dialog" aria-modal="true" aria-label="奖励解释详情" onClick={e=>e.stopPropagation()} onKeyDown={e=>{if(e.key==='Escape')setDetailOpen(false);}}><div className="ga-dialog-head"><Typography variant="h3">{['位置接近','地名语义接近','推理与答案一致'][reward]}</Typography><Button autoFocus aria-label="关闭奖励解释" onClick={()=>setDetailOpen(false)}><Typography as="span" variant="bodySmall" tone="inherit">关闭</Typography></Button></div>
      {reward===0&&<div className="ga-reward-detail"><Typography variant="body">离真实坐标越近，奖励越高。</Typography><div className="ga-distance"><Typography variant="h2" tone="success">{cand.d} km</Typography><Typography variant="bodySmall">示意距离</Typography></div><div className="ga-reward-meter"><i style={{width:`${spatial*100}%`}}/></div><Typography variant="body">示意空间奖励：{spatial.toFixed(3)}</Typography><Typography variant="bodySmall" tone="muted">按论文的指数衰减形式计算，演示温度取 100 km。关闭后，可在地图上选择不同候选点。</Typography></div>}
      {reward===1&&<div className="ga-reward-detail"><div className="ga-toggle-pair"><Button active={alias} onClick={()=>setAlias(true)}><Typography as="span" variant="bodySmall" tone="inherit">地名别称</Typography></Button><Button active={!alias} onClick={()=>setAlias(false)}><Typography as="span" variant="bodySmall" tone="inherit">不同地点</Typography></Button></div><div className="ga-alias"><Typography variant="h3">{alias?'Hefei ≈ Hefei City':'Hefei ≠ Paris'}</Typography></div><Typography variant="body">{alias?'写法不同，却指向同一地点，应该得到合理的语义奖励。':'地点含义不同，不能因为都像地名就得到相同奖励。'}</Typography><Typography variant="bodySmall" tone="muted">论文按地址层级比较语义，并约束上下级关系。</Typography></div>}
      {reward===2&&<div className="ga-reward-detail"><div className="ga-toggle-pair"><Button active={consistent} onClick={()=>{setConsistent(true);setChecked(false);}}><Typography as="span" variant="bodySmall" tone="inherit">一致示例</Typography></Button><Button active={!consistent} onClick={()=>{setConsistent(false);setChecked(false);}}><Typography as="span" variant="bodySmall" tone="inherit">矛盾示例</Typography></Button></div><Typography variant="body">推理：{consistent?'逐层排除后，线索共同指向区域 A。':'前面的分析始终只支持区域 B。'}</Typography><Typography variant="body">最终答案：区域 A</Typography><Button variant="primary" onClick={()=>setChecked(true)}><Typography as="span" variant="bodySmall" tone="inherit">只读推理，重建地点</Typography></Button>{checked&&<div className={`ga-check-result ${consistent?'':'is-inconsistent'}`}><Typography variant="bodySmall">{consistent?'✓ 重建为 A，与答案一致。':'✕ 重建为 B，与答案 A 矛盾。'}</Typography><Typography variant="bodySmall">{consistent?'推理一致性得到正向反馈。':'答案看似明确，推理却无法支持它。'}</Typography></div>}</div>}
    </section></div>}
  </main>;
}
