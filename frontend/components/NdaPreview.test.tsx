import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NdaPreview } from "./NdaPreview";
import { createDefaultNdaFormData } from "@/lib/nda-data";

describe("NdaPreview", () => {
  it("renders the document title and all 11 numbered clauses", () => {
    render(<NdaPreview data={createDefaultNdaFormData()} onChange={vi.fn()} />);
    expect(
      screen.getByRole("heading", { name: "Mutual Non-Disclosure Agreement" })
    ).toBeInTheDocument();
    for (let n = 1; n <= 11; n++) {
      expect(screen.getByText(`${n}.`)).toBeInTheDocument();
    }
  });

  it("shows a dash fallback for blank fields", () => {
    const data = createDefaultNdaFormData();
    data.purpose = "";
    render(<NdaPreview data={data} onChange={vi.fn()} />);
    const purposeCell = screen.getByText("Purpose").closest("tr")!;
    expect(purposeCell).toHaveTextContent("—");
  });

  it("shows the filled-in values for governing law and jurisdiction", () => {
    const data = createDefaultNdaFormData();
    data.governingLaw = "Delaware";
    data.jurisdiction = "courts located in New Castle, DE";
    render(<NdaPreview data={data} onChange={vi.fn()} />);
    expect(screen.getByText("Delaware")).toBeInTheDocument();
    expect(screen.getByText("courts located in New Castle, DE")).toBeInTheDocument();
  });

  it("renders the MNDA term and confidentiality term as editable rows", () => {
    render(<NdaPreview data={createDefaultNdaFormData()} onChange={vi.fn()} />);
    expect(screen.getByText("MNDA Term")).toBeInTheDocument();
    expect(screen.getByText("Term of Confidentiality")).toBeInTheDocument();
    expect(screen.getByText("1 year(s) from the Effective Date")).toBeInTheDocument();
  });

  it("shows each party's typed name in the signature and print-name rows", () => {
    const data = createDefaultNdaFormData();
    data.party1.name = "Alice Smith";
    data.party2.name = "Bob Jones";
    render(<NdaPreview data={data} onChange={vi.fn()} />);
    expect(screen.getAllByText("Alice Smith")).toHaveLength(2);
    expect(screen.getAllByText("Bob Jones")).toHaveLength(2);
  });

  it("commits an edit to a text field via onChange", async () => {
    const data = createDefaultNdaFormData();
    const onChange = vi.fn();
    render(<NdaPreview data={data} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: "Edit Governing law" }));
    const input = screen.getByLabelText("Governing law");
    await userEvent.type(input, "Delaware");
    await userEvent.tab();

    expect(onChange).toHaveBeenCalled();
    const updater = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(updater(data).governingLaw).toBe("Delaware");
  });

  it("commits a term change via the inline term editor", async () => {
    const data = createDefaultNdaFormData();
    const onChange = vi.fn();
    render(<NdaPreview data={data} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: "Edit MNDA term" }));
    await userEvent.clear(screen.getByLabelText("MNDA term years"));
    await userEvent.type(screen.getByLabelText("MNDA term years"), "3");
    await userEvent.tab();

    const updater = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(updater(data).mndaTerm.years).toBe(3);
  });
});
