from app.document_types.registry import get_document_type
from app.services.followup import ensure_followup_question, missing_required_fields


def test_missing_required_fields_reports_empty_required_fields():
    spec = get_document_type("mutual-nda")
    field_data = spec.fields_model(governing_law="Delaware")

    missing = missing_required_fields(spec, field_data)

    missing_keys = {f.key for f in missing}
    assert "purpose" in missing_keys
    assert "governing_law" not in missing_keys


def test_missing_required_fields_reports_party_names_for_documents_with_parties():
    spec = get_document_type("pilot-agreement")
    field_data = spec.fields_model()

    missing = missing_required_fields(spec, field_data)

    missing_keys = {f.key for f in missing}
    assert "party1.name" in missing_keys
    assert "party2.name" in missing_keys


def test_missing_required_fields_is_empty_when_a_document_has_no_parties():
    spec = get_document_type("ai-addendum")
    field_data = spec.fields_model(host_agreement_reference="the March CSA")

    missing = missing_required_fields(spec, field_data)

    assert missing == []


def test_missing_required_fields_reports_a_fixed_term_left_at_its_unset_default():
    spec = get_document_type("mutual-nda")
    field_data = spec.fields_model()  # mnda_term defaults to {type: "fixed", years: 0}

    missing = missing_required_fields(spec, field_data)

    assert "mnda_term" in {f.key for f in missing}


def test_missing_required_fields_does_not_flag_an_open_ended_term_as_missing():
    spec = get_document_type("mutual-nda")
    field_data = spec.fields_model(mnda_term={"type": "open-ended", "years": 0})

    missing = missing_required_fields(spec, field_data)

    assert "mnda_term" not in {f.key for f in missing}


def test_missing_required_fields_does_not_flag_a_fixed_term_with_real_years_set():
    spec = get_document_type("mutual-nda")
    field_data = spec.fields_model(mnda_term={"type": "fixed", "years": 2})

    missing = missing_required_fields(spec, field_data)

    assert "mnda_term" not in {f.key for f in missing}


def test_ensure_followup_question_appends_when_reply_lacks_a_question():
    spec = get_document_type("mutual-nda")
    missing = missing_required_fields(spec, spec.fields_model())

    reply = ensure_followup_question("Got it, thanks.", missing)

    assert reply.endswith("?")
    assert reply.startswith("Got it, thanks.")


def test_ensure_followup_question_leaves_a_reply_that_already_asks_one():
    spec = get_document_type("mutual-nda")
    missing = missing_required_fields(spec, spec.fields_model())

    reply = ensure_followup_question("What's the purpose?", missing)

    assert reply == "What's the purpose?"


def test_ensure_followup_question_is_a_no_op_when_nothing_is_missing():
    reply = ensure_followup_question("All set!", [])

    assert reply == "All set!"
