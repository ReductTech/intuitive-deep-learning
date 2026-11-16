import {
  useCallback,
  useId,
  useMemo,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Typography } from "@shuku/course-style/react";
import './NetworkCanvas.css';

export type NetworkNodeTone = 'input' | 'hidden' | 'output' | 'relu' | 'neutral';

export interface NetworkNodeDetails {
  title?: string;
  body?: string;
  code?: string;
  content?: ReactNode;
}

export interface NetworkNode {
  label: string;
  caption?: string;
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
  color?: string;
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
  fontScale?: number;
  activeNode?: NetworkNodeRef | null;
  onActiveNodeChange?: (node: NetworkNodeRef | null) => void;
  showInspector?: boolean;
}

interface PositionedNode extends NetworkNodeRef {
  x: number;
  y: number;
  node: NetworkNode;
}

type DiagramStyle = CSSProperties & {
  '--ngtw-network-height'?: string;
  '--ngtw-network-font-scale'?: number;
};

type PositionedStyle = CSSProperties & {
  '--ngtw-network-x'?: string;
  '--ngtw-network-y'?: string;
  '--ngtw-network-node-color'?: string;
};

const TONE_COLORS: Readonly<Record<NetworkNodeTone, string>> = Object.freeze({
  input: '#2f4b78',
  hidden: '#d88a34',
  output: '#3f9566',
  relu: '#e07845',
  neutral: '#68778f',
});

function sameNode(left: NetworkNodeRef | null, right: NetworkNodeRef | null) {
  if (!left || !right) return left === right;
  return left.layer === right.layer && left.index === right.index;
}

function layerPosition(index: number, layerCount: number) {
  if (layerCount <= 1) return 50;
  return 13 + index * (74 / (layerCount - 1));
}

function compactNodePositions(count: number) {
  if (count <= 1) return [50];
  const span = Math.min(60, (count - 1) * 22);
  const start = 50 - span / 2;
  return Array.from({ length: count }, (_, index) => start + index * (span / (count - 1)));
}

function nodeTone(node: NetworkNode, layer: number, layerCount: number): NetworkNodeTone {
  if (node.tone) return node.tone;
  if (node.activation === 'relu') return 'relu';
  if (layer === 0) return 'input';
  return layer === layerCount - 1 ? 'output' : 'hidden';
}

function nodeColor(node: NetworkNode, layer: number, layerCount: number) {
  return node.color ?? TONE_COLORS[nodeTone(node, layer, layerCount)];
}

function describeNetwork(layers: NetworkLayer[], connections: NetworkConnection[], caption?: string) {
  const layerSummary = layers
    .map((layer) => `${layer.title}：${layer.nodes.map((node) => node.label).join('、')}`)
    .join('；');
  return `${layerSummary}。共 ${connections.length} 条连接。${caption ?? ''}`.trim();
}

export function NetworkCanvas({
  layers,
  connections,
  ariaLabel,
  caption,
  summary,
  className,
  height = 360,
  fontScale = 1,
  activeNode,
  onActiveNodeChange,
  showInspector = true,
}: NetworkCanvasProps) {
  const [internalActiveNode, setInternalActiveNode] = useState<NetworkNodeRef | null>(null);
  const selectedNode = activeNode === undefined ? internalActiveNode : activeNode;
  const descriptionId = useId();
  const inspectorId = useId();
  const textSummary = useMemo(
    () => summary ?? describeNetwork(layers, connections, caption),
    [caption, connections, layers, summary],
  );
  const positionedNodes = useMemo<PositionedNode[]>(() => layers.flatMap((layer, layerIndex) => {
    const yPositions = compactNodePositions(layer.nodes.length);
    const x = layerPosition(layerIndex, layers.length);
    return layer.nodes.map((node, index) => ({
      layer: layerIndex,
      index,
      x,
      y: yPositions[index] ?? 50,
      node,
    }));
  }), [layers]);
  const selectedPosition = selectedNode
    ? positionedNodes.find((node) => sameNode(node, selectedNode)) ?? null
    : null;
  const selectedDetails = selectedPosition?.node.details;

  const publishActiveNode = useCallback((next: NetworkNodeRef | null) => {
    if (activeNode === undefined) setInternalActiveNode(next);
    onActiveNodeChange?.(next);
  }, [activeNode, onActiveNodeChange]);

  const handleNodeKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    positionIndex: number,
  ) => {
    if (event.key === 'Escape') {
      publishActiveNode(null);
      return;
    }
    const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown'
      ? 1
      : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
        ? -1
        : 0;
    if (!direction || positionedNodes.length === 0) return;
    event.preventDefault();
    const nextIndex = (positionIndex + direction + positionedNodes.length) % positionedNodes.length;
    const next = positionedNodes[nextIndex];
    if (!next) return;
    publishActiveNode({ layer: next.layer, index: next.index });
    document.getElementById(`ngtw-network-node-${descriptionId}-${next.layer}-${next.index}`)?.focus();
  };

  const diagramStyle: DiagramStyle = {
    '--ngtw-network-height': `${height}px`,
    '--ngtw-network-font-scale': fontScale,
  };

  return (
    <figure shuku-edit-id="e-0b306226-107a-4466-a489-edc3cd8b5032"
      className={['ngtw-network-figure relative w-full max-w-full h-full min-w-0 m-0', className].filter(Boolean).join(' ')}
      style={diagramStyle}
      aria-label={ariaLabel}
      onPointerLeave={() => publishActiveNode(null)}
    >
      <div shuku-edit-id="e-e4a27456-5573-435b-bbd2-7db64d48e9e5" className="ngtw-network-diagram relative w-full max-w-full h-full min-w-0 overflow-hidden rounded-[inherit]">
        <svg shuku-edit-id="e-822411ef-37ed-41a4-980c-46e088759997" className="ngtw-network-links absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {connections.map((connection, index) => {
            const from = positionedNodes.find(
              (node) => node.layer === connection.fromLayer && node.index === connection.fromIndex,
            );
            const to = positionedNodes.find(
              (node) => node.layer === connection.toLayer && node.index === connection.toIndex,
            );
            if (!from || !to || !Number.isFinite(connection.weight)) return null;
            const color = connection.color ?? nodeColor(from.node, from.layer, layers.length);
            const relatedToSelection = selectedNode
              ? sameNode(from, selectedNode) || sameNode(to, selectedNode)
              : false;
            return (
              <line shuku-edit-id="e-b99df678-cb43-478e-8041-e584cf2a0ba9"
                key={`${connection.fromLayer}-${connection.fromIndex}-${connection.toLayer}-${connection.toIndex}-${index}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                className={selectedNode ? (relatedToSelection ? 'is-related' : 'is-dimmed') : undefined}
                stroke={color}
                strokeWidth={1.5 + Math.min(1.5, Math.abs(connection.weight) * 0.55)}
                opacity={0.32 + Math.min(0.22, Math.abs(connection.weight) * 0.08)}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>

        {layers.map((layer, index) => (
          <Typography shuku-edit-id="e-8e3b4555-daa4-4c79-91b2-036d46e1dbda"
            key={`${layer.title}-${index}`}
            as="div"
            variant="bodySmall"
            tone="muted"
            className="ngtw-network-layer-title"
            style={{ left: `${layerPosition(index, layers.length)}%` }}
          >
            {layer.title}
          </Typography>
        ))}

        {positionedNodes.map((position, positionIndex) => {
          const color = nodeColor(position.node, position.layer, layers.length);
          const isSelected = sameNode(position, selectedNode ?? null);
          const positionedStyle: PositionedStyle = {
            '--ngtw-network-x': `${position.x}%`,
            '--ngtw-network-y': `${position.y}%`,
            '--ngtw-network-node-color': color,
          };
          return (
            <div shuku-edit-id="e-d3b08195-ab9c-479a-8b82-d196776e83e0"
              id={`ngtw-network-node-${descriptionId}-${position.layer}-${position.index}`}
              key={`${position.layer}-${position.index}`}
              className={`ngtw-network-node absolute grid w-[150px] min-w-0 max-w-full justify-items-center gap-[8px]${isSelected ? ' is-selected' : ''}`}
              style={positionedStyle}
              role="button"
              tabIndex={0}
              aria-label={`${layers[position.layer]?.title ?? ''}，节点 ${position.node.label}`}
              aria-describedby={`${descriptionId}${showInspector ? ` ${inspectorId}` : ''}`}
              onPointerEnter={() => publishActiveNode({ layer: position.layer, index: position.index })}
              onFocus={() => publishActiveNode({ layer: position.layer, index: position.index })}
              onClick={() => publishActiveNode({ layer: position.layer, index: position.index })}
              onKeyDown={(event) => handleNodeKeyDown(event, positionIndex)}
            >
              <span shuku-edit-id="e-a2b6d459-2e82-4baf-a5cb-eb48d8219f7e" className="ngtw-network-node__circle grid place-items-center rounded-[50%] bg-[var(--ngtw-network-node-color)]">
                <Typography shuku-edit-id="e-fe3977ce-fe86-4f0c-8e9f-b46d64b14f3d" as="span" variant="body" tone="inherit">{position.node.label}</Typography>
              </span>
              {position.node.caption ? (
                <Typography shuku-edit-id="e-3db80f05-6ed6-4ade-9eee-06903b84bedd" as="code" variant="bodySmall" tone="inherit" className="ngtw-network-node__caption">
                  {position.node.caption}
                </Typography>
              ) : null}
            </div>
          );
        })}

        {caption ? (
          <Typography shuku-edit-id="e-644c04eb-020b-4b00-bfdc-8b06844d9b05" as="figcaption" variant="bodySmall" tone="muted" className="ngtw-network-caption">
            {caption}
          </Typography>
        ) : null}

        <Typography shuku-edit-id="e-905c7261-f05f-4fab-a3ce-ade84f3645d4" id={descriptionId} variant="bodySmall" tone="muted" className="ngtw-network-summary">
          {textSummary}
        </Typography>

        {showInspector ? (
          <aside shuku-edit-id="e-b8028464-851b-4317-905c-46dca2489fbd"
            id={inspectorId}
            className={`ngtw-network-inspector absolute top-[58px] right-[16px] bottom-auto left-[16px] hidden w-auto max-w-[none] overflow-hidden gap-[7px] bg-[rgba(255,_255,_255,_.98)] p-[11px_13px]${selectedDetails && selectedPosition ? ' is-visible' : ''}`}
            style={selectedPosition ? {
              '--ngtw-network-inspector-color': nodeColor(selectedPosition.node, selectedPosition.layer, layers.length),
            } as CSSProperties : undefined}
            aria-live="polite"
          >
            {selectedDetails ? (
              <>
                {selectedDetails.title ? (
                  <Typography shuku-edit-id="e-82c138bf-6e86-463a-938e-846f9fcd306a" as="strong" variant="body" tone="main">{selectedDetails.title}</Typography>
                ) : null}
                {selectedDetails.body ? (
                  <Typography shuku-edit-id="e-4ccdbb73-451e-4bb7-b184-c4d960155a7c" variant="bodySmall" tone="muted">{selectedDetails.body}</Typography>
                ) : null}
                {selectedDetails.content ?? (selectedDetails.code ? (
                  <Typography shuku-edit-id="e-c4abda9d-08c6-4004-96c0-0ac95c3f6069" as="code" variant="body" tone="accent">{selectedDetails.code}</Typography>
                ) : null)}
              </>
            ) : null}
          </aside>
        ) : null}
      </div>
    </figure>
  );
}

