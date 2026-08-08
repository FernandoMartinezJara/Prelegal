from typing import Literal

from pydantic import BaseModel, Field

from app.models.nda import CamelModel, NdaFormData


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(CamelModel):
    messages: list[ChatMessage] = Field(min_length=1)
    nda_data: NdaFormData = Field(default_factory=NdaFormData)


class ChatTurnResult(CamelModel):
    reply: str
    nda_data: NdaFormData
