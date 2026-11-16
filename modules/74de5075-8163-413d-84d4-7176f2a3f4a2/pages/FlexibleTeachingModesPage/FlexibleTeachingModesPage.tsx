import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import './FlexibleTeachingModesPage.css';

const illustration = (name: string) => moduleAssetUrl(
  `images/teaching-mode/${name}-cartoon-v1.jpg`,
);

export function FlexibleTeachingModesPage() {
  return <ContentBlock shuku-edit-id="e-e9c40612-7dec-4340-9928-c0e47566a5d9"
    title="推荐授课模式"
    subtitle="上半节教师讲授，下半节小组共创与讲解"
    headingLevel={1}
    className="aipe-teaching-mode-page"
    bodyClassName="aipe-teaching-mode-body"
  >
    <section shuku-edit-id="e-9a6a5415-aacc-4463-bf82-85c0e375e4a0" className="aipe-teaching-half aipe-teaching-half--lecture" aria-labelledby="aipe-teaching-lecture-title">
      <header shuku-edit-id="e-1cffb6f3-64b0-435d-b379-c95280a4f350" className="aipe-teaching-half-heading">
        <Typography shuku-edit-id="e-72e9c60d-9f84-40de-9205-7eebf08011ca" as="p" variant="bodySmall" tone="inherit" className="aipe-teaching-half-label">上半节</Typography>
        <Typography shuku-edit-id="e-fd1bf720-0ecc-487f-bf17-7b87d2d1d175" as="h2" id="aipe-teaching-lecture-title" variant="h3" tone="accent">教师借助交互直觉讲授知识</Typography>
      </header>
      <figure shuku-edit-id="e-458c42bc-1f08-40d5-bb73-8dba1ab0810d" className="aipe-teaching-half-illustration">
        <img shuku-edit-id="e-efed74af-96d8-4b47-b1b4-b57eba2cd0a3" src={illustration('interactive-classroom')}
          alt="卡通课堂：教师指向交互式知识呈现中的概念关系图，学生面向屏幕听讲。"
          draggable={false}/>
      </figure>
      <div shuku-edit-id="e-8b77dbef-edca-4d67-ba73-5ea1bbb58d79" className="aipe-teaching-half-summary">
        <Typography shuku-edit-id="e-08009dbb-e332-45d7-ad19-8bed4a3335f2" as="p" variant="body" tone="accent">讲清知识点与关键方法</Typography>
        <Typography shuku-edit-id="e-ecef0be2-25f8-4424-b39a-7cab2031fcb3" as="p" variant="bodySmall" tone="muted">结合交互演示，帮助学生理解</Typography>
      </div>
    </section>
    <section shuku-edit-id="e-76c3db22-372d-4c00-8dbb-0c845310350c" className="aipe-teaching-half aipe-teaching-half--cocreation" aria-labelledby="aipe-teaching-cocreation-title">
      <header shuku-edit-id="e-81ee9c72-d0af-49aa-b41a-ae319a42ca41" className="aipe-teaching-half-heading">
        <Typography shuku-edit-id="e-13c91b19-59fb-4f26-b827-a327136286b4" as="p" variant="bodySmall" tone="inherit" className="aipe-teaching-half-label">下半节</Typography>
        <Typography shuku-edit-id="e-d8c74560-29be-44c4-8aa4-a2b2c24f265d" as="h2" id="aipe-teaching-cocreation-title" variant="h3" tone="accent">小组共创，代表讲解，知识进化</Typography>
      </header>
      <figure shuku-edit-id="e-d01cbd63-ca4b-4544-8c03-6f081e6fca0d" className="aipe-teaching-half-illustration">
        <img shuku-edit-id="e-bbede1e4-947d-4b5c-86f8-75d882fff191" src={illustration('group-cocreation')}
          alt="卡通课堂：学生小组共同讨论和改进交互式知识呈现，随后选出代表向全班讲解，教师在旁倾听。"
          draggable={false}/>
      </figure>
      <div shuku-edit-id="e-08848dde-146e-4e0b-ac6d-379e599cc099" className="aipe-teaching-half-summary">
        <Typography shuku-edit-id="e-f20b7d3b-26d0-496d-ae7c-75ff7068b361" as="p" variant="bodySmall" tone="accent">理解知识 → 分组共创 → 代表讲解 → 知识进化</Typography>
        <Typography shuku-edit-id="e-8e7ecf26-b166-4c6d-aa2f-26e63d3e55e6" as="p" variant="bodySmall" tone="muted">把自己的理解讲清楚，优秀创作更新下一代课程体系</Typography>
      </div>
    </section>
  </ContentBlock>;
}

