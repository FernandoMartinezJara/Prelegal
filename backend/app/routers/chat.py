from fastapi import APIRouter, HTTPException

from app.models.chat import ChatRequest, ChatTurnResult
from app.services.chat_service import LlmCallError, generate_chat_turn

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat", response_model=ChatTurnResult)
def create_chat_turn(request: ChatRequest) -> ChatTurnResult:
    try:
        return generate_chat_turn(request.messages, request.document_type, request.field_data)
    except LlmCallError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
