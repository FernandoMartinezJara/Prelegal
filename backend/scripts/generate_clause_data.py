#!/usr/bin/env python3
"""Regenerates backend/app/document_types/generated/<slug>.json from the real
templates/*.md files, using each document type's clause_mapping. Run this
whenever a template or a mapping table changes:

    cd backend && uv run python scripts/generate_clause_data.py

The output is checked into git so the exact rendered clause text is visible
and reviewable as a diff, since this is a legal-document product.
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.document_types.clause_builder import render_clauses  # noqa: E402
from app.document_types.registry import list_document_types  # noqa: E402
from app.document_types.spec import GENERATED_CLAUSES_DIR  # noqa: E402


def main() -> None:
    GENERATED_CLAUSES_DIR.mkdir(parents=True, exist_ok=True)
    for spec in list_document_types():
        markdown_text = spec.template_path.read_text()
        clauses = render_clauses(markdown_text, spec.clause_mapping, source=spec.filename)
        out_path = GENERATED_CLAUSES_DIR / f"{spec.slug}.json"
        out_path.write_text(json.dumps(clauses, indent=2, ensure_ascii=False) + "\n")
        print(f"wrote {out_path} ({len(clauses)} clauses)")


if __name__ == "__main__":
    main()
