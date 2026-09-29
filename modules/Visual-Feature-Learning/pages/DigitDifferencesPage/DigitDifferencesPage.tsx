import { useState } from 'react';
import { ContentBlock, Typography } from '../../../shared/react';
import './DigitDifferencesPage.css';

type Comparison = {
  label: string;
  leftDigit: string;
  rightDigit: string;
  leftPath: string;
  rightPath: string;
  leftCue: string;
  rightTopCue: string;
  rightBottomCue: string;
  rightTopHighlight: string;
  rightBottomHighlight: string;
  markers: { left: readonly [number, number]; rightTop: readonly [number, number]; rightBottom: readonly [number, number] };
};

const comparisons: readonly Comparison[] = [
  {
    label: '1 与 7', leftDigit: '1', rightDigit: '7',
    leftPath: 'M61 75 L111 30 L101 229',
    rightPath: 'M30 47 Q107 35 187 48 L102 229',
    leftCue: '竖向主笔画较突出',
    rightTopCue: '顶部具有横画',
    rightBottomCue: '横画末端向下转折',
    rightTopHighlight: '横画', rightBottomHighlight: '转折',
    markers: { left: [625, 502], rightTop: [1040, 402], rightBottom: [1027, 471] },
  },
  {
    label: '0 与 6', leftDigit: '0', rightDigit: '6',
    leftPath: 'M111 32 C56 28 42 74 42 133 C42 195 61 229 111 230 C162 230 180 192 180 132 C180 75 163 32 111 32 Z',
    rightPath: 'M161 39 C104 60 63 111 63 172 C63 210 84 231 116 230 C153 229 172 203 161 174 C151 147 115 147 91 159 C75 167 65 181 64 192',
    leftCue: '外轮廓闭合',
    rightTopCue: '上部保留开口',
    rightBottomCue: '下部形成闭环',
    rightTopHighlight: '开口', rightBottomHighlight: '环',
    markers: { left: [549, 496], rightTop: [1032, 393], rightBottom: [982, 572] },
  },
  {
    label: '3 与 8', leftDigit: '3', rightDigit: '8',
    leftPath: 'M58 52 C154 12 193 105 109 128 C199 132 168 250 57 211',
    rightPath: 'M112 130 C58 112 63 29 115 30 C171 31 170 111 112 130 C51 145 54 230 113 229 C177 229 178 145 112 130 Z',
    leftCue: '左侧轮廓未闭合',
    rightTopCue: '上部形成闭环',
    rightBottomCue: '下部形成闭环',
    rightTopHighlight: '闭环', rightBottomHighlight: '闭环',
    markers: { left: [549, 446], rightTop: [977, 424], rightBottom: [977, 558] },
  },
];

function DigitCard({ digit, path, side }: { digit: string; path: string; side: 'left' | 'right' }) {
  return <div className={`vfl-diff__card vfl-diff__card--${side} absolute grid place-items-center rounded-[28px]`} aria-label={`手写数字 ${digit} 的示意笔迹`}>
    <svg className="vfl-diff__glyph h-[288px] w-[246px] max-w-full" viewBox="0 0 220 260" role="img" aria-label={`数字 ${digit}`}>
      <path d={path} fill="none" stroke="currentColor" strokeWidth="27" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>;
}

function ArrowIcon({ direction }: { direction: 'left' | 'right' }) {
  return <svg width="26" height="40" viewBox="0 0 26 40" fill="none" aria-hidden="true">
    <path d={direction === 'left' ? 'M21 4 5 20 21 36' : 'M5 4 21 20 5 36'} stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}

function Cue({ text, highlight }: { text: string; highlight: string }) {
  const index = text.indexOf(highlight);
  if (index < 0) return <Typography as="p" variant="body" tone="inherit">{text}</Typography>;
  return <Typography as="p" variant="body" tone="inherit">
    {text.slice(0, index)}<Typography as="span" variant="body" tone="warning">{highlight}</Typography>{text.slice(index + highlight.length)}
  </Typography>;
}

export function DigitDifferencesPage() {
  const [index, setIndex] = useState(0);
  const comparison = comparisons[index];
  const select = (next: number) => setIndex((next + comparisons.length) % comparisons.length);

  return <ContentBlock className="vfl-diff relative h-[900px] w-[1600px] overflow-hidden" headingLevel={1} title="数字之间有什么不同？" subtitle="观察笔画方向、转折与闭合关系，辨析不同数字的形态线索。">

    <div className="vfl-diff__question absolute grid place-items-center rounded-full">
      <Typography as="h2" variant="display" tone="inherit">观察哪些笔画结构？</Typography>
    </div>

    <DigitCard digit={comparison.leftDigit} path={comparison.leftPath} side="left" />
    <DigitCard digit={comparison.rightDigit} path={comparison.rightPath} side="right" />

    <svg className="vfl-diff__links absolute inset-0 h-full w-full" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true">
      <path d={`M426 445 ${comparison.markers.left[0]} ${comparison.markers.left[1]}`} stroke="#8fb2ef" strokeWidth="3" />
      <circle cx={comparison.markers.left[0]} cy={comparison.markers.left[1]} r="11" fill="#8fb2ef" stroke="#fff" strokeWidth="4" />
      <path d={`M${comparison.markers.rightTop[0]} ${comparison.markers.rightTop[1]} 1178 370`} stroke="#e47a49" strokeWidth="3" />
      <circle cx={comparison.markers.rightTop[0]} cy={comparison.markers.rightTop[1]} r="11" fill="#e47a49" stroke="#fff" strokeWidth="4" />
      <path d={`M${comparison.markers.rightBottom[0]} ${comparison.markers.rightBottom[1]} 1178 539`} stroke="#e47a49" strokeWidth="3" />
      <circle cx={comparison.markers.rightBottom[0]} cy={comparison.markers.rightBottom[1]} r="11" fill="#e47a49" stroke="#fff" strokeWidth="4" />
    </svg>

    <div className="vfl-diff__callout vfl-diff__callout--left absolute flex items-center rounded-[22px] px-[24px] py-[18px]">
      <Typography as="p" variant="body" tone="inherit">{comparison.leftCue}</Typography>
    </div>
    <div className="vfl-diff__callout vfl-diff__callout--right-top absolute flex items-center rounded-[22px] px-[24px] py-[18px]">
      <Cue text={comparison.rightTopCue} highlight={comparison.rightTopHighlight} />
    </div>
    <div className="vfl-diff__callout vfl-diff__callout--right-bottom absolute flex items-center rounded-[22px] px-[24px] py-[18px]">
      <Cue text={comparison.rightBottomCue} highlight={comparison.rightBottomHighlight} />
    </div>

    <button className="vfl-diff__nav vfl-diff__nav--left absolute grid place-items-center rounded-full" type="button" onClick={() => select(index - 1)} aria-label="查看上一组手写数字"><ArrowIcon direction="left" /></button>
    <button className="vfl-diff__nav vfl-diff__nav--right absolute grid place-items-center rounded-full" type="button" onClick={() => select(index + 1)} aria-label="查看下一组手写数字"><ArrowIcon direction="right" /></button>
    <div className="vfl-diff__dots absolute flex items-center gap-[14px]" role="group" aria-label="选择数字对比">
      {comparisons.map((item, dotIndex) => <button
        className={`vfl-diff__dot h-[18px] w-[18px] rounded-full${dotIndex === index ? ' is-active' : ''}`}
        key={item.label}
        type="button"
        aria-label={`查看 ${item.label}`}
        aria-pressed={dotIndex === index}
        onClick={() => select(dotIndex)}
      />)}
    </div>

    <div className="vfl-diff__takeaway absolute flex items-center gap-[20px] rounded-[22px] px-[30px]">
      <span className="vfl-diff__idea-icon grid h-[58px] w-[58px] flex-none place-items-center rounded-full" aria-hidden="true">✦</span>
      <Typography as="p" variant="h3" tone="inherit">笔画方向、转折和闭合关系有助于区分数字。</Typography>
    </div>
    <Typography as="p" variant="bodySmall" tone="muted" className="vfl-diff__example absolute">典型线索包括横画、转折、闭环与开口。</Typography>
  </ContentBlock>;
}
