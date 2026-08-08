import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "./page";
import { sendChatMessage } from "@/lib/chat-api";
import { createDefaultNdaFormData } from "@/lib/nda-data";

// DownloadPdfButton dynamically imports @react-pdf/renderer and lib/nda-pdf;
// that pairing is already covered by DownloadPdfButton.test.tsx and
// nda-pdf.test.ts, so here we only need it mocked out to keep this an
// isolated test of the page's wiring between the chat and the preview.
vi.mock("@react-pdf/renderer", () => ({ pdf: () => ({ toBlob: () => Promise.resolve(new Blob()) }) }));
vi.mock("@/lib/nda-pdf", () => ({ NdaPdfDocument: () => null }));
vi.mock("@/lib/chat-api", () => ({ sendChatMessage: vi.fn() }));

describe("Home page", () => {
  it("renders the heading, the chat, the download button, and the preview", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: "Mutual NDA Creator" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download PDF" })).toBeInTheDocument();
    expect(screen.getByLabelText("Message")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Mutual Non-Disclosure Agreement" })
    ).toBeInTheDocument();
  });

  it("reflects a chat reply's NDA data in the live preview", async () => {
    const updated = { ...createDefaultNdaFormData(), party1: { ...createDefaultNdaFormData().party1, name: "Alice Smith" } };
    vi.mocked(sendChatMessage).mockResolvedValue({ reply: "Got it!", ndaData: updated });

    render(<Home />);
    await userEvent.type(screen.getByLabelText("Message"), "Alice Smith is party 1");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findAllByText("Alice Smith")).not.toHaveLength(0);
  });

  it("reflects a direct inline edit in the live preview", async () => {
    render(<Home />);
    const editButtons = screen.getAllByRole("button", { name: "Edit Print name" });
    await userEvent.click(editButtons[0]);
    const nameInputs = screen.getAllByLabelText("Print name");
    await userEvent.type(nameInputs[0], "Alice Smith");
    await userEvent.tab();

    expect(screen.getAllByText("Alice Smith").length).toBeGreaterThan(0);
  });
});
