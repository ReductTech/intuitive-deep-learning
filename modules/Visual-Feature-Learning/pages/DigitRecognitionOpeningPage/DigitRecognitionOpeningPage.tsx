import { useState } from 'react';
import { ContentBlock, moduleAssetUrl, Typography } from '../../../shared/react';
import './DigitRecognitionOpeningPage.css';

const ASSET_ID = '80396753-7fc8-4f55-9188-bddbdb828169';
const specimens = [
  { id: 'A', src: moduleAssetUrl(ASSET_ID, 'digits/6.png'), digit: '6' },
  { id: 'B', src: moduleAssetUrl(ASSET_ID, 'digits/8.png'), digit: '8' },
  { id: 'C', src: moduleAssetUrl(ASSET_ID, 'digits/6-alt.png'), digit: '6' },
] as const;

export function DigitRecognitionOpeningPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [attempted, setAttempted] = useState(false);
  const solved = selected.length === 2 && selected.includes('A') && selected.includes('C');

  const choose = (id: string) => {
    setAttempted(false);
    setSelected((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : current.length === 2 ? [current[1], id] : [...current, id]);
  };

  return <ContentBlock
    className="vfl-digit-intro"
    headingLevel={1}
    title="计算机是如何识别一个数字的？"
    subtitle="先看三张真实的手写数字。哪两张写的是同一个数字？"
  >
    <div className="vfl-digit-intro__stage">
      <div className="vfl-digit-intro__eyebrow">
        <Typography as="span" variant="bodySmall" tone="inherit">视觉挑战 / 01</Typography>
        <Typography as="span" variant="bodySmall" tone="inherit">选出两张 · 点击笔迹</Typography>
      </div>

      <div className="vfl-digit-intro__specimens" role="group" aria-label="选择两张表示同一个数字的手写样本">
        {specimens.map((sample, index) => {
          const active = selected.includes(sample.id);
          return <button
            className={`vfl-digit-intro__specimen${active ? ' is-selected' : ''}${solved && active ? ' is-matched' : ''}`}
            type="button"
            key={sample.id}
            aria-pressed={active}
            aria-label={`笔迹 ${sample.id}${active ? '，已选中' : ''}`}
            onClick={() => choose(sample.id)}
          >
            <span className="vfl-digit-intro__specimen-top">
              <Typography as="span" variant="bodySmall" tone="inherit">笔迹 {sample.id}</Typography>
              <span className="vfl-digit-intro__index">0{index + 1}</span>
            </span>
            <span className="vfl-digit-intro__image-frame">
              <img src={sample.src} alt="" draggable={false} />
            </span>
            <span className="vfl-digit-intro__specimen-bottom">
              <Typography as="span" variant="bodySmall" tone="inherit">{solved ? `数字 ${sample.digit}` : active ? '已选中' : '点击选择'}</Typography>
              <span aria-hidden="true">{active ? '✓' : '↗'}</span>
            </span>
          </button>;
        })}
      </div>

      <div className="vfl-digit-intro__answer" aria-live="polite">
        <div className="vfl-digit-intro__answer-marker" aria-hidden="true">{solved ? '✓' : '?'}</div>
        <div className="vfl-digit-intro__answer-copy">
          <Typography as="h2" variant="h3" tone="inherit">
            {solved ? '写法不同，你依然认出了同一个 6。' : selected.length < 2 ? '你是凭什么认出它们的？' : '再看看笔画的整体形状。'}
          </Typography>
          <Typography as="p" variant="body" tone="inherit">
            {solved
              ? '计算机接收到的是图像里的像素。要完成同样的判断，它得先从像素中找到有用的形状线索。'
              : selected.length < 2
                ? '你可能没有逐格比较像素，却能越过笔迹差异，看出形状之间的关系。'
                : '这两张并不是同一个数字。再次点击可以取消选择，也可以直接选另一张。'}
          </Typography>
        </div>
        {!solved && selected.length === 2 && <button className="vfl-digit-intro__retry" type="button" onClick={() => { setSelected([]); setAttempted(true); }} aria-label="清空选择并重试">重新选择 ↻</button>}
        {attempted && <span className="vfl-digit-intro__sr-only" role="status">已清空选择，可以重新选择两张笔迹。</span>}
      </div>
    </div>
    <div className="vfl-digit-intro__next">
      <span className="vfl-digit-intro__next-line" aria-hidden="true" />
      <Typography as="p" variant="bodySmall" tone="muted">接下来：同样是一个数字，不同笔迹的像素究竟有多不一样？</Typography>
    </div>
  </ContentBlock>;
}
