def test_list_documents_returns_all_eleven(client):
    response = client.get("/api/documents")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 11
    slugs = {entry["slug"] for entry in body}
    assert "mutual-nda" in slugs
    assert "csa" in slugs


def test_get_document_detail_returns_fields_and_clauses(client):
    response = client.get("/api/documents/pilot-agreement")

    assert response.status_code == 200
    body = response.json()
    assert body["slug"] == "pilot-agreement"
    assert body["partyRoles"] == ["Provider", "Customer"]
    assert any(f["key"] == "effective_date" for f in body["fields"])
    assert len(body["clauses"]) > 0


def test_get_document_detail_404s_for_unknown_slug(client):
    response = client.get("/api/documents/not-a-real-document")

    assert response.status_code == 404


def test_get_document_detail_defaults_to_english_untranslated(client):
    response = client.get("/api/documents/mutual-nda")

    body = response.json()
    assert body["language"] == "en"
    assert body["translationDisclaimer"] is None


def test_get_document_detail_translates_when_lang_is_given(client):
    from unittest.mock import MagicMock, patch

    from app.document_types.registry import get_document_type
    from app.models.translation import TranslatedClause, TranslatedDocument, TranslatedField
    from app.services.translation import _TRANSLATION_CACHE

    _TRANSLATION_CACHE.clear()
    spec = get_document_type("mutual-nda")
    translated = TranslatedDocument(
        name="Traducido",
        description="Desc",
        party_roles=["Parte 1", "Parte 2"],
        fields=[TranslatedField(key=f.key, label=f.label) for f in spec.fields],
        clauses=[TranslatedClause(number=c.number, text=c.text) for c in spec.clauses],
        translation_disclaimer="Traducción no oficial.",
    )
    response_mock = MagicMock()
    response_mock.choices[0].message.content = translated.model_dump_json(by_alias=True)

    with patch("app.services.translation.completion", return_value=response_mock):
        response = client.get("/api/documents/mutual-nda?lang=es")

    _TRANSLATION_CACHE.clear()
    body = response.json()
    assert response.status_code == 200
    assert body["language"] == "es"
    assert body["name"] == "Traducido"
    assert body["translationDisclaimer"] == "Traducción no oficial."
