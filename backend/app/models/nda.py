from typing import Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Base model that serializes/parses fields as camelCase on the wire,
    matching frontend/lib/nda-data.ts, while staying snake_case in Python."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


TermType = Literal["fixed", "open-ended"]


class TermLength(CamelModel):
    type: TermType = "fixed"
    years: int = 1


class PartyDetails(CamelModel):
    name: str = ""
    title: str = ""
    company: str = ""
    notice_address: str = ""
    date: str = ""


class NdaFormData(CamelModel):
    purpose: str = ""
    effective_date: str = ""
    mnda_term: TermLength = Field(default_factory=TermLength)
    confidentiality_term: TermLength = Field(default_factory=TermLength)
    governing_law: str = ""
    jurisdiction: str = ""
    modifications: str = ""
    party1: PartyDetails = Field(default_factory=PartyDetails)
    party2: PartyDetails = Field(default_factory=PartyDetails)
