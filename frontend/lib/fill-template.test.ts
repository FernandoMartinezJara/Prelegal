import { describe, expect, it } from "vitest";
import { fillDocumentClauses, type FilledClause } from "./fill-template";
import type { DocumentTypeDetail } from "./document-schema";
import type { FieldData } from "./field-data";
import { DEFAULT_UI_STRINGS } from "./ui-strings";

const SCHEMA: DocumentTypeDetail = {
  slug: "test-doc",
  name: "Test Document",
  description: "",
  language: "en",
  uiStrings: DEFAULT_UI_STRINGS,
  translationDisclaimer: null,
  partyRoles: [],
  fields: [
    { key: "purpose", label: "Purpose", kind: "multiline", required: true },
    { key: "governing_law", label: "Governing Law", kind: "text", required: true },
    { key: "jurisdiction", label: "Jurisdiction", kind: "text", required: true },
    { key: "mnda_term", label: "MNDA Term", kind: "term", required: true },
  ],
  clauses: [
    { number: "1", text: "**Introduction**. For the {{purpose}} only." },
    { number: "2", text: "Also for the {{purpose}}." },
    { number: "5", text: "**Term**. Expires at the end of {{mnda_term}}." },
    {
      number: "9",
      text: "**Governing Law and Jurisdiction**. Laws of {{governing_law}}; courts in {{jurisdiction}}.",
    },
  ],
};

function defaultData(): FieldData {
  return {
    purpose: "",
    governing_law: "",
    jurisdiction: "",
    mnda_term: { type: "fixed", years: 1 },
  };
}

function textOf(clauses: FilledClause[], number: string) {
  const clause = clauses.find((c) => c.number === number);
  if (!clause) throw new Error(`clause ${number} not found`);
  return clause.segments.map((s) => s.text).join("");
}

describe("fillDocumentClauses", () => {
  it("returns one filled clause per schema clause, in order", () => {
    const clauses = fillDocumentClauses(SCHEMA, defaultData());
    expect(clauses).toHaveLength(SCHEMA.clauses.length);
    expect(clauses.map((c) => c.number)).toEqual(SCHEMA.clauses.map((c) => c.number));
  });

  it("marks the clause heading bold and the rest of the paragraph as plain text", () => {
    const clauses = fillDocumentClauses(SCHEMA, defaultData());
    const clause1 = clauses.find((c) => c.number === "1")!;
    expect(clause1.segments[0]).toEqual({ text: "Introduction", bold: true });
    expect(clause1.segments.slice(1).every((s) => !s.bold)).toBe(true);
  });

  it("substitutes a field into every clause that references it", () => {
    const data = defaultData();
    data.purpose = "Evaluating a potential joint venture";
    const clauses = fillDocumentClauses(SCHEMA, data);
    expect(textOf(clauses, "1")).toContain("Evaluating a potential joint venture");
    expect(textOf(clauses, "2")).toContain("Evaluating a potential joint venture");
  });

  it("falls back to a bracketed placeholder when a required field is blank", () => {
    const clauses = fillDocumentClauses(SCHEMA, defaultData());
    expect(textOf(clauses, "9")).toContain("[Governing Law not provided]");
    expect(textOf(clauses, "9")).toContain("[Jurisdiction not provided]");
  });

  it("substitutes governing law and jurisdiction into clause 9", () => {
    const data = defaultData();
    data.governing_law = "Delaware";
    data.jurisdiction = "courts located in New Castle, DE";
    const text = textOf(fillDocumentClauses(SCHEMA, data), "9");
    expect(text).toContain("Delaware");
    expect(text).toContain("courts located in New Castle, DE");
  });

  describe("term field description", () => {
    it("describes a fixed term with the given number of years", () => {
      const data = defaultData();
      data.mnda_term = { type: "fixed", years: 3 };
      expect(textOf(fillDocumentClauses(SCHEMA, data), "5")).toContain(
        "3 year(s) from the Effective Date"
      );
    });

    it("describes an open-ended term without a year count", () => {
      const data = defaultData();
      data.mnda_term = { type: "open-ended", years: 3 };
      const text = textOf(fillDocumentClauses(SCHEMA, data), "5");
      expect(text).toContain("Continues until terminated");
      expect(text).not.toContain("3 year(s)");
    });
  });

  describe("free-text sanitization", () => {
    it("strips literal asterisks from user-supplied fields so they can't inject bold markers", () => {
      const data = defaultData();
      data.purpose = "Evaluating a **hostile** takeover";
      data.governing_law = "Cali**fornia";
      data.jurisdiction = "**nowhere**";

      const clauses = fillDocumentClauses(SCHEMA, data);
      const clause1 = clauses.find((c) => c.number === "1")!;
      const clause9 = clauses.find((c) => c.number === "9")!;

      // Only the real "Introduction" heading is bold; the injected "**hostile**"
      // must not have produced an extra bold segment.
      expect(clause1.segments.filter((s) => s.bold)).toEqual([
        { text: "Introduction", bold: true },
      ]);
      expect(textOf(clauses, "1")).toContain("Evaluating a hostile takeover");
      expect(textOf(clauses, "9")).toContain("California");
      expect(textOf(clauses, "9")).toContain("nowhere");
      expect(clause9.segments.filter((s) => s.bold)).toEqual([
        { text: "Governing Law and Jurisdiction", bold: true },
      ]);
    });
  });
});
