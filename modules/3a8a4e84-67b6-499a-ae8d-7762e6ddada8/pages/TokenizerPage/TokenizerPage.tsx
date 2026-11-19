import { transformerAsset } from '../../assetUrls';
import { useState } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
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
    return (<section shuku-edit-id="e-22dfdd74-5b28-4560-89ad-c0ca7f50e98c" className="tr-tokenizer-page" aria-labelledby="tr-tokenizer-title">
      <header shuku-edit-id="e-2d5a0e06-448d-4bfc-8e47-c378d29d7d8b" className="tr-lesson-header tr-tokenizer-page__header">
        <div shuku-edit-id="e-9493969b-b1f3-4313-ae43-d9df6c83c0dc"><Typography shuku-edit-id="e-9936f184-6d04-4541-a9cc-86c8051354db" id="tr-tokenizer-title" as="h1" variant="display" tone="accent">分词与词嵌入：把文字变成数字</Typography></div>
        <Typography shuku-edit-id="e-d9f45ba9-9226-445a-b178-d63bc2a393d6" as="p" variant="subtitle" tone="muted">输入英文，依次点击“开始分词”和“生成向量”，查看数字表示。</Typography>
      </header>
      <main shuku-edit-id="e-6234952d-6ff6-4a85-ba73-533eda251f5d" className="tr-tokenizer-panels">
        <section shuku-edit-id="e-38902373-5720-4bb3-bf64-a925aeef0103" className="tr-tokenizer-panel" aria-label="输入句子">
          <h2 shuku-edit-id="e-0ba72cb0-f369-4be5-8a5f-6b8d264cfbcb">输入句子</h2>
          <div shuku-edit-id="e-2af6aa9f-0bb9-4dd7-9059-ac0e418b398c" className="tr-tokenizer-demo tr-tokenizer-input">
            <textarea shuku-edit-id="e-e21cba92-3d0b-498f-bb9d-602062eae00d" aria-label="原文句子" value={text} maxLength={80} disabled={tokenizing || modelLoading} onChange={(event) => updateText(event.currentTarget.value)}/>
            <Button variant="primary" disabled={!text.trim() || tokenizing || modelLoading} onClick={handleTokenize}>{tokenizing ? '正在分词' : '开始分词'}</Button>
          </div>
          <p shuku-edit-id="e-ed6b9299-a44a-4c75-9f4f-a50b2ed7ffdc" className="tr-tokenizer-caption">输入模型要处理的<strong shuku-edit-id="e-fb875074-3e53-4ce9-8428-3054f9fbb16d">原文句子</strong>。</p>
        </section>
        <section shuku-edit-id="e-0de9af1e-9062-4696-9302-401e4715d239" className="tr-tokenizer-panel" aria-label="分词结果">
          <h2 shuku-edit-id="e-ebe006c2-0f9d-42aa-9f5b-2cdcfaee7325"><img shuku-edit-id="e-938206bf-17b9-44b9-a1fe-45c1b6991aea" src={transformerAsset("02_分词与嵌入/分词.webp")} alt=""/>分词</h2>
          <div shuku-edit-id="e-7d2c33cb-ce1f-4ca9-9124-ca423c421508" className="tr-tokenizer-demo">
            {tokens.length > 0 && <>
              <div shuku-edit-id="e-9233b79e-96c5-486f-9c7b-8f85a40884e2" className="tr-tokenizer-rows" tabIndex={0} aria-label="词元列表，可上下滚动">
                {tokens.map((token, index) => <div shuku-edit-id="e-5da1f649-ec22-4494-a6df-edb49845a690" className="tr-tokenizer-word" key={index + '-' + token}>{token}</div>)}
              </div>
              <Button variant="primary" disabled={modelLoading} onClick={handleEmbedding}>{modelLoading ? '正在生成' : '生成向量'}</Button>
            </>}
          </div>
          <p shuku-edit-id="e-4d759eaa-d20f-4858-a46d-039403de126b" className="tr-tokenizer-caption">把句子切成<strong shuku-edit-id="e-4c9c69b6-c3a1-4efa-8332-9d324c51cabc">词元（Token）</strong>。</p>
        </section>
        <section shuku-edit-id="e-f9eefb4a-e384-49ce-86d0-081460816ab0" className="tr-tokenizer-panel" aria-label="词向量矩阵">
          <h2 shuku-edit-id="e-47740adf-b37e-490f-a0cb-572049d8263c"><img shuku-edit-id="e-6fe57a23-5e8d-4b33-898a-d26c9a530036" src={transformerAsset("02_分词与嵌入/词嵌入.webp")} alt=""/>词嵌入</h2>
          <div shuku-edit-id="e-9452ca12-ee51-4a26-9bb2-b24b397813d7" className="tr-tokenizer-demo">
            {modelLoading && <div shuku-edit-id="e-89034696-c80e-443b-b434-50f1e9ada6bb" className="tr-tokenizer-loading" role="status" aria-live="polite">
              <strong shuku-edit-id="e-f6230607-75f6-433c-b842-70983c240ab9">正在计算</strong>
              <progress shuku-edit-id="e-cd8d9d4a-9aab-491d-aeb8-550fdba4d5b6" max={100} value={modelProgress} aria-label="当前文件加载进度"/>
              <span shuku-edit-id="e-ec71a80d-9bb4-49e6-abfb-d87bc8c32544">{modelMessage}</span>
            </div>}
            {!modelLoading && modelError && <div shuku-edit-id="e-8ba21388-8fd8-4ec4-80c4-80fe204624da" className="tr-tokenizer-error" role="alert"><strong shuku-edit-id="e-2db5676a-b516-4162-a9c9-45a60eecbb0a">暂未计算成功</strong><p shuku-edit-id="e-61a56a0d-0824-44fc-8b5e-f9ce1e2af396">{modelError}</p><Button onClick={handleEmbedding}>重试</Button></div>}
            {!modelLoading && embeddings.length > 0 && <>
              <div shuku-edit-id="e-d3394fe1-b430-4de7-90c2-f88da235ed7d" className="tr-tokenizer-vector-head"><span shuku-edit-id="e-dcb830f2-1f70-4b4a-b58c-721d8a5ecc0b">Token</span><span shuku-edit-id="e-7f4adb20-2b1a-4217-9933-3e15998266ce">d₁</span><span shuku-edit-id="e-71e5317f-0f9f-44f0-b3fa-f10f7f183937">d₂</span><span shuku-edit-id="e-e4d7faa8-899d-4fb1-b76c-393904f5094b">…</span><span shuku-edit-id="e-ceed2b9b-d5ab-43a3-bd1d-3c29cc2b7ef6">d₅₁₂</span></div>
              <div shuku-edit-id="e-df394a76-33a8-4f01-bee5-2598d9d08c1e" className="tr-tokenizer-rows" tabIndex={0} aria-label="映射后的 512 维词向量预览，可上下滚动">
                {embeddings.map((row, index) => <div shuku-edit-id="e-673ccdad-3d53-45d3-a1fe-95c36cee9858" className="tr-tokenizer-vector" key={index + '-' + row.token}>
                  <strong shuku-edit-id="e-25380aa6-ca5f-4eb7-94a4-a17a1d003248">{row.token}</strong><code shuku-edit-id="e-ffd4ee72-8860-48b7-bcf9-a1cbe561f59f">{row.values[0].toFixed(3)}</code><code shuku-edit-id="e-35c05718-590d-4ab7-8810-5208aec47e4a">{row.values[1].toFixed(3)}</code><span shuku-edit-id="e-d9fe822b-2d15-431b-8bee-97db5f0cc3ad">…</span><code shuku-edit-id="e-3f9fd13b-329d-4ced-aa4f-bce20b5b13a7">{row.values[DISPLAY_EMBEDDING_DIMENSIONS - 1].toFixed(3)}</code>
                </div>)}
              </div>
              <div shuku-edit-id="e-ce265e55-ff91-4f94-9a61-8e641da8860b" className="tr-tokenizer-dimension">{embeddings.length} × {DISPLAY_EMBEDDING_DIMENSIONS}</div>
            </>}
          </div>
          <p shuku-edit-id="e-b62b13be-ac1d-405c-bce8-f345072c14ce" className="tr-tokenizer-caption">GloVe 原始向量为 <strong shuku-edit-id="e-32b80809-9354-4a54-b7e9-e0b4245ad94c">50 维</strong>，本课保距映射为 <strong shuku-edit-id="e-07b99622-9587-4600-8601-46ee3a544148">512 维</strong>演示。</p>
        </section>
      </main>
      <footer shuku-edit-id="e-09d3655a-0763-4a3f-91ba-8bc5a903d196" className="tr-tokenizer-page__footer">{embeddings.length > 0 && !modelLoading && <Button className="tr-language-next" variant="primary" onClick={onComplete}>继续：看看词向量的几何关系 →</Button>}</footer>
    </section>);
}
export function TokenizerPageFrame({ onComplete }: TokenizerPageProps) {
    return <LessonPageFrame><TokenizerPage onComplete={onComplete}/></LessonPageFrame>;
}
