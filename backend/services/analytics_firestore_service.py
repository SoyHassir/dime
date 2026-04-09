"""
Persistencia de eventos de analítica en Firestore (GCP).
Documentos crudos + agregados por día y por hora (separados por environment) para paneles.
"""

from __future__ import annotations

import logging
import re
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any

from google.cloud import firestore

from config import settings

logger = logging.getLogger(__name__)

_client: firestore.Client | None = None
_client_init_failed = False

SAFE_KEY_RE = re.compile(r"[^a-zA-Z0-9_]")


def _safe_map_key(name: str) -> str:
    s = SAFE_KEY_RE.sub("_", name)[:64]
    return s if s else "unknown"


def _normalize_environment(value: Any) -> str:
    if value in ("qa", "prod", "dev"):
        return value
    return "prod"


def _get_db() -> firestore.Client | None:
    """Cliente Firestore lazy; None si deshabilitado o sin credenciales."""
    global _client, _client_init_failed
    if _client_init_failed:
        return None
    if not settings.analytics_firestore_enabled:
        return None
    if _client is not None:
        return _client
    try:
        pid = settings.google_cloud_project
        _client = firestore.Client(project=pid) if pid else firestore.Client()
        logger.info("[Analytics] Firestore cliente listo (proyecto=%s)", pid or "default ADC")
    except Exception as e:
        logger.warning("[Analytics] No se pudo inicializar Firestore: %s", e)
        _client_init_failed = True
        return None
    return _client


def ingest_events(events: list[dict[str, Any]]) -> tuple[int, bool, bool]:
    """
    Escribe eventos y actualiza agregados.

    Returns:
        (persistidos, firestore_configurado, commit_ok)
        - Si no hay cliente Firestore: (0, False, True)
        - Si commit falla: (0, True, False)
    """
    db = _get_db()
    if db is None:
        return 0, False, True

    if not events:
        return 0, True, True

    utc = datetime.now(timezone.utc)
    date_key = utc.strftime("%Y%m%d")
    hour_key = utc.strftime("%Y%m%d%H")

    counts_by_env: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    total_by_env: dict[str, int] = defaultdict(int)

    for ev in events:
        env = _normalize_environment(ev.get("environment"))
        total_by_env[env] += 1
        counts_by_env[env][ev["name"]] += 1

    batch = db.batch()
    col = db.collection("analytics_events")

    for ev in events:
        env = _normalize_environment(ev.get("environment"))
        ref = col.document()
        batch.set(
            ref,
            {
                "name": ev["name"],
                "user_id": ev["user_id"],
                "timestamp_ms": ev["timestamp_ms"],
                "environment": env,
                "properties": ev.get("properties") or {},
                "received_at": firestore.SERVER_TIMESTAMP,
            },
        )

    for env, name_counts in counts_by_env.items():
        n_ev = total_by_env[env]
        daily_id = f"{env}_{date_key}"
        hourly_id = f"{env}_{hour_key}"

        daily_ref = db.collection("metrics_daily").document(daily_id)
        hourly_ref = db.collection("metrics_hourly").document(hourly_id)

        upd: dict[str, Any] = {
            f"by_event.{_safe_map_key(name)}": firestore.Increment(c)
            for name, c in name_counts.items()
        }
        upd["total"] = firestore.Increment(n_ev)
        upd["updated_at"] = firestore.SERVER_TIMESTAMP
        upd["environment"] = env

        batch.set(daily_ref, upd, merge=True)
        batch.set(hourly_ref, upd, merge=True)

    try:
        batch.commit()
    except Exception:
        logger.exception("[Analytics] Error al hacer commit en Firestore")
        return 0, True, False

    return len(events), True, True

