import pytest

from app.document_types.clause_builder import UnmappedClauseLabelError, render_clauses


def test_flattens_a_simple_clause_and_substitutes_a_mapped_field():
    markdown = '1. **Intro**. For the <span class="coverpage_link">Purpose</span> only.'
    clauses = render_clauses(markdown, {"Purpose": "purpose"}, source="test.md")

    assert clauses == [{"number": "1", "text": "**Intro**. For the {{purpose}} only."}]


def test_literal_mapping_unwraps_the_span_without_a_token():
    markdown = '1. <span class="coverpage_link">Customer</span> agrees.'
    clauses = render_clauses(markdown, {"Customer": "literal"}, source="test.md")

    assert clauses[0]["text"] == "Customer agrees."


def test_header_spans_become_inline_bold_text():
    markdown = (
        "1. <span class=\"header_2\" id=\"1\">Access</span>\n"
        "    1. <span class=\"header_3\" id=\"1.1\">Details.</span> Some prose."
    )
    clauses = render_clauses(markdown, {}, source="test.md")

    assert clauses[0]["text"] == "**Access** **Details.** Some prose."


def test_nested_sub_items_are_flattened_into_one_clause():
    markdown = (
        "1. Top level.\n"
        "    a. Sub point one.\n"
        "    b. Sub point two."
    )
    clauses = render_clauses(markdown, {}, source="test.md")

    assert len(clauses) == 1
    assert clauses[0]["text"] == "Top level. Sub point one. Sub point two."


def test_multi_letter_roman_numeral_markers_are_fully_stripped():
    # "ii."/"iii."/"iv."/"vi."/"vii." are multi-character and must not leak
    # into the flattened prose the way a single-letter-only marker regex would.
    markdown = (
        "1. Top level.\n"
        "    i. First.\n"
        "    ii. Second.\n"
        "    iii. Third.\n"
        "    vii. Seventh."
    )
    clauses = render_clauses(markdown, {}, source="test.md")

    assert clauses[0]["text"] == "Top level. First. Second. Third. Seventh."


def test_bare_anchor_spans_are_unwrapped():
    markdown = '1. <span id="1.1"></span>Each party represents this.'
    clauses = render_clauses(markdown, {}, source="test.md")

    assert clauses[0]["text"] == "Each party represents this."


def test_trailing_non_list_paragraph_is_excluded_from_the_last_clause():
    markdown = "1. Only clause.\n\nSome attribution [text](https://example.com) here."
    clauses = render_clauses(markdown, {}, source="test.md")

    assert len(clauses) == 1
    assert clauses[0]["text"] == "Only clause."


def test_markdown_links_become_plain_text():
    markdown = '1. See [the standard](https://example.com/std) for more.'
    clauses = render_clauses(markdown, {}, source="test.md")

    assert clauses[0]["text"] == "See the standard for more."


def test_unmapped_label_raises() -> None:
    markdown = '1. <span class="coverpage_link">Mystery Field</span>.'
    with pytest.raises(UnmappedClauseLabelError):
        render_clauses(markdown, {}, source="test.md")


def test_curly_and_straight_apostrophes_both_match_a_straight_quote_mapping():
    # Both variants must resolve against a single mapping-table entry (only
    # the lookup is normalized; the visible legal text keeps its original
    # punctuation rather than being silently rewritten).
    markdown = (
        "1. <span class=\"coverpage_link\">Customer’s</span> stuff.\n"
        "2. <span class=\"coverpage_link\">Customer's</span> stuff."
    )
    clauses = render_clauses(markdown, {"Customer's": "literal"}, source="test.md")

    assert clauses[0]["text"] == "Customer’s stuff."
    assert clauses[1]["text"] == "Customer's stuff."


def test_collapses_extra_whitespace():
    markdown = "1. Title.**  Two  spaces   here."
    clauses = render_clauses(markdown, {}, source="test.md")

    assert "  " not in clauses[0]["text"]
