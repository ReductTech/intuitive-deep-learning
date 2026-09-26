import { Typography } from '../shared/react';
import '../shared/react/styles.css';
import '../shared/react/ui-kit.css';
import './tldraw-demo.css';

// 演示页用独立 iframe 隔离 tldraw 的全局样式；因此不需要修改现有依赖或课程文件。
const editorHtml = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="https://esm.sh/tldraw@5.4.2/tldraw.css" />
  <style>
    html, body, #root { width: 100%; height: 100%; margin: 0; overflow: hidden; }
    #status { position: absolute; inset: 0; display: grid; place-items: center; font: 16px system-ui; color: #425466; background: #fff; }
    #status.error { padding: 24px; text-align: center; color: #9f2639; }
  </style>
  <script type="importmap">
    {
      "imports": {
        "react": "https://esm.sh/react@19.2.7",
        "react/jsx-runtime": "https://esm.sh/react@19.2.7/jsx-runtime",
        "react-dom": "https://esm.sh/react-dom@19.2.7?external=react",
        "react-dom/client": "https://esm.sh/react-dom@19.2.7/client?external=react"
      }
    }
  </script>
</head>
<body>
  <div id="root"></div>
  <div id="status" role="status">正在载入 tldraw 可编辑画布…</div>
  <script type="module">
    const showFailure = (message) => {
      const status = document.getElementById('status') || document.createElement('div');
      status.id = 'status';
      status.className = 'error';
      status.textContent = message;
      document.body.appendChild(status);
    };
    window.addEventListener('error', (event) => showFailure('画布运行出错：' + event.message));
    window.addEventListener('unhandledrejection', (event) => showFailure('画布运行出错：' + String(event.reason)));
    try {
      const [{ default: React }, { createRoot }, { Tldraw, createShapeId, toRichText }] = await Promise.all([
        import('react'),
        import('react-dom/client'),
        import('https://esm.sh/tldraw@5.4.2?external=react,react-dom')
      ]);
      const seedDiagram = (editor) => {
        if (editor.getCurrentPageShapeIds().size > 0) return;
        const inputId = createShapeId();
        const neuronId = createShapeId();
        const outputId = createShapeId();
        const firstArrowId = createShapeId();
        const secondArrowId = createShapeId();
        editor.run(() => {
          editor.createShapes([
            { id: inputId, type: 'geo', x: 80, y: 170, props: { geo: 'rectangle', w: 190, h: 120, color: 'light-blue', fill: 'semi', richText: toRichText('输入 x') } },
            { id: neuronId, type: 'geo', x: 380, y: 155, props: { geo: 'ellipse', w: 170, h: 150, color: 'violet', fill: 'semi', richText: toRichText('神经元') } },
            { id: outputId, type: 'geo', x: 660, y: 170, props: { geo: 'rectangle', w: 190, h: 120, color: 'green', fill: 'semi', richText: toRichText('输出 y') } },
            { id: firstArrowId, type: 'arrow', x: 270, y: 230, props: { start: { x: 0, y: 0 }, end: { x: 110, y: 0 } } },
            { id: secondArrowId, type: 'arrow', x: 550, y: 230, props: { start: { x: 0, y: 0 }, end: { x: 110, y: 0 } } }
          ]);
          editor.createBindings([
            { fromId: firstArrowId, toId: inputId, type: 'arrow', props: { terminal: 'start', normalizedAnchor: { x: 1, y: 0.5 }, isExact: false, isPrecise: true } },
            { fromId: firstArrowId, toId: neuronId, type: 'arrow', props: { terminal: 'end', normalizedAnchor: { x: 0, y: 0.5 }, isExact: false, isPrecise: true } },
            { fromId: secondArrowId, toId: neuronId, type: 'arrow', props: { terminal: 'start', normalizedAnchor: { x: 1, y: 0.5 }, isExact: false, isPrecise: true } },
            { fromId: secondArrowId, toId: outputId, type: 'arrow', props: { terminal: 'end', normalizedAnchor: { x: 0, y: 0.5 }, isExact: false, isPrecise: true } }
          ]);
        }, { history: 'ignore' });
        editor.zoomToBounds({ x: -50, y: 20, w: 1030, h: 420 }, { immediate: true });
      };
      createRoot(document.getElementById('root')).render(
        React.createElement(Tldraw, {
          persistenceKey: 'intuitive-deep-learning-tldraw-demo-v3',
          onMount: seedDiagram
        })
      );
      document.getElementById('status').remove();
    } catch (error) {
      showFailure('画布载入失败。请确认网络可以访问 esm.sh，然后刷新页面。');
      console.error('[tldraw demo]', error);
    }
  </script>
</body>
</html>`;

export function TldrawDemoPage() {
  return (
    <main className="tld-demo">
      <header className="tld-demo__header">
        <div className="tld-demo__heading">
          <Typography as="span" variant="bodySmall" className="tld-demo__eyebrow">可编辑画布接入演示</Typography>
          <Typography as="h1" variant="h1">tldraw × 神经元课程</Typography>
          <Typography as="p" variant="bodySmall">试着画一个输入 → 神经元 → 输出的结构。双击文字可修改，拖动画布可移动，滚轮可缩放。</Typography>
        </div>
        <a className="tld-demo__back" href="/">返回模块目录</a>
      </header>
      <section className="tld-demo__frame" aria-label="tldraw 可编辑画布">
        <iframe title="tldraw 可编辑画布" srcDoc={editorHtml} allow="clipboard-read; clipboard-write" />
      </section>
      <footer className="tld-demo__footer">
        <Typography as="p" variant="bodySmall">画布改动保存在当前浏览器；这是独立演示模块，首次打开需要联网加载 tldraw。</Typography>
      </footer>
    </main>
  );
}
