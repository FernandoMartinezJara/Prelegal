from app.document_types.spec import LITERAL, DocumentTypeSpec, FieldSpec

SPEC = DocumentTypeSpec(
    slug="software-license-agreement",
    name="Software License Agreement",
    description=(
        "A standard agreement for licensing on-premises or installed software, covering "
        "license grants, restrictions, updates, open source components, warranties, and "
        "liability."
    ),
    filename="Software-License-Agreement.md",
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
        FieldSpec(
            "order_form_details",
            "Order Form Details (subscription period, permitted uses, license limits, "
            "payment, warranty period, etc.)",
            "multiline",
            required=False,
        ),
    ),
    clause_mapping={
        "Customer": LITERAL,
        "Customer's": LITERAL,
        "Provider": LITERAL,
        "Provider's": LITERAL,
        "Additional Warranties": "additional_warranties",
        "Chosen Courts": "chosen_courts",
        "Customer Covered Claim": "customer_covered_claims",
        "Customer Covered Claims": "customer_covered_claims",
        "Effective Date": "effective_date",
        "General Cap Amount": "general_cap_amount",
        "Governing Law": "governing_law",
        "Increased Cap Amount": "increased_cap_amount",
        "Increased Claims": "increased_claims",
        "Provider Covered Claim": "provider_covered_claims",
        "Provider Covered Claims": "provider_covered_claims",
        "Unlimited Claims": "unlimited_claims",
        "Deletion Procedure": LITERAL,
        "License Limits": LITERAL,
        "Non-Renewal Notice Date": LITERAL,
        "Order Date": LITERAL,
        "Payment Process": LITERAL,
        "Permitted Uses": LITERAL,
        "Subscription Period": LITERAL,
        "Subscription Periods": LITERAL,
        "Warranty Period": LITERAL,
    },
)
