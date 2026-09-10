# Repository layout invariants

These rules are mandatory for every AI or human editing React PPT modules in this repository.

## Active and legacy module boundary

- `modules/` is the only active module tree. Application code under `src/`, `web_ppt/`, and active modules may depend only on code and assets inside `modules/` (plus normal project dependencies).
- `modules-legacy/` is archival and may be removed at any time. Never import, fetch, link, or load runtime code or assets from it in an active module.
- Every active React module must own its module-specific assets inside its directory. Shared runtime code and genuinely shared assets belong in `modules/shared/`.
- Do not register a module in the active application unless its implementation exists under `modules/`.

## PPT containment

- A slide must remain fully inside the 1600 × 900 canvas used by `web_ppt`.
- Every Grid or Flex child must be shrinkable: use `min-width: 0` and `max-width: 100%` where it participates in a PPT layout.
- Never compose a PPT row from several fixed pixel `min-width` values. Use `minmax(0, <fraction>fr)` or percentage tracks.
- The sum of columns, gaps, and padding must fit the parent content box. Do not rely on the parent clipping overflow.
- Formula, media, SVG, canvas, and interactive components must have `max-width: 100%`.
- Do not use `overflow-x: auto` as a desktop PPT layout fix. Redesign the layout so it fits naturally.
- Before completing a PPT layout change, verify that no descendant of `.ng-ppt-slide-surface` has a bounding box outside the slide surface.

## PPT design

- One slide must have one dominant idea and an obvious reading order.
- Prefer a small number of proportion-based regions over nested web-style cards.
- Use Shared Typography for all independent text. Do not override its font size, weight, or line height in module CSS.
- When requirements describe several "blocks" on one page, keep them on one slide unless the user explicitly calls them separate pages or slides.

## Presentation engine boundary

- New multi-form presentation work must use `modules/shared/presentation-engine/`. Do not create another page-specific slide runtime.
- `PresentationDocument` is the canonical, versioned source for semantic content, slide placements, guide sections, widgets, and narration cues. Editor libraries and rendered DOM are projections, not sources of truth.
- Shared content must be referenced by stable IDs from both slide and guide views. Do not duplicate copy merely to place it in another view.
- Reusable interaction modules must enter the engine through `WidgetRegistry`. A widget declares its version and capabilities and must not reach into editor state or layout DOM.
- Agent-authored changes must use validated presentation commands or validated document replacement. Do not ask an agent to edit runtime DOM or generated CSS selectors.
- Narration and highlighting must target semantic node, placement, widget, or widget-anchor IDs. Never persist viewport pixels as the only narration target.
- Existing React lessons may be wrapped as legacy widgets during migration. New widgets should externalize durable state through `WidgetRuntimeProps.setState` so session state survives view changes.
