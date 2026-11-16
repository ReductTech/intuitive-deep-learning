import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import './FlexibleTeachingModesPage.css';

const illustration = (name: string) => moduleAssetUrl(
  `images/teaching-mode/${name}-cartoon-v1.jpg`,
);

export function FlexibleTeachingModesPage() {
  return <ContentBlock shuku-edit-id="e-7b381a30-ddc9-4202-8dd9-c987e9728b85"
    title="推荐授课模式"
    subtitle="上半节教师讲授，下半节小组共创与讲解"
    headingLevel={1}
    className="aipe-teaching-mode-page"
    bodyClassName="aipe-teaching-mode-body"
  >
    <section shuku-edit-id="e-fb80cd3e-3601-40c3-bf66-5e7cf510dbcf" className="aipe-teaching-half aipe-teaching-half--lecture" aria-labelledby="aipe-teaching-lecture-title">
      <header shuku-edit-id="e-39c42571-0012-439b-9d7d-5df3acb0047f" className="aipe-teaching-half-heading">
        <Typography shuku-edit-id="e-b91fcc7c-a54d-4c1a-812b-f03d21c53489" as="p" variant="bodySmall" tone="inherit" className="aipe-teaching-half-label">上半节</Typography>
        <Typography shuku-edit-id="e-2b4188c5-3733-4d54-8b92-992bc580efda" as="h2" id="aipe-teaching-lecture-title" variant="h3" tone="accent">教师借助交互直觉讲授知识</Typography>
      </header>
      <figure shuku-edit-id="e-d521ea41-e023-427d-9343-75c88e6b4b33" className="aipe-teaching-half-illustration">
        <img shuku-edit-id="e-188002f9-5013-4743-bb08-b00678e39d0b" src={illustration('interactive-classroom')}
          alt="卡通课堂：教师指向交互式知识呈现中的概念关系图，学生面向屏幕听讲。"
          draggable={false}/>
      </figure>
      <div shuku-edit-id="e-d595012e-16ac-4978-8cee-d6f5faf4f4c0" className="aipe-teaching-half-summary">
        <Typography shuku-edit-id="e-5db8114c-e188-47dc-9573-1e9d9616a2e3" as="p" variant="body" tone="accent">讲清知识点与关键方法</Typography>
        <Typography shuku-edit-id="e-e03d0b53-c677-4995-946b-f0db7ee160e9" as="p" variant="bodySmall" tone="muted">结合交互演示，帮助学生理解</Typography>
      </div>
    </section>
    <section shuku-edit-id="e-9663ff3f-2f62-45fd-beb3-5b5086e2d98a" className="aipe-teaching-half aipe-teaching-half--cocreation" aria-labelledby="aipe-teaching-cocreation-title">
      <header shuku-edit-id="e-342b49ff-7ae8-4160-bc8f-e1e819325648" className="aipe-teaching-half-heading">
        <Typography shuku-edit-id="e-d01c6968-68c2-4b05-8ea4-ccbf6419edb3" as="p" variant="bodySmall" tone="inherit" className="aipe-teaching-half-label">下半节</Typography>
        <Typography shuku-edit-id="e-e3eb032e-edff-4b1f-864c-6414a6ec5380" as="h2" id="aipe-teaching-cocreation-title" variant="h3" tone="accent">小组共创，代表讲解，知识进化</Typography>
      </header>
      <figure shuku-edit-id="e-bebcebe4-5f6e-40aa-a98f-aff4377dab00" className="aipe-teaching-half-illustration">
        <img shuku-edit-id="e-82ea6fc6-0099-4f7c-b940-e557fb3e809b" src={illustration('group-cocreation')}
          alt="卡通课堂：学生小组共同讨论和改进交互式知识呈现，随后选出代表向全班讲解，教师在旁倾听。"
          draggable={false}/>
      </figure>
      <div shuku-edit-id="e-f3150c2c-df3c-4543-88ce-2754226b4fbf" className="aipe-teaching-half-summary">
        <Typography shuku-edit-id="e-2826350d-c31f-4341-ab3f-eeacfa142639" as="p" variant="bodySmall" tone="accent">理解知识 → 分组共创 → 代表讲解 → 知识进化</Typography>
        <Typography shuku-edit-id="e-6313afa3-dfc2-4e11-891a-ce8a0770cf81" as="p" variant="bodySmall" tone="muted">把自己的理解讲清楚，优秀创作更新下一代课程体系</Typography>
      </div>
    </section>
  </ContentBlock>;
}

