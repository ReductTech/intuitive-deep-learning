import { moduleIdentity } from '../../outlines.json';
import { moduleAssetUrl } from '../../../shared/react/assets';
import { useRef, useState } from 'react';
import { Button, ContentBlock, TextInput, Typography } from '../../../shared/react';
const appleFruit = moduleAssetUrl(moduleIdentity.id, "apple-fruit.jpg");
const iphone18Pro = moduleAssetUrl(moduleIdentity.id, "iphone-18-pro.svg");
const senderAvatar = moduleAssetUrl(moduleIdentity.id, "sender-avatar.png");
import './RNNMemoryPage.css';

export interface RNNMemoryPageProps {
  onComplete: () => void;
}

const phoneContextPattern = /手机|电话|通话|来电|短信|微信|屏幕|充电|充电器|电池|信号|通讯录|相机|存储|内存|换机|新机|耳机|流量|号码|运营商|sim|iphone|ios|\d+\s*(g|gb)/i;

export function RNNMemoryPage({ onComplete }: RNNMemoryPageProps) {
  const [message, setMessage] = useState('');
  const [contextMessage, setContextMessage] = useState('');
  const [animationKey, setAnimationKey] = useState(0);
  const completedRef = useRef(false);
  const hasContext = contextMessage.length > 0;
  const hasPhoneContext = phoneContextPattern.test(contextMessage);

  const sendMessage = () => {
    const nextMessage = message.trim();
    if (nextMessage.length === 0) return;

    setContextMessage(nextMessage);
    setAnimationKey((current) => current + 1);
    setMessage('');

    if (!completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  };

  return (
    <ContentBlock
      headingLevel={1}
      className="nrnn-memory"
      title="记忆：同一个词，为什么会有不同的意思？"
      subtitle="发送一条前文，看看模型对“苹果”的理解如何改变。"
    >
      <div className={`nrnn-memory__stage${hasContext ? ' has-context' : ''}${hasPhoneContext ? ' has-phone-context' : ''}`}>
        <section className="nrnn-memory__chat" aria-label="消息对话">
          <header className="nrnn-memory__chat-header">
            <span className="nrnn-memory__window-mark" aria-hidden="true"><i /><i /><i /></span>
            <Typography as="h2" variant="h3" tone="main">消息</Typography>
            <span className="nrnn-memory__chat-status" aria-hidden="true" />
          </header>

          <div className="nrnn-memory__conversation">
            <div className="nrnn-memory__thread" key={animationKey}>
              {hasContext && (
                <div className="nrnn-memory__message-row is-context">
                  <div className="nrnn-memory__message-bubble">
                    <Typography as="strong" variant="h3" tone="inherit">{contextMessage}</Typography>
                  </div>
                  <img className="nrnn-memory__avatar" src={senderAvatar} alt="发送者头像" />
                </div>
              )}

              <div className="nrnn-memory__message-row is-target">
                <div className="nrnn-memory__message-bubble">
                  <Typography as="strong" variant="h3" tone="inherit">
                    好想要256g的<mark>苹果</mark>
                  </Typography>
                </div>
                <img className="nrnn-memory__avatar" src={senderAvatar} alt="发送者头像" />
              </div>
            </div>

            <div className="nrnn-memory__memory-trace" aria-hidden="true">
              <span className="nrnn-memory__trace-line" />
              <span className="nrnn-memory__trace-dot" />
            </div>
          </div>

          <div className="nrnn-memory__composer">
            <TextInput
              aria-label="要发送的消息"
              autoComplete="off"
              className="nrnn-memory__message-input"
              controlClassName="nrnn-memory__message-control"
              value={message}
              placeholder="输入一条前文，比如“手机坏了”或者“我饿了”"
              onChange={(event) => setMessage(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') sendMessage();
              }}
            />
            <Button
              className="nrnn-memory__send-button"
              disabled={message.trim().length === 0}
              onClick={sendMessage}
            >
              <Typography as="span" variant="body" tone="inherit">发送</Typography>
            </Button>
          </div>
        </section>

        <section className={`nrnn-memory__visual-panel${hasContext ? ' is-ready' : ''}`} aria-live="polite" aria-label="苹果的语义变化">
          {hasContext && (
            <>
              <div className="nrnn-memory__visual-label">
                <Typography as="span" variant="bodySmall" tone="muted">模型此刻对</Typography>
                <Typography as="strong" variant="h3" tone="accent">“苹果”一词的代表</Typography>
              </div>

              <div className="nrnn-memory__visual-stage">
                <div className="nrnn-memory__visual-orbit" aria-hidden="true" />

                <div className="nrnn-memory__visual nrnn-memory__visual--fruit" aria-hidden={hasPhoneContext}>
                  <img src={appleFruit} alt="红色水果苹果" />
                </div>

                <div className="nrnn-memory__visual nrnn-memory__visual--phone" aria-hidden={!hasPhoneContext}>
                  <img src={iphone18Pro} alt="iPhone 18 Pro" />
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      <div className={`nrnn-memory__takeaway${hasContext ? ' is-visible' : ''}`}>
        <span className="nrnn-memory__takeaway-line" aria-hidden="true" />
        <div>
          <Typography as="strong" variant="h3" tone="accent">RNN 用持续更新的状态，把过去带到当前计算。</Typography>
          <Typography variant="bodySmall" tone="muted">“苹果”没有改变，改变的是模型此刻携带的上下文。</Typography>
        </div>
      </div>
    </ContentBlock>
  );
}
