import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { ArrowUpRight, Telescope, Target, MonitorSmartphone } from 'lucide-react';
import { Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import './ResearchRecommendationAppPage.css';
import { ResearchWebMonitor } from './ResearchWebMonitor';
import { ResearchAppPhone } from './ResearchAppPhone';

export function ResearchRecommendationAppPage(){
 return <section shuku-edit-id="e-df454d55-7557-4344-9029-256d7e1f39a1" className="research-app-page" aria-label="个性化论文推荐 APP">
  <a shuku-edit-id="e-af83f372-5c22-4b5a-bb74-2135f6d7aae9" className="ra-official-brand" href="https://www.reduct.cn/" target="_blank" rel="noreferrer" aria-label="减论科技官网"><img shuku-edit-id="e-12a31d73-3337-4b0f-b015-4164e41981db" src={moduleAssetUrl('images/recommendation-app/reduct-official-logo.png')} alt="减论科技"/></a>
  <div shuku-edit-id="e-01da2b0a-7a75-419b-9416-4aa9cd4a17d5" className="ra-platform-intro">
   <Typography shuku-edit-id="e-dbd8c423-ac57-440b-985c-60d7b3807312" as="h1" variant="display" tone="inherit">科研信息供给的<Typography shuku-edit-id="e-e9f9e089-df95-4d1d-8101-d42d88e2abb6" as="span" variant="display" tone="inherit">全平台解决方案</Typography></Typography>
   <Typography shuku-edit-id="e-8636ff1a-0ff5-4148-99e3-d984a78c802f" className="ra-platform-promise" variant="body" tone="muted">结合研究兴趣，发现值得深入阅读的论文</Typography>
  </div>
  <div shuku-edit-id="e-ab79ecf4-2df6-4708-ae7b-68b624cfb984" className="ra-platform-features">
   {[{Icon:Telescope,title:'发现前沿',detail:'追踪研究动态'},{Icon:Target,title:'兴趣推荐',detail:'匹配研究方向'},{Icon:MonitorSmartphone,title:'多端阅读',detail:'随时浏览收藏'}].map(({Icon,title,detail})=><div shuku-edit-id="e-01bc319b-68ba-4b01-8211-1b77c642c6e6" key={title}><Icon aria-hidden="true" strokeWidth={1.6}/><Typography shuku-edit-id="e-4d5f6a6b-3de0-4a8d-9cd5-5bdcaecac250" variant="body" tone="inherit">{title}</Typography><Typography shuku-edit-id="e-6ca4b9ea-929e-430e-8d9f-ba2aafb80c05" variant="bodySmall" tone="muted">{detail}</Typography></div>)}
  </div>
  <aside shuku-edit-id="e-7d5f2580-aa0c-40b9-a6cd-db9a7247ef26" className="ra-experience-entry" aria-label="扫码或访问减论官网体验">
   <a shuku-edit-id="e-f3b84cf7-f5e2-454a-a9b7-3c259a73197e" className="ra-experience-qr" href="https://www.reduct.cn/" target="_blank" rel="noreferrer" aria-label="打开减论官网"><img shuku-edit-id="e-fbe7057d-1c41-40e5-aa95-116679ff8b22" src={moduleAssetUrl('images/recommendation-app/reduct-site-qr.svg')} width="148" height="148" alt="扫码访问 https://www.reduct.cn/"/></a>
   <div shuku-edit-id="e-9e0069fa-2f8d-439f-a1e4-5f5c876fd047"><Typography shuku-edit-id="e-b2f621cc-f790-445e-b884-c005ed065548" as="p" variant="body" tone="accent">扫码体验</Typography><Typography shuku-edit-id="e-a2fea4f8-f804-409f-ad14-fa80f9e53c81" as="a" variant="bodySmall" tone="accent" href="https://www.reduct.cn/" target="_blank" rel="noreferrer">www.reduct.cn <ArrowUpRight aria-hidden="true"/></Typography></div>
  </aside>
  <ResearchWebMonitor/>
  <ResearchAppPhone autoPlaySprout/>
 </section>
}
