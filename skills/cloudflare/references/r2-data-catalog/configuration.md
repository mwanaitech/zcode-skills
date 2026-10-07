# R2 Data Catalog Configuration

Enable the catalog, create tokens, turn on automatic maintenance, connect clients. For exhaustive token/permission options and maintenance settings, pull `https://developers.cloudflare.com/r2/data-catalog/manage-catalogs/` and `.../table-maintenance/`.

## Step 1: Create Bucket + Enable Catalog

```bash
npx wrangler r2 bucket create my-bucket
npx wrangler r2 bucket catalog enable my-bucket
```

`enable` outputs the two values used everywhere:

```
Warehouse:   4482a1cd43bf5197657ae1d8636c414a_my-bucket   # {ACCOUNT_ID}_{BUCKET}
Catalog URI: https://catalog.cloudflarestorage.com/4482a1cd43bf5197657ae1d8636c414a/my-bucket
```

Enabling creates `__r2_data_catalog/` metadata in the bucket; existing objects are untouched.

## Step 2: Create an API Token

Dashboard → **R2** → **Manage R2 API tokens** → **Create API token**.

**Simplest:** one token with **R2 Storage Admin Read & Write** + **R2 Data Catalog Read & Write**, scoped to your bucket(s). Add **R2 SQL Read** if you also query. This token works for the Iceberg REST API, control-plane API, R2 SQL, and GraphQL Analytics. Token creation also yields S3 Access Key ID / Secret (needed only for Spark orphan-file removal).

> Open-beta limitation: R2 Storage **Admin Write is required even for read-only data access**. See the manage-catalogs doc for the current permission matrix.

## Step 3: Enable Automatic Maintenance (Recommended)

R2 Data Catalog runs compaction and snapshot expiration for you.

```bash
# Compaction — merges small files (target size MB; default 128)
npx wrangler r2 bucket catalog compaction enable my-bucket \
  --target-size 128 --token $API_TOKEN

# Snapshot expiration — removes old snapshots AND their unreferenced data files
npx wrangler r2 bucket catalog snapshot-expiration enable my-bucket \
  --token $API_TOKEN --older-than-days 7 --retain-last 10
```

Compaction needs a **stored credential** to access files. `compaction enable` (and the dashboard wizard) stores it automatically; pure-API setups must call `/credential` (see [api.md](api.md)).

> Compaction triggers **hourly** with **no hard throughput cap** (the former 2 GB/hour limit was lifted). Snapshot expiration deletes unreferenced data files automatically (since April 2026) — manual orphan cleanup is rarely needed. For target-size guidance per workload, see the table-maintenance doc.

## Step 4: Verify

```bash
npx wrangler r2 bucket catalog status my-bucket
# or control-plane API:
curl -s "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/r2-catalog/$BUCKET" \
  -H "Authorization: Bearer $API_TOKEN"
```

Expect `"status": "active"`, `compaction.state: "enabled"`, `credential_status: "present"`.

## Client Connection

### PyIceberg

```python
import os
from pyiceberg.catalog.rest import RestCatalog

catalog = RestCatalog(
    name="r2_catalog",
    warehouse=os.environ["R2_WAREHOUSE"],   # {ACCOUNT_ID}_{BUCKET}
    uri=os.environ["R2_CATALOG_URI"],       # https://catalog.cloudflarestorage.com/{ACCOUNT_ID}/{BUCKET}
    token=os.environ["R2_TOKEN"],
)
print(catalog.list_namespaces())            # connection test
```

### PySpark / DuckDB / Trino / Snowflake

Full, current engine configs live at `https://developers.cloudflare.com/r2/data-catalog/config-examples/`. A verified PySpark session template is in [patterns.md](patterns.md#pyspark-session) (needs Iceberg 1.6.1 and `X-Iceberg-Access-Delegation: vended-credentials`).

## Environment Variables Pattern

```bash
# .env (never commit)
R2_CATALOG_URI=https://catalog.cloudflarestorage.com/<ACCOUNT_ID>/<BUCKET>
R2_WAREHOUSE=<ACCOUNT_ID>_<BUCKET>
R2_TOKEN=<api-token>
```

## Disable Catalog

```bash
npx wrangler r2 bucket catalog disable my-bucket
```

Preserves data and metadata; tables become inaccessible via the catalog until re-enabled.

## See Also

- [api.md](api.md) — control-plane + PyIceberg API · [gotchas.md](gotchas.md) — auth & maintenance troubleshooting

# Configuration

How to enable R2 Data Catalog and configure authentication.

## Prerequisites

- Cloudflare account with [R2 subscription](https://developers.cloudflare.com/r2/pricing/)
- R2 bucket created
- Access to Cloudflare dashboard or Wrangler CLI

## Enable Catalog on Bucket

Choose one method:

### Via Wrangler (Recommended)

```bash
npx wrangler r2 bucket catalog enable <BUCKET_NAME>
```

**Output:**
```
✅ Data Catalog enabled for bucket 'my-bucket'
   Catalog URI: https://<account-id>.r2.cloudflarestorage.com/iceberg/my-bucket
   Warehouse: my-bucket
```

### Via Dashboard

1. Navigate to **R2** → Select your bucket → **Settings** tab
2. Scroll to "R2 Data Catalog" section → Click **Enable**
3. Note the **Catalog URI** and **Warehouse name** shown

**Result:**
- Catalog URI: `https://<account-id>.r2.cloudflarestorage.com/iceberg/<bucket-name>`
- Warehouse: `<bucket-name>` (same as bucket name)

### Via API (Programmatic)

```bash
curl -X POST \
  "https://api.cloudflare.com/client/v4/accounts/<account-id>/r2/buckets/<bucket>/catalog" \
  -H "Authorization: Bearer <api-token>" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "result": {
    "catalog_uri": "https://<account-id>.r2.cloudflarestorage.com/iceberg/<bucket>",
    "warehouse": "<bucket>"
  },
  "success": true
}
```

## Check Catalog Status

```bash
npx wrangler r2 bucket catalog status <BUCKET_NAME>
```

**Output:**
```
Catalog Status: enabled
Catalog URI: https://<account-id>.r2.cloudflarestorage.com/iceberg/my-bucket
Warehouse: my-bucket
```

## Disable Catalog (If Needed)

```bash
npx wrangler r2 bucket catalog disable <BUCKET_NAME>
```

⚠️ **Warning:** Disabling does NOT delete tables/data. Files remain in bucket. Metadata becomes inaccessible until re-enabled.

## API Token Creation

R2 Data Catalog requires API token with **both** R2 Storage + R2 Data Catalog permissions.

### Dashboard Method (Recommended)

1. Go to **R2** → **Manage R2 API Tokens** → **Create API Token**
2. Select permission level:
   - **Admin Read & Write** - Full catalog + storage access (read/write)
   - **Admin Read only** - Read-only access (for query engines)
3. Copy token value immediately (shown only once)

**Permission groups included:**
- `Workers R2 Data Catalog Write` (or Read)
- `Workers R2 Storage Bucket Item Write` (or Read)

### API Method (Programmatic)

Use Cloudflare API to create tokens programmatically. Required permissions:
- `Workers R2 Data Catalog Write` (or Read)
- `Workers R2 Storage Bucket Item Write` (or Read)

## Client Configuration

### PyIceberg

```python
from pyiceberg.catalog.rest import RestCatalog

catalog = RestCatalog(
    name="my_catalog",
    warehouse="<bucket-name>",           # Same as bucket name
    uri="<catalog-uri>",                 # From enable command
    token="<api-token>",                 # From token creation
)
```

**Full example with credentials:**
```python
import os
from pyiceberg.catalog.rest import RestCatalog

# Store credentials in environment variables
WAREHOUSE = os.getenv("R2_WAREHOUSE")      # e.g., "my-bucket"
CATALOG_URI = os.getenv("R2_CATALOG_URI")  # e.g., "https://abc123.r2.cloudflarestorage.com/iceberg/my-bucket"
TOKEN = os.getenv("R2_TOKEN")              # API token

catalog = RestCatalog(
    name="r2_catalog",
    warehouse=WAREHOUSE,
    uri=CATALOG_URI,
    token=TOKEN,
)

# Test connection
print(catalog.list_namespaces())
```

### Spark / Trino / DuckDB

See [patterns.md](patterns.md) for integration examples with other query engines.

## Connection String Format

For quick reference:

```
Catalog URI:  https://<account-id>.r2.cloudflarestorage.com/iceberg/<bucket>
Warehouse:    <bucket-name>
Token:        <r2-api-token>
```

**Where to find values:**

| Value | Source |
|-------|--------|
| `<account-id>` | Dashboard URL or `wrangler whoami` |
| `<bucket>` | R2 bucket name |
| Catalog URI | Output from `wrangler r2 bucket catalog enable` |
| Token | R2 API Token creation page |

## Security Best Practices

1. **Store tokens securely** - Use environment variables or secret managers, never hardcode
2. **Use least privilege** - Read-only tokens for query engines, write tokens only where needed
3. **Rotate tokens regularly** - Create new tokens, test, then revoke old ones
4. **One token per application** - Easier to track and revoke if compromised
5. **Monitor token usage** - Check R2 analytics for unexpected patterns
6. **Bucket-scoped tokens** - Create tokens per bucket, not account-wide

# .env (never commit)
R2_CATALOG_URI=https://<account-id>.r2.cloudflarestorage.com/iceberg/<bucket>
R2_WAREHOUSE=<bucket-name>
R2_TOKEN=<api-token>
```

```python
import os
from pyiceberg.catalog.rest import RestCatalog

catalog = RestCatalog(
    name="r2",
    uri=os.getenv("R2_CATALOG_URI"),
    warehouse=os.getenv("R2_WAREHOUSE"),
    token=os.getenv("R2_TOKEN"),
)
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| 404 "catalog not found" | Run `wrangler r2 bucket catalog enable <bucket>` |
| 401 "unauthorized" | Check token has both Catalog + Storage permissions |
| 403 on data files | Token needs both permission groups |

See [gotchas.md](gotchas.md) for detailed troubleshooting.
