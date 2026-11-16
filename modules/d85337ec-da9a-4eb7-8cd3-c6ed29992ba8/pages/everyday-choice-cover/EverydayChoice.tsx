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
    return <div shuku-edit-id="e-6fbb1f18-1b9d-4bc3-8113-7724172094fc" className={`bt-leaf bt-${position} ${active ? 'is-chosen' : ''}`} data-result={name} data-selected={active}>
      <Icon size={46} strokeWidth={1.7} aria-hidden="true" />
      <Typography shuku-edit-id="e-fe349d21-47ac-4b84-bb4b-ef565c770d61" variant="h3" tone="inherit">{name}</Typography>
    </div>;
  };
  return <section shuku-edit-id="e-d654b7eb-4d0e-412f-b323-cb8603003b47" className="bt-cover" aria-label="生活中的二叉树互动">
    <header shuku-edit-id="e-83ce35e5-56f0-4a72-864d-fad420d59cf2" className="bt-heading">
      <Typography shuku-edit-id="e-05e3ccbb-884e-4d06-91e0-097f4c80ac74" variant="bodySmall" tone="muted">二叉树 · 生活中的例子</Typography>
      <Typography shuku-edit-id="e-06634e6c-43c0-4888-82ac-1b84cdfe0dfb" variant="display" tone="accent">出门怎么走？</Typography>
      <Typography shuku-edit-id="e-f238bb37-3df9-433c-8188-9888099be2a7" variant="subtitle" tone="muted">做几个选择，就能看懂二叉树</Typography>
    </header>
    <div shuku-edit-id="e-e12638b0-9bbb-45d6-80e6-3c12f1484b5b" className="bt-main">
      <aside shuku-edit-id="e-42dd23b9-a02e-40a9-b93d-84ce69b64496" className="bt-story">
        <MapPin size={36} aria-hidden="true" />
        <Typography shuku-edit-id="e-cc9a5286-1446-44f4-af00-e1833f273551" variant="h3" tone="accent">准备出门，<br shuku-edit-id="e-651c6364-880e-451a-a1c1-6413858e2091" />你会怎么选？</Typography>
        <Typography shuku-edit-id="e-0aa38515-8434-4669-85e3-c48dbfc552f6" variant="body" tone="muted">从最上面的问题开始，<br shuku-edit-id="e-9587c2ec-9b1e-4ca4-b173-9c031b16e3a8" />点选“是”或“否”。</Typography>
        <div shuku-edit-id="e-75da0324-042a-4524-a1d9-4d554c17ac26" className="bt-feedback" role="status" aria-live="polite" aria-atomic="true" data-stage={result ? 'complete' : near === 'no' ? 'weather' : 'start'}>
          <Typography shuku-edit-id="e-33427fe3-c285-4f2c-a8ae-98c2d6e6327f" variant="bodySmall" tone="muted">{result ? '这次的选择' : near === 'no' ? '再做一个选择' : '先想一想'}</Typography>
          <Typography shuku-edit-id="e-8c9e5891-0052-47b5-8c64-a74c569831b1" variant="h3" tone="accent">{result ? `选择${result}` : near === 'no' ? '下雨了吗？' : '距离很近吗？'}</Typography>
          <Typography shuku-edit-id="e-17563686-49a3-49c9-a166-1c535b144c01" variant="bodySmall" tone="muted">{result ? (near === 'yes' ? '距离近 → 步行' : `距离远 → ${rain === 'yes' ? '下雨 → 公交' : '没下雨 → 骑车'}`) : '橙色路线会记录你的选择。'}</Typography>
        </div>
        <Button onClick={reset} className="bt-reset" disabled={near === null}><RotateCcw size={20} aria-hidden="true" /><Typography shuku-edit-id="e-e8120f20-b684-499f-84d4-7011cdd9f445" as="span" variant="bodySmall" tone="inherit">重新选择</Typography></Button>
      </aside>
      <div shuku-edit-id="e-0ca92b12-313b-4636-91d0-f7784612f02b" className="bt-tree" role="group" aria-label="距离近选步行；距离远，下雨选公交，否则骑车">
        <svg shuku-edit-id="e-e48fe775-4125-49aa-bdb8-9c0709c92bb6" className="bt-edges" viewBox="0 0 1020 610" aria-hidden="true">
          <path shuku-edit-id="e-e6a3f7a6-5774-453f-8379-f1ca90a1e52b" d="M510 152 L180 265" className={near === 'yes' ? 'bt-active-edge' : ''} />
          <path shuku-edit-id="e-d137437e-8d48-4fac-861f-96e4dbde27bb" d="M510 152 L720 265" className={near === 'no' ? 'bt-active-edge' : ''} />
          <path shuku-edit-id="e-035af403-69e1-408d-8624-053a15dcc09b" d="M720 405 L560 490" className={near === 'no' && rain === 'yes' ? 'bt-active-edge' : ''} />
          <path shuku-edit-id="e-befc34fc-c6a8-4a57-ba6b-517e72b1b126" d="M720 405 L900 490" className={near === 'no' && rain === 'no' ? 'bt-active-edge' : ''} />
        </svg>
        <div shuku-edit-id="e-c636dfe4-9c00-4ec9-8e43-2b30016fca48" className="bt-question bt-distance">
          <Typography shuku-edit-id="e-89717758-9615-4c84-85df-abd8395d1f67" variant="h3" tone="inherit">距离很近吗？</Typography>
          <div shuku-edit-id="e-933bc105-793d-49c0-9c56-2b1f667f6b18" className="bt-answers"><Button data-choice="near-yes" active={near === 'yes'} aria-pressed={near === 'yes'} onClick={() => chooseNear('yes')}><Typography shuku-edit-id="e-e3338b39-670d-4222-8849-63b6155363fd" as="span" variant="bodySmall" tone="inherit">是</Typography></Button><Button data-choice="near-no" active={near === 'no'} aria-pressed={near === 'no'} onClick={() => chooseNear('no')}><Typography shuku-edit-id="e-f17d81e8-594f-4ee1-9d04-d60da26b2cc3" as="span" variant="bodySmall" tone="inherit">否</Typography></Button></div>
        </div>
        <Typography shuku-edit-id="e-171d8aae-de37-48fe-b9ae-b32f7e957820" as="span" variant="bodySmall" className="bt-edge-label bt-label-near-yes">是</Typography>
        <Typography shuku-edit-id="e-a4c1f363-f170-4d52-b829-ef12cbabf07d" as="span" variant="bodySmall" className="bt-edge-label bt-label-near-no">否</Typography>
        {leaf('步行', near === 'yes', 'walking', Footprints)}
        <div shuku-edit-id="e-824273e1-6214-458e-b127-ed93a1ea13a1" className={`bt-question bt-weather ${near === 'no' ? '' : 'is-waiting'}`}>
          <Typography shuku-edit-id="e-22e989e5-f6f7-42b1-aff3-6bee5383f177" variant="h3" tone="inherit">下雨了吗？</Typography>
          <div shuku-edit-id="e-3a7cc6b1-a3c0-4f49-b9a7-019c4fb3c8c9" className="bt-answers"><Button data-choice="rain-yes" disabled={near !== 'no'} active={rain === 'yes'} aria-pressed={rain === 'yes'} onClick={() => setRain('yes')}><Typography shuku-edit-id="e-075ac088-b5b4-4b0a-b43f-a4809fba2bb6" as="span" variant="bodySmall" tone="inherit">是</Typography></Button><Button data-choice="rain-no" disabled={near !== 'no'} active={rain === 'no'} aria-pressed={rain === 'no'} onClick={() => setRain('no')}><Typography shuku-edit-id="e-89be0c92-e4f0-49c4-ba48-b5d547f8f413" as="span" variant="bodySmall" tone="inherit">否</Typography></Button></div>
        </div>
        <Typography shuku-edit-id="e-b5c62561-0f16-4661-9cbb-89b4a6bced00" as="span" variant="bodySmall" className="bt-edge-label bt-label-rain-yes">是</Typography>
        <Typography shuku-edit-id="e-ba262ba5-53f6-4d60-86ec-9ad493682de8" as="span" variant="bodySmall" className="bt-edge-label bt-label-rain-no">否</Typography>
        {leaf('公交', near === 'no' && rain === 'yes', 'bus', BusFront)}
        {leaf('骑车', near === 'no' && rain === 'no', 'bike', Bike)}
      </div>
    </div>
    <footer shuku-edit-id="e-eb445d0d-8bee-4784-b7a8-66da9683903d" className="bt-takeaway">
      <Typography shuku-edit-id="e-08f59584-4741-4bf0-a66e-ec2e6eda3faa" variant="body" tone="accent">{result ? '每个节点最多分出两条路，这就是二叉树的一个直观例子。' : '一个问题，两条分支。试着沿着自己的选择走下去。'}</Typography>
      <Typography shuku-edit-id="e-0eded3c1-7e36-4f0d-ba7f-5db862778152" variant="bodySmall" tone="muted">简化的生活选择示例</Typography>
    </footer>
  </section>;
}
