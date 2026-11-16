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
  return <svg shuku-edit-id="e-75a26442-bab9-44cb-8102-e2d7b0b5fd0c" viewBox="-4 -4 40 40" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path shuku-edit-id="e-b154caad-34fd-40da-b0a2-3374883e5053" d={paths[kind]} /></svg>;
}
function MiniWindow({ children }: { children: ReactNode }) {
  return <div shuku-edit-id="e-032e2135-fa4c-4fc7-a1d0-dd09951075cf" className="cg-format-window"><div shuku-edit-id="e-1a04a6b2-1dde-46d6-a14b-dd1b837f2c49" className="cg-format-mini">{children}</div></div>;
}
function ReadingPreview({ onClose }: { onClose: () => void }) {
  return <MiniWindow>
    <div shuku-edit-id="e-2bce4752-5e8b-4a69-9d05-d42632d679c8" className="cg-format-native-reader"><div shuku-edit-id="e-b3dab1f5-4c8e-45d8-b01b-48c2602adead" className="cg-format-native-content" data-embedded-lesson="true" role="region" aria-label="卷积入门原生自学流程，可手动操作与滚动" tabIndex={0} onClick={event => event.stopPropagation()} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); onClose(); } }}><NativeStudyPreview /></div></div>
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
    return <Button className="cg-format-expand" aria-label={`${expanded === mode ? '收起' : '放大'}${title}`} aria-expanded={expanded === mode} onClick={() => setExpanded(value => value === mode ? null : mode)}><Typography shuku-edit-id="e-82d7b594-d56e-44de-b3ba-34498447a993" as="span" variant="bodySmall" tone="inherit">{expanded === mode ? '收起' : '⤢'}</Typography></Button>;
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
  return <ContentBlock shuku-edit-id="e-15c89de6-5594-46bc-8021-eb0a385ddb88" ref={root} className="cg-format-page cg-creator-typography" headingLevel={1} title="一种全新的知识呈现形态" bodyClassName="cg-format-body" onKeyDown={event => { if (event.key === ' ' && event.target instanceof Element && event.target.closest('button')) event.stopPropagation(); }}>
    <div shuku-edit-id="e-b6e93e88-fbbd-477a-9cbe-61c86fadbd5a" className="cg-format-source-row"><svg shuku-edit-id="e-0e61c2b3-65f3-4a38-aa5b-0bb978819e9d" className="cg-format-source-links" viewBox="0 0 1536 112" aria-hidden="true"><path shuku-edit-id="e-3c002d9a-d399-4c4d-86e8-83cdbe415e57" d="M768 52C500 35 305 39 248 112M768 52v60M768 52c268-17 463-13 520 60" /></svg><div shuku-edit-id="e-29ee2195-cfdd-4bfa-aa08-2b27eb3dda47" className="cg-format-source"><span shuku-edit-id="e-6a1ad9f0-dc11-41e0-aff5-eca408450297" className="cg-format-source-icon"><FormatStyleIcon kind="code" /></span><div shuku-edit-id="e-cd636672-6c19-4020-8a1d-52f82edee3f1"><Typography shuku-edit-id="e-b53353a5-8157-45b0-8676-d8760194f51a" variant="h3" tone="accent">同一份内容</Typography><Typography shuku-edit-id="e-37ba0a2c-1045-42a3-b924-8583508b75a1" variant="bodySmall" tone="muted">HTML-based 交互式知识呈现</Typography></div></div><Typography shuku-edit-id="e-8b56c27f-c22a-4e67-b242-166e1caa4fe7" variant="bodySmall" tone="warning">一次设计，多种应用场景</Typography></div>
    <div shuku-edit-id="e-34936f31-1698-44a8-9368-ab67d63ebb6b" className={`cg-format-columns${expanded ? ' has-expanded' : ''}`}>
      {expanded && <button shuku-edit-id="e-a5b172d8-ad8f-4efb-8a2d-a62744ce91fb" type="button" className="cg-format-backdrop" aria-label="关闭放大预览" onClick={() => setExpanded(null)}/>}
      <section shuku-edit-id="e-0ef5700a-2e54-4507-9cc6-e0b6e00aaf45" className={`cg-format-card cg-format-teaching${expanded === 'teaching' ? ' cg-format-expanded' : ''}`} onClick={event => expandCard('teaching', event)}><header shuku-edit-id="e-46ea193c-ae6c-4f9a-a995-33da4eb6d2e4"><span shuku-edit-id="e-ca5bc9a4-5a4d-41d7-b660-4765d983387e" className="cg-format-mode-icon"><FormatStyleIcon kind="screen" /></span><div shuku-edit-id="e-8d1d7e8d-49e9-489f-801d-bf96252ca094"><Typography shuku-edit-id="e-3a8546be-129b-4914-8236-4a1210303e59" as="h2" variant="h3" tone="accent">教学展示模式</Typography><Typography shuku-edit-id="e-da49a749-168f-4e4e-9ce2-c15b22d1fec1" variant="bodySmall" tone="muted">面向课堂的组织化展示</Typography></div>{expandButton('teaching', '教学展示模式')}</header>
        <MiniWindow><div shuku-edit-id="e-ee629104-cfcb-4549-985c-c8900f47e3e7" className="cg-format-mini-top"><Typography shuku-edit-id="e-3c45a4b3-053f-47ae-b8c5-9aa0f8c258d3" variant="bodySmall" tone="accent">教学知识呈现作品 · 卷积入门</Typography><Typography shuku-edit-id="e-aa00d33f-7429-4078-8203-bdd4d705d3f5" variant="bodySmall" tone="muted">{selected + 1} / 4</Typography></div>
          <div shuku-edit-id="e-3935f119-64eb-4114-9f93-892a21a16902" className="cg-format-teaching-preview"><nav shuku-edit-id="e-df9933e9-d5d4-45b3-abaf-80888373dc16" className="cg-format-slide-list" aria-label="选择预览知识呈现作品">{lessons.map((item, index) => <Button key={item.title} active={selected === index} onClick={() => select(index)} aria-label={`展示第${index + 1}页：${item.title}`} aria-pressed={selected === index}><img shuku-edit-id="e-89291f3b-b36f-41e5-93b6-e444b9f6e5ef" src={item.image} alt={item.title} /></Button>)}</nav><div shuku-edit-id="e-7ebc91ce-a5ff-48f7-84f1-1e8486d153bf" className="cg-format-main-preview"><img shuku-edit-id="e-105bc7f6-d0de-41a7-a15b-8bf0fc23651d" src={lesson.image} alt={lesson.title} /><Typography shuku-edit-id="e-847264e6-865b-4854-82be-bdc0432633f5" variant="bodySmall" tone="accent">{lesson.title}</Typography></div></div>
          <div shuku-edit-id="e-f757a57c-f667-4ea1-9c42-c8a6ae14bc09" className="cg-format-mini-footer"><Button onClick={() => select((selected + 3) % 4)} aria-label="预览上一页"><Typography shuku-edit-id="e-0641db23-2812-4791-a7d2-d63cff1a7214" as="span" variant="bodySmall" tone="inherit">上一页</Typography></Button><Typography shuku-edit-id="e-85da147b-b5e9-4976-ac4e-f0563ff4a19c" variant="bodySmall" tone="muted">点选缩略图，切换课堂页面</Typography><Button onClick={() => select((selected + 1) % 4)} aria-label="预览下一页"><Typography shuku-edit-id="e-4f621950-8ba4-4dc7-bf05-d75f4d44d6b9" as="span" variant="bodySmall" tone="inherit">下一页</Typography></Button></div>
        </MiniWindow>
      </section>
      <section shuku-edit-id="e-609d41c8-ed78-4cbb-861a-d59ca429c39c" className={`cg-format-card cg-format-self${expanded === 'self' ? ' cg-format-expanded' : ''}`} onClick={event => expandCard('self', event)}><header shuku-edit-id="e-d393b440-97f4-43be-8164-e11dbe058d3e"><span shuku-edit-id="e-c0c2e7f6-6270-446f-85e6-2a780ea14bf5" className="cg-format-mode-icon"><FormatStyleIcon kind="person" /></span><div shuku-edit-id="e-72c68c7f-a595-44c6-83c2-5714fbc5fe4d"><Typography shuku-edit-id="e-a0356af2-b906-4daa-9788-843f684b4842" as="h2" variant="h3" tone="success">自学交互模式</Typography><Typography shuku-edit-id="e-514a5cce-5535-4c8d-b0ab-dacd7417bf34" variant="bodySmall" tone="muted">完成当前体验，逐步解锁后续内容</Typography></div>{expandButton('self', '自学交互模式')}</header><ReadingPreview onClose={() => setExpanded(null)} /></section>
      <section shuku-edit-id="e-e20213a2-3916-457d-bb13-88e0a50823ea" className={`cg-format-card cg-format-script${expanded === 'script' ? ' cg-format-expanded' : ''}`} onClick={event => expandCard('script', event)}><header shuku-edit-id="e-ea9e2cf5-6953-4ff0-a03e-65f1b65c4be4"><span shuku-edit-id="e-61ee4ee0-8a49-4b98-ab33-0311518c7857" className="cg-format-mode-icon"><FormatStyleIcon kind="play" /></span><div shuku-edit-id="e-857fa9f0-6554-4e61-ab56-7be11454ea38"><Typography shuku-edit-id="e-b5bcc50e-79f5-4b19-9d4e-8dfe23deaae8" as="h2" variant="h3" tone="warning">智能讲稿模式</Typography><Typography shuku-edit-id="e-4b7f4141-6906-468e-bd29-67a88319b91f" variant="bodySmall" tone="muted">讲解与画面对应 · 视频扩展方向</Typography></div>{expandButton('script', '智能讲稿模式')}</header>
        <MiniWindow><div shuku-edit-id="e-dacebd85-7bb9-47d7-9305-199d926c828a" className="cg-format-mini-top"><Typography shuku-edit-id="e-50e963b1-8a84-4d4e-908a-47f53c2032da" variant="bodySmall" tone="accent">{lesson.title}</Typography><Button active={playing} onClick={toggleNarration} disabled={!speechSupported} aria-label={!speechSupported ? '当前浏览器不支持语音播放' : playing ? '暂停语音讲解' : paused ? '继续语音讲解' : '播放语音讲解'}><Typography shuku-edit-id="e-cad3492c-43a0-4e41-a5f7-998ee1fef823" as="span" variant="bodySmall" tone="inherit">{!speechSupported ? '不支持语音' : speechError ? '重试讲解' : playing ? '暂停' : paused ? '继续' : '播放讲解'}</Typography></Button></div>
          <div shuku-edit-id="e-69b6e1c8-e982-4ccf-b76d-f34a6ec9c5cf" className="cg-format-script-preview"><div shuku-edit-id="e-ea0fffd9-d293-4e1d-b2c2-6fd99537ddad" className="cg-format-annotated"><img shuku-edit-id="e-a0b06d05-002a-481e-a1d2-2e801cfe20f4" src={lesson.image} alt={lesson.title}/>{explaining && <span shuku-edit-id="e-d6482bb2-76aa-42cf-924d-3e6e69426289" className="cg-format-narration-highlight" style={{ left: `${lesson.steps[step].box[0]}%`, top: `${lesson.steps[step].box[1]}%`, width: `${lesson.steps[step].box[2]}%`, height: `${lesson.steps[step].box[3]}%` }} aria-hidden="true"/>}</div></div>
        </MiniWindow>
      </section>
    </div>
    <div shuku-edit-id="e-67eaa9ae-4b8d-4b8f-b901-a6ebf8835645" className="cg-format-bottom"><section shuku-edit-id="e-029240b2-12a7-4830-923f-8dd18ce04982" className="cg-format-traditional"><Typography shuku-edit-id="e-1ed565ad-79e9-43b3-975c-dc34e421aecf" as="h2" variant="h3" tone="muted">传统 PPT</Typography><Typography shuku-edit-id="e-9d1278eb-b2a0-4e99-8ef3-cd8a1df7321f" variant="bodySmall" tone="muted">主要服务课堂讲授</Typography></section><section shuku-edit-id="e-d9ac5292-c7d3-4a50-9497-291f48f86c6c" className="cg-format-advantages"><Typography shuku-edit-id="e-e05cc4c6-986c-41f2-b643-5bf3af498716" as="h2" variant="h3" tone="accent">相比传统 PPT 的优势</Typography><div shuku-edit-id="e-af746d33-6355-4907-9df0-f746e3b460b8">{(['一次设计，多端复用', '既能讲课，也能自学', '操作与反馈帮助理解', '讲稿可用于视频制作']).map((text, index) => <div shuku-edit-id="e-b1fab3b6-e3a9-4bda-96d8-2d2fd6b0e5f7" className={`cg-format-benefit cg-format-benefit-${index}`} key={text}><span shuku-edit-id="e-5a3f6832-ae81-4dcf-9fce-c571e9286d52" className="cg-format-benefit-icon"><FormatStyleIcon kind={(['devices', 'book', 'light', 'video'] as const)[index]} /></span><Typography shuku-edit-id="e-b965fd5b-b1d7-41b6-b5bc-4b3a12eecf96" variant="bodySmall" tone="main">{text}</Typography></div>)}</div></section></div>
  </ContentBlock>;
}
