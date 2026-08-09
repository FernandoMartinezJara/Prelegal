from app.document_types.spec import LITERAL, DocumentTypeSpec, FieldSpec

SPEC = DocumentTypeSpec(
    slug="ai-addendum",
    name="AI Addendum",
    description=(
        "An addendum that supplements a commercial agreement with terms specific to AI "
        "services, covering inputs, outputs, model training, intellectual property, and "
        "AI-specific disclaimers."
    ),
    filename="AI-Addendum.md",
    party_roles=(),  # Inherits parties from the host agreement it supplements.
    fields=(
        FieldSpec(
            "host_agreement_reference",
            "The agreement (and parties) this AI Addendum attaches to",
            "multiline",
        ),
        FieldSpec("training_data", "Training Data", "multiline", required=False),
        FieldSpec("training_purposes", "Training Purposes", "multiline", required=False),
        FieldSpec("training_restrictions", "Training Restrictions", "multiline", required=False),
        FieldSpec("improvement_restrictions", "Improvement Restrictions", "multiline", required=False),
    ),
    clause_mapping={
        "Customer": LITERAL,
        "Customer's": LITERAL,
        "Provider": LITERAL,
        "Provider's": LITERAL,
        "Training Data": "training_data",
        "Training Purposes": "training_purposes",
        "Training Restrictions": "training_restrictions",
        "Improvement Restrictions": "improvement_restrictions",
    },
)
