import { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* 剪贴板不可用时忽略 */
    }
  };
  return (
    <div className="code-block">
      <div className="code-head">
        <span>{lang ?? "text"}</span>
        <button type="button" onClick={copy}>
          {copied ? "已复制" : "复制"}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function MarkdownView({ children }: { children: string }) {
  return (
    <div className="markdown">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: (props) => <a {...props} target="_blank" rel="noreferrer noopener" />,
          code: ({ className, children, ...rest }) => {
            const text = String(children ?? "");
            const match = /language-([\w-]+)/.exec(className ?? "");
            const isBlock = Boolean(match) || text.includes("\n");
            if (!isBlock) {
              return (
                <code className="inline-code" {...rest}>
                  {children}
                </code>
              );
            }
            return <CodeBlock code={text.replace(/\n$/, "")} lang={match?.[1]} />;
          },
          pre: (props) => <>{props.children}</>,
        }}
      >
        {children}
      </Markdown>
    </div>
  );
}