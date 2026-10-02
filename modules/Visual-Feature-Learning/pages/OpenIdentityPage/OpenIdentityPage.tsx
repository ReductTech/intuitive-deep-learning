import {useState,type CSSProperties} from 'react';
import {Button,ContentBlock,MathFormulaBlock,MathFormulaStatic,Typography,moduleAssetUrl} from '../../../shared/react';
import './OpenIdentityPage.css';

const asset=(file:string)=>moduleAssetUrl('80396753-7fc8-4f55-9188-bddbdb828169',`open-identity/${file}`);
const names=['孔子','鲁迅','胡适','周作人'];
function Portrait({file,label}:{file:string;label:string}){return <div role="img" aria-label={label} className={`vfl-open-portrait ${file==='luxun-1933.jpg'?'is-standing':file==='luxun-1930.jpg'?'is-luxun':''}`} style={{'--vfl-open-photo':`url(${asset(file)})`} as CSSProperties}/>;}
function Vector({index}:{index:number}){
 return <div className="vfl-open-vector"><MathFormulaBlock><MathFormulaStatic latex={`f_${index}`}/></MathFormulaBlock><div className="vfl-open-vector-cells" aria-label="特征向量的结构示意">{Array.from({length:8},(_,i)=>i===4?<Typography as="span" key={i} variant="bodySmall" tone="accent">…</Typography>:<span key={i} style={{opacity:.38+((i*3+index)%5)*.13}}/>)}</div></div>;
}

export function OpenIdentityPage(){
 const [outside,setOutside]=useState(false),[answer,setAnswer]=useState('鲁迅');
 const identity=outside?'郭沫若':'鲁迅';
 function toggle(){setOutside(v=>!v);setAnswer('鲁迅');}
 return <ContentBlock className="vfl-open-page" headingLevel={1} title="从有限类别到开放身份" subtitle="数字的类别是固定的 0–9；人脸任务还会遇到训练名单之外的新身份。">
 <div className="vfl-open-body">
  <div className="vfl-open-main">
   <section className={`vfl-open-fixed ${outside?'is-outside':''}`} aria-label="固定选项分类">
    <div className="vfl-open-panel-title"><Typography variant="h3" tone="accent">固定选项分类</Typography></div>
    <div className="vfl-open-question"><Portrait file={outside?'guo-moruo.jpg':'luxun-1930.jpg'} label={outside?'新人物郭沫若的照片':'鲁迅的历史照片'}/><div><Typography variant="h2" tone="accent">他是谁？</Typography><Typography variant="bodySmall" tone={outside?'warning':'muted'}>{outside?'新人物：郭沫若':'只能从下面 4 个选项中选'}</Typography></div></div>
    <div className="vfl-open-options">{names.map((name,i)=><Button key={name} active={!outside&&answer===name} aria-pressed={!outside&&answer===name} onClick={()=>setAnswer(name)}><Typography as="span" variant="h3" tone="inherit">{String.fromCharCode(65+i)}. {name}</Typography></Button>)}</div>
    <div className="vfl-open-fixed-feedback" aria-live="polite"><Typography variant="bodySmall" tone={outside?'warning':answer==='鲁迅'?'accent':'muted'}>{outside?'原来的 4 个输出里，没有“郭沫若”。':answer==='鲁迅'?'名单内：可以输出“鲁迅”这个类别。':'这张照片是鲁迅，请比较原图再选择。'}</Typography><Typography variant="bodySmall" tone="muted">{outside?'新增身份通常要调整分类输出，再训练。':'分类器回答：他属于哪一个已知类别？'}</Typography></div>
    <Button className="vfl-open-new-person" variant={outside?'default':'warn'} onClick={toggle}>{outside?'恢复名单内的人':'换成名单之外的人'}</Button>
   </section>

   <div className="vfl-open-transition"><Typography variant="h3" tone="warning">身份集合<br/>可以不断扩展</Typography><svg viewBox="0 0 210 90" aria-hidden="true"><defs><linearGradient id="vfl-open-arrow"><stop stopColor="#e7f0fd"/><stop offset="1" stopColor="#4e8cda"/></linearGradient></defs><path d="M8 26H133V5L199 45L133 85V64H8Z" fill="url(#vfl-open-arrow)"/></svg><Typography variant="bodySmall" tone="accent">不预先枚举所有人</Typography><Typography variant="bodySmall" tone="muted">改问：<br/>是不是同一个人？</Typography></div>

   <section className="vfl-open-verification" aria-label="开放身份任务：人脸验证">
    <div className="vfl-open-panel-title"><Typography variant="h3" tone="accent">开放身份任务：人脸验证</Typography></div>
    <div className="vfl-open-pair"><div><Portrait file={outside?'guo-moruo.jpg':'luxun-1930.jpg'} label={`${identity}的第一张照片`}/><Typography variant="bodySmall" tone="accent">{identity} · 照片 1</Typography></div><div><Portrait file={outside?'luxun-1930.jpg':'luxun-1933.jpg'} label={outside?'鲁迅的照片':'鲁迅的另一张历史照片'}/><Typography variant="bodySmall" tone="accent">鲁迅 · {outside?'参照照片':'照片 2'}</Typography></div></div>
    <svg className="vfl-open-photo-links" viewBox="0 0 600 24" preserveAspectRatio="none" aria-hidden="true"><path d="M150 0V20M450 0V20" stroke="#7898c4" strokeWidth="2"/><path d="M144 15L150 22L156 15M444 15L450 22L456 15" fill="none" stroke="#7898c4" strokeWidth="2"/></svg>
    <div className="vfl-open-backbone"><Typography variant="h3" tone="accent">共享特征提取器</Typography><Typography variant="bodySmall" tone="muted">同一个 CNN，使用相同参数</Typography></div>
    <div className="vfl-open-features"><div><span className="vfl-open-stem"/><Vector index={1}/></div><div><span className="vfl-open-stem"/><Vector index={2}/></div></div>
    <svg className="vfl-open-merge" viewBox="0 0 600 26" preserveAspectRatio="none" aria-hidden="true"><path d="M150 0V10Q150 15 155 15H445Q450 15 450 10V0M300 15V25" stroke="#7898c4" strokeWidth="2" fill="none"/></svg>
    <div className="vfl-open-distance"><MathFormulaBlock><MathFormulaStatic latex={String.raw`d(f_1,f_2)`}/></MathFormulaBlock><Typography variant="bodySmall" tone="muted">比较特征距离</Typography><div className={`vfl-open-relation ${outside?'is-different':''}`} aria-live="polite"><Typography variant="bodySmall" tone="inherit">已知样本关系</Typography><Typography variant="h3" tone="inherit">{outside?'不同人':'同一人'}</Typography></div></div>
    <Typography className="vfl-open-diagram-note" variant="bodySmall" tone="muted">向量为结构示意；怎样学到适合比较的特征？</Typography>
   </section>
  </div>
  <div className="vfl-open-takeaway"><Typography variant="h3" tone="accent">身份集合可以扩展，比较仍然回答“同人／不同人”。</Typography></div>
  <Typography className="vfl-open-next" variant="bodySmall" tone="muted">下一步：分类训练得到的特征，已经适合用距离比较身份了吗？</Typography>
 </div></ContentBlock>;
}
