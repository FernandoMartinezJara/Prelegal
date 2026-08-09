import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "./page";
import { sendChatMessage } from "@/lib/chat-api";
import { fetchDocumentSchema } from "@/lib/document-api";
import type { DocumentTypeDetail } from "@/lib/document-schema";
import { DEFAULT_UI_STRINGS } from "@/lib/ui-strings";

// DownloadPdfButton dynamically imports @react-pdf/renderer and lib/document-pdf;
// that pairing is already covered by DownloadPdfButton.test.tsx, so here we
// only need it mocked out to keep this an isolated test of the page's wiring
// between the chat and the preview.
vi.mock("@react-pdf/renderer", () => ({ pdf: () => ({ toBlob: () => Promise.resolve(new Blob()) }) }));
vi.mock("@/lib/document-pdf", () => ({ DocumentPdfDocument: () => null }));
vi.mock("@/lib/chat-api", () => ({ sendChatMessage: vi.fn() }));
vi.mock("@/lib/document-api", () => ({ fetchDocumentSchema: vi.fn() }));

const SCHEMA: DocumentTypeDetail = {
  slug: "mutual-nda",
  name: "Mutual Non-Disclosure Agreement",
  description: "",
  language: "en",
  uiStrings: DEFAULT_UI_STRINGS,
  translationDisclaimer: null,
  partyRoles: ["Party 1", "Party 2"],
  fields: [{ key: "purpose", label: "Purpose", kind: "multiline", required: true }],
  clauses: [{ number: "1", text: "**Intro**. {{purpose}}" }],
};

describe("Home page", () => {
  beforeEach(() => {
    vi.mocked(sendChatMessage).mockReset();
    vi.mocked(fetchDocumentSchema).mockReset();
  });

  it("shows a placeholder before a document type is resolved", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: "Prelegal Document Creator" })).toBeInTheDocument();
    expect(screen.getByLabelText("Message")).toBeInTheDocument();
    expect(screen.getByText(/Describe the agreement you need/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Download PDF" })).not.toBeInTheDocument();
  });

  it("fetches the schema and renders the preview once the chat resolves a document type", async () => {
    vi.mocked(fetchDocumentSchema).mockResolvedValue(SCHEMA);
    vi.mocked(sendChatMessage).mockResolvedValue({
      reply: "Great, let's draft a Mutual NDA.",
      documentType: "mutual-nda",
      fieldData: { purpose: "Evaluating a partnership" },
      language: "en",
    });

    render(<Home />);
    await userEvent.type(screen.getByLabelText("Message"), "I need an NDA");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(
      await screen.findByRole("heading", { name: "Mutual Non-Disclosure Agreement" })
    ).toBeInTheDocument();
    expect(fetchDocumentSchema).toHaveBeenCalledWith("mutual-nda", "en");
    expect(screen.getByRole("button", { name: "Download PDF" })).toBeInTheDocument();
    expect(screen.getAllByText(/Evaluating a partnership/).length).toBeGreaterThan(0);
  });

  it("fetches the schema in the language detected from the conversation", async () => {
    vi.mocked(fetchDocumentSchema).mockResolvedValue(SCHEMA);
    vi.mocked(sendChatMessage).mockResolvedValue({
      reply: "¡Genial, hagamos un Acuerdo de Confidencialidad Mutuo!",
      documentType: "mutual-nda",
      fieldData: {},
      language: "es",
    });

    render(<Home />);
    await userEvent.type(screen.getByLabelText("Message"), "Necesito un NDA");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    await screen.findByRole("heading", { name: "Mutual Non-Disclosure Agreement" });
    expect(fetchDocumentSchema).toHaveBeenCalledWith("mutual-nda", "es");
  });

  it("re-fetches the current document's schema if the user switches language mid-conversation", async () => {
    vi.mocked(fetchDocumentSchema).mockResolvedValue(SCHEMA);
    vi.mocked(sendChatMessage)
      .mockResolvedValueOnce({
        reply: "Great, let's draft a Mutual NDA.",
        documentType: "mutual-nda",
        fieldData: {},
        language: "en",
      })
      .mockResolvedValueOnce({
        reply: "¡Entendido, seguimos en español!",
        documentType: "mutual-nda",
        // A real backend response always echoes back every field/party key
        // (never a partial dict), which the structural merge in
        // merge-field-data.ts relies on.
        fieldData: {
          purpose: "",
          party1: { name: "", title: "", company: "", notice_address: "", date: "" },
          party2: { name: "", title: "", company: "", notice_address: "", date: "" },
        },
        language: "es",
      });

    render(<Home />);
    await userEvent.type(screen.getByLabelText("Message"), "I need an NDA");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    await screen.findByRole("heading", { name: "Mutual Non-Disclosure Agreement" });

    await userEvent.type(screen.getByLabelText("Message"), "Sigamos en español");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    await screen.findByText("¡Entendido, seguimos en español!");
    expect(fetchDocumentSchema).toHaveBeenCalledWith("mutual-nda", "en");
    expect(fetchDocumentSchema).toHaveBeenCalledWith("mutual-nda", "es");
    expect(fetchDocumentSchema).toHaveBeenCalledTimes(2);
  });

  it("keeps showing the placeholder when the assistant can't match a supported document type", async () => {
    vi.mocked(sendChatMessage).mockResolvedValue({
      reply: "We can't generate an employment contract, but a Design Partner Agreement might fit.",
      documentType: null,
      fieldData: {},
      language: "en",
    });

    render(<Home />);
    await userEvent.type(screen.getByLabelText("Message"), "I need an employment contract");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(
      await screen.findByText(/We can't generate an employment contract/)
    ).toBeInTheDocument();
    expect(fetchDocumentSchema).not.toHaveBeenCalled();
    expect(screen.getByText(/Describe the agreement you need/)).toBeInTheDocument();
  });

  it("returns to the placeholder if the assistant abandons a document type it had already resolved", async () => {
    vi.mocked(fetchDocumentSchema).mockResolvedValue(SCHEMA);
    vi.mocked(sendChatMessage)
      .mockResolvedValueOnce({
        reply: "Great, let's draft a Mutual NDA.",
        documentType: "mutual-nda",
        fieldData: {},
        language: "en",
      })
      .mockResolvedValueOnce({
        reply: "No problem, let's start over — what do you need?",
        documentType: null,
        fieldData: {},
        language: "en",
      });

    render(<Home />);
    await userEvent.type(screen.getByLabelText("Message"), "I need an NDA");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    await screen.findByRole("heading", { name: "Mutual Non-Disclosure Agreement" });

    await userEvent.type(screen.getByLabelText("Message"), "Actually, never mind");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText(/let's start over/)).toBeInTheDocument();
    expect(screen.getByText(/Describe the agreement you need/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Download PDF" })).not.toBeInTheDocument();
  });

  it("shows an error and keeps the placeholder if the schema fetch fails", async () => {
    vi.mocked(fetchDocumentSchema).mockRejectedValue(new Error("network down"));
    vi.mocked(sendChatMessage).mockResolvedValue({
      reply: "Great, let's draft a Mutual NDA.",
      documentType: "mutual-nda",
      fieldData: {},
      language: "en",
    });

    render(<Home />);
    await userEvent.type(screen.getByLabelText("Message"), "I need an NDA");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(
      await screen.findByText("Couldn't load that document type. Please try again.")
    ).toBeInTheDocument();
    expect(screen.getByText(/Describe the agreement you need/)).toBeInTheDocument();
  });

  it("reflects a direct inline edit in the live preview once a document is loaded", async () => {
    vi.mocked(fetchDocumentSchema).mockResolvedValue(SCHEMA);
    vi.mocked(sendChatMessage).mockResolvedValue({
      reply: "Great, let's draft a Mutual NDA.",
      documentType: "mutual-nda",
      fieldData: {},
      language: "en",
    });

    render(<Home />);
    await userEvent.type(screen.getByLabelText("Message"), "I need an NDA");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    await screen.findByRole("heading", { name: "Mutual Non-Disclosure Agreement" });

    const editButtons = screen.getAllByRole("button", { name: "Edit Print Name" });
    await userEvent.click(editButtons[0]);
    const nameInputs = screen.getAllByLabelText("Print Name");
    await userEvent.type(nameInputs[0], "Alice Smith");
    await userEvent.tab();

    expect(screen.getAllByText("Alice Smith").length).toBeGreaterThan(0);
  });
});
