import json

from app.document_types.clause_builder import render_clauses
from app.document_types.registry import get_document_type, list_document_types, load_catalog
from app.document_types.spec import GENERATED_CLAUSES_DIR


def test_registry_slugs_match_catalog_filenames():
    catalog = load_catalog()
    catalog_filenames = {entry["filename"] for entry in catalog}
    registry_filenames = {spec.filename for spec in list_document_types()}

    assert registry_filenames == catalog_filenames


def test_every_document_type_has_a_unique_slug():
    slugs = [spec.slug for spec in list_document_types()]
    assert len(slugs) == len(set(slugs))


def test_get_document_type_returns_the_matching_spec():
    spec = get_document_type("mutual-nda")
    assert spec.name == "Mutual Non-Disclosure Agreement"


def test_every_span_label_in_every_template_is_classified():
    """The clause_mapping for each document type must classify every
    `_link`-classed span label found in its real template — either as a
    real field or as `literal` — so clause text is never silently wrong."""
    for spec in list_document_types():
        markdown_text = spec.template_path.read_text()
        # Raises UnmappedClauseLabelError if any label is missing.
        render_clauses(markdown_text, spec.clause_mapping, source=spec.filename)


def test_generated_clause_json_matches_a_fresh_render():
    """Golden-file check: the checked-in generated/<slug>.json must match
    what render_clauses() produces right now from the real template + the
    mapping table. If this fails, re-run
    `uv run python scripts/generate_clause_data.py` and review the diff."""
    for spec in list_document_types():
        markdown_text = spec.template_path.read_text()
        fresh = render_clauses(markdown_text, spec.clause_mapping, source=spec.filename)
        checked_in = json.loads((GENERATED_CLAUSES_DIR / f"{spec.slug}.json").read_text())
        assert fresh == checked_in, f"{spec.slug}: generated clause data is stale"


def test_every_field_key_is_unique_within_its_document_type():
    for spec in list_document_types():
        keys = [f.key for f in spec.fields]
        assert len(keys) == len(set(keys)), f"{spec.slug} has duplicate field keys"


def test_fields_model_round_trips_default_values():
    for spec in list_document_types():
        instance = spec.fields_model()
        dumped = instance.model_dump()
        for index in range(len(spec.party_roles)):
            assert f"party{index + 1}" in dumped
