from app.document_types.spec import LITERAL, DocumentTypeSpec, FieldSpec

SPEC = DocumentTypeSpec(
    slug="csa",
    name="Cloud Service Agreement",
    description=(
        "A standard agreement for selling and buying cloud software or SaaS products, "
        "covering access and use, support, payment, data privacy, warranties, liability, "
        "and confidentiality."
    ),
    filename="CSA.md",
    party_roles=("Provider", "Customer"),
    fields=(
        FieldSpec("effective_date", "Effective Date", "date"),
        FieldSpec("governing_law", "Governing Law", "text"),
        FieldSpec("chosen_courts", "Chosen Courts", "text"),
        FieldSpec("general_cap_amount", "General Cap Amount", "text", required=False),
        FieldSpec("increased_cap_amount", "Increased Cap Amount", "text", required=False),
        FieldSpec("increased_claims", "Increased Claims", "multiline", required=False),
        FieldSpec("unlimited_claims", "Unlimited Claims", "multiline", required=False),
        FieldSpec("additional_warranties", "Additional Warranties", "multiline", required=False),
        FieldSpec("provider_covered_claims", "Provider Covered Claims", "multiline", required=False),
        FieldSpec("customer_covered_claims", "Customer Covered Claims", "multiline", required=False),
        FieldSpec("dpa_reference", "DPA Reference", "text", required=False),
        FieldSpec(
            "order_form_details",
            "Order Form Details (subscription period, support, payment, use limitations, etc.)",
            "multiline",
            required=False,
        ),
    ),
    clause_mapping={
        "Customer": LITERAL,
        "Customer’s": LITERAL,
        "Provider": LITERAL,
        "Provider’s": LITERAL,
        "Effective Date": "effective_date",
        "Governing Law": "governing_law",
        "Chosen Courts": "chosen_courts",
        "General Cap Amount": "general_cap_amount",
        "Increased Cap Amount": "increased_cap_amount",
        "Increased Claims": "increased_claims",
        "Unlimited Claims": "unlimited_claims",
        "Additional Warranties": "additional_warranties",
        "Provider Covered Claim": "provider_covered_claims",
        "Provider Covered Claims": "provider_covered_claims",
        "Customer Covered Claim": "customer_covered_claims",
        "Customer Covered Claims": "customer_covered_claims",
        "DPA": "dpa_reference",
        "Non-Renewal Notice Date": LITERAL,
        "Order Date": LITERAL,
        "Payment Process": LITERAL,
        "Subscription Period": LITERAL,
        "Subscription Periods": LITERAL,
        "Technical Support": LITERAL,
        "Use Limitations": LITERAL,
    },
)
