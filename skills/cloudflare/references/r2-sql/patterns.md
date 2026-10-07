# R2 SQL Patterns

Code templates for CLI, REST, and Worker access. For performance/partitioning best practices, pull `https://developers.cloudflare.com/r2-sql/reference/limitations-best-practices/`.

## Wrangler CLI

```bash
export WRANGLER_R2_SQL_AUTH_TOKEN=$API_TOKEN

npx wrangler r2 sql query "${ACCOUNT_ID}_my-bucket" "
  SELECT category, COUNT(*) AS cnt, round(AVG(amount), 2) AS avg_amount
  FROM analytics.events
  WHERE __ingest_ts >= '2026-01-01T00:00:00Z'
  GROUP BY category ORDER BY cnt DESC LIMIT 100"
```

## REST API (Python)

```python
import requests

API = f"https://api.sql.cloudflarestorage.com/api/v1/accounts/{ACCOUNT_ID}/r2-sql/query/{BUCKET}"
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

def r2sql(query):
    body = requests.post(API, headers=HEADERS, json={"query": query}, timeout=180).json()
    if body["success"]:
        return body["result"]["rows"], body["result"]["metrics"]
    raise RuntimeError(body["errors"])

rows, metrics = r2sql("SELECT category, COUNT(*) AS cnt FROM analytics.events GROUP BY category LIMIT 10")
```

## REST API (curl)

```bash
curl -X POST \
  "https://api.sql.cloudflarestorage.com/api/v1/accounts/$ACCOUNT_ID/r2-sql/query/$BUCKET" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"query": "SELECT COUNT(*) AS total FROM analytics.events"}'
```

## Dashboard Worker

No R2 SQL binding exists — query the REST endpoint via `fetch()`.

```typescript
interface Env { ACCOUNT_ID: string; BUCKET: string; R2_SQL_TOKEN: string; }

async function queryR2SQL(env: Env, query: string) {
  const url = `https://api.sql.cloudflarestorage.com/api/v1/accounts/${env.ACCOUNT_ID}/r2-sql/query/${env.BUCKET}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.R2_SQL_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!resp.ok) throw new Error(`R2 SQL ${resp.status}: ${await resp.text()}`);
  return (await resp.json() as any).result;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (new URL(req.url).pathname === "/api/analytics") {
      const result = await queryR2SQL(env, `
        SELECT category, COUNT(*) AS cnt FROM analytics.events
        GROUP BY category ORDER BY cnt DESC LIMIT 10`);
      return Response.json(result.rows);
    }
    return new Response("Not found", { status: 404 });
  },
};
```

```bash
npx wrangler secret put R2_SQL_TOKEN
```

## Example Queries

```sql
-- Error rate by endpoint
SELECT path, COUNT(*) AS total, SUM(CASE WHEN status >= 400 THEN 1 ELSE 0 END) AS errors
FROM logs.http_requests WHERE __ingest_ts >= '2026-01-01T00:00:00Z'
GROUP BY path ORDER BY errors DESC LIMIT 20;

-- Top-3 slowest requests per method (window + QUALIFY)
SELECT method, path, response_time_ms FROM logs.http_requests
QUALIFY ROW_NUMBER() OVER (PARTITION BY method ORDER BY response_time_ms DESC) <= 3;

-- Cross-table analytics with approx distinct
SELECT z.domain, COUNT(*) AS requests, approx_distinct(h.client_ip) AS uniques
FROM ns.zones z INNER JOIN ns.http_requests h ON z.zone_id = h.zone_id
WHERE h.__ingest_ts >= '2026-06-01T00:00:00Z'
GROUP BY z.domain ORDER BY requests DESC LIMIT 25;
```

## Cursor-Based Pagination

Paginate on a sortable (ideally partition) column rather than `OFFSET`:

```sql
SELECT * FROM logs.requests ORDER BY __ingest_ts DESC LIMIT 500;                       -- page 1
SELECT * FROM logs.requests WHERE __ingest_ts < '<last_ts>' ORDER BY __ingest_ts DESC LIMIT 500;  -- page 2
```

## Performance (essentials)

- **Always `LIMIT`** (early termination); **filter on partition keys first** (`__ingest_ts` range), then add predicates.
- **Narrow time ranges**; **compact tables** (file count dominates latency — enable automatic compaction in [r2-data-catalog](../r2-data-catalog/configuration.md)).
- Read response `metrics` (`files_scanned`, `bytes_scanned`) to tune. Full guidance: limitations-best-practices doc.

## Pipelines → R2 SQL

After `npx wrangler pipelines setup` (Data Catalog destination), wait for first flush (3–7 min), then query the table. See [pipelines/patterns.md](../pipelines/patterns.md).

## See Also

- [api.md](api.md) · [gotchas.md](gotchas.md) · [r2-data-catalog/patterns.md](../r2-data-catalog/patterns.md)

# R2 SQL Patterns

Common patterns, use cases, and integration examples for R2 SQL.

## Wrangler CLI Query

```bash

# Basic query
npx wrangler r2 sql query "my-bucket" "SELECT * FROM default.logs LIMIT 10"

# Multi-line query
npx wrangler r2 sql query "my-bucket" "
  SELECT status, COUNT(*), AVG(response_time)
  FROM logs.http_requests
  WHERE timestamp >= '2025-01-01T00:00:00Z'
  GROUP BY status
  ORDER BY COUNT(*) DESC
  LIMIT 100
"

# Use environment variable
export R2_SQL_WAREHOUSE="my-bucket"
npx wrangler r2 sql query "$R2_SQL_WAREHOUSE" "SELECT * FROM default.logs"
```

## HTTP API Query

For programmatic access from external systems (not Workers - see gotchas.md).

```bash
curl -X POST https://api.cloudflare.com/client/v4/accounts/{account_id}/r2/sql/query \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "warehouse": "my-bucket",
    "query": "SELECT * FROM default.my_table WHERE status = 200 LIMIT 100"
  }'
```

Response:
```json
{
  "success": true,
  "result": [{"user_id": "user_123", "timestamp": "2025-01-15T10:30:00Z", "status": 200}],
  "errors": []
}
```

## Pipelines Integration

Stream data to Iceberg tables via Pipelines, then query with R2 SQL.

```bash

# Setup pipeline (select Data Catalog Table destination)
npx wrangler pipelines setup

# Key settings:

# - Destination: Data Catalog Table

# - Compression: zstd (recommended)

# - Roll file time: 300+ sec (production), 10 sec (dev)

# Send data to pipeline
curl -X POST https://{stream-id}.ingest.cloudflare.com \
  -H "Content-Type: application/json" \
  -d '[{"user_id": "user_123", "event_type": "purchase", "timestamp": "2025-01-15T10:30:00Z", "amount": 29.99}]'

# Query ingested data (wait for roll interval)
npx wrangler r2 sql query "my-bucket" "
  SELECT event_type, COUNT(*), SUM(amount)
  FROM default.events
  WHERE timestamp >= '2025-01-15T00:00:00Z'
  GROUP BY event_type
"
```

See [pipelines/patterns.md](../pipelines/patterns.md) for detailed setup.

## PyIceberg Integration

Create and populate Iceberg tables with PyIceberg, then query with R2 SQL.

```python
from pyiceberg.catalog.rest import RestCatalog
import pyarrow as pa
import pandas as pd

# Setup catalog
catalog = RestCatalog(
    name="my_catalog",
    warehouse="my-bucket",
    uri="https://<account-id>.r2.cloudflarestorage.com/iceberg/my-bucket",
    token="<your-token>",
)
catalog.create_namespace_if_not_exists("analytics")

# Create table
schema = pa.schema([
    pa.field("user_id", pa.string(), nullable=False),
    pa.field("event_time", pa.timestamp("us", tz="UTC"), nullable=False),
    pa.field("page_views", pa.int64(), nullable=False),
])
table = catalog.create_table(("analytics", "user_metrics"), schema=schema)

# Append data
df = pd.DataFrame({
    "user_id": ["user_1", "user_2"],
    "event_time": pd.to_datetime(["2025-01-15 10:00:00", "2025-01-15 11:00:00"], utc=True),
    "page_views": [10, 25],
})
table.append(pa.Table.from_pandas(df, schema=schema))
```

Query with R2 SQL:
```bash
npx wrangler r2 sql query "my-bucket" "
  SELECT user_id, SUM(page_views)
  FROM analytics.user_metrics
  WHERE event_time >= '2025-01-15T00:00:00Z'
  GROUP BY user_id
"
```

See [r2-data-catalog/patterns.md](../r2-data-catalog/patterns.md) for advanced PyIceberg patterns.

## Use Cases

### Log Analytics
```sql
-- Error rate by endpoint
SELECT path, COUNT(*), SUM(CASE WHEN status >= 400 THEN 1 ELSE 0 END) as errors
FROM logs.http_requests
WHERE timestamp BETWEEN '2025-01-01T00:00:00Z' AND '2025-01-31T23:59:59Z'
GROUP BY path ORDER BY errors DESC LIMIT 20;

-- Response time stats
SELECT method, MIN(response_time_ms), AVG(response_time_ms), MAX(response_time_ms)
FROM logs.http_requests WHERE timestamp >= '2025-01-15T00:00:00Z' GROUP BY method;

-- Traffic by status
SELECT status, COUNT(*) FROM logs.http_requests
WHERE timestamp >= '2025-01-15T00:00:00Z' AND method = 'GET'
GROUP BY status ORDER BY COUNT(*) DESC;
```

### Fraud Detection
```sql
-- High-value transactions
SELECT location, COUNT(*), SUM(amount), AVG(amount)
FROM fraud.transactions WHERE transaction_timestamp >= '2025-01-01T00:00:00Z' AND amount > 1000.0
GROUP BY location ORDER BY SUM(amount) DESC LIMIT 20;

-- Flagged transactions
SELECT merchant_category, COUNT(*), AVG(amount) FROM fraud.transactions
WHERE is_fraud_flag = true AND transaction_timestamp >= '2025-01-01T00:00:00Z'
GROUP BY merchant_category HAVING COUNT(*) > 10 ORDER BY COUNT(*) DESC;
```

### Business Intelligence
```sql
-- Sales by department
SELECT department, SUM(revenue), AVG(revenue), COUNT(*) FROM sales.transactions
WHERE sale_date >= '2024-01-01' GROUP BY department ORDER BY SUM(revenue) DESC LIMIT 10;

-- Product performance
SELECT category, COUNT(DISTINCT product_id), SUM(units_sold), SUM(revenue)
FROM sales.product_sales WHERE sale_date BETWEEN '2024-10-01' AND '2024-12-31'
GROUP BY category ORDER BY SUM(revenue) DESC;
```

## Connecting External Engines

R2 Data Catalog exposes Iceberg REST API. Connect Spark, Snowflake, Trino, DuckDB, etc.

```scala
// Apache Spark example
val spark = SparkSession.builder()
  .config("spark.sql.catalog.my_catalog", "org.apache.iceberg.spark.SparkCatalog")
  .config("spark.sql.catalog.my_catalog.catalog-impl", "org.apache.iceberg.rest.RESTCatalog")
  .config("spark.sql.catalog.my_catalog.uri", "https://<account-id>.r2.cloudflarestorage.com/iceberg/my-bucket")
  .config("spark.sql.catalog.my_catalog.token", "<token>")
  .getOrCreate()

spark.sql("SELECT * FROM my_catalog.default.my_table LIMIT 10").show()
```

See [r2-data-catalog/patterns.md](../r2-data-catalog/patterns.md) for more engines.

## Performance Optimization

### Partitioning
- **Time-series:** day/hour on timestamp
- **Geographic:** region/country
- **Avoid:** High-cardinality keys (user_id)

```python
from pyiceberg.partitioning import PartitionSpec, PartitionField
from pyiceberg.transforms import DayTransform

PartitionSpec(PartitionField(source_id=1, field_id=1000, transform=DayTransform(), name="day"))
```

### Query Optimization
- **Always use LIMIT** for early termination
- **Filter on partition keys first**
- **Multiple filters** for better pruning

```sql
-- Better: Multiple filters on partition key
SELECT * FROM logs.requests 
WHERE timestamp >= '2025-01-15T00:00:00Z' AND status = 404 AND method = 'GET' LIMIT 100;
```

### File Organization
- **Pipelines roll:** Dev 10-30s, Prod 300+s
- **Target Parquet:** 100-500MB compressed

## See Also

- [api.md](api.md) - SQL syntax reference
- [gotchas.md](gotchas.md) - Limitations and troubleshooting
- [r2-data-catalog/patterns.md](../r2-data-catalog/patterns.md) - PyIceberg advanced patterns
- [pipelines/patterns.md](../pipelines/patterns.md) - Streaming ingestion patterns
