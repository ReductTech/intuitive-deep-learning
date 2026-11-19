import gomoku_playAsset0 from "../assets/images/multi-format/convolution/gomoku-play.webp";
import board_as_numbersAsset1 from "../assets/images/multi-format/convolution/board-as-numbers.webp";
import window_scanAsset2 from "../assets/images/multi-format/convolution/window-scan.webp";
import kernel_designAsset3 from "../assets/images/multi-format/convolution/kernel-design.webp";
import { useEffect, useRef, useState, type ReactNode, type MouseEvent } from 'react';
import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
import { NativeStudyPreview } from '../components/NativeStudyPreview';
import './MultiFormatPage.css';

const lessons = [
  { title: '从五子棋开始认识卷积核', image: gomoku_playAsset0, steps: [
    { title: '先下一局', text: '先与 AI 下一局五子棋，从熟悉的棋盘和局部棋形开始。', box: [1, 3, 25, 90] },
    { title: '观察棋形', text: '棋盘上的黑白棋子形成局部形状，后面会把它们转成数字来寻找连线。', box: [27, 4, 50, 92] },
    { title: '完成对局', text: '完成一局，或查看示例棋局后，解锁下一步的数字编码。', box: [78, 60, 20, 36] },
  ] },
  { title: '棋盘局部区域的数值表示', image: board_as_numbersAsset1, steps: [
    { title: '局部取样', text: '从上一局棋中取出一个局部区域，将棋子和数字对应起来。', box: [3, 26, 32, 65] },
    { title: '数字编码', text: '目标棋子记为一，对手棋子记为负一，空位记为零。', box: [38, 28, 28, 62] },
    { title: '位置对应', text: '数字矩阵保留棋盘的位置关系。将指针移到数字上，可以查看对应的棋盘位置。', box: [68, 26, 29, 65] },
  ] },
  { title: '棋形的局部匹配', image: window_scanAsset2, steps: [
    { title: '移动窗口', text: '让一个五乘五的窗口在数字棋盘上移动，观察它当前框住的局部区域。', box: [3, 17, 48, 76] },
    { title: '逐项对应', text: '将窗口内的数字与目标模板一一对应，计算当前位置的匹配得分。', box: [54, 20, 43, 40] },
    { title: '找到棋形', text: '拖动窗口找到最匹配的位置后，课程解锁下一步的模板设计。', box: [54, 62, 43, 32] },
  ] },
  { title: '根据棋形调整模板', image: kernel_designAsset3, steps: [
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
  return <svg shuku-edit-id="e-b4347c33-6812-4e4f-98f9-d2336f8fe545" viewBox="-4 -4 40 40" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path shuku-edit-id="e-422035f8-1569-48cf-9303-8a66039e26d1" d={paths[kind]} /></svg>;
}
function MiniWindow({ children }: { children: ReactNode }) {
  return <div shuku-edit-id="e-42cbfdc0-fb93-4b88-828d-ee1f88398815" className="cg-format-window"><div shuku-edit-id="e-ae098db8-e962-499b-a8ae-ec73e3397d80" className="cg-format-mini">{children}</div></div>;
}
function ReadingPreview({ onClose }: { onClose: () => void }) {
  return <MiniWindow>
    <div shuku-edit-id="e-e5021edb-a8a3-4c98-ba2d-b16419bf57a3" className="cg-format-native-reader" data-ppt-viewport="Scaled scrollable lesson preview"><div shuku-edit-id="e-da6e7a3e-0e6b-465a-8f44-740db3a5b32d" className="cg-format-native-content" data-ppt-viewport="Scrollable unlocked lesson steps" data-embedded-lesson="true" role="region" aria-label="卷积入门自学流程，可上下滚动并逐步解锁" tabIndex={0} onClick={event => event.stopPropagation()} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); onClose(); } }}><NativeStudyPreview /></div></div>
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
    return <Button className="cg-format-expand" aria-label={`${expanded === mode ? '收起' : '放大'}${title}`} aria-expanded={expanded === mode} onClick={() => setExpanded(value => value === mode ? null : mode)}><Typography shuku-edit-id="e-65961aab-fa36-4504-ad19-6ecbbc06811a" as="span" variant="bodySmall" tone="inherit">{expanded === mode ? '收起' : '⤢'}</Typography></Button>;
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
  return <ContentBlock shuku-edit-id="e-a88d5fd9-f16a-41e3-a359-948ee45767dc" ref={root} className="cg-format-page cg-creator-typography" headingLevel={1} title="同一份知识内容，适配多种教学与学习场景" bodyClassName="cg-format-body" onKeyDown={event => { if (event.key === ' ' && event.target instanceof Element && event.target.closest('button')) event.stopPropagation(); }}>
    <div shuku-edit-id="e-98446bdd-e382-46bd-b855-8985374ee28e" className="cg-format-source-row"><svg shuku-edit-id="e-53e9e684-12f9-4d2a-9144-db0a0347c924" className="cg-format-source-links" viewBox="0 0 1536 112" aria-hidden="true"><path shuku-edit-id="e-e09e7b6c-7e22-40b2-9ad1-6f828fc6ce23" d="M768 52C500 35 305 39 248 112M768 52v60M768 52c268-17 463-13 520 60" /></svg><div shuku-edit-id="e-fb64df55-313c-4a6a-a680-cc86e5ab9088" className="cg-format-source"><span shuku-edit-id="e-2d0a304d-7232-4d9a-88dd-7824fdc90dc2" className="cg-format-source-icon"><FormatStyleIcon kind="code" /></span><div shuku-edit-id="e-446ecb50-2bd8-4dea-ae78-e56f783fe4d3"><Typography shuku-edit-id="e-f9a8aab9-3e61-462a-9611-a170b9fa9b2b" variant="h3" tone="accent">同一份内容</Typography><Typography shuku-edit-id="e-3eb89106-e874-4865-bbb7-ab05f6290ebc" variant="bodySmall" tone="muted">HTML-based 交互式知识呈现</Typography></div></div><Typography shuku-edit-id="e-b387b955-1de9-4f7d-bdbc-f5ac7ec87f53" variant="bodySmall" tone="warning">一次设计，多种应用场景</Typography></div>
    <div shuku-edit-id="e-d776119c-7329-487f-a438-96c8990622ae" className={`cg-format-columns${expanded ? ' has-expanded' : ''}`}>
      {expanded && <button shuku-edit-id="e-678f7d27-d443-48f9-8316-97d88dc495ab" type="button" className="cg-format-backdrop" aria-label="关闭放大预览" onClick={() => setExpanded(null)}/>}
      <section shuku-edit-id="e-fe301355-4321-4e5c-90c7-66f2742b60dd" className={`cg-format-card cg-format-teaching${expanded === 'teaching' ? ' cg-format-expanded' : ''}`} onClick={event => expandCard('teaching', event)}><header shuku-edit-id="e-2d81e7fc-c3b9-43da-aba0-c907a9914866"><span shuku-edit-id="e-0daebc83-6192-4f91-b353-b27e89b0afe2" className="cg-format-mode-icon"><FormatStyleIcon kind="screen" /></span><div shuku-edit-id="e-7dc2bc49-f138-4e64-886d-e575a6147019"><Typography shuku-edit-id="e-3229e979-a26d-474e-abfe-f9e7543c08e2" as="h2" variant="h3" tone="accent">教学展示模式</Typography><Typography shuku-edit-id="e-4dd0611c-6299-4721-ae75-007eaa963fc3" variant="bodySmall" tone="muted">面向课堂的组织化展示</Typography></div>{expandButton('teaching', '教学展示模式')}</header>
        <MiniWindow><div shuku-edit-id="e-45c1b796-c002-4ef1-b888-6ac08e208f3b" className="cg-format-mini-top"><Typography shuku-edit-id="e-a546fc29-1b3b-4722-a281-e29af9ce3dfe" variant="bodySmall" tone="accent">教学知识呈现作品 · 卷积入门</Typography><Typography shuku-edit-id="e-a079b48f-4626-4106-afe6-c94931bc9270" variant="bodySmall" tone="muted">{selected + 1} / 4</Typography></div>
          <div shuku-edit-id="e-01f416f0-e616-4ee6-81c1-8a29dd34bfd7" className="cg-format-teaching-preview"><nav shuku-edit-id="e-0caf460e-82b5-44ae-ba31-0b46aad59d03" className="cg-format-slide-list" aria-label="选择预览知识呈现作品">{lessons.map((item, index) => <Button key={item.title} active={selected === index} onClick={() => select(index)} aria-label={`展示第${index + 1}页：${item.title}`} aria-pressed={selected === index}><img shuku-edit-id="e-4ac8056b-14f8-4359-bb5b-523a396f9fde" src={item.image} alt={item.title} /></Button>)}</nav><div shuku-edit-id="e-014c2706-61d4-4e7f-b64d-778d50b8cdd9" className="cg-format-main-preview"><img shuku-edit-id="e-bc9a569e-a94b-46a5-8264-4b756847dfe1" src={lesson.image} alt={lesson.title} /><Typography shuku-edit-id="e-a32dd450-608d-417b-a208-0902535ec484" variant="bodySmall" tone="accent">{lesson.title}</Typography></div></div>
          <div shuku-edit-id="e-1e48c737-dd14-449d-9210-62a3ad594d4a" className="cg-format-mini-footer"><Button onClick={() => select((selected + 3) % 4)} aria-label="预览上一页"><Typography shuku-edit-id="e-61406435-3684-43bb-a276-09b7486f6c80" as="span" variant="bodySmall" tone="inherit">上一页</Typography></Button><Typography shuku-edit-id="e-a05be57f-f633-43eb-9799-f39760afe9c2" variant="bodySmall" tone="muted">点选缩略图，切换课堂页面</Typography><Button onClick={() => select((selected + 1) % 4)} aria-label="预览下一页"><Typography shuku-edit-id="e-6c60fbc6-bfa4-4cc3-996c-dcda4bf618f6" as="span" variant="bodySmall" tone="inherit">下一页</Typography></Button></div>
        </MiniWindow>
      </section>
      <section shuku-edit-id="e-61f05637-149d-4ffd-b31b-a28767705579" className={`cg-format-card cg-format-self${expanded === 'self' ? ' cg-format-expanded' : ''}`} onClick={event => expandCard('self', event)}><header shuku-edit-id="e-d8f965ba-20c1-45ff-b135-2eba23b55248"><span shuku-edit-id="e-1ad09b01-4575-4588-95b0-e0f52aa1f4e2" className="cg-format-mode-icon"><FormatStyleIcon kind="person" /></span><div shuku-edit-id="e-3124f48f-e514-4a7b-a671-26ef573c5f2c"><Typography shuku-edit-id="e-b36948bc-5734-48d5-be5d-ece0ad163661" as="h2" variant="h3" tone="success">自学交互模式</Typography><Typography shuku-edit-id="e-3e360c8a-8ec1-44a8-acb4-44ba14964ca7" variant="bodySmall" tone="muted">完成当前体验，逐步解锁后续内容</Typography></div>{expandButton('self', '自学交互模式')}</header><ReadingPreview onClose={() => setExpanded(null)} /></section>
      <section shuku-edit-id="e-7d9a43c0-2edb-48ce-99cf-9c6792c4abc5" className={`cg-format-card cg-format-script${expanded === 'script' ? ' cg-format-expanded' : ''}`} onClick={event => expandCard('script', event)}><header shuku-edit-id="e-dddb5330-a1bf-44de-9886-a213b40faf09"><span shuku-edit-id="e-e72fda75-26b7-4bf7-9d17-a2cfabcbc7fb" className="cg-format-mode-icon"><FormatStyleIcon kind="play" /></span><div shuku-edit-id="e-59a61516-98c5-4900-af73-2f700c5a2510"><Typography shuku-edit-id="e-77413b8e-ac97-4c45-8872-9786b2ba8517" as="h2" variant="h3" tone="warning">智能讲稿模式</Typography><Typography shuku-edit-id="e-16c5ddfe-cd06-43a1-a892-7c63ea49ca0f" variant="bodySmall" tone="muted">讲解与画面对应 · 视频扩展方向</Typography></div>{expandButton('script', '智能讲稿模式')}</header>
        <MiniWindow><div shuku-edit-id="e-e4495bca-ac08-4689-b405-26f34b13149e" className="cg-format-mini-top"><Typography shuku-edit-id="e-b8ce6208-98a9-4f36-a16d-67c1fc9d713c" variant="bodySmall" tone="accent">{lesson.title}</Typography><Button active={playing} onClick={toggleNarration} disabled={!speechSupported} aria-label={!speechSupported ? '当前浏览器不支持语音播放' : playing ? '暂停语音讲解' : paused ? '继续语音讲解' : '播放语音讲解'}><Typography shuku-edit-id="e-4fd66a13-17e8-400b-8c99-b35ae2b9e369" as="span" variant="bodySmall" tone="inherit">{!speechSupported ? '不支持语音' : speechError ? '重试讲解' : playing ? '暂停' : paused ? '继续' : '播放讲解'}</Typography></Button></div>
          <div shuku-edit-id="e-018cc20f-75c3-4c7b-8669-47a2d511a718" className="cg-format-script-preview"><div shuku-edit-id="e-672963bc-8b4f-4b0c-9b93-6ac12ccf1870" className="cg-format-annotated"><img shuku-edit-id="e-0ee4e507-1f31-4165-a6a0-2900ae5051be" src={lesson.image} alt={lesson.title}/>{explaining && <span shuku-edit-id="e-7ef70b1c-4fa0-4ec0-b4a9-19716ca9e041" className="cg-format-narration-highlight" style={{ left: `${lesson.steps[step].box[0]}%`, top: `${lesson.steps[step].box[1]}%`, width: `${lesson.steps[step].box[2]}%`, height: `${lesson.steps[step].box[3]}%` }} aria-hidden="true"/>}</div></div>
        </MiniWindow>
      </section>
    </div>
    <div shuku-edit-id="e-5bef689d-0621-4372-ade9-828c736c6940" className="cg-format-bottom"><section shuku-edit-id="e-9d0c0165-74c0-4870-a62e-aef4cae55ae4" className="cg-format-traditional"><Typography shuku-edit-id="e-c14ffdc2-3507-4a21-a25a-4227389c8241" as="h2" variant="h3" tone="muted">传统 PPT</Typography><Typography shuku-edit-id="e-633fce8e-d532-405f-94fe-4ff3878350ef" variant="bodySmall" tone="muted">主要服务课堂讲授</Typography></section><section shuku-edit-id="e-7bc21b6e-7489-4909-9d6f-4abad9fabe09" className="cg-format-advantages"><Typography shuku-edit-id="e-67403cb5-b594-4aa4-a271-f8aaf3f2c15f" as="h2" variant="h3" tone="accent">相比传统 PPT 的优势</Typography><div shuku-edit-id="e-c95147c5-8487-49ea-bfbf-91285868a493">{(['一次设计，多端复用', '既能讲课，也能自学', '操作与反馈帮助理解', '讲稿可用于视频制作']).map((text, index) => <div shuku-edit-id="e-1d036a24-265c-4b0b-8685-b9481b29040a" className={`cg-format-benefit cg-format-benefit-${index}`} key={text}><span shuku-edit-id="e-9c538126-8ca5-49d6-8890-1587dffe6833" className="cg-format-benefit-icon"><FormatStyleIcon kind={(['devices', 'book', 'light', 'video'] as const)[index]} /></span><Typography shuku-edit-id="e-00aade32-9436-441e-a8ba-26563e006f31" variant="bodySmall" tone="main">{text}</Typography></div>)}</div></section></div>
  </ContentBlock>;
}
