# Course card publication implementation plan

**Goal:** Show the latest saved revision's review state and let course managers submit and publish from My Courses.

**Architecture:** Add lightweight revision/review/draft/release metadata to the existing authorized course list in one query. A card component reuses existing submit/publish APIs, displays review notes and release confirmation, and leaves public releases unchanged until publication succeeds. Unsaved editor drafts, failed builds, rejected revisions and hidden courses direct users to the appropriate editing or governance flow.

**Tech stack:** React, TypeScript, existing MySQL storage and Python workflow APIs.

1. Extend the list query without returning private project files; test draft, build failure, pending, rejected, approved and published states, new revisions, and access restrictions.
2. Add status and contextual actions on course cards, including a review dialog and a version/note publication form. Refresh after actions, on focus and while builds/reviews are pending. Handle remote publication waiting/failure without duplicate requests.
3. Add focused mocked browser coverage for submit, review notes, release validation/retry, remote completion, new versions, hidden courses and mobile layout. Run existing authoring/preview regression, TypeScript checks and the production build.
4. Commit and push only this change to the IDL GitHub repository, fast-forward the main checkout, deploy the tested Demo assets and backend package, and verify health and matching remote commit. Preserve unrelated local files and the independent product deployment.

## Validation environment

Backend workflow and draft cases run against a disposable MySQL database with the normal fixtures. On the shared Demo host, the existing HTTP health test exceeded its 5-second client timeout. The HTTP/local-agent regression rerun uses an uncommitted temporary harness with a 90-second client timeout and cached schema inspection after a successful full migration. Only non-migration cases use the cache; the migration case and three remaining local-agent cases run with the standard fixtures because the migration case deliberately drops tables. Checksums/reference guards are still read and each test still clears its own data. The temporary harness avoids redundant TRUNCATE only for verified empty tables without auto-increment columns; populated and auto-increment tables are still truncated. No business assertions, runtime timeout settings or production data are changed.

## Results

- TypeScript project check and locked-library production build passed. Existing bundle-size/font-resolution warnings remain; deployment preserves the existing course assets and fonts.
- Both browser regressions passed: course-card review/publication and existing local-agent/preview flows, including mobile layout.
- 30 backend cases passed across the workflow, draft, HTTP and local-agent suites: 12 workflow/draft cases with standard fixtures; 13 HTTP/local-agent cases with the isolated timing/schema harness; 4 migration/client/deletion cases with standard fixtures; the final downloaded-client case passed after increasing its test subprocess wait from 20 to 180 seconds. The downloaded client's own 60-second network timeout is unchanged.
- The migration case was rerun with standard fixtures after the schema-cache optimization proved unsuitable for its deliberate table deletion. No production behavior was changed for these test-environment adjustments.
