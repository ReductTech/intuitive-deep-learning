import { Button } from "@shuku/course-style/react/controls/Button";
import { Typography } from "@shuku/course-style/react/typography/Typography";
import { Feature, ReferenceVisual, Text } from './Diagrams';
import { Signal } from './Story';

const nodes = [
  { x: 125, y: 52, label: 'Down · 细尺度', name: 'Down', detail: '细尺度', size: 110 },
  { x: 360, y: 118, label: 'Down · 粗尺度', name: 'Down', detail: '粗尺度', size: 86 },
  { x: 625, y: 168, label: 'Mid · 汇集信息', name: 'Mid', detail: '整体信息', size: 62 },
  { x: 890, y: 118, label: 'Up · 粗尺度', name: 'Up', detail: '粗尺度', size: 86 },
  { x: 1120, y: 52, label: 'Up · 细尺度', name: 'Up', detail: '细尺度', size: 110 },
];
export function NetworkLab({ stage = 6, skip = true, playing = false, onSelect, time = false, text = false }: { stage?: number; skip?: boolean; playing?: boolean; onSelect?: (index: number) => void; time?: boolean; text?: boolean }) {
  return <div shuku-edit-id="e-0ff27f20-7374-44f7-baa3-512e263c40b6" className="vga-story-network" data-network-stage={stage} data-skip={skip}>
    <svg shuku-edit-id="e-83deb934-a1b9-40bb-a8d7-d0bb70871859" viewBox="0 0 1400 284" preserveAspectRatio="none" aria-hidden="true">
      <Signal d="M95 125H200L430 160L700 205L970 160L1200 125H1310" active={stage>0} animate={playing} />
      <path shuku-edit-id="e-a7fedecf-8a8a-4d83-8331-4e06f692965b" d="M205 65V24H1205V65M440 128V94H970V128" fill="none" stroke={skip ? '#a1c8f1' : 'var(--ui-border-strong)'} strokeWidth="2" strokeDasharray={skip ? undefined : '6 6'} />
      {time && <Signal d="M705 8H205V52M705 8H1205V52M330 8V75H700V168" warm active animate={playing} />}
      {text && <Signal d="M105 279H1080M550 279V155H505M800 279V200H755M1080 279V155H1035" active animate={playing} />}
    </svg>
    {nodes.map((node, index) => {
      const graphic = <><Feature size={node.size} level={index} /><Typography as="span" variant="bodySmall" tone="accent">{node.name}</Typography>{index !== 2 && <Typography as="span" variant="bodySmall" tone="muted">{node.detail}</Typography>}</>;
      return <div shuku-edit-id="e-78ec0329-406c-4de5-a904-e0536cff7cbe" className={'vga-network-point' + (stage === index + 1 ? ' is-current' : '') + (stage < index + 1 ? ' is-future' : '')} key={node.label} style={{ left: `${node.x / 14}%`, top: node.y, width: '12%' }}>
        {onSelect ? <Button aria-label={`观察 ${node.label}`} onClick={() => onSelect(index + 1)}>{graphic}</Button> : <div shuku-edit-id="e-ac76747d-6ada-426f-94b5-f203486d919f" className="vga-point-static">{graphic}</div>}
      </div>;
    })}
    <div shuku-edit-id="e-48d1861f-e38b-4967-bf61-060cd1f1e561" className="vga-network-terminal"><ReferenceVisual file="visuals/noisy-cat.jpg" alt="带噪状态" /><Text>带噪状态</Text></div>
    <div shuku-edit-id="e-b9edad5f-aa81-43d4-9a7e-e2ad00160d62" className="vga-network-terminal is-output"><ReferenceVisual file="visuals/noise-prediction.jpg" alt="预测噪声" /><Text>预测结果</Text></div>
    <div shuku-edit-id="e-2e31188e-03c1-42ab-b155-043b94d97fb8" className="vga-network-skip-label"><Text>{skip ? 'Skip · 对应尺度直接传回' : 'Skip · 已断开'}</Text></div>
  </div>;
}
