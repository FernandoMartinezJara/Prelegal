import { describe, expect, it } from "vitest";
import type { ReactElement, ReactNode } from "react";
import { DocumentPdfDocument } from "./document-pdf";
import type { DocumentTypeDetail } from "./document-schema";
import type { FieldData, PartyDetails } from "./field-data";
import { DEFAULT_UI_STRINGS } from "./ui-strings";

function collectText(node: ReactNode): string[] {
  if (node == null || typeof node === "boolean") return [];
  if (typeof node === "string" || typeof node === "number") return [String(node)];
  if (Array.isArray(node)) return node.flatMap(collectText);
  if (typeof node === "object" && "props" in (node as ReactElement)) {
    const element = node as ReactElement<{ children?: ReactNode }>;
    // Custom function components (e.g. RichPdfText) aren't pre-rendered in
    // this raw element tree — their output only exists once called.
    if (typeof element.type === "function") {
      const rendered = (element.type as (props: unknown) => ReactNode)(element.props);
      return collectText(rendered);
    }
    return collectText(element.props.children);
  }
  return [];
}

const SCHEMA: DocumentTypeDetail = {
  slug: "mutual-nda",
  name: "Mutual Non-Disclosure Agreement",
  description: "",
  language: "en",
  uiStrings: DEFAULT_UI_STRINGS,
  translationDisclaimer: null,
  partyRoles: ["Party 1", "Party 2"],
  fields: [{ key: "purpose", label: "Purpose", kind: "multiline", required: true }],
  clauses: [{ number: "1", text: "**Intro**. For the {{purpose}}." }],
};

function baseData(): FieldData {
  return {
    purpose: "",
    party1: { name: "", title: "", company: "", notice_address: "", date: "" },
    party2: { name: "", title: "", company: "", notice_address: "", date: "" },
  };
}

describe("DocumentPdfDocument", () => {
  it("renders the document title, field values, and clause text", () => {
    const data = { ...baseData(), purpose: "Evaluating a partnership" };
    const tree = DocumentPdfDocument({ schema: SCHEMA, data });
    const text = collectText(tree).join(" ");

    expect(text).toContain("Mutual Non-Disclosure Agreement");
    expect(text).toContain("Evaluating a partnership");
    expect(text).toContain("Intro");
  });

  it("renders party signature rows when the schema has parties", () => {
    const data = {
      ...baseData(),
      party1: { ...(baseData().party1 as PartyDetails), name: "Alice Smith" },
    };
    const tree = DocumentPdfDocument({ schema: SCHEMA, data });
    const text = collectText(tree).join(" ");

    expect(text).toContain("Alice Smith");
    expect(text).toContain("Party 1");
  });

  it("omits the signature table entirely when the schema has no parties", () => {
    const noPartySchema: DocumentTypeDetail = { ...SCHEMA, partyRoles: [] };
    const tree = DocumentPdfDocument({ schema: noPartySchema, data: baseData() });
    const text = collectText(tree).join(" ");

    expect(text).not.toContain("Signature");
  });
});
