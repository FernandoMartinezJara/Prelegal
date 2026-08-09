from pydantic import Field

from app.models.common import CamelModel
from app.models.ui_strings import UiStrings


class TranslatedField(CamelModel):
    key: str
    label: str


class TranslatedClause(CamelModel):
    number: str
    text: str


class TranslatedDocument(CamelModel):
    name: str
    description: str
    party_roles: list[str]
    fields: list[TranslatedField]
    clauses: list[TranslatedClause]
    ui_strings: UiStrings = Field(default_factory=UiStrings)
    translation_disclaimer: str
