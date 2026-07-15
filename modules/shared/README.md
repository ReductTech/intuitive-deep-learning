# Shared Module Resources

`shared/` stores reusable UI resources for interactive deep-learning modules.

## UI Standard

Read the agent-facing rules first, then use the UI kit and starter:

```text
modules/shared/UI-GUIDE.md
modules/shared/ui-kit.html
modules/shared/module-starter.html
```

- `UI-GUIDE.md` defines mandatory reuse rules and module CSS boundaries.
- `ui-kit.html` is the visual source of truth for components and states.
- `module-starter.html` is the copy-ready page skeleton for new modules.

## Existing Base Layer

Use `base.css` for the common page shell and basic controls:

```html
<link rel="stylesheet" href="../shared/base.css">
```

It provides classes such as:

- `edu-root`
- `edu-shell`
- `edu-header`
- `edu-title`
- `edu-subtitle`
- `edu-badge`
- `edu-card`
- `edu-btn`
- `edu-input`
- `edu-note`

## Component Layer

Use `module-components.css` and `module-components.js` for reusable teaching
patterns:

```html
<link rel="stylesheet" href="../shared/module-components.css">
<script src="../shared/module-components.js"></script>
```

The JS exposes `window.DLModuleUI`.

## Canvas Layer

Use `canvas-utils.js` for high-DPI canvas setup, logical sizing, pointer
coordinates, and resize observation:

```html
<script src="../shared/canvas-utils.js"></script>
```

The JS exposes `window.DLCanvas`.

Common helpers:

- `DLCanvas.resize(canvas)`
- `DLCanvas.context(canvas)`
- `DLCanvas.prepare(canvas, { width: 720, height: 240 })`
- `DLCanvas.size(canvas)`
- `DLCanvas.pointer(canvas, event)`
- `DLCanvas.observe([canvasA, canvasB], draw)`

## Plot And Interaction Layer

Use `plot-utils.js` after `canvas-utils.js` for reusable coordinate-system
drawing and pointer interactions:

```html
<script src="../shared/canvas-utils.js"></script>
<script src="../shared/plot-utils.js"></script>
```

The JS exposes `window.DLPlot`.

Reusable pieces:

- `DLPlot.project2D(...)` and `DLPlot.project3D(...)`
- `DLPlot.drawAxes2D(...)`, `DLPlot.drawAxis3D(...)`, `DLPlot.drawAxes3D(...)`
- `DLPlot.strokeFunction(...)`
- `DLPlot.drawNumberLine(...)`
- `DLPlot.drawLossComparison(...)`
- `DLPlot.bindDraggableNumberLine(...)`
- `DLPlot.bindPanZoom(...)`
- `DLPlot.bindRotateZoom(...)`

These helpers keep module-specific concepts outside the shared layer. For
example, a module still decides what `gt`, `pred`, or `predict()` mean, while
`DLPlot` handles the consistent drawing and interactions.

### Continue Cue

Use this for progressive disclosure:

```js
DLModuleUI.renderContinueCue({
  title: '继续观察二维分类边界',
  body: '进入下一幕之前，先点击这里。',
  attrs: 'data-next-step'
});
```

### Button Hint

Use this when the learner should notice the next action button:

```js
var hint = DLModuleUI.startButtonHint(document.querySelector('#nextButton'), {
  duration: 3200,
  focus: true
});

// Stop manually when the button is clicked.
hint.stop();
```

### Exam Question Components

Use `DLModuleUI.mountQuestion(container, options)` for common exam-style
questions. It renders the question, handles selection/input state, and shows
feedback.

Supported types:

- `choice` for single choice
- `multiple` for multiple choice
- `judgement` for true/false
- `fill` for fill-in-the-blank
- `short` for short answer

For `fill`, write `____` or `{{blank}}` directly in `title` or `prompt` to
render an inline blank input at that position.

Example:

```js
DLModuleUI.mountQuestion('#questionMount', {
  type: 'choice',
  title: '下列哪个函数图像是一条直线？',
  options: [
    { key: 'A', value: 'line', label: 'y = 0.7x - 0.2' },
    { key: 'B', value: 'square', label: 'y = x²' }
  ],
  answer: 'line',
  hintButton: true,
  feedback: {
    correct: '正确。',
    wrong: '再看形状。'
  }
});
```

Inline fill example:

```js
DLModuleUI.mountQuestion('#fillMount', {
  type: 'fill',
  title: '二分类输出常用 ____ 把分数压到 0 到 1 之间。',
  blanks: [
    { label: '函数名', placeholder: '函数名', chars: 9 }
  ],
  answer: ['sigmoid']
});
```

Or create a live DOM node:

```js
DLModuleUI.createContinueCue({
  parent: document.querySelector('#somePanel'),
  title: '继续',
  body: '展开下一幕',
  onClick: function (cue) {
    cue.remove();
  }
});
```

### Related Videos

Use for Bilibili embeds or any iframe-based recommendations:

```js
var videos = [
  {
    title: '什么是神经元？',
    embed: '<iframe src="//player.bilibili.com/player.html?..."></iframe>'
  }
];

panel.insertAdjacentHTML('beforeend', DLModuleUI.renderRelatedVideos(videos));
```

The video list is horizontal, shows up to four cards per row on desktop, and
scrolls horizontally when there are more. Clicking a video opens a 16:9 player
below the list instead of handing the card click to the provider iframe. The
embedded player is sandboxed to support playback and fullscreen while blocking
popups and top-level navigation.

### 3D Model Viewer

Use `model-viewer` for GLB assets:

```js
DLModuleUI.ensureModelViewer();

panel.insertAdjacentHTML('beforeend', DLModuleUI.renderModelViewer({
  src: './multipolar_neuron.glb',
  title: '它和生物学上的神经元有点像',
  paragraphs: [
    '生物神经元会接收信号、汇总信号，再把信号传出去。'
  ],
  emphasis: '所以，我们把这样的结构叫做神经元。'
}));
```

### Network Graph

Use for a lightweight input-weight-unit-output diagram:

```js
panel.insertAdjacentHTML('beforeend', DLModuleUI.renderNetworkGraph({
  factors: [
    { label: '兴趣', value: '0.70', weight: 0.8, weightLabel: '0.80' },
    { label: '经济压力', value: '0.30', weight: 0.6, weightLabel: '0.60' }
  ],
  unitTitle: '汇总单元',
  outputValue: '0.52'
}));
```

## Not Extracted Yet

Per current design decision, these are intentionally not extracted yet:

- star rating interaction
- LLM frontend fetch wrapper
- LangChain/Pydantic parser and repair logic

They can be extracted later after their APIs stabilize.
