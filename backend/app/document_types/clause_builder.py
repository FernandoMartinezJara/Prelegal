import re

TOP_LEVEL_MARKER = re.compile(r"^(\d+)\.\s+")
NESTED_MARKER = re.compile(r"^\s*(?:\d+\.|[a-z]+\.)\s+", re.IGNORECASE)
SPAN_PATTERN = re.compile(r'<span\s+([^>]*)>(.*?)</span>', re.DOTALL)
CLASS_ATTR = re.compile(r'class="([\w-]+)"')
STRAY_TAG = re.compile(r"</?span[^>]*>")
MARKDOWN_LINK = re.compile(r"\[([^\]]*)\]\([^)]*\)")
EXTRA_WHITESPACE = re.compile(r" {2,}")


class UnmappedClauseLabelError(ValueError):
    """Raised when a `_link`-classed span's label has no entry in a
    document type's clause_mapping — a human must classify it (as a real
    field or as a literal/party-mention) before clause text can be built."""


def _normalize_label(label: str) -> str:
    return label.strip().replace("’", "'")


def _substitute_span(match: re.Match, normalized_mapping: dict[str, str], source: str) -> str:
    attrs, inner = match.group(1), match.group(2)
    class_match = CLASS_ATTR.search(attrs)
    css_class = class_match.group(1) if class_match else None

    if css_class and css_class.startswith("header_"):
        return f"**{inner}**"

    if css_class and css_class.endswith("_link"):
        label = _normalize_label(inner)
        if label not in normalized_mapping:
            raise UnmappedClauseLabelError(f"{source}: unmapped clause label {label!r}")
        target = normalized_mapping[label]
        return inner if target == "literal" else f"{{{{{target}}}}}"

    # Bare `<span id="...">inner</span>` anchor — unwrap to its inner text
    # (often empty, in which case this is a no-op removal).
    return inner


def render_clauses(markdown_text: str, clause_mapping: dict[str, str], source: str) -> list[dict]:
    """Parses the numbered top-level clauses of a templates/*.md file into a
    flat list of {number, text} dicts, substituting `{{field_key}}` tokens
    for mapped span labels and unwrapping literal/structural spans. Any
    nested sub-items (numbered, lettered, or otherwise) are flattened into
    the same clause's text as continuous prose, matching how the Mutual NDA
    template's own inline "(a)/(b)/(c)" sub-points already read."""
    normalized_mapping = {_normalize_label(k): v for k, v in clause_mapping.items()}
    lines = markdown_text.splitlines()

    clause_starts = [i for i, line in enumerate(lines) if TOP_LEVEL_MARKER.match(line)]
    clauses: list[dict] = []

    for idx, start in enumerate(clause_starts):
        end = clause_starts[idx + 1] if idx + 1 < len(clause_starts) else len(lines)
        raw_block = lines[start:end]

        # Only the clause's own top-level line and any *indented* (nested)
        # continuation lines belong to it; a later flush-left, non-blank
        # line (e.g. a trailing attribution paragraph after the last
        # clause) is outside the list structure and gets dropped.
        block_lines = [raw_block[0]]
        for line in raw_block[1:]:
            if line.strip() == "" or line != line.lstrip():
                block_lines.append(line)
            else:
                break

        number = TOP_LEVEL_MARKER.match(block_lines[0]).group(1)
        block_lines[0] = TOP_LEVEL_MARKER.sub("", block_lines[0])

        stripped = [NESTED_MARKER.sub("", line).strip() for line in block_lines]
        flattened = " ".join(line for line in stripped if line)

        substituted = SPAN_PATTERN.sub(
            lambda m: _substitute_span(m, normalized_mapping, source), flattened
        )
        delinked = MARKDOWN_LINK.sub(r"\1", substituted)
        unstrayed = STRAY_TAG.sub("", delinked)
        cleaned = EXTRA_WHITESPACE.sub(" ", unstrayed).strip()

        clauses.append({"number": number, "text": cleaned})

    return clauses
