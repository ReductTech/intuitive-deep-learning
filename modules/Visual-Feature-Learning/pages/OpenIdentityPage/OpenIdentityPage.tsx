import {type CSSProperties} from 'react';
import {ContentBlock,MathFormulaBlock,MathFormulaStatic,Typography,moduleAssetUrl} from '../../../shared/react';
import './OpenIdentityPage.css';

const asset=(file:string)=>moduleAssetUrl('80396753-7fc8-4f55-9188-bddbdb828169',`open-identity/${file}`);
const names=['鲁迅','周树人','林小禾','陈书宁','周安晴','许云舟','苏晨雨','叶星然','江向阳','沈知夏','唐乐言','顾清秋','陆一诺','宋小满','程若溪','何景明','温晓禾','夏念初','余书遥','方雨桐','杜明川','陶语晨','莫予安','白小溪','钟亦宁','乔星禾'];
function Portrait({file,label}:{file:string;label:string}){return <div role="img" aria-label={label} className={`vfl-open-portrait ${file==='luxun-1933.jpg'?'is-standing':file==='luxun-1930.jpg'?'is-luxun':''}`} style={{'--vfl-open-photo':`url(${asset(file)})`} as CSSProperties}/>;}
function Vector({index}:{index:number}){
 return <div className="vfl-open-vector"><MathFormulaBlock><MathFormulaStatic latex={`f_${index}`}/></MathFormulaBlock><div className="vfl-open-vector-cells" aria-label="特征向量的结构示意">{Array.from({length:8},(_,i)=>i===4?<Typography as="span" key={i} variant="bodySmall" tone="accent">…</Typography>:<span key={i} style={{opacity:.38+((i*3+index)%5)*.13}}/>)}</div></div>;
}

export function OpenIdentityPage(){
 return <ContentBlock className="vfl-open-page" headingLevel={1} title="从有限类别到开放身份" subtitle="人脸验证通过比较特征距离，判断两张照片是否属于同一身份。">
 <div className="vfl-open-body">
  <div className="vfl-open-main">
   <section className="vfl-open-fixed" aria-label="身份类别不断增加的动画，包含鲁迅及其本名周树人，其余姓名为虚构">
    <div className="vfl-open-panel-title"><Typography variant="h3" tone="accent">身份类别不断增加</Typography></div>
    <div className="vfl-open-animation-photo"><Portrait file="luxun-1930.jpg" label="鲁迅的历史照片"/></div>
    <div className="vfl-open-name-cloud" aria-hidden="true">{names.slice(0,9).map((name,i)=><div className={`vfl-open-flying-name ${i<2?'is-essential':''}`} key={name} style={{'--dx':`${(i%3-1)*118}px`,'--dy':`${(Math.floor(i/3)-1)*62}px`,'--rotation':`${(i%3-1)*6}deg`,'--delay':`${-i*.8}s`,'--duration':'7.2s'} as CSSProperties}><Typography as="span" variant="bodySmall" tone="inherit">{name}</Typography></div>)}</div>
   </section>

   <div className="vfl-open-transition"><Typography variant="h3" tone="warning">身份集合<br/>可以不断扩展</Typography><svg viewBox="0 0 210 90" aria-hidden="true"><defs><linearGradient id="vfl-open-arrow"><stop stopColor="#e7f0fd"/><stop offset="1" stopColor="#4e8cda"/></linearGradient></defs><path d="M8 26H133V5L199 45L133 85V64H8Z" fill="url(#vfl-open-arrow)"/></svg><Typography variant="bodySmall" tone="accent">由身份分类<br/>转向特征比较</Typography></div>

   <section className="vfl-open-verification" aria-label="开放身份任务：人脸验证">
    <div className="vfl-open-panel-title"><Typography variant="h3" tone="accent">人脸验证</Typography></div>
    <div className="vfl-open-pair"><div><Portrait file="luxun-1930.jpg" label="鲁迅第一张照片的正方形人脸特写"/><Typography variant="bodySmall" tone="accent">鲁迅 · 照片 1</Typography></div><div><Portrait file="luxun-1933.jpg" label="鲁迅第二张照片的正方形人脸特写"/><Typography variant="bodySmall" tone="accent">鲁迅 · 照片 2</Typography></div></div>
    <svg className="vfl-open-photo-links" viewBox="0 0 600 24" preserveAspectRatio="none" aria-hidden="true"><path d="M150 0V20M450 0V20" stroke="#7898c4" strokeWidth="2"/><path d="M144 15L150 22L156 15M444 15L450 22L456 15" fill="none" stroke="#7898c4" strokeWidth="2"/></svg>
    <div className="vfl-open-backbone"><Typography variant="h3" tone="accent">共享特征提取器</Typography><Typography variant="bodySmall" tone="muted">两张照片使用相同的网络参数</Typography></div>
    <div className="vfl-open-features"><div><span className="vfl-open-stem"/><Vector index={1}/></div><div><span className="vfl-open-stem"/><Vector index={2}/></div></div>
    <svg className="vfl-open-merge" viewBox="0 0 600 26" preserveAspectRatio="none" aria-hidden="true"><path d="M150 0V10Q150 15 155 15H445Q450 15 450 10V0M300 15V25" stroke="#7898c4" strokeWidth="2" fill="none"/></svg>
    <div className="vfl-open-distance"><Typography variant="h3" tone="accent">比较特征距离</Typography><MathFormulaBlock><MathFormulaStatic latex={String.raw`d(f_1,f_2)`}/></MathFormulaBlock></div>
   </section>
  </div>
  <div className="vfl-open-takeaway"><Typography variant="h3" tone="accent">身份可以不断增加，验证依据是特征之间的距离。</Typography></div>
 </div></ContentBlock>;
}
