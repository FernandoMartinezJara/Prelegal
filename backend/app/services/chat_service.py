from functools import lru_cache
from typing import Literal

from litellm import completion
from pydantic import Field, create_model

from app.document_types.registry import (
    DocumentTypeNotFoundError,
    get_document_type,
    list_document_types,
)
from app.document_types.spec import DocumentTypeSpec
from app.models.chat import ChatMessage, ChatTurnResult
from app.models.common import CamelModel
from app.services.followup import ensure_followup_question, missing_required_fields

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}

MAX_TYPE_RESOLUTION_DEPTH = 3

CLASSIFY_PROMPT_TEMPLATE = """You are a legal-document drafting assistant. The user is \
describing what kind of agreement they want. Here is the catalog of document types you can \
draft:

{catalog}

Figure out which document type (by its slug) best matches what the user described. If none of \
these genuinely fit what they're asking for, leave document_type unset and use `reply` to \
explain what we can't generate, and suggest the closest catalog document type by name instead. \
If a document type is a good match, confirm it conversationally in `reply` and set \
document_type to its slug."""


class LlmCallError(RuntimeError):
    """Raised when the LLM call fails or its output can't be parsed."""


def _all_slugs() -> tuple[str, ...]:
    return tuple(spec.slug for spec in list_document_types())


def _catalog_summary() -> str:
    return "\n".join(f"- {spec.slug}: {spec.name} — {spec.description}" for spec in list_document_types())


@lru_cache
def _classification_model() -> type[CamelModel]:
    slugs = _all_slugs()
    return create_model(
        "classification_result",
        __base__=CamelModel,
        reply=(str, ...),
        document_type=(Literal[slugs] | None, None),
    )


@lru_cache
def _turn_response_model(slug: str) -> type[CamelModel]:
    spec = get_document_type(slug)
    return create_model(
        f"{slug.replace('-', '_')}_turn_response",
        __base__=CamelModel,
        reply=(str, ...),
        document_type=(Literal[_all_slugs()], slug),
        field_data=(spec.fields_model, Field(default_factory=spec.fields_model)),
    )


def _fill_prompt(spec: DocumentTypeSpec) -> str:
    field_lines = "\n".join(
        f"- {f.label} (key: {f.key}, {'required' if f.required else 'optional'})" for f in spec.fields
    )
    party_lines = (
        "\n".join(f"- {role}" for role in spec.party_roles)
        or "(this document type has no parties of its own — it supplements a separate host agreement)"
    )
    return f"""You are helping the user draft a {spec.name}. Ask short, friendly, focused \
questions about whatever is still missing or unclear. This document's fields are:

{field_lines}

Its parties (if any) are:

{party_lines}

Each party has: name, title, company, notice address, and signing date.

You will be given the current known field values as JSON below. Treat them as the current \
source of truth — they may include edits the user made directly in the document preview, \
outside of this chat. Always return every field, carrying forward any value the user's latest \
message doesn't address unchanged. Only change a field the user actually asked to change or \
newly provided. Never invent values for fields the user hasn't given you; leave unknown \
strings empty ("") rather than guessing.

Keep the reply conversational and brief (1-3 sentences). If any required field above is still \
unknown after this reply, you MUST end your reply with a specific question about one of them. \
If the user's message clearly asks for a different kind of document entirely, set \
document_type to that other document's slug instead of this one and say so in your reply; \
otherwise keep document_type set to "{spec.slug}".

Once every required field is filled in, congratulate the user and let them know they can \
review the preview and download the PDF."""


def _call_llm(system_prompt: str, history: list[ChatMessage], response_model: type[CamelModel]):
    messages = [{"role": "system", "content": system_prompt}] + [
        {"role": m.role, "content": m.content} for m in history
    ]
    try:
        response = completion(
            model=MODEL,
            messages=messages,
            response_format=response_model,
            reasoning_effort="low",
            extra_body=EXTRA_BODY,
        )
        return response_model.model_validate_json(response.choices[0].message.content)
    except Exception as exc:
        raise LlmCallError("Failed to get a structured response from the LLM") from exc


def _classify(history: list[ChatMessage]):
    prompt = CLASSIFY_PROMPT_TEMPLATE.format(catalog=_catalog_summary())
    return _call_llm(prompt, history, _classification_model())


def _fill_fields(history: list[ChatMessage], spec: DocumentTypeSpec, field_data: dict):
    # Field keys are kept snake_case end-to-end on our own wire format (matching
    # FieldSpec.key and the {{token}} placeholders in generated clause text), even
    # though the LLM's own structured-output schema uses camelCase property names
    # (CamelModel's alias) — `populate_by_name` lets validation accept either.
    current = spec.fields_model.model_validate(field_data)
    prompt = (
        f"{_fill_prompt(spec)}\n\nCurrent known field values (JSON):\n"
        f"{current.model_dump_json()}"
    )
    return _call_llm(prompt, history, _turn_response_model(spec.slug))


def _resolve_and_fill(
    history: list[ChatMessage], document_type: str, field_data: dict, depth: int
) -> ChatTurnResult:
    try:
        spec = get_document_type(document_type)
    except DocumentTypeNotFoundError:
        raise LlmCallError(f"Unknown document type: {document_type}") from None

    result = _fill_fields(history, spec, field_data)

    if result.document_type != spec.slug:
        # The user asked (or the model inferred they asked) to switch to a
        # different document type mid-conversation; resolve the new type in
        # the same turn rather than wasting a round trip, bounded so two
        # types can't ping-pong forever.
        if depth >= MAX_TYPE_RESOLUTION_DEPTH:
            return ChatTurnResult(reply=result.reply, document_type=None, field_data={})
        return _resolve_and_fill(history, result.document_type, {}, depth + 1)

    missing = missing_required_fields(spec, result.field_data)
    reply = ensure_followup_question(result.reply, missing)
    field_values = result.field_data.model_dump()
    return ChatTurnResult(reply=reply, document_type=spec.slug, field_data=field_values)


def generate_chat_turn(
    history: list[ChatMessage], document_type: str | None, field_data: dict
) -> ChatTurnResult:
    if document_type is None:
        classification = _classify(history)
        if classification.document_type is None:
            return ChatTurnResult(reply=classification.reply, document_type=None, field_data={})
        return _resolve_and_fill(history, classification.document_type, {}, depth=1)

    return _resolve_and_fill(history, document_type, field_data, depth=1)
