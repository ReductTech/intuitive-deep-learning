import { Annotation, StateGraph, START, END } from '@langchain/langgraph/web';
import { request } from './api';
import { compileSlide } from './runtime';
import type { Selection } from './types';

const rules = `你是 Edit Deck 的 React 课件设计师。输出且只输出完整 TSX 源码，不要 markdown 围栏。
默认导出 function Slide()。这是一个固定 1600×900 的独立 React 幻灯片，布局必须完全容纳在画布里。
运行环境已经提供 React，以及 useState,useEffect,useRef,useMemo,useCallback,useReducer,useLayoutEffect 全局变量。不要写 import/require，不要请求网络，不要使用外部库，不要访问父窗口、storage、cookie 或浏览器导航。
可以使用内联 style 和组件内部 <style>，CSS 只影响此页。用真实文字、HTML、SVG、Canvas 和 React 状态实现页面；需要交互时生成可工作的控件。
视觉遵循参考图的布局、字体层次、配色和留白。文字和组件必须独立可选择，不能把整张参考图当成背景或唯一内容。
全局 draftImage 是参考图片的 data URL；仅当需要保留原图的一小部分插图时，可通过 object-position、裁剪容器引用。不要重新输出 base64。不要引入外部图片。
标题 48–72px，正文 26–34px，避免过多卡片。单个页面只突出一个概念，保持清晰的阅读顺序。`;
const State = Annotation.Root({
  prompt: Annotation<string>(), image: Annotation<string>(), source: Annotation<string>(), selection: Annotation<Selection | null>(),
  output: Annotation<string>(), error: Annotation<string>(), attempts: Annotation<number>(),
});
function clean(text: string) { return text.trim().replace(/^```(?:tsx|jsx|typescript|javascript)?\s*/i, '').replace(/\s*```$/, ''); }

/** The editing loop runs in the browser; only provider HTTP calls go through localhost. */
export async function authorSlide(input: { prompt: string; image: string; source: string; selection: Selection | null }, signal: AbortSignal, status: (text: string) => void) {
  const graph = new StateGraph(State)
    .addNode('author', async state => {
      status(state.attempts ? '正在修复编译问题…' : state.source ? '正在调整选中的页面元素…' : '正在将图片转换成 React 课件…');
      const context = `${state.prompt}\n${state.source ? `当前完整源码：\n${state.source}` : '根据参考图生成真正的 React 课件。'}\n${state.selection ? `选中的元素：${JSON.stringify(state.selection)}。优先只修改这一部分。` : ''}\n${state.error ? `上一次源码：${state.output}\n编译错误：${state.error}\n修复错误后重新输出完整源码。` : ''}`;
      const content: unknown[] = [{ type: 'text', text: context }];
      if (state.image) content.push({ type: 'image_url', image_url: { url: state.image } });
      const { text } = await request<{ text: string }>('/llm', 'POST', { messages: [{ role: 'system', content: rules }, { role: 'user', content }] }, signal);
      return { output: clean(text), attempts: state.attempts + 1 };
    })
    .addNode('validate', async state => {
      status('正在浏览器中编译课件…');
      try { await compileSlide(state.output); return { error: '' }; }
      catch (error) { return { error: error instanceof Error ? error.message : '编译失败' }; }
    })
    .addEdge(START, 'author').addEdge('author', 'validate')
    .addConditionalEdges('validate', state => state.error && state.attempts < 3 ? 'author' : END).compile();
  const result = await graph.invoke({ ...input, output: '', error: '', attempts: 0 }, { signal });
  if (result.error) throw new Error(`自动修复后仍无法编译：${result.error}`);
  return result.output;
}
