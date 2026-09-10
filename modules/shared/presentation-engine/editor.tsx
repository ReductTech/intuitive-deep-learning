import { useEffect, useMemo, useRef, useState } from 'react';
import Moveable from 'react-moveable';
import Selecto from 'react-selecto';
import type { PresentationStore } from './store';
import { SlideSurface } from './renderers';

function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID?.().slice(0, 8) ?? `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`}`;
}

export function SlideEditor({ store, onCanvasDrop }: {
  store: PresentationStore;
  onCanvasDrop?: (itemId: string, point: { x: number; y: number }) => void;
}) {
  const document = store((state) => state.document);
  const activeSlideId = store((state) => state.activeSlideId);
  const selectedIds = store((state) => state.selectedPlacementIds);
  const selectPlacements = store((state) => state.selectPlacements);
  const updatePlacements = store((state) => state.updatePlacements);
  const replaceDocument = store((state) => state.replaceDocument);
  const activeTargetId = store((state) => state.activeNarrationTargetId);
  const page = document.views.slides.pages.find((candidate) => candidate.id === activeSlideId) ?? document.views.slides.pages[0];
  const viewportRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(.64);
  const [editingPlacementId, setEditingPlacementId] = useState<string>();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; placementId?: string }>();

  useEffect(() => {
    if (!editingPlacementId) return;
    const editable = surfaceRef.current?.querySelector<HTMLElement>(`[data-placement-id="${CSS.escape(editingPlacementId)}"] [contenteditable="true"]`);
    editable?.focus();
    if (editable) {
      const selection = window.getSelection();
      const range = window.document.createRange();
      range.selectNodeContents(editable);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [editingPlacementId]);

  useEffect(() => {
    const host = viewportRef.current;
    if (!host) return undefined;
    const update = () => setScale(Math.min((host.clientWidth - 72) / page.width, (host.clientHeight - 72) / page.height, 1));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(host);
    return () => observer.disconnect();
  }, [page.height, page.width]);

  const targets = useMemo(() => editingPlacementId ? [] : selectedIds
    .map((id) => surfaceRef.current?.querySelector<HTMLElement>(`[data-placement-id="${CSS.escape(id)}"]`) ?? null)
    .filter((target): target is HTMLElement => Boolean(target)), [document, editingPlacementId, selectedIds, scale]);

  const placementById = (id: string) => page.placements.find((placement) => placement.id === id);
  const contextPlacement = contextMenu?.placementId ? placementById(contextMenu.placementId) : undefined;
  const contextText = contextPlacement?.source.kind === 'content'
    ? document.content[contextPlacement.source.id]
    : undefined;
  const closeContextMenu = () => setContextMenu(undefined);

  const duplicatePlacement = (placementId: string) => {
    const original = placementById(placementId);
    if (!original) return;
    const next = structuredClone(document);
    const nextPage = next.views.slides.pages.find((candidate) => candidate.id === activeSlideId);
    if (!nextPage) return;
    let source = original.source;
    if (source.kind === 'content') {
      const originalNode = next.content[source.id];
      if (originalNode) {
        const id = createId(originalNode.type);
        next.content[id] = { ...originalNode, id };
        source = { kind: 'content', id };
      }
    } else {
      const originalWidget = next.widgets[source.id];
      if (originalWidget) {
        const id = createId('widget');
        next.widgets[id] = { ...originalWidget, id, props: structuredClone(originalWidget.props) };
        source = { kind: 'widget', id };
      }
    }
    const id = createId('placement');
    nextPage.placements.push({
      ...original,
      id,
      source,
      x: Math.min(nextPage.width - original.width, original.x + 32),
      y: Math.min(nextPage.height - original.height, original.y + 32),
      zIndex: Math.max(...nextPage.placements.map((placement) => placement.zIndex)) + 1,
      locked: false,
    });
    replaceDocument(next);
    selectPlacements([id]);
  };

  const deletePlacement = (placementId: string) => {
    const next = structuredClone(document);
    const nextPage = next.views.slides.pages.find((candidate) => candidate.id === activeSlideId);
    if (!nextPage) return;
    nextPage.placements = nextPage.placements.filter((placement) => placement.id !== placementId);
    replaceDocument(next);
    selectPlacements([]);
  };

  return <div className="pe-editor-viewport" ref={viewportRef} onPointerDown={(event) => {
    if (!(event.target as HTMLElement).closest('.pe-editor-context-menu')) closeContextMenu();
  }}>
    <div
      className="pe-editor-stage"
      style={{ width: page.width, height: page.height, transform: `translate(-50%, -50%) scale(${scale})` }}
      ref={surfaceRef}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const itemId = event.dataTransfer.getData('application/x-presentation-item');
        const rect = surfaceRef.current?.getBoundingClientRect();
        if (!itemId || !rect) return;
        onCanvasDrop?.(itemId, {
          x: Math.max(0, Math.min(page.width, (event.clientX - rect.left) / scale)),
          y: Math.max(0, Math.min(page.height, (event.clientY - rect.top) / scale)),
        });
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        const viewport = viewportRef.current;
        if (!viewport) return;
        const placement = (event.target as HTMLElement).closest<HTMLElement>('[data-placement-id]');
        const placementId = placement?.dataset.placementId;
        if (placementId) selectPlacements([placementId]);
        const rect = viewport.getBoundingClientRect();
        setContextMenu({
          x: Math.min(Math.max(8, event.clientX - rect.left), Math.max(8, rect.width - 188)),
          y: Math.min(Math.max(8, event.clientY - rect.top), Math.max(8, rect.height - 246)),
          placementId,
        });
      }}
    >
      <SlideSurface
        document={document}
        page={page}
        mode="edit"
        selectedIds={selectedIds}
        activeTargetId={activeTargetId}
        editingPlacementId={editingPlacementId}
        onPlacementPointerDown={(id, event) => {
          if (event.shiftKey) selectPlacements(selectedIds.includes(id) ? selectedIds.filter((value) => value !== id) : [...selectedIds, id]);
          else if (!selectedIds.includes(id)) selectPlacements([id]);
        }}
        onPlacementDoubleClick={(id, event) => {
          const placement = page.placements.find((candidate) => candidate.id === id);
          const node = placement?.source.kind === 'content' ? document.content[placement.source.id] : undefined;
          if (node?.type !== 'text' || placement?.locked) return;
          event.preventDefault();
          event.stopPropagation();
          selectPlacements([id]);
          setEditingPlacementId(id);
        }}
        onTextChange={(id, text) => {
          const placement = page.placements.find((candidate) => candidate.id === id);
          if (!placement || placement.source.kind !== 'content') return;
          const node = document.content[placement.source.id];
          if (node?.type !== 'text' || node.text === text) return;
          const next = structuredClone(document);
          const nextNode = next.content[placement.source.id];
          if (nextNode?.type === 'text') nextNode.text = text;
          replaceDocument(next);
        }}
        onTextEditEnd={() => setEditingPlacementId(undefined)}
      />
      <Selecto
        container={viewportRef.current}
        dragContainer={surfaceRef.current}
        selectableTargets={editingPlacementId ? [] : ['.pe-placement[data-editable="true"]']}
        selectByClick
        selectFromInside={false}
        continueSelect={false}
        hitRate={20}
        ratio={scale}
        onSelect={(event) => selectPlacements(event.selected.map((element) => element.getAttribute('data-placement-id')).filter((id): id is string => Boolean(id)))}
      />
      <Moveable
        target={targets}
        draggable
        resizable
        rotatable
        snappable
        keepRatio={false}
        origin={false}
        zoom={1 / scale}
        bounds={{ left: 0, top: 0, right: page.width, bottom: page.height }}
        onDrag={(event) => {
          event.target.style.left = `${event.left}px`;
          event.target.style.top = `${event.top}px`;
        }}
        onDragEnd={(event) => {
          const id = event.target.getAttribute('data-placement-id');
          if (!id) return;
          const left = Number.parseFloat(event.target.style.left);
          const top = Number.parseFloat(event.target.style.top);
          updatePlacements([{ id, patch: { x: left, y: top } }]);
        }}
        onDragGroup={(event) => event.events.forEach((item) => {
          item.target.style.left = `${item.left}px`;
          item.target.style.top = `${item.top}px`;
        })}
        onDragGroupEnd={(event) => updatePlacements(event.events.flatMap((item) => {
          const id = item.target.getAttribute('data-placement-id');
          return id ? [{ id, patch: { x: Number.parseFloat(item.target.style.left), y: Number.parseFloat(item.target.style.top) } }] : [];
        }))}
        onResize={(event) => {
          event.target.style.width = `${event.width}px`;
          event.target.style.height = `${event.height}px`;
          event.target.style.left = `${event.drag.left}px`;
          event.target.style.top = `${event.drag.top}px`;
        }}
        onResizeEnd={(event) => {
          const id = event.target.getAttribute('data-placement-id');
          if (!id) return;
          updatePlacements([{ id, patch: {
            x: Number.parseFloat(event.target.style.left),
            y: Number.parseFloat(event.target.style.top),
            width: Number.parseFloat(event.target.style.width),
            height: Number.parseFloat(event.target.style.height),
          } }]);
        }}
        onRotate={(event) => {
          const id = event.target.getAttribute('data-placement-id');
          const placement = id ? placementById(id) : undefined;
          event.target.style.transform = `rotate(${event.beforeRotate ?? placement?.rotation ?? 0}deg)`;
        }}
        onRotateEnd={(event) => {
          const id = event.target.getAttribute('data-placement-id');
          if (!id) return;
          const match = event.target.style.transform.match(/rotate\(([-\d.]+)deg\)/);
          updatePlacements([{ id, patch: { rotation: match ? Number(match[1]) : 0 } }]);
        }}
      />
    </div>
    {contextMenu ? <div
      className="pe-editor-context-menu"
      role="menu"
      style={{ left: contextMenu.x, top: contextMenu.y }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {contextPlacement && contextText?.type === 'text' ? <button type="button" role="menuitem" onClick={() => {
        setEditingPlacementId(contextPlacement.id);
        closeContextMenu();
      }}>编辑文字</button> : null}
      {contextPlacement ? <button type="button" role="menuitem" onClick={() => {
        duplicatePlacement(contextPlacement.id);
        closeContextMenu();
      }}>复制元素</button> : null}
      {contextPlacement ? <button type="button" role="menuitem" onClick={() => {
        updatePlacements([{ id: contextPlacement.id, patch: { zIndex: Math.max(...page.placements.map((placement) => placement.zIndex)) + 1 } }]);
        closeContextMenu();
      }}>置于顶层</button> : null}
      {contextPlacement ? <button type="button" role="menuitem" onClick={() => {
        updatePlacements([{ id: contextPlacement.id, patch: { zIndex: Math.min(...page.placements.map((placement) => placement.zIndex)) - 1 } }]);
        closeContextMenu();
      }}>置于底层</button> : null}
      {contextPlacement ? <button type="button" role="menuitem" onClick={() => {
        updatePlacements([{ id: contextPlacement.id, patch: { locked: !contextPlacement.locked } }]);
        closeContextMenu();
      }}>{contextPlacement.locked ? '解锁元素' : '锁定元素'}</button> : null}
      {contextPlacement ? <button className="is-danger" type="button" role="menuitem" onClick={() => {
        deletePlacement(contextPlacement.id);
        closeContextMenu();
      }}>删除元素</button> : <span>在画布元素上右键可使用常用操作</span>}
    </div> : null}
  </div>;
}
