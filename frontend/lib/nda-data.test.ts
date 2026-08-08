import { describe, expect, it } from "vitest";
import { createDefaultNdaFormData } from "./nda-data";

describe("createDefaultNdaFormData", () => {
  it("defaults purpose to the standard evaluation language", () => {
    const data = createDefaultNdaFormData();
    expect(data.purpose).toBe(
      "Evaluating whether to enter into a business relationship with the other party."
    );
  });

  it("defaults both terms to a 1-year fixed term", () => {
    const data = createDefaultNdaFormData();
    expect(data.mndaTerm).toEqual({ type: "fixed", years: 1 });
    expect(data.confidentialityTerm).toEqual({ type: "fixed", years: 1 });
  });

  it("defaults all other fields to empty strings", () => {
    const data = createDefaultNdaFormData();
    expect(data.effectiveDate).toBe("");
    expect(data.governingLaw).toBe("");
    expect(data.jurisdiction).toBe("");
    expect(data.modifications).toBe("");
    expect(data.party1).toEqual({
      name: "",
      title: "",
      company: "",
      noticeAddress: "",
      date: "",
    });
    expect(data.party2).toEqual({
      name: "",
      title: "",
      company: "",
      noticeAddress: "",
      date: "",
    });
  });

  it("gives party1 and party2 independent objects", () => {
    const data = createDefaultNdaFormData();
    data.party1.name = "Alice";
    expect(data.party2.name).toBe("");
  });

  it("returns a fresh object on every call", () => {
    const first = createDefaultNdaFormData();
    const second = createDefaultNdaFormData();
    first.purpose = "mutated";
    expect(second.purpose).not.toBe("mutated");
  });
});
