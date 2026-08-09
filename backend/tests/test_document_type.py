from app.document_types.registry import get_document_type
from app.models.document_type import to_detail
from app.models.translation import TranslatedClause, TranslatedDocument, TranslatedField
from app.models.ui_strings import UiStrings


def test_to_detail_without_translation_defaults_to_english():
    spec = get_document_type("mutual-nda")

    detail = to_detail(spec)

    assert detail.language == "en"
    assert detail.translation_disclaimer is None
    assert detail.ui_strings == UiStrings()
    assert detail.name == spec.name


def test_to_detail_with_translation_merges_by_key_and_number():
    spec = get_document_type("mutual-nda")
    translated = TranslatedDocument(
        name="Traducido",
        description="Desc traducida",
        party_roles=["Parte 1", "Parte 2"],
        fields=[TranslatedField(key="purpose", label="Propósito")],
        clauses=[TranslatedClause(number="1", text="Texto traducido de la cláusula 1")],
        ui_strings=UiStrings(send="Enviar"),
        translation_disclaimer="Traducción no oficial.",
    )

    detail = to_detail(spec, language="es", translated=translated)

    assert detail.language == "es"
    assert detail.name == "Traducido"
    assert detail.translation_disclaimer == "Traducción no oficial."
    assert detail.ui_strings.send == "Enviar"

    purpose_field = next(f for f in detail.fields if f.key == "purpose")
    assert purpose_field.label == "Propósito"
    # A field the translation call didn't return falls back to the English label.
    other_field = next(f for f in detail.fields if f.key != "purpose")
    original_label = next(f.label for f in spec.fields if f.key == other_field.key)
    assert other_field.label == original_label

    clause_1 = next(c for c in detail.clauses if c.number == "1")
    assert clause_1.text == "Texto traducido de la cláusula 1"
    # A clause the translation call didn't return falls back to the English text.
    clause_2 = next(c for c in detail.clauses if c.number == "2")
    original_text = next(c.text for c in spec.clauses if c.number == "2")
    assert clause_2.text == original_text

    assert detail.party_roles == ["Parte 1", "Parte 2"]


def test_to_detail_falls_back_to_english_party_roles_on_count_mismatch():
    spec = get_document_type("mutual-nda")
    translated = TranslatedDocument(
        name="Traducido",
        description="Desc",
        party_roles=["Solo una parte"],  # wrong count vs. spec.party_roles (2)
        fields=[],
        clauses=[],
        translation_disclaimer="Traducción no oficial.",
    )

    detail = to_detail(spec, language="es", translated=translated)

    assert detail.party_roles == list(spec.party_roles)
