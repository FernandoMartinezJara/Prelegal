from fastapi import APIRouter, HTTPException

from app.document_types.registry import DocumentTypeNotFoundError, get_document_type, list_document_types
from app.models.document_type import DocumentTypeDetail, DocumentTypeSummary, to_detail, to_summary
from app.services.chat_service import LlmCallError
from app.services.translation import get_translated_document

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.get("", response_model=list[DocumentTypeSummary])
def get_documents() -> list[DocumentTypeSummary]:
    return [to_summary(spec) for spec in list_document_types()]


@router.get("/{slug}", response_model=DocumentTypeDetail)
def get_document(slug: str, lang: str = "en") -> DocumentTypeDetail:
    try:
        spec = get_document_type(slug)
    except DocumentTypeNotFoundError:
        raise HTTPException(status_code=404, detail=f"Unknown document type: {slug}") from None

    if lang == "en":
        return to_detail(spec)

    try:
        translated = get_translated_document(spec, lang)
    except LlmCallError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return to_detail(spec, language=lang, translated=translated)
