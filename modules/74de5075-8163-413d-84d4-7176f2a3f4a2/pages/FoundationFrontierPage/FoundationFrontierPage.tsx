import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useId } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import './FoundationFrontierPage.css';

export function FoundationFrontierPage() {
  const id = useId().replaceAll(':', '');
  return <ContentBlock shuku-edit-id="e-2132fb7e-0bff-477b-87ae-48501563a977" className="aipe-ff-page" headingLevel={1}
    title={outline.pages.find(page => page.id === '50670946-ab25-4a39-88e0-4a63b4d70945')!.title} subtitle="建立系统理解，持续更新认识" bodyClassName="aipe-ff-body">
    <div shuku-edit-id="e-1f32ca29-cfa8-4bf9-a51a-64c0d4a8a218" className="aipe-ff-map" role="group" aria-label="知识探索者同时需要系统掌握知识和持续追踪前沿，两者相互支撑">
      <svg shuku-edit-id="e-c5207afa-f03b-4e89-974e-f743c8d99fe9" className="aipe-ff-connections" viewBox="0 0 1538 690" aria-hidden="true">
        <defs shuku-edit-id="e-3c2cd744-a831-4adb-a769-31eed90b6c23">
          <marker shuku-edit-id="e-98e515f3-ff5c-4a9a-9fc1-8e28599e9a1b" id={`${id}-orange`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="2.6" markerHeight="2.6" orient="auto-start-reverse"><path shuku-edit-id="e-a0bc3e36-5174-4416-a483-fa703c86a096" d="M0 0L10 5L0 10Z" fill="#f07e47"/></marker>
          <marker shuku-edit-id="e-1a25b25e-4f67-4ad4-a783-be03bf1809d5" id={`${id}-blue`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="2.6" markerHeight="2.6" orient="auto-start-reverse"><path shuku-edit-id="e-c79d746d-ed65-4df2-888f-dc2c9c5fd530" d="M0 0L10 5L0 10Z" fill="#7494bd"/></marker>
          <marker shuku-edit-id="e-8ec6c4dd-23e5-4da6-a5e9-bfc24b13c838" id={`${id}-fine`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path shuku-edit-id="e-4ff6f844-ce3b-4ece-8a8f-edc3881ea93c" d="M0 0L10 5L0 10Z" fill="#7494bd"/></marker>
        </defs>
        <path shuku-edit-id="e-01ab9fbb-885b-4ca9-a920-1c2ee2f6a4d7" d="M430 274C555 260 605 116 750 116" stroke="#f07e47" strokeWidth="18" fill="none" markerEnd={`url(#${id}-orange)`}/>
        <path shuku-edit-id="e-3963832f-90cd-45b0-9673-a43fec5b8a40" d="M430 340C555 360 620 465 750 465" stroke="#7494bd" strokeWidth="18" fill="none" markerEnd={`url(#${id}-blue)`}/>
        <path shuku-edit-id="e-7561d3c0-4b8e-4213-ae29-6f5ad2a1261c" d="M1082 197C1123 241 1123 299 1082 345" stroke="#7494bd" strokeWidth="3" strokeDasharray="4 7" fill="none" markerStart={`url(#${id}-fine)`} markerEnd={`url(#${id}-fine)`}/>
      </svg>
      <div shuku-edit-id="e-3ff830ad-e8c4-4a39-bb92-f81a4e810f99" className="aipe-ff-hub"><Typography shuku-edit-id="e-8bb691ef-8c26-497f-83cd-4111369af877" as="h2" variant="h1" tone="inherit">知识<br shuku-edit-id="e-bb54200c-431d-48f6-bf16-b5afad7a1fbe"/>探索者</Typography></div>
      <Typography shuku-edit-id="e-e13c4756-2d14-4c30-953f-f816845a1638" as="p" variant="subtitle" tone="muted" className="aipe-ff-hub-caption">理解与应用</Typography>
      <img shuku-edit-id="e-c5094ee9-e8d3-442d-a217-116a34068fb6" className="aipe-ff-materials" src={moduleAssetUrl('images/foundation-frontier-materials-v2.png')}
        alt="研究论文与系统教材，分别承载前沿跟踪与知识体系学习" draggable={false}/>
      <section shuku-edit-id="e-0110e497-398b-4c55-af2d-bf920a1785b9" className="aipe-ff-branch aipe-ff-frontier">
        <Typography shuku-edit-id="e-6a83431f-2dd3-44b9-b9ac-65892fe8d488" as="h2" variant="h1" tone="inherit">持续追踪前沿</Typography>
        <div shuku-edit-id="e-05295b0c-faf4-41d8-bd1b-9517e5aaf63e" className="aipe-ff-details"><Typography shuku-edit-id="e-b8385a0a-2f5f-4dd1-b521-98c27ebf9daf" as="p" variant="body" tone="accent">关注新问题与新方法</Typography><Typography shuku-edit-id="e-96b45b0a-715e-4112-907b-b3a36e438fa6" as="p" variant="body" tone="accent">获取与目标相关的研究</Typography></div>
      </section>
      <Typography shuku-edit-id="e-08e8a3b5-7f87-419f-9781-c6e89234e646" as="p" variant="body" tone="muted" className="aipe-ff-relation">相互支撑，持续深化</Typography>
      <section shuku-edit-id="e-cd5dc9b7-078c-4763-ba5d-2fdcf423dcab" className="aipe-ff-branch aipe-ff-systematic">
        <Typography shuku-edit-id="e-c94760ca-365b-46eb-ae57-c8f68789fdc9" as="h2" variant="h1" tone="accent">系统掌握知识</Typography>
        <div shuku-edit-id="e-c89b646e-f121-4661-bf32-47f90f040780" className="aipe-ff-details"><Typography shuku-edit-id="e-36164840-0798-4d38-8e38-4087d7163085" as="p" variant="body" tone="accent">理解概念、方法与联系</Typography><Typography shuku-edit-id="e-05218c6a-6f52-4600-b02a-93176130dc6d" as="p" variant="body" tone="accent">形成可应用的知识体系</Typography></div>
      </section>
    </div>
  </ContentBlock>;
}
