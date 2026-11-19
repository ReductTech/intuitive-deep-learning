import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useId } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import './FoundationFrontierPage.css';

export function FoundationFrontierPage() {
  const id = useId().replaceAll(':', '');
  return <ContentBlock shuku-edit-id="e-a0b5db58-96ee-4cd2-88c6-804cc098d4e9" className="aipe-ff-page" headingLevel={1}
    title={outline.pages.find(page => page.id === 'd4992bfd-162d-4646-9d80-66ecbff8b190')!.title} subtitle="建立系统理解，持续更新认识" bodyClassName="aipe-ff-body">
    <div shuku-edit-id="e-d9c09598-b3b1-4ea0-97e5-1151604a05e6" className="aipe-ff-map" role="group" aria-label="知识探索者同时需要系统掌握知识和持续追踪前沿，两者相互支撑">
      <svg shuku-edit-id="e-91183e0f-4046-4132-8662-4f10555a0d18" className="aipe-ff-connections" viewBox="0 0 1538 690" aria-hidden="true">
        <defs shuku-edit-id="e-c040d895-eff8-4199-9ad3-76e217a10a8a">
          <marker shuku-edit-id="e-d341ed42-c739-4723-bf0a-03f895595231" id={`${id}-orange`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="2.6" markerHeight="2.6" orient="auto-start-reverse"><path shuku-edit-id="e-ca69cf39-a2ca-4bcd-b15e-06bf7d1198ea" d="M0 0L10 5L0 10Z" fill="#f07e47"/></marker>
          <marker shuku-edit-id="e-6e430a69-6885-4864-928f-233fadf1a942" id={`${id}-blue`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="2.6" markerHeight="2.6" orient="auto-start-reverse"><path shuku-edit-id="e-755abe98-5075-449d-8fd1-0a860d2305ec" d="M0 0L10 5L0 10Z" fill="#7494bd"/></marker>
          <marker shuku-edit-id="e-970580d5-32a7-4880-b31c-338460227fe3" id={`${id}-fine`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path shuku-edit-id="e-f39ea143-80f1-4351-823e-06bc77556df4" d="M0 0L10 5L0 10Z" fill="#7494bd"/></marker>
        </defs>
        <path shuku-edit-id="e-a6c29bd2-6ccf-4804-a001-652a9dcfbd2b" d="M430 274C555 260 605 116 750 116" stroke="#f07e47" strokeWidth="18" fill="none" markerEnd={`url(#${id}-orange)`}/>
        <path shuku-edit-id="e-9c78574c-c940-45cc-b487-6025a35eaa50" d="M430 340C555 360 620 465 750 465" stroke="#7494bd" strokeWidth="18" fill="none" markerEnd={`url(#${id}-blue)`}/>
        <path shuku-edit-id="e-26a71d05-d27c-4882-9bbe-ad316a974cb1" d="M1082 197C1123 241 1123 299 1082 345" stroke="#7494bd" strokeWidth="3" strokeDasharray="4 7" fill="none" markerStart={`url(#${id}-fine)`} markerEnd={`url(#${id}-fine)`}/>
      </svg>
      <div shuku-edit-id="e-bf210764-2a10-49fd-bd38-8225f5ebd9c6" className="aipe-ff-hub"><Typography shuku-edit-id="e-618dd953-b307-4d1b-a7fc-6c32ceecd906" as="h2" variant="h1" tone="inherit">知识<br shuku-edit-id="e-a8db5be4-6606-4611-b478-c0bd1183c7a1"/>探索者</Typography></div>
      <Typography shuku-edit-id="e-c086291a-c89b-4b33-9af1-27545c483c3e" as="p" variant="subtitle" tone="muted" className="aipe-ff-hub-caption">理解与应用</Typography>
      <img shuku-edit-id="e-ee250e0b-07f9-4441-8730-ae93fbb634ef" className="aipe-ff-materials" src={moduleAssetUrl("images/foundation-frontier-materials-v2.webp")}
        alt="研究论文与系统教材，分别承载前沿跟踪与知识体系学习" draggable={false}/>
      <section shuku-edit-id="e-53f7ec7c-5ceb-465e-a6b7-0cfd38cdfc68" className="aipe-ff-branch aipe-ff-frontier">
        <Typography shuku-edit-id="e-76563a70-fa16-4455-8b6b-f93197d13632" as="h2" variant="h1" tone="inherit">持续追踪前沿</Typography>
        <div shuku-edit-id="e-f41aae78-447d-497f-b5d9-91db3a5fdae6" className="aipe-ff-details"><Typography shuku-edit-id="e-98e9f14b-d7e7-4e27-8170-5111d7345b61" as="p" variant="body" tone="accent">关注新问题与新方法</Typography><Typography shuku-edit-id="e-d667f0b4-f961-41dc-9db1-b2dd4ef6eee5" as="p" variant="body" tone="accent">获取与目标相关的研究</Typography></div>
      </section>
      <Typography shuku-edit-id="e-833cf775-4f0a-4137-9366-4f74a1a86a42" as="p" variant="body" tone="muted" className="aipe-ff-relation">相互支撑，持续深化</Typography>
      <section shuku-edit-id="e-e9bf5754-c081-48f6-8e7b-65e5b9887027" className="aipe-ff-branch aipe-ff-systematic">
        <Typography shuku-edit-id="e-6dc13b60-f7f2-42ed-9131-9c53ad8425b5" as="h2" variant="h1" tone="accent">系统掌握知识</Typography>
        <div shuku-edit-id="e-1a26b90f-b52a-42fd-95d1-d88963b14391" className="aipe-ff-details"><Typography shuku-edit-id="e-2735bf69-c67b-4a03-a11f-0956f67a8c08" as="p" variant="body" tone="accent">理解概念、方法与联系</Typography><Typography shuku-edit-id="e-6f336336-3953-45ca-97f3-7616a0e68a9d" as="p" variant="body" tone="accent">形成可应用的知识体系</Typography></div>
      </section>
    </div>
  </ContentBlock>;
}
