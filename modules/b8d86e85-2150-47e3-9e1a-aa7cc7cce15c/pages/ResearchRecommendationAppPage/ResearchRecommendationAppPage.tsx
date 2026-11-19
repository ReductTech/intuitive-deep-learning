import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { ArrowUpRight, Telescope, Target, MonitorSmartphone } from 'lucide-react';
import { Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import './ResearchRecommendationAppPage.css';
import { ResearchWebMonitor } from './ResearchWebMonitor';
import { ResearchAppPhone } from './ResearchAppPhone';

export function ResearchRecommendationAppPage(){
 return <section shuku-edit-id="e-b40f32fc-4d27-4473-b09c-6485fd4880b6" className="research-app-page" aria-label="个性化论文推荐 APP">
  <a shuku-edit-id="e-5d80dea7-b2fc-40fa-ac77-31d32c227f6d" className="ra-official-brand" href="https://www.reduct.cn/" target="_blank" rel="noreferrer" aria-label="减论科技官网"><img shuku-edit-id="e-a2a62abd-1d76-4231-8f4f-c89439b323e2" src={moduleAssetUrl("images/recommendation-app/reduct-official-logo.webp")} alt="减论科技"/></a>
  <div shuku-edit-id="e-20f7eeeb-fcc8-4391-8fef-630afbad69f1" className="ra-platform-intro">
   <Typography shuku-edit-id="e-71eef676-9427-4515-8d68-71306835262b" as="h1" variant="display" tone="inherit">科研信息供给的<Typography shuku-edit-id="e-0df79c24-7793-4e9a-bf65-279b3b977de3" as="span" variant="display" tone="inherit">全平台解决方案</Typography></Typography>
   <Typography shuku-edit-id="e-a49092e1-f95e-4c7a-bee8-097bd00b82fb" className="ra-platform-promise" variant="body" tone="muted">结合研究兴趣，发现值得深入阅读的论文</Typography>
  </div>
  <div shuku-edit-id="e-9789f931-1a49-49f0-8608-51a6591719fb" className="ra-platform-features">
   {[{Icon:Telescope,title:'发现前沿',detail:'追踪研究动态'},{Icon:Target,title:'兴趣推荐',detail:'匹配研究方向'},{Icon:MonitorSmartphone,title:'多端阅读',detail:'随时浏览收藏'}].map(({Icon,title,detail})=><div shuku-edit-id="e-a50436bd-b638-4afe-bb4f-79dca424cd60" key={title}><Icon aria-hidden="true" strokeWidth={1.6}/><Typography shuku-edit-id="e-ca981935-7d19-44e4-88b9-cacde6b66d1d" variant="body" tone="inherit">{title}</Typography><Typography shuku-edit-id="e-01e65c9e-1d2a-4c2d-a556-94f25b7a0ff5" variant="bodySmall" tone="muted">{detail}</Typography></div>)}
  </div>
  <aside shuku-edit-id="e-254a4d33-01ed-4e75-a9d3-deee80ddb8e6" className="ra-experience-entry" aria-label="扫码或访问减论官网体验">
   <a shuku-edit-id="e-79743656-cede-4282-b3d5-654424eb8893" className="ra-experience-qr" href="https://www.reduct.cn/" target="_blank" rel="noreferrer" aria-label="打开减论官网"><img shuku-edit-id="e-d14a829b-50fc-4ed1-ab1c-ac6a748b1acf" src={moduleAssetUrl('images/recommendation-app/reduct-site-qr.svg')} width="148" height="148" alt="扫码访问 https://www.reduct.cn/"/></a>
   <div shuku-edit-id="e-6ef2c38a-c144-47c5-a19b-87fef6d7d280"><Typography shuku-edit-id="e-e14e3acc-d09c-4658-85b2-dd43ece40c7d" as="p" variant="body" tone="accent">扫码体验</Typography><Typography shuku-edit-id="e-1af38c1a-dc1e-4a2a-9c32-860d11f9017e" as="a" variant="bodySmall" tone="accent" href="https://www.reduct.cn/" target="_blank" rel="noreferrer">www.reduct.cn <ArrowUpRight aria-hidden="true"/></Typography></div>
  </aside>
  <ResearchWebMonitor/>
  <ResearchAppPhone autoPlaySprout/>
 </section>
}
