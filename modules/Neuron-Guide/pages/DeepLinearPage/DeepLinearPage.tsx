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
import "./DeepLinearPage.css";
import {
  Button,
  ContentBlock,
  FormulaBlock,
  NoticeStrip,
  Typography,
} from '../../../shared/react';
import {
  buildDeepModel,
  deepEquivalent,
  DeepOutputPlot,
  formatNumber,
  formatSigned,
  MAX_DEEP_LAYER_COUNT,
  MIN_DEEP_LAYER_COUNT,
  type DeepNetworkModel,
  usePersistedActivity,
} from '../ActivationCatalogPage/ActivationCatalogPage';

const STATE_KEY = 'activity:activation-linear-dimensional-v1';

interface DeepSnapshot {
  model: DeepNetworkModel;
  completed: boolean;
}

function createInitialSnapshot(): DeepSnapshot {
  return {
    model: buildDeepModel(MIN_DEEP_LAYER_COUNT),
    completed: false,
  };
}

function isValidDeepModel(value: unknown): value is DeepNetworkModel {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const model = value as Partial<DeepNetworkModel>;
  if (
    !Number.isInteger(model.layerCount)
    || !Array.isArray(model.sizes)
    || !Array.isArray(model.W)
    || !Array.isArray(model.B)
    || model.layerCount! < MIN_DEEP_LAYER_COUNT
    || model.layerCount! > MAX_DEEP_LAYER_COUNT
    || model.sizes.length !== model.layerCount! + 2
    || model.sizes[0] !== 2
    || model.sizes.at(-1) !== 1
    || model.sizes.slice(1, -1).some((size) => size !== 3)
    || model.W.length !== model.sizes.length - 1
    || model.B.length !== model.W.length
  ) {
    return false;
  }
  return model.W.every((matrix, layer) => (
    Array.isArray(matrix)
    && matrix.length === model.sizes![layer + 1]
    && matrix.every((row) => (
      Array.isArray(row)
      && row.length === model.sizes![layer]
      && row.every((entry) => typeof entry === 'number' && Number.isFinite(entry))
    ))
    && Array.isArray(model.B![layer])
    && model.B![layer].length === model.sizes![layer + 1]
    && model.B![layer].every(
      (entry) => typeof entry === 'number' && Number.isFinite(entry),
    )
  ));
}

function normalizeSnapshot(value: unknown): DeepSnapshot | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<DeepSnapshot>;
  if (
    candidate.completed !== undefined
    && typeof candidate.completed !== 'boolean'
  ) {
    return null;
  }
  const model = candidate.model;
  if (!isValidDeepModel(model)) return null;
  return {
    model: {
      layerCount: model.layerCount,
      sizes: [...model.sizes],
      W: model.W.map((matrix) => matrix.map((row) => [...row])),
      B: model.B.map((row) => [...row]),
    },
    completed: Boolean(candidate.completed),
  };
}

function hiddenLabel(layer: number, index: number): string {
  return `h${layer}.${index + 1}`;
}

function nodeLabel(layer: number, index: number, sizes: number[]): string {
  if (layer === 0) return index === 0 ? 'x' : 'y';
  if (layer === sizes.length - 1) return 'z';
  return hiddenLabel(layer, index);
}

function buildCanvas(
  model: DeepNetworkModel,
): { layers: NetworkLayer[]; connections: NetworkConnection[] } {
  const outputLayer = model.sizes.length - 1;
  const outputWeights = model.W[model.W.length - 1]?.[0] ?? [];
  const outputBias = model.B[model.B.length - 1]?.[0] ?? 0;
  const layers: NetworkLayer[] = model.sizes.map((size, layer) => ({
    title: layer === 0
      ? `输入 (${size})`
      : layer === model.sizes.length - 1
        ? `输出 (${size})`
        : `线性层 ${layer} (${size})`,
    nodes: Array.from({ length: size }, (_, index) => {
      const isOutput = layer === outputLayer;
      const isHidden = layer > 0 && !isOutput;
      const incomingWeights = isHidden ? model.W[layer - 1]?.[index] ?? [] : [];
      const incomingBias = isHidden ? model.B[layer - 1]?.[index] ?? 0 : 0;
      const sourceLabels = layer === 1
        ? ['x', 'y']
        : Array.from(
          { length: model.sizes[layer - 1] ?? 0 },
          (_, sourceIndex) => hiddenLabel(layer - 1, sourceIndex),
        );
      return {
        label: nodeLabel(layer, index, model.sizes),
        tone: layer === 0
          ? 'input' as const
          : isOutput
            ? 'output' as const
            : 'hidden' as const,
        activation: layer === 0 ? undefined : 'linear',
        details: layer === 0 ? undefined : isOutput ? {
          title: '输出节点 z',
          body: '最后一层把隐藏节点的输出加权汇总，再加上偏置。',
          content: (
            <div className="ng-output-matrix">
              <div className="ng-output-matrix__formula" aria-label="z 等于输出权重行向量乘最后一层隐藏节点列向量，再加偏置">
                <Typography as="code" variant="subtitle" tone="main" wrap="nowrap">z =</Typography>
                <div className="ng-output-matrix__row-vector">
                  {outputWeights.map((weight, weightIndex) => (
                    <Typography as="code" variant="body" tone="warning" wrap="nowrap" key={weightIndex}>
                      {formatNumber(weight)}
                    </Typography>
                  ))}
                </div>
                <Typography as="code" variant="subtitle" tone="muted" wrap="nowrap">×</Typography>
                <div className="ng-output-matrix__column-vector">
                  {outputWeights.map((_, hiddenIndex) => (
                    <Typography as="code" variant="body" tone="accent" wrap="nowrap" key={hiddenIndex}>
                      {hiddenLabel(outputLayer - 1, hiddenIndex)}
                    </Typography>
                  ))}
                </div>
                <Typography as="code" variant="subtitle" tone="main" wrap="nowrap">
                  {formatSigned(outputBias)}
                </Typography>
              </div>
            </div>
          ),
        } : isHidden ? {
          title: `第 ${layer} 层 · ${hiddenLabel(layer, index)}`,
          body: '用这一行权重读取上一层的全部输出，再加上该节点的偏置。',
          content: (
            <div className="ng-output-matrix">
              <div
                className="ng-output-matrix__formula"
                aria-label={`${hiddenLabel(layer, index)} 等于权重行向量乘上一层输出列向量，再加偏置`}
              >
                <Typography as="code" variant="subtitle" tone="main" wrap="nowrap">
                  {hiddenLabel(layer, index)} =
                </Typography>
                <div className="ng-output-matrix__row-vector">
                  {incomingWeights.map((weight, weightIndex) => (
                    <Typography as="code" variant="body" tone="warning" wrap="nowrap" key={weightIndex}>
                      {formatNumber(weight)}
                    </Typography>
                  ))}
                </div>
                <Typography as="code" variant="subtitle" tone="muted" wrap="nowrap">×</Typography>
                <div className="ng-output-matrix__column-vector">
                  {sourceLabels.map((sourceLabel) => (
                    <Typography as="code" variant="body" tone="accent" wrap="nowrap" key={sourceLabel}>
                      {sourceLabel}
                    </Typography>
                  ))}
                </div>
                <Typography as="code" variant="subtitle" tone="main" wrap="nowrap">
                  {formatSigned(incomingBias)}
                </Typography>
              </div>
            </div>
          ),
        } : undefined,
      };
    }),
  }));
  const connections: NetworkConnection[] = [];
  model.W.forEach((matrix, layer) => {
    matrix.forEach((row, toIndex) => {
      row.forEach((weight, fromIndex) => {
        connections.push({
          fromLayer: layer,
          fromIndex,
          toLayer: layer + 1,
          toIndex,
          weight,
        });
      });
    });
  });
  return { layers, connections };
}

export interface DeepLinearPageProps {
  onComplete: () => void;
}

export function DeepLinearPage({ onComplete }: DeepLinearPageProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const {
    state,
    hydrated,
    commit,
  } = usePersistedActivity<DeepSnapshot>({
    stateKey: STATE_KEY,
    createInitial: createInitialSnapshot,
    normalizeState: normalizeSnapshot,
    initEvent: 'activation_linear_state_initialized',
    initProperties: { experiment: 'deep' },
    getElement: () => rootRef.current,
  });

  const model = state?.model;
  const plane = useMemo(() => model ? deepEquivalent(model) : null, [model]);
  const canvas = useMemo(
    () => model ? buildCanvas(model) : { layers: [], connections: [] },
    [model],
  );

  const replaceModel = (
    eventName: string,
    layerCount: number,
    operation: 'add' | 'remove' | 'reroll',
  ) => {
    if (!state) return;
    const nextModel = buildDeepModel(layerCount);
    const completed = state.completed || nextModel.layerCount >= MAX_DEEP_LAYER_COUNT;
    const next: DeepSnapshot = {
      model: nextModel,
      completed,
    };
    commit(eventName, next, {
      experiment: 'dimensional',
      input_dimension: 2,
      layer_count: nextModel.layerCount,
      operation,
    });
    if (!state.completed && completed) onComplete();
  };

  const layerCount = model?.layerCount ?? MIN_DEEP_LAYER_COUNT;

  return (
    <ContentBlock
      ref={rootRef}
      headingLevel={1}
      className="ng-activation-network-lab ng-deep-linear"
      title="线性关系从直线扩展为平面"
      subtitle="当输入由一个变量扩展为两个变量，y = ax + b 对应地写成 z = ax + by + c，图像也从直线扩展为平面。继续增加线性层，只会得到新的平面，无法形成弯曲的曲面。"
      data-telemetry-manual
      aria-busy={!hydrated}
    >
      <div className="ng-activation-actions">
        <Button
          variant="primary"
          disabled={!hydrated || !model || layerCount >= MAX_DEEP_LAYER_COUNT}
          onClick={() => replaceModel('activation_linear_dimension_layer_add', layerCount + 1, 'add')}
        >
          添加一层
        </Button>
        <Button
          disabled={!hydrated || !model || layerCount <= MIN_DEEP_LAYER_COUNT}
          onClick={() => replaceModel('activation_linear_dimension_layer_remove', layerCount - 1, 'remove')}
        >
          删除一层
        </Button>
        <Button
          disabled={!hydrated || !model}
          onClick={() => replaceModel('activation_linear_dimension_reroll', layerCount, 'reroll')}
        >
          随机参数
        </Button>
      </div>
      {!model || !plane ? (
        <NoticeStrip tone="blue">
          <Typography variant="body" tone="inherit">正在恢复已保存的网络层数与参数…</Typography>
        </NoticeStrip>
      ) : (
        <div className="ng-activation-network-stage">
          <section className="ng-activation-network-panel">
            <header className="ng-activation-panel-head">
              <Typography as="h3" variant="subtitle" tone="main">从直线扩展到平面</Typography>
              <Typography as="span" variant="body" tone="muted">增加层数，平面会弯曲吗？</Typography>
            </header>
            <div className="ng-activation-visual-box">
              <FormulaBlock
                className="ng-activation-plot-formula"
                ariaLabel={`当前平面为 z 等于 ${formatNumber(plane.ax)} x ${formatSigned(plane.ay)} y ${formatSigned(plane.c)}`}
                formula={(
                  <span className="ng-activation-plot-formula-content">
                    <Typography as="span" variant="body" tone="muted">
                      当前平面
                    </Typography>
                    <Typography as="span" variant="subtitle" tone="main">
                      z = {formatNumber(plane.ax)}x {formatSigned(plane.ay)}y {formatSigned(plane.c)}
                    </Typography>
                  </span>
                )}
              />
              <DeepOutputPlot model={model} />
            </div>
          </section>

          <section className="ng-activation-network-panel">
            <header className="ng-activation-panel-head">
              <Typography as="h3" variant="subtitle" tone="main">再把线性网络加深</Typography>
              <Typography as="span" variant="body" tone="muted">悬浮节点查看这一层的矩阵运算</Typography>
            </header>
            <div className="ng-activation-visual-box ng-activation-visual-box--model">
              <NetworkCanvas
                layers={canvas.layers}
                connections={canvas.connections}
                ariaLabel="多层线性网络结构"
                caption="每一层都只是 W a + b；连续进行线性变换，最终仍等价于一次线性变换"
                height={430}
              />
            </div>
          </section>
        </div>
      )}
      <NoticeStrip className="ng-deep-linear-conclusion" tone="green">
        <Typography as="strong" variant="body" tone="inherit">为什么必须在层与层之间加入非线性？</Typography>
        <Typography as="span" variant="body" tone="inherit">没有激活函数，再多线性层也能合并成一次线性运算；层间加入 ReLU 后，每一层才能重新折叠输入空间，让深度真正增加表达能力。</Typography>
      </NoticeStrip>
    </ContentBlock>
  );
}

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
  fontScale?: number;
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
  fontScale: number,
): CanvasLayout {
  const context = canvas.getContext('2d');
  if (!context) return EMPTY_LAYOUT;

  const bounds = canvas.getBoundingClientRect();
  const logicalWidth = Math.max(280, Math.round(bounds.width || 960));
  const logicalHeight = Math.max(220, Math.round(bounds.height || 360));
  const pixelRatio = Math.max(
    2,
    Math.min(4, (window.devicePixelRatio || 1) * 2),
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

  const titleFontSize = (layers.length > 5 ? 10 : 13) * fontScale;
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
      context.font = `900 ${(position.radius < 16 ? 10 : 13) * fontScale}px ${sansFont}`;
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
    context.font = `800 ${14 * fontScale}px ${monoFont}`;
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
  fontScale = 1,
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
          fontScale,
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
  }, [caption, connections, fontScale, layers, positionInspector, selectedNode]);

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
      className={classNames('ng-network-figure', className)}
      data-active-layer={selectedNode?.layer}
      data-active-index={selectedNode?.index}
    >
      <canvas
        ref={canvasRef}
        className="ng-network-canvas"
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

      <Typography id={descriptionId} variant="bodySmall" tone="muted" className="ng-network-summary">
        {textSummary}
      </Typography>

      {showInspector ? (
        <aside
          ref={inspectorRef}
          id={inspectorId}
          className={classNames(
            'ng-network-inspector',
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
