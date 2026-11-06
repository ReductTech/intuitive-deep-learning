import { ArrowUpRight, Telescope, Target, MonitorSmartphone } from 'lucide-react';
import { Typography, moduleAssetUrl } from '../../../shared/react';
import outline from '../../outlines.json';
import './ResearchRecommendationAppPage.css';
import { ResearchWebMonitor } from './ResearchWebMonitor';
import { ResearchAppPhone } from './ResearchAppPhone';

export function ResearchRecommendationAppPage(){
 return <section className="research-app-page" aria-label="个性化论文推荐 APP">
  <a className="ra-official-brand" href="https://www.reduct.cn/" target="_blank" rel="noreferrer" aria-label="减论科技官网"><img src={moduleAssetUrl(outline.moduleIdentity.id,'images/recommendation-app/reduct-official-logo.png')} alt="减论科技"/></a>
  <div className="ra-platform-intro">
   <Typography as="h1" variant="display" tone="inherit">科研信息供给的<Typography as="span" variant="display" tone="inherit">全平台解决方案</Typography></Typography>
   <Typography className="ra-platform-promise" variant="body" tone="muted">结合研究兴趣，发现值得深入阅读的论文</Typography>
  </div>
  <div className="ra-platform-features">
   {[{Icon:Telescope,title:'发现前沿',detail:'追踪研究动态'},{Icon:Target,title:'兴趣推荐',detail:'匹配研究方向'},{Icon:MonitorSmartphone,title:'多端阅读',detail:'随时浏览收藏'}].map(({Icon,title,detail})=><div key={title}><Icon aria-hidden="true" strokeWidth={1.6}/><Typography variant="body" tone="inherit">{title}</Typography><Typography variant="bodySmall" tone="muted">{detail}</Typography></div>)}
  </div>
  <aside className="ra-experience-entry" aria-label="扫码或访问减论官网体验">
   <a className="ra-experience-qr" href="https://www.reduct.cn/" target="_blank" rel="noreferrer" aria-label="打开减论官网"><img src={moduleAssetUrl(outline.moduleIdentity.id,'images/recommendation-app/reduct-site-qr.svg')} width="148" height="148" alt="扫码访问 https://www.reduct.cn/"/></a>
   <div><Typography as="p" variant="body" tone="accent">扫码体验</Typography><Typography as="a" variant="bodySmall" tone="accent" href="https://www.reduct.cn/" target="_blank" rel="noreferrer">www.reduct.cn <ArrowUpRight aria-hidden="true"/></Typography></div>
  </aside>
  <ResearchWebMonitor/>
  <ResearchAppPhone autoPlaySprout/>
 </section>
}
