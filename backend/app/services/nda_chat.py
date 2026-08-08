from litellm import completion

from app.models.chat import ChatMessage, ChatTurnResult
from app.models.nda import NdaFormData

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}

SYSTEM_PROMPT = """You are drafting a Mutual Non-Disclosure Agreement (MNDA) with the user \
through conversation. Ask short, friendly, focused questions about whatever is still \
missing or unclear: the purpose of sharing confidential information, the effective date, \
the MNDA term (a fixed number of years from the effective date, or open-ended until \
terminated), the term of confidentiality that survives after termination (a fixed number \
of years, or in perpetuity), the governing law (a US state), the jurisdiction (courts where \
disputes are heard), and each party's name, title, company, notice address, and signing \
date.

You will be given the current known field values as JSON below. Treat them as the current \
source of truth -- they may include edits the user made directly in the document preview, \
outside of this chat. Always return every field, carrying forward any value the user's \
latest message doesn't address unchanged. Only change a field the user actually asked to \
change or newly provided. Never invent values for fields the user hasn't given you; leave \
unknown strings empty ("") rather than guessing.

Keep the reply conversational and brief (1-3 sentences), and ask about at most one or two \
missing fields at a time. Once every field is filled in, congratulate the user and let them \
know they can review the preview and download the PDF."""


class LlmCallError(RuntimeError):
    """Raised when the LLM call fails or its output can't be parsed into a ChatTurnResult."""


def _build_messages(history: list[ChatMessage], current_data: NdaFormData) -> list[dict]:
    system_content = (
        f"{SYSTEM_PROMPT}\n\nCurrent known field values (JSON):\n"
        f"{current_data.model_dump_json(by_alias=True)}"
    )
    return [{"role": "system", "content": system_content}] + [
        {"role": message.role, "content": message.content} for message in history
    ]


def generate_chat_turn(history: list[ChatMessage], current_data: NdaFormData) -> ChatTurnResult:
    try:
        response = completion(
            model=MODEL,
            messages=_build_messages(history, current_data),
            response_format=ChatTurnResult,
            reasoning_effort="low",
            extra_body=EXTRA_BODY,
        )
        return ChatTurnResult.model_validate_json(response.choices[0].message.content)
    except Exception as exc:
        raise LlmCallError("Failed to get a structured response from the LLM") from exc
