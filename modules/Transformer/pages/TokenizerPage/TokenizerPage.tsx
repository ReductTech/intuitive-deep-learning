import { transformerAsset } from '../../assetUrls';
import { useState } from 'react';
import { Button, Typography } from '../../../shared/react';
import { LessonPageFrame } from '../../components/LessonPageFrame';
import { embedWithGlove, tokenizeForGlove, DISPLAY_EMBEDDING_DIMENSIONS, type GloveTokenEmbedding } from '../../domain/gloveEmbedding';
import './TokenizerPage.css';
interface TokenizerPageProps {
    onComplete: () => void;
}
export function TokenizerPage({ onComplete }: TokenizerPageProps) {
    const [text, setText] = useState('I love deep learning.');
    const [tokens, setTokens] = useState<string[]>([]);
    const [embeddings, setEmbeddings] = useState<GloveTokenEmbedding[]>([]);
    const [tokenizing, setTokenizing] = useState(false);
    const [modelLoading, setModelLoading] = useState(false);
    const [modelProgress, setModelProgress] = useState(0);
    const [modelMessage, setModelMessage] = useState('');
    const [modelError, setModelError] = useState('');
    const updateText = (value: string) => {
        setText(value);
        setTokens([]);
        setEmbeddings([]);
        setModelError('');
    };
    const handleTokenize = async () => {
        if (!text.trim() || tokenizing || modelLoading)
            return;
        setTokenizing(true);
        setModelError('');
        setEmbeddings([]);
        try {
            setTokens(await tokenizeForGlove(text));
        }
        catch (error) {
            setModelError(error instanceof Error ? error.message : '分词失败，请重试。');
        }
        finally {
            setTokenizing(false);
        }
    };
    const handleEmbedding = async () => {
        if (modelLoading || !tokens.length)
            return;
        setModelLoading(true);
        setModelError('');
        setModelProgress(0);
        setModelMessage('正在本地计算');
        try {
            const result = await embedWithGlove(text, (progress, message) => {
                setModelProgress(Math.round(progress));
                setModelMessage(message);
            });
            setTokens(result.map((row) => row.token));
            setEmbeddings(result);
        }
        catch (error) {
            setModelError(error instanceof Error ? error.message : '模型加载失败，请重试。');
        }
        finally {
            setModelLoading(false);
        }
    };
    return (<section className="tr-tokenizer-page" aria-labelledby="tr-tokenizer-title">
      <header className="tr-lesson-header tr-tokenizer-page__header">
        <div><Typography id="tr-tokenizer-title" as="h1" variant="display" tone="accent">分词与词嵌入：把文字变成数字</Typography></div>
        <Typography as="p" variant="subtitle" tone="muted">输入英文，依次点击“开始分词”和“生成向量”，查看数字表示。</Typography>
      </header>
      <main className="tr-tokenizer-panels">
        <section className="tr-tokenizer-panel" aria-label="输入句子">
          <h2>输入句子</h2>
          <div className="tr-tokenizer-demo tr-tokenizer-input">
            <textarea aria-label="原文句子" value={text} maxLength={80} disabled={tokenizing || modelLoading} onChange={(event) => updateText(event.currentTarget.value)}/>
            <Button variant="primary" disabled={!text.trim() || tokenizing || modelLoading} onClick={handleTokenize}>{tokenizing ? '正在分词' : '开始分词'}</Button>
          </div>
          <p className="tr-tokenizer-caption">输入模型要处理的<strong>原文句子</strong>。</p>
        </section>
        <section className="tr-tokenizer-panel" aria-label="分词结果">
          <h2><img src={transformerAsset("02_分词与嵌入/分词.png")} alt=""/>分词</h2>
          <div className="tr-tokenizer-demo">
            {tokens.length > 0 && <>
              <div className="tr-tokenizer-rows" tabIndex={0} aria-label="词元列表，可上下滚动">
                {tokens.map((token, index) => <div className="tr-tokenizer-word" key={index + '-' + token}>{token}</div>)}
              </div>
              <Button variant="primary" disabled={modelLoading} onClick={handleEmbedding}>{modelLoading ? '正在生成' : '生成向量'}</Button>
            </>}
          </div>
          <p className="tr-tokenizer-caption">把句子切成<strong>词元（Token）</strong>。</p>
        </section>
        <section className="tr-tokenizer-panel" aria-label="词向量矩阵">
          <h2><img src={transformerAsset("02_分词与嵌入/词嵌入.png")} alt=""/>词嵌入</h2>
          <div className="tr-tokenizer-demo">
            {modelLoading && <div className="tr-tokenizer-loading" role="status" aria-live="polite">
              <strong>正在计算</strong>
              <progress max={100} value={modelProgress} aria-label="当前文件加载进度"/>
              <span>{modelMessage}</span>
            </div>}
            {!modelLoading && modelError && <div className="tr-tokenizer-error" role="alert"><strong>暂未计算成功</strong><p>{modelError}</p><Button onClick={handleEmbedding}>重试</Button></div>}
            {!modelLoading && embeddings.length > 0 && <>
              <div className="tr-tokenizer-vector-head"><span>Token</span><span>d₁</span><span>d₂</span><span>…</span><span>d₅₁₂</span></div>
              <div className="tr-tokenizer-rows" tabIndex={0} aria-label="映射后的 512 维词向量预览，可上下滚动">
                {embeddings.map((row, index) => <div className="tr-tokenizer-vector" key={index + '-' + row.token}>
                  <strong>{row.token}</strong><code>{row.values[0].toFixed(3)}</code><code>{row.values[1].toFixed(3)}</code><span>…</span><code>{row.values[DISPLAY_EMBEDDING_DIMENSIONS - 1].toFixed(3)}</code>
                </div>)}
              </div>
              <div className="tr-tokenizer-dimension">{embeddings.length} × {DISPLAY_EMBEDDING_DIMENSIONS}</div>
            </>}
          </div>
          <p className="tr-tokenizer-caption">GloVe 原始向量为 <strong>50 维</strong>，本课保距映射为 <strong>512 维</strong>演示。</p>
        </section>
      </main>
      <footer className="tr-tokenizer-page__footer">{embeddings.length > 0 && !modelLoading && <Button className="tr-language-next" variant="primary" onClick={onComplete}>继续：看看词向量的几何关系 →</Button>}</footer>
    </section>);
}
export function TokenizerPageFrame({ onComplete }: TokenizerPageProps) {
    return <LessonPageFrame><TokenizerPage onComplete={onComplete}/></LessonPageFrame>;
}
