# R2 SQL API Reference

Read-only SQL over Iceberg (Apache DataFusion). Query templates only. For the authoritative list of supported syntax, functions, data types, and limitations, pull the SQL reference (`sql-reference/`, `.../aggregate-functions/`, `.../scalar-functions/`, `.../complex-types/`) and `reference/limitations-best-practices/`.

## Query Endpoint

```
POST https://api.sql.cloudflarestorage.com/api/v1/accounts/{ACCOUNT_ID}/r2-sql/query/{BUCKET}
Authorization: Bearer <token>
Content-Type: application/json
Body: {"query": "<SQL>"}
```

CLI: `npx wrangler r2 sql query "{WAREHOUSE}" "<SQL>"` (with `WRANGLER_R2_SQL_AUTH_TOKEN`).

## Response Format

```json
{
  "result": {
    "request_id": "dqe-prod-01...",
    "schema": [{"name": "cnt", "descriptor": {"type": {"name": "int64"}, "nullable": false}}],
    "rows": [{"category": "Electronics", "cnt": 12345}],
    "metrics": {"r2_requests_count": 5, "files_scanned": 29, "bytes_scanned": 12345678, "cache_hits": 0}
  },
  "success": true, "errors": []
}
```

Error: `{"result": null, "success": false, "errors": [{"code": 40003, "message": "..."}]}`. `bytes_scanned` ≈ billable data.

## Query Structure

```sql
SELECT [DISTINCT] columns | expressions | aggregations
FROM namespace.table [alias]
[ [INNER|LEFT|RIGHT|FULL OUTER|CROSS] JOIN namespace.table2 alias2 ON ... ]
[WHERE ...] [GROUP BY ...] [HAVING ...]
[QUALIFY window_predicate]
[ORDER BY expr [ASC|DESC]]
[LIMIT n]                          -- default 500, max 10,000
```

## Schema Discovery

```sql
SHOW DATABASES;            -- list namespaces (aliases: SHOW NAMESPACES / SHOW SCHEMAS)
SHOW TABLES IN namespace;
DESCRIBE namespace.table;  -- columns, types, partition keys
EXPLAIN [FORMAT JSON] SELECT ...;   -- execution plan (free; no data scanned)
```

## JOINs / Subqueries / CTEs / Set Ops

```sql
-- JOINs: all types + multi-way
SELECT z.domain, COUNT(*) AS cnt
FROM ns.zones z
INNER JOIN ns.http_requests h ON z.zone_id = h.zone_id
LEFT  JOIN ns.firewall_events f ON z.zone_id = f.zone_id
GROUP BY z.domain ORDER BY cnt DESC LIMIT 20;

-- Subqueries: IN / EXISTS / scalar / derived
SELECT * FROM ns.t1 WHERE id IN (SELECT id FROM ns.t2 WHERE x > 0);
SELECT col, (SELECT COUNT(*) FROM ns.t2 s WHERE s.id = t.id) AS cnt FROM ns.t1 t;

-- Multi-table CTE with JOIN
WITH top AS (SELECT zone_id, COUNT(*) AS req FROM ns.http_requests GROUP BY zone_id ORDER BY req DESC LIMIT 50)
SELECT t.zone_id, t.req FROM top t LEFT JOIN ns.zones z ON t.zone_id = z.zone_id;

-- Set ops: UNION / UNION ALL / INTERSECT / EXCEPT
SELECT zone_id FROM ns.firewall_events WHERE action = 'block'
UNION SELECT zone_id FROM ns.http_requests WHERE risk_score > 0.8;
```

## Window Functions

Use inline `OVER (...)`. See the SQL reference for the full list of supported window functions and frame syntax.

```sql
SELECT event_id,
       ROW_NUMBER() OVER (PARTITION BY mag_type ORDER BY magnitude DESC) AS rn,
       LAG(magnitude, 2, 0.0) OVER (ORDER BY occurred_at) AS prev2,   -- offset + default
       NTH_VALUE(magnitude, 2) OVER (ORDER BY magnitude DESC) AS n2,
       SUM(magnitude) OVER (ORDER BY occurred_at) AS running,
       AVG(magnitude) OVER (ORDER BY magnitude ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS moving_avg
FROM ns.earthquakes;

-- QUALIFY: filter on a window result (top row per partition)
SELECT event_id, mag_type, magnitude FROM ns.earthquakes
QUALIFY ROW_NUMBER() OVER (PARTITION BY mag_type ORDER BY magnitude DESC) = 1;
```

## Functions

Aggregate, scalar, JSON, and array/map function catalogs are in the docs — pull `sql-reference/aggregate-functions/` and `.../scalar-functions/`. JSON functions accept variadic paths, e.g. `json_get_int(doc, 'user', 'profile', 'level')`.

## Data Types

`integer`, `float`, `string` (single quotes), `boolean`, `timestamp` (RFC3339 **with timezone**), `date` (ISO 8601), `struct`, `array` (1-indexed), `map`. No implicit conversions — quote strings, include timezone on timestamps, don't quote integers. Full type docs: `sql-reference/`.

```sql
WHERE status = 200 AND method = 'GET'              -- not '200', not GET
  AND ts >= '2026-01-01T00:00:00Z'                 -- not '2026-01-01'
```

## Complex Types (quick examples; full ref in docs)

```sql
SELECT pricing['price'] AS price, get_field(pricing, 'discount') AS disc FROM ns.t;  -- struct
SELECT tags[1] AS first_tag, array_length(tags) AS n FROM ns.t;                       -- array (1-indexed)
SELECT map_keys(meta), map_extract(meta, 'source') FROM ns.t;                         -- map
```

## Errors

Failed queries return `{"success": false, "errors": [{"code": ..., "message": ...}]}`. For error codes and troubleshooting, see `https://developers.cloudflare.com/r2-sql/troubleshooting/`.

## See Also

- [patterns.md](patterns.md) — query examples · [gotchas.md](gotchas.md) — limits & workarounds · [configuration.md](configuration.md)

# R2 SQL API Reference

SQL syntax, functions, operators, and data types for R2 SQL queries.

## SQL Syntax

```sql
SELECT column_list | aggregation_function
FROM [namespace.]table_name
WHERE conditions
[GROUP BY column_list]
[HAVING conditions]
[ORDER BY column | aggregation_function [DESC | ASC]]
[LIMIT number]
```

## Schema Discovery

```sql
SHOW DATABASES;           -- List namespaces
SHOW NAMESPACES;          -- Alias for SHOW DATABASES
SHOW SCHEMAS;             -- Alias for SHOW DATABASES
SHOW TABLES IN namespace; -- List tables in namespace
DESCRIBE namespace.table; -- Show table schema, partition keys
```

## SELECT Clause

```sql
-- All columns
SELECT * FROM logs.http_requests;

-- Specific columns
SELECT user_id, timestamp, status FROM logs.http_requests;
```

**Limitations:** No column aliases, expressions, or nested column access

## WHERE Clause

### Operators

| Operator | Example |
|----------|---------|
| `=`, `!=`, `<`, `<=`, `>`, `>=` | `status = 200` |
| `LIKE` | `user_agent LIKE '%Chrome%'` |
| `BETWEEN` | `timestamp BETWEEN '2025-01-01T00:00:00Z' AND '2025-01-31T23:59:59Z'` |
| `IS NULL`, `IS NOT NULL` | `email IS NOT NULL` |
| `AND`, `OR` | `status = 200 AND method = 'GET'` |

Use parentheses for precedence: `(status = 404 OR status = 500) AND method = 'POST'`

## Aggregation Functions

| Function | Description |
|----------|-------------|
| `COUNT(*)` | Count all rows |
| `COUNT(column)` | Count non-null values |
| `COUNT(DISTINCT column)` | Count unique values |
| `SUM(column)`, `AVG(column)` | Numeric aggregations |
| `MIN(column)`, `MAX(column)` | Min/max values |

```sql
-- Multiple aggregations with GROUP BY
SELECT region, COUNT(*), SUM(amount), AVG(amount)
FROM sales.transactions
WHERE sale_date >= '2024-01-01'
GROUP BY region;
```

## HAVING Clause

Filter aggregated results (after GROUP BY):

```sql
SELECT category, SUM(amount)
FROM sales.transactions
GROUP BY category
HAVING SUM(amount) > 10000;
```

## ORDER BY Clause

Sort results by:
- **Partition key columns** - Always supported
- **Aggregation functions** - Supported via shuffle strategy

```sql
-- Order by partition key
SELECT * FROM logs.requests ORDER BY timestamp DESC LIMIT 100;

-- Order by aggregation (repeat function, aliases not supported)
SELECT region, SUM(amount)
FROM sales.transactions
GROUP BY region
ORDER BY SUM(amount) DESC;
```

**Limitations:** Cannot order by non-partition columns. See [gotchas.md](gotchas.md#order-by-limitations)

## LIMIT Clause

```sql
SELECT * FROM logs.requests LIMIT 100;
```

| Setting | Value |
|---------|-------|
| Min | 1 |
| Max | 10,000 |
| Default | 500 |

**Always use LIMIT** to enable early termination optimization.

## Data Types

| Type | SQL Literal | Example |
|------|-------------|---------|
| `integer` | Unquoted number | `42`, `-10` |
| `float` | Decimal number | `3.14`, `-0.5` |
| `string` | Single quotes | `'hello'`, `'GET'` |
| `boolean` | Keyword | `true`, `false` |
| `timestamp` | RFC3339 string | `'2025-01-01T00:00:00Z'` |
| `date` | ISO 8601 date | `'2025-01-01'` |

### Type Safety

- Quote strings with single quotes: `'value'`
- Timestamps must be RFC3339: `'2025-01-01T00:00:00Z'` (include timezone)
- Dates must be ISO 8601: `'2025-01-01'` (YYYY-MM-DD)
- No implicit conversions

```sql
-- ✅ Correct
WHERE status = 200 AND method = 'GET' AND timestamp > '2025-01-01T00:00:00Z'

-- ❌ Wrong
WHERE status = '200'              -- string instead of integer
WHERE timestamp > '2025-01-01'    -- missing time/timezone
WHERE method = GET                -- unquoted string
```

## Query Result Format

JSON array of objects:

```json
[
  {"user_id": "user_123", "timestamp": "2025-01-15T10:30:00Z", "status": 200},
  {"user_id": "user_456", "timestamp": "2025-01-15T10:31:00Z", "status": 404}
]
```

## See Also

- [patterns.md](patterns.md) - Query examples and use cases
- [gotchas.md](gotchas.md) - SQL limitations and error handling
- [configuration.md](configuration.md) - Setup and authentication
