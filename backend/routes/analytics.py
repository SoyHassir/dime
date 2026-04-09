"""
Ingesta de eventos de analítica hacia Firestore.
"""

from fastapi import APIRouter, HTTPException

from models.analytics import AnalyticsBatchIn, AnalyticsBatchOut
from services.analytics_firestore_service import ingest_events

router = APIRouter(tags=["Analytics"])


@router.post(
    "/analytics/events",
    response_model=AnalyticsBatchOut,
    summary="Ingerir lote de eventos de uso",
    description="Recibe hasta 50 eventos por petición y los persiste en Firestore (si está configurado).",
)
async def post_analytics_events(batch: AnalyticsBatchIn):
    payload = [e.model_dump() for e in batch.events]
    persisted, fs_ok, commit_ok = ingest_events(payload)

    if not commit_ok:
        raise HTTPException(
            status_code=503,
            detail="No se pudieron guardar los eventos. Reintenta más tarde.",
        )

    return AnalyticsBatchOut(
        accepted=len(batch.events),
        persisted=persisted,
        firestore_available=fs_ok,
    )

