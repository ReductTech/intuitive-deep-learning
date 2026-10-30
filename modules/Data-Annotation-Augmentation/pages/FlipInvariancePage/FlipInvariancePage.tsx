import { useState } from 'react';
import { Button, Typography } from '../../../shared/react';
import { LessonPage } from '../../components/LessonPage';
import { PhotoStage } from '../../components/PhotoStage';
import { TurnSign } from '../../components/TurnSign';
export function FlipInvariancePage() {
  const [flip, setFlip] = useState(false);
  return <LessonPage id="11" subtitle="观察同一次水平翻转，对水果类别和转弯方向产生的不同影响。" takeaway="水平翻转是左右镜像：苹果类别不变，标志的方向标签由“左转”变为“右转”。">
    <div className="daa-two daa-equal"><div className="daa-center"><PhotoStage imageStyle={{ transform: flip ? 'scaleX(-1)' : 'none' }} /><Typography variant="body">水果分类：仍然是苹果</Typography></div>
      <div className="daa-reading"><Typography variant="h3">转弯标志：看箭头指向</Typography>
        <div className="daa-turn-pair"><div className="daa-turn-example"><TurnSign /><Typography variant="bodySmall">原图：左转</Typography></div><Typography variant="bodySmall" tone="muted">水平翻转 →</Typography><div className="daa-turn-example"><TurnSign direction={flip ? 'right' : 'left'} /><Typography variant="bodySmall" tone={flip ? 'success' : 'muted'}>{flip ? '翻转后：右转' : '当前：左转'}</Typography></div></div>
        <Button variant="primary" onClick={() => setFlip(!flip)}><Typography as="span" variant="bodySmall" tone="inherit">{flip ? '还原图片与标志' : '水平翻转两张图片'}</Typography></Button>
        <Typography variant="body" tone={flip ? 'accent' : 'muted'}>{flip ? '水果类别没变，转弯方向变了。' : '点击水平翻转，观察左右镜像后的标签。'}</Typography>
      </div></div>
  </LessonPage>;
}
