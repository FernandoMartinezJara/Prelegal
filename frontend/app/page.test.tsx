import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "./page";

// DownloadPdfButton dynamically imports @react-pdf/renderer and lib/nda-pdf;
// that pairing is already covered by DownloadPdfButton.test.tsx and
// nda-pdf.test.ts, so here we only need it mocked out to keep this an
// isolated test of the page's wiring between the form and the preview.
vi.mock("@react-pdf/renderer", () => ({ pdf: () => ({ toBlob: () => Promise.resolve(new Blob()) }) }));
vi.mock("@/lib/nda-pdf", () => ({ NdaPdfDocument: () => null }));

describe("Home page", () => {
  it("renders the heading, the form, the download button, and the preview", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: "Mutual NDA Creator" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download PDF" })).toBeInTheDocument();
    expect(screen.getByLabelText("Purpose")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Mutual Non-Disclosure Agreement" })
    ).toBeInTheDocument();
  });

  it("reflects form input in the live preview", async () => {
    render(<Home />);
    const nameInputs = screen.getAllByLabelText("Print name");
    await userEvent.type(nameInputs[0], "Alice Smith");
    expect(screen.getAllByText("Alice Smith").length).toBeGreaterThan(0);
  });
});
