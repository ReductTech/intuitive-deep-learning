# Repository layout invariants

These rules are mandatory for every AI or human editing React PPT modules in this repository.

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
