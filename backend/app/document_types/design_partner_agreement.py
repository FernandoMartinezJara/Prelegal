from app.document_types.spec import LITERAL, DocumentTypeSpec, FieldSpec

SPEC = DocumentTypeSpec(
    slug="design-partner-agreement",
    name="Design Partner Agreement",
    description=(
        "An agreement giving an early customer or partner access to a product before "
        "general release in exchange for feedback that helps the provider develop and "
        "improve the product."
    ),
    filename="design-partner-agreement.md",
    party_roles=("Provider", "Partner"),
    fields=(
        FieldSpec("effective_date", "Effective Date", "date"),
        FieldSpec("agreement_term", "Term", "text"),
        FieldSpec("program", "Program", "multiline", required=False),
        FieldSpec("fees", "Fees", "text", required=False),
        FieldSpec("governing_law", "Governing Law", "text"),
        FieldSpec("chosen_courts", "Chosen Courts", "text"),
    ),
    clause_mapping={
        "Partner": LITERAL,
        "Partner's": LITERAL,
        "Provider": LITERAL,
        "Provider's": LITERAL,
        "Notice Address": LITERAL,
        "Effective Date": "effective_date",
        "Term": "agreement_term",
        "Program": "program",
        "Fees": "fees",
        "Governing Law": "governing_law",
        "Chosen Courts": "chosen_courts",
    },
)
