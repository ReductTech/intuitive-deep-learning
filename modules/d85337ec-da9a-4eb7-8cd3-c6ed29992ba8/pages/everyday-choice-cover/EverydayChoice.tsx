import { useState } from 'react';
import { Bike, BusFront, Footprints, RotateCcw, MapPin } from 'lucide-react';
import { Button, Typography } from "@shuku/course-style/react";
import './EverydayChoice.css';

type Answer = 'yes' | 'no' | null;
export function EverydayChoice() {
  const [near, setNear] = useState<Answer>(null);
  const [rain, setRain] = useState<Answer>(null);
  const result = near === 'yes' ? '步行' : near === 'no' && rain ? (rain === 'yes' ? '公交' : '骑车') : null;
  const chooseNear = (answer: Answer) => { setNear(answer); setRain(null); };
  const reset = () => { setNear(null); setRain(null); };
  const leaf = (name: string, active: boolean, position: string, icon: typeof Bike) => {
    const Icon = icon;
    return <div className={`bt-leaf bt-${position} ${active ? 'is-chosen' : ''}`} data-result={name} data-selected={active}>
      <Icon size={46} strokeWidth={1.7} aria-hidden="true" />
      <Typography variant="h3" tone="inherit">{name}</Typography>
    </div>;
  };
  return <section className="bt-cover" aria-label="生活中的二叉树互动">
    <header className="bt-heading">
      <Typography variant="bodySmall" tone="muted">二叉树 · 生活中的例子</Typography>
      <Typography variant="display" tone="accent">出门怎么走？</Typography>
      <Typography variant="subtitle" tone="muted">做几个选择，就能看懂二叉树</Typography>
    </header>
    <div className="bt-main">
      <aside className="bt-story">
        <MapPin size={36} aria-hidden="true" />
        <Typography variant="h3" tone="accent">准备出门，<br />你会怎么选？</Typography>
        <Typography variant="body" tone="muted">从最上面的问题开始，<br />点选“是”或“否”。</Typography>
        <div className="bt-feedback" role="status" aria-live="polite" aria-atomic="true" data-stage={result ? 'complete' : near === 'no' ? 'weather' : 'start'}>
          <Typography variant="bodySmall" tone="muted">{result ? '这次的选择' : near === 'no' ? '再做一个选择' : '先想一想'}</Typography>
          <Typography variant="h3" tone="accent">{result ? `选择${result}` : near === 'no' ? '下雨了吗？' : '距离很近吗？'}</Typography>
          <Typography variant="bodySmall" tone="muted">{result ? (near === 'yes' ? '距离近 → 步行' : `距离远 → ${rain === 'yes' ? '下雨 → 公交' : '没下雨 → 骑车'}`) : '橙色路线会记录你的选择。'}</Typography>
        </div>
        <Button onClick={reset} className="bt-reset" disabled={near === null}><RotateCcw size={20} aria-hidden="true" /><Typography as="span" variant="bodySmall" tone="inherit">重新选择</Typography></Button>
      </aside>
      <div className="bt-tree" role="group" aria-label="距离近选步行；距离远，下雨选公交，否则骑车">
        <svg className="bt-edges" viewBox="0 0 1020 610" aria-hidden="true">
          <path d="M510 152 L180 265" className={near === 'yes' ? 'bt-active-edge' : ''} />
          <path d="M510 152 L720 265" className={near === 'no' ? 'bt-active-edge' : ''} />
          <path d="M720 405 L560 490" className={near === 'no' && rain === 'yes' ? 'bt-active-edge' : ''} />
          <path d="M720 405 L900 490" className={near === 'no' && rain === 'no' ? 'bt-active-edge' : ''} />
        </svg>
        <div className="bt-question bt-distance">
          <Typography variant="h3" tone="inherit">距离很近吗？</Typography>
          <div className="bt-answers"><Button data-choice="near-yes" active={near === 'yes'} aria-pressed={near === 'yes'} onClick={() => chooseNear('yes')}><Typography as="span" variant="bodySmall" tone="inherit">是</Typography></Button><Button data-choice="near-no" active={near === 'no'} aria-pressed={near === 'no'} onClick={() => chooseNear('no')}><Typography as="span" variant="bodySmall" tone="inherit">否</Typography></Button></div>
        </div>
        <Typography as="span" variant="bodySmall" className="bt-edge-label bt-label-near-yes">是</Typography>
        <Typography as="span" variant="bodySmall" className="bt-edge-label bt-label-near-no">否</Typography>
        {leaf('步行', near === 'yes', 'walking', Footprints)}
        <div className={`bt-question bt-weather ${near === 'no' ? '' : 'is-waiting'}`}>
          <Typography variant="h3" tone="inherit">下雨了吗？</Typography>
          <div className="bt-answers"><Button data-choice="rain-yes" disabled={near !== 'no'} active={rain === 'yes'} aria-pressed={rain === 'yes'} onClick={() => setRain('yes')}><Typography as="span" variant="bodySmall" tone="inherit">是</Typography></Button><Button data-choice="rain-no" disabled={near !== 'no'} active={rain === 'no'} aria-pressed={rain === 'no'} onClick={() => setRain('no')}><Typography as="span" variant="bodySmall" tone="inherit">否</Typography></Button></div>
        </div>
        <Typography as="span" variant="bodySmall" className="bt-edge-label bt-label-rain-yes">是</Typography>
        <Typography as="span" variant="bodySmall" className="bt-edge-label bt-label-rain-no">否</Typography>
        {leaf('公交', near === 'no' && rain === 'yes', 'bus', BusFront)}
        {leaf('骑车', near === 'no' && rain === 'no', 'bike', Bike)}
      </div>
    </div>
    <footer className="bt-takeaway">
      <Typography variant="body" tone="accent">{result ? '每个节点最多分出两条路，这就是二叉树的一个直观例子。' : '一个问题，两条分支。试着沿着自己的选择走下去。'}</Typography>
      <Typography variant="bodySmall" tone="muted">简化的生活选择示例</Typography>
    </footer>
  </section>;
}
