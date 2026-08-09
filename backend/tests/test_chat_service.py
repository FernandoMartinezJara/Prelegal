from unittest.mock import MagicMock, patch

import pytest

from app.document_types.registry import get_document_type
from app.models.chat import ChatMessage
from app.services.chat_service import (
    LlmCallError,
    _classification_model,
    _turn_response_model,
    generate_chat_turn,
)


def fake_response(model_instance) -> MagicMock:
    response = MagicMock()
    response.choices[0].message.content = model_instance.model_dump_json(by_alias=True)
    return response


def completion_router(responses_by_model):
    """responses_by_model: {model_class: model_instance}. Returns a fake
    `completion(**kwargs)` that replies based on the requested response_format."""

    def _completion(**kwargs):
        response_format = kwargs["response_format"]
        return fake_response(responses_by_model[response_format])

    return _completion


HISTORY = [ChatMessage(role="user", content="I want a pilot agreement")]


def test_classification_resolves_and_chains_into_field_extraction_in_one_turn():
    classify_model = _classification_model()
    turn_model = _turn_response_model("pilot-agreement")
    spec = get_document_type("pilot-agreement")

    classification = classify_model(reply="Sounds like a Pilot Agreement.", document_type="pilot-agreement")
    turn = turn_model(
        reply="Great, what's the pilot period?",
        document_type="pilot-agreement",
        field_data=spec.fields_model(governing_law="Delaware"),
    )

    with patch(
        "app.services.chat_service.completion",
        side_effect=completion_router({classify_model: classification, turn_model: turn}),
    ) as mock_completion:
        result = generate_chat_turn(HISTORY, None, {})

    assert result.document_type == "pilot-agreement"
    assert result.field_data["governing_law"] == "Delaware"
    assert mock_completion.call_count == 2


def test_classification_returning_no_match_does_not_call_extraction():
    classify_model = _classification_model()
    classification = classify_model(
        reply="We don't support employment contracts, but a Design Partner Agreement might fit.",
        document_type=None,
    )

    with patch(
        "app.services.chat_service.completion",
        side_effect=completion_router({classify_model: classification}),
    ) as mock_completion:
        result = generate_chat_turn(HISTORY, None, {})

    assert result.document_type is None
    assert result.field_data == {}
    assert mock_completion.call_count == 1


def test_existing_document_type_skips_classification():
    turn_model = _turn_response_model("mutual-nda")
    spec = get_document_type("mutual-nda")
    turn = turn_model(
        reply="Got it.",
        document_type="mutual-nda",
        field_data=spec.fields_model(purpose="a partnership"),
    )

    with patch(
        "app.services.chat_service.completion",
        side_effect=completion_router({turn_model: turn}),
    ) as mock_completion:
        result = generate_chat_turn(HISTORY, "mutual-nda", {"purpose": ""})

    assert result.document_type == "mutual-nda"
    assert mock_completion.call_count == 1


def test_switching_document_type_mid_conversation_resolves_in_the_same_turn():
    nda_model = _turn_response_model("mutual-nda")
    csa_model = _turn_response_model("csa")
    csa_spec = get_document_type("csa")

    switch_reply = nda_model(
        reply="Sounds like you actually want a Cloud Service Agreement.",
        document_type="csa",
        field_data=get_document_type("mutual-nda").fields_model(),
    )
    csa_turn = csa_model(
        reply="Got it, what's the effective date?",
        document_type="csa",
        field_data=csa_spec.fields_model(governing_law="Delaware"),
    )

    with patch(
        "app.services.chat_service.completion",
        side_effect=completion_router({nda_model: switch_reply, csa_model: csa_turn}),
    ) as mock_completion:
        result = generate_chat_turn(HISTORY, "mutual-nda", {})

    assert result.document_type == "csa"
    assert result.field_data["governing_law"] == "Delaware"
    assert mock_completion.call_count == 2


def test_deterministic_followup_question_is_appended_when_model_forgets():
    turn_model = _turn_response_model("mutual-nda")
    spec = get_document_type("mutual-nda")
    turn = turn_model(
        reply="Great, noted.",
        document_type="mutual-nda",
        field_data=spec.fields_model(purpose="a partnership"),
    )

    with patch(
        "app.services.chat_service.completion",
        side_effect=completion_router({turn_model: turn}),
    ):
        result = generate_chat_turn(HISTORY, "mutual-nda", {})

    assert result.reply.endswith("?")


def test_language_detected_during_classification_is_propagated():
    classify_model = _classification_model()
    turn_model = _turn_response_model("pilot-agreement")
    spec = get_document_type("pilot-agreement")

    classification = classify_model(
        reply="Suena a un Contrato Piloto.", document_type="pilot-agreement", language="es"
    )
    turn = turn_model(
        reply="Genial, ¿cuál es el período piloto?",
        document_type="pilot-agreement",
        field_data=spec.fields_model(),
        language="es",
    )

    with patch(
        "app.services.chat_service.completion",
        side_effect=completion_router({classify_model: classification, turn_model: turn}),
    ):
        result = generate_chat_turn(HISTORY, None, {})

    assert result.language == "es"


def test_language_defaults_to_english_when_unspecified():
    turn_model = _turn_response_model("mutual-nda")
    spec = get_document_type("mutual-nda")
    turn = turn_model(reply="Got it.", document_type="mutual-nda", field_data=spec.fields_model())

    with patch(
        "app.services.chat_service.completion",
        side_effect=completion_router({turn_model: turn}),
    ):
        result = generate_chat_turn(HISTORY, "mutual-nda", {})

    assert result.language == "en"


def test_unknown_document_type_raises_llm_call_error():
    with pytest.raises(LlmCallError):
        generate_chat_turn(HISTORY, "not-a-real-document", {})


def test_completion_failure_raises_llm_call_error():
    with patch("app.services.chat_service.completion", side_effect=RuntimeError("network down")):
        with pytest.raises(LlmCallError):
            generate_chat_turn(HISTORY, "mutual-nda", {})
