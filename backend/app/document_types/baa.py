from app.document_types.spec import LITERAL, DocumentTypeSpec, FieldSpec

SPEC = DocumentTypeSpec(
    slug="baa",
    name="Business Associate Agreement",
    description=(
        "A HIPAA-required agreement between a covered entity and a business associate "
        "governing the use, disclosure, and protection of protected health information (PHI)."
    ),
    filename="BAA.md",
    party_roles=("Company", "Provider"),
    fields=(
        FieldSpec(
            "host_agreement_reference",
            "The underlying services agreement this BAA supports",
            "multiline",
        ),
        FieldSpec("baa_effective_date", "BAA Effective Date", "date"),
        FieldSpec("breach_notification_period", "Breach Notification Period", "text", required=False),
        FieldSpec(
            "limitations",
            "Limitations (offshoring, de-identification, aggregation of PHI)",
            "multiline",
            required=False,
        ),
    ),
    clause_mapping={
        "Company": LITERAL,
        "Company's": LITERAL,
        "Provider": LITERAL,
        "Provider's": LITERAL,
        "Agreement": "host_agreement_reference",
        "BAA Effective Date": "baa_effective_date",
        "Breach Notification Period": "breach_notification_period",
        "Limitations": "limitations",
    },
)
