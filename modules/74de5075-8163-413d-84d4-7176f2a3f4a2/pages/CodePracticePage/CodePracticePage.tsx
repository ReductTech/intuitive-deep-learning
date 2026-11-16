import { useEffect, useId, useRef, useState } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import { CodeEditor } from './CodeEditor';
import { NUMPY_INITIAL_CODE, PythonRunner, type PythonGraph, type PythonNode, type PythonOutput } from './pythonRuntime';
import './CodePracticePage.css';

export function CodePracticePage({autoRunOnEdit=true,parallelBranches=false}:{autoRunOnEdit?:boolean;parallelBranches?:boolean}={}) {
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
    if(!autoRunOnEdit&&(code!==NUMPY_INITIAL_CODE||runKey>0))return;
    timer.current = setTimeout(() => { void execute(); }, 350);
    return () => clearTimeout(timer.current);
    // The runtime executes the current source after typing pauses.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, runKey,autoRunOnEdit]);
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
  const roots=nodes.filter(node=>node.kind==='Conv'&&node.inputs.includes('input'));
  if(parallelBranches&&roots.length>1){
    const depths=new Map<string,number>([['input',0]]),lanes=new Map<string,number>();
    roots.forEach((node,i)=>lanes.set(node.id,i));
    nodes.forEach(node=>{
      const depth=1+Math.max(0,...node.inputs.map(input=>depths.get(input)??0));depths.set(node.id,depth);
      if(node.kind!=='Add'&&!lanes.has(node.id)){
        const lane=node.inputs.map(input=>lanes.get(input)).find(value=>value!==undefined);if(lane!==undefined)lanes.set(node.id,lane);
      }
      const lane=lanes.get(node.id);
      positions[node.id]={x:lane===undefined?centerX:centerX+(lane-(roots.length-1)/2)*230,y:38+depth*70};
    });
    positions.output={x:centerX,y:38+((depths.get(graph?.output??'')??nodes.length)+1)*70};
  }
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
  return <ContentBlock shuku-edit-id="e-1a34f08c-f433-4273-a44c-e1994a5e2036" className="code-lab-page" data-capture-ready={Boolean(result) || Boolean(error) || status === '运行已停止'} headingLevel={1} title="通过编程实践，检验对网络结构的理解" subtitle="以残差连接为例，修改代码并观察网络结构、张量形状与计算结果的变化" bodyClassName="code-lab-body" onKeyDown={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
    <div shuku-edit-id="e-21585f4a-0968-450d-807b-470be7dd1a8c" className="code-lab-workspace">
      <div shuku-edit-id="e-c9d2ce2c-a1fe-46de-9615-c95c4ccd1e82" className="code-lab-toolbar">
        <div shuku-edit-id="e-3373f45b-9bac-45f5-8edf-6d1e8b313065" className="code-lab-file"><span shuku-edit-id="e-2bfa14d8-bfa1-46c2-9cb8-760eac48ed3f" className="code-lab-python" aria-hidden="true">Py</span><span shuku-edit-id="e-f0fc5a67-ec18-45dc-9c54-70efe4f8f0cf">residual_block.py</span><span shuku-edit-id="e-cfdaaede-f7d6-4092-bb78-a8e295238d17" className="code-lab-file-dot">●</span></div>
        <span shuku-edit-id="e-bdbe1ed5-ddad-4fb1-a19f-5489fbb85aee" className={`code-lab-sync ${error ? 'is-invalid' : ''}`} role="status" title="CPython / NumPy；course_ops 提供 tensor、conv2d、relu 简单算子。">{running ? status : error ? 'Python 运行出错' : status}</span>
        <div shuku-edit-id="e-5751185a-861e-4af7-81c5-7fbbc4512c69" className="code-lab-actions"><button shuku-edit-id="e-87518b17-86e5-484a-a392-97d068fd1b6d" type="button" className="code-lab-run" title="Ctrl+Enter 运行" onClick={() => running ? stop() : void execute(true)}>{running ? '■ 停止' : error ? '↻ 重试' : '▶ 运行'}</button><button shuku-edit-id="e-36eedf04-0849-46a2-af90-c8dc1044cc53" type="button" className="code-lab-reset" aria-label="重置" onClick={reset}>↻ 重置</button></div>
      </div>
      <div shuku-edit-id="e-d797071e-8e3b-402a-85cc-a663fda66da4" className="code-lab-layout">
        <section shuku-edit-id="e-93fbf2f7-7f21-4e7a-9503-67ce7a4b9d5e" className="code-lab-left" aria-label="网络代码">
          <div shuku-edit-id="e-1c782026-3e22-4703-bfa3-57226fa85779" className="code-lab-editor">
            <CodeEditor value={code} onChange={edit} onCursor={codeCursor} selectedLine={selectedLine} selectedRange={selectedRange} errorLine={errorLine} errorMessage={error} onRun={() => { if (!busy.current) void execute(true); }}/>
            {showConsole && <div shuku-edit-id="e-ed382eb0-3933-4cc1-92e0-d7f74041099e" className={`code-lab-console ${error ? 'is-error' : ''}`} aria-label="Python 控制台"><div shuku-edit-id="e-b9582d5f-6324-4c39-913a-289970deeee8" className="code-lab-console-header"><span shuku-edit-id="e-ab924f12-71bb-4804-9191-4126cede7d18">控制台</span><button shuku-edit-id="e-510b56e1-6978-46cc-9543-037c7171dbce" type="button" aria-label="清空控制台" onClick={() => { setConsoleText(''); setShowConsole(false); }}>清空</button></div><pre shuku-edit-id="e-720179b7-6ce7-4647-a27e-eeac22cd56ae" role={error ? 'alert' : 'log'}>{consoleText || '程序执行完成。'}</pre></div>}
          </div>
        </section>
        <section shuku-edit-id="e-cbcb5c63-9b12-4e4c-ad7c-a46048781c75" className="code-lab-right" aria-label="运行得到的网络结构">
          {graph && <>
            <div shuku-edit-id="e-eb999b10-20e4-415a-9baf-4b11cb6d15f9" className="code-lab-graph-heading"><Typography shuku-edit-id="e-19e8aa03-cc4e-4bb5-849c-0f40ff9cd9cc" as="h2" variant="body">网络结构</Typography><span shuku-edit-id="e-32e0473e-2eea-4ade-bce2-296b1a7ed1b4" className="code-lab-readonly-label">来自实际执行</span></div>
            <div shuku-edit-id="e-1cce6220-0fd2-404a-bd63-bf6c100f6e84" className="code-lab-graph-area">
              <div shuku-edit-id="e-2962f21a-2d4b-4525-86ca-bff5f24fff78" ref={board} className="code-lab-diagram" style={{ height }}>
                <svg shuku-edit-id="e-ad58a1d9-91c2-48f6-98d2-a3ebcc456063" className="code-lab-wires" viewBox={`0 0 ${graphWidth} ${height}`} aria-hidden="true">
                  <defs shuku-edit-id="e-64f0e287-dec1-4d3f-a655-26eb1cc7ca00"><marker shuku-edit-id="e-2b365c00-3120-417b-8448-7a59d4ca7a55" id={`${marker}-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path shuku-edit-id="e-bd608816-d3f4-433a-85cd-5f9cf15aafa0" d="M2 2L8 5L2 8"/></marker><marker shuku-edit-id="e-bd1f6a27-ae35-4793-9130-67d3dcc34022" id={`${marker}-blue-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path shuku-edit-id="e-12ffabf2-cc28-4810-a7da-8186d0ddb7fa" d="M2 2L8 5L2 8"/></marker></defs>
                  {nodes.flatMap(node => node.inputs.map((input, index) => {
                    const from = positions[input], to = positions[node.id];
                    if (!from) return null;
                    const shortcut = node.kind === 'Add' && index === 1 && (!parallelBranches||input==='input');
                    const routeX = Math.min(graphWidth - 160, Math.max(from.x + halfWidth(input) + 36, to.x + 148));
                    const path = shortcut ? `M${from.x + halfWidth(input)} ${from.y} H${routeX - 10} Q${routeX} ${from.y} ${routeX} ${from.y + 10} V${to.y - 10} Q${routeX} ${to.y} ${routeX - 10} ${to.y} H${to.x + halfWidth(node.id)}` : `M${from.x} ${from.y + halfHeight(input)} C${from.x} ${from.y + halfHeight(input) + 12} ${to.x} ${to.y - halfHeight(node.id) - 12} ${to.x} ${to.y - halfHeight(node.id)}`;
                    return <path shuku-edit-id="e-717ec9a6-b431-4c12-a440-fe7b6f88ab6e" key={`${node.id}-${index}`} d={path} className={`${shortcut ? 'shortcut' : ''} ${activeIds.includes(node.id) || activeIds.includes(input) ? 'is-active' : ''}`} markerEnd={`url(#${marker}-${shortcut ? 'blue-' : ''}arrow)`}/>;
                  }))}
                  <path shuku-edit-id="e-0cf6f60b-c752-4099-bf22-c49c7b871e41" markerEnd={`url(#${marker}-arrow)`} d={`M${positions[graph.output].x} ${positions[graph.output].y + halfHeight(graph.output)} L${positions.output.x} ${positions.output.y - 23}`}/>
                </svg>
                {nodes.filter(node => node.kind === 'Add' && node.inputs.length > 1 && (!parallelBranches||node.inputs[1]==='input')).map(node => {
                  const from = positions[node.inputs[1]], to = positions[node.id];
                  if (!from) return null;
                  const routeX = Math.min(graphWidth - 160, Math.max(from.x + halfWidth(node.inputs[1]) + 36, to.x + 148));
                  return <Typography shuku-edit-id="e-fcf5f96d-2be0-4459-8e8a-3fb74bb3a428" key={`label-${node.id}`} as="span" variant="body" className="code-lab-shortcut-label" style={{ left: routeX + 20, top: (from.y + to.y) / 2 - 22 }}>捷径连接</Typography>;
                })}
                {['input', ...nodes.map(node => node.id), 'output'].map(id => {
                  const node = nodeById.get(id), position = positions[id];
                  const label = id === 'input' ? '输入' : id === 'output' ? '输出' : node!.kind === 'Conv' ? `Conv ${node!.layer!.kernel} × ${node!.layer!.kernel}` : node!.kind;
                  return <div shuku-edit-id="e-4325dc65-412b-4226-ab5a-934566a53e98" key={id} data-node-id={id} style={{ left: position.x, top: position.y, width: halfWidth(id) * 2, height: halfHeight(id) * 2 }} className={`code-lab-node ${node?.kind === 'ReLU' ? 'is-relu' : ''} ${node?.kind === 'Add' ? 'is-add' : ''} ${!node ? 'is-terminal' : ''} ${activeIds.includes(id) ? 'is-selected' : ''}`} role="button" tabIndex={0} aria-pressed={activeIds.includes(id)} aria-label={`${label} ${id}`} title={id === 'output' && result ? `输出形状：${result.shape.join(' × ')}；均值：${result.mean.toFixed(5)}` : node ? `执行于第 ${node.line} 行；形状：${node.shape.join(' × ')}` : undefined} onClick={() => select(id)} onKeyDown={e => { if (e.key === 'Enter') select(id); }}>
                    <div shuku-edit-id="e-686ec8a3-76bf-4a2d-9bf2-cf762a659d75" className="node-surface"><Typography shuku-edit-id="e-10967a1a-2382-47e7-b7d4-0f28343bfac7" as="span" variant="body" className={node?.kind === 'Add' ? 'plus' : ''}>{node?.kind === 'Add' ? '+' : label}</Typography>{id === 'input' && <Typography shuku-edit-id="e-4d43f5a6-92c9-434b-ac45-77999f0b90bb" as="span" variant="body" className="code-lab-input-shape">{graph.inputShape.length === 4 ? `${graph.inputShape[2]} × ${graph.inputShape[3]} × ${graph.inputShape[1]}` : graph.inputShape.join(' × ')}</Typography>}</div>
                    {node?.kind === 'Add' && <Typography shuku-edit-id="e-e877ec87-cba5-4261-8750-2b3671c9a2bc" as="span" variant="body" className="add-label">Add</Typography>}
                  </div>;
                })}
              </div>
            </div>
            {inspectOpen && selectedNode && <section shuku-edit-id="e-b3819374-933e-4fcc-829b-8012dda40287" className="code-lab-inspector" aria-label="算子运行详情">
              <div shuku-edit-id="e-896cb35b-387f-46ac-8df7-635e8a09ed73" className="code-lab-inspector-heading"><Typography shuku-edit-id="e-2f328ddb-c5cd-4342-a028-cc82ecff18a6" as="strong" variant="body">{selectedNode.kind === 'Conv' ? '卷积' : selectedNode.kind === 'Add' ? '相加' : selectedNode.kind} · 第 {selectedNode.line} 行</Typography><button shuku-edit-id="e-9a6e3931-1982-4a12-a1b3-d38b21038b13" type="button" aria-label="关闭算子详情" onClick={() => setInspectOpen(false)}>×</button></div>
              <Typography shuku-edit-id="e-2b0e82f7-af3e-4865-bd4c-af8ef6f3c0e7" as="p" variant="body">输入：{selectedNode.inputShapes.map(shape => shape.length ? shape.join(' × ') : '标量').join('，')}</Typography>
              <Typography shuku-edit-id="e-a025db24-2b46-48e2-a93c-64a936e13869" as="p" variant="body">输出：{selectedNode.shape.join(' × ') || '标量'}<span shuku-edit-id="e-524ee42a-6a84-4fe5-8921-18c88e6cf0d6" className="code-lab-dtype">{selectedNode.dtype}</span></Typography>
              <button shuku-edit-id="e-aa5257e7-ff33-4718-a9ba-fc3191a48352" type="button" className="code-lab-values-toggle" aria-expanded={showValues} onClick={() => setShowValues(value => !value)}>{showValues ? '收起数值' : '查看输出数值'}</button>
              {showValues && <div shuku-edit-id="e-6fc5cf53-8770-4ad7-ad31-16224b9fce57" className="code-lab-preview" aria-label="算子实际输出数值">{selectedNode.preview.map((row, index) => <div shuku-edit-id="e-e4c05af1-e898-44aa-a366-af529a90c0a6" key={index}>{row.map((value, col) => <span shuku-edit-id="e-2e7067c4-f410-4a45-8f72-e3d25b2c6381" key={col}>{value.toFixed(3)}</span>)}</div>)}</div>}
            </section>}
          </>}
        </section>
      </div>
    </div>
  </ContentBlock>;
}
