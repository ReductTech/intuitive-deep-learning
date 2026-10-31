import { ATTENTION_PAGE_COUNT } from '../../model/coursePageNumber';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { ContentBlock, Button, Typography } from '../../../shared/react';
import { useAttentionLesson, type QueryTask } from '../../model/AttentionLessonContext';
import { hasCompletedQueryExploration } from '../../model/queryExploration';
import './AttentionQueryPage.css';

const tasks: Array<{ id: QueryTask; question: string; phrase: string }> = [
  { id: 'why', question: '为什么去商店？', phrase: '感到口渴' },
  { id: 'where', question: '去了哪里？', phrase: '走进商店' },
  { id: 'what', question: '买了什么？', phrase: '一瓶冰水' },
];

export function AttentionQueryPage({ onComplete, isComplete }: { onComplete: () => void; isComplete: boolean }) {
  const { query, selectQuery } = useAttentionLesson();
  const root = useRef<HTMLElement>(null);
  const visual = useRef<HTMLDivElement>(null);
  const phrases = useRef<Partial<Record<QueryTask, HTMLSpanElement>>>({});
  const markerId = `attention-query-arrow-${useId()}`;
  const [connector, setConnector] = useState('');
  const done = hasCompletedQueryExploration(query);
  const current = tasks.find(({ id }) => id === query.task)!;

  useLayoutEffect(() => {
    if (root.current) root.current.inert = Boolean(root.current.closest('[aria-hidden="true"]'));
    const host = visual.current;
    if (!host) return;
    const updateConnector = () => {
      const button = host.querySelector<HTMLElement>(`[data-query-option="${query.task}"]`);
      const phrase = phrases.current[query.task];
      if (!button || !phrase) return;
      const hostBox = host.getBoundingClientRect();
      if (!hostBox.width || !hostBox.height) return;
      const buttonBox = button.getBoundingClientRect();
      const phraseBox = phrase.getBoundingClientRect();
      // Normalized coordinates keep the line attached in both scaled viewing modes.
      const x1 = ((buttonBox.left + buttonBox.right) / 2 - hostBox.left) / hostBox.width * 1000;
      const y1 = (buttonBox.bottom - hostBox.top) / hostBox.height * 1000 + 20;
      const x2 = ((phraseBox.left + phraseBox.right) / 2 - hostBox.left) / hostBox.width * 1000;
      const y2 = (phraseBox.top - hostBox.top) / hostBox.height * 1000 - 28;
      const mid = (y1 + y2) / 2;
      setConnector(`M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`);
    };
    updateConnector();
    const observer = new ResizeObserver(updateConnector);
    observer.observe(host);
    return () => observer.disconnect();
  }, [query.task]);

  useEffect(() => {
    if (done && !isComplete && !root.current?.closest('[aria-hidden="true"]')) onComplete();
  }, [done, isComplete, onComplete]);

  const phrase = (task: QueryTask) => {
    const item = tasks.find(({ id }) => id === task)!;
    return <span ref={(element) => { if (element) phrases.current[task] = element; }}
      className={'attn-query-phrase' + (query.task === task ? ' is-highlighted' : '')}
      data-query-phrase={task}>{item.phrase}</span>;
  };

  return <article ref={root} className="attn-query-page" data-query-task={query.task} aria-label="同一句话，不同的问题">
    <ContentBlock title="同一句话，问题不同、关注不同" headingLevel={1} className="attn-page-content">

    <div ref={visual} className="attn-query-visual">
      <div className="attn-query-questions" role="group" aria-label="选择一个问题" onKeyDown={(event) => {
        if ([' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.stopPropagation();
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        const focusedTask = (event.target as Element).closest<HTMLElement>('[data-query-option]')?.dataset.queryOption ?? query.task;
        const index = Math.max(0, tasks.findIndex(({ id }) => id === focusedTask));
        const next = tasks[(index + (event.key === 'ArrowRight' ? 1 : tasks.length - 1)) % tasks.length].id;
        selectQuery(next);
        visual.current?.querySelector<HTMLElement>(`[data-query-option="${next}"]`)?.focus();
      }}>
        {tasks.map(({ id, question }) => <Button key={id}
          className="attn-query-question" active={query.task === id} aria-pressed={query.task === id}
          aria-label={question} data-query-option={id} onClick={() => selectQuery(id)}>
          <Typography as="span" variant="h3" tone="inherit">{question}</Typography>
          <Typography as="span" variant="bodySmall" tone="inherit" className="attn-query-visited" aria-hidden="true">{query.visited.includes(id) ? '✓' : ''}</Typography>
        </Button>)}
      </div>

      <svg className="attn-query-connector" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
        <defs><marker id={markerId} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M 1 1 L 6 4 L 1 7" /></marker></defs>
        {connector && <path d={connector} markerEnd={`url(#${markerId})`} vectorEffect="non-scaling-stroke" />}
      </svg>

      <div className="attn-query-story">
        <Typography as="p" variant="h2" className="attn-query-sentence">小明跑步后{phrase('why')}，{phrase('where')}，买了{phrase('what')}。</Typography>
      </div>
    </div>

    <footer className={'attn-query-footer' + (done ? ' is-revealed' : '')}>
      <Typography variant={done ? 'h3' : 'body'} tone="accent" aria-live="polite" className="attn-query-takeaway">
        {done ? '问题变了，关注点也变了。' : '换个问题，看看高亮移到哪里。'}
      </Typography>
      <Typography variant="bodySmall" tone="muted">怎样让模型也能改变关注点？</Typography>
    </footer>
    <Typography as="span" variant="bodySmall" className="attn-query-announcement" aria-live="polite" aria-atomic="true">{current.question}对应片段：{current.phrase}。</Typography>
    </ContentBlock>
  </article>;
}
