# Backfill histórico Firestore → BigQuery (Cloud Run Job)

La extensión **Stream Firestore → BigQuery** suele empezar a exportar **desde el momento de instalación**. Para tener histórico completo en BigQuery (para Looker Studio), ejecuta un **backfill** una sola vez.

## Qué hace el backfill

- Copia documentos existentes desde Firestore:
  - `analytics_events`
  - `metrics_hourly`
  - `metrics_daily`
- Inserta en BigQuery tablas `*_backfill` con 3 columnas:
  - `timestamp` (TIMESTAMP): momento del backfill
  - `document_id` (STRING): id del documento Firestore
  - `data` (STRING): JSON del documento (compatible con las vistas actuales)

Luego puedes crear vistas “All” que unan `*_raw_latest` (stream) + `*_backfill` (histórico).

## Cloud Run Job (recomendado)

1. Asegúrate que el **backend** (imagen Docker) incluye dependencias:
   - `google-cloud-firestore`
   - `google-cloud-bigquery`

2. Crea un **Cloud Run Job** en el proyecto `dime-ia` con:
   - **Image**: la misma imagen del backend (la revisión actual)
   - **Command**: `python`
   - **Args**: `-m`, `jobs.backfill_firestore_to_bigquery`
   - **Env vars**:
     - `BQ_DATASET=dime_analytics`
     - (opcional) `BQ_RATE_LIMIT=500`

3. Permisos IAM de la cuenta de servicio del Job:
   - Firestore: `roles/datastore.user`
   - BigQuery: `roles/bigquery.dataEditor` + `roles/bigquery.jobUser`

4. Ejecuta el Job. Al finalizar, verás tablas:
   - `dime-ia.dime_analytics.analytics_events_backfill`
   - `dime-ia.dime_analytics.metrics_hourly_backfill`
   - `dime-ia.dime_analytics.metrics_daily_backfill`

## Vistas “All” (histórico + stream)

Ejemplo para eventos:

```sql
CREATE OR REPLACE VIEW `dime-ia.dime_analytics.analytics_events_all_raw` AS
WITH u AS (
  SELECT timestamp, document_id, data FROM `dime-ia.dime_analytics.analytics_events_raw_latest`
  UNION ALL
  SELECT timestamp, document_id, data FROM `dime-ia.dime_analytics.analytics_events_backfill`
)
SELECT * EXCEPT(rn)
FROM (
  SELECT u.*, ROW_NUMBER() OVER (PARTITION BY document_id ORDER BY timestamp DESC) AS rn
  FROM u
)
WHERE rn = 1;
```

Luego apunta `AnalyticsEventsView` a `analytics_events_all_raw` (en vez de `analytics_events_raw_latest`) para que Looker vea todo el histórico.

