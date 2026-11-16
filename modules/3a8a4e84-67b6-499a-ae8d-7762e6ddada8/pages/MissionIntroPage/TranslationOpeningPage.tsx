import { transformerAsset } from '../../assetUrls';
import { Button, Typography } from "@shuku/course-style/react";
import { LessonPageFrame } from '../../components/LessonPageFrame';
import './TranslationOpeningPage.css';
export function TranslationOpeningPage({ onComplete }: {
    onComplete: () => void;
}) {
    return <LessonPageFrame><section shuku-edit-id="e-0985bec6-b0c3-4d7a-92af-1ba05136de5f" className="tr-translation-opening" aria-labelledby="tr-translation-title">
    <img shuku-edit-id="e-e67f2c8e-af22-45de-9893-455667e3e785" className="tr-translation-backdrop" src={transformerAsset("01_翻译引入/翻译任务.jpg")} alt="学生递出原文，机器人歪头托着下巴思考如何翻译"/>
    <header shuku-edit-id="e-5b9a2634-454e-40c8-ba98-a75ce1613f5f" className="tr-lesson-header">
      <Typography shuku-edit-id="e-498b5f70-4a04-4018-96ae-fe03e5806afc" as="h1" variant="display" tone="accent" id="tr-translation-title">一句英文，机器怎样翻成中文？</Typography>
      <Typography shuku-edit-id="e-fc171144-19c8-402e-95d4-24afa2a1ab7c" variant="subtitle" tone="muted">先试着翻译这句英文，再进入课程看看机器怎样完成。</Typography>
    </header>
    <section shuku-edit-id="e-2dab6bcf-0141-4eee-afa1-1b107c87c2e2" className="tr-translation-bubble tr-translation-bubble--source" aria-label="英文原文">
      <Typography shuku-edit-id="e-d51bc73a-659b-4880-b3bc-2027fa8c925f" variant="body" tone="muted">英文原文</Typography>
      <Typography shuku-edit-id="e-04e0a20d-e60e-4c44-8b65-b7ab41783c5d" variant="h2"><span shuku-edit-id="e-6376c2d2-ae0d-41a9-acca-a719f0ed3963" className="tr-translation-word--person">I</span>{' '}<span shuku-edit-id="e-97a98f4d-21e7-4f9c-9881-b9fc9b4f107d" className="tr-translation-word--verb">love</span>{' '}<span shuku-edit-id="e-7daf104f-d7f4-4e6a-b55b-ac323e2cc2dd" className="tr-translation-word--subject">deep learning</span>.</Typography>
    </section>
    <section shuku-edit-id="e-e0b713ef-97a1-4fb6-9565-a33aaf83f9af" className="tr-translation-bubble tr-translation-bubble--target" aria-label="等待揭晓的中文译文">
      <Typography shuku-edit-id="e-cb7203c8-c8e3-495b-8b1d-660e2ceba378" variant="body" tone="muted">中文怎么说？</Typography>
      <Typography shuku-edit-id="e-44f7daf2-4ced-4a4e-af08-d3351165f2f8" variant="display" tone="accent" align="center">？</Typography>
    </section>
    <div shuku-edit-id="e-bfb18ccc-9b43-4615-86df-3aae5d71a917" className="tr-translation-note">
      <Typography shuku-edit-id="e-7c9f5699-4212-497a-a4ed-32d978607d63" variant="h3" tone="accent">Transformer</Typography>
      <Typography shuku-edit-id="e-7250738f-37a2-417a-86f6-858fd8d246d5" variant="body" tone="muted">理解原文，生成译文</Typography>
    </div>
    <div shuku-edit-id="e-06e4553f-6be7-42a3-a0a7-fb29dd5df153" className="tr-translation-question"><Typography shuku-edit-id="e-46468531-809f-4d06-9cab-afdede880512" variant="h3">机器怎样理解<span shuku-edit-id="e-df4a8d08-1fe5-4780-be6b-c084d634f0e7">词与词的关系</span>，并<span shuku-edit-id="e-208968e7-b5ab-41d0-bebc-c62e223c58a1">生成译文</span>？</Typography></div>
    <footer shuku-edit-id="e-2c997202-7aee-49ea-bc1d-2d1bcb89cc72"><Button variant="primary" onClick={onComplete}>走进 Transformer →</Button></footer>
  </section></LessonPageFrame>;
}
