import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { Typography } from '../../shared/react';

export type NetworkNodeTone =
  | 'input'
  | 'hidden'
  | 'output'
  | 'relu'
  | 'neutral';

export interface NetworkNodeDetails {
  title?: string;
  body?: string;
  code?: string;
  content?: ReactNode;
}

export interface NetworkNode {
  label: string;
  details?: NetworkNodeDetails;
  activation?: 'linear' | 'relu' | string;
  tone?: NetworkNodeTone;
  color?: string;
}

export interface NetworkLayer {
  title: string;
  nodes: NetworkNode[];
}

export interface NetworkConnection {
  fromLayer: number;
  fromIndex: number;
  toLayer: number;
  toIndex: number;
  weight: number;
}

export interface NetworkNodeRef {
  layer: number;
  index: number;
}

export interface NetworkCanvasProps {
  layers: NetworkLayer[];
  connections: NetworkConnection[];
  ariaLabel: string;
  caption?: string;
  summary?: string;
  className?: string;
  height?: number;
  activeNode?: NetworkNodeRef | null;
  onActiveNodeChange?: (node: NetworkNodeRef | null) => void;
  showInspector?: boolean;
}

interface PositionedNode extends NetworkNodeRef {
  x: number;
  y: number;
  radius: number;
}

interface CanvasLayout {
  width: number;
  height: number;
  nodes: PositionedNode[];
}

const EMPTY_LAYOUT: CanvasLayout = {
  width: 1,
  height: 1,
  nodes: [],
};

function classNames(...names: Array<string | undefined | false>): string {
  return names.filter(Boolean).join(' ');
}

function sameNode(
  left: NetworkNodeRef | null,
  right: NetworkNodeRef | null,
): boolean {
  if (left === null || right === null) return left === right;
  return left.layer === right.layer && left.index === right.index;
}

function resolveTone(
  node: NetworkNode,
  layerIndex: number,
  layerCount: number,
): NetworkNodeTone {
  if (node.tone) return node.tone;
  if (node.activation === 'relu') return 'relu';
  if (layerIndex === 0) return 'input';
  if (layerIndex === layerCount - 1) return 'output';
  return 'hidden';
}

function nodeAt(
  layers: NetworkLayer[],
  reference: NetworkNodeRef | null,
): NetworkNode | undefined {
  if (!reference) return undefined;
  return layers[reference.layer]?.nodes[reference.index];
}

function fitText(
  context: CanvasRenderingContext2D,
  value: string,
  maxWidth: number,
): string {
  if (context.measureText(value).width <= maxWidth) return value;

  let shortened = value;
  while (
    shortened.length > 1 &&
    context.measureText(`${shortened}…`).width > maxWidth
  ) {
    shortened = shortened.slice(0, -1);
  }
  return `${shortened}…`;
}

function buildLayout(
  layers: NetworkLayer[],
  width: number,
  height: number,
  hasCaption: boolean,
): CanvasLayout {
  const left = Math.max(48, Math.min(76, width * 0.08));
  const right = width - left;
  const top = 72;
  const bottom = height - (hasCaption ? 54 : 28);
  const verticalSpace = Math.max(40, bottom - top);
  const horizontalGap =
    layers.length > 1 ? (right - left) / (layers.length - 1) : width;
  const radius = Math.max(13, Math.min(19, horizontalGap * 0.18));
  const nodes: PositionedNode[] = [];

  layers.forEach((layer, layerIndex) => {
    const x =
      layers.length === 1
        ? width / 2
        : left + layerIndex * horizontalGap;
    const nodeCount = layer.nodes.length;
    const gap =
      nodeCount > 1
        ? Math.min(58, verticalSpace / (nodeCount - 1))
        : 0;
    const startY = top + verticalSpace / 2 - (gap * (nodeCount - 1)) / 2;

    layer.nodes.forEach((_, index) => {
      nodes.push({
        layer: layerIndex,
        index,
        x,
        y: startY + index * gap,
        radius,
      });
    });
  });

  return { width, height, nodes };
}

function findPosition(
  layout: CanvasLayout,
  layer: number,
  index: number,
): PositionedNode | undefined {
  return layout.nodes.find(
    (node) => node.layer === layer && node.index === index,
  );
}

function drawNetwork(
  canvas: HTMLCanvasElement,
  layers: NetworkLayer[],
  connections: NetworkConnection[],
  caption: string | undefined,
  selected: NetworkNodeRef | null,
): CanvasLayout {
  const context = canvas.getContext('2d');
  if (!context) return EMPTY_LAYOUT;

  const bounds = canvas.getBoundingClientRect();
  const logicalWidth = Math.max(280, Math.round(bounds.width || 960));
  const logicalHeight = Math.max(220, Math.round(bounds.height || 360));
  const pixelRatio = Math.max(
    1,
    Math.min(3, window.devicePixelRatio || 1),
  );
  const pixelWidth = Math.round(logicalWidth * pixelRatio);
  const pixelHeight = Math.round(logicalHeight * pixelRatio);

  if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
  if (canvas.height !== pixelHeight) canvas.height = pixelHeight;

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, logicalWidth, logicalHeight);
  const computedStyle = window.getComputedStyle(canvas);
  const readColor = (token: string, fallback: string) =>
    computedStyle.getPropertyValue(token).trim() || fallback;
  const colors: Record<NetworkNodeTone | 'accentAlt' | 'muted' | 'background', string> = {
    input: readColor('--ui-accent', '#27446e'),
    hidden: readColor('--ui-success', '#228d5c'),
    output: readColor('--ui-danger', '#c43f52'),
    relu: readColor('--ui-accent-alt', '#f07e47'),
    neutral: readColor('--ui-text-muted', '#68778f'),
    accentAlt: readColor('--ui-accent-alt', '#f07e47'),
    muted: readColor('--ui-text-muted', '#68778f'),
    background: readColor('--ui-bg-soft', '#fbfdff'),
  };
  context.fillStyle = colors.background;
  context.fillRect(0, 0, logicalWidth, logicalHeight);
  const sansFont = computedStyle.getPropertyValue('--ui-font-sans').trim()
    || '"Segoe UI", "PingFang SC", Arial, sans-serif';
  const monoFont = computedStyle.getPropertyValue('--ui-font-mono').trim()
    || '"Cascadia Code", Consolas, monospace';

  const layout = buildLayout(
    layers,
    logicalWidth,
    logicalHeight,
    Boolean(caption),
  );

  context.save();
  context.lineCap = 'round';
  connections.forEach((connection) => {
    const from = findPosition(
      layout,
      connection.fromLayer,
      connection.fromIndex,
    );
    const to = findPosition(
      layout,
      connection.toLayer,
      connection.toIndex,
    );
    if (!from || !to || !Number.isFinite(connection.weight)) return;

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy) || 1;
    const unitX = dx / length;
    const unitY = dy / length;
    const magnitude = Math.abs(connection.weight);

    context.beginPath();
    context.moveTo(
      from.x + unitX * from.radius,
      from.y + unitY * from.radius,
    );
    context.lineTo(
      to.x - unitX * to.radius,
      to.y - unitY * to.radius,
    );
    context.strokeStyle =
      connection.weight >= 0 ? colors.input : colors.output;
    context.globalAlpha = 0.24 + Math.min(0.3, magnitude * 0.12);
    context.lineWidth = 0.9 + Math.min(2.8, magnitude * 1.45);
    context.stroke();
  });
  context.restore();

  const titleFontSize = layers.length > 5 ? 10 : 12;
  layers.forEach((layer, layerIndex) => {
    const layerNodes = layout.nodes.filter(
      (node) => node.layer === layerIndex,
    );
    const x = layerNodes[0]?.x ?? logicalWidth / 2;

    context.fillStyle = colors.muted;
    context.font = `900 ${titleFontSize}px ${sansFont}`;
    context.textAlign = 'center';
    context.textBaseline = 'alphabetic';
    context.fillText(
      fitText(context, layer.title, Math.max(44, logicalWidth / layers.length - 8)),
      x,
      34,
    );

    layerNodes.forEach((position) => {
      const node = layer.nodes[position.index];
      if (!node) return;
      const isSelected = sameNode(position, selected);
      const tone = resolveTone(node, layerIndex, layers.length);

      context.beginPath();
      context.arc(
        position.x,
        position.y,
        position.radius,
        0,
        Math.PI * 2,
      );
      context.fillStyle = node.color ?? colors[tone];
      context.fill();
      context.strokeStyle = '#ffffff';
      context.lineWidth = 3;
      context.stroke();

      if (isSelected) {
        context.beginPath();
        context.arc(
          position.x,
          position.y,
          position.radius + 6,
          0,
          Math.PI * 2,
        );
        context.strokeStyle = tone === 'relu'
          ? colors.hidden
          : colors.accentAlt;
        context.lineWidth = 3;
        context.stroke();
      }

      context.fillStyle = '#ffffff';
      context.font = `900 ${position.radius < 16 ? 9 : 11}px ${sansFont}`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(
        fitText(context, node.label, position.radius * 1.55),
        position.x,
        position.y,
      );
    });
  });

  if (caption) {
    context.fillStyle = colors.muted;
    context.font = `800 12px ${monoFont}`;
    context.textAlign = 'center';
    context.textBaseline = 'alphabetic';
    context.fillText(
      fitText(context, caption, logicalWidth - 32),
      logicalWidth / 2,
      logicalHeight - 18,
    );
  }

  return layout;
}

function nearestNode(
  event: PointerEvent<HTMLCanvasElement>,
  layout: CanvasLayout,
): NetworkNodeRef | null {
  const bounds = event.currentTarget.getBoundingClientRect();
  if (bounds.width <= 0 || bounds.height <= 0) return null;

  const x =
    ((event.clientX - bounds.left) / bounds.width) * layout.width;
  const y =
    ((event.clientY - bounds.top) / bounds.height) * layout.height;
  let closest: PositionedNode | null = null;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const node of layout.nodes) {
    const distance = Math.hypot(node.x - x, node.y - y);
    if (distance <= node.radius + 10 && distance < closestDistance) {
      closest = node;
      closestDistance = distance;
    }
  }

  return closest
    ? { layer: closest.layer, index: closest.index }
    : null;
}

function describeNetwork(
  layers: NetworkLayer[],
  connections: NetworkConnection[],
  caption: string | undefined,
): string {
  const layerSummary = layers
    .map((layer) => {
      const nodes = layer.nodes
        .map((node) =>
          node.activation
            ? `${node.label}（${node.activation}）`
            : node.label,
        )
        .join('、');
      return `${layer.title}：${nodes || '无节点'}`;
    })
    .join('；');

  return `${layerSummary}。共 ${connections.length} 条连接。${
    caption ?? ''
  }`.trim();
}

export function NetworkCanvas({
  layers,
  connections,
  ariaLabel,
  caption,
  summary,
  className,
  height = 360,
  activeNode,
  onActiveNodeChange,
  showInspector = true,
}: NetworkCanvasProps) {
  const figureRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inspectorRef = useRef<HTMLElement>(null);
  const inspectorNaturalWidthRef = useRef(0);
  const layoutRef = useRef<CanvasLayout>(EMPTY_LAYOUT);
  const [internalActiveNode, setInternalActiveNode] =
    useState<NetworkNodeRef | null>(null);
  const isControlled = activeNode !== undefined;
  const selectedNode = isControlled
    ? activeNode ?? null
    : internalActiveNode;
  const selectedNodeRef = useRef<NetworkNodeRef | null>(selectedNode);
  selectedNodeRef.current = selectedNode;

  const descriptionId = useId();
  const inspectorId = useId();
  const textSummary = useMemo(
    () => summary ?? describeNetwork(layers, connections, caption),
    [caption, connections, layers, summary],
  );
  const flattenedNodes = useMemo(
    () =>
      layers.flatMap((layer, layerIndex) =>
        layer.nodes.map((_, index) => ({ layer: layerIndex, index })),
      ),
    [layers],
  );

  const publishActiveNode = useCallback(
    (next: NetworkNodeRef | null) => {
      if (sameNode(selectedNodeRef.current, next)) return;
      selectedNodeRef.current = next;
      if (!isControlled) setInternalActiveNode(next);
      onActiveNodeChange?.(next);
    },
    [isControlled, onActiveNodeChange],
  );

  const positionInspector = useCallback((remeasure = false) => {
    const figure = figureRef.current;
    const canvas = canvasRef.current;
    const inspector = inspectorRef.current;
    const layout = layoutRef.current;
    if (!figure || !canvas || !inspector || !selectedNode) return;

    const positioned = findPosition(
      layout,
      selectedNode.layer,
      selectedNode.index,
    );
    if (!positioned || layout.width <= 0 || layout.height <= 0) return;

    const figureBox = figure.getBoundingClientRect();
    const canvasBox = canvas.getBoundingClientRect();
    const figureScaleX = figureBox.width / figure.clientWidth || 1;
    const figureScaleY = figureBox.height / figure.clientHeight || 1;
    const canvasLeft = (canvasBox.left - figureBox.left) / figureScaleX;
    const canvasTop = (canvasBox.top - figureBox.top) / figureScaleY;
    const canvasWidth = canvasBox.width / figureScaleX;
    const canvasHeight = canvasBox.height / figureScaleY;
    const scaleX = canvasWidth / layout.width;
    const scaleY = canvasHeight / layout.height;
    const nodeX =
      canvasLeft + positioned.x * scaleX;
    const nodeY =
      canvasTop + positioned.y * scaleY;

    const inset = 12;
    const availableWidth = Math.max(0, figure.clientWidth - inset * 2);
    const availableHeight = Math.max(0, figure.clientHeight - inset * 2);

    // Measure the current content at its natural size. This intentionally runs
    // again whenever the selected node/content changes; no popup dimensions are
    // guessed in advance.
    if (remeasure || inspectorNaturalWidthRef.current <= 0) {
      inspector.style.width = 'max-content';
      inspector.style.maxWidth = 'none';
      inspectorNaturalWidthRef.current = Math.ceil(
        Math.max(inspector.scrollWidth, inspector.offsetWidth),
      );
    }

    const popupWidth = Math.min(
      inspectorNaturalWidthRef.current,
      availableWidth,
    );
    const nextWidth = `${popupWidth}px`;
    const nextMaxWidth = `${availableWidth}px`;
    const nextMaxHeight = `${availableHeight}px`;
    if (inspector.style.width !== nextWidth) inspector.style.width = nextWidth;
    if (inspector.style.maxWidth !== nextMaxWidth) {
      inspector.style.maxWidth = nextMaxWidth;
    }
    if (inspector.style.maxHeight !== nextMaxHeight) {
      inspector.style.maxHeight = nextMaxHeight;
    }

    // Height follows the content after its measured width has been applied.
    const popupHeight = Math.min(inspector.offsetHeight, availableHeight);
    const offset = positioned.radius * scaleX + 14;
    let left = nodeX + offset;
    if (left + popupWidth > figure.clientWidth - inset) {
      left = nodeX - popupWidth - offset;
    }
    left = Math.max(
      inset,
      Math.min(
        left,
        Math.max(inset, figure.clientWidth - popupWidth - inset),
      ),
    );
    const top = Math.max(
      inset,
      Math.min(
        nodeY - popupHeight / 2,
        Math.max(inset, figure.clientHeight - popupHeight - inset),
      ),
    );
    inspector.style.left = `${left}px`;
    inspector.style.top = `${top}px`;
  }, [selectedNode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animationFrame = 0;
    const redraw = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        layoutRef.current = drawNetwork(
          canvas,
          layers,
          connections,
          caption,
          selectedNode,
        );
        positionInspector();
      });
    };

    redraw();

    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(redraw);
    if (resizeObserver && canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    } else {
      window.addEventListener('resize', redraw);
    }

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', redraw);
    };
  }, [caption, connections, layers, positionInspector, selectedNode]);

  const handlePointerMove = (
    event: PointerEvent<HTMLCanvasElement>,
  ) => {
    publishActiveNode(nearestNode(event, layoutRef.current));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
    if (flattenedNodes.length === 0) return;

    const currentIndex = selectedNode
      ? flattenedNodes.findIndex((node) => sameNode(node, selectedNode))
      : -1;
    let nextIndex = currentIndex;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (currentIndex + 1) % flattenedNodes.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex =
          (currentIndex - 1 + flattenedNodes.length) %
          flattenedNodes.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = flattenedNodes.length - 1;
        break;
      case 'Escape':
        event.preventDefault();
        publishActiveNode(null);
        return;
      default:
        return;
    }

    event.preventDefault();
    publishActiveNode(flattenedNodes[nextIndex] ?? null);
  };

  const selectedDetails = nodeAt(layers, selectedNode);
  const inspectorDetails = selectedDetails?.details;
  const selectedLayer = selectedNode
    ? layers[selectedNode.layer]
    : undefined;
  useLayoutEffect(() => {
    inspectorNaturalWidthRef.current = 0;
    positionInspector(true);
  }, [inspectorDetails, positionInspector]);

  useLayoutEffect(() => {
    const figure = figureRef.current;
    const inspector = inspectorRef.current;
    if (!figure || !inspector || !inspectorDetails) return;

    let animationFrame = 0;
    const reposition = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => positionInspector());
    };
    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(reposition);

    resizeObserver?.observe(figure);
    resizeObserver?.observe(inspector);
    window.addEventListener('resize', reposition);

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', reposition);
    };
  }, [inspectorDetails, positionInspector]);
  const describedBy = showInspector
    ? `${descriptionId} ${inspectorId}`
    : descriptionId;

  return (
    <figure
      ref={figureRef}
      className={classNames('af-network-figure', className)}
      data-active-layer={selectedNode?.layer}
      data-active-index={selectedNode?.index}
    >
      <canvas
        ref={canvasRef}
        className="af-network-canvas"
        width={960}
        height={height}
        role="img"
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Home End Escape"
        tabIndex={0}
        onFocus={() => {
          if (!selectedNodeRef.current) {
            publishActiveNode(flattenedNodes[0] ?? null);
          }
        }}
        onBlur={() => publishActiveNode(null)}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerMove}
        onPointerLeave={() => publishActiveNode(null)}
        onKeyDown={handleKeyDown}
      >
        {textSummary}
      </canvas>

      <Typography id={descriptionId} variant="bodySmall" tone="muted" className="af-network-summary">
        {textSummary}
      </Typography>

      {showInspector ? (
        <aside
          ref={inspectorRef}
          id={inspectorId}
          className={classNames(
            'af-network-inspector',
            inspectorDetails && 'is-visible',
          )}
          aria-live="polite"
          aria-atomic="true"
        >
          {selectedDetails && inspectorDetails ? (
            <>
              <Typography as="strong" variant="subtitle" tone="accent">
                {inspectorDetails.title ??
                  `${selectedLayer?.title ?? '网络节点'} · ${
                    selectedDetails.label
                  }`}
              </Typography>
              {inspectorDetails.body ? (
                <Typography variant="bodySmall" tone="main">{inspectorDetails.body}</Typography>
              ) : null}
              {inspectorDetails.content ?? (inspectorDetails.code ? (
                <Typography as="code" variant="bodySmall" tone="accent">{inspectorDetails.code}</Typography>
              ) : null)}
            </>
          ) : null}
        </aside>
      ) : null}
    </figure>
  );
}
