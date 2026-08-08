import { describe, expect, it } from "vitest";
import { fillNdaClauses } from "./fill-template";
import { createDefaultNdaFormData } from "./nda-data";
import { NDA_CLAUSES } from "./nda-template";

function textOf(clauses: ReturnType<typeof fillNdaClauses>, number: number) {
  const clause = clauses.find((c) => c.number === number);
  if (!clause) throw new Error(`clause ${number} not found`);
  return clause.segments.map((s) => s.text).join("");
}

describe("fillNdaClauses", () => {
  it("returns one filled clause per template clause, in order", () => {
    const clauses = fillNdaClauses(createDefaultNdaFormData());
    expect(clauses).toHaveLength(NDA_CLAUSES.length);
    expect(clauses.map((c) => c.number)).toEqual(NDA_CLAUSES.map((c) => c.number));
  });

  it("marks the clause heading bold and the rest of the paragraph as plain text", () => {
    const clauses = fillNdaClauses(createDefaultNdaFormData());
    const clause1 = clauses.find((c) => c.number === 1)!;
    expect(clause1.segments[0]).toEqual({ text: "Introduction", bold: true });
    expect(clause1.segments.slice(1).every((s) => !s.bold)).toBe(true);
  });

  it("substitutes the purpose into every clause that references it", () => {
    const data = createDefaultNdaFormData();
    data.purpose = "Evaluating a potential joint venture";
    const clauses = fillNdaClauses(data);
    expect(textOf(clauses, 1)).toContain("Evaluating a potential joint venture");
    expect(textOf(clauses, 2)).toContain("Evaluating a potential joint venture");
  });

  it("falls back to a placeholder when a required field is blank", () => {
    const clauses = fillNdaClauses(createDefaultNdaFormData());
    expect(textOf(clauses, 9)).toContain("[Governing Law not provided]");
    expect(textOf(clauses, 9)).toContain("[Jurisdiction not provided]");
  });

  it("substitutes governing law and jurisdiction into clause 9", () => {
    const data = createDefaultNdaFormData();
    data.governingLaw = "Delaware";
    data.jurisdiction = "courts located in New Castle, DE";
    const text = textOf(fillNdaClauses(data), 9);
    expect(text).toContain("State of Delaware");
    expect(text).toContain("courts located in New Castle, DE");
  });

  describe("MNDA term description", () => {
    it("describes a fixed term with the given number of years", () => {
      const data = createDefaultNdaFormData();
      data.mndaTerm = { type: "fixed", years: 3 };
      expect(textOf(fillNdaClauses(data), 5)).toContain(
        "3 year(s) from the Effective Date"
      );
    });

    it("describes an open-ended term without a year count", () => {
      const data = createDefaultNdaFormData();
      data.mndaTerm = { type: "open-ended", years: 3 };
      const text = textOf(fillNdaClauses(data), 5);
      expect(text).toContain("terminated in accordance with its terms");
      expect(text).not.toContain("3 year(s)");
    });
  });

  describe("term of confidentiality description", () => {
    it("mentions trade secrets for a fixed term", () => {
      const data = createDefaultNdaFormData();
      data.confidentialityTerm = { type: "fixed", years: 2 };
      const text = textOf(fillNdaClauses(data), 5);
      expect(text).toContain("2 year(s) from the Effective Date");
      expect(text).toContain("trade secret");
    });

    it("renders as perpetual for an open-ended term", () => {
      const data = createDefaultNdaFormData();
      data.confidentialityTerm = { type: "open-ended", years: 2 };
      expect(textOf(fillNdaClauses(data), 5)).toContain("in perpetuity");
    });
  });

  describe("free-text sanitization", () => {
    it("strips literal asterisks from user-supplied fields so they can't inject bold markers", () => {
      const data = createDefaultNdaFormData();
      data.purpose = "Evaluating a **hostile** takeover";
      data.governingLaw = "Cali**fornia";
      data.jurisdiction = "**nowhere**";

      const clauses = fillNdaClauses(data);
      const clause1 = clauses.find((c) => c.number === 1)!;
      const clause9 = clauses.find((c) => c.number === 9)!;

      // Only the real "Introduction" heading is bold; the injected "**hostile**"
      // must not have produced an extra bold segment.
      expect(clause1.segments.filter((s) => s.bold)).toEqual([
        { text: "Introduction", bold: true },
      ]);
      expect(textOf(clauses, 1)).toContain("Evaluating a hostile takeover");
      expect(textOf(clauses, 9)).toContain("California");
      expect(textOf(clauses, 9)).toContain("nowhere");
      expect(clause9.segments.filter((s) => s.bold)).toEqual([
        { text: "Governing Law and Jurisdiction", bold: true },
      ]);
    });
  });
});
