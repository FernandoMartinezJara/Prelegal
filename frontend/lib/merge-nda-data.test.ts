import { describe, expect, it } from "vitest";
import { mergeAssistantUpdate } from "./merge-nda-data";
import { createDefaultNdaFormData } from "./nda-data";

describe("mergeAssistantUpdate", () => {
  it("applies fields the assistant changed", () => {
    const sent = createDefaultNdaFormData();
    const assistant = { ...sent, purpose: "Evaluating a partnership" };

    const merged = mergeAssistantUpdate(sent, sent, assistant);

    expect(merged.purpose).toBe("Evaluating a partnership");
  });

  it("preserves a field the user edited locally after the request was sent, even though the assistant echoed the stale value", () => {
    const sent = createDefaultNdaFormData();
    const current = { ...sent, governingLaw: "Delaware" };
    const assistant = { ...sent, purpose: "Evaluating a partnership" };

    const merged = mergeAssistantUpdate(current, sent, assistant);

    expect(merged.governingLaw).toBe("Delaware");
    expect(merged.purpose).toBe("Evaluating a partnership");
  });

  it("merges nested party and term fields independently", () => {
    const sent = createDefaultNdaFormData();
    const current = { ...sent, party1: { ...sent.party1, title: "CEO" } };
    const assistant = {
      ...sent,
      party1: { ...sent.party1, name: "Alice Smith" },
      mndaTerm: { type: "fixed" as const, years: 3 },
    };

    const merged = mergeAssistantUpdate(current, sent, assistant);

    expect(merged.party1).toEqual({ ...sent.party1, title: "CEO", name: "Alice Smith" });
    expect(merged.mndaTerm).toEqual({ type: "fixed", years: 3 });
  });
});
