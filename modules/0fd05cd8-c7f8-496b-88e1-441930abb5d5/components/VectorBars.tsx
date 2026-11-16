import { Text } from './Diagrams';

export function VectorBars({ values, warm = false, numbers = true }: { values: number[]; warm?: boolean; numbers?: boolean }) {
  return <div shuku-edit-id="e-f497b152-dc98-4cf6-8737-021708852960"><div shuku-edit-id="e-5b43b50d-1b49-4ec3-9465-100276832d76" className={'vga-bars' + (warm ? ' is-warm' : '')}>{values.map((v, i) => <div shuku-edit-id="e-4f1c5b8a-b52c-436f-9999-b7fa7c9cc210" key={i}><i shuku-edit-id="e-82f32ef5-3ea4-49b7-be86-1db0b8d9f02e" style={{ height: `${Math.abs(v) * 18}%`, top: v >= 0 ? `${50 - v * 18}%` : '50%' }} /></div>)}</div>{numbers && <div shuku-edit-id="e-1edc267c-a26e-455f-8f1f-89cae9c21d1f" className="vga-vector-numbers">{values.map((v, i) => <Text key={i}>{v.toFixed(2)}</Text>)}</div>}</div>;
}
