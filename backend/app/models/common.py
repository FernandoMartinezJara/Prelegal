from typing import Literal

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Base model that serializes/parses fields as camelCase on the wire,
    matching the frontend's TypeScript types, while staying snake_case in Python."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


TermType = Literal["fixed", "open-ended"]


class TermLength(CamelModel):
    type: TermType = "fixed"
    # 0 means "not yet specified" for a fixed term — distinguishable from a
    # real user-provided value, which followup.missing_required_fields relies
    # on to know whether a required term field still needs to be asked about.
    years: int = 0


class PartyDetails(CamelModel):
    name: str = ""
    title: str = ""
    company: str = ""
    notice_address: str = ""
    date: str = ""
