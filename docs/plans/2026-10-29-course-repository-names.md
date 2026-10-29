# Course repository naming implementation plan

**Goal:** Agent proposes an English repository name; creators confirm it before publishing and can rename their dedicated published repository later.

**Architecture:** Store `repositoryName` in revision JSON and standard `outlines.json`, without a database schema change. Naming belongs only to App-owned dedicated course repositories. Use installation-scoped GitHub lookup for availability, durable per-course jobs for mutations, and immutable repository IDs for identity and recovery.

**Tech Stack:** Python, existing SQLAlchemy/MySQL task queue, GitHub App REST API, React.

1. Add name validation and tests for English slugs, occupied names, same repository and unavailable GitHub.
2. Preserve Agent candidates through local template packing and document the shared Agent project contract.
3. Add owner-authorized information/check/rename endpoints. Restrict shared library and workspace repositories.
4. Bind the confirmed name to release jobs; rename before public visibility and verify the same repository ID. Recover interrupted renames by repository ID; handle name races and failed-job correction.
5. Add a shared publication name field, explicit availability checks, stale-result invalidation, and a post-publication rename dialog in repository details.
6. Test queue/release/retry/identity behavior against a disposable database and fake GitHub; run UI and build checks, then sync GitHub and deploy without renaming existing repositories automatically.
