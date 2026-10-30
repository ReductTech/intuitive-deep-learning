import {useState} from 'react';
import {SiteHeader} from './SiteHeader';
import {requestSignIn} from './guest';
import './ReviewInbox.css';
import './Guest.css';

export function GuestFeaturePage({path}:{path:string}){
 const tab=new URLSearchParams(location.search).get('tab')||(path==='/course-creation'?'create':'mine');
 const [stage,setStage]=useState('待审核');
 const authoring=path.startsWith('/my-courses')||path==='/course-creation'||path.startsWith('/edit-deck');
 const creating=authoring&&(tab==='create'||path.includes('editor')||path.startsWith('/edit-deck'));
 const reviews=authoring&&(tab==='reviews'||path.includes('review'));
 const title=creating?'我要创建课程':reviews?'共创待审核':authoring?(tab==='workspaces'?'我参与的共创':'我的课程'):path==='/profile'?'个人信息':path==='/messages'?'我的消息':path==='/data'?'数据管理':'课程创作';
 return <div className="sd-library shuku-management"><SiteHeader section={authoring?'authoring':path==='/profile'?'profile':path==='/messages'?'messages':'courses'} user={null}/><main className="shuku-content"><div className="shuku-heading"><h1>{title}</h1></div><p className="shuku-guest-note">游客体验 · 可以浏览功能，登录后即可创建课程、参与共创。</p>
 {creating?<section className="shuku-create-panel"><form onSubmit={event=>{event.preventDefault();requestSignIn();}}><fieldset className="shuku-guest-fields" disabled><label>课程名称<input placeholder="你想讲清楚什么？"/></label><label>课程简介<textarea rows={3} placeholder="介绍这门课程的内容"/></label><label>课程类别<input placeholder="例如：人工智能"/></label><label>起始内容<select defaultValue="blank"><option value="blank">空白课件</option><option value="react">React／TSX 源码课程</option><option value="module">基于已有课程模块</option></select></label></fieldset><button className="shuku-primary">登录后开始创建</button></form></section>:reviews?<section className="review-inbox" aria-label="共创审核列表"><p className="review-intro">审核共创建议，通过后合并并发布课程版本。</p><div className="review-stage-bar"><div role="tablist" aria-label="审核阶段">{['待审核','待合并','待发版','全部'].map(label=><button key={label} role="tab" aria-selected={stage===label} onClick={()=>setStage(label)}>{label}</button>)}</div></div><div role="tabpanel" className="shuku-guest-empty"><p>登录后查看你管理课程的{stage==='全部'?'审核记录':stage+'事项'}。</p><button className="shuku-primary" onClick={requestSignIn}>登录后查看</button></div></section>:<section className="shuku-guest-empty"><p>{path==='/profile'?'管理个人资料和 GitHub 账号绑定。':path==='/messages'?'课程审核、共创建议和问题反馈的通知都会显示在这里。':path==='/data'?'此页面需要管理员账号。':tab==='workspaces'?'完善已有课程，预览修改效果，再提交共创建议。':'创建私有课程，完成后提交审核并公开发布。'}</p><div className="profile-actions"><button className="shuku-primary" onClick={requestSignIn}>登录后使用</button><a href="/">继续探索课程</a></div></section>}
 </main></div>;
}
