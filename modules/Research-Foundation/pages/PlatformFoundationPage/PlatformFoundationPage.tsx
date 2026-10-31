import { BookOpen, FileText, Star, Users } from 'lucide-react';
import { ContentBlock, Button, Typography } from '../../../shared/react';
import outline from '../../outlines.json';
import { PlaybackBar, usePlayback } from '../../Playback';
import { ResearchPhone } from './ResearchPhone';
import './PlatformFoundationPage.css';

const steps=[
 {name:'发现论文',label:'内容展示',Icon:FileText,description:'从论文推荐流进入科研内容',detail:'已有科研信息服务平台与移动应用。'},
 {name:'阅读详情',label:'在线学习',Icon:BookOpen,description:'展开摘要与配图，组织阅读线索',detail:'把分散的信息组织成可以阅读和回看的内容。'},
 {name:'加入收藏',label:'持续使用',Icon:Star,description:'将感兴趣的论文留在个人收藏',detail:'收藏状态与手机中的论文操作同步。'},
 {name:'收藏回看',label:'用户反馈',Icon:Users,description:'回到我的收藏，继续阅读与记录',detail:'还可手动打开论文讨论，记录本次演示中的阅读问题。'},
];
export function PlatformFoundationPage(){
 const p=usePlayback(4,4500), step=steps[p.step];
 return <ContentBlock className="rf-page rf-platform" title={outline.pages[7].title}>
  <div className="rf-platform-main"><section className="rf-platform-story"><div className="rf-user-count"><Typography variant="display" className="rf-stat">6000+</Typography><Typography variant="h2">学习用户</Typography></div>
    <div className="rf-platform-steps">{steps.map(({name,Icon},i)=><Button key={name} active={p.step===i} aria-pressed={p.step===i} onClick={()=>p.go(i)}><Icon size={23}/><Typography as="span" variant="bodySmall" tone="inherit">{name}</Typography></Button>)}</div>
    <Typography key={p.step} className="rf-platform-line rf-fade" variant="body" tone="muted">{step.description}</Typography>
   </section><div className="rf-phone-area"><ResearchPhone key={p.revision} demoStep={p.step}/></div></div>
  <div className="rf-platform-footer"><Typography variant="bodySmall" tone="muted">材料统计 · 手机为本地演示</Typography><PlaybackBar playback={p} label="演示发现与收藏"/></div>
 </ContentBlock>;
}
