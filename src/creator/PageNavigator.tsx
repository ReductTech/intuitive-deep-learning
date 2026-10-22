import { useEffect, useState } from 'react';
import type { CreatorPage } from './model';
import { readDesignImage } from './designImages';

function PageItem({ page, index, active, busy, thumbnail, outlineVisible, editable, onSelect, onProperties, onDrop }: {
  page: CreatorPage; index: number; active: boolean; busy: boolean; thumbnail?: string; outlineVisible: boolean; editable: boolean;
  onSelect: () => void; onProperties: () => void; onDrop: (id: string) => void;
}) {
  const [image, setImage] = useState<string>();
  useEffect(() => { let active = true; setImage(undefined); if (!thumbnail && page.designImageId) readDesignImage(page.designImageId).then(value => { if (active) setImage(value); }).catch(() => {}); return () => { active = false; }; }, [page.designImageId, thumbnail]);
  return <article className={`cw-ppt-page ${active ? 'active' : ''}`} aria-label={`第${index + 1}页`} onDragOver={event => { if (editable && !busy) event.preventDefault(); }} onDrop={event => { event.preventDefault(); if (editable && !busy) onDrop(event.dataTransfer.getData('text/plain')); }}>
    <div className="cw-ppt-page-row"><span className="cw-ppt-index" draggable={editable && !busy} title={editable ? '拖动排序' : undefined} onDragStart={event => { event.dataTransfer.setData('text/plain', page.id); event.dataTransfer.effectAllowed = 'move'; }}>{String(index + 1).padStart(2, '0')}</span>
      <button className="cw-ppt-thumb" aria-label={`打开第${index + 1}页：${page.title}`} aria-current={active ? 'page' : undefined} title={page.title} disabled={busy} onClick={onSelect}>{thumbnail || image ? <img src={thumbnail || image} alt="" /> : <span className="cw-ppt-placeholder">{page.title}</span>}</button>
      {editable && <button className="cw-ppt-more" aria-label={`第${index + 1}页属性`} title="页面属性" disabled={busy} onClick={() => { onSelect(); onProperties(); }}>···</button>}
    </div>{outlineVisible && <button className="cw-ppt-title" disabled={busy} onClick={onSelect}>{page.title}</button>}
  </article>;
}

export function PageNavigator({ pages, activeId, busy, editable, thumbnail, onSelect, onReorder, onProperties, onAdd }: {
  pages: CreatorPage[]; activeId: string; busy: boolean; editable: boolean; thumbnail: (page: CreatorPage) => string | undefined;
  onSelect: (id: string) => void; onReorder: (fromId: string, toId: string) => void; onProperties: (id: string) => void; onAdd: () => void;
}) {
  const [outlineVisible, setOutlineVisible] = useState(false);
  return <aside className="cw-sidebar cw-ppt-sidebar"><header className="cw-pages-heading"><strong>幻灯片 <span>{pages.length}</span></strong><button aria-pressed={outlineVisible} onClick={() => setOutlineVisible(!outlineVisible)}>{outlineVisible ? '隐藏大纲' : '显示大纲'}</button></header>
    <div className="cw-unified-pages">{pages.map((page, index) => <PageItem key={page.id} page={page} index={index} active={page.id === activeId} busy={busy} editable={editable} thumbnail={thumbnail(page)} outlineVisible={outlineVisible} onSelect={() => { if (page.id !== activeId) onSelect(page.id); }} onProperties={() => onProperties(page.id)} onDrop={id => onReorder(id, page.id)} />)}</div>
    {editable && <button className="cw-add" disabled={busy || pages.length >= 100} onClick={onAdd}>＋ 添加页面</button>}
  </aside>;
}
