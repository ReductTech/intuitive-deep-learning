import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { ContentNode, GuideSection, PresentationDocument, SlidePage, SlidePlacement, SourceRef } from './document';
import type { PresentationMode } from './store';
import { WidgetRenderer } from './widget-registry';

function contentClass(node: ContentNode): string {
  return node.type === 'text' ? `pe-text pe-text--${node.role}` : `pe-content pe-content--${node.type}`;
}

export function SourceRenderer({ document, source, mode, activeTargetId, editable, onTextChange }: {
  document: PresentationDocument;
  source: SourceRef;
  mode: PresentationMode;
  activeTargetId?: string;
  editable?: boolean;
  onTextChange?: (text: string) => void;
}) {
  if (source.kind === 'widget') {
    const instance = document.widgets[source.id];
    if (!instance) return <div className="pe-reference-error">Missing widget {source.id}</div>;
    return <WidgetRenderer instance={instance} mode={mode} activeAnchorId={activeTargetId} />;
  }

  const node = document.content[source.id];
  if (!node) return <div className="pe-reference-error">Missing content {source.id}</div>;
  if (node.type === 'text') {
    return <div
      className={contentClass(node)}
      aria-label={node.ariaLabel}
      aria-multiline={editable || undefined}
      contentEditable={editable}
      role={editable ? 'textbox' : undefined}
      suppressContentEditableWarning
      spellCheck={false}
      onPointerDown={(event) => editable && event.stopPropagation()}
      onBlur={(event) => editable && onTextChange?.(event.currentTarget.textContent ?? '')}
      onKeyDown={(event) => { if (event.key === 'Escape') event.currentTarget.blur(); }}
    >{node.text}</div>;
  }
  if (node.type === 'image') {
    const asset = document.assets[node.assetId];
    return asset
      ? <img className={contentClass(node)} src={asset.src} alt={node.alt} style={{ objectFit: node.fit }} />
      : <div className="pe-reference-error">Missing asset {node.assetId}</div>;
  }
  return <div className={`${contentClass(node)} pe-shape--${node.shape}`} aria-label={node.label} />;
}

function placementStyle(placement: SlidePlacement): CSSProperties {
  return {
    left: placement.x,
    top: placement.y,
    width: placement.width,
    height: placement.height,
    transform: `rotate(${placement.rotation}deg)`,
    zIndex: placement.zIndex,
    color: placement.style.color,
    fontFamily: placement.style.fontFamily,
    fontSize: placement.style.fontSize,
    fontWeight: placement.style.fontWeight,
    fontStyle: placement.style.fontStyle,
    textDecoration: placement.style.textDecoration,
    lineHeight: placement.style.lineHeight,
    letterSpacing: placement.style.letterSpacing,
    background: placement.style.background,
    border: placement.style.border,
    borderRadius: placement.style.borderRadius,
    padding: placement.style.padding,
    boxShadow: placement.style.boxShadow,
    opacity: placement.style.opacity,
    textAlign: placement.style.textAlign,
    alignItems: placement.style.verticalAlign === 'middle' ? 'center' : placement.style.verticalAlign === 'bottom' ? 'flex-end' : undefined,
    overflow: placement.style.overflow,
    display: placement.hidden ? 'none' : placement.style.verticalAlign ? 'flex' : undefined,
  };
}

export function SlideSurface({ document, page, mode, selectedIds = [], activeTargetId, editingPlacementId, onPlacementPointerDown, onTextChange, children }: {
  document: PresentationDocument;
  page: SlidePage;
  mode: PresentationMode;
  selectedIds?: string[];
  activeTargetId?: string;
  editingPlacementId?: string;
  onPlacementPointerDown?: (placementId: string, event: React.PointerEvent) => void;
  onTextChange?: (placementId: string, text: string) => void;
  children?: ReactNode;
}) {
  const placements = useMemo(() => [...page.placements].sort((a, b) => a.zIndex - b.zIndex), [page.placements]);
  return <div
    className={`pe-slide-surface pe-slide-surface--${mode}`}
    style={{ width: page.width, height: page.height, background: page.background }}
    data-slide-id={page.id}
  >
    {placements.map((placement) => {
      const targetMatches = activeTargetId === placement.id || activeTargetId === placement.source.id;
      return <div
        className={`pe-placement${selectedIds.includes(placement.id) ? ' is-selected' : ''}${targetMatches ? ' is-narration-target' : ''}${placement.locked ? ' is-locked' : ''}`}
        data-placement-id={placement.id}
        data-source-id={placement.source.id}
        data-editable={!placement.locked}
        key={placement.id}
        style={placementStyle(placement)}
        onPointerDown={(event) => onPlacementPointerDown?.(placement.id, event)}
      >
        <SourceRenderer document={document} source={placement.source} mode={mode} activeTargetId={activeTargetId} editable={editingPlacementId === placement.id} onTextChange={(text) => onTextChange?.(placement.id, text)} />
      </div>;
    })}
    {children}
  </div>;
}

export function ScaledSlide({ document, page, mode = 'present', activeTargetId }: {
  document: PresentationDocument;
  page: SlidePage;
  mode?: PresentationMode;
  activeTargetId?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const update = () => setScale(Math.min(host.clientWidth / page.width, host.clientHeight / page.height));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(host);
    return () => observer.disconnect();
  }, [page.height, page.width]);
  return <div className="pe-slide-host" ref={hostRef}>
    <div className="pe-slide-scaled" style={{ width: page.width, height: page.height, transform: `translate(-50%, -50%) scale(${scale})` }}>
      <SlideSurface document={document} page={page} mode={mode} activeTargetId={activeTargetId} />
    </div>
  </div>;
}

function sectionClass(section: GuideSection): string {
  return `pe-guide-section pe-guide-section--${section.layout} pe-guide-section--${section.theme}`;
}

export function GuideRenderer({ document, activeTargetId }: { document: PresentationDocument; activeTargetId?: string }) {
  return <main className="pe-guide">
    {document.views.guide.sections.map((section) => <section className={sectionClass(section)} key={section.id} data-section-id={section.id}>
      {section.title && <h2>{section.title}</h2>}
      <div className="pe-guide-section__content">
        {section.sources.map((source) => <div
          className={`pe-guide-item${activeTargetId === source.id ? ' is-narration-target' : ''}`}
          data-source-id={source.id}
          key={`${source.kind}:${source.id}`}
        >
          <SourceRenderer document={document} source={source} mode="guide" activeTargetId={activeTargetId} />
        </div>)}
      </div>
    </section>)}
  </main>;
}
