from app.document_types.spec import LITERAL, DocumentTypeSpec, FieldSpec

SPEC = DocumentTypeSpec(
    slug="pilot-agreement",
    name="Pilot Agreement",
    description=(
        "A short-term agreement letting a prospective customer test or evaluate a product "
        "before committing to a longer-term commercial agreement."
    ),
    filename="Pilot-Agreement.md",
    party_roles=("Provider", "Customer"),
    fields=(
        FieldSpec("effective_date", "Effective Date", "date"),
        FieldSpec("pilot_period", "Pilot Period", "text"),
        FieldSpec("general_cap_amount", "Liability Cap Amount", "text", required=False),
        FieldSpec("governing_law", "Governing Law", "text"),
        FieldSpec("chosen_courts", "Chosen Courts", "text"),
    ),
    clause_mapping={
        "Customer": LITERAL,
        "Customer's": LITERAL,
        "Provider": LITERAL,
        "Provider's": LITERAL,
        "Notice Address": LITERAL,
        "Effective Date": "effective_date",
        "Pilot Period": "pilot_period",
        "General Cap Amount": "general_cap_amount",
        "Governing Law": "governing_law",
        "Chosen Courts": "chosen_courts",
    },
)
