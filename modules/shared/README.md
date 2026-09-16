# Shared module contract

`modules/shared` is the runtime foundation for every learning module. Code here must be module-agnostic: it may depend on the shared UI tokens and contracts, but never on a module id, page name, or module-specific class prefix.

## What belongs here

- `react/`: reusable layout, controls, learning primitives, visualizations, and presentation infrastructure.
- `react/presentation/`: the generic `SceneDeck` and its `DeckDefinition`/`SceneDefinition` contract.
- `react/visuals/`: visual styles shared by a capability family (for example activation-function charts).
- `react/learning/`: reusable learning components and their styles.

## Module boundary

Each module owns its route entry, course catalog, lesson state, page components, speaker notes, and page-only CSS. A module may import shared code, but shared code must never import back into that module. Keep module prefixes (for example `ng-`) inside the module; do not add them to shared selectors.

For a presentation, the module should provide a thin adapter under its own directory. The adapter supplies a `DeckDefinition[]`, a stable `progressKey`, and optional speaker-note lookup to `SceneDeck`:

```tsx
import { SceneDeck, type DeckDefinition } from '../shared/react/presentation';
```

This keeps presentation behavior reusable while allowing each module to provide its own lesson context and scene catalog.

## CSS rule

Import shared CSS from the component that owns the reusable behavior. Keep page composition and module-specific overrides next to the page. Shared CSS must use semantic `--ui-*` tokens and generic class names; never add a selector merely because it is currently used by one module.
