import { useEffect, useId, useRef, useState } from 'react';
import { ContentBlock, Typography } from '../../../shared/react';
import { CodeEditor } from './CodeEditor';
import { NUMPY_INITIAL_CODE, PythonRunner, type PythonGraph, type PythonNode, type PythonOutput } from './pythonRuntime';
import './CodePracticePage.css';

export function CodePracticePage() {
  const marker = useId().replace(/:/g, '');
  const [code, setCode] = useState(NUMPY_INITIAL_CODE), [runKey, setRunKey] = useState(0);
  const [graph, setGraph] = useState<PythonGraph | null>(null), [result, setResult] = useState<PythonOutput | null>(null);
  const [error, setError] = useState(''), [errorLine, setErrorLine] = useState<number>();
  const [consoleText, setConsoleText] = useState(''), [showConsole, setShowConsole] = useState(false);
  const [running, setRunning] = useState(false), [status, setStatus] = useState('准备 Python');
  const [selected, setSelected] = useState(''), [selectedLine, setSelectedLine] = useState<number>();
  const [activeIds, setActiveIds] = useState<string[]>([]);
  const [selectedRange, setSelectedRange] = useState<Pick<PythonNode, 'line' | 'column' | 'endLine' | 'endColumn'>>();
  const [inspectOpen, setInspectOpen] = useState(false), [showValues, setShowValues] = useState(false);
  const [graphWidth, setGraphWidth] = useState(674);
  const runner = useRef<PythonRunner | null>(null), board = useRef<HTMLDivElement>(null);
  const revision = useRef(0), alive = useRef(false), busy = useRef(false);
  const source = useRef(code), timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  source.current = code;
  useEffect(() => {
    alive.current = true;
    runner.current = new PythonRunner(message => { if (alive.current) setStatus(message); });
    return () => { alive.current = false; revision.current++; clearTimeout(timer.current); runner.current?.stop(); runner.current = null; };
  }, []);
  useEffect(() => {
    if (!board.current) return;
    const observer = new ResizeObserver(([entry]) => setGraphWidth(entry.contentRect.width));
    observer.observe(board.current); return () => observer.disconnect();
  }, [graph]);
  async function execute(manual = false) {
    clearTimeout(timer.current);
    if (busy.current || !runner.current) return;
    const token = ++revision.current;
    busy.current = true; setRunning(true); setStatus('正在执行 Python');
    setGraph(null); setResult(null); setError(''); setErrorLine(undefined); setConsoleText(''); setShowConsole(false);
    try {
      const execution = await runner.current.run(source.current);
      if (!alive.current || token !== revision.current) return;
      setError(execution.error ?? ''); setErrorLine(execution.line);
      setGraph(execution.ok ? execution.graph : null); setResult(execution.ok ? execution.result : null);
      const text = execution.stdout + execution.stderr + (execution.traceback ?? '');
      const summary = manual && !text && execution.result
        ? `输出形状：(${execution.result.shape.join(', ')})\n${execution.result.preview.map(row => row.map(n => n.toFixed(4)).join('  ')).join('\n')}` : text;
      setConsoleText(summary); setShowConsole(Boolean(text) || manual);
      setStatus(execution.ok ? 'Python 已运行' : 'Python 运行出错');
    } catch (e) {
      if (!alive.current || token !== revision.current) return;
      const message = e instanceof Error ? e.message : String(e);
      setError(message); setConsoleText(message); setShowConsole(true); setGraph(null); setResult(null); setStatus('运行已停止');
    } finally {
      if (alive.current && token === revision.current) { busy.current = false; setRunning(false); }
    }
  }
  useEffect(() => {
    timer.current = setTimeout(() => { void execute(); }, 350);
    return () => clearTimeout(timer.current);
    // The runtime executes the current source after typing pauses.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, runKey]);
  function stop() {
    revision.current++; clearTimeout(timer.current); runner.current?.stop(); busy.current = false;
    setRunning(false); setGraph(null); setResult(null); setStatus('运行已停止');
  }
  function edit(text: string) {
    revision.current++;
    if (busy.current) runner.current?.stop('代码已更新');
    busy.current = false; setRunning(false); setCode(text); setRunKey(key => key + 1);
    setGraph(null); setResult(null); setError(''); setErrorLine(undefined); setConsoleText(''); setShowConsole(false); setStatus('等待执行');
    setSelected(''); setSelectedLine(undefined); setActiveIds([]); setSelectedRange(undefined); setInspectOpen(false); setShowValues(false);
  }
  function reset() { edit(NUMPY_INITIAL_CODE); setSelected(''); setSelectedLine(undefined); }
  const nodes = graph?.nodes ?? [];
  const centerX = Math.round(graphWidth / 2 - 14);
  const positions: Record<string, { x: number; y: number }> = { input: { x: centerX, y: 36 } };
  nodes.forEach((node, index) => { positions[node.id] = { x: centerX, y: 108 + index * 72 }; });
  positions.output = { x: centerX, y: 108 + nodes.length * 72 };
  const height = positions.output.y + 40;
  const nodeById = new Map(nodes.map(node => [node.id, node]));
  const halfHeight = (id: string) => nodeById.get(id)?.kind === 'Add' ? 25 : 23;
  const halfWidth = (id: string) => id === 'input' ? 134 : id === 'output' ? 72 : nodeById.get(id)?.kind === 'Add' ? 25 : nodeById.get(id)?.kind === 'ReLU' ? 72 : 86;
  const selectedNode = nodeById.get(selected);
  function select(id: string) {
    const node = nodeById.get(id);
    setSelected(id); setActiveIds([id]); setSelectedLine(node?.line);
    setSelectedRange(node ? { line: node.line, column: node.column, endLine: node.endLine, endColumn: node.endColumn } : undefined);
    setInspectOpen(Boolean(node)); setShowValues(false);
  }
  function codeCursor(line: number, column: number) {
    setSelectedLine(undefined); setSelectedRange(undefined);
    const onLine = nodes.filter(node => node.line <= line && node.endLine >= line);
    const containing = onLine.filter(node => (line > node.line || column >= node.column) && (line < node.endLine || column < node.endColumn));
    const size = (node: PythonNode) => (node.endLine - node.line) * 10000 + node.endColumn - node.column;
    const minimum = containing.length ? Math.min(...containing.map(size)) : undefined;
    const matches = minimum === undefined ? onLine : containing.filter(node => size(node) === minimum);
    setActiveIds(matches.map(node => node.id)); setSelected(matches[0]?.id ?? ''); setInspectOpen(false);
  }
  useEffect(() => {
    const node = board.current?.querySelector<HTMLElement>(`[data-node-id="${selected}"]`);
    const viewport = board.current?.parentElement;
    if (!node || !viewport) return;
    const top = node.offsetTop - node.offsetHeight / 2, bottom = top + node.offsetHeight;
    if (top < viewport.scrollTop || bottom > viewport.scrollTop + viewport.clientHeight) viewport.scrollTop = Math.max(0, top - viewport.clientHeight / 2);
  }, [selected, inspectOpen, showValues]);
  return <ContentBlock className="code-lab-page" data-capture-ready={Boolean(result) || Boolean(error) || status === '运行已停止'} headingLevel={1} title="通过编程实践，检验对网络结构的理解" subtitle="以残差连接为例，修改代码并观察网络结构、张量形状与计算结果的变化" bodyClassName="code-lab-body" onKeyDown={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
    <div className="code-lab-workspace">
      <div className="code-lab-toolbar">
        <div className="code-lab-file"><span className="code-lab-python" aria-hidden="true">Py</span><span>residual_block.py</span><span className="code-lab-file-dot">●</span></div>
        <span className={`code-lab-sync ${error ? 'is-invalid' : ''}`} role="status" title="CPython / NumPy；course_ops 提供 tensor、conv2d、relu 简单算子。">{running ? status : error ? 'Python 运行出错' : status}</span>
        <div className="code-lab-actions"><button type="button" className="code-lab-run" title="Ctrl+Enter 运行" onClick={() => running ? stop() : void execute(true)}>{running ? '■ 停止' : '▶ 运行'}</button><button type="button" className="code-lab-reset" aria-label="重置" onClick={reset}>↻ 重置</button></div>
      </div>
      <div className="code-lab-layout">
        <section className="code-lab-left" aria-label="网络代码">
          <div className="code-lab-editor">
            <CodeEditor value={code} onChange={edit} onCursor={codeCursor} selectedLine={selectedLine} selectedRange={selectedRange} errorLine={errorLine} errorMessage={error} onRun={() => { if (!busy.current) void execute(true); }}/>
            {showConsole && <div className={`code-lab-console ${error ? 'is-error' : ''}`} aria-label="Python 控制台"><div className="code-lab-console-header"><span>控制台</span><button type="button" aria-label="清空控制台" onClick={() => { setConsoleText(''); setShowConsole(false); }}>清空</button></div><pre role={error ? 'alert' : 'log'}>{consoleText || '程序执行完成。'}</pre></div>}
          </div>
        </section>
        <section className="code-lab-right" aria-label="运行得到的网络结构">
          {graph && <>
            <div className="code-lab-graph-heading"><Typography as="h2" variant="body">网络结构</Typography><span className="code-lab-readonly-label">来自实际执行</span></div>
            <div className="code-lab-graph-area">
              <div ref={board} className="code-lab-diagram" style={{ height }}>
                <svg className="code-lab-wires" viewBox={`0 0 ${graphWidth} ${height}`} aria-hidden="true">
                  <defs><marker id={`${marker}-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M2 2L8 5L2 8"/></marker><marker id={`${marker}-blue-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M2 2L8 5L2 8"/></marker></defs>
                  {nodes.flatMap(node => node.inputs.map((input, index) => {
                    const from = positions[input], to = positions[node.id];
                    if (!from) return null;
                    const shortcut = node.kind === 'Add' && index === 1;
                    const routeX = Math.min(graphWidth - 160, Math.max(from.x + halfWidth(input) + 36, to.x + 148));
                    const path = shortcut ? `M${from.x + halfWidth(input)} ${from.y} H${routeX - 10} Q${routeX} ${from.y} ${routeX} ${from.y + 10} V${to.y - 10} Q${routeX} ${to.y} ${routeX - 10} ${to.y} H${to.x + halfWidth(node.id)}` : `M${from.x} ${from.y + halfHeight(input)} C${from.x} ${from.y + halfHeight(input) + 12} ${to.x} ${to.y - halfHeight(node.id) - 12} ${to.x} ${to.y - halfHeight(node.id)}`;
                    return <path key={`${node.id}-${index}`} d={path} className={`${shortcut ? 'shortcut' : ''} ${activeIds.includes(node.id) || activeIds.includes(input) ? 'is-active' : ''}`} markerEnd={`url(#${marker}-${shortcut ? 'blue-' : ''}arrow)`}/>;
                  }))}
                  <path markerEnd={`url(#${marker}-arrow)`} d={`M${positions[graph.output].x} ${positions[graph.output].y + halfHeight(graph.output)} L${positions.output.x} ${positions.output.y - 23}`}/>
                </svg>
                {nodes.filter(node => node.kind === 'Add' && node.inputs.length > 1).map(node => {
                  const from = positions[node.inputs[1]], to = positions[node.id];
                  if (!from) return null;
                  const routeX = Math.min(graphWidth - 160, Math.max(from.x + halfWidth(node.inputs[1]) + 36, to.x + 148));
                  return <Typography key={`label-${node.id}`} as="span" variant="body" className="code-lab-shortcut-label" style={{ left: routeX + 20, top: (from.y + to.y) / 2 - 22 }}>捷径连接</Typography>;
                })}
                {['input', ...nodes.map(node => node.id), 'output'].map(id => {
                  const node = nodeById.get(id), position = positions[id];
                  const label = id === 'input' ? '输入' : id === 'output' ? '输出' : node!.kind === 'Conv' ? `Conv ${node!.layer!.kernel} × ${node!.layer!.kernel}` : node!.kind;
                  return <div key={id} data-node-id={id} style={{ left: position.x, top: position.y, width: halfWidth(id) * 2, height: halfHeight(id) * 2 }} className={`code-lab-node ${node?.kind === 'ReLU' ? 'is-relu' : ''} ${node?.kind === 'Add' ? 'is-add' : ''} ${!node ? 'is-terminal' : ''} ${activeIds.includes(id) ? 'is-selected' : ''}`} role="button" tabIndex={0} aria-pressed={activeIds.includes(id)} aria-label={`${label} ${id}`} title={id === 'output' && result ? `输出形状：${result.shape.join(' × ')}；均值：${result.mean.toFixed(5)}` : node ? `执行于第 ${node.line} 行；形状：${node.shape.join(' × ')}` : undefined} onClick={() => select(id)} onKeyDown={e => { if (e.key === 'Enter') select(id); }}>
                    <div className="node-surface"><Typography as="span" variant="body" className={node?.kind === 'Add' ? 'plus' : ''}>{node?.kind === 'Add' ? '+' : label}</Typography>{id === 'input' && <Typography as="span" variant="body" className="code-lab-input-shape">{graph.inputShape.length === 4 ? `${graph.inputShape[2]} × ${graph.inputShape[3]} × ${graph.inputShape[1]}` : graph.inputShape.join(' × ')}</Typography>}</div>
                    {node?.kind === 'Add' && <Typography as="span" variant="body" className="add-label">Add</Typography>}
                  </div>;
                })}
              </div>
            </div>
            {inspectOpen && selectedNode && <section className="code-lab-inspector" aria-label="算子运行详情">
              <div className="code-lab-inspector-heading"><Typography as="strong" variant="body">{selectedNode.kind === 'Conv' ? '卷积' : selectedNode.kind === 'Add' ? '相加' : selectedNode.kind} · 第 {selectedNode.line} 行</Typography><button type="button" aria-label="关闭算子详情" onClick={() => setInspectOpen(false)}>×</button></div>
              <Typography as="p" variant="body">输入：{selectedNode.inputShapes.map(shape => shape.length ? shape.join(' × ') : '标量').join('，')}</Typography>
              <Typography as="p" variant="body">输出：{selectedNode.shape.join(' × ') || '标量'}<span className="code-lab-dtype">{selectedNode.dtype}</span></Typography>
              <button type="button" className="code-lab-values-toggle" aria-expanded={showValues} onClick={() => setShowValues(value => !value)}>{showValues ? '收起数值' : '查看输出数值'}</button>
              {showValues && <div className="code-lab-preview" aria-label="算子实际输出数值">{selectedNode.preview.map((row, index) => <div key={index}>{row.map((value, col) => <span key={col}>{value.toFixed(3)}</span>)}</div>)}</div>}
            </section>}
          </>}
        </section>
      </div>
    </div>
  </ContentBlock>;
}
