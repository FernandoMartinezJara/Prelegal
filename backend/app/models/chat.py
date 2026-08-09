from typing import Literal

from pydantic import BaseModel, Field

from app.models.common import CamelModel


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(CamelModel):
    messages: list[ChatMessage] = Field(min_length=1)
    document_type: str | None = None
    field_data: dict = Field(default_factory=dict)


class ChatTurnResult(CamelModel):
    reply: str
    document_type: str | None = None
    field_data: dict = Field(default_factory=dict)
