import { useState, type ReactNode } from 'react';
import { Button } from '../controls/Button';

export interface CodeCompletionBlockProps {
  language: ReactNode;
  expectedAnswer: string;
  inputLabel: string;
  help: ReactNode;
  beforeInput: ReactNode;
  afterInput?: ReactNode;
  prefixLines?: ReactNode;
  runtime?: string;
  className?: string;
}

export function CodeCompletionBlock({
  language,
  expectedAnswer,
  inputLabel,
  help,
  beforeInput,
  afterInput,
  prefixLines,
  runtime = '0.4 s',
  className,
}: CodeCompletionBlockProps) {
  const [code, setCode] = useState('');
  const [running, setRunning] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);

  const start = () => {
    const correct = code.trim().toLowerCase() === expectedAnswer.trim().toLowerCase();
    setRunning(correct);
    setHelpVisible(!correct);
  };

  return (
    <section className={`edu-code-block ${className ?? ''}`.trim()}>
      <header className="edu-code-toolbar">
        <span className="edu-code-language">{language}</span>
        <span className="edu-code-status">{running ? '运行中' : '就绪'}</span>
        <span className="edu-code-runtime">运行时间<output>{running ? runtime : '0.0 s'}</output></span>
        <div className="edu-code-actions">
          <Button variant="primary" disabled={running} onClick={start}>启动</Button>
          <Button disabled={!running} onClick={() => setRunning(false)}>停止</Button>
          <Button onClick={() => setHelpVisible((value) => !value)}>请求帮助</Button>
        </div>
      </header>
      <pre className="edu-code-source"><code>{prefixLines}{beforeInput}<input className="edu-code-blank" aria-label={inputLabel} value={code} onChange={(event) => setCode(event.target.value)} />{afterInput}</code></pre>
      <div className="edu-code-help" hidden={!helpVisible}>{help}</div>
    </section>
  );
}
