import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { ContentBlock, Button, Typography } from "@shuku/course-style/react";
import { useAttentionLesson, type QueryTask } from '../../model/AttentionLessonContext';
import { QUERY_TASKS, hasCompletedQueryExploration } from '../../model/queryExploration';
import { CAMPUS_RECORD_TASKS, CAMPUS_RECORD_TEXT } from '../../model/campusRecord';
import './AttentionQueryPage.css';

const tasks = QUERY_TASKS.map(id => ({ ...CAMPUS_RECORD_TASKS.find(task => task.id === id)!, id }));

export function AttentionQueryPage({ onComplete, isComplete }: { onComplete: () => void; isComplete: boolean }) {
  const { query, selectQuery, dispatchQkv } = useAttentionLesson();
  const root = useRef<HTMLElement>(null);
  const visual = useRef<HTMLDivElement>(null);
  const phrases = useRef<Partial<Record<QueryTask, HTMLSpanElement>>>({});
  const markerId = 'attention-query-arrow-' + useId();
  const [connector, setConnector] = useState('');
  const [active, setActive] = useState(false);
  const done = hasCompletedQueryExploration(query);

  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const syncVisibility = () => {
      const hidden = Boolean(element.closest('[aria-hidden="true"], [hidden]'));
      element.inert = hidden;
      setActive(!hidden && !document.hidden);
    };
    const observer = new MutationObserver(syncVisibility);
    for (let ancestor: HTMLElement | null = element; ancestor; ancestor = ancestor.parentElement) {
      observer.observe(ancestor, { attributes: true, attributeFilter: ['aria-hidden', 'hidden'] });
    }
    document.addEventListener('visibilitychange', syncVisibility);
    syncVisibility();
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', syncVisibility); };
  }, []);

  useLayoutEffect(() => {
    const host = visual.current;
    if (!host || !active) return;
    const updateConnector = () => {
      const button = host.querySelector<HTMLElement>('[data-query-option="' + query.task + '"]');
      const selectedPhrase = phrases.current[query.task];
      if (!button || !selectedPhrase) return;
      const hostBox = host.getBoundingClientRect();
      if (!hostBox.width || !hostBox.height) return;
      const buttonBox = button.getBoundingClientRect();
      const phraseBox = selectedPhrase.getBoundingClientRect();
      // Normalize coordinates so the arrow stays attached under fixed-canvas scaling.
      const x1 = ((buttonBox.left + buttonBox.right) / 2 - hostBox.left) / hostBox.width * 1000;
      const y1 = (buttonBox.bottom - hostBox.top) / hostBox.height * 1000 + 20;
      const x2 = ((phraseBox.left + phraseBox.right) / 2 - hostBox.left) / hostBox.width * 1000;
      const y2 = (phraseBox.top - hostBox.top) / hostBox.height * 1000 - 28;
      const mid = (y1 + y2) / 2;
      setConnector('M ' + x1 + ' ' + y1 + ' C ' + x1 + ' ' + mid + ', ' + x2 + ' ' + mid + ', ' + x2 + ' ' + y2);
    };
    updateConnector();
    const observer = new ResizeObserver(updateConnector);
    observer.observe(host);
    Object.values(phrases.current).forEach(element => { if (element) observer.observe(element); });
    return () => observer.disconnect();
  }, [query.task, active]);

  useEffect(() => {
    if (active && done && !isComplete) onComplete();
  }, [active, done, isComplete, onComplete]);

  const chooseTask = (task: QueryTask) => {
    if (!active) return;
    selectQuery(task);
    dispatchQkv({ type: 'select-task', task });
  };
  const phrase = (task: QueryTask) => {
    const item = tasks.find(({ id }) => id === task)!;
    return <span shuku-edit-id="e-75366568-8751-474f-905a-a387c11fe567" ref={element => { if (element) phrases.current[task] = element; }}
      className={'attn-query-phrase' + (query.task === task ? ' is-highlighted' : '')}
      id={markerId + '-phrase-' + task} data-query-phrase={task}>{item.content}</span>;
  };

  return <ContentBlock shuku-edit-id="e-96dcf47a-45fe-4e7a-afd8-e682e25049ef" ref={root} title="同一份记录，问题不同、关注不同" headingLevel={1}
    subtitle="换个问题，观察高亮。"
    className="attn-query-page" bodyClassName="attn-query-body"
    data-query-task={query.task} data-query-complete={done} data-capture-ready={Boolean(connector)}>
    <div shuku-edit-id="e-6959211b-0526-4669-abc1-dc6182890bd1" ref={visual} className="attn-query-visual">
      <div shuku-edit-id="e-65abbe0a-09f7-46ed-976e-ed96dd74990f" className="attn-query-questions" role="group" aria-label="选择一个问题" onKeyDown={event => {
        if ([' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.stopPropagation();
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        const focusedTask = (event.target as Element).closest<HTMLElement>('[data-query-option]')?.dataset.queryOption ?? query.task;
        const index = Math.max(0, tasks.findIndex(({ id }) => id === focusedTask));
        const next = tasks[(index + (event.key === 'ArrowRight' ? 1 : tasks.length - 1)) % tasks.length].id;
        chooseTask(next);
        visual.current?.querySelector<HTMLElement>('[data-query-option="' + next + '"]')?.focus();
      }}>
        {tasks.map(({ id, question }) => <Button key={id}
          className="attn-query-question" active={query.task === id} aria-pressed={query.task === id}
          aria-label={question} aria-describedby={markerId + '-phrase-' + id} data-query-option={id} onClick={() => chooseTask(id)}>
          <Typography shuku-edit-id="e-fa554408-07d2-4cd0-83cb-5d0a34882c1d" as="span" variant="h3" tone="inherit">{question}</Typography>
          <Typography shuku-edit-id="e-485eb37a-985d-4cdd-b9ab-74e2a50abd50" as="span" variant="bodySmall" tone="inherit" className="attn-query-visited" aria-hidden="true">
            {query.visited.includes(id) ? '✓' : ''}
          </Typography>
        </Button>)}
      </div>
      <svg shuku-edit-id="e-46b8039a-f830-44e5-8e3c-7105526f781a" className="attn-query-connector" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
        <defs shuku-edit-id="e-f9a88b41-36b4-4cbd-9b51-5186b8074ada"><marker shuku-edit-id="e-513e03c2-28c6-4282-a329-3b37c867c5bf" id={markerId} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path shuku-edit-id="e-26c5d16d-f26e-40d2-bc80-f5ffadd96930" d="M 1 1 L 6 4 L 1 7" /></marker></defs>
        {connector && <path shuku-edit-id="e-ec830ae1-5473-4c18-a3ae-9885d09684f4" d={connector} markerEnd={'url(#' + markerId + ')'} vectorEffect="non-scaling-stroke" />}
      </svg>
      <div shuku-edit-id="e-8dddb92d-9404-4bee-8500-388179fdaa6d" className="attn-query-story">
        <Typography shuku-edit-id="e-41788e64-ab4c-4e11-bccb-b5abdb1177b1" as="p" variant="h2" className="attn-query-sentence" aria-label={CAMPUS_RECORD_TEXT}>
          小明为了{phrase('why')}，在{phrase('where')}录下了{phrase('what')}。
        </Typography>
      </div>
    </div>
    <footer shuku-edit-id="e-80a31632-8101-4854-90f0-6c36de061990" className="attn-query-footer">
      <Typography shuku-edit-id="e-c9f60030-8da5-4def-88ba-6dc511fdac4a" variant="bodySmall" tone="muted">预设高亮；下一步用权重表示。</Typography>
    </footer>
  </ContentBlock>;
}
