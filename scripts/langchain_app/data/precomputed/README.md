# Precomputed response caches

Each JSON file is an independently versioned namespace loaded by `VersionedJsonCache`.
Runtime code serves only entries whose `review.status` is `approved`; `generated` entries
can be checked in for review without becoming live. Files are hot-reloaded by mtime, so a
validated cache update does not require changing route code.

For decision candidates, the display source of truth is
`modules/Neuron-Guide-React/data/decisionCandidates.json`. Generate entries sequentially:

```powershell
node scripts/generate_decision_candidate_cache.mjs --approve
```

The generator validates a complete intake plus exactly two extra factors, writes through an
atomic rename after every candidate, and resumes by skipping existing keys. Use `--force`,
`--candidate <label>`, `--limit <n>`, or `--validate-only` for maintenance. For a review-first
workflow, generate without `--approve`, inspect the `generated` entries, then promote all or
selected entries with `--promote [--candidate <label>]`.

To add another cache family, create a new namespace JSON document and a small task adapter;
reuse `VersionedJsonCache` rather than adding route-specific in-memory dictionaries.
