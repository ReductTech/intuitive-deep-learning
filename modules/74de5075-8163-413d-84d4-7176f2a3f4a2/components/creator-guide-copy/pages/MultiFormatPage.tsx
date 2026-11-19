import { creatorGuideAssetUrl } from '../creatorGuideAssets';
import moduleAssetOutline from '../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { useEffect, useRef, useState, type ReactNode, type MouseEvent } from 'react';
import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
import { NativeStudyPreview } from '../components/NativeStudyPreview';
import './MultiFormatPage.css';

const lessonImage = (id: string) => creatorGuideAssetUrl(moduleAssetOutline.moduleIdentity.id, `images/multi-format/convolution/${id}.webp`);
const lessons = [
  { title: '从五子棋开始认识卷积核', image: lessonImage('gomoku-play'), steps: [
    { title: '先下一局', text: '先与 AI 下一局五子棋，从熟悉的棋盘和局部棋形开始。', box: [1, 3, 25, 90] },
    { title: '观察棋形', text: '棋盘上的黑白棋子形成局部形状，后面会把它们转成数字来寻找连线。', box: [27, 4, 50, 92] },
    { title: '完成对局', text: '完成一局，或查看示例棋局后，解锁下一步的数字编码。', box: [78, 60, 20, 36] },
  ] },
  { title: '棋盘局部区域的数值表示', image: lessonImage('board-as-numbers'), steps: [
    { title: '局部取样', text: '从上一局棋中取出一个局部区域，将棋子和数字对应起来。', box: [3, 26, 32, 65] },
    { title: '数字编码', text: '目标棋子记为一，对手棋子记为负一，空位记为零。', box: [38, 28, 28, 62] },
    { title: '位置对应', text: '数字矩阵保留棋盘的位置关系。将指针移到数字上，可以查看对应的棋盘位置。', box: [68, 26, 29, 65] },
  ] },
  { title: '棋形的局部匹配', image: lessonImage('window-scan'), steps: [
    { title: '移动窗口', text: '让一个五乘五的窗口在数字棋盘上移动，观察它当前框住的局部区域。', box: [3, 17, 48, 76] },
    { title: '逐项对应', text: '将窗口内的数字与目标模板一一对应，计算当前位置的匹配得分。', box: [54, 20, 43, 40] },
    { title: '找到棋形', text: '拖动窗口找到最匹配的位置后，课程解锁下一步的模板设计。', box: [54, 62, 43, 32] },
  ] },
  { title: '根据棋形调整模板', image: lessonImage('kernel-design'), steps: [
    { title: '观察变化', text: '棋盘上的目标棋形换了方向，原来的模板也需要调整。', box: [3, 17, 48, 76] },
    { title: '修改模板', text: '点击右侧模板格子，排出你希望寻找的局部形状。', box: [54, 18, 43, 44] },
    { title: '验证匹配', text: '模板设置正确后，拖动窗口找到匹配位置，继续理解卷积核的计算。', box: [54, 65, 43, 28] },
  ] },
];
function FormatStyleIcon({ kind }: { kind: 'code' | 'screen' | 'person' | 'play' | 'devices' | 'book' | 'light' | 'video' }) {
  const paths = {
    code: 'm12 9-8 7 8 7m8-14 8 7-8 7m-2-19-4 24',
    screen: 'M3 5h26v18H3ZM16 23v7M10 30l6-7 6 7M12 13l4-3 4 3-4 3Z',
    person: 'M16 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12ZM4 29v-4a12 12 0 0 1 24 0v4Z',
    play: 'M16 2a14 14 0 1 0 0 28 14 14 0 0 0 0-28ZM12 9l11 7-11 7Z',
    devices: 'M2 4h23v17H2ZM8 27h12M14 21v6M23 14h8v16h-8Z',
    book: 'M16 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM2 19q7-5 14 0 7-5 14 0v11q-7-5-14 0-7-5-14 0ZM16 19v11',
    light: 'M11 24c0-5-6-5-6-12a11 11 0 0 1 22 0c0 7-6 7-6 12ZM12 28h8M14 31h4M16 1V-2M0 12h-3M32 12h3',
    video: 'M2 6h20v20H2ZM22 12l9-5v18l-9-5',
  };
  return <svg shuku-edit-id="e-5279b8b5-a63c-492e-b004-b9ee167174d6" viewBox="-4 -4 40 40" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path shuku-edit-id="e-6f5d831c-98b7-449c-bfa0-810f76dbe128" d={paths[kind]} /></svg>;
}
function MiniWindow({ children }: { children: ReactNode }) {
  return <div shuku-edit-id="e-c3e47004-dcf5-4e1a-b7e9-52c2d18ab151" className="aipe-replay-cg-format-window"><div shuku-edit-id="e-2304060b-e5d7-4088-9564-06e85ac3ddd2" className="aipe-replay-cg-format-mini">{children}</div></div>;
}
function ReadingPreview({ onClose }: { onClose: () => void }) {
  return <MiniWindow>
    <div shuku-edit-id="e-566d76f6-929b-4161-9872-6d1617513bef" data-ppt-viewport="等比例缩小的内嵌课件播放器窗口" className="aipe-replay-cg-format-native-reader"><div shuku-edit-id="e-11b02962-5afc-43ec-b176-88adce7e4662" className="aipe-replay-cg-format-native-content" data-embedded-lesson="true" role="region" aria-label="卷积入门自学流程，可上下滚动并逐步解锁" tabIndex={0} onClick={event => event.stopPropagation()} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); onClose(); } }}><NativeStudyPreview /></div></div>
  </MiniWindow>;
}
export function MultiFormatPage() {
  const root = useRef<HTMLElement>(null);
  const [expanded, setExpanded] = useState<'teaching' | 'self' | 'script' | null>(null);
  useEffect(() => {
    if (!expanded) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setExpanded(null); } };
    document.addEventListener('keydown', close, true);
    return () => document.removeEventListener('keydown', close, true);
  }, [expanded]);
  function expandCard(mode: 'teaching' | 'self' | 'script', event: MouseEvent<HTMLElement>) {
    if (!expanded && !(event.target instanceof Element && event.target.closest('button,a,input,textarea,select,iframe'))) setExpanded(mode);
  }
  function expandButton(mode: 'teaching' | 'self' | 'script', title: string) {
    return <Button className="aipe-replay-cg-format-expand" aria-label={`${expanded === mode ? '收起' : '放大'}${title}`} aria-expanded={expanded === mode} onClick={() => setExpanded(value => value === mode ? null : mode)}><Typography shuku-edit-id="e-3e7e1581-fe3f-4858-ae02-99db41f91d94" as="span" variant="bodySmall" tone="inherit">{expanded === mode ? '收起' : '⤢'}</Typography></Button>;
  }
  const [selected, setSelected] = useState(0), [step, setStep] = useState(0);
  const [explaining, setExplaining] = useState(false), [playing, setPlaying] = useState(false), [visible, setVisible] = useState(false);
  const lesson = lessons[selected];
  const speechSupported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const [paused, setPaused] = useState(false);
  const [speechError, setSpeechError] = useState('');
  function stopNarration() {
    if (utterance.current) { utterance.current = null; window.speechSynthesis.cancel(); }
    setPlaying(false); setPaused(false);
  }
  function narrate(lessonIndex: number, stepIndex: number, continuous: boolean) {
    stopNarration();
    setSelected(lessonIndex); setStep(stepIndex); setExplaining(true); setSpeechError('');
    if (!speechSupported) return;
    const item = lessons[lessonIndex].steps[stepIndex];
    const next = new SpeechSynthesisUtterance(item.text);
    next.lang = 'zh-CN'; next.rate = 1;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(item => /^zh[-_]CN/i.test(item.lang)) ?? voices.find(item => /^zh/i.test(item.lang));
    if (voice) next.voice = voice;
    utterance.current = next;
    next.onend = () => {
      if (utterance.current !== next) return;
      utterance.current = null;
      if (continuous && stepIndex < lessons[lessonIndex].steps.length - 1) narrate(lessonIndex, stepIndex + 1, true);
      else setPlaying(false);
    };
    next.onerror = () => {
      if (utterance.current !== next) return;
      utterance.current = null; setPlaying(false); setPaused(false);
      setSpeechError('语音播放失败，请再次点击播放。');
    };
    window.speechSynthesis.cancel();
    setPlaying(true);
    window.speechSynthesis.resume();
    window.speechSynthesis.speak(next);
  }
  function toggleNarration() {
    if (playing) { window.speechSynthesis.pause(); setPlaying(false); setPaused(true); }
    else if (paused && utterance.current) { window.speechSynthesis.resume(); setPlaying(true); setPaused(false); }
    else narrate(selected, step, true);
  }
  useEffect(() => {
    if (!visible) stopNarration();
    return () => { if (utterance.current) { utterance.current = null; window.speechSynthesis.cancel(); } };
  }, [visible]);
  useEffect(() => {
    const el = root.current; if (!el) return;
    let intersecting = false;
    const update = () => setVisible(intersecting && document.visibilityState === 'visible');
    const observer = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; update(); });
    observer.observe(el); document.addEventListener('visibilitychange', update);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, []);
  function select(index: number) { stopNarration(); setSelected(index); setStep(0); setExplaining(false); setSpeechError(''); }
  return <ContentBlock shuku-edit-id="e-af3a91a4-eda1-4e12-9730-9790c269ed42" ref={root} className="aipe-replay-cg-format-page aipe-replay-cg-creator-typography" headingLevel={1} title="同一份知识内容，适配多种教学与学习场景" bodyClassName="aipe-replay-cg-format-body" onKeyDown={event => { if (event.key === ' ' && event.target instanceof Element && event.target.closest('button')) event.stopPropagation(); }}>
    <div shuku-edit-id="e-4fdec1cc-e013-40bc-a473-4a91f74f5bc4" className="aipe-replay-cg-format-source-row"><svg shuku-edit-id="e-3a25c472-80e2-40e0-abbe-41fb04b2eb7d" className="aipe-replay-cg-format-source-links" viewBox="0 0 1536 112" aria-hidden="true"><path shuku-edit-id="e-213730be-9ce7-4e60-ac0c-b1eab53acb48" d="M768 52C500 35 305 39 248 112M768 52v60M768 52c268-17 463-13 520 60" /></svg><div shuku-edit-id="e-3783c863-7142-44a5-96ed-c79175dedbfd" className="aipe-replay-cg-format-source"><span shuku-edit-id="e-44598657-33ff-4329-9f4e-3bb9432aa2ef" className="aipe-replay-cg-format-source-icon"><FormatStyleIcon kind="code" /></span><div shuku-edit-id="e-b3886b7a-0ace-4347-908c-569b0d1468da"><Typography shuku-edit-id="e-3afb89f4-7a65-4285-b76b-1d9bd5c7509f" variant="h3" tone="accent">同一份内容</Typography><Typography shuku-edit-id="e-5a7693be-7b25-4894-8974-be6bf09a4022" variant="bodySmall" tone="muted">HTML-based 交互式知识呈现</Typography></div></div><Typography shuku-edit-id="e-21aa8833-4ffd-4c76-a69a-c1128bb3ea3c" variant="bodySmall" tone="warning">一次设计，多种应用场景</Typography></div>
    <div shuku-edit-id="e-5a3242b3-9668-409d-9570-72bbfdb06bb3" className={`aipe-replay-cg-format-columns${expanded ? ' has-expanded' : ''}`}>
      {expanded && <button shuku-edit-id="e-89f89372-eb5e-408c-ad2e-f4bed9526838" type="button" className="aipe-replay-cg-format-backdrop" aria-label="关闭放大预览" onClick={() => setExpanded(null)}/>}
      <section shuku-edit-id="e-ffa9a950-b22b-4d23-afcf-bc5e976962a1" className={`aipe-replay-cg-format-card aipe-replay-cg-format-teaching${expanded === 'teaching' ? ' aipe-replay-cg-format-expanded' : ''}`} onClick={event => expandCard('teaching', event)}><header shuku-edit-id="e-7fcec20f-8932-47a9-a831-0100f520b160"><span shuku-edit-id="e-781373a8-d9e8-4587-a6b8-03ab25724a04" className="aipe-replay-cg-format-mode-icon"><FormatStyleIcon kind="screen" /></span><div shuku-edit-id="e-9b104041-cbb0-4605-bce8-edcf562c4945"><Typography shuku-edit-id="e-91c15361-8c05-4ab1-aa86-e03d0fd80244" as="h2" variant="h3" tone="accent">教学展示模式</Typography><Typography shuku-edit-id="e-1b8c99f5-a5b5-4d92-86cf-1817e7debd6c" variant="bodySmall" tone="muted">面向课堂的组织化展示</Typography></div>{expandButton('teaching', '教学展示模式')}</header>
        <MiniWindow><div shuku-edit-id="e-617e3e64-97ed-49ba-81bf-7ace675851e4" className="aipe-replay-cg-format-mini-top"><Typography shuku-edit-id="e-0cb1b139-8ad5-4cb4-ad43-6a3baad634a5" variant="bodySmall" tone="accent">教学知识呈现作品 · 卷积入门</Typography><Typography shuku-edit-id="e-06ecb4ce-bd82-43f4-9597-79815c9b4555" variant="bodySmall" tone="muted">{selected + 1} / 4</Typography></div>
          <div shuku-edit-id="e-c16f5369-fde2-46f6-ae79-beeeaf2d4a13" className="aipe-replay-cg-format-teaching-preview"><nav shuku-edit-id="e-f92fd709-058c-4499-a074-00c2453ea966" className="aipe-replay-cg-format-slide-list" aria-label="选择预览知识呈现作品">{lessons.map((item, index) => <Button key={item.title} active={selected === index} onClick={() => select(index)} aria-label={`展示第${index + 1}页：${item.title}`} aria-pressed={selected === index}><img shuku-edit-id="e-c17ace35-8d63-4011-bedf-b056b2895211" src={item.image} alt={item.title} /></Button>)}</nav><div shuku-edit-id="e-62a57725-732e-476f-944d-04ea2cb941ed" className="aipe-replay-cg-format-main-preview"><img shuku-edit-id="e-e776f641-861f-40d4-b0bf-60bfd89f30dc" src={lesson.image} alt={lesson.title} /><Typography shuku-edit-id="e-4b290073-58e0-4bed-82d8-85b737dcd543" variant="bodySmall" tone="accent">{lesson.title}</Typography></div></div>
          <div shuku-edit-id="e-4102d2fe-5533-43d8-a766-e918fd4face5" className="aipe-replay-cg-format-mini-footer"><Button onClick={() => select((selected + 3) % 4)} aria-label="预览上一页"><Typography shuku-edit-id="e-eb5ea0a7-5287-4d9a-a7fb-09a9b997d805" as="span" variant="bodySmall" tone="inherit">上一页</Typography></Button><Typography shuku-edit-id="e-cd6ffb05-3a4f-4d73-8c38-5331e0852231" variant="bodySmall" tone="muted">点选缩略图，切换课堂页面</Typography><Button onClick={() => select((selected + 1) % 4)} aria-label="预览下一页"><Typography shuku-edit-id="e-df41cb93-6ce9-480e-b274-7a660cce5b06" as="span" variant="bodySmall" tone="inherit">下一页</Typography></Button></div>
        </MiniWindow>
      </section>
      <section shuku-edit-id="e-96773ab5-e908-47a1-b5f3-9d06fe822638" className={`aipe-replay-cg-format-card aipe-replay-cg-format-self${expanded === 'self' ? ' aipe-replay-cg-format-expanded' : ''}`} onClick={event => expandCard('self', event)}><header shuku-edit-id="e-6189bff7-3f3c-467f-ab0a-77b79d32c170"><span shuku-edit-id="e-4048b39c-133e-40f4-9d8a-35f8c745afc2" className="aipe-replay-cg-format-mode-icon"><FormatStyleIcon kind="person" /></span><div shuku-edit-id="e-fb6e8f2d-008c-4f2f-ad93-040f3b416ee8"><Typography shuku-edit-id="e-43eab87c-0085-48fe-833d-b10b07fe2ed9" as="h2" variant="h3" tone="success">自学交互模式</Typography><Typography shuku-edit-id="e-b6da5d1c-58db-42c8-b267-c62dae86f3f1" variant="bodySmall" tone="muted">完成当前体验，逐步解锁后续内容</Typography></div>{expandButton('self', '自学交互模式')}</header><ReadingPreview onClose={() => setExpanded(null)} /></section>
      <section shuku-edit-id="e-567276c0-25d3-4f1b-832d-8fc01d508e9d" className={`aipe-replay-cg-format-card aipe-replay-cg-format-script${expanded === 'script' ? ' aipe-replay-cg-format-expanded' : ''}`} onClick={event => expandCard('script', event)}><header shuku-edit-id="e-2bad7d12-f52f-4109-9f85-3ef5aa757a4f"><span shuku-edit-id="e-48763ca9-20fa-433d-8122-1e96fe0bade4" className="aipe-replay-cg-format-mode-icon"><FormatStyleIcon kind="play" /></span><div shuku-edit-id="e-f1a9144d-04b4-4320-8567-56a32d09ade5"><Typography shuku-edit-id="e-f38651cb-5b21-4d86-b13d-1cbb1962c68c" as="h2" variant="h3" tone="warning">智能讲稿模式</Typography><Typography shuku-edit-id="e-52d8b1b3-571e-4539-a856-a0b66769769b" variant="bodySmall" tone="muted">讲解与画面对应 · 视频扩展方向</Typography></div>{expandButton('script', '智能讲稿模式')}</header>
        <MiniWindow><div shuku-edit-id="e-ad3a7e61-02b3-45a8-8986-3aaffe94fb67" className="aipe-replay-cg-format-mini-top"><Typography shuku-edit-id="e-cdb6b995-c3d0-4673-a931-62595c65fc79" variant="bodySmall" tone="accent">{lesson.title}</Typography><Button active={playing} onClick={toggleNarration} disabled={!speechSupported} aria-label={!speechSupported ? '当前浏览器不支持语音播放' : playing ? '暂停语音讲解' : paused ? '继续语音讲解' : '播放语音讲解'}><Typography shuku-edit-id="e-93e3577e-1969-4d0e-a2fe-f9c3851c00b3" as="span" variant="bodySmall" tone="inherit">{!speechSupported ? '不支持语音' : speechError ? '重试讲解' : playing ? '暂停' : paused ? '继续' : '播放讲解'}</Typography></Button></div>
          <div shuku-edit-id="e-301b258b-6918-4027-889a-bfdb10d191f5" className="aipe-replay-cg-format-script-preview"><div shuku-edit-id="e-38e792d7-c2a6-4adf-81ff-94088e8566d3" className="aipe-replay-cg-format-annotated"><img shuku-edit-id="e-ea143a33-b5a2-495b-8550-fa1faf59cfda" src={lesson.image} alt={lesson.title}/>{explaining && <span shuku-edit-id="e-cbd49314-6e7e-47bb-8684-541249c90625" className="aipe-replay-cg-format-narration-highlight" style={{ left: `${lesson.steps[step].box[0]}%`, top: `${lesson.steps[step].box[1]}%`, width: `${lesson.steps[step].box[2]}%`, height: `${lesson.steps[step].box[3]}%` }} aria-hidden="true"/>}</div></div>
        </MiniWindow>
      </section>
    </div>
    <div shuku-edit-id="e-7e32554f-7342-4da1-b26b-4f9207cfaeed" className="aipe-replay-cg-format-bottom"><section shuku-edit-id="e-3679fe70-964c-4841-b460-cba5a64d5bc5" className="aipe-replay-cg-format-traditional"><Typography shuku-edit-id="e-1f96c13a-88c4-431f-886c-1802493f1cc0" as="h2" variant="h3" tone="muted">传统 PPT</Typography><Typography shuku-edit-id="e-e41bdb53-6b57-4b57-b226-b0fd0e0084a7" variant="bodySmall" tone="muted">主要服务课堂讲授</Typography></section><section shuku-edit-id="e-78506247-8d41-4105-9ebf-2d15f575e55e" className="aipe-replay-cg-format-advantages"><Typography shuku-edit-id="e-b4a46878-bc11-4c6c-8b16-6f04f88620be" as="h2" variant="h3" tone="accent">相比传统 PPT 的优势</Typography><div shuku-edit-id="e-583e68bb-82eb-47da-b9b2-cbdc6e49001a">{(['一次设计，多端复用', '既能讲课，也能自学', '操作与反馈帮助理解', '讲稿可用于视频制作']).map((text, index) => <div shuku-edit-id="e-76e035b1-cc17-4c2d-90e5-48a80722fff8" className={`aipe-replay-cg-format-benefit aipe-replay-cg-format-benefit-${index}`} key={text}><span shuku-edit-id="e-405706f8-d511-4ce8-8381-9cc3525fa9af" className="aipe-replay-cg-format-benefit-icon"><FormatStyleIcon kind={(['devices', 'book', 'light', 'video'] as const)[index]} /></span><Typography shuku-edit-id="e-9966d4f3-706f-4897-9394-4342d7cbf455" variant="bodySmall" tone="main">{text}</Typography></div>)}</div></section></div>
  </ContentBlock>;
}
