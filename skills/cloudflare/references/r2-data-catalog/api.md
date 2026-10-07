# R2 Data Catalog API Reference

Two APIs: the **control-plane REST API** (Cloudflare-specific) and the **Iceberg REST catalog API** (standard, used via PyIceberg/PySpark). For PyIceberg method details pull `https://py.iceberg.apache.org/`; for engine configs see `https://developers.cloudflare.com/r2/data-catalog/config-examples/`.

## Control-Plane REST API

Base: `https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/r2-catalog/{BUCKET}`
Auth: `Authorization: Bearer $API_TOKEN`

| Operation | Method | Path |
|-----------|--------|------|
| Get catalog details | GET | `/r2-catalog/{bucket}` |
| Enable / disable | POST | `/r2-catalog/{bucket}/enable` · `/disable` |
| Store compaction credential | POST | `/r2-catalog/{bucket}/credential` |
| List namespaces | GET | `/namespaces` |
| List tables | GET | `/namespaces/{ns}/tables` |
| **Get table metadata** | GET | `/namespaces/{ns}/tables/{table}` |
| Get/update maintenance config | GET/POST | `/maintenance-configs` and `/namespaces/{ns}/tables/{table}/maintenance-configs` |

List endpoints accept `?return_uuids=true`, `?return_details=true`, `?parent={ns}`, and pagination. **Nested namespaces use `%1F` (Unit Separator)**, not `/` or `.`: `/namespaces/parent%1Fchild/tables`.

```bash
# Catalog details (status, maintenance_config, credential_status)
curl -s "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/r2-catalog/$BUCKET" \
  -H "Authorization: Bearer $API_TOKEN"

# Store token for compaction (pure-API setups)
curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/r2-catalog/$BUCKET/credential" \
  -H "Authorization: Bearer $API_TOKEN" -H "Content-Type: application/json" \
  -d '{"token": "'$API_TOKEN'"}'

# Update maintenance config (all fields optional; table-level overrides catalog-level)
curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/r2-catalog/$BUCKET/maintenance-configs" \
  -H "Authorization: Bearer $API_TOKEN" -H "Content-Type: application/json" \
  -d '{"compaction": {"state": "enabled", "target_size_mb": "256"},
       "snapshot_expiration": {"state": "enabled", "min_snapshots_to_keep": 10, "max_snapshot_age": "7d"}}'
```

### Get Table (metadata introspection)

`GET /namespaces/{ns}/tables/{table}` returns schema, partition spec, sort order, and snapshot info — like Iceberg "load table" but on the control plane, with snapshots pruned to the most recent 10. (Newer than the published API docs.)

```bash
curl -s "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/r2-catalog/$BUCKET/namespaces/live/tables/earthquakes" \
  -H "Authorization: Bearer $API_TOKEN"
```

```json
{"result": {
  "identifier": {"namespace": ["live"], "name": "earthquakes"},
  "table_uuid": "019edccf-3ac8-73e3-...",
  "metadata_location": "s3://live-data/__r2_data_catalog/.../metadata/01225-....metadata.json",
  "total_snapshots": 1225,
  "returned_snapshots": 10,
  "metadata": { /* standard Iceberg TableMetadata: schemas, partition-specs, sort-orders,
                   properties, current-snapshot-id, snapshots (≤10), snapshot-log, refs */ }
}, "success": true}
```

| Field | Description |
|-------|-------------|
| `identifier` | `{namespace: [...], name}` |
| `table_uuid` | Iceberg table UUID |
| `metadata_location` | R2 path to current metadata file |
| `total_snapshots` | Total before pruning |
| `returned_snapshots` | Count in `metadata.snapshots` (max 10) |
| `metadata` | Standard [Iceberg TableMetadata](https://iceberg.apache.org/spec/#table-metadata-fields), arrays pruned to 10 |

### Error Format

```json
{"success": false, "errors": [{"code": 10000, "message": "Authentication error"}]}
```

Standard HTTP codes (401 auth, 403 perms, 404 not enabled/found, 409 conflict).

## Iceberg REST Catalog API (via PyIceberg)

Standard [Iceberg REST Catalog](https://github.com/apache/iceberg/blob/main/open-api/rest-catalog-open-api.yaml). Base: `https://catalog.cloudflarestorage.com/{ACCOUNT_ID}/{BUCKET}`. The `/config` route needs `?warehouse={WAREHOUSE}`.

```python
from pyiceberg.catalog.rest import RestCatalog
catalog = RestCatalog(name="r2", warehouse=WAREHOUSE, uri=CATALOG_URI, token=TOKEN)
```

Common operations (see PyIceberg docs for full signatures):

```python
catalog.create_namespace_if_not_exists("logs")
catalog.list_tables("logs")
table = catalog.create_table(("logs", "events"), schema=schema)   # pyiceberg.schema.Schema
table = catalog.load_table(("logs", "events"))
table.append(pyarrow_table)          # also .overwrite(...)
table.scan(row_filter="id > 100").to_pandas()
```

Schema evolution (add nullable columns; widen types only):
```python
with table.update_schema() as u:
    u.add_column("user_id", LongType(), doc="User ID")
    u.rename_column("msg", "message")
```

Time-travel:
```python
table.scan(snapshot_id=table.snapshots()[-2].snapshot_id)
table.scan(as_of_timestamp=ms_epoch)
```

## Manual Maintenance (PySpark)

Prefer automatic maintenance (control-plane API/wrangler). For manual control or very large tables, use Spark procedures (`rewrite_data_files`, `rewrite_manifests`, `expire_snapshots`, `remove_orphan_files`). See `https://developers.cloudflare.com/r2/data-catalog/table-maintenance/`.

```python
spark.sql("CALL r2dc.system.rewrite_data_files(table => 'ns.tbl')")
# Orphan removal REQUIRES S3 credentials (vended creds fail with NoAuthWithAWSException)
spark.sql("CALL r2dc.system.remove_orphan_files(table => 'ns.tbl', older_than => TIMESTAMP '2026-02-28 00:00:00')")
```

## See Also

- [configuration.md](configuration.md) · [patterns.md](patterns.md) · [gotchas.md](gotchas.md)

# API Reference

R2 Data Catalog exposes standard [Apache Iceberg REST Catalog API](https://github.com/apache/iceberg/blob/main/open-api/rest-catalog-open-api.yaml).

## Quick Reference

**Most common operations:**

| Task | PyIceberg Code |
|------|----------------|
| Connect | `RestCatalog(name="r2", warehouse=bucket, uri=uri, token=token)` |
| List namespaces | `catalog.list_namespaces()` |
| Create namespace | `catalog.create_namespace("logs")` |
| Create table | `catalog.create_table(("ns", "table"), schema=schema)` |
| Load table | `catalog.load_table(("ns", "table"))` |
| Append data | `table.append(pyarrow_table)` |
| Query data | `table.scan().to_pandas()` |
| Compact files | `table.rewrite_data_files(target_file_size_bytes=128*1024*1024)` |
| Expire snapshots | `table.expire_snapshots(older_than=timestamp_ms, retain_last=10)` |

## REST Endpoints

Base: `https://<account-id>.r2.cloudflarestorage.com/iceberg/<bucket-name>`

| Operation | Method | Path |
|-----------|--------|------|
| Catalog config | GET | `/v1/config` |
| List namespaces | GET | `/v1/namespaces` |
| Create namespace | POST | `/v1/namespaces` |
| Delete namespace | DELETE | `/v1/namespaces/{ns}` |
| List tables | GET | `/v1/namespaces/{ns}/tables` |
| Create table | POST | `/v1/namespaces/{ns}/tables` |
| Load table | GET | `/v1/namespaces/{ns}/tables/{table}` |
| Update table | POST | `/v1/namespaces/{ns}/tables/{table}` |
| Delete table | DELETE | `/v1/namespaces/{ns}/tables/{table}` |
| Rename table | POST | `/v1/tables/rename` |

**Authentication:** Bearer token in header: `Authorization: Bearer <token>`

## PyIceberg Client API

Most users use PyIceberg, not raw REST.

### Connection

```python
from pyiceberg.catalog.rest import RestCatalog

catalog = RestCatalog(
    name="my_catalog",
    warehouse="<bucket-name>",
    uri="<catalog-uri>",
    token="<api-token>",
)
```

### Namespace Operations

```python
from pyiceberg.exceptions import NamespaceAlreadyExistsError

namespaces = catalog.list_namespaces()  # [('default',), ('logs',)]
catalog.create_namespace("logs", properties={"owner": "team"})
catalog.drop_namespace("logs")  # Must be empty
```

### Table Operations

```python
from pyiceberg.schema import Schema
from pyiceberg.types import NestedField, StringType, IntegerType

schema = Schema(
    NestedField(1, "id", IntegerType(), required=True),
    NestedField(2, "name", StringType(), required=False),
)
table = catalog.create_table(("logs", "app_logs"), schema=schema)
tables = catalog.list_tables("logs")
table = catalog.load_table(("logs", "app_logs"))
catalog.rename_table(("logs", "old"), ("logs", "new"))
```

### Data Operations

```python
import pyarrow as pa

data = pa.table({"id": [1, 2], "name": ["Alice", "Bob"]})
table.append(data)
table.overwrite(data)

# Read with filters
scan = table.scan(row_filter="id > 100", selected_fields=["id", "name"])
df = scan.to_pandas()
```

### Schema Evolution

```python
from pyiceberg.types import IntegerType, LongType

with table.update_schema() as update:
    update.add_column("user_id", IntegerType(), doc="User ID")
    update.rename_column("msg", "message")
    update.delete_column("old_field")
    update.update_column("id", field_type=LongType())  # int→long only
```

### Time-Travel

```python
from datetime import datetime, timedelta

# Query specific snapshot or timestamp
scan = table.scan(snapshot_id=table.snapshots()[-2].snapshot_id)
yesterday_ms = int((datetime.now() - timedelta(days=1)).timestamp() * 1000)
scan = table.scan(as_of_timestamp=yesterday_ms)
```

### Partitioning

```python
from pyiceberg.partitioning import PartitionSpec, PartitionField
from pyiceberg.transforms import DayTransform
from pyiceberg.types import TimestampType

partition_spec = PartitionSpec(
    PartitionField(source_id=1, field_id=1000, transform=DayTransform(), name="day")
)
table = catalog.create_table(("events", "actions"), schema=schema, partition_spec=partition_spec)
scan = table.scan(row_filter="day = '2026-01-27'")  # Prunes partitions
```

## Table Maintenance

### Compaction

```python
files = table.scan().plan_files()
avg_mb = sum(f.file_size_in_bytes for f in files) / len(files) / (1024**2)
print(f"Files: {len(files)}, Avg: {avg_mb:.1f} MB")

table.rewrite_data_files(target_file_size_bytes=128 * 1024 * 1024)
```

**When:** Avg <10MB or >1000 files. **Frequency:** High-write daily, medium weekly.

### Snapshot Expiration

```python
from datetime import datetime, timedelta

seven_days_ms = int((datetime.now() - timedelta(days=7)).timestamp() * 1000)
table.expire_snapshots(older_than=seven_days_ms, retain_last=10)
```

**Retention:** Production 7-30d, dev 1-7d, audit 90+d.

### Orphan Cleanup

```python
three_days_ms = int((datetime.now() - timedelta(days=3)).timestamp() * 1000)
table.delete_orphan_files(older_than=three_days_ms)
```

⚠️ Always expire snapshots first, use 3+ day threshold, run during low traffic.

### Full Maintenance

```python

# Compact → Expire → Cleanup (in order)
if len(table.scan().plan_files()) > 1000:
    table.rewrite_data_files(target_file_size_bytes=128 * 1024 * 1024)
seven_days_ms = int((datetime.now() - timedelta(days=7)).timestamp() * 1000)
table.expire_snapshots(older_than=seven_days_ms, retain_last=10)
three_days_ms = int((datetime.now() - timedelta(days=3)).timestamp() * 1000)
table.delete_orphan_files(older_than=three_days_ms)
```

## Metadata Inspection

```python
table = catalog.load_table(("logs", "app_logs"))
print(table.schema())
print(table.current_snapshot())
print(table.properties)
print(f"Files: {len(table.scan().plan_files())}")
```

## Error Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 401 | Unauthorized | Invalid/missing token |
| 404 | Not Found | Catalog not enabled, namespace/table missing |
| 409 | Conflict | Already exists, concurrent update |
| 422 | Validation | Invalid schema, incompatible type |

See [gotchas.md](gotchas.md) for detailed troubleshooting.
