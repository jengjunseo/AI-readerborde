# AI LEADERBOARD Methodology — v1

## Evidence layers

Each public score is reproducible through four durable layers:

1. **Raw:** the observed value, source URL, observation date, source-fetch fingerprint, and model version.
2. **Normalized:** fixed-anchor 0–100 transformation for each benchmark.
3. **Derived:** a board score and JSON breakdown that points back to its raw leaves.
4. **Ranking:** a dated snapshot and rank entries, with prior-rank reference.

`published_pointers` is the only read path for “today.” It moves only after all board snapshots are staged and validated in a transaction.

## Boards

| Board | Formula | Eligibility |
| --- | --- | --- |
| Overall | 40% GPQA Diamond + 40% SWE-bench Verified + 20% AIME | ≥60% weighted benchmark coverage |
| Coding | normalized SWE-bench Verified | benchmark present |
| Cheapest | 75% input + 25% output price per 1M tokens | official/curated price present |

Anchors are GPQA 30–90, SWE-bench 20–85, and AIME 30–100. `normalized = clamp((raw - floor) / (ceiling - floor) × 100)`. Anchors are fixed for method v1 so a newly collected model cannot silently change the historical interpretation of an existing score.

## What this does not claim

Price is a transparent API-price sort, not a Cost Per Successful Task estimate. Benchmark scores are not treated as a real-world task success probability. A later CPST board needs task-profile calibration evidence before it can make that claim.

## Source policy

Provider pricing pages are T1. Public benchmark leaderboards are T3. Every public number carries a source URL and observed date. The current seed data is visibly dated curated evidence; it is not presented as real-time telemetry. Live OpenRouter results are T2 discovery input and require alias approval before becoming a public model identity.
