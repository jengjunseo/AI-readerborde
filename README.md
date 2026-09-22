# AI LEADERBOARD

An explainable daily AI-model scoreboard. The production product covers **Overall, Coding, Agentic, Value, Speed, and Korean readiness** with canonical model identity, source attribution, deterministic scoring, immutable snapshots, and rollback-safe publication.

## Architecture

`Source adapter → source_fetches / raw_observations → normalized_metric_values → board_scores → ranking_snapshots / ranking_entries → published_pointers`

- **Identity:** provider → model → model version → external source alias. Unknown OpenRouter IDs go to `unmapped_entities`; a fetch can never create a public model automatically.
- **Historical reproducibility:** each snapshot holds an input hash and method version. Publishing updates all board pointers inside one transaction.
- **Source adapters:** Artificial Analysis supplies current benchmark, cost, speed, and latency observations; OpenRouter refreshes catalog identity and public API pricing. The checked-in curated adapter is only a deterministic test/fallback fixture.
- **Failure policy:** source adapters fail independently, but a new snapshot is published only when a trusted evaluation source succeeds and every required board passes validation. Any pre-publish failure rolls back the transaction and retains the last pointers.
- **Rollback:** `POST /api/admin/rollback`, protected by `ADMIN_TOKEN`, repoints one board to a validated historical snapshot.
- **Public read path:** App Router server pages query `published_pointers` directly on each request. If production storage is unavailable, the UI visibly labels and serves the last checked-in verified snapshot instead of pretending it is live.
- **Health semantics:** `/api/health` reports `ok` only when both the durable database and cron secret are configured; fallback mode is explicitly `degraded`.

## Run locally

```bash
npm install
npm run lint
npm test
npm run build
```

The test suite uses PGlite, a real embedded PostgreSQL runtime, applies the checked-in Drizzle migrations, persists observations through all four data layers, then proves idempotency, same-day method upgrades, atomic failure retention, and rollback.

## Provision production

1. Create a Neon PostgreSQL database and set `DATABASE_URL`, `CRON_SECRET`, and `ADMIN_TOKEN` in Vercel Production.
2. Run `DATABASE_URL=... npm run db:migrate` against that database, or call the protected `POST /api/admin/bootstrap` route once. The bootstrap route applies checked-in migrations inside Vercel and publishes the first daily snapshot.
3. Deploy the same commit. Vercel calls `/api/cron/daily` at `00:00 KST` (`0 15 * * *` UTC).
4. Call the protected daily endpoint once and check `/api/v1/boards/overall`.

The daily runner uses live Artificial Analysis observations plus the live OpenRouter catalog. OpenRouter-only records remain in the unmapped queue until explicitly approved; they cannot silently create a public model or alter ranking rows. The Korean board intentionally remains unranked until a sufficiently complete, independently traceable Korean evaluation source is connected.

See [METHODOLOGY.md](./METHODOLOGY.md) for Method v2, coverage rules, and limitations.
