# Additional library courses implementation plan

**Goal:** List AI-Learning-Exploration, LLM-Practice-Education, Research-Intelligence-Era and Tldraw-Demo on the deployed course homepage.

**Architecture:** Update the pinned independent course snapshot. Keep deck registration as the default; allow an explicit `catalogListed` flag for guide-only interactive modules. Guide-only modules open their native route and do not expose a nonexistent teaching mode. Memory-Test stays excluded. Existing releases and private workspaces retain their original snapshots.

**Tech Stack:** Python catalog, React/TypeScript, Vite, Git course distribution.

1. Add registration tests covering normal deck courses, explicit guide-only opt-in, exclusion of internal test modules and invalid entries.
2. Implement catalog opt-in and frontend homepage/detail links. Skip guide-only modules during official deck bootstrap.
3. Update the course distribution from committed source, fetch a fixed snapshot and update the platform lock.
4. Run relevant catalog/export/fetch tests, TypeScript checking, production build and browser checks for all four courses, details and working learning links.
5. Push platform changes, deploy the tested frontend/catalog to Demo, verify 18 public courses and keep Memory-Test hidden. Preserve existing versions; do not retry failed builds.

## Verification and deployment record

- Catalog registration/HTTP/versioning/migration and guide-only bookmark coverage: all 8 relevant cases passed. MySQL tests ran only against `idl_shuku_test_library_inclusion_20261029`.
- The initial standard fixture was too slow due to repeated empty-table DDL. A temporary test-only harness caches schema inspection (invalidated by schema DDL) and clears fixture rows with committed DELETE statements; these catalog tests do not assert auto-increment counters. One stale fixture row failure was corrected in that harness and the affected version-retention case passed on rerun. No product migration or SQL behavior was changed to accommodate tests.
- Course exporter: 4 tests passed; fixed-snapshot fetch: 1 test passed.
- TypeScript `tsc --noEmit`, Python compilation and independent snapshot production build passed. The bundle check confirms course components come from the independent snapshot, without editing-repository fallback.
- Browser checks passed for 18 catalog cards, all four additions and their detail pages, both study modes for the three deck courses, the native canvas route, and mobile layout.
- Implemented scene catalog exported for all 17 deck modules; its module-file hash matches the immutable server snapshot. Historic distribution-only Basic-Example files were included in the final build.
- Course pin: `e4425739f8b317bfd5a42fb4b4f5a653a30162aa`. Preserve the old snapshot and all existing releases/workspaces. Guide-only modules support catalog bookmarks but are not passed to deck-revision bootstrap.
- Deploy only to Demo HTTPS 5173. Keep the old frontend symlink target and private environment/module backups under `/var/lib/shuku-idl/deploy-backups/library-inclusion-20261029`. Do not enqueue or retry revision builds.
- This work is in the independent Intuitive Deep Learning and course-distribution repositories; the parent Demo repository and its GitLab product mirror are unchanged.
