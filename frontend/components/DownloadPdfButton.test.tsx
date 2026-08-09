import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DownloadPdfButton } from "./DownloadPdfButton";
import type { DocumentTypeDetail } from "@/lib/document-schema";
import { DEFAULT_UI_STRINGS } from "@/lib/ui-strings";

const SCHEMA: DocumentTypeDetail = {
  slug: "mutual-nda",
  name: "Mutual Non-Disclosure Agreement",
  description: "",
  language: "en",
  uiStrings: DEFAULT_UI_STRINGS,
  translationDisclaimer: null,
  partyRoles: ["Party 1", "Party 2"],
  fields: [],
  clauses: [],
};

let resolveToBlob: (blob: Blob) => void;
const toBlob = vi.fn(
  () =>
    new Promise<Blob>((resolve) => {
      resolveToBlob = resolve;
    })
);
const pdf = vi.fn(() => ({ toBlob }));

vi.mock("@react-pdf/renderer", () => ({ pdf: (...args: unknown[]) => pdf(...(args as [])) }));
vi.mock("@/lib/document-pdf", () => ({ DocumentPdfDocument: () => null }));

describe("DownloadPdfButton", () => {
  beforeEach(() => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    pdf.mockClear();
    toBlob.mockClear();
  });

  it("shows a disabled 'Generating PDF…' state while the PDF is being built, then triggers a download", async () => {
    render(<DownloadPdfButton schema={SCHEMA} data={{}} />);

    await userEvent.click(screen.getByRole("button", { name: "Download PDF" }));

    expect(await screen.findByRole("button", { name: "Generating PDF…" })).toBeDisabled();

    resolveToBlob!(new Blob(["fake-pdf-bytes"], { type: "application/pdf" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Download PDF" })).toBeEnabled()
    );

    expect(pdf).toHaveBeenCalledTimes(1);
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("re-enables the button and logs the error if PDF generation fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    toBlob.mockImplementationOnce(() => Promise.reject(new Error("boom")));
    render(<DownloadPdfButton schema={SCHEMA} data={{}} />);

    await userEvent.click(screen.getByRole("button", { name: "Download PDF" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Download PDF" })).toBeEnabled()
    );
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to generate document PDF:",
      expect.any(Error)
    );
    expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled();
  });
});
