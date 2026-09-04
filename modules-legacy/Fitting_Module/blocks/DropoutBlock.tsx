import { useEffect, useRef, useState } from 'react';
import { Button, Callout, ContentBlock, NoticeStrip } from '../../shared/react';

interface DropoutBlockProps { onComplete?: () => void; }

interface NetworkLayer {
  label: string;
  kind: 'input' | 'hidden' | 'output';
  x: number;
  nodes: { x: number; y: number; label: string }[];
}

const hiddenSizes = [5, 6, 5];
const initialMask = [
  [false, true, false, false, true],
  [true, false, false, true, false, false],
  [false, false, true, false, true],
];

function nodePositions(x: number, count: number, prefix: string) {
  const gap = 42;
  const center = 162;
  const start = center - gap * (count - 1) / 2;
  return Array.from({ length: count }, (_, index) => ({
    x,
    y: start + index * gap,
    label: `${prefix}${index + 1}`,
  }));
}

const layers: NetworkLayer[] = [
  { label: '输入层（3）', kind: 'input', x: 62, nodes: nodePositions(62, 3, 'x') },
  { label: '隐藏层 1（5）', kind: 'hidden', x: 256, nodes: nodePositions(256, 5, 'h') },
  { label: '隐藏层 2（6）', kind: 'hidden', x: 450, nodes: nodePositions(450, 6, 'h') },
  { label: '隐藏层 3（5）', kind: 'hidden', x: 644, nodes: nodePositions(644, 5, 'h') },
  { label: '输出层（1）', kind: 'output', x: 838, nodes: [{ x: 838, y: 162, label: 'ŷ' }] },
];

function sampleMask(size: number) {
  const mask = Array.from({ length: size }, () => Math.random() < 0.3);
  if (mask.every(Boolean)) mask[Math.floor(Math.random() * size)] = false;
  return mask;
}

function DropoutNetwork({ mask, pass, inference }: { mask: boolean[][]; pass: number; inference: boolean }) {
  function isDropped(layerIndex: number, nodeIndex: number) {
    if (inference || layerIndex === 0 || layerIndex === layers.length - 1) return false;
    return mask[layerIndex - 1]?.[nodeIndex] ?? false;
  }

  return (
    <svg
      className="fit-dropout-network"
      viewBox="0 0 900 300"
      role="img"
      aria-label={inference ? '推理状态中，所有神经元都参与计算' : `第 ${pass} 次训练中，部分隐藏神经元被 Dropout 随机关闭`}
    >
      {layers.slice(0, -1).flatMap((layer, layerIndex) => (
        layer.nodes.flatMap((source, sourceIndex) => (
          layers[layerIndex + 1].nodes.map((target, targetIndex) => {
            const inactive = isDropped(layerIndex, sourceIndex) || isDropped(layerIndex + 1, targetIndex);
            const negative = (sourceIndex + targetIndex + layerIndex) % 3 === 0;
            const width = 1.2 + ((sourceIndex + targetIndex * 2 + layerIndex) % 3) * 0.65;
            return (
              <line
                className={`fit-dropout-edge${negative ? ' is-negative' : ''}${inactive ? ' is-inactive' : ''}`}
                key={`${layerIndex}-${sourceIndex}-${targetIndex}`}
                x1={source.x + 18}
                y1={source.y}
                x2={target.x - 18}
                y2={target.y}
                strokeWidth={width}
              />
            );
          })
        ))
      ))}

      {layers.flatMap((layer, layerIndex) => (
        layer.nodes.map((node, nodeIndex) => {
          const dropped = isDropped(layerIndex, nodeIndex);
          return (
            <g
              className={`fit-dropout-node is-${layer.kind}${dropped ? ' is-dropped' : ''}`}
              key={`${layerIndex}-${nodeIndex}`}
              transform={`translate(${node.x} ${node.y})`}
            >
              <circle r="18" />
              <text textAnchor="middle" dominantBaseline="central">{node.label}</text>
              {dropped && <path d="M-7-7L7 7M7-7L-7 7" />}
            </g>
          );
        })
      ))}

      {layers.map((layer) => (
        <text className="fit-dropout-layer-label" x={layer.x} y="28" textAnchor="middle" key={layer.label}>
          {layer.label}
        </text>
      ))}
    </svg>
  );
}

export function DropoutBlock({ onComplete }: DropoutBlockProps) {
  const [mask, setMask] = useState(initialMask);
  const [pass, setPass] = useState(1);
  const [running, setRunning] = useState(false);
  const [inference, setInference] = useState(false);
  const completionReported = useRef(false);
  const droppedCount = inference ? 0 : mask.flat().filter(Boolean).length;

  function reportCompletion() {
    if (!completionReported.current) {
      completionReported.current = true;
      onComplete?.();
    }
  }

  function nextPass() {
    setMask(hiddenSizes.map(sampleMask));
    setPass((current) => current + 1);
    reportCompletion();
  }

  function toggleRunning() {
    setRunning((current) => !current);
    reportCompletion();
  }

  function toggleInference() {
    setRunning(false);
    setInference((current) => !current);
    reportCompletion();
  }

  useEffect(() => {
    if (!running || inference) return;
    const timer = window.setInterval(() => {
      setMask(hiddenSizes.map(sampleMask));
      setPass((current) => current + 1);
    }, 900);
    return () => window.clearInterval(timer);
  }, [running, inference]);

  return (
    <ContentBlock
      className="fit-block fit-dropout"
      title="使用 Dropout 缓解过拟合"
      subtitle="训练时随机关闭部分隐藏神经元；推理时使用完整网络。"
    >
      <NoticeStrip tone="blue" lead="训练时：">Dropout 不会删除神经元，只会把它在本次训练中的激活暂时置为 0。</NoticeStrip>

      <section className="fit-dropout-lab">
        <header>
          <div>
            <strong>{inference ? '推理状态' : `第 ${pass} 次训练`}</strong>
            <span>{inference ? '所有神经元参与计算' : `本次随机关闭 ${droppedCount} 个隐藏神经元`}</span>
          </div>
          <div className="fit-dropout-actions">
            <Button variant="primary" hint={!completionReported.current} disabled={inference || running} onClick={nextPass}>单步训练</Button>
            <Button disabled={inference} onClick={toggleRunning}>{running ? '暂停模拟' : '连续模拟'}</Button>
            <Button variant={inference ? 'primary' : 'default'} onClick={toggleInference}>{inference ? '返回训练' : '进入推理'}</Button>
          </div>
        </header>

        <div className="fit-dropout-network-frame">
          <DropoutNetwork mask={mask} pass={pass} inference={inference} />
          <div className="fit-dropout-legend">
            <span className="is-active">本次保留（参与计算）</span>
            <span className="is-dropped">本次 Dropout（激活置为 0）</span>
          </div>
        </div>
      </section>

      <Callout
        tone={inference ? 'green' : 'blue'}
        label={inference ? '推理时' : '训练时'}
        text={inference
          ? 'Dropout 已关闭，所有神经元都会参与计算，网络使用训练后学到的权重进行预测。'
          : '每次训练都会随机关闭一部分隐藏神经元；下一次训练会重新选择关闭位置，使模型无法长期依赖同一组神经元。'}
        aria-live="polite"
      />
    </ContentBlock>
  );
}
