import { ContentBlock, Typography } from '../../../shared/react';
import "./NematodeResponsePage.css";
import type { CSSProperties } from 'react';
import nematodeVideo from '../../assets/video.mp4';
import nematodeVideoPoster from '../../assets/video-poster.png';

const abilities = [
  { name: '触碰', detail: '触觉神经元感受到身体接触，再通过神经回路触发后退或转向。', group: '感知' },
  { name: '气味', detail: '化学感受神经元比较环境中的气味线索，帮助它靠近食物或远离危险。', group: '感知' },
  { name: '温度', detail: '温度感受回路会结合过去经验，调整移动方向以寻找更合适的区域。', group: '感知' },
  { name: '前进', detail: '运动神经元按节律控制身体肌肉收缩，形成连续的波浪式前进。', group: '行动' },
  { name: '后退', detail: '遇到不利刺激时，特定神经回路会切换肌肉活动顺序，使身体向后移动。', group: '行动' },
  { name: '转向', detail: '它通过改变头部摆动和身体弯曲，重新选择探索方向。', group: '行动' },
  { name: '觅食', detail: '它综合气味、食物浓度与饥饿状态，调整速度和方向来寻找细菌。', group: '行为' },
  { name: '避险', detail: '有害气味、强烈触碰或异常温度会激活回避回路，让它迅速离开。', group: '行为' },
  { name: '学习', detail: '经历重复刺激后，它会改变后续反应强度，表现出习惯化与联结学习。', group: '行为' },
] as const;

export function NematodeResponsePage() {
  return (
    <ContentBlock
      headingLevel={1}
      className="ng-nematode-opening-v2 ng-nematode-intro"
      title="只有 302 个神经元，它为什么能完成这么多行为？"
      subtitle={(
        <>
          <Typography as="em" variant="subtitle" tone="accent">Caenorhabditis elegans</Typography>
          {' '}· 一种体长约 1 毫米、身体透明的非寄生线虫，已在地球上存在约 2000 万年
        </>
      )}
    >

      <div className="ng-nematode-intro__scene">
        <figure className="ng-nematode-opening-v2__micrograph ng-nematode-intro__video">
          <video
            src={nematodeVideo}
            poster={nematodeVideoPoster}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-label="显微镜下活动的秀丽隐杆线虫"
          />
          <div className="ng-nematode-opening-v2__specimen">
            <Typography variant="body" tone="inherit">显微镜下的活动影像</Typography>
            <Typography as="strong" variant="h3" tone="inherit">成年秀丽隐杆线虫</Typography>
          </div>
        </figure>

        <div className="ng-nematode-intro__story">
          <section className="ng-nematode-intro__connectome" aria-labelledby="ng-nematode-connectome">
            <div className="ng-nematode-intro__year">
              <Typography variant="body" tone="warning">截至</Typography>
              <Typography as="strong" variant="h2" tone="warning">2019</Typography>
            </div>
            <div>
              <Typography id="ng-nematode-connectome" as="h3" variant="h3" tone="accent">
                唯一完成全神经系统连接组测定的动物
              </Typography>
              <Typography variant="body" tone="muted">
                研究者已经记录这些神经元之间的连接关系，因此可以沿着完整“线路图”追踪感觉如何转化为行为。
              </Typography>
            </div>
            <Typography as="a" variant="body" tone="muted" href="https://www.nature.com/articles/s41586-019-1352-7" target="_blank" rel="noreferrer">
              资料：Nature, 2019
            </Typography>
          </section>

          <section className="ng-nematode-intro__abilities" aria-label="秀丽隐杆线虫的能力">
            <div className="ng-nematode-intro__ability-head">
              <div>
                <Typography as="h3" variant="h3" tone="accent">302 个神经元支持的能力</Typography>
                <Typography variant="body" tone="muted">悬浮或聚焦泡泡，暂停漂浮并查看机制。</Typography>
              </div>
            </div>
            <div className="ng-nematode-intro__bubble-field">
              {abilities.map((ability, index) => (
                <button
                  className="ng-nematode-intro__bubble"
                  data-group={ability.group}
                  style={{ '--ng-bubble-index': index } as CSSProperties}
                  type="button"
                  key={ability.name}
                  aria-label={`${ability.name}：${ability.detail}`}
                >
                  <Typography as="strong" variant="body" tone="inherit">{ability.name}</Typography>
                  <Typography as="span" variant="body" tone="inherit" className="ng-nematode-intro__bubble-detail">{ability.detail}</Typography>
                </button>
              ))}
            </div>
          </section>

        </div>
      </div>
    </ContentBlock>
  );
}
