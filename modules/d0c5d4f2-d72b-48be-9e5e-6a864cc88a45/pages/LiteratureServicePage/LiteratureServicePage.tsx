import { useEffect, useState, type CSSProperties } from 'react';
import { Activity, ArrowRight, BookOpen, Check, ChevronLeft, ChevronRight, Database, FileText, GitBranch, Home, Image as ImageIcon, ListTree, Pause, Play, RotateCcw, Search, Settings, ShieldCheck, Users } from 'lucide-react';
import { Button, RangeControl, Typography, moduleAssetUrl } from '../../../shared/react';
import outline from '../../outlines.json';
import { PIPELINE_DURATION, pipelineChapters, usePipelinePlayback } from './usePipelinePlayback';
import './LiteratureServicePage.css';

const tasks = [
 ['check_arxiv','发现新论文'], ['check_status','检查处理状态'], ['arxiv_paper_fetch','获取 PDF'],
 ['oa_url_check','定位开放全文'], ['parse_pdfs','解析 PDF'], ['fig_tab_extract','提取图表'],
 ['upload_imgs','保存视觉元素'], ['outline_summary','生成大纲总结'], ['author_info','识别作者与机构'],
 ['embedding_title','组织检索索引'], ['auto_ready','准备结构化结果'], ['sort_daily_pubs','汇入论文数据库'],
];
const taskPhase = [0,0,1,1,2,3,3,4,4,5,5,5];
const captions = [
 ['每天，','论文处理流水线自动启动'],
 ['新论文到来，','PDF 自动进入处理队列'],
 ['自研分析算法，','逐页读懂原始 PDF'],
 ['核心图表，','从论文中自动提取'],
 ['大纲、总结与机构，','一并结构化'],
 ['20万+论文，','已经沉淀为研究数据库'],
];
function Pinwheel(){return <span className="rf-af-logo" aria-label="Airflow"><i/><i/><i/><i/></span>;}
function FigureCrop({table=false}:{table?:boolean}){
 const crop=table?[60,4455,1009,380]:[60,1280,1009,340];
 const [x,y,w,h]=crop;
 return <div className="rf-af-figure-crop" data-ppt-viewport="原有论文示例配图裁切" style={{aspectRatio:`${w}/${h}`}}><img src={moduleAssetUrl(outline.moduleIdentity.id,'images/recommendation-app/feed-reference.jpg')} alt={table?'论文图表内容示例':'论文方法图视觉元素示例'} draggable={false} style={{width:`${1129/w*100}%`,left:`${-x/w*100}%`,top:`${-y/h*100}%`}}/></div>;
}
function PdfPaper({phase,elapsed}:{phase:number;elapsed:number}){
 return <div className={`rf-af-paper is-phase-${phase}`} aria-label="PDF 解析示例">
  <div className="rf-af-paper-file"><FileText size={16}/><Typography variant="bodySmall">research_paper.pdf</Typography><Typography variant="bodySmall" tone="muted">PDF</Typography></div>
  <div className="rf-af-paper-sheet">
   <Typography variant="h3" align="center">Research Paper</Typography>
   <Typography variant="bodySmall" className={phase===4?'rf-af-paper-selected':''} align="center">Authors · University · Research Institute</Typography>
   <div className={`rf-af-paper-text ${phase===2?'rf-af-paper-selected':''}`}><Typography variant="bodySmall">Abstract</Typography><i/><i/><i/></div>
   <div className={`rf-af-paper-image ${phase===3?'rf-af-paper-selected':''}`}><FigureCrop/><Typography variant="bodySmall" align="center">Figure 1 · Visual results</Typography></div>
   <div className={`rf-af-paper-text ${phase===4?'rf-af-paper-selected':''}`}><Typography variant="bodySmall">1 Introduction</Typography><i/><i/><Typography variant="bodySmall">2 Method</Typography><i/></div>
   {phase===2&&<div className="rf-af-scan-line" style={{top:`${18+(elapsed%10)/10*70}%`}}/>}
  </div>
 </div>;
}
function ScheduleOverview({phase,elapsed}:{phase:number;elapsed:number}){
 return <div className="rf-af-overview">
  <div className="rf-af-schedule-status"><span className="rf-af-status-dot"/><Typography variant="bodySmall">Scheduled · 每日自动调度</Typography></div>
  <div className="rf-af-workflow">{[['发现论文',FileText],['PDF 解析',GitBranch],['结构化入库',Database]].map(([name,Icon],i)=>{
   const IconComponent=Icon as typeof FileText;
   return <div className={`rf-af-flow-item ${i<=Math.floor(phase/2)?'active':''}`} key={String(name)}><div><IconComponent size={31}/></div><Typography variant="body">{String(name)}</Typography>{i<2&&<ArrowRight className="rf-af-flow-arrow" size={26}/>}</div>;
  })}</div>
  <div className="rf-af-overview-bottom"><div className="rf-af-daily-runs"><Typography variant="bodySmall" tone="muted">Daily scheduled runs · 流程回放</Typography><div>{Array.from({length:12},(_,i)=><span key={i} className={i===11?'current':''} style={{height:`${[35,58,44,70,51,65,42,60,76,56,68,82][i]}%`}}/>)}</div><Typography variant="bodySmall" tone="muted">每天重复运行，持续积累</Typography></div><div className="rf-af-job-preview">{phase===0?<><Activity size={40}/><Typography variant="h2">自动启动</Typography><Typography variant="bodySmall" tone="muted">发现 → 获取 → 解析 → 入库</Typography></>:<div className="rf-af-pdf-queue">{[0,1,2].map((n)=><div key={n} style={{'--queue-index':n} as CSSProperties}><FileText size={35}/><Typography variant="bodySmall">paper_00{n+1}.pdf</Typography><span><Check size={15}/></span></div>)}</div>}</div></div>
  {phase===1&&<div className="rf-af-queue-progress"><span style={{width:`${(elapsed-10)*10}%`}}/></div>}
 </div>;
}
export function LiteratureServicePage(){
 const clock=usePipelinePlayback(),{phase,elapsed,playing}=clock;
 const [enabled,setEnabled]=useState(true),[detail,setDetail]=useState<'outline'|'summary'|'institution'>('outline'),[figure,setFigure]=useState(false);
 const detailBeat=Math.floor((elapsed-40)/3.33),figureBeat=elapsed>=35;
 useEffect(()=>{if(playing&&phase===4)setDetail(detailBeat<1?'outline':detailBeat<2?'summary':'institution')},[playing,phase,detailBeat]);
 useEffect(()=>{if(playing&&phase===3)setFigure(figureBeat)},[playing,phase,figureBeat]);
 const reset=()=>{clock.seek(0);setEnabled(true);setDetail('outline');setFigure(false)};
 const jump=(next:number)=>{clock.seek(next*10);setEnabled(true);setDetail('outline');setFigure(false)};
 const toggle=()=>{setEnabled(true);clock.toggle()};
 const currentTask=phase===0?0:phase===1?2:phase===2?4:phase===3?5:phase===4?8:11;
 const taskProgress=(elapsed%10)/10;
 return <div className={`rf-page rf-airflow ${playing?'is-playing':'is-paused'}`} ref={clock.root} data-phase={phase} data-playing={playing} data-elapsed={elapsed.toFixed(2)}>
  <div className="rf-af-app">
   <nav className="rf-af-sidebar" aria-label="Airflow 复刻侧栏"><Pinwheel/>{[[Home,'Home'],[GitBranch,'Dags'],[Database,'Assets'],[Settings,'Admin'],[ShieldCheck,'Security']].map(([Icon,name])=>{const I=Icon as typeof Home;return <div key={String(name)} className={name==='Dags'?'selected':''}><I size={22}/><Typography variant="bodySmall">{String(name)}</Typography></div>})}<div className="rf-af-sidebar-bottom"><BookOpen size={21}/><Typography variant="bodySmall">Docs</Typography></div></nav>
   <section className="rf-af-history"><div className="rf-af-history-heading"><Typography variant="bodySmall" tone="muted">Dag</Typography><Typography variant="bodySmall">master_daily_pipeline</Typography></div>
    <div className="rf-af-mini-bars" aria-label="每日运行历史示意">{[38,84,61,58,64,70,60,75,67,89].map((height,i)=><span key={i} style={{height:`${height}%`}}/>)}</div>
    <div className="rf-af-run-grid" aria-label="任务调度回放">{tasks.map(([task,label],i)=><button key={task} className={i===currentTask?'selected':''} onClick={()=>jump(taskPhase[i])} aria-label={`查看任务：${label}`}><Typography variant="bodySmall">trigger__{task}</Typography><span className="rf-af-run-cells">{Array.from({length:8},(_,j)=><i key={j} className={j===7&&i===currentTask&&elapsed<60?'running':''}><Check size={9}/></i>)}</span></button>)}</div>
    <div className="rf-af-history-legend"><span/><Typography variant="bodySmall" tone="muted">调度与任务状态示意</Typography></div>
   </section>
   <main className="rf-af-main">
    <div className="rf-af-toolbar"><div><GitBranch size={20}/><Typography variant="body">master_daily_pipeline</Typography><button className={`rf-af-enabled ${enabled?'on':''}`} aria-label="切换调度演示" aria-pressed={enabled} onClick={()=>{setEnabled(!enabled);clock.pause()}}><i/></button></div><div className="rf-af-search"><Search size={15}/><Typography variant="bodySmall" tone="muted">Search Dags</Typography></div><Button variant="primary" onClick={toggle} aria-label={playing?'暂停60秒演示':'播放60秒演示'}>{playing?<Pause size={15}/>:<Play size={15}/>}<Typography as="span" variant="bodySmall" tone="inherit">{playing?'Pause':'Trigger'}</Typography></Button></div>
    <div className="rf-af-meta"><div><Typography variant="bodySmall" tone="muted">Schedule</Typography><Typography variant="bodySmall">{enabled?'每日自动运行':'调度演示已暂停'}</Typography></div><div><Typography variant="bodySmall" tone="muted">Run type</Typography><Typography variant="bodySmall">Scheduled</Typography></div><div><Typography variant="bodySmall" tone="muted">Owner</Typography><Typography variant="bodySmall">airflow</Typography></div><div><Typography variant="bodySmall" tone="muted">Tags</Typography><Typography variant="bodySmall">master_pipeline</Typography></div></div>
    <div className="rf-af-native-tabs"><Typography variant="bodySmall" className="active">Overview</Typography>{['Runs','Tasks','Backfills','Events','Code','Details'].map(t=><Typography key={t} variant="bodySmall" tone="muted">{t}</Typography>)}<Typography variant="bodySmall" className="rf-af-replay-tag">流程回放</Typography></div>
    <div className={`rf-af-workspace is-phase-${phase}`}>
     {phase<2?<ScheduleOverview phase={phase} elapsed={elapsed}/>:phase<5?<div className={`rf-af-extraction is-phase-${phase}`}>
      <PdfPaper phase={phase} elapsed={elapsed}/>
      <div className="rf-af-extraction-arrow"><ArrowRight size={35}/></div>
      <div className="rf-af-output" key={phase}>
       {phase===2?<><div className="rf-af-algorithm-orbit"><GitBranch size={53}/><span/><span/></div><Typography variant="h2">自研分析算法</Typography><div className="rf-af-algorithm-lines"><Typography variant="body">版面识别</Typography><Typography variant="body">内容定位</Typography><Typography variant="body">结构恢复</Typography></div><div className="rf-af-analysis-progress"><span style={{width:`${taskProgress*100}%`}}/></div></>:
       phase===3?<><div className="rf-af-output-heading"><ImageIcon size={24}/><Typography variant="h3">核心视觉元素</Typography></div><button className="rf-af-extracted-figure" aria-label="切换提取图表示例" onClick={()=>{clock.pause();setFigure(!figure)}}><FigureCrop table={figure}/></button><Typography variant="bodySmall" tone="muted">{figure?'图表内容示例':'图表视觉元素示例'} · 点击切换</Typography><div className="rf-af-extraction-tags"><Typography variant="bodySmall">图表</Typography><Typography variant="bodySmall">题注</Typography><Typography variant="bodySmall">原文位置</Typography></div></>:
       <><div className="rf-af-detail-tabs">{[['outline','大纲'],['summary','总结'],['institution','机构信息']].map(([id,label])=><Button key={id} active={detail===id} onClick={()=>{clock.pause();setDetail(id as typeof detail)}}>{label}</Button>)}</div><div className="rf-af-detail-result" key={detail}>{detail==='outline'?<><ListTree size={34}/>{['1 研究背景','2 方法设计','3 实验与分析','4 结论'].map(t=><Typography variant="body" key={t}>{t}</Typography>)}</>:detail==='summary'?<><FileText size={34}/><Typography variant="h3">论文核心信息</Typography><Typography variant="body">研究问题</Typography><Typography variant="body">主要方法</Typography><Typography variant="body">核心结论</Typography></>:<><Users size={34}/><Typography variant="h3">作者与机构关联</Typography><Typography variant="body">作者 → 所属机构</Typography><Typography variant="bodySmall" tone="muted">机构名称 · 署名关系</Typography></>}</div><Typography className="rf-af-example-note" variant="bodySmall" tone="muted">结构化结果示例</Typography></>}
      </div>
     </div>:<div className="rf-af-database-finish"><div className="rf-af-database-icon"><Database size={56}/><Check size={24}/></div><Typography variant="display" className="rf-af-database-number">20万+</Typography><Typography variant="h2">论文已结构化入库</Typography><div className="rf-af-database-fields">{[[FileText,'PDF 原文'],[ImageIcon,'核心图表'],[ListTree,'大纲总结'],[Users,'机构信息']].map(([Icon,label])=>{const I=Icon as typeof FileText;return <div key={String(label)}><I size={22}/><Typography variant="bodySmall">{String(label)}</Typography></div>})}</div><Typography variant="bodySmall" tone="muted">每天自动运行，研究基础持续积累</Typography></div>}
    </div>
   </main>
  </div>
  <div className="rf-af-caption" key={phase} aria-live="polite"><Typography variant="h2"><Typography as="span" variant="h2" tone="inherit">{captions[phase][0]}</Typography>{captions[phase][1]}</Typography></div>
  <footer className="rf-af-film-controls" onKeyDown={e=>e.stopPropagation()}>
   <Typography variant="bodySmall" tone="muted">界面复刻 · 本地流程回放</Typography>
   <div className="rf-af-chapters">{pipelineChapters.map((label,i)=><button key={label} aria-label={`跳到${label}`} aria-pressed={phase===i} onClick={()=>jump(i)}><i className={phase===i?'active':''}/><Typography variant="bodySmall">{label}</Typography></button>)}</div>
   <div className="rf-af-transport"><Button onClick={()=>jump(Math.max(0,phase-1))} aria-label="上一段"><ChevronLeft size={17}/></Button><Button variant="primary" onClick={toggle} aria-label={playing?'暂停60秒演示':'播放60秒演示'}>{playing?<Pause size={18}/>:<Play size={18}/>}</Button><Button onClick={()=>jump(Math.min(5,phase+1))} aria-label="下一段"><ChevronRight size={17}/></Button><Button onClick={reset} aria-label="重播60秒演示"><RotateCcw size={17}/></Button></div>
   <Typography variant="bodySmall" className="rf-af-time">{String(Math.floor(elapsed/60)).padStart(2,'0')}:{String(Math.floor(elapsed%60)).padStart(2,'0')} / 01:00</Typography>
   <div className="rf-af-seek"><RangeControl aria-label="演示时间" label="演示时间" min={0} max={PIPELINE_DURATION} step={.1} value={elapsed} onChange={e=>clock.seek(Number(e.target.value))} formatValue={()=>''}/></div>
  </footer>
 </div>;
}
