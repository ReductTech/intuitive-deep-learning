import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import './ShukuCommunityEvolutionPage.css';

const stages = [
  { id: 'feedback', title: '使用与反馈', description: '发现问题，提出新需求', image: 'feedback.jpg' },
  { id: 'cocreate', title: '师生共创', description: '补充案例，改进讲解', image: 'cocreate.jpg' },
  { id: 'review', title: '审核改进', description: '核验内容，共同完善', image: 'review.jpg' },
  { id: 'publish', title: '发布新版', description: '更新课程，供大家使用', image: 'publish.jpg' },
] as const;
const asset = (name: string) => moduleAssetUrl(`images/shuku-community/${name}`);

export function ShukuCommunityEvolutionPage() {
  return <ContentBlock shuku-edit-id="e-232dbe25-779a-4eef-8bdb-ae20edb161c6" title="Shuku（术库）：让课程在共创中持续进化，形成知识循环"
    subtitle="汇集实践中的发现与创造，共同打磨交互直觉的知识呈现"
    headingLevel={1} className="aipe-shuku-page" bodyClassName="aipe-shuku-body">
    <div shuku-edit-id="e-21f0a8d0-307f-483e-98fb-c68e75567159" className="aipe-shuku-cycle" role="group" aria-label="使用与反馈、师生共创、审核改进、发布新版，再次进入教学使用">
      <div shuku-edit-id="e-d01fe5eb-7e15-4038-85fe-37ae59a5f09d" className="aipe-shuku-panel aipe-shuku-panel-feedback" aria-hidden="true"/>
      <div shuku-edit-id="e-b1d1ddf3-99df-4dcd-a951-dee0df2009d6" className="aipe-shuku-panel aipe-shuku-panel-cocreate" aria-hidden="true"/>
      <div shuku-edit-id="e-6dc6b3e2-c0fc-4e91-9414-43959c4b6775" className="aipe-shuku-panel aipe-shuku-panel-review" aria-hidden="true"/>
      <div shuku-edit-id="e-4b3ab820-97f8-4d27-b9f5-ba13b7d1b26d" className="aipe-shuku-panel aipe-shuku-panel-publish" aria-hidden="true"/>
      <div shuku-edit-id="e-7b4810f4-1ebc-4175-a35f-b9a916f148dc" className="aipe-shuku-center-space" aria-hidden="true"/>
      <svg shuku-edit-id="e-6c2cd38d-bb30-4fe7-affd-5126e66078ed" className="aipe-shuku-arrows" viewBox="0 0 1540 600" preserveAspectRatio="none" aria-hidden="true">
        <defs shuku-edit-id="e-62d19c66-bc12-44ac-839c-880f135022d5"><marker shuku-edit-id="e-e7525b20-96be-49f0-a444-1b6aafc489d3" id="aipe-shuku-cycle-arrow" markerUnits="userSpaceOnUse" markerWidth="18" markerHeight="18" viewBox="0 0 12 12" refX="10" refY="6" orient="auto"><path shuku-edit-id="e-f002aec6-a53c-4ca1-8b20-7166b5123eba" d="M2 2 L10 6 L2 10" fill="none" stroke="#eea06e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></marker></defs>
        <path shuku-edit-id="e-9a94bb0c-2283-4000-8002-37137309e416" d="M662 75 Q770 12 868 66" />
        <path shuku-edit-id="e-aa24daa9-af7f-442b-9797-23abb14a1aff" d="M1082 246 Q1165 300 1100 360" />
        <path shuku-edit-id="e-6220fc17-b637-47e1-b75d-d819dab05d72" d="M878 514 Q770 580 666 528" />
        <path shuku-edit-id="e-2535fdf8-fda1-405f-83a6-36c40fc95c3b" d="M443 365 Q370 305 433 246" />
      </svg>
      <ol shuku-edit-id="e-de01192b-b2ea-44e7-be2a-f36434504802" className="aipe-shuku-stages">
        {stages.map(stage => <li shuku-edit-id="e-8e83337a-387b-4e32-9bce-8f23aafc3521" key={stage.id} className={`aipe-shuku-stage aipe-shuku-stage-${stage.id}`}>
          <img shuku-edit-id="e-23873a0e-b8fe-4822-8217-548cb4189661" src={asset(stage.image)} alt="" aria-hidden="true" draggable={false}/>
          <div shuku-edit-id="e-541c8cfd-25b9-40e2-8d08-c923f1e9e0fe" className="aipe-shuku-stage-copy">
            <Typography shuku-edit-id="e-e03e6c5b-36f7-4a9a-aea1-2cf24eefcaf2" as="h2" variant="h3" tone="accent">{stage.title}</Typography>
            <Typography shuku-edit-id="e-84119a9b-2cc9-4520-b0ab-bb80776509e8" as="p" variant="bodySmall" tone="muted">{stage.description}</Typography>
          </div>
        </li>)}
      </ol>
      <div shuku-edit-id="e-e0249182-1288-4c51-a3af-a8e6cf4bcfff" className="aipe-shuku-course">
        <Typography shuku-edit-id="e-714b8304-4199-4a42-a574-4393d5f7d9a5" as="p" variant="bodySmall" tone="accent" className="aipe-shuku-course-label">共同维护的课程</Typography>
        <div shuku-edit-id="e-689bab43-40a1-420e-94d0-7f846f0a1067" className="aipe-shuku-browser" aria-label="可交互课程内容示意">
          <div shuku-edit-id="e-f96a1476-f18d-488c-b459-6d682ad24920" className="aipe-shuku-browser-chrome" aria-hidden="true"><i shuku-edit-id="e-e5632e5d-d84b-40bb-a158-10a709b594e2"/><i shuku-edit-id="e-214219fa-f535-49d0-84d4-64d87ba0c3ba"/><i shuku-edit-id="e-ddfe8917-f92c-4acd-98d6-2a23847669bd"/></div>
          <svg shuku-edit-id="e-df255df2-1a5e-4647-9e70-e578b7b73581" viewBox="0 0 440 210" role="img" aria-label="互动学习材料：概念关系、讲解与交互滑杆">
            <g shuku-edit-id="e-796f4378-f2bc-438d-a9cc-4515e094fcaf" stroke="#bccfe8" strokeWidth="7"><path shuku-edit-id="e-006b60ad-3003-4a10-a5d8-a0fd2b16e3ed" d="M75 154L133 57L193 154Z" fill="none"/></g>
            <g shuku-edit-id="e-47ec5aab-ec91-4b54-9c83-f9494ae84991" stroke="#fff" strokeWidth="5"><circle shuku-edit-id="e-770d30f1-fd6a-4d7a-86e7-162fa0e10b54" cx="133" cy="57" r="29" fill="#ff934c"/><circle shuku-edit-id="e-de52a203-a901-4667-806e-f5579cf26e42" cx="75" cy="154" r="29" fill="#559aef"/><circle shuku-edit-id="e-bf59de0e-08ad-438f-8ac8-c8d3b9eca20f" cx="193" cy="154" r="29" fill="#5bb8c3"/></g>
            <g shuku-edit-id="e-fd068c94-9739-4b00-8463-a5b2b3de570c" stroke="#bdcee5" strokeWidth="12" strokeLinecap="round"><path shuku-edit-id="e-0d6d99b2-38af-4f9c-89f0-6e151509fed0" d="M258 58H399M258 87H373M258 116H399"/></g>
            <path shuku-edit-id="e-ff691576-6d2d-44f8-b37f-74a276d37094" d="M258 165H399" stroke="#d1e4fa" strokeWidth="10" strokeLinecap="round"/>
            <path shuku-edit-id="e-85ba60b3-0b34-4a58-81ae-a73d8759862b" d="M258 165H330" stroke="#61a9f3" strokeWidth="10" strokeLinecap="round"/>
            <circle shuku-edit-id="e-b596750b-8fdd-4ca6-8de1-b83880648731" cx="330" cy="165" r="12" fill="#4d9bec" stroke="#fff" strokeWidth="3"/>
          </svg>
        </div>
      </div>
    </div>
    <div shuku-edit-id="e-2ac3a320-d86a-478a-9d5e-4fc87ee046b6" className="aipe-shuku-conclusion">
      <Typography shuku-edit-id="e-fce240d6-673f-4b51-81ff-041e012299a3" as="p" variant="h3" tone="accent">一个人完成一门课程，<span shuku-edit-id="e-75c35a41-63ab-4b8c-b67e-064a3f302a49">一群人让它持续生长。</span></Typography>
    </div>
  </ContentBlock>;
}
