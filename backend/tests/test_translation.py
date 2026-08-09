from unittest.mock import MagicMock, patch

import pytest

from app.document_types.registry import get_document_type
from app.models.translation import TranslatedClause, TranslatedDocument, TranslatedField
from app.models.ui_strings import UiStrings
from app.services.chat_service import LlmCallError
from app.services.translation import _TRANSLATION_CACHE, get_translated_document


@pytest.fixture(autouse=True)
def clear_translation_cache():
    _TRANSLATION_CACHE.clear()
    yield
    _TRANSLATION_CACHE.clear()


def fake_translation_response(translated: TranslatedDocument) -> MagicMock:
    response = MagicMock()
    response.choices[0].message.content = translated.model_dump_json(by_alias=True)
    return response


def sample_translation(spec) -> TranslatedDocument:
    return TranslatedDocument(
        name="Acuerdo de Confidencialidad Mutuo",
        description="Un acuerdo mutuo...",
        party_roles=["Parte 1", "Parte 2"],
        fields=[TranslatedField(key=f.key, label=f"[{f.label}]") for f in spec.fields],
        clauses=[TranslatedClause(number=c.number, text=f"[{c.text}]") for c in spec.clauses],
        ui_strings=UiStrings(send="Enviar"),
        translation_disclaimer="Esta es una traduccion no oficial.",
    )


def test_get_translated_document_returns_parsed_result():
    spec = get_document_type("mutual-nda")
    translated = sample_translation(spec)

    with patch(
        "app.services.translation.completion", return_value=fake_translation_response(translated)
    ) as mock_completion:
        result = get_translated_document(spec, "es")

    assert result.name == "Acuerdo de Confidencialidad Mutuo"
    assert result.ui_strings.send == "Enviar"
    mock_completion.assert_called_once()


def test_get_translated_document_caches_by_slug_and_language():
    spec = get_document_type("mutual-nda")
    translated = sample_translation(spec)

    with patch(
        "app.services.translation.completion", return_value=fake_translation_response(translated)
    ) as mock_completion:
        get_translated_document(spec, "es")
        get_translated_document(spec, "es")

    mock_completion.assert_called_once()


def test_get_translated_document_does_not_share_cache_across_languages():
    spec = get_document_type("mutual-nda")
    translated = sample_translation(spec)

    with patch(
        "app.services.translation.completion", return_value=fake_translation_response(translated)
    ) as mock_completion:
        get_translated_document(spec, "es")
        get_translated_document(spec, "fr")

    assert mock_completion.call_count == 2


def test_get_translated_document_wraps_completion_failure():
    spec = get_document_type("mutual-nda")

    with patch("app.services.translation.completion", side_effect=RuntimeError("network down")):
        with pytest.raises(LlmCallError):
            get_translated_document(spec, "es")
