import { useState } from 'react';
import { Button, Typography } from '../../../shared/react';
import { LessonPage } from '../../components/LessonPage';
import { photoUrl } from '../../data';
import './AugmentationMotivationPage.css';

export function AugmentationMotivationPage() {
  const [yellow, setYellow] = useState(true);
  return <LessonPage id="08" subtitle="标签正确，还不够：有限的训练变化可能留下偶然线索。"
    takeaway="为什么需要增广？用合理颜色变化削弱颜色捷径；真实黄色苹果仍应由独立样本覆盖。">
    <div className="daa-two daa-equal">
      <div className="daa-reading">
        <Typography variant="h3">假设训练集只覆盖这些外观</Typography>
        <div className="daa-motive-training">
          <div><img src={photoUrl('01-fuji-apple.png')} alt="红色苹果"/><Typography variant="body" align="center">苹果都是红色</Typography></div>
          <div><img src={photoUrl('02-bartlett-pear.png')} alt="黄色梨"/><Typography variant="body" align="center">梨都是黄色</Typography></div>
        </div>
        <Typography variant="body">标签都正确，颜色却与类别偶然绑定。</Typography>
        <Typography variant="bodySmall" tone="muted">错误捷径：红色 → 苹果，黄色 → 梨。</Typography>
      </div>
      <div className="daa-center">
        <Typography variant="h3">测试集里，也有黄色苹果</Typography>
        <img className="daa-motive-test" src={photoUrl(yellow?'05-golden-delicious-apple.png':'01-fuji-apple.png')} alt="测试中的红色或黄色苹果"/>
        <Typography variant="body" tone={yellow?'danger':'success'}>只看颜色的规则：{yellow?'梨 · 判断错误':'苹果 · 恰好判断正确'}</Typography>
        <Button variant="primary" onClick={()=>setYellow(!yellow)}><Typography as="span" variant="bodySmall" tone="inherit">{yellow?'对比红色苹果':'换成黄色苹果'}</Typography></Button>
      </div>
    </div>
  </LessonPage>;
}
