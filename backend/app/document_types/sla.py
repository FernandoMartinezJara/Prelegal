from app.document_types.spec import LITERAL, DocumentTypeSpec, FieldSpec

SPEC = DocumentTypeSpec(
    slug="sla",
    name="Service Level Agreement",
    description=(
        "A companion agreement to a Cloud Service Agreement that sets uptime and support "
        "response time targets and the service credits or remedies available if those "
        "targets are missed."
    ),
    filename="sla.md",
    party_roles=(),  # Rides on a host Cloud Service Agreement's Provider/Customer.
    fields=(
        FieldSpec(
            "host_agreement_reference",
            "The Cloud Service Agreement (and parties) this SLA attaches to",
            "multiline",
        ),
        FieldSpec("target_uptime", "Target Uptime", "text"),
        FieldSpec("target_response_time", "Target Response Time", "text"),
        FieldSpec("support_channel", "Support Channel", "text", required=False),
        FieldSpec("uptime_credit", "Uptime Credit", "text", required=False),
        FieldSpec("response_time_credit", "Response Time Credit", "text", required=False),
        FieldSpec("scheduled_downtime", "Scheduled Downtime", "multiline", required=False),
    ),
    clause_mapping={
        "Customer": LITERAL,
        "Customer’s": LITERAL,
        "Provider": LITERAL,
        "Provider’s": LITERAL,
        "Subscription Period": LITERAL,
        "Response Time Credit": "response_time_credit",
        "Scheduled Downtime": "scheduled_downtime",
        "Support Channel": "support_channel",
        "Target Response Time": "target_response_time",
        "Target Uptime": "target_uptime",
        "Uptime Credit": "uptime_credit",
    },
)
