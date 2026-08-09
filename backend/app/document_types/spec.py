import json
from dataclasses import dataclass
from functools import cached_property
from pathlib import Path
from typing import Literal

from pydantic import Field, create_model

from app.config import TEMPLATES_DIR
from app.models.common import CamelModel, PartyDetails, TermLength

FieldKind = Literal["text", "multiline", "date", "term"]

LITERAL = "literal"  # clause_mapping sentinel: "leave this span's text unchanged"

GENERATED_CLAUSES_DIR = Path(__file__).resolve().parent / "generated"


@dataclass(frozen=True)
class FieldSpec:
    key: str
    label: str
    kind: FieldKind = "text"
    required: bool = True


@dataclass(frozen=True)
class Clause:
    number: str
    text: str


@dataclass(frozen=True)
class DocumentTypeSpec:
    slug: str
    name: str
    description: str
    filename: str
    party_roles: tuple[str, ...]
    fields: tuple[FieldSpec, ...]
    clause_mapping: dict[str, str]  # span label -> FieldSpec.key, or LITERAL

    @property
    def template_path(self):
        return TEMPLATES_DIR / self.filename

    def field(self, key: str) -> FieldSpec | None:
        return next((f for f in self.fields if f.key == key), None)

    @cached_property
    def clauses(self) -> tuple[Clause, ...]:
        path = GENERATED_CLAUSES_DIR / f"{self.slug}.json"
        raw = json.loads(path.read_text())
        return tuple(Clause(**c) for c in raw)

    @cached_property
    def fields_model(self) -> type[CamelModel]:
        kwargs: dict[str, tuple] = {}
        for f in self.fields:
            if f.kind == "term":
                kwargs[f.key] = (TermLength, Field(default_factory=TermLength))
            else:
                kwargs[f.key] = (str, "")
        for index in range(len(self.party_roles)):
            kwargs[f"party{index + 1}"] = (PartyDetails, Field(default_factory=PartyDetails))
        model_name = f"{self.slug.replace('-', '_')}_fields"
        return create_model(model_name, __base__=CamelModel, **kwargs)
