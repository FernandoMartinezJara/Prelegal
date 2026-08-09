from app.document_types.spec import DocumentTypeSpec, FieldSpec
from app.models.common import TermLength


def _is_missing(field: FieldSpec, value) -> bool:
    if field.kind == "term":
        # An explicit "open-ended" choice is a complete answer regardless of
        # years; a "fixed" term is only answered once years is a real value
        # (0 is TermLength's "not yet specified" sentinel).
        if not isinstance(value, TermLength):
            return True
        return value.type == "fixed" and value.years <= 0
    return not str(value or "").strip()


def missing_required_fields(spec: DocumentTypeSpec, field_data) -> list[FieldSpec]:
    """`field_data` is a `spec.fields_model` instance (not a dict) so that
    attribute access always uses the model's snake_case Python names,
    regardless of the camelCase wire alias."""
    missing = [
        f for f in spec.fields if f.required and _is_missing(f, getattr(field_data, f.key, None))
    ]
    for index, role in enumerate(spec.party_roles):
        party = getattr(field_data, f"party{index + 1}", None)
        name = getattr(party, "name", "") if party else ""
        if not str(name).strip():
            missing.append(FieldSpec(key=f"party{index + 1}.name", label=f"{role}'s name", kind="text"))
    return missing


def ensure_followup_question(reply: str, missing: list[FieldSpec]) -> str:
    if not missing or reply.rstrip().endswith("?"):
        return reply
    return f"{reply.rstrip()} Could you also tell me the {missing[0].label.lower()}?"
