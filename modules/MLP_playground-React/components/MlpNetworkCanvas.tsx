import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { forward } from '../model/mlpEngine';
import type { ForwardResult, MlpLabState } from '../model/mlpTypes';
import { MathFormulaBlock, MathFormulaTerm } from '../../shared/react';
import {
  useResponsiveCanvas,
  type ResponsiveCanvasSize,
} from './useResponsiveCanvas';

export interface MlpNetworkCanvasProps {
  state: MlpLabState;
  className?: string;
  ariaLabel?: string;
}

interface NetworkNode {
  x: number;
  y: number;
  layer: number;
  index: number;
  label: string;
}

const FONT_SANS =
  '"Segoe UI", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif';
const FONT_MONO =
  '"SFMono-Regular", Consolas, "Liberation Mono", monospace';

function coordinateName(index: number): string {
  return ['x', 'y', 'z'][index] ?? `x${index + 1}`;
}

function sameNode(
  left: NetworkNode | null,
  right: NetworkNode | null,
): boolean {
  if (left === null || right === null) return left === right;
  return left.layer === right.layer && left.index === right.index;
}

function selectedForwardResult(state: MlpLabState): ForwardResult | null {
  const index = state.selectedSampleIndex;
  if (index === null || !state.data[index]) return null;
  return forward(state, state.data[index].x);
}

function nodeLabel(
  layer: number,
  index: number,
  layerCount: number,
): string {
  if (layer === 0) return coordinateName(index);
  if (layer === layerCount - 1) return 'p';
  return `h${layer}.${index + 1}`;
}

function drawNetwork(
  canvas: HTMLCanvasElement,
  state: MlpLabState,
  size: ResponsiveCanvasSize,
  hoveredNode: NetworkNode | null,
): NetworkNode[] {
  const context = canvas.getContext('2d');
  if (!context) return [];
  context.setTransform(
    size.pixelRatio,
    0,
    0,
    size.pixelRatio,
    0,
    0,
  );
  context.clearRect(0, 0, size.width, size.height);
  context.fillStyle = '#fbfdff';
  context.fillRect(0, 0, size.width, size.height);

  const sizes = state.sizes;
  const layerCount = sizes.length;
  const horizontalMargin = Math.min(
    70,
    Math.max(38, size.width * 0.14),
  );
  const horizontalSpan = Math.max(
    1,
    size.width - horizontalMargin * 2,
  );
  const xPositions = sizes.map((_, index) =>
    layerCount <= 1
      ? size.width / 2
      : horizontalMargin +
        index * (horizontalSpan / (layerCount - 1)),
  );
  const layers: NetworkNode[][] = sizes.map((layerSize, layer) => {
    const shown = Math.min(layerSize, 12);
    const availableHeight = Math.max(70, size.height - 125);
    const gap =
      shown <= 1
        ? 0
        : Math.min(42, availableHeight / Math.max(1, shown - 1));
    const start = size.height / 2 - (gap * (shown - 1)) / 2;
    return Array.from({ length: shown }, (_, index) => ({
      x: xPositions[layer],
      y: start + index * gap,
      layer,
      index,
      label: nodeLabel(layer, index, layerCount),
    }));
  });

  for (let layer = 0; layer < layers.length - 1; layer += 1) {
    layers[layer].forEach((startNode, column) => {
      layers[layer + 1].forEach((endNode, row) => {
        const weight = state.W[layer]?.[row]?.[column] ?? 0;
        context.strokeStyle =
          weight >= 0
            ? 'rgba(39,68,110,0.30)'
            : 'rgba(196,63,82,0.30)';
        context.lineWidth =
          0.8 + Math.min(2.8, Math.abs(weight) * 1.8);
        context.beginPath();
        context.moveTo(startNode.x + 17, startNode.y);
        context.lineTo(endNode.x - 17, endNode.y);
        context.stroke();
      });
    });
  }

  const output = selectedForwardResult(state);
  const nodes: NetworkNode[] = [];
  layers.forEach((layerNodes, layer) => {
    layerNodes.forEach((node) => {
      const value = output?.acts[layer]?.[node.index];
      const isHovered =
        hoveredNode?.layer === node.layer &&
        hoveredNode.index === node.index;
      context.beginPath();
      context.arc(node.x, node.y, 18, 0, Math.PI * 2);
      if (!Number.isFinite(value)) {
        context.fillStyle =
          layer === 0
            ? '#27446e'
            : layer === layers.length - 1
              ? '#c43f52'
              : '#228d5c';
      } else if (layer === layers.length - 1) {
        context.fillStyle = `rgba(196,63,82,${(
          0.35 +
          (value ?? 0) * 0.65
        ).toFixed(2)})`;
      } else {
        context.fillStyle = (value ?? 0) >= 0 ? '#228d5c' : '#c07100';
      }
      context.fill();
      context.strokeStyle = '#fff';
      context.lineWidth = 3;
      context.stroke();

      if (isHovered) {
        context.beginPath();
        context.arc(node.x, node.y, 24, 0, Math.PI * 2);
        context.strokeStyle = '#f07e47';
        context.lineWidth = 3;
        context.stroke();
      }

      context.fillStyle = '#fff';
      context.font = `900 11px ${FONT_SANS}`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(node.label, node.x, node.y);
      if (Number.isFinite(value)) {
        context.fillStyle = '#21324a';
        context.font = `900 10px ${FONT_MONO}`;
        context.fillText(
          (value as number).toFixed(2),
          node.x + (layer === 0 ? -40 : 40),
          node.y,
        );
      }
      nodes.push(node);
    });

    context.fillStyle = '#68778f';
    context.font = `900 12px ${FONT_SANS}`;
    context.textAlign = 'center';
    context.textBaseline = 'alphabetic';
    const heading =
      layer === 0
        ? `输入（${sizes[layer]}）`
        : layer === layers.length - 1
          ? '输出（1）'
          : `隐藏层 ${layer}（${sizes[layer]}）`;
    context.fillText(heading, xPositions[layer], 35);
  });

  context.fillStyle = '#68778f';
  context.font = `800 12px ${FONT_MONO}`;
  context.textAlign = 'center';
  context.textBaseline = 'alphabetic';
  context.fillText(
    output
      ? `悬停神经元查看整层矩阵计算 · p(red)=${output.p.toFixed(3)}`
      : '先点击左侧样本，再悬停神经元查看矩阵计算',
    size.width / 2,
    size.height - 20,
  );

  return nodes;
}

function pointerPosition(
  event: ReactPointerEvent<HTMLCanvasElement>,
  size: ResponsiveCanvasSize,
): { x: number; y: number } {
  const rect = event.currentTarget.getBoundingClientRect();
  return {
    x:
      ((event.clientX - rect.left) / Math.max(1, rect.width)) *
      size.width,
    y:
      ((event.clientY - rect.top) / Math.max(1, rect.height)) *
      size.height,
  };
}

function formatVector(values: readonly number[]): string {
  return `[${values.map((value) => value.toFixed(2)).join(', ')}]`;
}

function formatMatrix(
  values: readonly (readonly number[])[],
  focusedRow: number,
): string {
  return values
    .map(
      (row, index) =>
        `${index === focusedRow ? '→' : ' '} ${formatVector(row)}`,
    )
    .join('\n');
}

function NetworkInspector({
  state,
  node,
}: {
  state: MlpLabState;
  node: NetworkNode;
}) {
  const selectedIndex = state.selectedSampleIndex;
  const selected =
    selectedIndex === null ? null : state.data[selectedIndex] ?? null;
  if (!selected) return null;
  const output = forward(state, selected.x);

  if (node.layer === 0) {
    return (
      <div className="mlp-react-inspector" role="status">
        <strong>输入层 a0 · {node.label}</strong>
        <div className="mlp-react-inspector__copy">
          输入层直接承载空间坐标，不进行矩阵运算。
        </div>
        <div className="mlp-react-inspector__part">
          <b>坐标向量 </b>
          <code>a0 = {formatVector(selected.x)}</code>
        </div>
      </div>
    );
  }

  const modelLayer = node.layer - 1;
  const previous = output.acts[modelLayer];
  const weights = state.W[modelLayer];
  const rawBias = state.B[modelLayer];
  const visibleBias = state.useBias
    ? rawBias
    : rawBias.map(() => 0);
  const zVector = output.zs[modelLayer];
  const activationVector = output.acts[node.layer];
  const isOutput = node.layer === state.sizes.length - 1;
  const activationName = isOutput
    ? 'sigmoid'
    : state.useActivation
      ? 'tanh'
      : 'identity';

  return (
    <div className="mlp-react-inspector" role="status">
      <strong>
        第 {node.layer} 层矩阵计算 · {node.label}
      </strong>
      <div className="mlp-react-inspector__copy">
        箭头标出当前悬停神经元对应的矩阵行；下面仍展示整层计算。
      </div>
      <div className="mlp-react-inspector__part">
        <b>W{node.layer}</b>
        <pre className="mlp-react-inspector__matrix">
          <code>{formatMatrix(weights, node.index)}</code>
        </pre>
      </div>
      <div className="mlp-react-inspector__equation">
        <MathFormulaBlock ariaLabel={`第 ${node.layer} 层线性计算`}>
          <MathFormulaTerm
            latex={`W_${node.layer}a_${modelLayer}+${state.useBias ? `b_${node.layer}` : '0'}=z_${node.layer}`}
            tooltip="当前层先做矩阵乘法并加上偏置，得到激活前的 z"
          />
        </MathFormulaBlock>
      </div>
      <div className="mlp-react-inspector__part">
        <b>a{modelLayer} </b>
        <code>{formatVector(previous)}</code>
      </div>
      <div className="mlp-react-inspector__part">
        <b>{state.useBias ? `b${node.layer}` : '偏置已关闭'} </b>
        <code>{formatVector(visibleBias)}</code>
      </div>
      <div className="mlp-react-inspector__part">
        <b>z{node.layer} </b>
        <code>{formatVector(zVector)}</code>
      </div>
      <div className="mlp-react-inspector__part">
        <b>
          a{node.layer} = {activationName}(z{node.layer}){' '}
        </b>
        <code>{formatVector(activationVector)}</code>
      </div>
    </div>
  );
}

export function MlpNetworkCanvas({
  state,
  className,
  ariaLabel,
}: MlpNetworkCanvasProps) {
  const { canvasRef, size } = useResponsiveCanvas();
  const nodesRef = useRef<NetworkNode[]>([]);
  const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(
    null,
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    nodesRef.current = drawNetwork(
      canvas,
      state,
      size,
      hoveredNode,
    );
  }, [canvasRef, hoveredNode, size, state]);

  useEffect(() => {
    if (!hoveredNode) return;
    if (
      hoveredNode.layer >= state.sizes.length ||
      hoveredNode.index >= state.sizes[hoveredNode.layer]
    ) {
      setHoveredNode(null);
    }
  }, [hoveredNode, state.sizes]);

  const rootClassName = ['mlp-react-network-wrap', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClassName} data-telemetry-manual>
      <div className="mlp-react-canvas-box">
        <canvas
          ref={canvasRef}
          className="mlp-react-network-canvas"
          aria-label={
            ariaLabel ??
            'MLP 网络拓扑，悬停神经元可查看整层矩阵计算'
          }
          onPointerMove={(event) => {
            const pointer = pointerPosition(event, size);
            let nearest: NetworkNode | null = null;
            let nearestDistance = 26;
            nodesRef.current.forEach((node) => {
              const distance = Math.hypot(
                node.x - pointer.x,
                node.y - pointer.y,
              );
              if (distance < nearestDistance) {
                nearestDistance = distance;
                nearest = node;
              }
            });
            setHoveredNode((current) =>
              sameNode(current, nearest) ? current : nearest,
            );
          }}
          onPointerLeave={() => setHoveredNode(null)}
        />
      </div>
      {hoveredNode ? (
        <NetworkInspector state={state} node={hoveredNode} />
      ) : null}
    </div>
  );
}
