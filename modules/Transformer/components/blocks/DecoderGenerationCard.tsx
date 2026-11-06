import { useState } from 'react';
import { Button } from '../../../shared/react/controls/Button';
import { LessonPageFrame } from '../LessonPageFrame';
import './DecoderGenerationCard.css';
interface CompleteProps {
    onComplete: () => void;
}
const rounds = [
    [{ token: '我', probability: 72 }, { token: '我们', probability: 18 }, { token: '你', probability: 10 }],
    [{ token: '爱', probability: 75 }, { token: '喜欢', probability: 17 }, { token: '研究', probability: 8 }],
    [{ token: '深度', probability: 70 }, { token: '我的', probability: 19 }, { token: '机器', probability: 11 }],
    [{ token: '学习', probability: 68 }, { token: '研究', probability: 20 }, { token: '书籍', probability: 12 }],
    [{ token: '。', probability: 77 }, { token: '！', probability: 13 }, { token: '今天', probability: 10 }],
    [{ token: '<结束>', probability: 92 }, { token: '而且', probability: 5 }, { token: '今天', probability: 3 }],
] as const;
export function DecoderGenerationCard({ onComplete }: CompleteProps) {
    const [step, setStep] = useState(0);
    const finished = step === rounds.length;
    const generated = rounds.slice(0, step).map((choices) => choices[0].token).filter((token) => token !== '<结束>');
    return <LessonPageFrame>
    <section className="tr-decoder-generation">
      <header className="tr-lesson-header tr-decoder-generation__header">
        <h1>什么是解码器？</h1>
        <p>每点一次“预测”，观察最高概率词怎样自动接回左侧译文。</p>
      </header>

      <p className="tr-decoder-generation__definition">翻译时，解码器结合<strong>编码器输出的原文信息</strong>和<strong>已经生成的中文</strong>，预测<strong>下一个词的概率</strong>，再把选中的词接到译文后面。</p>

      <main className="tr-decoder-generation__stage">
        <section className="tr-decoder-generation__inputs" aria-label="解码器的两路输入">
          <div className="tr-decoder-generation__stage-heading"><strong>两路输入</strong></div>
          <div className="tr-decoder-generation__source">
            <div><strong>编码器输出</strong><span>原文各词的上下文向量</span><small>I love deep learning.</small></div>
            <div className="tr-decoder-generation__source-matrix" aria-label="编码器输出的示意矩阵">
              {Array.from({ length: 32 }, (_, index) => <i style={{ '--cell-color': ['#92ced8', '#d3e8ec', '#4fa9b9', '#a6d5de', '#6cbbca', '#e5f1f3', '#b9dde3', '#75c1cd'][(index * 5 + Math.floor(index / 8) * 3) % 8] } as React.CSSProperties} key={index}/>)}
            </div>
          </div>
          <div className="tr-decoder-generation__target">
            <span>已生成的译文</span>
            <div className="tr-decoder-generation__tokens" aria-live="polite">
              <b>&lt;开始&gt;</b>
              {generated.map((token, index) => <b className={index === generated.length - 1 ? 'is-new' : ''} key={`${index}-${token}`}>{token}</b>)}
              {finished && <b className="is-end">&lt;结束&gt;</b>}
            </div>
          </div>
        </section>

        <svg className="tr-decoder-generation__input-arrows" viewBox="0 0 90 450" preserveAspectRatio="none" aria-hidden="true"><path d="M2 125 C46 125 42 225 84 225"/><path d="M2 338 C46 338 42 225 84 225"/><path className="arrowhead" d="M73 215 L88 225 L73 235"/></svg>
        <div className="tr-decoder-generation__core" aria-label="解码器：复杂神经网络"><strong>解码器</strong><span>复杂神经网络</span></div>
        <div className="tr-decoder-generation__output-arrow" aria-hidden="true"/>

        <section className="tr-decoder-generation__output" aria-label="下一个词的预测概率">
          <div className="tr-decoder-generation__stage-heading"><strong>{finished ? '翻译完成' : '模拟预测：下一个词'}</strong></div>
          {finished ? <div className="tr-decoder-generation__finish" aria-live="polite"><strong>我爱深度学习。</strong><span>遇到 &lt;结束&gt;，译文生成完毕。</span></div>
            : step === 0 ? <div className="tr-decoder-generation__waiting"><strong>下一个中文词是什么？</strong></div>
                : <div className="tr-decoder-generation__candidates" aria-live="polite">
              {rounds[step - 1].map(({ token, probability }, optionIndex) => <div className={optionIndex === 0 ? 'is-leading' : ''} key={token}>
                <strong>{token}</strong><span className="tr-decoder-generation__bar"><i style={{ width: `${probability}%` }}/></span><b>{probability}%</b>
              </div>)}
              <p>最高概率词已加入左侧；继续预测第 {step + 1} 个词。</p>
            </div>}
          <div className="tr-decoder-generation__action">{finished ? <Button onClick={() => setStep(0)}>重新演示</Button> : <Button variant="primary" onClick={() => setStep((current) => current + 1)}>预测下一个词</Button>}</div>
        </section>
      </main>

      <footer className="tr-decoder-generation__footer"><Button variant="primary" disabled={!finished} onClick={onComplete}>原文和译文是怎样联系起来的？</Button></footer>
    </section>
  </LessonPageFrame>;
}
