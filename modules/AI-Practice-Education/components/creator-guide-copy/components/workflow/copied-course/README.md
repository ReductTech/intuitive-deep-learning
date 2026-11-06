# Creator-Guide local convolution course

This directory is an independent snapshot of `modules/Convolution-Kernel-Intro` taken on 2026-10-23 for Creator-Guide's creation walkthrough and self-study preview. It is not registered as another course.

- `course.tsx` defines the 24 real pages. `GuidePage.tsx` supplies the self-study lesson steps.
- All course-owned assets are copied under `assets/444f8951-dd2e-42dc-94e5-c5a878618631/workflow/convolution-course/`. Runtime references use Creator-Guide's UUID and that prefix.
- Relative imports resolve only within this snapshot or `modules/shared`. React, Three.js and icon packages remain normal project dependencies.
- Course-specific CSS classes, variables and animation names use a `cg-copy-` prefix. The copied Tailwind entry scans only this copy's pages.
- `LessonContext.tsx` shares game outcomes and edited templates in memory under one provider. It never reads or writes original-course localStorage. The walkthrough resets its provider when replayed.
- The second page accepts an optional clarification so the scripted review visibly changes the actual lesson page.
- Design stages still show their images. Production and review stages render this real course through `CopiedCoursePreview.tsx`.

Do not replace these local files or asset URLs with imports or links to the original module. Apply future corrections explicitly to this copy and verify all page IDs, asset resolution, cross-page state and canvas bounds.
