"""
Esquemas para ingesta de eventos de analítica (cliente -> API -> Firestore).
"""

import json
import re
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator

_EVENT_NAME_RE = re.compile(r"^[a-zA-Z][a-zA-Z0-9_]{0,63}$")


class AnalyticsEventIn(BaseModel):
    """Un evento de uso enviado desde el frontend."""

    name: str = Field(..., min_length=1, max_length=64)
    user_id: str = Field(..., min_length=1, max_length=128)
    timestamp_ms: int = Field(..., ge=0)
    environment: Literal["qa", "prod", "dev"] = Field(
        default="prod",
        description="qa: preview; prod: producción; dev: local",
    )
    properties: dict[str, Any] = Field(default_factory=dict)

    @field_validator("name")
    @classmethod
    def validar_nombre(cls, v: str) -> str:
        if not _EVENT_NAME_RE.match(v):
            raise ValueError(
                "name debe ser alfanumerico o guion bajo, empezar con letra, max 64 caracteres"
            )
        return v

    @field_validator("properties")
    @classmethod
    def validar_properties(cls, v: dict) -> dict:
        raw = json.dumps(v, ensure_ascii=False)
        if len(raw) > 4096:
            raise ValueError("properties excede 4096 caracteres en JSON")
        return v


class AnalyticsBatchIn(BaseModel):
    """Lote de eventos (un POST puede traer varios)."""

    events: list[AnalyticsEventIn] = Field(..., min_length=1, max_length=50)


class AnalyticsBatchOut(BaseModel):
    """Respuesta de ingesta."""

    accepted: int
    persisted: int
    firestore_available: bool

