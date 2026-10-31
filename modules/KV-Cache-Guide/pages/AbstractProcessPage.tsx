import { useLayoutEffect, useRef, useState } from 'react';
import { Button, Typography } from '../../shared/react';
import './AbstractProcessPage.css';

const TOKENS = ['我', '爱', '学', '习'];

function Stamp({ name }: { name: string }) {
  const [base, subscript] = name.split('_');
  return <div className={`kva-stamp ${name.length > 2 ? 'kva-stamp--word' : ''}`} aria-hidden="true">
    <Typography as="span" variant="display" tone="inherit" wrap="nowrap">{base}{subscript && <sub>{subscript}</sub>}</Typography>
  </div>;
}

function TokenMatrix({ name, color, transposed = false, trace = false, all = false }: { name: string; color: string; transposed?: boolean; trace?: boolean; all?: boolean }) {
  return <div className={`kva-matrix kva-tokens ${transposed ? 'kva-tokens--transposed' : ''} ${name === 'O' ? 'kva-tokens--shared-o' : ''} kva-color--${color}`} aria-label={`${name}，四个位置：我爱学习`}>
    {TOKENS.map((token, index) => <div className={`kva-token ${trace && (all || index === 3) ? 'kva-traced' : ''}`} key={token}><Typography as="span" variant="h3" tone="inherit">{token}</Typography></div>)}
    <Stamp name={name} />
  </div>;
}

function ScoreMatrix({ trace }: { trace: boolean }) {
  return <div className="kva-matrix kva-score kva-color--score" aria-label="注意力权重 A，四行四列，未来位置为 Mask">
    {TOKENS.flatMap((q, row) => TOKENS.map((k, col) => <div className="kva-score-cell" key={`${row}-${col}`}>
      <Typography as="span" variant="bodySmall" tone="inherit" wrap="nowrap">{col > row ? 'Mask' : `${q}/${k}`}</Typography>
    </div>))}
    <Stamp name="A" />
    {trace && <div className="kva-score-trace kva-traced" aria-hidden="true" />}
  </div>;
}

function Symbol({ children }: { children: string }) {
  return <Typography as="span" variant="display" className="kva-symbol">{children}</Typography>;
}

export function AbstractProcessPage() {
  const [step, setStep] = useState(0);
  const equations = useRef<HTMLDivElement>(null);
  const [tracePaths, setTracePaths] = useState<string[]>([]);
  useLayoutEffect(() => {
    const root = equations.current;
    if (!root) return;
    const update = () => {
      const bounds = root.getBoundingClientRect();
      const scale = bounds.width / root.offsetWidth;
      const rows = root.querySelectorAll('.kva-equation');
      const box = (row: number, index: number) => {
        const matrix = rows[row].querySelectorAll<HTMLElement>('.kva-matrix')[index];
        const target = matrix.querySelector<HTMLElement>('.kva-score-trace') ||
          (!matrix.classList.contains('kva-tokens--transposed') && matrix.querySelectorAll<HTMLElement>('.kva-token')[3]) || matrix;
        const rect = target.getBoundingClientRect();
        return { l: (rect.left - bounds.left) / scale - 6, r: (rect.right - bounds.left) / scale + 6,
          t: (rect.top - bounds.top) / scale - 6, b: (rect.bottom - bounds.top) / scale + 6,
          x: (rect.left + rect.width / 2 - bounds.left) / scale, y: (rect.top + rect.height / 2 - bounds.top) / scale };
      };
      const paths: string[] = [];
      const link = (row: number, right: number, left: number) => {
        const a = box(row, right), b = box(row, left);
        paths.push(`M${a.l} ${a.y} H${(a.l + b.r) / 2} V${b.y} H${b.r}`);
      };
      if (step >= 2) { link(2, 3, 2); link(2, 2, 1); }
      if (step >= 3) { link(2, 1, 0); }
      if (step >= 4) { link(1, 2, 1); link(1, 1, 0); }
      if (step >= 5) { link(0, 2, 1); link(0, 1, 0); }
      setTracePaths(paths);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(root);
    return () => observer.disconnect();
  }, [step]);
  const actions = ['这行结果需要什么？', '向左追溯', '追溯到注意力输出', '继续追溯到 A 和 V', '继续追溯到 Q 和 K', '从结果重新追溯'];
  return <section className="kva-slide" aria-label="抽象计算过程，三组矩阵运算">
    <header className="kva-header">
      <Typography as="h1" variant="h1">只预测下一个字，还需要所有 Q 行吗？</Typography>
      <Button onClick={() => setStep(current => current === 5 ? 0 : current + 1)}>{actions[step]}</Button>
    </header>
    <div className="kva-equations" ref={equations}>
      <svg className="kva-reverse-traces" aria-hidden="true">{tracePaths.map((path, index) => <path key={index} d={path} />)}</svg>
      <div className="kva-equation">
        <TokenMatrix name="Q" color="q" trace={step >= 5} /><Symbol>×</Symbol><TokenMatrix name="Kᵀ" color="k" transposed trace={step >= 5} all /><div className="kva-normalize"><Typography as="span" variant="bodySmall">缩放<br />Mask<br />Softmax</Typography><Symbol>→</Symbol></div><ScoreMatrix trace={step >= 5} />
      </div>
      <div className="kva-equation">
        <ScoreMatrix trace={step >= 4} /><Symbol>×</Symbol><TokenMatrix name="V" color="v" trace={step >= 4} all /><Symbol>=</Symbol><TokenMatrix name="O" color="new" trace={step >= 3} />
      </div>
      <div className="kva-equation kva-equation--final">
        <TokenMatrix name="O" color="new" trace={step >= 3} />
        <div className={`kva-model-step ${step >= 3 ? 'kva-model-step--traced' : ''}`}>
          <Typography as="span" variant="bodySmall" tone="inherit">后续模型层</Typography><Symbol>→</Symbol>
        </div>
        <TokenMatrix name="H_final" color="new" trace={step >= 2} />
        <Symbol>×</Symbol>
        <div className="kva-matrix kva-weight kva-color--weight" aria-label="W_vocab，词表映射矩阵">{Array.from({ length: 4 }, (_, i) => <div key={i} className={`kva-weight-column ${step >= 2 ? 'kva-traced' : ''}`} />)}<Stamp name="W_vocab" /></div>
        <Symbol>=</Symbol>
        <div className="kva-logits-result">
          <TokenMatrix name="Logits" color="logits" trace />
          <Typography as="p" variant="body" tone="danger" align="center">得到这行就可以预测下一token</Typography>
        </div>
      </div>
    </div>
  </section>;
}
