# AI SCOREBOARD Methodology — v2.0

## Evidence layers

Every published score is reproducible through four durable layers:

1. **Raw:** source URL and source kind, benchmark name/version, external model ID, raw value/unit, observation and fetch times, adapter version, payload hash, and terms note.
2. **Normalized:** versioned fixed-anchor transformations. Missing values remain missing.
3. **Derived:** board scores, coverage, and JSON leaves that point to the exact raw observations.
4. **Ranking:** dated immutable snapshots with prior rank, new-entry flag, and movement reason.

`published_pointers` is the only current read path. All boards are staged and validated before the pointers move in one transaction. If any required board fails validation, the transaction rolls back and the last healthy snapshot remains public.

## Model identity and publication

Identity is `provider → model → model_version → source alias`. A source-specific model name is never treated as the canonical identity by itself. The lifecycle is `discovered → candidate → verified → published → archived`. Trusted evaluation adapters may create candidates; unknown catalog IDs enter `unmapped_entities`. A model is publishable only when at least two capability axes are present or an administrator explicitly approves it.

## Overall score

| Axis | Weight | Current evidence |
| --- | ---: | --- |
| Reasoning | 25% | GPQA Diamond, Humanity's Last Exam |
| Coding / agentic coding | 25% | Terminal-Bench 4.0, SciCode, SWE-bench when available |
| Work / tool use | 15% | GDPval-AA, AA-Briefcase / Analyst Agent, APEX Agents, ITBench SRE |
| Long context / multimodal | 10% | AA-LCR, MMMU-Pro |
| Korean | 10% | published only when a traceable evaluation exists |
| Value | 10% | observed Cost per Intelligence Index task |
| Output speed | 5% | median output tokens per second |

If an axis is missing, it is not replaced with zero or an imputed average. Available weights are renormalized and the original covered weight is shown as coverage. Overall eligibility requires at least two capability axes and 50% total weighted coverage.

The Value board is an **Estimated Cost Index**, not CPST. An observed benchmark cost is not assumed to equal real-world success probability.

## Sources and cadence

- Artificial Analysis public model leaderboard: evaluations, task cost, speed, and latency; daily observation.
- OpenRouter model catalog API: discovery, context window, aliases, and published route pricing; daily observation.
- Snapshot publication: daily at 00:00 KST through Vercel Cron (`0 15 * * *` UTC).

Each adapter persists a fingerprint. Unknown IDs do not become public models automatically. A missing Korean board is displayed as “평가 대기” rather than populated with fabricated or stale values.
