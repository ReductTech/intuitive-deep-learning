import { useEffect, useRef, useState } from "react";

const SUGGESTIONS = [
  "(3+4)^3 / 7 是多少？",
  "帮我查一下纽约现在几点",
  "什么是 Transformer 架构",
];

export function Composer({
  onSend,
  onStop,
  running,
  disabled,
}: {
  onSend: (text: string) => void;
  onStop: () => void;
  running: boolean;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`;
  }, [value]);

  const submit = () => {
    const text = value.trim();
    if (!text || running || disabled) return;
    setValue("");
    onSend(text);
  };

  return (
    <div className="composer">
      <div className="composer-box">
        <textarea
          ref={ref}
          rows={1}
          value={value}
          placeholder="交给 Agent 一件事：算数、查资料、读网页、记待办…"
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
        />
        {running ? (
          <button type="button" className="send-btn stop" onClick={onStop}>
            停止
          </button>
        ) : (
          <button type="button" className="send-btn" onClick={submit} disabled={!value.trim() || disabled}>
            发送
          </button>
        )}
      </div>
      <div className="composer-hint">
        <span>Enter 发送 · Shift + Enter 换行</span>
        <span className="composer-chips">
          {SUGGESTIONS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setValue(item);
                ref.current?.focus();
              }}
            >
              {item}
            </button>
          ))}
        </span>
      </div>
    </div>
  );
}