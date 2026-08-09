from app.document_types.spec import LITERAL, DocumentTypeSpec, FieldSpec

SPEC = DocumentTypeSpec(
    slug="dpa",
    name="Data Processing Agreement",
    description=(
        "An agreement governing how a service provider processes personal data on behalf "
        "of a customer, including subprocessors, international data transfers, security "
        "incidents, and audits."
    ),
    filename="DPA.md",
    party_roles=(),  # Rides on a host agreement's Customer/Provider (as Controller/Processor).
    fields=(
        FieldSpec(
            "host_agreement_reference",
            "The agreement (and parties) this DPA attaches to",
            "multiline",
        ),
        FieldSpec("categories_of_personal_data", "Categories of Personal Data", "multiline"),
        FieldSpec("categories_of_data_subjects", "Categories of Data Subjects", "multiline", required=False),
        FieldSpec("special_category_data", "Special Category Data", "multiline", required=False),
        FieldSpec(
            "special_category_data_safeguards",
            "Special Category Data Restrictions or Safeguards",
            "multiline",
            required=False,
        ),
        FieldSpec(
            "nature_and_purpose_of_processing",
            "Nature and Purpose of Processing",
            "multiline",
            required=False,
        ),
        FieldSpec("duration_of_processing", "Duration of Processing", "text", required=False),
        FieldSpec("frequency_of_transfer", "Frequency of Transfer", "text", required=False),
        FieldSpec("governing_member_state", "Governing Member State", "text", required=False),
        FieldSpec("provider_security_contact", "Provider Security Contact", "text", required=False),
        FieldSpec("security_policy", "Security Policy", "multiline", required=False),
        FieldSpec(
            "approved_subprocessors_summary",
            "Approved Subprocessors",
            "multiline",
            required=False,
        ),
    ),
    clause_mapping={
        "Customer": LITERAL,
        "Customer’s": LITERAL,
        "Provider": LITERAL,
        "Provider’s": LITERAL,
        "Agreement": "host_agreement_reference",
        "Approved Subprocessors": "approved_subprocessors_summary",
        "Categories of Data Subjects": "categories_of_data_subjects",
        "Categories of Personal Data": "categories_of_personal_data",
        "Duration of Processing": "duration_of_processing",
        "Frequency of Transfer": "frequency_of_transfer",
        "Governing Member State": "governing_member_state",
        "Nature and Purpose of Processing": "nature_and_purpose_of_processing",
        "Provider Security Contact": "provider_security_contact",
        "Security Policy": "security_policy",
        "Special Category Data": "special_category_data",
        "Special Category Data Restrictions or Safeguards": "special_category_data_safeguards",
    },
)
