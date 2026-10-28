# Organization course catalog implementation plan

**Goal:** Discover independent courses in the configured GitHub organization, validate immutable static snapshots, and let administrators approve or reject publication.
**Architecture:** Reuse GitHub App, MySQL business storage, durable worker leases, local content-addressed bucket, published revisions and governance. Keep library snapshot and independent repository discovery separate. No GitHub writes during discovery/import.
**Tech Stack:** Python, SQLAlchemy/MySQL, React/TypeScript, existing GitHub App adapter.

1. Add an explicit additive migration for candidates and preserve previous schema checksums. Test upgrade and restart verification.
2. Implement paginated organization discovery, shuku.json/course.yaml JSON compatibility, repository/ref/path/entry validation and persistent per-repository diagnostics. Scan on a two-hour schedule and on administrator request. Network failures preserve the previous catalog and use worker retries.
3. Queue administrator decisions, revalidate identity and reviewed SHA, copy bounded static artifacts into the local bucket, and atomically publish standard revisions/releases. Retain rejection, source/version history and deletion tombstones; never resurrect hidden/deleted courses or execute repository build commands.
4. Add administrator candidate UI with scan/retry status, preview source, approve/reject and notes. Serve static snapshots under restrictive iframe sandbox; existing favorites, feedback, version history and visibility apply. Static co-creation links to GitHub PRs; React online editing is not a conversion of arbitrary HTML.
5. Add focused unit/integration/HTTP tests for permissions, paging, failures, concurrent/idempotent import, stale snapshots, unsafe files, updates and governance. Run all Shuku backend tests and frontend type/build checks with a disposable MySQL database. Commit and push only this feature; preserve existing local documents.
