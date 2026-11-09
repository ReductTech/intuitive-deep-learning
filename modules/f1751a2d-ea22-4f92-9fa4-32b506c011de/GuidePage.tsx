import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Button, ModuleShell, PageRating, Question, RangeControl, Switch, Typography, type QuestionCheckResult } from "@shuku/course-style/react";
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { bridgeStatus, makeEvent, reportEvent, type CourseTestEvent } from './courseEvents';
import './MemoryTest.css';

const VIDEO_URL = moduleAssetUrl('memory-test.mp4');

type LogEntry = { event: CourseTestEvent; status: '等待' | '成功' | '失败'; detail?: string };
type RecordEvent = (pageId: string, eventName: string, properties?: Record<string, unknown>) => void;

function TestQuestionPair({ pageId, record, choiceTitle, choiceOptions, choiceAnswer, shortTitle }: {
  pageId: string;
  record: RecordEvent;
  choiceTitle: string;
  choiceOptions: Array<{ value: string; label: string }>;
  choiceAnswer: string;
  shortTitle: string;
}) {
  const reportAnswer = (questionId: string, kind: string, result: QuestionCheckResult) => {
    if (result.empty) return;
    record(pageId, 'answer_submit', { question_id: questionId, question_type: kind, answer: result.answer, correct: kind === 'choice' ? result.ok : null });
  };
  return <div className="mt-questions">
    <Question type="choice" instant={false} title={choiceTitle} options={choiceOptions} answer={choiceAnswer} persistenceKey={`memory-test:${pageId}:choice`} onCheck={(result) => reportAnswer(`${pageId}:choice`, 'choice', result)} />
    <Question type="short" title={shortTitle} rows={3} persistenceKey={`memory-test:${pageId}:short`} feedback={{ sample: '测试题只记录回答，不进行 AI 评分。' }} onCheck={(result) => reportAnswer(`${pageId}:short`, 'short', result)} />
  </div>;
}

function Canvas({ pageId, index, title, description, children }: { pageId: string; index: number; title: string; description: string; children: ReactNode }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const update = () => setScale(Math.min(1, frame.clientWidth / 1600));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);
  return <div ref={frameRef} className="mt-frame" style={{ height: 900 * scale }}>
    <section className="mt-canvas" data-page-id={pageId} style={{ transform: `scale(${scale})` }}>
      <header className="mt-canvas-head">
        <Typography as="span" variant="bodySmall" tone="accent">COURSE INTERACTION TEST / {String(index + 1).padStart(2, '0')}</Typography>
        <Typography as="h2" variant="display">{title}</Typography>
        <Typography as="p" variant="subtitle" tone="muted">{description}</Typography>
      </header>
      {children}
    </section>
  </div>;
}

function ConnectionPanel({ logs, onRefresh, onList, onAuth, queryOptions, setQueryOptions, queryResult, bridgeMessage }: {
  logs: LogEntry[];
  onRefresh: () => void;
  onList: () => void;
  onAuth: () => void;
  queryOptions: string;
  setQueryOptions: (value: string) => void;
  queryResult: string;
  bridgeMessage: string;
}) {
  const status = bridgeStatus();
  return <aside className="mt-panel" aria-label="课程事件接口状态">
    <div className="mt-panel-top">
      <div><Typography as="h2" variant="h3">接口状态</Typography><Typography as="p" variant="bodySmall" tone="muted">操作记录通过平台课程接口提交；用户身份由平台处理。</Typography></div>
      <div className="mt-panel-actions">
        <Button type="button" onClick={onRefresh}>重新检测</Button>
        <Button type="button" onClick={onAuth}>查看说明</Button>
      </div>
    </div>
    <div className="mt-flags"><span>页面：{status.embedded ? '嵌入' : '独立'}</span><span>平台事件接口：{status.report ? '已嵌入，提交后确认' : '请在平台学习页测试'}</span></div>
    {bridgeMessage && <Typography as="p" variant="bodySmall" tone="muted" role="status">{bridgeMessage}</Typography>}
    <div className="mt-panel-grid">
      <section><Typography as="h3" variant="body" >最近写入</Typography><ol className="mt-log">{logs.length ? logs.slice(0, 6).map(({ event, status: result, detail }) => <li key={event.event_id}><code>{event.event_name}</code><span>{event.page_id}</span><strong data-status={result}>{result}</strong>{detail && <small title={detail}>{detail}</small>}</li>) : <li>完成下方操作后显示结果。</li>}</ol></section>
      <section><Typography as="h3" variant="body">本页记录</Typography><label className="mt-query-label" htmlFor="mt-query">显示条数 JSON（填写 limit 属性）</label><textarea id="mt-query" value={queryOptions} onChange={(event) => setQueryOptions(event.target.value)} rows={2} /><Button type="button" variant="primary" onClick={onList}>查看本页记录</Button><pre className="mt-query-result">{queryResult || '仅显示本页本次测试记录，不代表服务端查询结果。'}</pre></section>
    </div>
  </aside>;
}

export function GuidePage() {
  const [page, setPage] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [bridgeMessage, setBridgeMessage] = useState('');
  const [queryOptions, setQueryOptions] = useState(JSON.stringify({ limit: 20 }));
  const [queryResult, setQueryResult] = useState('');
  const [slider, setSlider] = useState(40);
  const [enabled, setEnabled] = useState(false);
  const [counter, setCounter] = useState(0);
  const [videoPlayed, setVideoPlayed] = useState(false);
  const runId = useRef(crypto.randomUUID());
  const sendChain = useRef(Promise.resolve());
  const pageIds = ['546f0505-8d38-4c1c-be8f-3b7ba6aa6691', '323404f9-7c7d-4d53-94c5-987bb9c25335', 'c7e7039e-fd87-419f-a1c0-c0f91c730f2f', '02bcca99-53d8-475b-bb43-eb98ee141c68'];

  const record = useCallback<RecordEvent>((pageId, eventName, properties = {}) => {
    const event = makeEvent(runId.current, pageId, eventName, properties);
    setLogs((current) => [{ event, status: '等待' as const }, ...current].slice(0, 30));
    sendChain.current = sendChain.current.catch(() => undefined).then(async () => {
      try {
        const result = await reportEvent(event);
        setLogs((current) => current.map((entry) => entry.event.event_id === event.event_id ? { ...entry, status: '成功', detail: JSON.stringify(result) } : entry));
      } catch (error) {
        setLogs((current) => current.map((entry) => entry.event.event_id === event.event_id ? { ...entry, status: '失败', detail: String(error) } : entry));
      }
    });
  }, []);

  const changePage = (next: number) => {
    const bounded = Math.max(0, Math.min(3, next));
    if (bounded === page) return;
    record(pageIds[page], 'page_leave', { next_page: pageIds[bounded] });
    setPage(bounded);
    record(pageIds[bounded], 'page_view', { previous_page: pageIds[page] });
  };

  const refreshBridge = () => {
    const status = bridgeStatus();
    setBridgeMessage(status.report ? '当前页面已嵌入。请提交一个操作，以平台实际返回结果为准。' : '本地独立预览可以体验控件，事件提交需要在平台学习页测试。');
  };

  const checkAuth = async () => {
    setBridgeMessage('课程不读取账号或登录凭据。平台学习页负责身份校验；本页只提交课程交互事件。');
  };

  const query = async () => {
    try {
      const parsed: unknown = JSON.parse(queryOptions);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('参数必须是 JSON 对象');
      setQueryResult('正在查询…');
      const limit = Math.min(30, Math.max(1, Number((parsed as {limit?: unknown}).limit) || 20));
      const result = {scope:'本页本次测试', records:logs.slice(0, limit)};
      setQueryResult(JSON.stringify(result, null, 2));
    } catch (error) { setQueryResult(`查询失败：${String(error)}`); }
  };

  return <ModuleShell title="课程交互联调" subtitle="验证平台事件提交、题目、控件和本页操作记录。" badge="测试模块" shellClassName="mt-shell">
    <ConnectionPanel logs={logs} onRefresh={refreshBridge} onList={() => void query()} onAuth={() => void checkAuth()} queryOptions={queryOptions} setQueryOptions={setQueryOptions} queryResult={queryResult} bridgeMessage={bridgeMessage} />
    {page === 0 && <Canvas pageId={pageIds[0]} index={0} title="选择，然后留下一个回答" description="先完成两道题，再点按钮。每次提交都会直接写入课程事件。">
      <TestQuestionPair pageId={pageIds[0]} record={record} choiceTitle="这次测试的写入由哪个接口完成？" choiceOptions={[{ value: 'courseEvent', label: '平台课程事件接口' }, { value: 'localLog', label: '本页记录列表' }, { value: 'localStorage', label: 'localStorage' }]} choiceAnswer="courseEvent" shortTitle="用一句话描述你希望记住的学习行为。" />
      <div className="mt-action-row"><Button variant="primary" onClick={() => record(pageIds[0], 'button_click', { button_id: 'primary-test' })}>主按钮测试</Button><Button onClick={() => record(pageIds[0], 'button_click', { button_id: 'secondary-test' })}>次按钮测试</Button></div>
    </Canvas>}
    {page === 1 && <Canvas pageId={pageIds[1]} index={1} title="连续输入也能被记录" description="拖动滑块、切换开关，再提交选择与简答。">
      <div className="mt-controls"><RangeControl label="学习信心" min={0} max={100} step={1} value={slider} suffix="%" onChange={(event) => setSlider(Number(event.currentTarget.value))} onPointerUp={(event) => record(pageIds[1], 'slider_commit', { control_id: 'confidence', value: Number(event.currentTarget.value) })} onKeyUp={(event) => record(pageIds[1], 'slider_commit', { control_id: 'confidence', value: Number(event.currentTarget.value) })} /><Switch label={enabled ? '练习模式：开' : '练习模式：关'} checked={enabled} onChange={(event) => { const next = event.currentTarget.checked; setEnabled(next); record(pageIds[1], 'toggle_change', { control_id: 'practice-mode', enabled: next }); }} /></div>
      <TestQuestionPair pageId={pageIds[1]} record={record} choiceTitle="滑块应在什么时机上报最终值？" choiceOptions={[{ value: 'commit', label: '用户结束拖动时' }, { value: 'every-frame', label: '每一帧都上报' }, { value: 'never', label: '永不上报' }]} choiceAnswer="commit" shortTitle="滑块的变化可以帮助你观察什么？" />
    </Canvas>}
    {page === 2 && <Canvas pageId={pageIds[2]} index={2} title="再做一组组合操作" description="用计数按钮和重置按钮制造连续事件，再完成两道题。">
      <div className="mt-action-row"><Button variant="primary" onClick={() => { const next = counter + 1; setCounter(next); record(pageIds[2], 'counter_increment', { value: next }); }}>点击计数：{counter}</Button><Button onClick={() => { setCounter(0); record(pageIds[2], 'counter_reset', { previous_value: counter }); }}>重置计数</Button></div>
      <TestQuestionPair pageId={pageIds[2]} record={record} choiceTitle="一条测试事件是否应该带上用户 ID？" choiceOptions={[{ value: 'no', label: '不用；由宿主登录态归属' }, { value: 'yes', label: '必须由页面自己填写' }]} choiceAnswer="no" shortTitle="如果写入失败，你想从页面上看到什么提示？" />
    </Canvas>}
    {page === 3 && <Canvas pageId={pageIds[3]} index={3} title="测试结束" description="播放一段本地测试视频，再给本页打星。最后使用上方查询按钮核对记录。">
      <div className="mt-ending"><div className="mt-video-wrap"><video controls preload="metadata" src={VIDEO_URL} onPlay={() => { if (!videoPlayed) { setVideoPlayed(true); record(pageIds[3], 'video_play', { video_id: 'memory-test-video' }); } }} onEnded={() => record(pageIds[3], 'video_complete', { video_id: 'memory-test-video' })} /><Typography as="p" variant="bodySmall" tone="muted">本地生成的短视频，只用于验证播放操作。</Typography></div><div className="mt-rating"><Typography as="h3" variant="h2">给这次体验打分</Typography><div onClickCapture={(event) => { const target = event.target instanceof Element ? event.target.closest('.edu-page-rating-stars button') : null; if (target) { const match = target.getAttribute('aria-label')?.match(/(\d)/); if (match) record(pageIds[3], 'page_rating', { rating: Number(match[1]), page_key: 'memory-test-ending' }); } }}><PageRating pageKey="memory-test-ending" /></div><Typography as="p" variant="bodySmall" tone="muted">评分后，上方“最近写入”会显示提交结果。</Typography></div></div>
    </Canvas>}
    <nav className="mt-navigation" aria-label="测试页面导航"><Button disabled={page === 0} onClick={() => changePage(page - 1)}>上一页</Button><Typography as="span" variant="bodySmall" tone="muted">{page + 1} / 4 · {'f1751a2d-ea22-4f92-9fa4-32b506c011de'}</Typography><Button variant="primary" disabled={page === 3} onClick={() => changePage(page + 1)}>下一页</Button></nav>
  </ModuleShell>;
}
