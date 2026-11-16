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
  return <ContentBlock shuku-edit-id="e-8679b3e6-56f3-4135-b2e4-28a78f6be1b9" className="code-lab-page" data-capture-ready={Boolean(result) || Boolean(error) || status === '运行已停止'} headingLevel={1} title="通过编程实践，检验对网络结构的理解" subtitle="以残差连接为例，修改代码并观察网络结构、张量形状与计算结果的变化" bodyClassName="code-lab-body" onKeyDown={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
    <div shuku-edit-id="e-5334b7a9-1721-464f-8438-115da086691d" className="code-lab-workspace">
      <div shuku-edit-id="e-7237af98-bc6a-47b0-8eac-385fb355c141" className="code-lab-toolbar">
        <div shuku-edit-id="e-fed98172-d851-410b-aad9-b7bc3fb95dd3" className="code-lab-file"><span shuku-edit-id="e-17e1f165-7f8d-4378-9af2-363915269302" className="code-lab-python" aria-hidden="true">Py</span><span shuku-edit-id="e-2af50472-c447-4866-a3f5-d141c17f9563">residual_block.py</span><span shuku-edit-id="e-57c1b37f-8334-4c07-9dea-ee5aef2a9a5c" className="code-lab-file-dot">●</span></div>
        <span shuku-edit-id="e-d6b1d445-1adc-4f3c-8bf5-12c2c4859beb" className={`code-lab-sync ${error ? 'is-invalid' : ''}`} role="status" title="CPython / NumPy；course_ops 提供 tensor、conv2d、relu 简单算子。">{running ? status : error ? 'Python 运行出错' : status}</span>
        <div shuku-edit-id="e-5465608e-6260-49d9-9c7d-c8cc642b2229" className="code-lab-actions"><button shuku-edit-id="e-4d00e743-4d10-4209-8b83-8fbe6554ce5e" type="button" className="code-lab-run" title="Ctrl+Enter 运行" onClick={() => running ? stop() : void execute(true)}>{running ? '■ 停止' : error ? '↻ 重试' : '▶ 运行'}</button><button shuku-edit-id="e-e783867f-4365-493e-9e0e-6cd0d7abc2a6" type="button" className="code-lab-reset" aria-label="重置" onClick={reset}>↻ 重置</button></div>
      </div>
      <div shuku-edit-id="e-4c7267f6-f86b-4fba-97c5-5e80982e10dc" className="code-lab-layout">
        <section shuku-edit-id="e-b1f92427-6bbd-4009-b3d3-d89c5253a1e9" className="code-lab-left" aria-label="网络代码">
          <div shuku-edit-id="e-86c6ba8f-5496-47b2-99f7-76c83701c4e6" className="code-lab-editor">
            <CodeEditor value={code} onChange={edit} onCursor={codeCursor} selectedLine={selectedLine} selectedRange={selectedRange} errorLine={errorLine} errorMessage={error} onRun={() => { if (!busy.current) void execute(true); }}/>
            {showConsole && <div shuku-edit-id="e-7601642f-1599-4528-b7e7-3883cbe743f0" className={`code-lab-console ${error ? 'is-error' : ''}`} aria-label="Python 控制台"><div shuku-edit-id="e-c956f2fb-636e-472c-89c2-95d423559f40" className="code-lab-console-header"><span shuku-edit-id="e-e98e9b08-b065-483e-b207-e050880d9acc">控制台</span><button shuku-edit-id="e-0b2e3826-d7d0-44b3-961a-93f477af4693" type="button" aria-label="清空控制台" onClick={() => { setConsoleText(''); setShowConsole(false); }}>清空</button></div><pre shuku-edit-id="e-6d714d32-965d-4e92-851c-9f265423c7e8" role={error ? 'alert' : 'log'}>{consoleText || '程序执行完成。'}</pre></div>}
          </div>
        </section>
        <section shuku-edit-id="e-dff2afa0-c87b-4432-9af9-f6f90fef7ea5" className="code-lab-right" aria-label="运行得到的网络结构">
          {graph && <>
            <div shuku-edit-id="e-e775bef8-9b47-47df-bdf2-a8525dfdd920" className="code-lab-graph-heading"><Typography shuku-edit-id="e-b8ab38f2-032f-4e8c-86b7-ebbc0f2d1302" as="h2" variant="body">网络结构</Typography><span shuku-edit-id="e-2d9040cb-cb37-4d9f-b272-5aa591ff3dc7" className="code-lab-readonly-label">来自实际执行</span></div>
            <div shuku-edit-id="e-ed6f4e50-381f-4753-9759-4098bda3247a" className="code-lab-graph-area">
              <div shuku-edit-id="e-d428d732-a04e-4683-8439-711e6815dead" ref={board} className="code-lab-diagram" style={{ height }}>
                <svg shuku-edit-id="e-166ff43a-ab61-4220-970d-5f3dad4d5e36" className="code-lab-wires" viewBox={`0 0 ${graphWidth} ${height}`} aria-hidden="true">
                  <defs shuku-edit-id="e-19fa8243-7821-4f4f-b8c9-e4f6e0e9a28f"><marker shuku-edit-id="e-ba751847-afc4-46dd-a188-c0f073f7295e" id={`${marker}-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path shuku-edit-id="e-bda40b5f-386c-47c4-959f-18ccb9206625" d="M2 2L8 5L2 8"/></marker><marker shuku-edit-id="e-798f9f53-34d7-4194-ac16-9e1bdfbd6f58" id={`${marker}-blue-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path shuku-edit-id="e-7ebddd63-d95e-46cf-83bf-e9a3b9f8c0b1" d="M2 2L8 5L2 8"/></marker></defs>
                  {nodes.flatMap(node => node.inputs.map((input, index) => {
                    const from = positions[input], to = positions[node.id];
                    if (!from) return null;
                    const shortcut = node.kind === 'Add' && index === 1 && (!parallelBranches||input==='input');
                    const routeX = Math.min(graphWidth - 160, Math.max(from.x + halfWidth(input) + 36, to.x + 148));
                    const path = shortcut ? `M${from.x + halfWidth(input)} ${from.y} H${routeX - 10} Q${routeX} ${from.y} ${routeX} ${from.y + 10} V${to.y - 10} Q${routeX} ${to.y} ${routeX - 10} ${to.y} H${to.x + halfWidth(node.id)}` : `M${from.x} ${from.y + halfHeight(input)} C${from.x} ${from.y + halfHeight(input) + 12} ${to.x} ${to.y - halfHeight(node.id) - 12} ${to.x} ${to.y - halfHeight(node.id)}`;
                    return <path shuku-edit-id="e-f2e847e8-0eba-457b-9bde-ba4ef36b4d73" key={`${node.id}-${index}`} d={path} className={`${shortcut ? 'shortcut' : ''} ${activeIds.includes(node.id) || activeIds.includes(input) ? 'is-active' : ''}`} markerEnd={`url(#${marker}-${shortcut ? 'blue-' : ''}arrow)`}/>;
                  }))}
                  <path shuku-edit-id="e-0ae17c06-defb-483f-917b-ccb0dc91cef6" markerEnd={`url(#${marker}-arrow)`} d={`M${positions[graph.output].x} ${positions[graph.output].y + halfHeight(graph.output)} L${positions.output.x} ${positions.output.y - 23}`}/>
                </svg>
                {nodes.filter(node => node.kind === 'Add' && node.inputs.length > 1 && (!parallelBranches||node.inputs[1]==='input')).map(node => {
                  const from = positions[node.inputs[1]], to = positions[node.id];
                  if (!from) return null;
                  const routeX = Math.min(graphWidth - 160, Math.max(from.x + halfWidth(node.inputs[1]) + 36, to.x + 148));
                  return <Typography shuku-edit-id="e-95320c47-ba5d-4b72-8697-a769bb430080" key={`label-${node.id}`} as="span" variant="body" className="code-lab-shortcut-label" style={{ left: routeX + 20, top: (from.y + to.y) / 2 - 22 }}>捷径连接</Typography>;
                })}
                {['input', ...nodes.map(node => node.id), 'output'].map(id => {
                  const node = nodeById.get(id), position = positions[id];
                  const label = id === 'input' ? '输入' : id === 'output' ? '输出' : node!.kind === 'Conv' ? `Conv ${node!.layer!.kernel} × ${node!.layer!.kernel}` : node!.kind;
                  return <div shuku-edit-id="e-2f48e0bc-29ea-4b7a-9963-f34381780340" key={id} data-node-id={id} style={{ left: position.x, top: position.y, width: halfWidth(id) * 2, height: halfHeight(id) * 2 }} className={`code-lab-node ${node?.kind === 'ReLU' ? 'is-relu' : ''} ${node?.kind === 'Add' ? 'is-add' : ''} ${!node ? 'is-terminal' : ''} ${activeIds.includes(id) ? 'is-selected' : ''}`} role="button" tabIndex={0} aria-pressed={activeIds.includes(id)} aria-label={`${label} ${id}`} title={id === 'output' && result ? `输出形状：${result.shape.join(' × ')}；均值：${result.mean.toFixed(5)}` : node ? `执行于第 ${node.line} 行；形状：${node.shape.join(' × ')}` : undefined} onClick={() => select(id)} onKeyDown={e => { if (e.key === 'Enter') select(id); }}>
                    <div shuku-edit-id="e-ffa53037-c243-4c9a-b5cb-788f2b97edbf" className="node-surface"><Typography shuku-edit-id="e-7b04388a-ac6d-457d-881a-68b9670f0149" as="span" variant="body" className={node?.kind === 'Add' ? 'plus' : ''}>{node?.kind === 'Add' ? '+' : label}</Typography>{id === 'input' && <Typography shuku-edit-id="e-124c88b4-050b-48ad-8c5f-bcc296a15870" as="span" variant="body" className="code-lab-input-shape">{graph.inputShape.length === 4 ? `${graph.inputShape[2]} × ${graph.inputShape[3]} × ${graph.inputShape[1]}` : graph.inputShape.join(' × ')}</Typography>}</div>
                    {node?.kind === 'Add' && <Typography shuku-edit-id="e-a6fe6ea2-0dc7-42e2-89be-3ef6b764de77" as="span" variant="body" className="add-label">Add</Typography>}
                  </div>;
                })}
              </div>
            </div>
            {inspectOpen && selectedNode && <section shuku-edit-id="e-1ca0076b-0c5e-4cc8-9ca8-aede5db974fc" className="code-lab-inspector" aria-label="算子运行详情">
              <div shuku-edit-id="e-ade4ee7d-55d4-4494-96cc-4ba863dd27b1" className="code-lab-inspector-heading"><Typography shuku-edit-id="e-f1f01818-91c0-4961-9c57-529e41c7922b" as="strong" variant="body">{selectedNode.kind === 'Conv' ? '卷积' : selectedNode.kind === 'Add' ? '相加' : selectedNode.kind} · 第 {selectedNode.line} 行</Typography><button shuku-edit-id="e-eb245e21-9e9a-4959-8861-8aafa0fee38a" type="button" aria-label="关闭算子详情" onClick={() => setInspectOpen(false)}>×</button></div>
              <Typography shuku-edit-id="e-58cd7536-3a70-4f54-9342-32a4af5f5c3c" as="p" variant="body">输入：{selectedNode.inputShapes.map(shape => shape.length ? shape.join(' × ') : '标量').join('，')}</Typography>
              <Typography shuku-edit-id="e-301a90d3-258b-47d6-95b6-c58470e19f03" as="p" variant="body">输出：{selectedNode.shape.join(' × ') || '标量'}<span shuku-edit-id="e-71197e7f-427c-49f0-8003-a33f14dbe3f3" className="code-lab-dtype">{selectedNode.dtype}</span></Typography>
              <button shuku-edit-id="e-70e308ca-74f0-4e7b-9cfc-550eaae87436" type="button" className="code-lab-values-toggle" aria-expanded={showValues} onClick={() => setShowValues(value => !value)}>{showValues ? '收起数值' : '查看输出数值'}</button>
              {showValues && <div shuku-edit-id="e-08ab1ad7-aaf7-4aa1-8fdf-27c7674c9057" className="code-lab-preview" aria-label="算子实际输出数值">{selectedNode.preview.map((row, index) => <div shuku-edit-id="e-c42d6050-a563-4e3b-845f-81553ae5f6cd" key={index}>{row.map((value, col) => <span shuku-edit-id="e-2bfe2f48-5517-4479-b7db-24ef489180b7" key={col}>{value.toFixed(3)}</span>)}</div>)}</div>}
            </section>}
          </>}
        </section>
      </div>
    </div>
  </ContentBlock>;
}
