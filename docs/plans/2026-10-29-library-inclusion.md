# Additional library courses implementation plan

**Goal:** List AI-Learning-Exploration, LLM-Practice-Education, Research-Intelligence-Era and Tldraw-Demo on the deployed course homepage.

**Architecture:** Update the pinned independent course snapshot. Keep deck registration as the default; allow an explicit `catalogListed` flag for guide-only interactive modules. Guide-only modules open their native route and do not expose a nonexistent teaching mode. Memory-Test stays excluded. Existing releases and private workspaces retain their original snapshots.

**Tech Stack:** Python catalog, React/TypeScript, Vite, Git course distribution.

1. Add registration tests covering normal deck courses, explicit guide-only opt-in, exclusion of internal test modules and invalid entries.
2. Implement catalog opt-in and frontend homepage/detail links. Skip guide-only modules during official deck bootstrap.
3. Update the course distribution from committed source, fetch a fixed snapshot and update the platform lock.
4. Run relevant catalog/export/fetch tests, TypeScript checking, production build and browser checks for all four courses, details and working learning links.
5. Push platform changes, deploy the tested frontend/catalog to Demo, verify 18 public courses and keep Memory-Test hidden. Preserve existing versions; do not retry failed builds.
