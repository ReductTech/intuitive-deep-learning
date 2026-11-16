import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
import { OBSERVATION_RECORD_EVENT, OBSERVATION_RECORD_KEY, readObservationRecord } from '../AttentionGorillaExperimentPage/observationRecord';
import { CourseMaterialImage } from '../../components/CourseMaterialImage';
import './AttentionObservationCoverPage.css';

export function AttentionObservationCoverPage({ onComplete, isComplete }: { onComplete: () => void; isComplete: boolean }) {
  const [record, setRecord] = useState(readObservationRecord);
  const [completedHere, setCompletedHere] = useState(false);
  const root = useRef<HTMLElement>(null);
  const done = isComplete || completedHere;
  const hasRecall = Boolean(record.recall.trim());

  useEffect(() => {
    const refresh = () => setRecord(readObservationRecord());
    const onStorage = (event: StorageEvent) => {
      if (event.key === OBSERVATION_RECORD_KEY || event.key === null) refresh();
    };
    window.addEventListener(OBSERVATION_RECORD_EVENT, refresh);
    window.addEventListener('storage', onStorage);
    refresh();
    return () => {
      window.removeEventListener(OBSERVATION_RECORD_EVENT, refresh);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const syncVisibility = () => {
      element.inert = Boolean(element.closest('[aria-hidden="true"], [hidden]'));
      if (!element.inert) setRecord(readObservationRecord());
    };
    const observer = new MutationObserver(syncVisibility);
    for (let ancestor: HTMLElement | null = element; ancestor; ancestor = ancestor.parentElement) {
      observer.observe(ancestor, { attributes: true, attributeFilter: ['aria-hidden', 'hidden'] });
    }
    syncVisibility();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (completedHere && !isComplete && !document.hidden && !root.current?.closest('[aria-hidden="true"], [hidden]')) onComplete();
  }, [completedHere, isComplete, onComplete]);

  const complete = () => {
    if (done || document.hidden || !root.current
      || root.current.closest('[aria-hidden="true"], [hidden]')) return;
    setCompletedHere(true);

  };

  return <ContentBlock shuku-edit-id="e-4e5fd4b1-4393-4361-afac-08e268b0d2a9" ref={root} headingLevel={1}
    title="同一段录像，留下了哪些信息？"
    subtitle="比较任务与观察记录。"
    className="attn-reflection-page" bodyClassName="attn-reflection-body"
    data-observation-reflection="true" data-complete={done} data-capture-ready="true">
    <div shuku-edit-id="e-d8784123-bf3b-4f9f-b421-fe207c76e942" className="attn-reflection-panel">
      <div shuku-edit-id="e-7731b6b7-1f7a-43c0-b11a-1ad13e645c35" className="attn-reflection-comparison">
        <section shuku-edit-id="e-6f325644-35bf-4594-9eef-8a5930a0fdd7" className="attn-reflection-record" aria-label="你的记录">
          <Typography shuku-edit-id="e-047acd10-ae2b-49c4-b883-14b47565d853" as="h2" variant="bodySmall" tone="accent" className="attn-reflection-label">你的记录</Typography>
          <div shuku-edit-id="e-b6d11dc0-5ce8-41bc-be99-61e5d74c5eeb" className="attn-reflection-count">
            <Typography shuku-edit-id="e-94da6164-be7f-4d7a-8189-62998342efea" variant="bodySmall" tone="muted">只数白衣队的传球</Typography>
            <Typography shuku-edit-id="e-cafa6133-87c3-4766-b495-ab931aa409bf" variant="h3" tone="accent" data-observation-count>
              {record.count === null ? '未计数' : '我数到 ' + record.count + ' 次'}
            </Typography>
          </div>
          <div shuku-edit-id="e-8cfbd975-3a9c-42e9-aec4-24893d22ac30" className="attn-reflection-recall">
            <Typography shuku-edit-id="e-74323b6a-239b-4206-bf69-ef4a5f2eb578" variant="bodySmall" tone="accent" className="attn-reflection-label">其他印象</Typography>
            <div shuku-edit-id="e-ccd8a8d5-b7c6-4371-ad2d-b56af4c71c7b" className="attn-reflection-recall-viewport" tabIndex={hasRecall ? 0 : undefined}
              aria-label="第一轮回忆记录"
              data-ppt-viewport="用户真实回忆记录；过多换行时可滚动阅读全文">
              <Typography shuku-edit-id="e-3df41b08-a565-4b3e-9d1b-0f91a4b4e2f9" variant="bodySmall" tone={hasRecall ? 'main' : 'muted'} className="attn-reflection-recall-text" data-observation-recall>
                {hasRecall ? record.recall : '未填回忆'}
              </Typography>
            </div>
          </div>
        </section>
        <section shuku-edit-id="e-249cbcdb-9ee7-4e78-b471-131f5fd7b3a1" className="attn-reflection-fact" aria-label="原视频中的事实">
          <Typography shuku-edit-id="e-2787c0f3-75a9-4aba-b9bd-dad7890870b1" as="h2" variant="bodySmall" tone="accent" className="attn-reflection-label">回看录像</Typography>
          <div shuku-edit-id="e-ddb11905-5f97-486a-9c67-76bafb1fd808" className="attn-reflection-evidence">
            <figure shuku-edit-id="e-a643fee2-0758-4d38-a496-9920c6180a4a" className="attn-reflection-still">
              <div shuku-edit-id="e-fb8175d9-f928-4482-9ac3-ac0c27c84cc3" className="attn-reflection-still-image">
                <CourseMaterialImage path="observation/original-gorilla-storyboard.jpg" frame={{columns:3,rows:3,column:1,row:0}} alt="原始实验视频第28秒的完整静帧：穿大猩猩服的人经过中央，蓝圈标出其位置。原有版权署名保留。" />
                <svg shuku-edit-id="e-67ee717c-2cf3-4470-9526-9c43a82f9605" viewBox="0 0 640 480" aria-hidden="true"><ellipse shuku-edit-id="e-89cb42eb-9dd1-4a1d-9d3e-67cfa7eb2e79" cx="355" cy="229" rx="80" ry="160" fill="none" stroke="var(--ui-accent)" strokeWidth="7" strokeDasharray="15 9"/></svg>
              </div>
              <Typography shuku-edit-id="e-77af7291-e0c0-4c3d-b4e0-0e9e6fc965aa" as="figcaption" variant="bodySmall" tone="muted"><a shuku-edit-id="e-2445e0f5-2ffd-4d36-bf75-09be8f70dd73" href="https://www.youtube.com/watch?v=vJG698U2Mvo&t=28s" target="_blank" rel="noreferrer">原视频静帧 ↗</a></Typography>
            </figure>
            <div shuku-edit-id="e-64decd72-dcc0-48ac-a48f-1a1e96d1cdaa" className="attn-reflection-fact-copy"><Typography shuku-edit-id="e-a905e743-9397-4d81-947b-cd7808cdfc67" variant="h3" tone="accent">有人穿大猩猩服走过画面。</Typography>
              <Typography shuku-edit-id="e-37f1f6db-f56c-4756-badd-57b0470d1b93" variant="bodySmall" tone="muted" className="attn-reflection-fact-note">它与计数任务无关。</Typography></div>
          </div>
        </section>
      </div>
      <div shuku-edit-id="e-b2797356-1118-49c5-accc-70c3b3a8ea65" className="attn-reflection-conclusion">
        <Typography shuku-edit-id="e-a862712a-bef1-49c9-832f-627af3b3b3c2" variant="h3" tone="accent" align="center">任务改变关注重点。</Typography>
      </div>
    </div>
    <footer shuku-edit-id="e-9999cb25-27b7-4d42-8daa-7ed1c3d5b850" className="attn-reflection-footer">
      <div shuku-edit-id="e-87ee17cf-3dc0-4e62-8a80-655eace030dd" className="attn-reflection-next">
        <Typography shuku-edit-id="e-c70d1699-2d6c-4244-b76b-7e5ce1b2ca02" variant="bodySmall" tone="muted">人类注意仅作类比。</Typography>
      </div>
      <Button variant="primary" disabled={done} onClick={complete} data-action="complete-observation-reflection">
        <Typography shuku-edit-id="e-cf8fe28e-5625-4b3e-9ee9-b59841cff652" as="span" variant="bodySmall" tone="inherit">{done ? '已完成' : '继续整理活动记录'}</Typography>
      </Button>
    </footer>
  </ContentBlock>;
}
