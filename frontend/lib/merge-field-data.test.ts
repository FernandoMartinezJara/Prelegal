import { describe, expect, it } from "vitest";
import { mergeAssistantUpdate } from "./merge-field-data";
import type { FieldData, PartyDetails } from "./field-data";

function baseData(): FieldData {
  return {
    purpose: "",
    governing_law: "",
    mnda_term: { type: "fixed", years: 1 },
    party1: { name: "", title: "", company: "", notice_address: "", date: "" },
  };
}

describe("mergeAssistantUpdate", () => {
  it("applies scalar fields the assistant changed", () => {
    const sent = baseData();
    const assistant = { ...sent, purpose: "Evaluating a partnership" };

    const merged = mergeAssistantUpdate(sent, sent, assistant);

    expect(merged.purpose).toBe("Evaluating a partnership");
  });

  it("preserves a field the user edited locally after the request was sent, even though the assistant echoed the stale value", () => {
    const sent = baseData();
    const current = { ...sent, governing_law: "Delaware" };
    const assistant = { ...sent, purpose: "Evaluating a partnership" };

    const merged = mergeAssistantUpdate(current, sent, assistant);

    expect(merged.governing_law).toBe("Delaware");
    expect(merged.purpose).toBe("Evaluating a partnership");
  });

  it("merges nested party and term objects field-by-field instead of replacing them wholesale", () => {
    const sent = baseData();
    const current = { ...sent, party1: { ...(sent.party1 as PartyDetails), title: "CEO" } };
    const assistant = {
      ...sent,
      party1: { ...(sent.party1 as PartyDetails), name: "Alice Smith" },
      mnda_term: { type: "fixed" as const, years: 3 },
    };

    const merged = mergeAssistantUpdate(current, sent, assistant);

    expect(merged.party1).toEqual({
      name: "Alice Smith",
      title: "CEO",
      company: "",
      notice_address: "",
      date: "",
    });
    expect(merged.mnda_term).toEqual({ type: "fixed", years: 3 });
  });

  it("works for an arbitrary document type's field shape, not just one hardcoded schema", () => {
    const sent: FieldData = { training_data: "", host_agreement_reference: "" };
    const current: FieldData = { ...sent, host_agreement_reference: "March 2026 CSA" };
    const assistant: FieldData = { ...sent, training_data: "Model fine-tuning only" };

    const merged = mergeAssistantUpdate(current, sent, assistant);

    expect(merged.host_agreement_reference).toBe("March 2026 CSA");
    expect(merged.training_data).toBe("Model fine-tuning only");
  });
});
