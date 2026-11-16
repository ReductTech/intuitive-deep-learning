import { useState } from 'react';
import { Button } from "@shuku/course-style/react/controls/Button";
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
    <section shuku-edit-id="e-9b1f2912-6de9-4006-9d4d-84ee6a666c04" className="tr-decoder-generation">
      <header shuku-edit-id="e-b6719cb9-f0cc-408b-88ab-6bf2de256e35" className="tr-lesson-header tr-decoder-generation__header">
        <h1 shuku-edit-id="e-2428e832-05fb-48c7-bc3f-c022cb410275">什么是解码器？</h1>
        <p shuku-edit-id="e-dddc0b7d-3b55-47a5-92e1-9e39c4528bc0">每点一次“预测”，观察最高概率词怎样自动接回左侧译文。</p>
      </header>

      <p shuku-edit-id="e-2b8d8f3e-8eb2-446a-bd0a-f6700fce9804" className="tr-decoder-generation__definition">翻译时，解码器结合<strong shuku-edit-id="e-af0bb733-d3dc-444b-a5e9-4420ec40af71">编码器输出的原文信息</strong>和<strong shuku-edit-id="e-fe858970-a52d-4928-af96-d934e0ad85ed">已经生成的中文</strong>，预测<strong shuku-edit-id="e-c1e4ec9b-a4ba-472e-b54a-a11485ad0d24">下一个词的概率</strong>，再把选中的词接到译文后面。</p>

      <main shuku-edit-id="e-e295a897-97e7-4d12-8a0a-b11316aa528b" className="tr-decoder-generation__stage">
        <section shuku-edit-id="e-8c0f9416-2a30-4427-bba7-ea4bb83fcbd8" className="tr-decoder-generation__inputs" aria-label="解码器的两路输入">
          <div shuku-edit-id="e-af7bb3fd-e6c8-44c4-a478-c2f8558d73fa" className="tr-decoder-generation__stage-heading"><strong shuku-edit-id="e-86b36666-b645-4812-ac31-f7d2a47adb4f">两路输入</strong></div>
          <div shuku-edit-id="e-00bc69b8-f842-4968-afc9-7380bb21b947" className="tr-decoder-generation__source">
            <div shuku-edit-id="e-f9c3cecd-972b-416e-bb5b-908b1eef95f3"><strong shuku-edit-id="e-5c570c85-4014-49c5-a2c7-6baf2e19a32f">编码器输出</strong><span shuku-edit-id="e-f9894f9d-5074-42b6-83e4-f922c9fc29d7">原文各词的上下文向量</span><small shuku-edit-id="e-a8ad5ae4-dcf1-4615-a186-3fe151151e38">I love deep learning.</small></div>
            <div shuku-edit-id="e-303cd981-948c-468f-ad33-23c3395836d5" className="tr-decoder-generation__source-matrix" aria-label="编码器输出的示意矩阵">
              {Array.from({ length: 32 }, (_, index) => <i shuku-edit-id="e-a44fdd5f-a8b1-44a2-a950-c4c97740d036" style={{ '--cell-color': ['#92ced8', '#d3e8ec', '#4fa9b9', '#a6d5de', '#6cbbca', '#e5f1f3', '#b9dde3', '#75c1cd'][(index * 5 + Math.floor(index / 8) * 3) % 8] } as React.CSSProperties} key={index}/>)}
            </div>
          </div>
          <div shuku-edit-id="e-7eaf644f-f9ca-4ed7-a46c-a63ddbfc28a8" className="tr-decoder-generation__target">
            <span shuku-edit-id="e-c691a5ae-03e7-48b0-9464-8666b4852826">已生成的译文</span>
            <div shuku-edit-id="e-dc938620-dad9-4e1c-a2f3-56535264cb17" className="tr-decoder-generation__tokens" aria-live="polite">
              <b shuku-edit-id="e-48fe2d3c-49c8-42ac-9c19-360f2e0f5aca">&lt;开始&gt;</b>
              {generated.map((token, index) => <b shuku-edit-id="e-f3abd0b4-8ec8-4524-9256-4999fa431e0c" className={index === generated.length - 1 ? 'is-new' : ''} key={`${index}-${token}`}>{token}</b>)}
              {finished && <b shuku-edit-id="e-3b072246-b6cb-48f1-a309-e4260449429f" className="is-end">&lt;结束&gt;</b>}
            </div>
          </div>
        </section>

        <svg shuku-edit-id="e-28faad36-d6ca-4c22-901f-0631afb5a72d" className="tr-decoder-generation__input-arrows" viewBox="0 0 90 450" preserveAspectRatio="none" aria-hidden="true"><path shuku-edit-id="e-dc95924c-7b00-4a79-8145-65fb666d69c5" d="M2 125 C46 125 42 225 84 225"/><path shuku-edit-id="e-0e86203b-f8f2-4990-a16c-cfc1ab87def8" d="M2 338 C46 338 42 225 84 225"/><path shuku-edit-id="e-e341181a-7439-41d5-b09b-aad7ae095b16" className="arrowhead" d="M73 215 L88 225 L73 235"/></svg>
        <div shuku-edit-id="e-6fa7207a-19c6-41b2-9c85-3f0f1ee4f68c" className="tr-decoder-generation__core" aria-label="解码器：复杂神经网络"><strong shuku-edit-id="e-9b991c7a-610c-4065-8c32-b015978ae95f">解码器</strong><span shuku-edit-id="e-ad618cb5-e6e8-45b1-aa97-5e581d23ae14">复杂神经网络</span></div>
        <div shuku-edit-id="e-51aa6211-38a7-48b4-947c-e415c9151476" className="tr-decoder-generation__output-arrow" aria-hidden="true"/>

        <section shuku-edit-id="e-e67afbc9-1ede-4015-af91-ec3cd2bddde4" className="tr-decoder-generation__output" aria-label="下一个词的预测概率">
          <div shuku-edit-id="e-b22f1f7e-4ac9-4f63-b019-e15aa4e5825d" className="tr-decoder-generation__stage-heading"><strong shuku-edit-id="e-cb949b80-fa83-477e-adf9-19059fc3c017">{finished ? '翻译完成' : '模拟预测：下一个词'}</strong></div>
          {finished ? <div shuku-edit-id="e-2f5a04ab-2744-40c3-81ae-82584bcd8eb4" className="tr-decoder-generation__finish" aria-live="polite"><strong shuku-edit-id="e-9aa4396b-9faa-4c9c-ab02-f49ff9aad7ce">我爱深度学习。</strong><span shuku-edit-id="e-2211689f-1fb5-4fa1-91c8-9031857d942a">遇到 &lt;结束&gt;，译文生成完毕。</span></div>
            : step === 0 ? <div shuku-edit-id="e-e6b98fa6-550c-4be6-8ce7-642c74d978a5" className="tr-decoder-generation__waiting"><strong shuku-edit-id="e-25a617fa-3240-4562-8dca-1b3b93f1b704">下一个中文词是什么？</strong></div>
                : <div shuku-edit-id="e-17ef882c-44ec-40b4-88cc-91541339ad69" className="tr-decoder-generation__candidates" aria-live="polite">
              {rounds[step - 1].map(({ token, probability }, optionIndex) => <div shuku-edit-id="e-4c72bba6-251e-4f94-840f-cf0771ab9c5e" className={optionIndex === 0 ? 'is-leading' : ''} key={token}>
                <strong shuku-edit-id="e-47bdd26c-66d0-41a8-9d38-c4f2b7e85749">{token}</strong><span shuku-edit-id="e-dcdf35ee-15c9-4f3b-b89b-7ccbc08b48b2" className="tr-decoder-generation__bar"><i shuku-edit-id="e-7924cf99-c512-41f9-8666-aba41a23d584" style={{ width: `${probability}%` }}/></span><b shuku-edit-id="e-f011a5ce-a883-468f-9659-fe0b76799891">{probability}%</b>
              </div>)}
              <p shuku-edit-id="e-cc13149b-0b4a-4ea9-bf05-08cad8629997">最高概率词已加入左侧；继续预测第 {step + 1} 个词。</p>
            </div>}
          <div shuku-edit-id="e-8a8e71dd-a8dd-4972-a71c-b16f7061af99" className="tr-decoder-generation__action">{finished ? <Button onClick={() => setStep(0)}>重新演示</Button> : <Button variant="primary" onClick={() => setStep((current) => current + 1)}>预测下一个词</Button>}</div>
        </section>
      </main>

      <footer shuku-edit-id="e-64ba70d7-82f2-495f-8efb-2f012f75b0e4" className="tr-decoder-generation__footer"><Button variant="primary" disabled={!finished} onClick={onComplete}>原文和译文是怎样联系起来的？</Button></footer>
    </section>
  </LessonPageFrame>;
}
