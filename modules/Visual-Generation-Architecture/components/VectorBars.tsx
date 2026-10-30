import { Text } from './Diagrams';

export function VectorBars({ values, warm = false, numbers = true }: { values: number[]; warm?: boolean; numbers?: boolean }) {
  return <div><div className={'vga-bars' + (warm ? ' is-warm' : '')}>{values.map((v, i) => <div key={i}><i style={{ height: `${Math.abs(v) * 18}%`, top: v >= 0 ? `${50 - v * 18}%` : '50%' }} /></div>)}</div>{numbers && <div className="vga-vector-numbers">{values.map((v, i) => <Text key={i}>{v.toFixed(2)}</Text>)}</div>}</div>;
}
