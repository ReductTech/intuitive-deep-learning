import { MathFormulaStatic } from '../react';
import type { PresentationLibraryItem } from './studio';
import type { WidgetRegistry, WidgetRuntimeProps } from './widget-registry';

const capabilities = {
  interactive: false,
  resizable: true,
  serializable: true,
  supportsSlide: true,
  supportsGuide: true,
  supportsNarration: true,
};

type TableProps = { cells?: string[][]; header?: boolean; accent?: string };
type ChartProps = { chartType?: 'bar' | 'line' | 'pie'; labels?: string[]; values?: number[]; color?: string };
type DiagramProps = { nodes?: string[]; direction?: 'row' | 'column'; color?: string };
type IconProps = { symbol?: string; color?: string; background?: string };
type ShapeProps = { shape?: 'rectangle' | 'rounded' | 'ellipse' | 'arrow'; fill?: string; stroke?: string };
type EquationProps = { latex?: string; color?: string };

function TableWidget({ props }: WidgetRuntimeProps<TableProps>) {
  const cells = props.cells?.length ? props.cells : [['项目', '数值'], ['样本 A', '72'], ['样本 B', '86']];
  return <div className="pe-builtin-table"><table><tbody>{cells.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, columnIndex) => {
    const Cell = props.header !== false && rowIndex === 0 ? 'th' : 'td';
    return <Cell key={columnIndex} style={rowIndex === 0 ? { background: props.accent ?? '#1d6258' } : undefined}>{cell}</Cell>;
  })}</tr>)}</tbody></table></div>;
}

function ChartWidget({ props }: WidgetRuntimeProps<ChartProps>) {
  const labels = props.labels?.length ? props.labels : ['一月', '二月', '三月', '四月'];
  const values = props.values?.length ? props.values : [32, 56, 44, 72];
  const count = Math.max(1, Math.min(labels.length, values.length));
  const color = props.color ?? '#2d7d68';
  const max = Math.max(1, ...values.slice(0, count).map((value) => Math.abs(value)));
  const points = values.slice(0, count).map((value, index) => `${70 + index * (500 / Math.max(1, count - 1))},${300 - (Math.max(0, value) / max) * 230}`).join(' ');
  if (props.chartType === 'pie') {
    const total = values.slice(0, count).reduce((sum, value) => sum + Math.max(0, value), 0) || 1;
    let cursor = 0;
    const colors = [color, '#e49b54', '#5d83c2', '#9a72b0', '#74a88d'];
    const gradient = values.slice(0, count).map((value, index) => {
      const start = cursor;
      cursor += Math.max(0, value) / total * 100;
      return `${colors[index % colors.length]} ${start}% ${cursor}%`;
    }).join(',');
    return <div className="pe-builtin-pie"><div style={{ background: `conic-gradient(${gradient})` }} /><ul>{labels.slice(0, count).map((label, index) => <li key={label}><i style={{ background: colors[index % colors.length] }} />{label}<b>{values[index]}</b></li>)}</ul></div>;
  }
  return <div className="pe-builtin-chart"><svg viewBox="0 0 640 360" preserveAspectRatio="none" aria-label="图表">
    <path d="M55 28V305H615" className="pe-builtin-chart__axis" />
    {[0, 1, 2, 3, 4].map((line) => <path key={line} d={`M55 ${75 + line * 57.5}H615`} className="pe-builtin-chart__grid" />)}
    {props.chartType === 'line'
      ? <><polyline points={points} fill="none" stroke={color} strokeWidth="8" strokeLinejoin="round" />{points.split(' ').map((point) => { const [cx, cy] = point.split(','); return <circle key={point} cx={cx} cy={cy} r="8" fill={color} />; })}</>
      : values.slice(0, count).map((value, index) => { const barWidth = Math.min(72, 430 / count); const height = Math.max(0, value) / max * 230; const x = 92 + index * (500 / count); return <rect key={index} x={x} y={300 - height} width={barWidth} height={height} rx="6" fill={color} />; })}
    {labels.slice(0, count).map((label, index) => <text key={label} x={props.chartType === 'line' ? 70 + index * (500 / Math.max(1, count - 1)) : 92 + index * (500 / count) + Math.min(72, 430 / count) / 2} y="334" textAnchor="middle">{label}</text>)}
  </svg></div>;
}

function DiagramWidget({ props }: WidgetRuntimeProps<DiagramProps>) {
  const nodes = props.nodes?.length ? props.nodes : ['问题', '方法', '结果'];
  const vertical = props.direction === 'column';
  return <div className={`pe-builtin-diagram${vertical ? ' is-column' : ''}`}>{nodes.map((node, index) => <span key={`${node}-${index}`}><b style={{ borderColor: props.color ?? '#2d7d68' }}>{node}</b>{index < nodes.length - 1 ? <i>{vertical ? '↓' : '→'}</i> : null}</span>)}</div>;
}

function IconWidget({ props }: WidgetRuntimeProps<IconProps>) {
  return <div className="pe-builtin-icon" style={{ color: props.color ?? '#ffffff', background: props.background ?? '#2d7d68' }}>{props.symbol ?? '✓'}</div>;
}

function ShapeWidget({ props }: WidgetRuntimeProps<ShapeProps>) {
  const shape = props.shape ?? 'rounded';
  return <div className={`pe-builtin-shape pe-builtin-shape--${shape}`} style={{ background: props.fill ?? '#dceee8', borderColor: props.stroke ?? '#2d7d68' }} />;
}

function EquationWidget({ props }: WidgetRuntimeProps<EquationProps>) {
  return <div className="pe-builtin-equation" style={{ color: props.color ?? '#173b37' }}><MathFormulaStatic latex={props.latex ?? String.raw`y = wx + b`} /></div>;
}

export function registerCoreStudioWidgets(registry: WidgetRegistry): WidgetRegistry {
  return registry
    .register({ type: 'studio-table', version: 1, displayName: '表格', Component: TableWidget, capabilities })
    .register({ type: 'studio-chart', version: 1, displayName: '图表', Component: ChartWidget, capabilities })
    .register({ type: 'studio-diagram', version: 1, displayName: '关系图', Component: DiagramWidget, capabilities })
    .register({ type: 'studio-icon', version: 1, displayName: '图标', Component: IconWidget, capabilities })
    .register({ type: 'studio-shape', version: 1, displayName: '形状', Component: ShapeWidget, capabilities })
    .register({ type: 'studio-equation', version: 1, displayName: '公式', Component: EquationWidget, capabilities });
}

export const coreStudioLibraryItems: PresentationLibraryItem[] = [
  { id: 'shape', label: '形状', description: '矩形、圆形与箭头', icon: '◯', group: '插图', kind: 'widget', widgetType: 'studio-shape', defaultSize: { width: 340, height: 210 } },
  { id: 'table', label: '表格', description: '可编辑行列数据', icon: '▦', group: '数据', kind: 'widget', widgetType: 'studio-table', defaultSize: { width: 660, height: 360 } },
  { id: 'icon', label: '图标', description: '常用符号与强调图标', icon: '★', group: '插图', kind: 'widget', widgetType: 'studio-icon', defaultSize: { width: 180, height: 180 } },
  { id: 'chart', label: '图表', description: '柱状、折线与饼图', icon: '▥', group: '数据', kind: 'widget', widgetType: 'studio-chart', defaultSize: { width: 700, height: 430 } },
  { id: 'diagram', label: '关系图', description: '流程与 SmartArt 核心', icon: '◇', group: '插图', kind: 'widget', widgetType: 'studio-diagram', defaultSize: { width: 760, height: 260 } },
  { id: 'equation', label: '公式', description: 'LaTeX 数学公式', icon: 'π', group: '文字', kind: 'widget', widgetType: 'studio-equation', defaultSize: { width: 600, height: 180 } },
];

export function StudioBuiltinProperties({ widgetType, props, onChange }: {
  widgetType: string;
  props: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}) {
  if (widgetType === 'studio-table') {
    const cells = Array.isArray(props.cells) ? props.cells as string[][] : [['项目', '数值'], ['样本 A', '72'], ['样本 B', '86']];
    return <><label className="pe-property-field">表格数据（每行一行，逗号分列）<textarea value={cells.map((row) => row.join(',')).join('\n')} onChange={(event) => onChange({ cells: event.currentTarget.value.split('\n').map((row) => row.split(',').map((cell) => cell.trim())) })} /></label><label className="pe-property-field">表头颜色<input type="color" value={String(props.accent ?? '#1d6258')} onChange={(event) => onChange({ accent: event.currentTarget.value })} /></label></>;
  }
  if (widgetType === 'studio-chart') {
    const labels = Array.isArray(props.labels) ? props.labels as string[] : ['一月', '二月', '三月', '四月'];
    const values = Array.isArray(props.values) ? props.values as number[] : [32, 56, 44, 72];
    return <><label className="pe-property-field">图表类型<select value={String(props.chartType ?? 'bar')} onChange={(event) => onChange({ chartType: event.currentTarget.value })}><option value="bar">柱状图</option><option value="line">折线图</option><option value="pie">饼图</option></select></label><label className="pe-property-field">分类（逗号分隔）<input value={labels.join(',')} onChange={(event) => onChange({ labels: event.currentTarget.value.split(',').map((value) => value.trim()) })} /></label><label className="pe-property-field">数值（逗号分隔）<input value={values.join(',')} onChange={(event) => onChange({ values: event.currentTarget.value.split(',').map((value) => Number(value.trim()) || 0) })} /></label><label className="pe-property-field">主题颜色<input type="color" value={String(props.color ?? '#2d7d68')} onChange={(event) => onChange({ color: event.currentTarget.value })} /></label></>;
  }
  if (widgetType === 'studio-diagram') {
    const nodes = Array.isArray(props.nodes) ? props.nodes as string[] : ['问题', '方法', '结果'];
    return <><label className="pe-property-field">节点（每行一个）<textarea value={nodes.join('\n')} onChange={(event) => onChange({ nodes: event.currentTarget.value.split('\n').map((value) => value.trim()).filter(Boolean) })} /></label><label className="pe-property-field">排列<select value={String(props.direction ?? 'row')} onChange={(event) => onChange({ direction: event.currentTarget.value })}><option value="row">横向流程</option><option value="column">纵向流程</option></select></label></>;
  }
  if (widgetType === 'studio-icon') {
    return <><label className="pe-property-field">图标<select value={String(props.symbol ?? '✓')} onChange={(event) => onChange({ symbol: event.currentTarget.value })}>{['✓', '★', '→', '!', '?', '💡', '⚙', '♥'].map((symbol) => <option key={symbol}>{symbol}</option>)}</select></label><label className="pe-property-field">图标颜色<input type="color" value={String(props.color ?? '#ffffff')} onChange={(event) => onChange({ color: event.currentTarget.value })} /></label><label className="pe-property-field">背景颜色<input type="color" value={String(props.background ?? '#2d7d68')} onChange={(event) => onChange({ background: event.currentTarget.value })} /></label></>;
  }
  if (widgetType === 'studio-shape') {
    return <><label className="pe-property-field">形状<select value={String(props.shape ?? 'rounded')} onChange={(event) => onChange({ shape: event.currentTarget.value })}><option value="rectangle">矩形</option><option value="rounded">圆角矩形</option><option value="ellipse">椭圆</option><option value="arrow">箭头</option></select></label><label className="pe-property-field">填充<input type="color" value={String(props.fill ?? '#dceee8')} onChange={(event) => onChange({ fill: event.currentTarget.value })} /></label><label className="pe-property-field">轮廓<input type="color" value={String(props.stroke ?? '#2d7d68')} onChange={(event) => onChange({ stroke: event.currentTarget.value })} /></label></>;
  }
  if (widgetType === 'studio-equation') {
    return <><label className="pe-property-field">LaTeX 公式<textarea value={String(props.latex ?? String.raw`y = wx + b`)} onChange={(event) => onChange({ latex: event.currentTarget.value })} /></label><label className="pe-property-field">公式颜色<input type="color" value={String(props.color ?? '#173b37')} onChange={(event) => onChange({ color: event.currentTarget.value })} /></label></>;
  }
  return null;
}
