# Pipelines Gotchas

Non-obvious failure modes (not well covered by docs). For current limits and error semantics, pull `https://developers.cloudflare.com/pipelines/platform/limits/`.

## Events accepted but never appear (most common)

HTTP 200 / `send()` resolves, but no data in the sink. Causes:

1. **Schema validation failure** — structured streams accept then **silently drop** invalid events during processing. Validate client-side (Zod) and monitor `pipelinesUserErrorsAdaptiveGroups`.
2. **First-flush warm-up** — first data takes **3–7 minutes** (warm-up + namespace/table creation) even with `--roll-interval 10`. Poll ≥5 min in tests.
3. **Roll interval not elapsed** — default 300s.
4. **Silent sink failure** — deleted bucket or expired token. Check `recordsWritten > 0` but `filesWritten = 0`; inspect `failure_reason` via `GET /pipelines/{id}`.

## Everything is immutable

Cannot modify stream schema, pipeline SQL, or sink config — delete and recreate. Use version naming (`events_v1`) and keep SQL in version control.

```bash
curl -X DELETE "$BASE_URL/pipelines/{id}" -H "Authorization: Bearer $API_TOKEN"
curl -X DELETE "$BASE_URL/sinks/{id}"     -H "Authorization: Bearer $API_TOKEN"
curl -X DELETE "$BASE_URL/streams/{id}"   -H "Authorization: Bearer $API_TOKEN"
```

## Worker binding undefined (`env.MY_STREAM`)

1. Use the **stream ID**, not pipeline ID, in `wrangler.jsonc`.
2. Binding field is `"stream"` (June 2026); old `"pipeline"` still works.
3. Redeploy after adding the binding.

## REST API field names ≠ CLI flags

`r2_data_catalog` vs `--type r2-data-catalog`, `table_name` vs `--table`, `token` vs `--catalog-token`, and `format` is required in REST but implied in CLI. See [configuration.md](configuration.md#option-c-rest-api-programmatic).

## `wrangler pipelines delete` defaults to "no"

Non-interactive environments answer "no" automatically — use REST `DELETE` for CI/automation.

## Behavioral Notes

- **`__ingest_ts` auto-added** (TIMESTAMP, day-partitioned). Don't put it in your schema.
- **Sinks can't target existing tables** — the sink creates its own. Use PySpark to write to existing tables.
- **JSON-only input** — no Avro/Protobuf/CSV.
- **Naming:** streams/sinks/pipelines use underscores; buckets use hyphens.
- **Metrics lag 5–10 min** after creation.
- **Pipeline SQL is row-level only** — no GROUP BY/aggregation/window functions (do aggregation in [R2 SQL](../r2-sql/) at query time). CTEs and `UNNEST` are supported.

## Debug Checklist

- [ ] Stream exists: `wrangler pipelines streams list`
- [ ] Pipeline `running` (not `initializing`/`failed`): `GET /pipelines/{id}`, check `failure_reason`
- [ ] SQL matches schema; sink token valid; bucket + catalog exist
- [ ] Worker redeployed; binding uses **stream ID** under `"stream"`
- [ ] Waited ≥5 min (first flush)
- [ ] Sink metrics: `filesWritten > 0`; error metrics show no drops

## See Also

- [configuration.md](configuration.md) · [api.md](api.md) · [patterns.md](patterns.md)

# Pipelines Gotchas

## Critical Issues

### Events Silently Dropped

**Most common issue.** Events accepted (HTTP 200) but never appear in sink.

**Causes:**
1. Schema validation fails - structured streams drop invalid events silently
2. Waiting for roll interval (10-300s) - expected behavior

**Solution:** Validate client-side with Zod:
```typescript
const EventSchema = z.object({ user_id: z.string(), amount: z.number() });
try {
  const validated = EventSchema.parse(rawEvent);
  await env.STREAM.send([validated]);
} catch (e) { /* get immediate feedback */ }
```

### Pipelines Are Immutable

Cannot modify SQL after creation. Must delete and recreate.

```bash
npx wrangler pipelines delete old-pipeline
npx wrangler pipelines create new-pipeline --sql "..."
```

**Tip:** Use version naming (`events-pipeline-v1`) and keep SQL in version control.

### Worker Binding Not Found

**`env.STREAM is undefined`**

1. Use **stream ID** (not pipeline ID) in `wrangler.jsonc`
2. Redeploy after adding binding

```bash
npx wrangler pipelines streams list  # Get stream ID
npx wrangler deploy
```

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Events not in R2 | Roll interval not elapsed | Wait 10-300s, check `roll_interval` |
| Schema validation failures | Type mismatch, missing fields | Validate client-side |
| Rate limit (429) | >5 MB/s per stream | Batch events, request increase |
| Payload too large (413) | >1 MB request | Split into smaller batches |
| Cannot delete stream | Pipeline references it | Delete pipelines first |
| Sink credential errors | Token expired | Recreate sink with new credentials |

## Limits (Open Beta)

| Resource | Limit |
|----------|-------|
| Streams/Sinks/Pipelines per account | 20 each |
| Payload size | 1 MB |
| Ingest rate per stream | 5 MB/s |
| Event retention | 24 hours |
| Recommended batch size | 100 events |

## SQL Limitations

- **No JOINs** - single stream per pipeline
- **No window functions** - basic SQL only
- **No subqueries** - must use `INSERT INTO ... SELECT ... FROM`
- **No schema evolution** - cannot modify after creation

## Debug Checklist

- [ ] Stream exists: `npx wrangler pipelines streams list`
- [ ] Pipeline healthy: `npx wrangler pipelines get <ID>`
- [ ] SQL syntax matches schema
- [ ] Worker redeployed after binding added
- [ ] Waited for roll interval
- [ ] Accepted vs processed count matches (no validation drops)
