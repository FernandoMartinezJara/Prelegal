import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { NdaPreview } from "./NdaPreview";
import { createDefaultNdaFormData } from "@/lib/nda-data";

describe("NdaPreview", () => {
  it("renders the document title and all 11 numbered clauses", () => {
    render(<NdaPreview data={createDefaultNdaFormData()} />);
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
    render(<NdaPreview data={data} />);
    const purposeCell = screen.getByText("Purpose").closest("tr")!;
    expect(purposeCell).toHaveTextContent("—");
  });

  it("shows the filled-in values for governing law and jurisdiction", () => {
    const data = createDefaultNdaFormData();
    data.governingLaw = "Delaware";
    data.jurisdiction = "courts located in New Castle, DE";
    render(<NdaPreview data={data} />);
    expect(screen.getByText("Delaware")).toBeInTheDocument();
    expect(screen.getByText("courts located in New Castle, DE")).toBeInTheDocument();
  });

  it("only renders the MNDA modifications row when modifications are provided", () => {
    const withoutMods = createDefaultNdaFormData();
    const { rerender } = render(<NdaPreview data={withoutMods} />);
    expect(screen.queryByText("MNDA Modifications")).not.toBeInTheDocument();

    const withMods = createDefaultNdaFormData();
    withMods.modifications = "Section 5 term extended to 2 years.";
    rerender(<NdaPreview data={withMods} />);
    expect(screen.getByText("MNDA Modifications")).toBeInTheDocument();
    expect(screen.getByText("Section 5 term extended to 2 years.")).toBeInTheDocument();
  });

  it("shows each party's typed name in the signature and print-name rows", () => {
    const data = createDefaultNdaFormData();
    data.party1.name = "Alice Smith";
    data.party2.name = "Bob Jones";
    render(<NdaPreview data={data} />);
    expect(screen.getAllByText("Alice Smith")).toHaveLength(2);
    expect(screen.getAllByText("Bob Jones")).toHaveLength(2);
  });
});
