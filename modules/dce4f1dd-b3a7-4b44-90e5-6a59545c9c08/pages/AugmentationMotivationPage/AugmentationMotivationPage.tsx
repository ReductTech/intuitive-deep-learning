import { useState } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
import { LessonPage } from '../../components/LessonPage';
import { photoUrl } from '../../data';
import './AugmentationMotivationPage.css';

export function AugmentationMotivationPage() {
  const [yellow, setYellow] = useState(true);
  return <LessonPage id="35fcf1e9-f569-4890-acaa-d88580e7c3e7" subtitle="标签正确，还不够：有限的训练变化可能留下偶然线索。"
    takeaway="为什么需要增广？用合理颜色变化削弱颜色捷径；真实黄色苹果仍应由独立样本覆盖。">
    <div shuku-edit-id="e-4ab8b0ab-bb35-478e-b995-15a202bb6bcf" className="daa-two daa-equal">
      <div shuku-edit-id="e-d7df7e7a-0cbe-4ba0-838d-566193f00b48" className="daa-reading">
        <Typography shuku-edit-id="e-5883c053-1e9b-413b-a9e6-4d7247e194be" variant="h3">假设训练集只覆盖这些外观</Typography>
        <div shuku-edit-id="e-890cd80c-43ea-4834-8d0b-78d85e636483" className="daa-motive-training">
          <div shuku-edit-id="e-9b42f853-0434-4b1a-a5ea-9dd2fbdb61af"><img shuku-edit-id="e-f4fd9e99-a5de-4950-af58-64a1b9a93c4e" src={photoUrl("01-fuji-apple.webp")} alt="红色苹果"/><Typography shuku-edit-id="e-b014e071-2397-45bc-b333-853a2b40f9bd" variant="body" align="center">苹果都是红色</Typography></div>
          <div shuku-edit-id="e-fcbb6d17-dfe6-4f3b-83b8-cbfe1b2828a5"><img shuku-edit-id="e-30870393-9f39-4be2-b4c4-4e42659f7e22" src={photoUrl("02-bartlett-pear.webp")} alt="黄色梨"/><Typography shuku-edit-id="e-b235cc56-2e26-490d-8531-388adf77329a" variant="body" align="center">梨都是黄色</Typography></div>
        </div>
        <Typography shuku-edit-id="e-51728673-a10d-48cd-bbf9-802d0665886c" variant="body">标签都正确，颜色却与类别偶然绑定。</Typography>
        <Typography shuku-edit-id="e-bb9bca8c-14d2-4901-80e0-72e4997b1103" variant="bodySmall" tone="muted">错误捷径：红色 → 苹果，黄色 → 梨。</Typography>
      </div>
      <div shuku-edit-id="e-504a79ea-ffed-4113-ba5d-114bdd623ed3" className="daa-center">
        <Typography shuku-edit-id="e-d6427789-197b-4fd9-a8f0-576b20b7da4f" variant="h3">测试集里，也有黄色苹果</Typography>
        <img shuku-edit-id="e-02c2fd1f-63ab-4958-a4f9-87ba84fbc901" className="daa-motive-test" src={photoUrl(yellow?"05-golden-delicious-apple.webp":"01-fuji-apple.webp")} alt="测试中的红色或黄色苹果"/>
        <Typography shuku-edit-id="e-16bdf3c8-bffa-44e1-9571-cc287a59f9fb" variant="body" tone={yellow?'danger':'success'}>只看颜色的规则：{yellow?'梨 · 判断错误':'苹果 · 恰好判断正确'}</Typography>
        <Button variant="primary" onClick={()=>setYellow(!yellow)}><Typography shuku-edit-id="e-a4de40f4-119c-4ac4-a715-9bb3b8e1fd37" as="span" variant="bodySmall" tone="inherit">{yellow?'对比红色苹果':'换成黄色苹果'}</Typography></Button>
      </div>
    </div>
  </LessonPage>;
}
