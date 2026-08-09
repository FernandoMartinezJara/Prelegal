from app.document_types.spec import DocumentTypeSpec, FieldSpec

SPEC = DocumentTypeSpec(
    slug="mutual-nda",
    name="Mutual Non-Disclosure Agreement",
    description=(
        "A mutual NDA that lets two parties disclose confidential information to each other "
        "in connection with a stated purpose while protecting that information from further "
        "disclosure or misuse."
    ),
    filename="Mutual-NDA.md",
    party_roles=("Party 1", "Party 2"),
    fields=(
        FieldSpec("purpose", "Purpose", "multiline"),
        FieldSpec("effective_date", "Effective Date", "date"),
        FieldSpec("mnda_term", "MNDA Term", "term"),
        FieldSpec("confidentiality_term", "Term of Confidentiality", "term"),
        FieldSpec("governing_law", "Governing Law", "text"),
        FieldSpec("jurisdiction", "Jurisdiction", "text"),
        FieldSpec("modifications", "MNDA Modifications", "multiline", required=False),
    ),
    clause_mapping={
        "Purpose": "purpose",
        "Effective Date": "effective_date",
        "MNDA Term": "mnda_term",
        "Term of Confidentiality": "confidentiality_term",
        "Governing Law": "governing_law",
        "Jurisdiction": "jurisdiction",
    },
)
