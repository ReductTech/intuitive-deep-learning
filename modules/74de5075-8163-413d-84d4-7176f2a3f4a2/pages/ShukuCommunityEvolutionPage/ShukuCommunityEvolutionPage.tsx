import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import './ShukuCommunityEvolutionPage.css';

const stages = [
  { id: 'feedback', title: '使用与反馈', description: '发现问题，提出新需求', image: "feedback.webp" },
  { id: 'cocreate', title: '师生共创', description: '补充案例，改进讲解', image: "cocreate.webp" },
  { id: 'review', title: '审核改进', description: '核验内容，共同完善', image: "review.webp" },
  { id: 'publish', title: '发布新版', description: '更新课程，供大家使用', image: "publish.webp" },
] as const;
const asset = (name: string) => moduleAssetUrl(`images/shuku-community/${name}`);

export function ShukuCommunityEvolutionPage() {
  return <ContentBlock shuku-edit-id="e-d41bce19-bfb2-41c2-affb-2737b69b6964" title="Shuku（术库）：让课程在共创中持续进化，形成知识循环"
    subtitle="汇集实践中的发现与创造，共同打磨交互直觉的知识呈现"
    headingLevel={1} className="aipe-shuku-page" bodyClassName="aipe-shuku-body">
    <div shuku-edit-id="e-5f5319be-854d-4504-b8e1-ac376dfbdef4" className="aipe-shuku-cycle" role="group" aria-label="使用与反馈、师生共创、审核改进、发布新版，再次进入教学使用">
      <div shuku-edit-id="e-df755dab-e6f4-46be-9910-627a2ed53db4" className="aipe-shuku-panel aipe-shuku-panel-feedback" aria-hidden="true"/>
      <div shuku-edit-id="e-50f76ee9-4e81-41ee-a6a1-78952c97f3bf" className="aipe-shuku-panel aipe-shuku-panel-cocreate" aria-hidden="true"/>
      <div shuku-edit-id="e-0f4911f0-22ef-4c5d-8eba-f9d2ea5ae373" className="aipe-shuku-panel aipe-shuku-panel-review" aria-hidden="true"/>
      <div shuku-edit-id="e-0e70edc4-8276-4c96-8652-f190bad3a42c" className="aipe-shuku-panel aipe-shuku-panel-publish" aria-hidden="true"/>
      <div shuku-edit-id="e-94662e59-1256-4229-9839-b39685011405" className="aipe-shuku-center-space" aria-hidden="true"/>
      <svg shuku-edit-id="e-3baee38d-ccec-42dd-ac96-fc08c9138ed6" className="aipe-shuku-arrows" viewBox="0 0 1540 600" preserveAspectRatio="none" aria-hidden="true">
        <defs shuku-edit-id="e-d298a5e4-15c9-4052-b395-4c71bd18a314"><marker shuku-edit-id="e-08b58d28-482a-4d1f-9243-d9f9252e6279" id="aipe-shuku-cycle-arrow" markerUnits="userSpaceOnUse" markerWidth="18" markerHeight="18" viewBox="0 0 12 12" refX="10" refY="6" orient="auto"><path shuku-edit-id="e-8696f7b2-dad6-455b-97d7-95b2013f686e" d="M2 2 L10 6 L2 10" fill="none" stroke="#eea06e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></marker></defs>
        <path shuku-edit-id="e-299ea1b0-3b0d-4078-8779-ae10ce7db516" d="M662 75 Q770 12 868 66" />
        <path shuku-edit-id="e-6d45689d-b61e-4749-8439-2453acf2a84a" d="M1082 246 Q1165 300 1100 360" />
        <path shuku-edit-id="e-0f9cd98e-577b-4223-b25e-abd9b7f0be08" d="M878 514 Q770 580 666 528" />
        <path shuku-edit-id="e-acfca1d4-4fa4-4d2a-99a0-52dfcf7d50f4" d="M443 365 Q370 305 433 246" />
      </svg>
      <ol shuku-edit-id="e-ffeea78e-e511-4370-abca-01bf9f84be43" className="aipe-shuku-stages">
        {stages.map(stage => <li shuku-edit-id="e-1e18934f-9517-47f4-bd7c-1eec6f0e9249" key={stage.id} className={`aipe-shuku-stage aipe-shuku-stage-${stage.id}`}>
          <img shuku-edit-id="e-be72733e-9310-434f-987e-87687a323005" src={asset(stage.image)} alt="" aria-hidden="true" draggable={false}/>
          <div shuku-edit-id="e-bb335fa9-1ecc-4682-abb8-a85b8675f7e7" className="aipe-shuku-stage-copy">
            <Typography shuku-edit-id="e-4cc0850c-cb90-4f7e-a576-027a113682ea" as="h2" variant="h3" tone="accent">{stage.title}</Typography>
            <Typography shuku-edit-id="e-bb569da7-f82b-4acc-beaf-8e9825e038cd" as="p" variant="bodySmall" tone="muted">{stage.description}</Typography>
          </div>
        </li>)}
      </ol>
      <div shuku-edit-id="e-1f4e8f26-d769-49eb-9e82-c72e389547a8" className="aipe-shuku-course">
        <Typography shuku-edit-id="e-b397982a-b4e8-4f12-b74f-fe05c223cf03" as="p" variant="bodySmall" tone="accent" className="aipe-shuku-course-label">共同维护的课程</Typography>
        <div shuku-edit-id="e-89765f61-65aa-4df9-927c-5ce3f31650fd" className="aipe-shuku-browser" aria-label="可交互课程内容示意">
          <div shuku-edit-id="e-30567ce5-2dfa-4745-8232-39d608dc26e2" className="aipe-shuku-browser-chrome" aria-hidden="true"><i shuku-edit-id="e-3006a7bd-19c8-4586-bb25-80f37d5b738e"/><i shuku-edit-id="e-9d62e7cb-2cc7-49f9-84e4-2dac26a554d6"/><i shuku-edit-id="e-08fadfa4-c6cf-4420-a553-737ed3b54dee"/></div>
          <svg shuku-edit-id="e-b57aa653-0fa6-4948-a5ff-cd810bf79a1f" viewBox="0 0 440 210" role="img" aria-label="互动学习材料：概念关系、讲解与交互滑杆">
            <g shuku-edit-id="e-dd5c90ec-97de-40d6-9bcc-352466f3a0d0" stroke="#bccfe8" strokeWidth="7"><path shuku-edit-id="e-671ffce0-7f78-4ae7-a0a9-ff49b0de0415" d="M75 154L133 57L193 154Z" fill="none"/></g>
            <g shuku-edit-id="e-e948c035-a9f1-4985-bd5e-a89bb4a52a87" stroke="#fff" strokeWidth="5"><circle shuku-edit-id="e-36ea7601-8706-4612-aea8-78d0fa04ae8b" cx="133" cy="57" r="29" fill="#ff934c"/><circle shuku-edit-id="e-2fc0ff44-de14-4608-bd40-ad704380b59b" cx="75" cy="154" r="29" fill="#559aef"/><circle shuku-edit-id="e-a6b7240a-04e8-4218-a7e6-d4d66ed07ec7" cx="193" cy="154" r="29" fill="#5bb8c3"/></g>
            <g shuku-edit-id="e-120ef848-6269-48f0-98da-b81231a32c76" stroke="#bdcee5" strokeWidth="12" strokeLinecap="round"><path shuku-edit-id="e-307eed32-f86d-41c3-a41f-2c040618d31f" d="M258 58H399M258 87H373M258 116H399"/></g>
            <path shuku-edit-id="e-6e8efc95-0f2f-420e-adf9-a5a5426be557" d="M258 165H399" stroke="#d1e4fa" strokeWidth="10" strokeLinecap="round"/>
            <path shuku-edit-id="e-d874b231-6f99-4857-92b2-1ecc234b7d4b" d="M258 165H330" stroke="#61a9f3" strokeWidth="10" strokeLinecap="round"/>
            <circle shuku-edit-id="e-8fd8709d-3d06-4c54-9f48-c7b294334d8c" cx="330" cy="165" r="12" fill="#4d9bec" stroke="#fff" strokeWidth="3"/>
          </svg>
        </div>
      </div>
    </div>
    <div shuku-edit-id="e-7dc36093-d634-4e2e-8ea5-10a7f73cbcf8" className="aipe-shuku-conclusion">
      <Typography shuku-edit-id="e-30f1086d-6933-4d7b-8135-5e7f13a4de61" as="p" variant="h3" tone="accent">一个人完成一门课程，<span shuku-edit-id="e-efd4669a-cf2a-4def-86a9-3f1e8cf2037e">一群人让它持续生长。</span></Typography>
    </div>
  </ContentBlock>;
}
