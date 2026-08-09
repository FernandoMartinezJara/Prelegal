import json

from app.config import CATALOG_PATH
from app.document_types import (
    ai_addendum,
    baa,
    csa,
    design_partner_agreement,
    dpa,
    mutual_nda,
    partnership_agreement,
    pilot_agreement,
    psa,
    sla,
    software_license_agreement,
)
from app.document_types.spec import DocumentTypeSpec


class DocumentTypeNotFoundError(KeyError):
    pass


_SPECS: tuple[DocumentTypeSpec, ...] = (
    mutual_nda.SPEC,
    csa.SPEC,
    design_partner_agreement.SPEC,
    sla.SPEC,
    psa.SPEC,
    dpa.SPEC,
    software_license_agreement.SPEC,
    partnership_agreement.SPEC,
    pilot_agreement.SPEC,
    baa.SPEC,
    ai_addendum.SPEC,
)

REGISTRY: dict[str, DocumentTypeSpec] = {spec.slug: spec for spec in _SPECS}


def load_catalog() -> list[dict]:
    return json.loads(CATALOG_PATH.read_text())


def get_document_type(slug: str) -> DocumentTypeSpec:
    try:
        return REGISTRY[slug]
    except KeyError:
        raise DocumentTypeNotFoundError(slug) from None


def list_document_types() -> tuple[DocumentTypeSpec, ...]:
    return _SPECS
