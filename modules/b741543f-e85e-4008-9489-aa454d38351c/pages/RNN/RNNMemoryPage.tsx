import { moduleIdentity } from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { useRef, useState } from 'react';
import { Button, ContentBlock, TextInput, Typography } from "@shuku/course-style/react";
const appleFruit = moduleAssetUrl("apple-fruit.jpg");
const iphone18Pro = moduleAssetUrl("iphone-18-pro.svg");
const senderAvatar = moduleAssetUrl("sender-avatar.jpg");
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
    <ContentBlock shuku-edit-id="e-47d7e874-c68b-4f56-8b45-141f2b6c1946"
      headingLevel={1}
      className="nrnn-memory"
      title="记忆：同一个词，为什么会有不同的意思？"
      subtitle="发送一条前文，看看模型对“苹果”的理解如何改变。"
    >
      <div shuku-edit-id="e-77c2d730-9df7-4931-9775-347aa27b827d" className={`nrnn-memory__stage${hasContext ? ' has-context' : ''}${hasPhoneContext ? ' has-phone-context' : ''}`}>
        <section shuku-edit-id="e-f89af86c-4638-4d9d-bf12-3a376e37118c" className="nrnn-memory__chat" aria-label="消息对话">
          <header shuku-edit-id="e-2e3dc05c-c050-4109-ab2a-72ce665f1f84" className="nrnn-memory__chat-header">
            <span shuku-edit-id="e-685ec997-5ec8-46fc-a4cb-aedb06549842" className="nrnn-memory__window-mark" aria-hidden="true"><i shuku-edit-id="e-443ce838-756f-4736-abf5-bb2f23729228" /><i shuku-edit-id="e-95b8e28c-f057-47c5-a640-80b0f936bd9b" /><i shuku-edit-id="e-56a1560c-3f04-4fd4-adac-7aa66b5572e7" /></span>
            <Typography shuku-edit-id="e-09b88750-09c3-41aa-88cd-e7a7dd76f8f1" as="h2" variant="h3" tone="main">消息</Typography>
            <span shuku-edit-id="e-544ff089-3e50-429f-a0e2-c1b35af0d0f4" className="nrnn-memory__chat-status" aria-hidden="true" />
          </header>

          <div shuku-edit-id="e-6c3cc18a-64d4-4a5a-82ed-ad75b9b5e723" className="nrnn-memory__conversation">
            <div shuku-edit-id="e-ebc4c2d6-622c-4258-b481-b268978272a7" className="nrnn-memory__thread" key={animationKey}>
              {hasContext && (
                <div shuku-edit-id="e-0b685cba-42f2-4daa-bf55-9692ebdc6a49" className="nrnn-memory__message-row is-context">
                  <div shuku-edit-id="e-0f1255d8-138f-4873-8f41-f4bd8af436fa" className="nrnn-memory__message-bubble">
                    <Typography shuku-edit-id="e-0cef14d1-0c31-45f2-b057-3bfda9b4b348" as="strong" variant="h3" tone="inherit">{contextMessage}</Typography>
                  </div>
                  <img shuku-edit-id="e-76ae01e7-ad73-4b9c-b331-a71911667cb3" className="nrnn-memory__avatar" src={senderAvatar} alt="发送者头像" />
                </div>
              )}

              <div shuku-edit-id="e-22496d90-caa9-4697-b551-aaf6a4c4f91b" className="nrnn-memory__message-row is-target">
                <div shuku-edit-id="e-93d6778b-e60b-4d66-b0a6-5e9f4c0c8c61" className="nrnn-memory__message-bubble">
                  <Typography shuku-edit-id="e-8c81277d-a284-46b4-81d4-3fe851e15485" as="strong" variant="h3" tone="inherit">
                    好想要256g的<mark shuku-edit-id="e-c31261c1-db8a-4ada-9e8f-d665fac51f90">苹果</mark>
                  </Typography>
                </div>
                <img shuku-edit-id="e-c6de5254-7947-4d62-a3e1-5a07ffeb9f38" className="nrnn-memory__avatar" src={senderAvatar} alt="发送者头像" />
              </div>
            </div>

            <div shuku-edit-id="e-b0a5ebcb-2ab9-42a3-9e97-7050701937ac" className="nrnn-memory__memory-trace" aria-hidden="true">
              <span shuku-edit-id="e-4572abb3-0102-46c6-b304-499b0b92a421" className="nrnn-memory__trace-line" />
              <span shuku-edit-id="e-32a99fea-b6a8-49a9-b8a2-70a854fec270" className="nrnn-memory__trace-dot" />
            </div>
          </div>

          <div shuku-edit-id="e-00f3c640-f820-4ba3-b753-025af56cb9c1" className="nrnn-memory__composer">
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
              <Typography shuku-edit-id="e-4a5e0aac-4bed-466c-b7e3-d17163d7275f" as="span" variant="body" tone="inherit">发送</Typography>
            </Button>
          </div>
        </section>

        <section shuku-edit-id="e-e9cdc415-7949-4a48-b7c4-81bc4fdc1b34" className={`nrnn-memory__visual-panel${hasContext ? ' is-ready' : ''}`} aria-live="polite" aria-label="苹果的语义变化">
          {hasContext && (
            <>
              <div shuku-edit-id="e-dcc40084-52e9-4878-8d71-67af77f34c4a" className="nrnn-memory__visual-label">
                <Typography shuku-edit-id="e-14567129-00e5-4c41-997c-eac4ced2eb6b" as="span" variant="bodySmall" tone="muted">模型此刻对</Typography>
                <Typography shuku-edit-id="e-01dd0af7-21bf-4155-b22a-fca5ffcd419f" as="strong" variant="h3" tone="accent">“苹果”一词的代表</Typography>
              </div>

              <div shuku-edit-id="e-ce6055b1-065f-49da-b3fe-9a5ee6a5b74c" className="nrnn-memory__visual-stage">
                <div shuku-edit-id="e-251716f7-1538-4827-b3a4-14e00995a924" className="nrnn-memory__visual-orbit" aria-hidden="true" />

                <div shuku-edit-id="e-44b12429-9653-4758-a9fc-1089ff29b6ed" className="nrnn-memory__visual nrnn-memory__visual--fruit" aria-hidden={hasPhoneContext}>
                  <img shuku-edit-id="e-50af6d62-ef0a-4ff3-89d7-a184c5fb1819" src={appleFruit} alt="红色水果苹果" />
                </div>

                <div shuku-edit-id="e-a65f127d-1409-446c-b3fa-407786867505" className="nrnn-memory__visual nrnn-memory__visual--phone" aria-hidden={!hasPhoneContext}>
                  <img shuku-edit-id="e-74642e67-3eb3-47dc-971a-cfa42597eecf" src={iphone18Pro} alt="iPhone 18 Pro" />
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      <div shuku-edit-id="e-83d62ecc-c2eb-44df-931c-cf731ead492b" className={`nrnn-memory__takeaway${hasContext ? ' is-visible' : ''}`}>
        <span shuku-edit-id="e-acc35143-5737-4597-8e63-38e930257a92" className="nrnn-memory__takeaway-line" aria-hidden="true" />
        <div shuku-edit-id="e-6c8071e1-02d2-4adf-9f78-499f8c7817c8">
          <Typography shuku-edit-id="e-112f993d-36f6-4c31-ac65-5fc84ff7e4ef" as="strong" variant="h3" tone="accent">RNN 用持续更新的状态，把过去带到当前计算。</Typography>
          <Typography shuku-edit-id="e-b1e86499-4ef2-4d32-b67e-c5804edad134" variant="bodySmall" tone="muted">“苹果”没有改变，改变的是模型此刻携带的上下文。</Typography>
        </div>
      </div>
    </ContentBlock>
  );
}
