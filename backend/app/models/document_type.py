from app.document_types.spec import DocumentTypeSpec
from app.models.common import CamelModel


class FieldSchema(CamelModel):
    key: str
    label: str
    kind: str
    required: bool


class ClauseSchema(CamelModel):
    number: str
    text: str


class DocumentTypeSummary(CamelModel):
    slug: str
    name: str
    description: str


class DocumentTypeDetail(DocumentTypeSummary):
    party_roles: list[str]
    fields: list[FieldSchema]
    clauses: list[ClauseSchema]


def to_summary(spec: DocumentTypeSpec) -> DocumentTypeSummary:
    return DocumentTypeSummary(slug=spec.slug, name=spec.name, description=spec.description)


def to_detail(spec: DocumentTypeSpec) -> DocumentTypeDetail:
    return DocumentTypeDetail(
        slug=spec.slug,
        name=spec.name,
        description=spec.description,
        party_roles=list(spec.party_roles),
        fields=[
            FieldSchema(key=f.key, label=f.label, kind=f.kind, required=f.required)
            for f in spec.fields
        ],
        clauses=[ClauseSchema(number=c.number, text=c.text) for c in spec.clauses],
    )
