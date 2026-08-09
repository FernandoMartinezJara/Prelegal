import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DocumentPreview } from "./DocumentPreview";
import type { DocumentTypeDetail } from "@/lib/document-schema";
import { createDefaultFieldData } from "@/lib/field-data";
import { DEFAULT_UI_STRINGS } from "@/lib/ui-strings";

const SCHEMA: DocumentTypeDetail = {
  slug: "mutual-nda",
  name: "Mutual Non-Disclosure Agreement",
  description: "",
  language: "en",
  uiStrings: DEFAULT_UI_STRINGS,
  translationDisclaimer: null,
  partyRoles: ["Party 1", "Party 2"],
  fields: [
    { key: "purpose", label: "Purpose", kind: "multiline", required: true },
    { key: "governing_law", label: "Governing Law", kind: "text", required: true },
    { key: "mnda_term", label: "MNDA Term", kind: "term", required: true },
    { key: "effective_date", label: "Effective Date", kind: "date", required: true },
  ],
  clauses: [
    { number: "1", text: "**Intro**. For the {{purpose}}." },
    { number: "5", text: "**Term**. Ends at {{mnda_term}}." },
  ],
};

const ADDENDUM_SCHEMA: DocumentTypeDetail = {
  slug: "ai-addendum",
  name: "AI Addendum",
  description: "",
  language: "en",
  uiStrings: DEFAULT_UI_STRINGS,
  translationDisclaimer: null,
  partyRoles: [],
  fields: [{ key: "host_agreement_reference", label: "Host Agreement", kind: "multiline", required: true }],
  clauses: [{ number: "1", text: "This addendum supplements the host agreement." }],
};

describe("DocumentPreview", () => {
  it("renders the document title and all schema clauses", () => {
    render(
      <DocumentPreview schema={SCHEMA} data={createDefaultFieldData(SCHEMA)} onChange={vi.fn()} />
    );
    expect(
      screen.getByRole("heading", { name: "Mutual Non-Disclosure Agreement" })
    ).toBeInTheDocument();
    expect(screen.getByText("1.")).toBeInTheDocument();
    expect(screen.getByText("5.")).toBeInTheDocument();
  });

  it("shows a dash fallback for blank fields", () => {
    render(
      <DocumentPreview schema={SCHEMA} data={createDefaultFieldData(SCHEMA)} onChange={vi.fn()} />
    );
    const purposeRow = screen.getByText("Purpose").closest("tr")!;
    expect(purposeRow).toHaveTextContent("—");
  });

  it("shows a placeholder for an unset term field, and a real value once one is set", () => {
    const data = createDefaultFieldData(SCHEMA);
    render(<DocumentPreview schema={SCHEMA} data={data} onChange={vi.fn()} />);
    expect(screen.getByText("[Term not yet specified]")).toBeInTheDocument();

    data.mnda_term = { type: "fixed", years: 2 };
    render(<DocumentPreview schema={SCHEMA} data={data} onChange={vi.fn()} />);
    expect(screen.getByText("2 year(s) from the Effective Date")).toBeInTheDocument();
  });

  it("commits an edit to a text field via onChange", async () => {
    const data = createDefaultFieldData(SCHEMA);
    const onChange = vi.fn();
    render(<DocumentPreview schema={SCHEMA} data={data} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: "Edit Governing Law" }));
    await userEvent.type(screen.getByLabelText("Governing Law"), "Delaware");
    await userEvent.tab();

    const updater = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(updater(data).governing_law).toBe("Delaware");
  });

  it("shows each party's typed name in the signature and print-name rows", () => {
    const data = createDefaultFieldData(SCHEMA);
    (data.party1 as { name: string }).name = "Alice Smith";
    (data.party2 as { name: string }).name = "Bob Jones";
    render(<DocumentPreview schema={SCHEMA} data={data} onChange={vi.fn()} />);

    expect(screen.getAllByText("Alice Smith")).toHaveLength(2);
    expect(screen.getAllByText("Bob Jones")).toHaveLength(2);
  });

  it("commits a party field edit via onChange", async () => {
    const data = createDefaultFieldData(SCHEMA);
    const onChange = vi.fn();
    render(<DocumentPreview schema={SCHEMA} data={data} onChange={onChange} />);

    const editButtons = screen.getAllByRole("button", { name: "Edit Print Name" });
    await userEvent.click(editButtons[0]);
    const nameInputs = screen.getAllByLabelText("Print Name");
    await userEvent.type(nameInputs[0], "Alice Smith");
    await userEvent.tab();

    const updater = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect((updater(data).party1 as { name: string }).name).toBe("Alice Smith");
  });

  it("omits the party table entirely for a document type with no parties", () => {
    render(
      <DocumentPreview
        schema={ADDENDUM_SCHEMA}
        data={createDefaultFieldData(ADDENDUM_SCHEMA)}
        onChange={vi.fn()}
      />
    );
    expect(screen.queryByText("Signature")).not.toBeInTheDocument();
    expect(screen.queryByText("Print Name")).not.toBeInTheDocument();
  });
});
