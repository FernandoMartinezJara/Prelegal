import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DownloadPdfButton } from "./DownloadPdfButton";
import { createDefaultNdaFormData } from "@/lib/nda-data";

let resolveToBlob: (blob: Blob) => void;
const toBlob = vi.fn(
  () =>
    new Promise<Blob>((resolve) => {
      resolveToBlob = resolve;
    })
);
const pdf = vi.fn(() => ({ toBlob }));

vi.mock("@react-pdf/renderer", () => ({ pdf: (...args: unknown[]) => pdf(...(args as [])) }));
vi.mock("@/lib/nda-pdf", () => ({ NdaPdfDocument: () => null }));

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
    render(<DownloadPdfButton data={createDefaultNdaFormData()} />);

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
    render(<DownloadPdfButton data={createDefaultNdaFormData()} />);

    await userEvent.click(screen.getByRole("button", { name: "Download PDF" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Download PDF" })).toBeEnabled()
    );
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to generate NDA PDF:",
      expect.any(Error)
    );
    expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled();
  });
});
