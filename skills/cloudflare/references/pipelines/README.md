# Cloudflare Pipelines

Streaming ingest: receive events over HTTP/Workers/Logpush, transform with SQL, write to R2 as Iceberg tables or Parquet/JSON files.

## Documentation

This reference is a fast-start with verified code and gotchas. For limits, settings, full SQL syntax, and pricing, **retrieve the live docs** — use the `cloudflare-docs` MCP/search tool if available, otherwise `webfetch` the URL. Docs are source of truth over this file.

| Topic | URL |
|-------|-----|
| Overview / getting started | `https://developers.cloudflare.com/pipelines/getting-started/` |
| Streams (write, manage, Logpush) | `https://developers.cloudflare.com/pipelines/streams/` |
| Sinks | `https://developers.cloudflare.com/pipelines/sinks/` |
| Pipelines & SQL transforms | `https://developers.cloudflare.com/pipelines/pipelines/` |
| SQL reference (statements, types) | `https://developers.cloudflare.com/pipelines/sql-reference/` |
| Wrangler commands | `https://developers.cloudflare.com/pipelines/reference/wrangler-commands/` |
| Terraform | `https://developers.cloudflare.com/pipelines/reference/terraform/` |
| Limits | `https://developers.cloudflare.com/pipelines/platform/limits/` |
| Pricing | `https://developers.cloudflare.com/pipelines/platform/pricing/` |
| Metrics (GraphQL) | `https://developers.cloudflare.com/pipelines/observability/metrics/` |

## Three Components

```
Sources → Stream → Pipeline (SQL) → Sink → R2
          ↑          ↓                 ↓
   HTTP / Workers / Transform     Iceberg (Data Catalog)
   Logpush          (row-level)   or Parquet/JSON files
```

| Component | Purpose |
|-----------|---------|
| **Stream** | Receives events (HTTP endpoint, Worker binding, or Logpush). Structured (schema-validated) or unstructured. |
| **Pipeline** | SQL connecting a stream to a sink. Row-level transforms only — no GROUP BY/aggregation. |
| **Sink** | Writes to R2 — Iceberg via Data Catalog, or raw Parquet/JSON. |

**Status:** Open beta (Workers Paid for production). Pricing announced; verify billing status in docs.

## Quick Start

```bash
# Interactive — creates stream + sink + pipeline, optionally bucket + catalog
npx wrangler pipelines setup
```

Minimal Worker producer:
```typescript
interface Env { MY_STREAM: Pipeline; }

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    ctx.waitUntil(env.MY_STREAM.send([{ event_id: crypto.randomUUID(), amount: 29.99 }]));
    return new Response("OK");
  }
} satisfies ExportedHandler<Env>;
```

## Which Sink Type?

```
Need SQL queries / ACID / time-travel on the data?
  → R2 Data Catalog (Iceberg)   ✅ R2 SQL, schema evolution   ❌ more setup

Just archival / external tools (Spark, Athena)?
  → R2 raw files (Parquet/JSON) ✅ simple, partitioned files  ❌ no built-in SQL
```

## Critical Behaviors (read before building)

These are non-obvious and prevent most failures — see [gotchas.md](gotchas.md) for detail.

- **Everything is immutable after creation** — stream schema, pipeline SQL, sink config. To change, delete and recreate.
- **Sinks create their own table** — they cannot target an existing Iceberg table.
- **`__ingest_ts` is added automatically** (TIMESTAMP, partitioned by day). Don't define it in your schema.
- **Data isn't queryable immediately** — first flush takes **3–7 minutes** (warm-up + table creation) even with a short roll interval.
- **Schema validation is deferred** — invalid events are accepted then silently dropped. Monitor via GraphQL error metrics.
- **Binding field renamed `pipeline` → `stream`** (June 2026); old field still accepted.

## Reading Order

1. [configuration.md](configuration.md) — schema, streams, sinks, pipelines (CLI + REST + Terraform), bindings
2. [api.md](api.md) — `send()`, HTTP ingest, REST API, pipeline SQL, lifecycle states
3. [patterns.md](patterns.md) — fire-and-forget, validation, Logpush, observability, end-to-end
4. [gotchas.md](gotchas.md) — silent drops, immutability, REST≠CLI field names

## See Also

- [r2-data-catalog](../r2-data-catalog/) — Iceberg sink destination
- [r2-sql](../r2-sql/) — query the ingested data
- [r2](../r2/) · [queues](../queues/) · [workers](../workers/)

# Cloudflare Pipelines

ETL streaming platform for ingesting, transforming, and loading data into R2 with SQL transformations.

## Overview

Pipelines provides:
- **Streams**: Durable event buffers (HTTP/Workers ingestion)
- **Pipelines**: SQL-based transformations
- **Sinks**: R2 destinations (Iceberg tables or Parquet/JSON files)

**Status**: Open beta (Workers Paid plan)  
**Pricing**: No charge beyond standard R2 storage/operations

## Architecture

```
Data Sources → Streams → Pipelines (SQL) → Sinks → R2
                 ↑          ↓                ↓
            HTTP/Workers  Transform     Iceberg/Parquet
```

| Component | Purpose | Key Feature |
|-----------|---------|-------------|
| Streams | Event ingestion | Structured (validated) or unstructured |
| Pipelines | Transform with SQL | Immutable after creation |
| Sinks | Write to R2 | Exactly-once delivery |

# Interactive setup (recommended)
npx wrangler pipelines setup
```

**Minimal Worker example:**
```typescript
interface Env {
  STREAM: Pipeline;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const event = { user_id: "123", event_type: "purchase", amount: 29.99 };
    
    // Fire-and-forget pattern
    ctx.waitUntil(env.STREAM.send([event]));
    
    return new Response('OK');
  }
} satisfies ExportedHandler<Env>;
```

## Which Sink Type?

```
Need SQL queries on data?
  → R2 Data Catalog (Iceberg)
    ✅ ACID transactions, time-travel, schema evolution
    ❌ More setup complexity (namespace, table, catalog token)

Just file storage/archival?
  → R2 Storage (Parquet)
    ✅ Simple, direct file access
    ❌ No built-in SQL queries

Using external tools (Spark/Athena)?
  → R2 Storage (Parquet with partitioning)
    ✅ Standard format, partition pruning for performance
    ❌ Must manage schema compatibility yourself
```

## Common Use Cases

- **Analytics pipelines**: Clickstream, telemetry, server logs
- **Data warehousing**: ETL into queryable Iceberg tables
- **Event processing**: Mobile/IoT with enrichment
- **Ecommerce analytics**: User events, purchases, views

## Reading Order

**New to Pipelines?** Start here:
1. [configuration.md](./configuration.md) - Setup streams, sinks, pipelines
2. [api.md](./api.md) - Send events, TypeScript types, SQL functions
3. [patterns.md](./patterns.md) - Best practices, integrations, complete example
4. [gotchas.md](./gotchas.md) - Critical warnings, troubleshooting

**Task-based routing:**
- Setup pipeline → [configuration.md](./configuration.md)
- Send/query data → [api.md](./api.md)
- Implement pattern → [patterns.md](./patterns.md)
- Debug issue → [gotchas.md](./gotchas.md)

## In This Reference

- [configuration.md](./configuration.md) - wrangler.jsonc bindings, schema definition, sink options, CLI commands
- [api.md](./api.md) - Pipeline binding interface, send() method, HTTP ingest, SQL function reference
- [patterns.md](./patterns.md) - Fire-and-forget, schema validation with Zod, integrations, performance tuning
- [gotchas.md](./gotchas.md) - Silent validation failures, immutable pipelines, latency expectations, limits

## See Also

- [r2](../r2/) - R2 storage backend for sinks
- [queues](../queues/) - Compare with Queues for async processing
- [workers](../workers/) - Worker runtime for event ingestion
