# Presentation Engine

This package is the shared foundation for slide, guide, interactive, and narrated presentations. It deliberately does not treat PowerPoint, DOM, Canvas, or an editor SDK as the source of truth.

## Architecture

`PresentationDocument` owns five durable concepts:

1. `content` stores semantic text, image, and shape nodes once.
2. `widgets` stores instances of interactive React, chart, video, 3D, or game plugins.
3. `views.slides` stores fixed-canvas placements that reference content or widgets.
4. `views.guide` stores responsive sections that reference the same content or widgets.
5. `narration` stores timed cues targeting stable semantic IDs.

The renderers are replaceable projections. The slide editor currently uses DOM rendering with Moveable and Selecto. A future tldraw, native, or collaborative editor must still read and write the same validated document.

## Public entry points

- `document.ts` defines the versioned Zod schema and cross-reference validation.
- `store.ts` provides selection, mode, placement updates, history, and document replacement.
- `commands.ts` exposes a validated command boundary for agents and other automation.
- `widget-registry.tsx` defines the plugin contract and cross-view session state.
- `renderers.tsx` renders fixed slides and responsive guide sections.
- `editor.tsx` adds selection, movement, resize, rotation, snapping, layers, and inspection.
- `narration.tsx` schedules speech and semantic highlight cues.

## Adding a widget

Register a stable widget type before rendering its document:

```tsx
const registry = new WidgetRegistry().register({
  type: 'my-interactive-chart',
  version: 1,
  displayName: 'Interactive chart',
  Component: MyChart,
  capabilities: {
    interactive: true,
    resizable: true,
    serializable: true,
    supportsSlide: true,
    supportsGuide: true,
    supportsNarration: true,
  },
  narrationAnchors: [
    { id: 'trend-line', label: 'Trend line' },
  ],
});
```

New widgets should treat `props` as authored configuration and `state` as the learner session. Call `setState` for durable interaction changes. The provider retains that state when switching between slide and guide projections.

## Agent contract

Agents should inspect the document and submit commands through `executePresentationCommand`. The command is validated before it reaches the store. This prevents malformed sizes, unknown operation types, and direct DOM mutation. Whole-document replacement is also validated, including references and slide containment.

## Migration strategy

Existing lesson blocks can be registered as opaque legacy widgets. This preserves working teaching logic while the surrounding title, copy, media, and layout move into the document model. Legacy widgets may initially report `serializable: false`. New widgets should be serializable and responsive in both slide and guide modes.

PPTX viewers belong in an importer or reference-preview adapter. Editable PPTX import must map supported OOXML elements into this document. Unsupported elements can temporarily become image assets without changing the engine.

## Validation

Run:

```bash
npm run typecheck
npm run test:engine
npm run build
```

The Neuron Guide vertical slice is available at `/presentation-spike`, and the earlier Galton slice remains at `/presentation-spike/galton`. Both demonstrate a shared content graph, existing React lesson widgets, visual slide editing, responsive guide rendering, JSON round-tripping, undo and redo, and narration highlights.
