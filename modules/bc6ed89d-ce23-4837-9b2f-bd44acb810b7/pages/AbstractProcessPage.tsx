import { useLayoutEffect, useRef, useState } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
import './AbstractProcessPage.css';

const TOKENS = ['我', '爱', '学', '习'];

function Stamp({ name }: { name: string }) {
  const [base, subscript] = name.split('_');
  return <div shuku-edit-id="e-da277854-23ee-4b40-8d2f-897f9aec2d61" className={`kva-stamp ${name.length > 2 ? 'kva-stamp--word' : ''}`} aria-hidden="true">
    <Typography shuku-edit-id="e-dfe01de0-e785-4a15-89b7-c0b54c8e2a44" as="span" variant="display" tone="inherit" wrap="nowrap">{base}{subscript && <sub shuku-edit-id="e-489fffa9-8bbb-4201-8bc1-2b38d7f95923">{subscript}</sub>}</Typography>
  </div>;
}

function TokenMatrix({ name, color, transposed = false, trace = false, all = false }: { name: string; color: string; transposed?: boolean; trace?: boolean; all?: boolean }) {
  return <div shuku-edit-id="e-e3439491-cdff-47ad-bb20-8090e9a1c8a5" className={`kva-matrix kva-tokens ${transposed ? 'kva-tokens--transposed' : ''} ${name === 'O' ? 'kva-tokens--shared-o' : ''} kva-color--${color}`} aria-label={`${name}，四个位置：我爱学习`}>
    {TOKENS.map((token, index) => <div shuku-edit-id="e-3f85cfe4-15cd-4aba-8f3a-66fa4543a744" className={`kva-token ${trace && (all || index === 3) ? 'kva-traced' : ''}`} key={token}><Typography shuku-edit-id="e-936e9ca5-6861-40bc-8c73-20aebd0ca58d" as="span" variant="h3" tone="inherit">{token}</Typography></div>)}
    <Stamp name={name} />
  </div>;
}

function ScoreMatrix({ trace }: { trace: boolean }) {
  return <div shuku-edit-id="e-94757be2-7ad6-4ef5-a6a4-40a4a98f0fb9" className="kva-matrix kva-score kva-color--score" aria-label="注意力权重 A，四行四列，未来位置为 Mask">
    {TOKENS.flatMap((q, row) => TOKENS.map((k, col) => <div shuku-edit-id="e-8adcf1d5-b9f4-4c92-9aad-10e1c8aea53a" className="kva-score-cell" key={`${row}-${col}`}>
      <Typography shuku-edit-id="e-05c6b61d-8fa8-4d50-91f2-e9835d3ee0b6" as="span" variant="bodySmall" tone="inherit" wrap="nowrap">{col > row ? 'Mask' : `${q}/${k}`}</Typography>
    </div>))}
    <Stamp name="A" />
    {trace && <div shuku-edit-id="e-11de9333-fde4-4c4b-9ff7-05a09dadf288" className="kva-score-trace kva-traced" aria-hidden="true" />}
  </div>;
}

function Symbol({ children }: { children: string }) {
  return <Typography shuku-edit-id="e-fb58ab5c-0092-40fd-8f01-e56f40a8fab4" as="span" variant="display" className="kva-symbol">{children}</Typography>;
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
  return <section shuku-edit-id="e-4e9bd3fd-e52d-4ee3-a4a6-7a32e09ead4f" className="kva-slide" aria-label="抽象计算过程，三组矩阵运算">
    <header shuku-edit-id="e-997a7d63-5736-4568-8c7f-c3fb7e17cdbe" className="kva-header">
      <Typography shuku-edit-id="e-f4849099-c210-4024-a4c5-32267753c09a" as="h1" variant="h1">只预测下一个字，还需要所有 Q 行吗？</Typography>
      <Button onClick={() => setStep(current => current === 5 ? 0 : current + 1)}>{actions[step]}</Button>
    </header>
    <div shuku-edit-id="e-d8b7a1d3-d231-43b4-afd9-53507de00970" className="kva-equations" ref={equations}>
      <svg shuku-edit-id="e-3d6ae53e-23e7-4f65-bed3-f2703c668d4b" className="kva-reverse-traces" aria-hidden="true">{tracePaths.map((path, index) => <path shuku-edit-id="e-f6e7edce-ba57-4251-be0c-9a90831c821c" key={index} d={path} />)}</svg>
      <div shuku-edit-id="e-140b0c02-4e9b-4c3b-a208-1fd5b0c9c4a7" className="kva-equation">
        <TokenMatrix name="Q" color="q" trace={step >= 5} /><Symbol>×</Symbol><TokenMatrix name="Kᵀ" color="k" transposed trace={step >= 5} all /><div shuku-edit-id="e-878339d0-5ba6-4a24-bc9c-1ecbb2a22992" className="kva-normalize"><Typography shuku-edit-id="e-1a0efeae-dd64-441d-ac8b-170c785e7880" as="span" variant="bodySmall">缩放<br shuku-edit-id="e-22fd3193-b6ad-46b4-8d3c-3af4520eed35" />Mask<br shuku-edit-id="e-c3b35a39-a04c-41f4-bcbf-9b21b42d6524" />Softmax</Typography><Symbol>→</Symbol></div><ScoreMatrix trace={step >= 5} />
      </div>
      <div shuku-edit-id="e-f69714c3-b104-40b8-ad39-59ebd501b16f" className="kva-equation">
        <ScoreMatrix trace={step >= 4} /><Symbol>×</Symbol><TokenMatrix name="V" color="v" trace={step >= 4} all /><Symbol>=</Symbol><TokenMatrix name="O" color="new" trace={step >= 3} />
      </div>
      <div shuku-edit-id="e-3e8cefec-c1b1-4d8d-8afd-5d16ead242e9" className="kva-equation kva-equation--final">
        <TokenMatrix name="O" color="new" trace={step >= 3} />
        <div shuku-edit-id="e-dcc616c2-0f60-48fe-a242-e8cb1383ae87" className={`kva-model-step ${step >= 3 ? 'kva-model-step--traced' : ''}`}>
          <Typography shuku-edit-id="e-04a57f91-5485-4f75-b4f4-208b3e688fa1" as="span" variant="bodySmall" tone="inherit">后续模型层</Typography><Symbol>→</Symbol>
        </div>
        <TokenMatrix name="H_final" color="new" trace={step >= 2} />
        <Symbol>×</Symbol>
        <div shuku-edit-id="e-cb5db960-60a9-4979-8f08-803fc8181c51" className="kva-matrix kva-weight kva-color--weight" aria-label="W_vocab，词表映射矩阵">{Array.from({ length: 4 }, (_, i) => <div shuku-edit-id="e-04cce8b6-1342-4131-b9c7-c431849ea54b" key={i} className={`kva-weight-column ${step >= 2 ? 'kva-traced' : ''}`} />)}<Stamp name="W_vocab" /></div>
        <Symbol>=</Symbol>
        <div shuku-edit-id="e-58acdffa-982c-49c0-9cb3-338e4ca5ef62" className="kva-logits-result">
          <TokenMatrix name="Logits" color="logits" trace />
          <Typography shuku-edit-id="e-316c174d-f0b3-4866-b9e5-0f3a5c91daa1" as="p" variant="body" tone="danger" align="center">得到这行就可以预测下一token</Typography>
        </div>
      </div>
    </div>
  </section>;
}
