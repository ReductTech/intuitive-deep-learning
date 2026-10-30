import { transformerAsset } from '../../assetUrls';
import { Button, Typography } from '../../../shared/react';
import { LessonPageFrame } from '../../components/LessonPageFrame';
import './TranslationOpeningPage.css';
export function TranslationOpeningPage({ onComplete }: {
    onComplete: () => void;
}) {
    return <LessonPageFrame><section className="tr-translation-opening" aria-labelledby="tr-translation-title">
    <img className="tr-translation-backdrop" src={transformerAsset("01_翻译引入/翻译任务.png")} alt="学生递出原文，机器人歪头托着下巴思考如何翻译"/>
    <header className="tr-lesson-header">
      <Typography as="h1" variant="display" tone="accent" id="tr-translation-title">一句英文，机器怎样翻成中文？</Typography>
      <Typography variant="subtitle" tone="muted">先试着翻译这句英文，再进入课程看看机器怎样完成。</Typography>
    </header>
    <section className="tr-translation-bubble tr-translation-bubble--source" aria-label="英文原文">
      <Typography variant="body" tone="muted">英文原文</Typography>
      <Typography variant="h2"><span className="tr-translation-word--person">I</span>{' '}<span className="tr-translation-word--verb">love</span>{' '}<span className="tr-translation-word--subject">deep learning</span>.</Typography>
    </section>
    <section className="tr-translation-bubble tr-translation-bubble--target" aria-label="等待揭晓的中文译文">
      <Typography variant="body" tone="muted">中文怎么说？</Typography>
      <Typography variant="display" tone="accent" align="center">？</Typography>
    </section>
    <div className="tr-translation-note">
      <Typography variant="h3" tone="accent">Transformer</Typography>
      <Typography variant="body" tone="muted">理解原文，生成译文</Typography>
    </div>
    <div className="tr-translation-question"><Typography variant="h3">机器怎样理解<span>词与词的关系</span>，并<span>生成译文</span>？</Typography></div>
    <footer><Button variant="primary" onClick={onComplete}>走进 Transformer →</Button></footer>
  </section></LessonPageFrame>;
}
