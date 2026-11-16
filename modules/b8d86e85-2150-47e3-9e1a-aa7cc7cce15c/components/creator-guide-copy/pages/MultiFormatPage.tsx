import { creatorGuideAssetUrl } from '../creatorGuideAssets';
import moduleAssetOutline from '../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { useEffect, useRef, useState, type ReactNode, type MouseEvent } from 'react';
import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
import { NativeStudyPreview } from '../components/NativeStudyPreview';
import './MultiFormatPage.css';

const lessonImage = (id: string) => creatorGuideAssetUrl(moduleAssetOutline.moduleIdentity.id, `images/multi-format/convolution/${id}.jpg`);
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
  return <svg shuku-edit-id="e-501bfbf5-cd1d-4f90-ae6d-ef04cfccd6b8" viewBox="-4 -4 40 40" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path shuku-edit-id="e-6fa2f36c-cb6c-4dbc-b938-78cd78c67706" d={paths[kind]} /></svg>;
}
function MiniWindow({ children }: { children: ReactNode }) {
  return <div shuku-edit-id="e-19370c50-52f4-45b2-a76e-d5a0b0347be2" className="aipe-replay-cg-format-window"><div shuku-edit-id="e-373bf1cb-c551-40f3-8422-0404b563b340" className="aipe-replay-cg-format-mini">{children}</div></div>;
}
function ReadingPreview({ onClose }: { onClose: () => void }) {
  return <MiniWindow>
    <div shuku-edit-id="e-eabcb2eb-a11d-45ab-bab3-278bde7621f1" className="aipe-replay-cg-format-native-reader"><div shuku-edit-id="e-f961a0c0-93aa-4c5a-8d09-0f0b1d15df63" className="aipe-replay-cg-format-native-content" data-embedded-lesson="true" role="region" aria-label="卷积入门自学流程，可上下滚动并逐步解锁" tabIndex={0} onClick={event => event.stopPropagation()} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); onClose(); } }}><NativeStudyPreview /></div></div>
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
    return <Button className="aipe-replay-cg-format-expand" aria-label={`${expanded === mode ? '收起' : '放大'}${title}`} aria-expanded={expanded === mode} onClick={() => setExpanded(value => value === mode ? null : mode)}><Typography shuku-edit-id="e-6a7c7d2b-c74a-4a11-b07e-284724cdfb5b" as="span" variant="bodySmall" tone="inherit">{expanded === mode ? '收起' : '⤢'}</Typography></Button>;
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
  return <ContentBlock shuku-edit-id="e-f912b20d-4433-48a8-ae8e-e817fb56ee8d" ref={root} className="aipe-replay-cg-format-page aipe-replay-cg-creator-typography" headingLevel={1} title="同一份知识内容，适配多种教学与学习场景" bodyClassName="aipe-replay-cg-format-body" onKeyDown={event => { if (event.key === ' ' && event.target instanceof Element && event.target.closest('button')) event.stopPropagation(); }}>
    <div shuku-edit-id="e-71252cbb-7771-47c1-b92c-6364cb169266" className="aipe-replay-cg-format-source-row"><svg shuku-edit-id="e-568ec4ca-b3ac-4eda-9c0e-a7cab045c72a" className="aipe-replay-cg-format-source-links" viewBox="0 0 1536 112" aria-hidden="true"><path shuku-edit-id="e-12389291-0049-4fde-a27c-b0ac06d08c3d" d="M768 52C500 35 305 39 248 112M768 52v60M768 52c268-17 463-13 520 60" /></svg><div shuku-edit-id="e-cc8b1544-1ef3-4b5a-9acd-0dd449d9c78c" className="aipe-replay-cg-format-source"><span shuku-edit-id="e-56252677-d92e-4310-ba51-b22bc9968422" className="aipe-replay-cg-format-source-icon"><FormatStyleIcon kind="code" /></span><div shuku-edit-id="e-1780ad75-ae20-4659-bf08-9dcfdea92249"><Typography shuku-edit-id="e-fe56a136-b332-4062-834a-ff9ad023f64d" variant="h3" tone="accent">同一份内容</Typography><Typography shuku-edit-id="e-77707d06-ad3e-4e12-b1a2-692113de4c3c" variant="bodySmall" tone="muted">HTML-based 交互式知识呈现</Typography></div></div><Typography shuku-edit-id="e-18289f70-2662-4f77-9065-f44fb9bac12c" variant="bodySmall" tone="warning">一次设计，多种应用场景</Typography></div>
    <div shuku-edit-id="e-ad7f4bbb-14f4-4789-9389-dc06c779411b" className={`aipe-replay-cg-format-columns${expanded ? ' has-expanded' : ''}`}>
      {expanded && <button shuku-edit-id="e-0baf5243-52d3-424c-b87c-aa8250e5ac50" type="button" className="aipe-replay-cg-format-backdrop" aria-label="关闭放大预览" onClick={() => setExpanded(null)}/>}
      <section shuku-edit-id="e-60ccde09-ed2e-4bc9-a11e-c97d92e4cb35" className={`aipe-replay-cg-format-card aipe-replay-cg-format-teaching${expanded === 'teaching' ? ' aipe-replay-cg-format-expanded' : ''}`} onClick={event => expandCard('teaching', event)}><header shuku-edit-id="e-b6463d7a-1443-4aa6-a333-51620921dcd8"><span shuku-edit-id="e-d2634707-5f54-47e5-ad43-9b0bfad32f39" className="aipe-replay-cg-format-mode-icon"><FormatStyleIcon kind="screen" /></span><div shuku-edit-id="e-b2946b3e-377d-4019-9874-ab51ddf2dc5b"><Typography shuku-edit-id="e-4646bc43-197d-4f31-a1f0-301782739917" as="h2" variant="h3" tone="accent">教学展示模式</Typography><Typography shuku-edit-id="e-411af24c-f4ac-4aec-a62e-652a36f3e8a9" variant="bodySmall" tone="muted">面向课堂的组织化展示</Typography></div>{expandButton('teaching', '教学展示模式')}</header>
        <MiniWindow><div shuku-edit-id="e-5d8a201a-48d4-45dc-a406-05df2455b764" className="aipe-replay-cg-format-mini-top"><Typography shuku-edit-id="e-e0bf688c-a2f5-4a3c-b1b9-cc18614256c7" variant="bodySmall" tone="accent">教学知识呈现作品 · 卷积入门</Typography><Typography shuku-edit-id="e-824b34a6-b670-4cfd-b48c-8429e95bce11" variant="bodySmall" tone="muted">{selected + 1} / 4</Typography></div>
          <div shuku-edit-id="e-57a6164c-80fd-4f7c-be66-0df1e3635454" className="aipe-replay-cg-format-teaching-preview"><nav shuku-edit-id="e-fcdc0583-b871-4925-b2b8-d360d3e81bdd" className="aipe-replay-cg-format-slide-list" aria-label="选择预览知识呈现作品">{lessons.map((item, index) => <Button key={item.title} active={selected === index} onClick={() => select(index)} aria-label={`展示第${index + 1}页：${item.title}`} aria-pressed={selected === index}><img shuku-edit-id="e-9a67493c-ebaa-4449-95bb-a942d4c21b45" src={item.image} alt={item.title} /></Button>)}</nav><div shuku-edit-id="e-10dec7f3-1ed1-4b52-842e-73e4f6676ef1" className="aipe-replay-cg-format-main-preview"><img shuku-edit-id="e-69f79b6c-7cd7-4c87-b547-86272128c8f9" src={lesson.image} alt={lesson.title} /><Typography shuku-edit-id="e-6f7aad01-1bdf-4288-ba2c-a4c81fdea573" variant="bodySmall" tone="accent">{lesson.title}</Typography></div></div>
          <div shuku-edit-id="e-bed895e2-462d-4267-a304-fdcbecafb570" className="aipe-replay-cg-format-mini-footer"><Button onClick={() => select((selected + 3) % 4)} aria-label="预览上一页"><Typography shuku-edit-id="e-acb37abc-deac-4cef-8964-833c74ed6a7b" as="span" variant="bodySmall" tone="inherit">上一页</Typography></Button><Typography shuku-edit-id="e-49216013-ede5-4e34-8f90-c3ba21cb0f48" variant="bodySmall" tone="muted">点选缩略图，切换课堂页面</Typography><Button onClick={() => select((selected + 1) % 4)} aria-label="预览下一页"><Typography shuku-edit-id="e-91d67af8-efd7-42fd-9beb-5f74a92f3260" as="span" variant="bodySmall" tone="inherit">下一页</Typography></Button></div>
        </MiniWindow>
      </section>
      <section shuku-edit-id="e-41c7fe00-8485-4f5f-b9f9-60c646ccd5cd" className={`aipe-replay-cg-format-card aipe-replay-cg-format-self${expanded === 'self' ? ' aipe-replay-cg-format-expanded' : ''}`} onClick={event => expandCard('self', event)}><header shuku-edit-id="e-3f7142f6-8e60-4c7d-81fe-b81efdb63d19"><span shuku-edit-id="e-4c22c54d-7358-4f57-b87f-329a76aa9d06" className="aipe-replay-cg-format-mode-icon"><FormatStyleIcon kind="person" /></span><div shuku-edit-id="e-1396c9fb-4566-4e54-bf03-dc895ccb78bc"><Typography shuku-edit-id="e-41cea194-ed21-4a20-9daf-59613dc0f31f" as="h2" variant="h3" tone="success">自学交互模式</Typography><Typography shuku-edit-id="e-307cef98-7156-49c1-bf50-3e1b705e2921" variant="bodySmall" tone="muted">完成当前体验，逐步解锁后续内容</Typography></div>{expandButton('self', '自学交互模式')}</header><ReadingPreview onClose={() => setExpanded(null)} /></section>
      <section shuku-edit-id="e-0bfe9f02-dcdf-46c5-b7b0-4c752cdcac38" className={`aipe-replay-cg-format-card aipe-replay-cg-format-script${expanded === 'script' ? ' aipe-replay-cg-format-expanded' : ''}`} onClick={event => expandCard('script', event)}><header shuku-edit-id="e-7ce4e4a0-dc7d-4cd8-a20d-b2814d7d192c"><span shuku-edit-id="e-23b054f9-361c-4476-b7de-36b0d3b4d863" className="aipe-replay-cg-format-mode-icon"><FormatStyleIcon kind="play" /></span><div shuku-edit-id="e-9cef82cf-b6e9-41c9-8af7-2cf8a6da6115"><Typography shuku-edit-id="e-17eab897-5968-482f-99a2-023f07aa2623" as="h2" variant="h3" tone="warning">智能讲稿模式</Typography><Typography shuku-edit-id="e-cbabef45-232e-4dc7-82d3-c9ca78a50ddc" variant="bodySmall" tone="muted">讲解与画面对应 · 视频扩展方向</Typography></div>{expandButton('script', '智能讲稿模式')}</header>
        <MiniWindow><div shuku-edit-id="e-0ee13f80-790b-43ef-a2ff-d588592d24d2" className="aipe-replay-cg-format-mini-top"><Typography shuku-edit-id="e-b25813af-86e9-48ae-bd21-a5ca61f7e5b8" variant="bodySmall" tone="accent">{lesson.title}</Typography><Button active={playing} onClick={toggleNarration} disabled={!speechSupported} aria-label={!speechSupported ? '当前浏览器不支持语音播放' : playing ? '暂停语音讲解' : paused ? '继续语音讲解' : '播放语音讲解'}><Typography shuku-edit-id="e-33b7a1a7-28e8-427a-a53b-3cbc4f4da6f9" as="span" variant="bodySmall" tone="inherit">{!speechSupported ? '不支持语音' : speechError ? '重试讲解' : playing ? '暂停' : paused ? '继续' : '播放讲解'}</Typography></Button></div>
          <div shuku-edit-id="e-7a93bc30-f2c3-4888-b86b-00e606c2635a" className="aipe-replay-cg-format-script-preview"><div shuku-edit-id="e-e5d82945-802f-46b7-b415-c48b0280321e" className="aipe-replay-cg-format-annotated"><img shuku-edit-id="e-20a570d6-0fa9-44c7-a576-8e46861453bf" src={lesson.image} alt={lesson.title}/>{explaining && <span shuku-edit-id="e-cd03b1a4-7339-45e5-aab1-229048cf558c" className="aipe-replay-cg-format-narration-highlight" style={{ left: `${lesson.steps[step].box[0]}%`, top: `${lesson.steps[step].box[1]}%`, width: `${lesson.steps[step].box[2]}%`, height: `${lesson.steps[step].box[3]}%` }} aria-hidden="true"/>}</div></div>
        </MiniWindow>
      </section>
    </div>
    <div shuku-edit-id="e-5c4b136f-9aff-4566-a161-bfa9cd67ab40" className="aipe-replay-cg-format-bottom"><section shuku-edit-id="e-48855cec-66d2-4429-ad2a-972fb5c5b519" className="aipe-replay-cg-format-traditional"><Typography shuku-edit-id="e-d6637ac4-1766-42fe-ba20-2bb53b929e88" as="h2" variant="h3" tone="muted">传统 PPT</Typography><Typography shuku-edit-id="e-85cf0fb5-3be4-48e3-887b-19f920006d8d" variant="bodySmall" tone="muted">主要服务课堂讲授</Typography></section><section shuku-edit-id="e-2b77f780-f418-470f-afda-24ccc6f0fb1b" className="aipe-replay-cg-format-advantages"><Typography shuku-edit-id="e-bb5bf423-8485-4805-a698-c744231a662e" as="h2" variant="h3" tone="accent">相比传统 PPT 的优势</Typography><div shuku-edit-id="e-6991d2de-5b17-4fed-a779-de8c3f5f20d8">{(['一次设计，多端复用', '既能讲课，也能自学', '操作与反馈帮助理解', '讲稿可用于视频制作']).map((text, index) => <div shuku-edit-id="e-e9109437-a394-4764-8802-c495489fbf53" className={`aipe-replay-cg-format-benefit aipe-replay-cg-format-benefit-${index}`} key={text}><span shuku-edit-id="e-fd746815-f48e-49e5-9035-301f6232f605" className="aipe-replay-cg-format-benefit-icon"><FormatStyleIcon kind={(['devices', 'book', 'light', 'video'] as const)[index]} /></span><Typography shuku-edit-id="e-bb6713ba-2836-4bf5-9b07-d5e2d5b97c8f" variant="bodySmall" tone="main">{text}</Typography></div>)}</div></section></div>
  </ContentBlock>;
}
