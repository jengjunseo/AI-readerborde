# AI LEADERBOARD

Source-grounded AI model rankings with a deterministic Phase 0 vertical slice: **Overall**, **Coding**, and **Cheapest**.

## Run locally

```bash
npm run dev
npm test
npm run pipeline -- 2026-09-18
```

The curated records in `src/lib/curated-data.ts` retain source URLs and observation dates. `npm run pipeline` deterministically builds all board rankings and prints a stable input hash.

## Method v1

- Overall: 40% GPQA Diamond + 40% SWE-bench Verified + 20% AIME
- Coding: fixed-anchor normalized SWE-bench Verified
- Cheapest: a specification sort using 75% input and 25% output API price

The UI includes two versioned snapshots to make ranking deltas inspectable. The cron endpoint validates the pipeline and is protected by `CRON_SECRET` when set. A database persistence adapter is intentionally not claimed as complete until a Neon `DATABASE_URL` is provisioned.
