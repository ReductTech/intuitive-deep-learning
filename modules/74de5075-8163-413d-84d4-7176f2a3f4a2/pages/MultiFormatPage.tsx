import moduleAssetOutline from '../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { useEffect, useRef, useState, type ReactNode, type MouseEvent } from 'react';
import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
import { NativeStudyPreview } from '../components/NativeStudyPreview';
import './MultiFormatPage.css';

const lessonImage = (id: string) => moduleAssetUrl(`images/multi-format/convolution/${id}.jpg`);
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
  return <svg shuku-edit-id="e-20207036-11bc-40ff-b14b-da6a37882b66" viewBox="-4 -4 40 40" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path shuku-edit-id="e-64d2f131-375b-4111-b2e5-8b9dc408d91e" d={paths[kind]} /></svg>;
}
function MiniWindow({ children }: { children: ReactNode }) {
  return <div shuku-edit-id="e-067531f0-27ac-49a9-8fef-c9d2ebed8871" className="cg-format-window"><div shuku-edit-id="e-387e72d8-645a-4517-91b1-ca4a39cf90b4" className="cg-format-mini">{children}</div></div>;
}
function ReadingPreview({ onClose }: { onClose: () => void }) {
  return <MiniWindow>
    <div shuku-edit-id="e-3d1a6f38-6e74-46e7-86a8-4a8fe330c0e2" className="cg-format-native-reader"><div shuku-edit-id="e-035915e3-aca9-43d4-a86a-113fbc14ca3a" className="cg-format-native-content" data-embedded-lesson="true" role="region" aria-label="卷积入门原生自学流程，可手动操作与滚动" tabIndex={0} onClick={event => event.stopPropagation()} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); onClose(); } }}><NativeStudyPreview /></div></div>
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
    return <Button className="cg-format-expand" aria-label={`${expanded === mode ? '收起' : '放大'}${title}`} aria-expanded={expanded === mode} onClick={() => setExpanded(value => value === mode ? null : mode)}><Typography shuku-edit-id="e-ea58c0bb-9751-4512-8a34-b68a2f80fcec" as="span" variant="bodySmall" tone="inherit">{expanded === mode ? '收起' : '⤢'}</Typography></Button>;
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
  return <ContentBlock shuku-edit-id="e-f81e5a90-2239-4c77-a8f6-1ffe1a9fe7dd" ref={root} className="cg-format-page cg-creator-typography" headingLevel={1} title="一种全新的知识呈现形态" bodyClassName="cg-format-body" onKeyDown={event => { if (event.key === ' ' && event.target instanceof Element && event.target.closest('button')) event.stopPropagation(); }}>
    <div shuku-edit-id="e-ecd95095-f2d4-40e4-b5de-5626544ce46f" className="cg-format-source-row"><svg shuku-edit-id="e-992fa4d3-22f2-4340-bfe3-9ebaf0df4797" className="cg-format-source-links" viewBox="0 0 1536 112" aria-hidden="true"><path shuku-edit-id="e-cc83dddd-8677-4aca-bac5-d5fa7f13586f" d="M768 52C500 35 305 39 248 112M768 52v60M768 52c268-17 463-13 520 60" /></svg><div shuku-edit-id="e-9eda3011-1dd4-4d6e-bd31-9124f5a9e971" className="cg-format-source"><span shuku-edit-id="e-44b063e7-3c5f-42e3-9440-c014db33f527" className="cg-format-source-icon"><FormatStyleIcon kind="code" /></span><div shuku-edit-id="e-a873b17a-d4f5-44b2-893b-a5a7ac0f5af6"><Typography shuku-edit-id="e-3592b707-827f-4602-94a1-50f4b930dc8c" variant="h3" tone="accent">同一份内容</Typography><Typography shuku-edit-id="e-e862e5ec-5cf1-4c60-9167-70a3d8344cf2" variant="bodySmall" tone="muted">HTML-based 交互式知识呈现</Typography></div></div><Typography shuku-edit-id="e-ffca2723-0f9a-43f3-900b-ecbe5222901a" variant="bodySmall" tone="warning">一次设计，多种应用场景</Typography></div>
    <div shuku-edit-id="e-f936985b-7698-4226-aa0d-41d3bb77253e" className={`cg-format-columns${expanded ? ' has-expanded' : ''}`}>
      {expanded && <button shuku-edit-id="e-e7ede7ef-a0cf-44c0-9c0f-00b6fa8c785b" type="button" className="cg-format-backdrop" aria-label="关闭放大预览" onClick={() => setExpanded(null)}/>}
      <section shuku-edit-id="e-76c225de-0867-421b-94d8-8929220bc783" className={`cg-format-card cg-format-teaching${expanded === 'teaching' ? ' cg-format-expanded' : ''}`} onClick={event => expandCard('teaching', event)}><header shuku-edit-id="e-beea3d1a-2fe3-4fe5-b064-af82dfc3e67a"><span shuku-edit-id="e-533e0616-583c-48a0-b7b8-f37a22b7be43" className="cg-format-mode-icon"><FormatStyleIcon kind="screen" /></span><div shuku-edit-id="e-27008362-526c-422c-83bd-7b6e533b8f21"><Typography shuku-edit-id="e-22a0da9d-b190-4c33-b598-79a42888e859" as="h2" variant="h3" tone="accent">教学展示模式</Typography><Typography shuku-edit-id="e-74d87309-4110-4594-8662-aa0c54e50f54" variant="bodySmall" tone="muted">面向课堂的组织化展示</Typography></div>{expandButton('teaching', '教学展示模式')}</header>
        <MiniWindow><div shuku-edit-id="e-d4696208-01e6-47a7-a9f4-ac2aa47bca2c" className="cg-format-mini-top"><Typography shuku-edit-id="e-88fa9f46-4712-49e3-982a-05596fc48794" variant="bodySmall" tone="accent">教学知识呈现作品 · 卷积入门</Typography><Typography shuku-edit-id="e-4803064e-bfe9-4b9b-8436-37dd8d3e3357" variant="bodySmall" tone="muted">{selected + 1} / 4</Typography></div>
          <div shuku-edit-id="e-567856e8-12d8-40c4-b1be-7dca864735f0" className="cg-format-teaching-preview"><nav shuku-edit-id="e-6d3c002f-d954-42c9-a1fa-c6360210d747" className="cg-format-slide-list" aria-label="选择预览知识呈现作品">{lessons.map((item, index) => <Button key={item.title} active={selected === index} onClick={() => select(index)} aria-label={`展示第${index + 1}页：${item.title}`} aria-pressed={selected === index}><img shuku-edit-id="e-2387a3aa-863a-4ffa-98ef-6f429bec9a1e" src={item.image} alt={item.title} /></Button>)}</nav><div shuku-edit-id="e-d487bbf3-1593-416a-ab26-de790ddb584e" className="cg-format-main-preview"><img shuku-edit-id="e-8ab31042-e8fd-48c9-9da1-02342fe1d3ba" src={lesson.image} alt={lesson.title} /><Typography shuku-edit-id="e-66c4e9d5-ca5b-4922-b4a7-0eb6358a1b48" variant="bodySmall" tone="accent">{lesson.title}</Typography></div></div>
          <div shuku-edit-id="e-59df25ac-8a7c-42e9-b2c3-a19f3c676fff" className="cg-format-mini-footer"><Button onClick={() => select((selected + 3) % 4)} aria-label="预览上一页"><Typography shuku-edit-id="e-031deffc-c9db-4b84-912d-836e535eaac8" as="span" variant="bodySmall" tone="inherit">上一页</Typography></Button><Typography shuku-edit-id="e-015e06fe-78df-4765-b50f-c1c9f02a04b6" variant="bodySmall" tone="muted">点选缩略图，切换课堂页面</Typography><Button onClick={() => select((selected + 1) % 4)} aria-label="预览下一页"><Typography shuku-edit-id="e-8dabc713-481a-4f83-a5dc-dd46805a3519" as="span" variant="bodySmall" tone="inherit">下一页</Typography></Button></div>
        </MiniWindow>
      </section>
      <section shuku-edit-id="e-f6b48866-160e-4eca-9704-17bb5a92b810" className={`cg-format-card cg-format-self${expanded === 'self' ? ' cg-format-expanded' : ''}`} onClick={event => expandCard('self', event)}><header shuku-edit-id="e-7a5f3620-d645-4aa0-8819-1b6b500801f7"><span shuku-edit-id="e-a1074d46-c645-42a3-bf0f-6c25e37100d3" className="cg-format-mode-icon"><FormatStyleIcon kind="person" /></span><div shuku-edit-id="e-c6d8f422-9834-42c7-aef5-387f54fa9919"><Typography shuku-edit-id="e-80897f60-91bc-4f3c-9328-574d3f307016" as="h2" variant="h3" tone="success">自学交互模式</Typography><Typography shuku-edit-id="e-d630d479-effa-4f9d-93e4-734aa81a0f3d" variant="bodySmall" tone="muted">完成当前体验，逐步解锁后续内容</Typography></div>{expandButton('self', '自学交互模式')}</header><ReadingPreview onClose={() => setExpanded(null)} /></section>
      <section shuku-edit-id="e-8b588883-dff3-4ff6-b109-075725d0b287" className={`cg-format-card cg-format-script${expanded === 'script' ? ' cg-format-expanded' : ''}`} onClick={event => expandCard('script', event)}><header shuku-edit-id="e-5e215fca-4c06-4542-b404-9135f3a03c21"><span shuku-edit-id="e-af89215e-1bf8-4c7e-b552-c63008421be8" className="cg-format-mode-icon"><FormatStyleIcon kind="play" /></span><div shuku-edit-id="e-f761be96-6559-475e-82a9-00ee48bc0dad"><Typography shuku-edit-id="e-0ea8a76e-6ca4-4d39-9142-6e52361a0a9b" as="h2" variant="h3" tone="warning">智能讲稿模式</Typography><Typography shuku-edit-id="e-476c5fd0-75b5-4036-aadc-afde7cfa604b" variant="bodySmall" tone="muted">讲解与画面对应 · 视频扩展方向</Typography></div>{expandButton('script', '智能讲稿模式')}</header>
        <MiniWindow><div shuku-edit-id="e-bbf75d19-e129-4450-93d7-72c1c14e2af7" className="cg-format-mini-top"><Typography shuku-edit-id="e-6eaf3135-1943-4cb7-b6af-c97ebd8725a7" variant="bodySmall" tone="accent">{lesson.title}</Typography><Button active={playing} onClick={toggleNarration} disabled={!speechSupported} aria-label={!speechSupported ? '当前浏览器不支持语音播放' : playing ? '暂停语音讲解' : paused ? '继续语音讲解' : '播放语音讲解'}><Typography shuku-edit-id="e-498deb62-17b5-44e8-91e0-d0a52e2a8b56" as="span" variant="bodySmall" tone="inherit">{!speechSupported ? '不支持语音' : speechError ? '重试讲解' : playing ? '暂停' : paused ? '继续' : '播放讲解'}</Typography></Button></div>
          <div shuku-edit-id="e-ee3d143e-4d63-4d00-960f-cea8faad5391" className="cg-format-script-preview"><div shuku-edit-id="e-e55d4d50-f7cf-4055-bbda-09ae77963ac6" className="cg-format-annotated"><img shuku-edit-id="e-a3a71a6c-7b32-4143-a779-581273ceb51e" src={lesson.image} alt={lesson.title}/>{explaining && <span shuku-edit-id="e-0feeefca-c7f8-4e72-b231-91878159814a" className="cg-format-narration-highlight" style={{ left: `${lesson.steps[step].box[0]}%`, top: `${lesson.steps[step].box[1]}%`, width: `${lesson.steps[step].box[2]}%`, height: `${lesson.steps[step].box[3]}%` }} aria-hidden="true"/>}</div></div>
        </MiniWindow>
      </section>
    </div>
    <div shuku-edit-id="e-f83ca7b0-ab9a-46b4-9352-b11bbdf9c310" className="cg-format-bottom"><section shuku-edit-id="e-3a26f639-5fdb-40a7-b09a-cbee2c28e4d9" className="cg-format-traditional"><Typography shuku-edit-id="e-4f32c4c6-5f9f-4a90-aaaa-32ec5bf9a6d5" as="h2" variant="h3" tone="muted">传统 PPT</Typography><Typography shuku-edit-id="e-42649e05-7e33-445d-9f07-8e75071ec888" variant="bodySmall" tone="muted">主要服务课堂讲授</Typography></section><section shuku-edit-id="e-f8fb596b-cda5-46fc-8bdd-5603b68365d1" className="cg-format-advantages"><Typography shuku-edit-id="e-5e4ba735-1f94-4407-b5f4-e701877e67cf" as="h2" variant="h3" tone="accent">相比传统 PPT 的优势</Typography><div shuku-edit-id="e-c2515d69-17f8-49b6-9a25-9738dbe4d931">{(['一次设计，多端复用', '既能讲课，也能自学', '操作与反馈帮助理解', '讲稿可用于视频制作']).map((text, index) => <div shuku-edit-id="e-319b2a81-7e5a-4e0b-9236-96f36d0ba201" className={`cg-format-benefit cg-format-benefit-${index}`} key={text}><span shuku-edit-id="e-75b64a37-30d2-4623-abc6-1082cf667ce3" className="cg-format-benefit-icon"><FormatStyleIcon kind={(['devices', 'book', 'light', 'video'] as const)[index]} /></span><Typography shuku-edit-id="e-14af7629-b469-4b03-a3ba-35d2e93a24c2" variant="bodySmall" tone="main">{text}</Typography></div>)}</div></section></div>
  </ContentBlock>;
}
