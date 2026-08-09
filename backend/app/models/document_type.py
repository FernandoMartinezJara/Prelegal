from pydantic import Field

from app.document_types.spec import DocumentTypeSpec
from app.models.common import CamelModel
from app.models.ui_strings import UiStrings
from app.models.translation import TranslatedDocument


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
    language: str = "en"
    ui_strings: UiStrings = Field(default_factory=UiStrings)
    translation_disclaimer: str | None = None


def to_summary(spec: DocumentTypeSpec) -> DocumentTypeSummary:
    return DocumentTypeSummary(slug=spec.slug, name=spec.name, description=spec.description)


def to_detail(
    spec: DocumentTypeSpec, *, language: str = "en", translated: TranslatedDocument | None = None
) -> DocumentTypeDetail:
    """Builds the wire-format document detail. When `translated` (a
    `TranslatedDocument`) is given, its values are merged in by key/number
    rather than by position, so any field/clause the translation call
    happened to miss falls back to the English original instead of
    misaligning or crashing."""
    if translated is None:
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
            language="en",
        )

    label_by_key = {f.key: f.label for f in translated.fields}
    text_by_number = {c.number: c.text for c in translated.clauses}
    # Unlike fields/clauses (merged by key/number), party roles are a plain
    # ordered list with nothing to key by — if the translation call changed
    # the count, there's no way to align it safely, so fall back to English.
    party_roles = (
        translated.party_roles
        if len(translated.party_roles) == len(spec.party_roles)
        else list(spec.party_roles)
    )
    return DocumentTypeDetail(
        slug=spec.slug,
        name=translated.name or spec.name,
        description=translated.description or spec.description,
        party_roles=party_roles,
        fields=[
            FieldSchema(
                key=f.key, label=label_by_key.get(f.key, f.label), kind=f.kind, required=f.required
            )
            for f in spec.fields
        ],
        clauses=[
            ClauseSchema(number=c.number, text=text_by_number.get(c.number, c.text))
            for c in spec.clauses
        ],
        language=language,
        ui_strings=translated.ui_strings,
        translation_disclaimer=translated.translation_disclaimer,
    )
