"""
Backfill de Firestore -> BigQuery para histórico.

Objetivo: copiar documentos ya existentes de Firestore a tablas *_backfill en BigQuery
para luego unir con el stream (tablas *_raw_latest) mediante vistas.

Uso (Cloud Run Job recomendado):
  python -m jobs.backfill_firestore_to_bigquery

Variables de entorno:
  GOOGLE_CLOUD_PROJECT / FIREBASE_PROJECT_ID: proyecto GCP
  BQ_PROJECT_ID: (opcional) si BigQuery es otro proyecto
  BQ_DATASET: dataset destino (ej. dime_analytics)
  BQ_RATE_LIMIT: (opcional) docs por batch (default 500)
"""

from __future__ import annotations

import json
import os
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Iterable

from io import BytesIO

from google.cloud import bigquery, firestore


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _get_project_id() -> str:
    return (
        os.getenv("GOOGLE_CLOUD_PROJECT", "").strip()
        or os.getenv("FIREBASE_PROJECT_ID", "").strip()
        or os.getenv("GCP_PROJECT", "").strip()
    )


def _to_firestore_timestamp_object(dt: datetime) -> dict[str, Any]:
    seconds = int(dt.timestamp())
    nanos = dt.microsecond * 1000
    return {"_seconds": seconds, "_nanoseconds": nanos}


def _json_safe(value: Any) -> Any:
    # Firestore puede traer datetime; lo dejamos como objeto similar al export de extensiones.
    if isinstance(value, datetime):
        return _to_firestore_timestamp_object(value.astimezone(timezone.utc))
    if isinstance(value, dict):
        return {k: _json_safe(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_json_safe(v) for v in value]
    return value


@dataclass(frozen=True)
class CollectionSpec:
    collection: str
    table: str


COLLECTIONS: list[CollectionSpec] = [
    CollectionSpec(collection="analytics_events", table="analytics_events_backfill"),
    CollectionSpec(collection="metrics_hourly", table="metrics_hourly_backfill"),
    CollectionSpec(collection="metrics_daily", table="metrics_daily_backfill"),
]


def _ensure_table(bq: bigquery.Client, project_id: str, dataset_id: str, table_id: str) -> str:
    full_table = f"{project_id}.{dataset_id}.{table_id}"
    try:
        bq.get_table(full_table)
        return full_table
    except Exception:
        pass

    schema = [
        bigquery.SchemaField("timestamp", "TIMESTAMP", mode="REQUIRED"),
        bigquery.SchemaField("document_id", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("data", "STRING", mode="REQUIRED"),
    ]
    table = bigquery.Table(full_table, schema=schema)
    table = bq.create_table(table)
    return table.full_table_id.replace(":", ".")


def _chunks(it: list[dict[str, Any]], size: int) -> Iterable[list[dict[str, Any]]]:
    for i in range(0, len(it), size):
        yield it[i : i + size]


def _load_rows(bq: bigquery.Client, table_fqn: str, rows: list[dict[str, Any]]) -> None:
    # Usa load job (más estable que streaming inserts para grandes volúmenes).
    job_config = bigquery.LoadJobConfig(
        schema=[
            bigquery.SchemaField("timestamp", "TIMESTAMP", mode="REQUIRED"),
            bigquery.SchemaField("document_id", "STRING", mode="REQUIRED"),
            bigquery.SchemaField("data", "STRING", mode="REQUIRED"),
        ],
        write_disposition=bigquery.WriteDisposition.WRITE_APPEND,
        source_format=bigquery.SourceFormat.NEWLINE_DELIMITED_JSON,
    )
    json_lines = "\n".join(json.dumps(r, ensure_ascii=False) for r in rows)
    job = bq.load_table_from_file(
        file_obj=BytesIO(json_lines.encode("utf-8")),
        destination=table_fqn,
        job_config=job_config,
    )
    job.result()


def _doc_exists_in_bq(bq: bigquery.Client, table_fqn: str, document_id: str) -> bool:
    # Consulta puntual para dedupe. Para volúmenes enormes, se optimiza con tablas de llaves.
    query = f"SELECT 1 FROM `{table_fqn}` WHERE document_id=@doc LIMIT 1"
    job = bq.query(
        query,
        job_config=bigquery.QueryJobConfig(
            query_parameters=[bigquery.ScalarQueryParameter("doc", "STRING", document_id)]
        ),
    )
    return any(job.result())


def backfill_collection(
    fs: firestore.Client,
    bq: bigquery.Client,
    table_fqn: str,
    collection: str,
    batch_size: int,
) -> int:
    """
    Backfill de una colección entera.

    - Paginación por document id.
    - Dedupe básico: si el doc ya existe en la tabla backfill, lo salta.
    """
    total = 0
    last_snapshot: firestore.DocumentSnapshot | None = None

    while True:
        q = fs.collection(collection).order_by("__name__").limit(batch_size)
        if last_snapshot is not None:
            q = q.start_after(last_snapshot)

        docs = list(q.stream())
        if not docs:
            break

        rows: list[dict[str, Any]] = []
        ts = _now_utc().isoformat()

        for d in docs:
            doc_id = d.id
            last_snapshot = d

            # Dedupe (simple) para re-ejecuciones
            try:
                if _doc_exists_in_bq(bq, table_fqn, doc_id):
                    continue
            except Exception:
                # Si la consulta falla, igual insertamos; luego se deduplica en la vista.
                pass

            data_obj = _json_safe(d.to_dict() or {})
            rows.append(
                {
                    "timestamp": ts,
                    "document_id": doc_id,
                    "data": json.dumps(data_obj, ensure_ascii=False),
                }
            )

        if rows:
            _load_rows(bq, table_fqn, rows)
            total += len(rows)

        # Pequeña pausa para no saturar
        time.sleep(0.2)

    return total


def main() -> int:
    project_id = _get_project_id()
    if not project_id:
        print("ERROR: Falta GOOGLE_CLOUD_PROJECT o FIREBASE_PROJECT_ID", file=sys.stderr)
        return 2

    dataset_id = os.getenv("BQ_DATASET", "dime_analytics").strip()
    bq_project = os.getenv("BQ_PROJECT_ID", "").strip() or project_id
    batch_size = int(os.getenv("BQ_RATE_LIMIT", "500"))

    fs = firestore.Client(project=project_id)
    bq = bigquery.Client(project=bq_project)

    print(f"[Backfill] Firestore project={project_id} BigQuery project={bq_project} dataset={dataset_id}")

    grand_total = 0
    for spec in COLLECTIONS:
        table_fqn = _ensure_table(bq, bq_project, dataset_id, spec.table)
        print(f"[Backfill] Colección {spec.collection} -> tabla {table_fqn}")
        inserted = backfill_collection(fs, bq, table_fqn, spec.collection, batch_size=batch_size)
        print(f"[Backfill] Insertados {inserted} docs en {spec.table}")
        grand_total += inserted

    print(f"[Backfill] Total insertados: {grand_total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

